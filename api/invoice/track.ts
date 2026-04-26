import type { VercelRequest, VercelResponse } from '@vercel/node';

const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const invoiceId = typeof req.query.id === 'string' ? req.query.id.trim() : '';
  const userId = typeof req.query.uid === 'string' ? req.query.uid.trim() : '';

  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (invoiceId && userId) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://kwhnrlzibgfedtxpkbgb.supabase.co';
    const secret = process.env.NEXUS_PHONE_EDGE_SECRET;

    if (secret) {
      fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/make-server-57781ad9/invoices/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nexus-internal-secret': secret,
        },
        body: JSON.stringify({ userId, invoiceId, status: 'viewed' }),
      }).catch(() => {});
    }
  }

  return res.status(200).send(TRANSPARENT_GIF);
}
