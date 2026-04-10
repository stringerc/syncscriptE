/**
 * Single Vercel serverless function for all /api/phone/* routes (Hobby plan ≤12 functions).
 * Maps: /api/phone/calls | /api/phone/manage | /api/phone/twiml
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { routePhoneCalls } from './_route-calls';
import { routePhoneManage } from './_route-manage';
import { routePhoneTwiml } from './_route-twiml';

function segment(req: VercelRequest): string {
  const e = req.query.endpoint;
  if (typeof e === 'string') return e;
  if (Array.isArray(e)) return e[0] || '';
  return '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  switch (segment(req)) {
    case 'calls':
      return routePhoneCalls(req, res);
    case 'manage':
      return routePhoneManage(req, res);
    case 'twiml':
      return routePhoneTwiml(req, res);
    default:
      return res.status(404).json({ error: 'Unknown phone endpoint' });
  }
}
