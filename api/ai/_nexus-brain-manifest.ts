import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBrainPublicMetadata } from './_lib/nexus-brain/load-brain';

/**
 * Public metadata for Mission Control / ops: brain version, plan names, tool ids, policy ids.
 * No user data, no secrets.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const meta = getBrainPublicMetadata();
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(200).json(meta);
  } catch {
    return res.status(500).json({ error: 'brain_unavailable' });
  }
}
