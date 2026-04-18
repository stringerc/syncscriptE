/**
 * Fetch Kokoro audio for one prosody segment — **same strategy as landing**:
 * try voice id fallbacks (cortana → natural → nexus → professional), then optional direct Kokoro.
 */
import { disableTtsProxyForSession, isTtsProxyDisabled } from './tts-proxy-session';
import type { NexusProsodySegment } from './nexus-tts-prosody';
import { nexusKokoroVoiceCandidates } from './nexus-tts-prosody';

const TTS_REQUEST_TIMEOUT_MS = 18_000;
const TTS_MAX_RETRIES = 2;
const TTS_RETRY_BACKOFF_MS = 450;

function isTransientTTSStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function isVoiceOrClientError(status: number): boolean {
  return status === 400 || status === 404 || status === 422;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const KOKORO_TTS_URL = (import.meta.env.VITE_KOKORO_TTS_URL || '').trim().replace(/\/$/, '');
const allowClientDirectKokoro =
  import.meta.env.DEV || import.meta.env.VITE_ALLOW_CLIENT_DIRECT_KOKORO === 'true';

let serverKokoroOrigin: string | null = null;
let serverKokoroFallbackOrigin: string | null = null;
let serverKokoroOriginPromise: Promise<void> | null = null;

/** Load primary + fallback Kokoro bases from GET /api/ai/tts (matches Vercel proxy chain). */
export function ensureKokoroOriginsLoaded(): Promise<void> {
  if (serverKokoroOriginPromise) return serverKokoroOriginPromise;
  serverKokoroOriginPromise = (async () => {
    try {
      const r = await fetch('/api/ai/tts', { method: 'GET' });
      if (!r.ok) return;
      const j = (await r.json()) as {
        kokoroDirectOrigin?: string | null;
        kokoroFallbackDirectOrigin?: string | null;
      };
      if (typeof j.kokoroDirectOrigin === 'string' && j.kokoroDirectOrigin.trim()) {
        serverKokoroOrigin = j.kokoroDirectOrigin.trim().replace(/\/$/, '');
      }
      if (typeof j.kokoroFallbackDirectOrigin === 'string' && j.kokoroFallbackDirectOrigin.trim()) {
        serverKokoroFallbackOrigin = j.kokoroFallbackDirectOrigin.trim().replace(/\/$/, '');
      }
    } catch {
      /* keep null */
    }
  })();
  return serverKokoroOriginPromise;
}

/** Unique ordered list: API primary → API fallback → VITE (dev). */
export function getKokoroDirectBases(): string[] {
  const env = KOKORO_TTS_URL.trim().replace(/\/$/, '');
  const raw = [serverKokoroOrigin, serverKokoroFallbackOrigin, env].filter(Boolean) as string[];
  return [...new Set(raw.map((s) => s.trim().replace(/\/$/, '')))];
}

function mayCallKokoroDirectly(): boolean {
  if (import.meta.env.DEV) return true;
  if (import.meta.env.VITE_ALLOW_CLIENT_DIRECT_KOKORO === 'true' && KOKORO_TTS_URL) return true;
  if (serverKokoroOrigin || serverKokoroFallbackOrigin) return true;
  return false;
}

async function fetchDirectKokoroBuffer(
  seg: NexusProsodySegment,
  voice: string,
  signal: AbortSignal | undefined,
): Promise<ArrayBuffer | null> {
  if (!mayCallKokoroDirectly()) return null;
  const bases = getKokoroDirectBases();
  if (!bases.length) return null;

  for (const base of bases) {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), TTS_REQUEST_TIMEOUT_MS);
    const onAbort = () => timeoutController.abort();
    if (signal) signal.addEventListener('abort', onAbort, { once: true });
    try {
      const res = await fetch(`${base}/v1/audio/speech`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'kokoro',
          input: seg.text,
          voice,
          speed: seg.speed,
        }),
        signal: timeoutController.signal,
      });
      if (!res.ok) continue;
      const buffer = await res.arrayBuffer();
      if (buffer.byteLength > 0) return buffer;
    } catch {
      /* try next base */
    } finally {
      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener('abort', onAbort);
    }
  }
  return null;
}

/**
 * One segment, landing-style voice fallbacks + proxy retries + optional direct Kokoro.
 */
export async function fetchKokoroBufferForNexusSegment(
  seg: NexusProsodySegment,
  signal?: AbortSignal,
): Promise<ArrayBuffer | null> {
  await ensureKokoroOriginsLoaded();
  const voices = nexusKokoroVoiceCandidates(seg.voice);

  for (const voice of voices) {
    const canTryProxy = !isTtsProxyDisabled();

    if (canTryProxy) {
      for (let attempt = 0; attempt <= TTS_MAX_RETRIES; attempt += 1) {
        if (signal?.aborted) return null;
        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => timeoutController.abort(), TTS_REQUEST_TIMEOUT_MS);
        const onAbort = () => timeoutController.abort();
        if (signal) signal.addEventListener('abort', onAbort, { once: true });
        try {
          const response = await fetch('/api/ai/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: seg.text, voice, speed: seg.speed }),
            signal: timeoutController.signal,
          });
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            if (buffer.byteLength > 0) return buffer;
            break;
          }
          const errData = (await response.json().catch(() => ({}))) as { code?: string };
          if (errData.code === 'NO_TTS_URL') {
            disableTtsProxyForSession();
            break;
          }
          if (isVoiceOrClientError(response.status)) {
            break;
          }
          if (!isTransientTTSStatus(response.status) || attempt >= TTS_MAX_RETRIES) {
            break;
          }
        } catch {
          if (signal?.aborted) return null;
          if (attempt >= TTS_MAX_RETRIES) break;
        } finally {
          clearTimeout(timeoutId);
          if (signal) signal.removeEventListener('abort', onAbort);
        }
        await delay(TTS_RETRY_BACKOFF_MS * (attempt + 1));
      }
    }

    const direct = await fetchDirectKokoroBuffer({ ...seg, voice }, voice, signal);
    if (direct) return direct;
  }

  return null;
}
