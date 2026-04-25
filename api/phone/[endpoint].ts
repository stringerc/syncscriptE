/**
 * Single Vercel serverless function for /api/phone/* plus Discord interactions proxy (Hobby plan ≤12 functions).
 * Maps: /api/phone/calls | manage | twiml | discord-interactions (internal)
 * Public Discord URL: /api/discord/interactions → rewrite → /api/phone/discord-interactions
 *
 * bodyParser: false so Discord can forward raw JSON for signature verification; phone routes get parsed bodies via ensureParsedBodyForPhone.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureParsedBodyForPhone } from './_read-body';
import { routeDiscordInteractions } from './_route-discord';
import { routePhoneCalls } from './_route-calls';
import { routePhoneManage } from './_route-manage';
import { routePhoneTwiml } from './_route-twiml';
import { routePostCallSummary } from './_route-post-call-summary';

export const config = {
  api: {
    bodyParser: false,
  },
};

function segment(req: VercelRequest): string {
  const e = req.query.endpoint;
  if (typeof e === 'string') return e;
  if (Array.isArray(e)) return e[0] || '';
  return '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const seg = segment(req);
  if (seg === 'discord-interactions') {
    return routeDiscordInteractions(req, res);
  }

  await ensureParsedBodyForPhone(req);

  switch (seg) {
    case 'calls':
      return routePhoneCalls(req, res);
    case 'manage':
      return routePhoneManage(req, res);
    case 'twiml':
      return routePhoneTwiml(req, res);
    case 'post-call-summary':
      return routePostCallSummary(req, res);
    default:
      return res.status(404).json({ error: 'Unknown phone endpoint' });
  }
}
