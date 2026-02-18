/**
 * /api/phone/scheduled-briefing — Cron-triggered proactive briefing calls
 *
 * Runs every minute via Vercel cron. Checks KV for users with briefings
 * due NOW and initiates outbound calls with rich context.
 *
 * Auth: Vercel cron (CRON_SECRET) or internal API key
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getTwilioConfig,
  twilioCreateCall,
  twiml,
  twimlSay,
  twimlGather,
  twimlPause,
  buildBriefingContext,
  setBriefingSchedule,
} from './_helpers';
import type { BriefingSchedule } from './_helpers';

const DAY_MAP: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

function isDue(schedule: BriefingSchedule): boolean {
  if (!schedule.enabled || !schedule.phoneNumber) return false;

  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: schedule.timezone || 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  });

  const parts = formatter.formatToParts(now);
  const hour = parts.find(p => p.type === 'hour')?.value || '00';
  const minute = parts.find(p => p.type === 'minute')?.value || '00';
  const dayName = (parts.find(p => p.type === 'weekday')?.value || 'Mon').toLowerCase().slice(0, 3);

  const currentTime = `${hour}:${minute}`;
  if (currentTime !== schedule.time) return false;
  if (!schedule.days.includes(dayName)) return false;

  const today = now.toISOString().split('T')[0];
  if (schedule.lastCalledDate === today) return false;

  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || '';
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(200).json({ message: 'No Supabase config — skipping' });
  }

  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/make-server-57781ad9/kv/get-by-prefix?prefix=briefing_schedule:`, {
      headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
    });

    if (!resp.ok) {
      console.log('[Briefing Cron] No schedules found or KV unavailable');
      return res.status(200).json({ checked: 0, called: 0 });
    }

    const data = await resp.json();
    const schedules: BriefingSchedule[] = (data.values || data.results || [])
      .map((item: any) => {
        try {
          return typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
        } catch { return null; }
      })
      .filter(Boolean);

    let called = 0;

    for (const schedule of schedules) {
      if (!isDue(schedule)) continue;

      console.log(`[Briefing Cron] Calling ${schedule.userId} at ${schedule.phoneNumber}`);

      const config = getTwilioConfig();
      const voice = 'Polly.Joanna-Neural';

      const briefingContext = await buildBriefingContext(schedule.userId);
      const callType = schedule.type === 'weekly-recap' ? 'weekly-recap' : 'morning-briefing-auto';

      const greeting = schedule.type === 'weekly-recap'
        ? "Hey! It's Nexus with your weekly recap. Ready to hear how your week went?"
        : "Good morning! It's Nexus. I've got your briefing ready — here's what you need to know today.";

      const respondUrl = `${config.appUrl}/api/phone/twiml?handler=respond&voice=${encodeURIComponent(voice)}&context=${encodeURIComponent(callType)}&userId=${encodeURIComponent(schedule.userId)}&briefingCtx=${encodeURIComponent(briefingContext.slice(0, 1500))}`;

      const inlineTwiml = twiml(
        twimlSay(greeting, voice) +
        twimlGather({
          action: respondUrl,
          input: 'speech',
          speechTimeout: 'auto',
          language: 'en-US',
          innerXml: twimlPause(3),
        }) +
        twimlSay("Looks like you're busy. No worries — check the app when you get a chance. Talk soon!", voice)
      );

      const result = await twilioCreateCall({
        to: schedule.phoneNumber,
        twimlInline: inlineTwiml,
        machineDetection: 'DetectMessageEnd',
        timeout: 30,
      });

      if (result.success) {
        called++;
        const today = new Date().toISOString().split('T')[0];
        await setBriefingSchedule(schedule.userId, { lastCalledDate: today });
        console.log(`[Briefing Cron] Call initiated for ${schedule.userId}: ${result.callSid}`);
      } else {
        console.error(`[Briefing Cron] Call failed for ${schedule.userId}:`, result.error);
      }
    }

    return res.status(200).json({ checked: schedules.length, called });
  } catch (error) {
    console.error('[Briefing Cron] Error:', error);
    return res.status(200).json({ error: 'Cron error', details: String(error) });
  }
}
