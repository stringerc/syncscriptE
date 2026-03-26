#!/usr/bin/env node
/**
 * Live verification: GET /api/ai/tts returns JSON with kokoroConfigured.
 * Optional --post: one POST to confirm Kokoro returns audio (exit 0) or report error (exit 2 = upstream unreachable).
 *
 * Usage:
 *   node tests/verify-tts-production.mjs
 *   node tests/verify-tts-production.mjs --strict
 *   node tests/verify-tts-production.mjs --post
 *   TTS_VERIFY_URL=https://www.syncscript.app/api/ai/tts node tests/verify-tts-production.mjs --post
 */
const url = process.env.TTS_VERIFY_URL || 'https://www.syncscript.app/api/ai/tts';
const strict = process.argv.includes('--strict');
const doPost = process.argv.includes('--post');

const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
const text = await res.text();
let body;
try {
  body = JSON.parse(text);
} catch {
  console.error(`Expected JSON health body from GET ${url}, got HTTP ${res.status}:\n${text.slice(0, 500)}`);
  if (res.status === 405) {
    console.error('Hint: deploy api/ai/tts.ts with GET health handler, then retry.');
  }
  process.exit(1);
}

console.log(JSON.stringify({ httpStatus: res.status, body }, null, 2));

if (!res.ok) {
  console.error('GET health did not return 2xx');
  process.exit(1);
}

if (typeof body.kokoroConfigured !== 'boolean') {
  console.error('Missing kokoroConfigured boolean — deploy api/ai/tts GET handler');
  process.exit(1);
}

if (strict && !body.kokoroConfigured) {
  console.error('Strict mode: kokoroConfigured is false — set KOKORO_TTS_URL on Vercel');
  process.exit(1);
}

if (!doPost) {
  process.exit(0);
}

const postRes = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'TTS verify.', voice: 'natural', speed: 1 }),
});
const ct = postRes.headers.get('content-type') || '';
const buf = await postRes.arrayBuffer();
const postSummary = {
  httpStatus: postRes.status,
  contentType: ct,
  bytes: buf.byteLength,
};

if (postRes.ok && ct.startsWith('audio/') && buf.byteLength > 100) {
  console.log(JSON.stringify({ post: postSummary, synthesis: 'ok' }, null, 2));
  process.exit(0);
}

let errJson = {};
try {
  errJson = JSON.parse(new TextDecoder().decode(buf.slice(0, 2000)));
} catch {
  /* ignore */
}
console.log(JSON.stringify({ post: postSummary, error: errJson }, null, 2));

if (errJson.code === 'UNREACHABLE' || errJson.code === 'KOKORO_ERROR' || errJson.code === 'TIMEOUT') {
  console.error(
    'POST synthesis failed: Vercel cannot reach Kokoro at KOKORO_TTS_URL (tunnel, DNS, firewall, or Kokoro down).',
  );
  process.exit(2);
}

if (errJson.code === 'NO_TTS_URL') {
  console.error('POST: KOKORO_TTS_URL not set on Vercel.');
  process.exit(1);
}

process.exit(1);
