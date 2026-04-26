import type { VercelRequest, VercelResponse } from '@vercel/node';

const MAX_AUDIO_BASE64_CHARS = 12_000_000;
const MIN_AUDIO_BASE64_CHARS = 120;
const BRIDGE_PATH = '/functions/v1/make-server-57781ad9/openclaw/voice/transcribe';
const UPSTREAM_TIMEOUT_MS = 8_000;
const GROQ_TIMEOUT_MS = 10_000;
const BRIDGE_MAX_RETRIES = 1;
const DEFAULT_SUPABASE_URL = 'https://kwhnrlzibgfedtxpkbgb.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3aG5ybHppYmdmZWR0eHBrYmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzk3OTMsImV4cCI6MjA3NjY1NTc5M30.vvV5Ksaq70soeLzwDr7AuXiUFPhwcRV4m78PD4qtFu8';

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const anonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_ANON_KEY;
  return { url, anonKey };
}

function extractTranscript(payload: any): { text: string; confidence: number } {
  const data = payload?.data ?? payload;
  const text =
    data?.transcription?.text ||
    data?.transcription ||
    data?.text ||
    '';
  const confidence =
    Number(data?.transcription?.confidence) ||
    Number(data?.confidence) ||
    0.8;

  return { text: String(text || '').trim(), confidence: Number.isFinite(confidence) ? confidence : 0.8 };
}

function extensionForMime(mimeType: string) {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
  return 'webm';
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function transcribeViaGroq(audioBase64: string, language: string, mimeType: string) {
  const groqKey = process.env.GROQ_API_KEY || '';
  if (!groqKey) return null;

  const bytes = Buffer.from(audioBase64, 'base64');
  if (!bytes.length) return null;

  const form = new FormData();
  const audioBlob = new Blob([bytes], { type: mimeType || 'audio/webm' });
  const ext = extensionForMime(mimeType || 'audio/webm');
  form.append('file', audioBlob, `audio.${ext}`);
  form.append('model', 'whisper-large-v3-turbo');
  form.append('response_format', 'verbose_json');
  form.append('temperature', '0');
  form.append('language', language || 'en');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
      },
      body: form,
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return null;

    return {
      text: String(payload?.text || '').trim(),
      confidence: 0.85,
      provider: 'groq-whisper',
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    return res.status(503).json({ error: 'STT backend not configured', code: 'NO_SUPABASE_CONFIG' });
  }

  const { audio, language, mimeType } = req.body || {};
  if (!audio || typeof audio !== 'string') {
    return res.status(400).json({ error: 'audio base64 string is required' });
  }
  if (audio.length < MIN_AUDIO_BASE64_CHARS) {
    return res.status(400).json({ error: 'audio payload too small' });
  }
  if (audio.length > MAX_AUDIO_BASE64_CHARS) {
    return res.status(400).json({ error: 'audio payload too large' });
  }

  const normalizedLanguage = typeof language === 'string' && language.trim() ? language : 'en';
  const normalizedMimeType = typeof mimeType === 'string' ? mimeType : 'audio/webm';

  let bridgeErrorCode = 'UPSTREAM_STT_ERROR';
  for (let attempt = 0; attempt <= BRIDGE_MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
      const bridgeRes = await fetch(`${url}${BRIDGE_PATH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          audio,
          language: normalizedLanguage,
          processingOptions: {
            addPunctuation: true,
            formatText: true,
            mimeType: normalizedMimeType,
          },
        }),
        signal: controller.signal,
      }).finally(() => {
        clearTimeout(timeout);
      });

      const payload = await bridgeRes.json().catch(() => ({}));
      if (bridgeRes.ok && payload?.success !== false) {
        const { text, confidence } = extractTranscript(payload);
        if (text) {
          return res.status(200).json({
            text,
            confidence,
            provider: 'openclaw',
          });
        }
      }

      bridgeErrorCode = payload?.code || `UPSTREAM_HTTP_${bridgeRes.status}`;
      const retryable = bridgeRes.status === 429 || bridgeRes.status >= 500;
      if (attempt < BRIDGE_MAX_RETRIES && retryable) {
        await sleep(250 * (attempt + 1));
        continue;
      }
      break;
    } catch (error: any) {
      bridgeErrorCode = error?.name === 'AbortError' ? 'UPSTREAM_TIMEOUT' : 'UNREACHABLE';
      if (attempt < BRIDGE_MAX_RETRIES) {
        await sleep(250 * (attempt + 1));
        continue;
      }
      break;
    }
  }

  const groqResult = await transcribeViaGroq(audio, normalizedLanguage, normalizedMimeType);
  if (groqResult?.text) {
    return res.status(200).json(groqResult);
  }

  res.setHeader('Retry-After', '8');
  return res.status(503).json({
    error: 'Voice transcription fallback is temporarily unavailable',
    code: bridgeErrorCode,
  });
}
