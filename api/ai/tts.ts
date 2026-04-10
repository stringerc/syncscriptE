/**
 * Server-side TTS Proxy
 *
 * Browser → /api/ai/tts → Kokoro `{origin}/v1/audio/speech` → audio bytes.
 * GET returns `kokoroDirectOrigin` so the client can call Kokoro directly if the proxy fails
 * (same hostname as `KOKORO_TTS_URL` — no OpenAI, no extra billing).
 */

import { lookup } from 'node:dns/promises';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Trim — Vercel/dashboard paste sometimes includes trailing \\n or whitespace. */
const KOKORO_URL = (process.env.KOKORO_TTS_URL || '').trim().replace(/\\n$/g, '').trim();
/** Optional second Kokoro base URL (must be Kokoro /v1 host, not this app’s /api/ai/tts). */
const KOKORO_FALLBACK_URL = (process.env.KOKORO_TTS_FALLBACK_URL || '').trim().replace(/\\n$/g, '').trim();

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
/** Cold path via Cloudflare quick tunnel + ONNX load can exceed 15s on first hit. */
const KOKORO_TIMEOUT_MS = 45_000;

type SynthBody = {
  model: string;
  input: string;
  voice: string;
  speed: number;
};

async function fetchKokoroAudio(
  baseUrl: string,
  body: SynthBody,
  timeoutMs: number,
): Promise<
  | { ok: true; buffer: Buffer; contentType: string }
  | { ok: false; kind: 'http' | 'network'; status?: number; detail: string }
> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const kokoroRes = await fetch(`${baseUrl.replace(/\/$/, '')}/v1/audio/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!kokoroRes.ok) {
      const errText = await kokoroRes.text().catch(() => '');
      return { ok: false, kind: 'http', status: kokoroRes.status, detail: errText.slice(0, 200) };
    }

    const audioBuffer = await kokoroRes.arrayBuffer();
    const contentType = kokoroRes.headers.get('content-type') || 'audio/wav';
    return { ok: true, buffer: Buffer.from(audioBuffer), contentType };
  } catch (error: any) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      return { ok: false, kind: 'network', detail: 'timeout' };
    }
    return { ok: false, kind: 'network', detail: error.message || 'fetch failed' };
  }
}

const PROBE_TIMEOUT_MS = 8_000;

async function dnsResolvable(hostname: string): Promise<{ ok: boolean; detail?: string }> {
  try {
    await lookup(hostname);
    return { ok: true };
  } catch (error: unknown) {
    const code = error && typeof error === 'object' && 'code' in error ? String((error as { code?: string }).code) : '';
    return { ok: false, detail: code ? `DNS ${code}` : 'DNS lookup failed' };
  }
}

function hostnameFromOrigin(origin: string): string | null {
  try {
    return new URL(origin).hostname;
  } catch {
    return null;
  }
}

async function probeKokoroHealth(baseUrl: string): Promise<{ ok: boolean; detail?: string }> {
  const url = `${baseUrl.replace(/\/$/, '')}/health`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const r = await fetch(url, { method: 'GET', signal: controller.signal });
    clearTimeout(timer);
    if (r.ok) return { ok: true };
    return { ok: false, detail: `HTTP ${r.status}` };
  } catch (error: unknown) {
    clearTimeout(timer);
    const name = error && typeof error === 'object' && 'name' in error ? String((error as { name?: string }).name) : '';
    if (name === 'AbortError') return { ok: false, detail: 'probe timeout' };
    const msg = error instanceof Error ? error.message : 'fetch failed';
    return { ok: false, detail: msg.slice(0, 120) };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  /**
   * GET — operator / CI check + **kokoroDirectOrigin** for browser direct fallback (no audio, no upstream call).
   */
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-store');
    const kokoroConfigured = Boolean(KOKORO_URL || KOKORO_FALLBACK_URL);
    const primary = KOKORO_URL.replace(/\/$/, '');
    const q = req.query || {};
    const wantProbe = q.probe === '1' || q.probe === 'true';

    let kokoroUpstreamReachable: boolean | null = null;
    let kokoroProbeDetail: string | undefined;
    let kokoroFallbackReachable: boolean | null = null;

    if (wantProbe) {
      if (primary) {
        const p = await probeKokoroHealth(primary);
        kokoroUpstreamReachable = p.ok;
        if (!p.ok) kokoroProbeDetail = p.detail;
      }
      const fb = KOKORO_FALLBACK_URL.replace(/\/$/, '');
      if (fb) {
        const p2 = await probeKokoroHealth(fb);
        kokoroFallbackReachable = p2.ok;
        if (!p2.ok && !kokoroProbeDetail) kokoroProbeDetail = p2.detail;
      }
    }

    return res.status(200).json({
      service: 'kokoro-tts-proxy',
      kokoroConfigured,
      /** Same origin Vercel uses for POST proxy — client may call `/v1/audio/speech` directly if proxy fails. */
      kokoroDirectOrigin: primary || null,
      ...(wantProbe
        ? {
            kokoroUpstreamReachable,
            ...(KOKORO_FALLBACK_URL ? { kokoroFallbackReachable } : {}),
            ...(kokoroProbeDetail ? { kokoroProbeDetail } : {}),
          }
        : {}),
      ...(kokoroConfigured ? {} : { hint: 'Set KOKORO_TTS_URL (and optionally KOKORO_TTS_FALLBACK_URL) in Vercel env.' }),
      ...(wantProbe ? {} : { probeHint: 'Add ?probe=1 to GET to check Kokoro /health from Vercel (see MEMORY.md).' }),
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text, voice, speed } = req.body || {};

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return res.status(400).json({ error: `Text too long (max ${MAX_TEXT_LENGTH} chars)` });
  }

  if (!KOKORO_URL && !KOKORO_FALLBACK_URL) {
    console.warn('[TTS] KOKORO_TTS_URL and KOKORO_TTS_FALLBACK_URL not configured');
    return res.status(503).json({ error: 'TTS service not configured', code: 'NO_TTS_URL' });
  }

  /** Default matches landing Nexus + desktop companion (custom Kokoro preset). */
  const resolvedVoice = VOICE_PRESETS[voice] || voice || VOICE_PRESETS.cortana;
  const speedClamped = typeof speed === 'number' ? Math.max(0.5, Math.min(speed, 2.0)) : 1.0;
  const synthBody: SynthBody = {
    model: 'kokoro',
    input: text,
    voice: resolvedVoice,
    speed: speedClamped,
  };

  const urlsToTry = [KOKORO_URL, KOKORO_FALLBACK_URL].filter(Boolean);
  let lastFailure: { code: string; message: string; httpStatus?: number } | null = null;

  for (let i = 0; i < urlsToTry.length; i += 1) {
    const base = urlsToTry[i];
    const label = i === 0 ? 'primary' : 'fallback';
    const result = await fetchKokoroAudio(base, synthBody, KOKORO_TIMEOUT_MS);

    if (result.ok) {
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Length', result.buffer.byteLength.toString());
      res.setHeader('Cache-Control', 'no-store');
      return res.send(result.buffer);
    }

    if (!result.ok) {
      if (result.kind === 'http') {
        console.error(`[TTS] Kokoro (${label}) HTTP ${result.status}: ${result.detail}`);
        lastFailure = { code: 'KOKORO_ERROR', message: 'TTS synthesis failed' };
      } else {
        const isTimeout = result.detail === 'timeout';
        console.error(`[TTS] Kokoro (${label}) ${isTimeout ? 'timed out' : 'unreachable'}: ${result.detail}`);
        lastFailure = isTimeout
          ? { code: 'TIMEOUT', message: 'TTS request timed out' }
          : { code: 'UNREACHABLE', message: 'TTS service unreachable' };
      }
    }
  }

  if (lastFailure?.code === 'TIMEOUT') {
    return res.status(504).json({ error: lastFailure.message, code: 'TIMEOUT' });
  }
  if (lastFailure?.code === 'KOKORO_ERROR') {
    return res.status(503).json({ error: lastFailure.message, code: 'KOKORO_ERROR' });
  }
  return res.status(503).json({ error: 'TTS service unreachable', code: 'UNREACHABLE' });
}
