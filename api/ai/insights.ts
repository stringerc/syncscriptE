import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateAuth, getAuthenticatedSupabaseUser } from '../_lib/auth';
import { callAI } from '../_lib/ai-service';
import { kvGet, kvSet } from '../phone/_helpers';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

/**
 * Unified AI insights endpoint — handles both productivity insights
 * (resource=insights) and Harmony daily briefings (resource=harmony-brief).
 * Merged to stay within Vercel Hobby plan's 12 serverless function limit.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const resource = typeof req.query.resource === 'string' ? req.query.resource : undefined;
  const cadence = typeof req.query.cadence === 'string' ? req.query.cadence : 'morning';

  // ── Phase 2B shadow projection mirror ──────────────────────────────
  if (resource === 'contract-runtime-projection') {
    if (req.method === 'GET') {
      return res.status(200).json({ projectionVersion: 0, sourceEventCursor: 0, generatedAt: new Date().toISOString(), data: {} });
    }
    if (req.method === 'PATCH') {
      return res.status(200).json({ projectionVersion: 0, sourceEventCursor: 0, generatedAt: new Date().toISOString(), data: { accepted: true } });
    }
  }

  // ── Voice Debrief (populated by 9 PM Nexus rhythm call) ──────────
  if (resource === 'voice-debrief') {
    const user = await getAuthenticatedSupabaseUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized session' });
    }
    try {
      const dateKey = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      const debriefData = await kvGet(`nexus_voice_debrief:${user.userId}:${dateKey}`);
      if (debriefData) {
        return res.status(200).json({ success: true, debrief: debriefData, found: true });
      }
      return res.status(200).json({ success: true, debrief: null, found: false });
    } catch (e) {
      console.warn('[VoiceDebrief] Fetch failed:', e);
      return res.status(200).json({ success: true, debrief: null, found: false });
    }
  }

  // ── Nexus Rhythm Status ──────────────────────────────────────────
  if (resource === 'nexus-rhythm-status') {
    const user = await getAuthenticatedSupabaseUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized session' });
    }
    try {
      const dateKey = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      const [morning, noon, debrief] = await Promise.all([
        kvGet(`nexus_rhythm_dispatched:${dateKey}:morning`),
        kvGet(`nexus_rhythm_dispatched:${dateKey}:noon`),
        kvGet(`nexus_rhythm_dispatched:${dateKey}:debrief`),
      ]);
      return res.status(200).json({
        success: true,
        date: dateKey,
        morning: morning ? { dispatched: true, at: morning.at } : { dispatched: false },
        noon: noon ? { dispatched: true, at: noon.at } : { dispatched: false },
        debrief: debrief ? { dispatched: true, at: debrief.at } : { dispatched: false },
      });
    } catch (e) {
      console.warn('[RhythmStatus] Fetch failed:', e);
      return res.status(200).json({ success: true, morning: { dispatched: false }, noon: { dispatched: false }, debrief: { dispatched: false } });
    }
  }

  // ── Harmony Daily Briefing ────────────────────────────────────────
  if (resource === 'harmony-brief') {
    return handleHarmonyBrief(req, res);
  }

  // ── Context Capture (thought bubble + debrief + email credentials) ─
  if (resource === 'context-capture') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const user = await getAuthenticatedSupabaseUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized session' });
    }
    try {
      const { type, notes, wins, reflection, tomorrow, date, emailAddress, appPassword } = req.body || {};
      // Store email credentials in KV (per-user, encrypted at rest by Supabase)
      if (type === 'email_credentials' && emailAddress) {
        const emailKey = `nexus_email_creds:${user.userId}`;
        await kvSet(emailKey, { emailAddress, appPassword, connected: true, updatedAt: new Date().toISOString() });
        return res.status(200).json({ success: true, emailConnected: true });
      }
      // Store in KV for Nexus context retrieval
      const key = `context_capture:${user.userId}:${date || new Date().toISOString().split('T')[0]}`;
      const existing = await kvGet(key).catch(() => ({})) || {};
      if (type === 'thought_bubble') {
        await kvSet(key, { ...existing, thoughtBubble: notes, updatedAt: new Date().toISOString() });
      } else if (type === 'debrief') {
        await kvSet(key, { ...existing, debrief: { wins, reflection, tomorrow }, updatedAt: new Date().toISOString() });
      }
      return res.status(200).json({ success: true });
    } catch (e) {
      console.error('[ContextCapture] Error:', e);
      return res.status(200).json({ success: true }); // Silent success — don't block user flow
    }
  }

  // ── Default: Productivity Insights (DeepSeek) ─────────────────────
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const isAuthed = await validateAuth(req, res);
  if (!isAuthed) return;

  if (!DEEPSEEK_API_KEY) {
    return res.status(500).json({ success: false, error: 'DEEPSEEK_API_KEY not configured' });
  }

  try {
    const { tasks, goals, timeRange } = req.body || {};
    const range = timeRange || 'week';

    const prompt = `Analyze the following productivity data and provide insights.

Time range: ${range}
Tasks (${(tasks || []).length}): ${JSON.stringify((tasks || []).slice(0, 20))}
Goals (${(goals || []).length}): ${JSON.stringify((goals || []).slice(0, 10))}

Provide a JSON object with:
- completion_rate: number (percentage)
- insights: string[] (3-5 key observations)
- recommendations: string[] (3 actionable suggestions)
- encouragement: string (motivational message)
- risk_areas: string[] (things to watch out for)`;

    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a productivity analytics AI. Return only valid JSON when asked for insights.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      return res.status(502).json({ success: false, error: 'Failed to generate insights' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    let insights;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      insights = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: content };
    } catch {
      insights = { raw: content };
    }

    return res.status(200).json({ success: true, data: { insights, model: data.model } });
  } catch (error: any) {
    console.error('Insights handler error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// ── Harmony Brief Handler ───────────────────────────────────────────
async function handleHarmonyBrief(req: VercelRequest, res: VercelResponse) {
  const cadence = typeof req.query.cadence === 'string' ? req.query.cadence : 'morning';
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
    const authHeaders = {
      'Authorization': `Bearer ${user.accessToken}`,
      'apikey': SUPABASE_ANON_KEY,
    };

    const [profile, stats, schedule, calResp] = await Promise.all([
      kvGet(`user_profile:${userId}`).catch(() => null),
      kvGet(`user_stats:${userId}`).catch(() => null),
      kvGet(`briefing_schedule:${userId}`).catch(() => null),
      fetch(`${SUPABASE_URL}/functions/v1/tasks`, { headers: authHeaders }).catch(() => null),
    ]);

    let calendarEvents: any[] = [];
    try {
      if (calResp && calResp.ok) {
        const data = await calResp.json();
        calendarEvents = Array.isArray(data) ? data : (Array.isArray(data.events) ? data.events : []);
      }
    } catch (e) { console.warn('[HarmonyBrief] Calendar parse failed:', e); }

    const userName = profile?.name || 'Operator';
    const streakCount = stats?.currentStreak || profile?.dailyStreak || 0;

    const sortedEvents = [...calendarEvents].sort((a: any, b: any) => {
      return new Date(a.start_iso || a.startTime || 0).getTime() - new Date(b.start_iso || b.startTime || 0).getTime();
    });

    // Conflict detection
    const conflicts: string[] = [];
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const currEnd = new Date(sortedEvents[i].end_iso || sortedEvents[i].endTime || 0).getTime();
      const nextStart = new Date(sortedEvents[i + 1].start_iso || sortedEvents[i + 1].startTime || 0).getTime();
      const gapMinutes = (nextStart - currEnd) / 60000;
      if (gapMinutes >= 0 && gapMinutes < 15) {
        conflicts.push(`${sortedEvents[i].title} → ${sortedEvents[i + 1].title} (${Math.round(gapMinutes)}min gap)`);
      }
      if (gapMinutes < 0) {
        conflicts.push(`OVERLAP: ${sortedEvents[i].title} conflicts with ${sortedEvents[i + 1].title}`);
      }
    }

    // Hour-by-hour timeline
    const hourlyTimeline: { hour: number; events: string[]; taskRecommendation: string }[] = [];
    for (let h = 6; h <= 22; h++) {
      const hourEvents = sortedEvents.filter((evt: any) => {
        const start = new Date(evt.start_iso || evt.startTime || 0);
        return start.getHours() === h;
      }).map((evt: any) => evt.title || 'Block');

      const isPeak = h >= 9 && h <= 13;
      const isValley = h >= 14 && h <= 16;
      let taskRec = '';
      if (hourEvents.length === 0) {
        if (isPeak) taskRec = 'Deep focus window — tackle your hardest task now';
        else if (isValley) taskRec = 'Energy valley — handle admin, emails, or lighter tasks';
        else if (h >= 17) taskRec = 'Wind-down — review tomorrow, close open loops';
        else taskRec = 'Buffer zone — plan or prepare for upcoming blocks';
      } else if (hourEvents.length >= 2) {
        taskRec = 'Back-to-back — protect 5 min between meetings';
      }
      hourlyTimeline.push({ hour: h, events: hourEvents, taskRecommendation: taskRec });
    }

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

    const cadenceInstruction = cadence === 'midday'
      ? "This is a MIDDAY Course Correction. The morning plan has met reality. Be reductive: what should be dropped or rescheduled? Acknowledge what's done, reprioritize what remains, and remind the user that the 2-4PM circadian valley is approaching — push heavy tasks to tomorrow, use this window for relationships and admin."
      : cadence === 'evening'
      ? "This is an EVENING Cognitive Offload. The purpose is to drain working memory so the user can sleep clean. Celebrate wins, acknowledge completed items, and help them mentally close the day. No new assignments — only closure and peace."
      : "This is a MORNING Focus Blueprint. Be reductive: identify THE ONE critical objective that makes today a win. Shield peak energy hours (9AM-1PM) from meetings. Call out the single highest-value action to capture early.";

  const prompt = `You are Harmony, the elite daily briefing engine for SyncScript.

CADENCE MODE: ${cadenceInstruction}

USER: ${userName} | Streak: ${streakCount} days

HOURLY TIMELINE:
${timelineStr}

CALENDAR (with locked milestones 🔒):
${calendarList || 'No calendar events.'}

${conflicts.length > 0 ? 'SCHEDULE CONFLICTS DETECTED:\n' + conflicts.map(c => `- ${c}`).join('\n') + '\n' : ''}
INSTRUCTIONS:
1. Structure the brief:
   - **Executive Summary** (1-2 sentences: the most important thing to know today)
   - **Schedule Radar** (key events, conflicts, locked milestones 🔒)
   - **Hour-by-Hour Flow** (energy-mapped: when to do deep work vs. admin)
   - **Priority Actions** (top 3 tasks aligned to energy windows)
2. Map hard tasks to peak energy hours (9AM-1PM), admin to valley (2-4PM)
3. Flag any back-to-back meeting clusters or conflicts explicitly
4. Be concise but commanding — this is for a decision-maker
5. Return JSON: { "text": full brief, "energyPeak": "peak window summary", "highlights": [2-3 critical items], "tasksCount": 0, "conflicts": [], "hourlyPlan": [{hour, action}] }`;

    const aiResult = await callAI([
      { role: 'system', content: 'You are an elite executive briefing system. Respond only with valid JSON.' },
      { role: 'user', content: prompt },
    ], { maxTokens: 2048, temperature: 0.3 });

    let briefData: any;
    try {
      const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
      briefData = jsonMatch ? JSON.parse(jsonMatch[0]) : { text: aiResult.content };
    } catch {
      briefData = { text: aiResult.content };
    }

    if (!briefData.text) briefData.text = aiResult.content;
    if (!briefData.energyPeak) briefData.energyPeak = '9:00 AM - 1:00 PM';
    if (!briefData.highlights) briefData.highlights = ["Review today's active items"];
    if (!briefData.conflicts) briefData.conflicts = conflicts;
    if (!briefData.hourlyPlan) briefData.hourlyPlan = hourlyTimeline.filter(s => s.events.length > 0 || s.taskRecommendation);
    briefData.tasksCount = 0;
    briefData.dataFreshness = new Date().toISOString();
    briefData.sources = { calendar: calResp?.ok ? 'live' : 'unavailable' };

    await kvSet(`harmony_brief:${userId}`, briefData);

    return res.status(200).json({ success: true, brief: briefData, cached: false });
  } catch (error: any) {
    console.error('[HarmonyBrief] Compilation failed:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
