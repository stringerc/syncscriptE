import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthenticatedSupabaseUser } from '../_lib/auth';
import { callAI } from '../_lib/ai-service';
import { kvGet, kvSet } from '../phone/_helpers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const user = await getAuthenticatedSupabaseUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Unauthorized session' });
  }

  const userId = user.userId;

  // GET: Retrieve cached briefing
  if (req.method === 'GET') {
    try {
      const cached = await kvGet(`harmony_brief:${userId}`);
      if (cached) {
        return res.status(200).json({ success: true, brief: cached, cached: true });
      }
    } catch (e) {
      console.warn('[HarmonyBrief] Cache miss:', e);
    }
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || `https://${process.env.SUPABASE_PROJECT_ID || 'kwhnrlzibgfedtxpkbgb'}.supabase.co`;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
    const SUPABASE_FN_BASE = `${SUPABASE_URL}/functions/v1/make-server-57781ad9`;
    const authHeaders = {
      'Authorization': `Bearer ${user.accessToken}`,
      'apikey': SUPABASE_ANON_KEY,
    };

    // ── Parallel Data Fetch (all sources simultaneously) ──────────────
    const [profile, stats, schedule, tasksResp, calResp, emailsResp, weather] = await Promise.all([
      kvGet(`user_profile:${userId}`).catch(() => null),
      kvGet(`user_stats:${userId}`).catch(() => null),
      kvGet(`briefing_schedule:${userId}`).catch(() => null),
      fetch(`${SUPABASE_FN_BASE}/tasks`, { headers: authHeaders }).catch(() => null),
      fetch(`${SUPABASE_FN_BASE}/calendar/local-events`, { headers: authHeaders }).catch(() => null),
      fetch(`${SUPABASE_FN_BASE}/emails/recent?limit=20`, { headers: authHeaders }).catch(() => null),
      kvGet(`weather:${userId}`).catch(() => null),
    ]);

    // ── Parse Tasks ───────────────────────────────────────────────────
    let tasks: any[] = [];
    try {
      if (tasksResp && tasksResp.ok) {
        const data = await tasksResp.json();
        tasks = Array.isArray(data) ? data : (Array.isArray(data.tasks) ? data.tasks : []);
      } else {
        const userData = await kvGet(`user_data:${userId}`).catch(() => null);
        if (userData && Array.isArray(userData.tasks)) tasks = userData.tasks;
      }
    } catch (e) { console.warn('[HarmonyBrief] Tasks parse failed:', e); }

    // ── Parse Calendar ────────────────────────────────────────────────
    let calendarEvents: any[] = [];
    try {
      if (calResp && calResp.ok) {
        const data = await calResp.json();
        calendarEvents = Array.isArray(data) ? data : (Array.isArray(data.events) ? data.events : []);
      }
    } catch (e) { console.warn('[HarmonyBrief] Calendar parse failed:', e); }

    // ── Parse Emails ──────────────────────────────────────────────────
    let recentEmails: any[] = [];
    try {
      if (emailsResp && emailsResp.ok) {
        const data = await emailsResp.json();
        recentEmails = Array.isArray(data) ? data : (Array.isArray(data.emails) ? data.emails : []);
      }
    } catch (e) { console.warn('[HarmonyBrief] Email parse failed:', e); }

    // ── Derived Intelligence ──────────────────────────────────────────
    const userName = profile?.name || 'Operator';
    const activeTasks = tasks.filter((t: any) => !t.completed && t.status !== 'completed');
    const completedToday = tasks.filter((t: any) => {
      const isDone = t.completed || t.status === 'completed';
      if (!isDone) return false;
      const doneAt = t.completedAt || t.updatedAt;
      if (!doneAt) return false;
      return doneAt.startsWith(new Date().toISOString().split('T')[0]);
    }).length;

    const streakCount = stats?.currentStreak || profile?.dailyStreak || 0;

    // ── Conflict Detection (back-to-back meetings with < 15 min buffer) ──
    const sortedEvents = [...calendarEvents].sort((a: any, b: any) => {
      const aStart = new Date(a.start_iso || a.startTime || 0).getTime();
      const bStart = new Date(b.start_iso || b.startTime || 0).getTime();
      return aStart - bStart;
    });

    const conflicts: string[] = [];
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const currEnd = new Date(sortedEvents[i].end_iso || sortedEvents[i].endTime || 0).getTime();
      const nextStart = new Date(sortedEvents[i + 1].start_iso || sortedEvents[i + 1].startTime || 0).getTime();
      const gapMinutes = (nextStart - currEnd) / 60000;
      if (gapMinutes >= 0 && gapMinutes < 15) {
        const currTitle = sortedEvents[i].title || 'Meeting';
        const nextTitle = sortedEvents[i + 1].title || 'Meeting';
        conflicts.push(`${currTitle} → ${nextTitle} (${gapMinutes}min gap)`);
      }
      // Also flag overlapping meetings
      if (gapMinutes < 0) {
        conflicts.push(`OVERLAP: ${sortedEvents[i].title || 'Meeting'} conflicts with ${sortedEvents[i + 1].title || 'Meeting'}`);
      }
    }

    // ── Hour-by-Hour Timeline ─────────────────────────────────────────
    const now = new Date();
    const currentHour = now.getHours();
    const hourlyTimeline: { hour: number; events: string[]; taskRecommendation: string }[] = [];
    for (let h = 6; h <= 22; h++) {
      const hourEvents = sortedEvents.filter((evt: any) => {
        const start = new Date(evt.start_iso || evt.startTime || 0);
        return start.getHours() === h;
      }).map((evt: any) => evt.title || 'Block');

      // Energy-based task recommendation
      const isPeak = h >= 9 && h <= 13;
      const isValley = h >= 14 && h <= 16;
      const isWindDown = h >= 17;
      let taskRec = '';
      if (hourEvents.length === 0) {
        if (isPeak) taskRec = 'Deep focus window — tackle your hardest task now';
        else if (isValley) taskRec = 'Energy valley — handle admin, emails, or lighter tasks';
        else if (isWindDown) taskRec = 'Wind-down — review tomorrow, close open loops';
        else taskRec = 'Buffer zone — plan or prepare for upcoming blocks';
      } else if (hourEvents.length >= 2) {
        taskRec = 'Back-to-back — protect 5 min between meetings';
      }

      hourlyTimeline.push({ hour: h, events: hourEvents, taskRecommendation: taskRec });
    }

    // ── Urgent Email Detection ────────────────────────────────────────
    const urgentEmails = recentEmails.filter((e: any) => {
      const subject = (e.subject || '').toLowerCase();
      const from = (e.from || '').toLowerCase();
      return subject.includes('urgent') || subject.includes('asap') || subject.includes('deadline')
        || subject.includes('🔒') || subject.includes('action required')
        || from.includes('court') || from.includes('judge') || from.includes('attorney');
    }).map((e: any) => `From: ${e.from || 'Unknown'} — ${e.subject || 'No subject'}`);

    // ── Build Prompt ──────────────────────────────────────────────────
    const calendarList = calendarEvents.map((evt: any) => {
      const start = evt.start_iso || evt.startTime;
      const title = evt.title || 'Untitled';
      const startStr = start ? new Date(start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'All Day';
      const hasLock = title.includes('🔒');
      return `- [${startStr}] ${title}${hasLock ? ' (LOCKED MILESTONE)' : ''}`;
    }).join('\n');

    const timelineStr = hourlyTimeline.map(slot => {
      const hourStr = slot.hour === 0 ? '12AM' : slot.hour <= 12 ? `${slot.hour}AM` : `${slot.hour - 12}PM`;
      const eventsStr = slot.events.length > 0 ? slot.events.join(', ') : '—';
      return `${hourStr}: ${eventsStr}${slot.taskRecommendation ? ' → ' + slot.taskRecommendation : ''}`;
    }).join('\n');

    const prompt = `You are Harmony, the elite daily briefing engine for SyncScript. Synthesize a Fortune 500 C-suite quality daily intelligence brief.

USER: ${userName} | Completed Today: ${completedToday} | Streak: ${streakCount} days

HOURLY TIMELINE:
${timelineStr}

CALENDAR (with locked milestones 🔒):
${calendarList || 'No calendar events.'}

${conflicts.length > 0 ? 'SCHEDULE CONFLICTS DETECTED:\n' + conflicts.map(c => `- ${c}`).join('\n') + '\n' : ''}
${urgentEmails.length > 0 ? 'URGENT EMAILS:\n' + urgentEmails.slice(0, 5).join('\n') + '\n' : ''}
ACTIONABLE TASKS:
${activeTasks.slice(0, 15).map((t: any) => `- [${t.priority || 'medium'}] ${t.title}${t.description ? ': ' + t.description.slice(0, 100) : ''}`).join('\n') || 'No pending tasks.'}

${weather ? `WEATHER: ${weather.condition}, ${weather.temp}°F` : ''}

INSTRUCTIONS:
1. Structure the brief:
   - **Executive Summary** (1-2 sentences: the most important thing to know today)
   - **Schedule Radar** (key events, conflicts, locked milestones 🔒)
   - **Hour-by-Hour Flow** (energy-mapped: when to do deep work vs. admin)
   - **Priority Actions** (top 3 tasks aligned to energy windows)
   - **Watch List** (urgent emails, approaching deadlines, risks)
2. Map hard tasks to peak energy hours (9AM-1PM), admin to valley (2-4PM)
3. Flag any back-to-back meeting clusters or conflicts explicitly
4. Be concise but commanding — this is for a decision-maker, not a student
5. Return JSON: { "text": full brief, "energyPeak": "peak window summary", "highlights": [2-3 critical items], "tasksCount": N, "conflicts": [conflict strings], "hourlyPlan": [{hour, action}], "revenueOpp": null }`;

    const aiResult = await callAI([
      { role: 'system', content: 'You are an elite executive briefing intelligence system. Respond only with valid JSON. Be precise, action-oriented, and never waste a word.' },
      { role: 'user', content: prompt },
    ], {
      maxTokens: 2048,
      temperature: 0.3,
    });

    let briefData: any;
    try {
      const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
      briefData = jsonMatch ? JSON.parse(jsonMatch[0]) : { text: aiResult.content };
    } catch {
      briefData = { text: aiResult.content };
    }

    // Fallback fields
    if (!briefData.text) briefData.text = aiResult.content;
    if (!briefData.energyPeak) briefData.energyPeak = '9:00 AM - 1:00 PM';
    if (!briefData.highlights) briefData.highlights = ["Review today's active items"];
    if (!briefData.conflicts) briefData.conflicts = conflicts;
    if (!briefData.hourlyPlan) briefData.hourlyPlan = hourlyTimeline.filter(s => s.events.length > 0 || s.taskRecommendation);
    briefData.tasksCount = activeTasks.length;
    briefData.dataFreshness = new Date().toISOString();
    briefData.sources = {
      tasks: tasksResp?.ok ? 'live' : 'cached',
      calendar: calResp?.ok ? 'live' : 'unavailable',
      emails: emailsResp?.ok ? 'live' : 'unavailable',
      weather: weather ? 'live' : 'unavailable',
    };

    // Cache for 15 minutes
    await kvSet(`harmony_brief:${userId}`, briefData);

    return res.status(200).json({ success: true, brief: briefData, cached: false });
  } catch (error: any) {
    console.error('[HarmonyBrief] Compilation failed:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
