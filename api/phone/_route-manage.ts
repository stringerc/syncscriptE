/**
 * Phone manage logic — mounted at /api/phone/manage via [endpoint].ts.
 *
 * Routes by ?resource= query param:
 *   POST   ?resource=briefing             → Schedule a briefing
 *   POST   ?resource=caller-index         → Map phoneNumber → userId (Twilio From → account)
 *   DELETE ?resource=briefing&id=ID       → Cancel a briefing
 *   POST   ?resource=number               → Provision a phone number
 *   PUT    ?resource=voicemail            → Configure voicemail
 *
 * Auth: Bearer token (PHONE_API_SECRET)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  handleOptions,
  setCorsHeaders,
  validateApiKey,
  validateTwilioConfig,
  twilioSearchNumbers,
  twilioBuyNumber,
  enqueueScheduledPhoneCall,
  removeScheduledPhoneCallById,
  registerCallerPhoneForUser,
} from './_helpers';

let voicemailConfig = {
  enabled: true,
  greeting: "Hi, you've reached SyncScript AI. Leave a message and I'll get back to you!",
  maxDuration: 120,
  transcribeMessages: true,
};

function generateId(): string {
  return `br_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function routePhoneManage(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  setCorsHeaders(res);
  if (!validateApiKey(req, res)) return;

  const resource = (req.query.resource as string) || '';

  if (req.method === 'POST' && resource === 'briefing') {
    if (!validateTwilioConfig(res)) return;

    const { phoneNumber, scheduledTime, briefingType, userEmail, userId } = req.body || {};
    if (!phoneNumber || !scheduledTime) {
      return res.status(400).json({ error: 'phoneNumber and scheduledTime are required' });
    }

    const briefingId = generateId();
    const scheduledDate = new Date(scheduledTime);
    const minAhead = 45 * 1000;
    const maxAhead = 14 * 24 * 60 * 60 * 1000;

    if (scheduledDate.getTime() <= Date.now() + minAhead) {
      return res.status(400).json({ error: 'scheduledTime must be at least ~1 minute in the future' });
    }
    if (scheduledDate.getTime() > Date.now() + maxAhead) {
      return res.status(400).json({ error: 'scheduledTime cannot be more than 14 days ahead' });
    }

    await enqueueScheduledPhoneCall({
      id: briefingId,
      phoneNumber: String(phoneNumber).trim(),
      scheduledAt: scheduledDate.toISOString(),
      briefingType: briefingType || 'custom',
      userEmail: userEmail ? String(userEmail) : undefined,
      userId: userId ? String(userId) : undefined,
    });

    return res.status(200).json({
      briefingId,
      scheduled: true,
      scheduledTime,
      briefingType: briefingType || 'custom',
    });
  }

  if (req.method === 'POST' && resource === 'caller-index') {
    const { phoneNumber, userId } = req.body || {};
    if (!phoneNumber || !userId) {
      return res.status(400).json({ error: 'phoneNumber and userId are required' });
    }
    await registerCallerPhoneForUser(String(userId), String(phoneNumber).trim());
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE' && resource === 'briefing') {
    const briefingId = req.query.id as string;
    if (!briefingId) return res.status(400).json({ error: 'id is required' });

    const removed = await removeScheduledPhoneCallById(briefingId);
    console.log(`[Briefings] Cancelled: ${briefingId} (removedFromQueue=${removed})`);
    return res.status(200).json({ briefingId, cancelled: true });
  }

  if (req.method === 'POST' && resource === 'number') {
    if (!validateTwilioConfig(res)) return;

    const { areaCode, country } = req.body || {};
    const available = await twilioSearchNumbers({ country: country || 'US', areaCode, limit: 5 });

    if (available.length === 0) {
      return res.status(404).json({ error: 'No phone numbers available' });
    }

    const result = await twilioBuyNumber(available[0].phone_number);
    if (!result.success) {
      return res.status(502).json({ error: `Provisioning failed: ${result.error}` });
    }

    return res.status(200).json({
      phoneNumber: result.number,
      sid: result.sid,
      monthlyRate: 1.0,
      configured: true,
    });
  }

  if (req.method === 'PUT' && resource === 'voicemail') {
    const { enabled, greeting, maxDuration, transcribeMessages } = req.body || {};
    if (enabled !== undefined) voicemailConfig.enabled = enabled;
    if (greeting) voicemailConfig.greeting = greeting;
    if (maxDuration) voicemailConfig.maxDuration = maxDuration;
    if (transcribeMessages !== undefined) voicemailConfig.transcribeMessages = transcribeMessages;

    return res.status(200).json({ success: true, config: voicemailConfig });
  }

  return res.status(400).json({ error: 'Invalid request. Use ?resource=briefing|number|voicemail' });
}
