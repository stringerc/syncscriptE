/**
 * Shared body helpers when api/phone/[endpoint].ts uses bodyParser: false
 * (required for Discord signature forwarding + manual parse for phone JSON / Twilio form).
 */
import type { VercelRequest } from '@vercel/node';
import { parse as parseQs } from 'node:querystring';

export async function readRequestBodyBuffer(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req as AsyncIterable<Buffer | string>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function ensureParsedBodyForPhone(req: VercelRequest): Promise<void> {
  const m = req.method || 'GET';
  if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return;
  const existing = (req as unknown as { body?: unknown }).body;
  if (existing !== undefined && existing !== null) return;

  const buf = await readRequestBodyBuffer(req);
  if (!buf.length) {
    (req as unknown as { body: unknown }).body = {};
    return;
  }
  const ct = (req.headers['content-type'] || '').toLowerCase();
  const r = req as unknown as { body: unknown };
  if (ct.includes('application/json')) {
    try {
      r.body = JSON.parse(buf.toString('utf8'));
    } catch {
      r.body = {};
    }
  } else if (ct.includes('application/x-www-form-urlencoded')) {
    r.body = parseQs(buf.toString('utf8'));
  } else {
    r.body = {};
  }
}
