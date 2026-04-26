/**
 * Discord Interactions proxy → Supabase Edge (same URL path via vercel.json rewrite).
 * Must receive raw body bytes for Ed25519 verification upstream.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readRequestBodyBuffer } from './_read-body';

const PROJECT_REF = 'kwhnrlzibgfedtxpkbgb';
const TARGET_URL = `https://${PROJECT_REF}.supabase.co/functions/v1/make-server-57781ad9/discord/interactions`;

export async function routeDiscordInteractions(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Signature-Ed25519, X-Signature-Timestamp');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (!supabaseKey) {
    return res.status(500).json({ error: 'Missing Supabase key for Discord proxy' });
  }

  try {
    const bodyBuf = await readRequestBodyBuffer(req);
    const body = bodyBuf.toString('utf8');
    const signature = req.headers['x-signature-ed25519'];
    const timestamp = req.headers['x-signature-timestamp'];
    const discordPublicKey = req.headers['x-discord-public-key'];

    const forwardHeaders: Record<string, string> = {
      'content-type': 'application/json',
      apikey: supabaseKey,
      authorization: `Bearer ${supabaseKey}`,
    };

    if (typeof signature === 'string' && signature) {
      forwardHeaders['x-signature-ed25519'] = signature;
    }
    if (typeof timestamp === 'string' && timestamp) {
      forwardHeaders['x-signature-timestamp'] = timestamp;
    }
    if (typeof discordPublicKey === 'string' && discordPublicKey) {
      forwardHeaders['x-discord-public-key'] = discordPublicKey;
    }

    const upstream = await fetch(TARGET_URL, {
      method: 'POST',
      headers: forwardHeaders,
      body,
    });

    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/json');
    return res.send(text);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Discord proxy failed';
    return res.status(500).json({ error: msg });
  }
}
