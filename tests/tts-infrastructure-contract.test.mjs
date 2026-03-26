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

test('api/ai/tts exposes GET health with kokoroConfigured (no secrets)', () => {
  const src = readFileSync(join(root, 'api/ai/tts.ts'), 'utf8');
  assert.match(src, /req\.method === ['"]GET['"]/, 'GET handler for health check');
  assert.match(src, /kokoroConfigured/, 'response includes kokoroConfigured');
  assert.match(src, /NO_TTS_URL/, 'POST still documents NO_TTS_URL');
});

test('tts-proxy-session coordinates Nexus + useVoiceStream', () => {
  const src = readFileSync(join(root, 'src/utils/tts-proxy-session.ts'), 'utf8');
  assert.match(src, /disableTtsProxyForSession/);
  assert.match(src, /isTtsProxyDisabled/);
});
