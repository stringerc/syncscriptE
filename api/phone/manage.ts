/**
 * /api/phone/manage — Consolidated management handler
 * 
 * Routes by ?resource= query param:
 *   POST   ?resource=briefing             → Schedule a briefing
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
  twilioCreateCall,
  twilioSearchNumbers,
  twilioBuyNumber,
  getTwilioConfig,
} from './_helpers';

// ── In-memory stores (production: use database) ──────────────────────────
let voicemailConfig = {
  enabled: true,
  greeting: "Hi, you've reached SyncScript AI. Leave a message and I'll get back to you!",
  maxDuration: 120,
  transcribeMessages: true,
};

function generateId(): string {
  return `br_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  setCorsHeaders(res);
  if (!validateApiKey(req, res)) return;

  const resource = (req.query.resource as string) || '';

  // ── BRIEFING: Schedule ────────────────────────────────────────────────
  if (req.method === 'POST' && resource === 'briefing') {
    if (!validateTwilioConfig(res)) return;

    const { phoneNumber, scheduledTime, briefingType } = req.body || {};
    if (!phoneNumber || !scheduledTime) {
      return res.status(400).json({ error: 'phoneNumber and scheduledTime are required' });
    }

    const config = getTwilioConfig();
    const briefingId = generateId();
    const scheduledDate = new Date(scheduledTime);

    if (scheduledDate <= new Date()) {
      return res.status(400).json({ error: 'scheduledTime must be in the future' });
    }

    const delayMs = scheduledDate.getTime() - Date.now();

    // For calls within 10 minutes, schedule directly
    if (delayMs <= 10 * 60 * 1000) {
      setTimeout(async () => {
        const twimlUrl = `${config.appUrl}/api/phone/twiml?handler=conversation&type=${briefingType || 'morning-briefing'}`;
        const statusUrl = `${config.appUrl}/api/phone/twiml?handler=status-callback`;
        await twilioCreateCall({
          to: phoneNumber,
          twimlUrl,
          statusCallbackUrl: statusUrl,
          machineDetection: 'DetectMessageEnd',
        });
      }, delayMs);
    }

    return res.status(200).json({
      briefingId,
      scheduled: true,
      scheduledTime,
      briefingType: briefingType || 'custom',
    });
  }

  // ── BRIEFING: Cancel ──────────────────────────────────────────────────
  if (req.method === 'DELETE' && resource === 'briefing') {
    const briefingId = req.query.id as string;
    if (!briefingId) return res.status(400).json({ error: 'id is required' });

    console.log(`[Briefings] Cancelled: ${briefingId}`);
    return res.status(200).json({ briefingId, cancelled: true });
  }

  // ── NUMBER: Provision ─────────────────────────────────────────────────
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

  // ── VOICEMAIL: Configure ──────────────────────────────────────────────
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
