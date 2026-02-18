/**
 * /api/phone/calls — Consolidated call management handler
 * 
 * Routes by method + query params:
 *   POST  ?action=outbound    → Initiate an outbound call
 *   GET   ?id=CALL_SID        → Get call status
 *   POST  ?action=end&id=SID  → End an active call
 * 
 * Auth: Bearer token (PHONE_API_SECRET)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  handleOptions,
  setCorsHeaders,
  validateApiKey,
  validateTwilioConfig,
  twilioCreateCall,
  twilioGetCall,
  twilioUpdateCall,
  getTwilioConfig,
  getPendingCalendarEvents,
  twiml,
  twimlSay,
  twimlGather,
  twimlPause,
} from './_helpers';

// Map Twilio statuses to simplified statuses
function mapStatus(s: string): string {
  const m: Record<string, string> = {
    queued: 'initiated', ringing: 'ringing', 'in-progress': 'in-progress',
    completed: 'completed', busy: 'failed', 'no-answer': 'no-answer',
    canceled: 'cancelled', failed: 'failed',
  };
  return m[s] || s;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  setCorsHeaders(res);
  if (!validateApiKey(req, res)) return;
  if (!validateTwilioConfig(res)) return;

  const action = (req.query.action as string) || '';
  const callId = (req.query.id as string) || '';

  // ── POST ?action=outbound ────────────────────────────────────────────
  if (req.method === 'POST' && action === 'outbound') {
    const { phoneNumber, callType, maxDuration, voiceId, userEmail, userId } = req.body || {};

    if (!phoneNumber) {
      return res.status(400).json({ error: 'phoneNumber is required' });
    }

    const config = getTwilioConfig();
    const voice = (!voiceId || voiceId === 'default') ? 'Polly.Joanna-Neural' : voiceId;

    // Build greeting based on call type
    const greetings: Record<string, string> = {
      'morning-briefing': "Good morning! I'm Nexus, your SyncScript AI. Let me give you a quick rundown of your day. What would you like to start with?",
      'evening-review': "Hey there! Time for your evening wrap-up. I can go over what you accomplished today and help you plan for tomorrow. What's on your mind?",
      'check-in': "Hey! Just checking in on you. How are things going? Need help with anything?",
      'urgent': "Hi, this is Nexus from SyncScript calling about something important. What do you need help with?",
      'outbound-briefing': "Hey! This is Nexus calling with a quick briefing. What would you like to go over?",
      'post-purchase': "Hey! It's Nexus from SyncScript! I just saw you signed up and I am genuinely excited. I'm your AI productivity assistant and I want to get you set up real quick. First question — what time do you usually wake up?",
      'payment-failed': "Hey! It's Nexus from SyncScript. Quick heads up — looks like your payment didn't go through. No big deal, these things happen. Want me to pause things for a few days while you sort it out?",
      'trial-ending': "Hey! It's Nexus. Your trial wraps up in about two days, and I wanted to give you a quick update on what we've accomplished together. Want to hear the highlights?",
      'cancellation-save': "Hey, it's Nexus from SyncScript. I noticed you just canceled, and I wanted to personally check in. No pressure at all — I'm just curious, was there something that wasn't working for you?",
      'morning-briefing-auto': "Good morning! It's Nexus. I've got your daily briefing ready. Here's what you need to know today.",
      'weekly-recap': "Hey! It's Nexus with your weekly recap. Ready to hear how your week went?",
    };
    const greeting = greetings[callType || ''] || "Hey! This is Nexus, your SyncScript AI assistant. I'm here to help with your tasks, goals, or anything you need. What's up?";
    
    const callContext = ['post-purchase', 'payment-failed', 'trial-ending', 'cancellation-save', 'morning-briefing-auto', 'weekly-recap'].includes(callType) ? callType : '';

    // Build the respond URL for the conversation loop (with context + email for personality engine)
    const respondUrl = `${config.appUrl}/api/phone/twiml?handler=respond&voice=${encodeURIComponent(voice)}${callContext ? `&context=${encodeURIComponent(callContext)}` : ''}${userEmail ? `&email=${encodeURIComponent(userEmail)}` : ''}${userId ? `&userId=${encodeURIComponent(userId)}` : ''}`;

    // Use INLINE TwiML to avoid URL-fetch issues on Twilio trial
    const inlineTwiml = twiml(
      twimlSay(greeting, voice) +
      twimlGather({
        action: respondUrl,
        input: 'speech',
        speechTimeout: 'auto',
        language: 'en-US',
        innerXml: twimlPause(3),
      }) +
      twimlSay("I didn't hear anything. No worries, you can always reach me through the app. Talk soon!", voice)
    );

    const result = await twilioCreateCall({
      to: phoneNumber,
      twimlInline: inlineTwiml,
      machineDetection: 'DetectMessageEnd',
      timeout: maxDuration ? Math.min(maxDuration, 600) : 30,
    });

    if (!result.success) {
      return res.status(502).json({ error: `Failed to initiate call: ${result.error}` });
    }

    return res.status(200).json({
      callId: result.callSid,
      call_sid: result.callSid,
      status: 'initiated',
      startedAt: Date.now(),
    });
  }

  // ── GET ?action=pending-events&id=CALL_SID ─────────────────────────
  if (req.method === 'GET' && action === 'pending-events' && callId) {
    const events = getPendingCalendarEvents(callId);
    return res.status(200).json({ callId, events });
  }

  // ── GET ?id=CALL_SID (status) ────────────────────────────────────────
  if (req.method === 'GET' && callId) {
    const callData = await twilioGetCall(callId);

    if (!callData) {
      return res.status(404).json({ error: 'Call not found' });
    }

    return res.status(200).json({
      callId: callData.sid,
      status: mapStatus(callData.status),
      duration: callData.duration ? parseInt(callData.duration) : undefined,
      startedAt: callData.start_time ? new Date(callData.start_time).getTime() : undefined,
      endedAt: callData.end_time ? new Date(callData.end_time).getTime() : undefined,
    });
  }

  // ── POST ?action=end&id=CALL_SID ─────────────────────────────────────
  if (req.method === 'POST' && action === 'end' && callId) {
    const success = await twilioUpdateCall(callId, { Status: 'completed' });

    if (!success) {
      return res.status(502).json({ error: 'Failed to end call' });
    }

    return res.status(200).json({ callId, status: 'completed', endedAt: Date.now() });
  }

  return res.status(400).json({ error: 'Invalid request. Use ?action=outbound, ?id=SID, or ?action=end&id=SID' });
}
