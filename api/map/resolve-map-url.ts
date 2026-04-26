import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isAllowedMapResolveEntry, resolveMapUrlToLatLng } from '../_lib/resolve-map-short-link';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const raw = typeof req.query.url === 'string' ? req.query.url : '';
  if (!raw.trim()) return res.status(400).json({ error: 'Missing url' });

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    /* use raw */
  }

  if (!isAllowedMapResolveEntry(decoded)) {
    return res.status(400).json({ error: 'URL not allowed for map resolve' });
  }

  try {
    const out = await resolveMapUrlToLatLng(decoded);
    if (!out) return res.status(404).json({ error: 'Could not resolve coordinates' });
    return res.status(200).json({
      lat: out.lat,
      lng: out.lng,
      finalUrl: out.finalUrl,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'resolve_failed';
    return res.status(502).json({ error: msg.slice(0, 200) });
  }
}
