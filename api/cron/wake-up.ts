/**
 * /api/cron/wake-up — Vercel Cron Job for scheduled wake-up calls
 * 
 * Triggered by Vercel Cron at the configured time.
 * Reads WAKE_UP_PHONE_NUMBER from env and initiates an outbound call.
 * 
 * Security: Validates CRON_SECRET to prevent unauthorized triggers.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel Cron sends authorization header with CRON_SECRET
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

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
  const localHour = hour - 5; // EST = UTC-5 (adjust for your timezone)

  const greeting = localHour < 12
    ? "Good morning! Rise and shine! I'm your SyncScript AI with your morning wake-up call. Ready to hear about your day?"
    : "Hey there! This is your SyncScript AI wake-up call. Let me help you get going!";

  // Build inline TwiML for the wake-up call conversation
  const respondUrl = `${appUrl}/api/phone/twiml?handler=respond&voice=${encodeURIComponent(voiceId)}`;

  const escapeXml = (text: string) => text
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

  // Make the Twilio call directly (no dependency on _helpers to keep cron lean)
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const body = new URLSearchParams({
    To: phoneNumber,
    From: fromNumber,
    Twiml: inlineTwiml,
    MachineDetection: 'DetectMessageEnd',
    Timeout: '30',
  });

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      },
    );

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
  } catch (error: any) {
    console.error('[WakeUp] Exception:', error);
    return res.status(500).json({ error: error.message });
  }
}
