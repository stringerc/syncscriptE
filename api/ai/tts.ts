/**
 * Server-side TTS Proxy
 *
 * Synthesizes speech via Kokoro TTS on AWS EC2, tunneled through Cloudflare.
 * The browser calls this endpoint; it proxies to the Kokoro server.
 *
 * Flow: Browser → /api/ai/tts → Cloudflare Tunnel → Kokoro (EC2) → audio → Browser
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const KOKORO_URL = process.env.KOKORO_TTS_URL || '';

const VOICE_PRESETS: Record<string, string> = {
  nexus: 'nexus',
  nexus_emphatic: 'nexus_emphatic',
  nexus_query: 'nexus_query',
  cortana: 'cortana',
  commander: 'commander',
  professional: 'professional',
  gentle: 'af_heart',
  playful: 'af_bella',
  natural: 'af_sky',
};

const MAX_TEXT_LENGTH = 2000;
const KOKORO_TIMEOUT_MS = 15_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text, voice, speed } = req.body || {};

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return res.status(400).json({ error: `Text too long (max ${MAX_TEXT_LENGTH} chars)` });
  }

  if (!KOKORO_URL) {
    console.warn('[TTS] KOKORO_TTS_URL not configured');
    return res.status(503).json({ error: 'TTS service not configured', code: 'NO_TTS_URL' });
  }

  const resolvedVoice = VOICE_PRESETS[voice] || voice || VOICE_PRESETS.nexus;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), KOKORO_TIMEOUT_MS);

    const kokoroRes = await fetch(`${KOKORO_URL}/v1/audio/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'kokoro',
        input: text,
        voice: resolvedVoice,
        speed: typeof speed === 'number' ? Math.max(0.5, Math.min(speed, 2.0)) : 1.0,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!kokoroRes.ok) {
      const errText = await kokoroRes.text().catch(() => '');
      console.error(`[TTS] Kokoro returned ${kokoroRes.status}: ${errText.slice(0, 200)}`);
      return res.status(503).json({ error: 'TTS synthesis failed', code: 'KOKORO_ERROR' });
    }

    const audioBuffer = await kokoroRes.arrayBuffer();
    const contentType = kokoroRes.headers.get('content-type') || 'audio/wav';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', audioBuffer.byteLength.toString());
    res.setHeader('Cache-Control', 'no-store');
    return res.send(Buffer.from(audioBuffer));
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('[TTS] Kokoro request timed out');
      return res.status(504).json({ error: 'TTS request timed out', code: 'TIMEOUT' });
    }
    console.error('[TTS] Kokoro unreachable:', error.message);
    return res.status(503).json({ error: 'TTS service unreachable', code: 'UNREACHABLE' });
  }
}
