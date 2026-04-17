/**
 * Contract tests: TTS proxy env contract, CSP font-src for Vercel Live, shared client session helper.
 * Does not call Kokoro or require secrets.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('vercel.json CSP allows Vercel Live fonts (Geist)', () => {
  const raw = readFileSync(join(root, 'vercel.json'), 'utf8');
  assert.match(raw, /font-src[^;]*https:\/\/vercel\.live/, 'font-src must include https://vercel.live');
});

test('vercel.json CSP connect-src allows Cloudflare quick tunnels (Kokoro direct fallback)', () => {
  const raw = readFileSync(join(root, 'vercel.json'), 'utf8');
  assert.match(
    raw,
    /connect-src[^;]*https:\/\/\*\.trycloudflare\.com/,
    'connect-src must include https://*.trycloudflare.com for VITE_KOKORO_TTS_URL',
  );
});

test('vercel.json CSP connect-src allows syncscript subdomains (named tunnel on zone)', () => {
  const raw = readFileSync(join(root, 'vercel.json'), 'utf8');
  assert.match(
    raw,
    /connect-src[^;]*https:\/\/\*\.syncscript\.app/,
    'connect-src must include https://*.syncscript.app for KOKORO_TTS_URL on a subdomain',
  );
});

test('vercel.json CSP connect-src allows Pusher (realtime / bundled clients)', () => {
  const raw = readFileSync(join(root, 'vercel.json'), 'utf8');
  assert.match(raw, /wss:\/\/\*\.pusher\.com/, 'connect-src must allow Pusher WebSockets');
  assert.match(raw, /https:\/\/\*\.pusher\.com/, 'connect-src must allow Pusher HTTPS');
});

test('api/ai/tts exposes GET health with kokoroConfigured (no secrets)', () => {
  const src = readFileSync(join(root, 'api/ai/tts.ts'), 'utf8');
  assert.match(src, /req\.method === ['"]GET['"]/, 'GET handler for health check');
  assert.match(src, /kokoroConfigured/, 'response includes kokoroConfigured');
  assert.match(src, /kokoroDirectOrigin/, 'GET exposes Kokoro origin for browser direct fallback');
  assert.match(src, /probeKokoroHealth|kokoroUpstreamReachable/, 'GET may probe Kokoro /health when ?probe=1');
  assert.match(src, /NO_TTS_URL/, 'POST still documents NO_TTS_URL');
  assert.match(src, /KOKORO_TTS_FALLBACK_URL|KOKORO_FALLBACK_URL/, 'optional fallback Kokoro URL');
  assert.match(src, /tts_rum|handleTtsRumPost/, 'POST accepts kind=tts_rum RUM beacons');
});

test('GitHub workflow registers external TTS synthetic probe (Hobby cannot run sub-daily Vercel crons)', () => {
  const raw = readFileSync(join(root, '.github/workflows/tts-slo-probe.yml'), 'utf8');
  assert.match(raw, /probe=1/, 'workflow hits GET ?probe=1');
});

test('tts-proxy-session coordinates Nexus + useVoiceStream', () => {
  const src = readFileSync(join(root, 'src/utils/tts-proxy-session.ts'), 'utf8');
  assert.match(src, /disableTtsProxyForSession/);
  assert.match(src, /isTtsProxyDisabled/);
  assert.match(src, /resetTtsProxySession/);
});
