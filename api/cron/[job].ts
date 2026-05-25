/**
 * Single Vercel serverless function for all /api/cron/* jobs (Hobby plan ≤12 functions).
 * Paths unchanged: /api/cron/wake-up | guest-cleanup | process-emails | phone-dispatch | tts-slo
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dispatchDueScheduledPhoneCalls } from '../phone/_helpers';
import { handleConciergePlaybookTickHttp } from '../_lib/concierge-playbook-worker';

function requireCronAuth(req: VercelRequest, res: VercelResponse): boolean {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

async function handleWakeUp(req: VercelRequest, res: VercelResponse) {
  const phoneNumber = process.env.WAKE_UP_PHONE_NUMBER;
  if (!phoneNumber) {
    console.error('[WakeUp] WAKE_UP_PHONE_NUMBER not configured');
    return res.status(500).json({ error: 'WAKE_UP_PHONE_NUMBER not set' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  const appUrl = process.env.APP_URL || `https://${process.env.VERCEL_URL || 'syncscript.app'}`;

  if (!accountSid || !authToken || !fromNumber) {
    console.error('[WakeUp] Twilio credentials not configured');
    return res.status(500).json({ error: 'Twilio credentials not configured' });
  }

  const voiceId = 'Polly.Joanna-Neural';
  const now = new Date();
  const hour = now.getUTCHours();
  const localHour = hour - 5;

  const greeting =
    localHour < 12
      ? "Good morning! Rise and shine! I'm your SyncScript AI with your morning wake-up call. Ready to hear about your day?"
      : "Hey there! This is your SyncScript AI wake-up call. Let me help you get going!";

  const respondUrl = `${appUrl}/api/phone/twiml?handler=respond&voice=${encodeURIComponent(voiceId)}`;

  const escapeXml = (text: string) =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const inlineTwiml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Response>',
    `<Say voice="${voiceId}">${escapeXml(greeting)}</Say>`,
    `<Gather input="speech" action="${escapeXml(respondUrl)}" speechTimeout="auto" language="en-US" method="POST">`,
    '<Pause length="3"/>',
    '</Gather>',
    `<Say voice="${voiceId}">No worries if you&apos;re not up yet! I&apos;ll try again in a bit. Have a great day!</Say>`,
    '</Response>',
  ].join('');

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const body = new URLSearchParams({
    To: phoneNumber,
    From: fromNumber,
    Twiml: inlineTwiml,
    MachineDetection: 'DetectMessageEnd',
    Timeout: '30',
  });

  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[WakeUp] Twilio error:', data);
      return res.status(502).json({
        error: 'Failed to initiate wake-up call',
        detail: data.message || `Twilio HTTP ${response.status}`,
      });
    }

    console.log(`[WakeUp] Call initiated: SID=${data.sid} To=${phoneNumber}`);
    return res.status(200).json({
      success: true,
      callSid: data.sid,
      phoneNumber,
      triggeredAt: now.toISOString(),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'unknown error';
    console.error('[WakeUp] Exception:', error);
    return res.status(500).json({ error: msg });
  }
}

async function handleGuestCleanup(req: VercelRequest, res: VercelResponse) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    console.error('[GuestCleanup] SUPABASE_URL not configured');
    return res.status(500).json({ error: 'SUPABASE_URL not set' });
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/make-server-57781ad9/auth/guest/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[GuestCleanup] Cleanup failed:', data);
      return res.status(502).json({ error: 'Cleanup request failed', detail: data });
    }

    console.log('[GuestCleanup] Success:', data);
    return res.status(200).json({ success: true, ...data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'unknown error';
    console.error('[GuestCleanup] Exception:', error);
    return res.status(500).json({ error: msg });
  }
}

async function handleProcessEmails(req: VercelRequest, res: VercelResponse) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[EmailCron] Supabase credentials not configured');
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/make-server-57781ad9/growth/emails/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    const data = await response.json();

    console.log(`[EmailCron] Processed: ${data.processed || 0} emails`);

    let proposalTick: Record<string, unknown> | null = null;
    const secret = process.env.NEXUS_PHONE_EDGE_SECRET;
    if (secret) {
      try {
        const pr = await fetch(`${supabaseUrl}/functions/v1/make-server-57781ad9/internal/email-proposal-tick`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-nexus-internal-secret': secret,
            Authorization: `Bearer ${supabaseKey}`,
          },
        });
        proposalTick = (await pr.json().catch(() => ({}))) as Record<string, unknown>;
      } catch {
        proposalTick = null;
      }
    }

    return res.status(200).json({
      success: true,
      processed: data.processed || 0,
      proposalTick,
      triggeredAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'unknown error';
    console.error('[EmailCron] Error:', error);
    return res.status(500).json({ error: msg });
  }
}

async function handlePhoneDispatch(req: VercelRequest, res: VercelResponse) {
  try {
    const result = await dispatchDueScheduledPhoneCalls();
    return res.status(200).json({ ok: true, ...result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'dispatch failed';
    console.error('[phone-dispatch]', e);
    return res.status(500).json({ error: msg });
  }
}

async function handleMarketBenchmark(_req: VercelRequest, res: VercelResponse) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const secret = process.env.NEXUS_PHONE_EDGE_SECRET;
  if (!secret || !supabaseUrl) {
    return res.status(200).json({ skipped: true, reason: 'missing_env' });
  }
  try {
    const r = await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/make-server-57781ad9/internal/bench/aggregate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-nexus-internal-secret': secret,
      },
    });
    const data = await r.json().catch(() => ({}));
    return res.status(200).json({ ok: true, bench: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'bench failed';
    return res.status(200).json({ error: msg });
  }
}

/** Synthetic probe + optional pre-warm: GET ?probe=1 from app origin; optional tiny POST to warm Kokoro via proxy. */
async function handleTtsSlo(_req: VercelRequest, res: VercelResponse) {
  const appUrl = (process.env.APP_URL || `https://${process.env.VERCEL_URL || 'www.syncscript.app'}`).replace(/\/$/, '');
  const probeUrl = `${appUrl}/api/ai/tts?probe=1`;

  let probe: Record<string, unknown> = {};
  try {
    const r = await fetch(probeUrl, { signal: AbortSignal.timeout(18_000) });
    probe = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'probe failed';
    console.error('[tts-slo] probe fetch failed', msg);
    return res.status(200).json({ ok: false, stage: 'probe_fetch', error: msg });
  }

  const kokoroConfigured = probe.kokoroConfigured === true;
  const primaryOk = probe.kokoroUpstreamReachable === true;
  const hasFallbackEnv = Boolean(probe.kokoroFallbackDirectOrigin);
  const fallbackOk = hasFallbackEnv ? probe.kokoroFallbackReachable === true : null;

  const summary: Record<string, unknown> = {
    ok: primaryOk || (hasFallbackEnv && fallbackOk === true),
    kokoroConfigured,
    primaryOk,
    ...(hasFallbackEnv ? { fallbackOk } : {}),
  };

  console.log(JSON.stringify({ v: 1, src: 'tts_slo_cron', ...summary }));

  if (!kokoroConfigured) {
    return res.status(200).json({ ...summary, skipped: true, reason: 'kokoro_not_configured' });
  }

  if (!primaryOk && hasFallbackEnv && fallbackOk === false) {
    console.error('[tts-slo] ALERT: primary and fallback Kokoro unreachable');
  } else if (!primaryOk && !hasFallbackEnv) {
    console.error('[tts-slo] ALERT: primary Kokoro unreachable (no fallback URL)');
  }

  if (process.env.TTS_CRON_PREWARM === '1') {
    try {
      const pw = await fetch(`${appUrl}/api/ai/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'warm', voice: 'cortana', speed: 1.0 }),
        signal: AbortSignal.timeout(50_000),
      });
      summary.prewarm = { ok: pw.ok, status: pw.status };
    } catch (e: unknown) {
      summary.prewarm = { ok: false, error: e instanceof Error ? e.message : 'prewarm failed' };
    }
  }

  return res.status(200).json(summary);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const raw = req.query.job;
  const job = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
  if (!job) {
    return res.status(400).json({ error: 'Missing cron job segment' });
  }

  if (!requireCronAuth(req, res)) return;

  switch (job) {
    case 'wake-up':
      return handleWakeUp(req, res);
    case 'guest-cleanup':
      return handleGuestCleanup(req, res);
    case 'process-emails':
      return handleProcessEmails(req, res);
    case 'phone-dispatch':
      return handlePhoneDispatch(req, res);
    case 'invoice-overdue':
    case 'billing-tick':
      return handleInvoiceOverdue(req, res);
    case 'market-benchmarks':
      return handleMarketBenchmark(req, res);
    case 'tts-slo':
      return handleTtsSlo(req, res);
    case 'concierge-playbook-tick':
      return handleConciergePlaybookTickHttp(req, res);
    case 'lucid-dream':
      return handleLucidDream(req, res);
    case 'astral-project':
      return handleAstralProject(req, res);
    case 'nexus-daily-rhythm':
      return handleNexusDailyRhythm(req, res);
    default:
      return res.status(404).json({ error: `Unknown cron job: ${job}` });
  }
}

async function handleLucidDream(req: VercelRequest, res: VercelResponse) {
  try {
    const { executeLucidDreamCycle } = await import('../_lib/lucid-sandbox.js');
    const userId = (req.query.userId as string) || 'user_001';
    const result = await executeLucidDreamCycle(userId);
    return res.status(200).json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Lucid dream cycle failed';
    console.error('[lucid-dream]', e);
    return res.status(500).json({ error: msg });
  }
}

async function handleAstralProject(req: VercelRequest, res: VercelResponse) {
  try {
    const { executeAstralProjections } = await import('../_lib/astral-gateways.js');
    const userId = (req.query.userId as string) || 'user_001';
    const result = await executeAstralProjections(userId);
    return res.status(200).json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Astral projection failed';
    console.error('[astral-project]', e);
    return res.status(500).json({ error: msg });
  }
}

async function handleInvoiceOverdue(_req: VercelRequest, res: VercelResponse) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const secret = process.env.NEXUS_PHONE_EDGE_SECRET;

  if (!secret) {
    return res.status(200).json({ skipped: true, reason: 'NEXUS_PHONE_EDGE_SECRET not set' });
  }
  if (!supabaseUrl) {
    return res.status(200).json({ skipped: true, reason: 'SUPABASE_URL not set' });
  }

  try {
    const url = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/make-server-57781ad9/internal/cron/billing-tick`;
    const tickRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-nexus-internal-secret': secret,
      },
    });
    const data = await tickRes.json().catch(() => ({}));
    if (!tickRes.ok) {
      return res.status(200).json({ skipped: true, reason: `billing_tick_${tickRes.status}`, detail: data });
    }
    return res.status(200).json({ ok: true, billing: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown error';
    return res.status(200).json({ error: msg });
  }
}

/**
 * Nexus Daily Rhythm — Hourly cron that dispatches voice calls at:
 *   7 AM EST  → Morning briefing (MEMORY analysis + email triage)
 *   12 PM EST → Noon check-in (deferred questions + progress)
 *   9 PM EST  → Debrief (captures wins/reflections/tomorrow → DailyOpsModal)
 *
 * Idempotent: checks KV to ensure each cadence fires at most once per day.
 */
async function handleNexusDailyRhythm(req: VercelRequest, res: VercelResponse) {
  try {
    const {
      compileMorningBrief,
      compileNoonCheckIn,
      compileDebriefPrompt,
      rhythmDispatchedKey,
    } = await import('../_lib/nexus-briefing-compiler.js');
    const { kvGet, kvSet, enqueueScheduledPhoneCall } = await import('../phone/_helpers.js');

    // Determine current EST hour
    const now = new Date();
    const estHour = Number(
      now.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false }),
    );
    const dateKey = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

    // Target user config
    const phoneNumber = process.env.WAKE_UP_PHONE_NUMBER;
    const userId = process.env.NEXUS_RHYTHM_USER_ID || 'user_001';
    const userEmail = process.env.NEXUS_RHYTHM_USER_EMAIL || 'stringer.c.a@gmail.com';

    if (!phoneNumber) {
      return res.status(200).json({ skipped: true, reason: 'WAKE_UP_PHONE_NUMBER not set' });
    }

    // Determine which cadence (if any) is due this hour
    type Cadence = 'morning' | 'noon' | 'debrief';
    let cadence: Cadence | null = null;

    if (estHour === 7) cadence = 'morning';
    else if (estHour === 12) cadence = 'noon';
    else if (estHour === 21) cadence = 'debrief';

    if (!cadence) {
      return res.status(200).json({
        ok: true,
        skipped: true,
        estHour,
        reason: 'No call due this hour',
      });
    }

    // Idempotency check
    const dispatchKey = rhythmDispatchedKey(cadence);
    const alreadyDispatched = await kvGet(dispatchKey);
    if (alreadyDispatched) {
      return res.status(200).json({
        ok: true,
        skipped: true,
        cadence,
        reason: `Already dispatched ${cadence} for ${dateKey}`,
      });
    }

    // Compile the briefing content
    console.log(`[NexusDailyRhythm] Compiling ${cadence} briefing for ${userId}...`);
    let compiledText = '';

    if (cadence === 'morning') {
      const brief = await compileMorningBrief(userId);
      compiledText = brief.spokenText;
    } else if (cadence === 'noon') {
      const checkIn = await compileNoonCheckIn(userId);
      compiledText = checkIn.spokenText;
    } else if (cadence === 'debrief') {
      const debrief = await compileDebriefPrompt(userId);
      compiledText = debrief.spokenIntro;
    }

    // Enqueue the Twilio call
    const callId = `nexus-rhythm-${cadence}-${dateKey}-${Date.now()}`;
    await enqueueScheduledPhoneCall({
      id: callId,
      phoneNumber,
      scheduledAt: now.toISOString(),
      briefingType: `nexus-rhythm-${cadence}`,
      userId,
      userEmail,
    });

    // Mark as dispatched for idempotency
    await kvSet(dispatchKey, { dispatched: true, callId, at: now.toISOString() });

    // Also dispatch it immediately (don't wait for phone-dispatch cron)
    const { dispatchDueScheduledPhoneCalls } = await import('../phone/_helpers.js');
    const dispatchResult = await dispatchDueScheduledPhoneCalls();

    console.log(`[NexusDailyRhythm] ${cadence} call dispatched: ${callId}`);

    return res.status(200).json({
      ok: true,
      cadence,
      callId,
      compiledTextLength: compiledText.length,
      dispatch: dispatchResult,
      triggeredAt: now.toISOString(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Nexus daily rhythm failed';
    console.error('[nexus-daily-rhythm]', e);
    return res.status(500).json({ error: msg });
  }
}
