import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function read(rel) {
  return readFileSync(join(__dirname, '../', rel), 'utf8');
}

test('Landing page wires Nexus voice (startCall, guest API path)', () => {
  const landing = read('src/components/pages/LandingPage.tsx');
  assert.match(landing, /useNexusVoiceCall/);
  assert.match(landing, /startCall/);
  assert.match(landing, /endCall/);
  assert.match(landing, /Try Voice Calling/);
});

test('NexusVoiceCallContext calls guest + TTS endpoints', () => {
  const ctx = read('src/contexts/NexusVoiceCallContext.tsx');
  assert.match(ctx, /NEXUS_GUEST_CHAT_PATH/);
  assert.match(ctx, /['"]\/api\/ai\/tts['"]/);
});

test('App wraps marketing route with NexusVoiceCallProvider + overlay', () => {
  const app = read('src/App.tsx');
  assert.match(app, /NexusVoiceCallProvider/);
  assert.match(app, /NexusVoiceOverlay/);
});

test('Vite dev proxy includes deterministic pricing for nexus-guest', () => {
  const vite = read('vite.config.ts');
  assert.match(vite, /PRICING_INTENT_RE_DEV/);
  assert.match(vite, /buildDevPricingReply/);
  assert.match(vite, /public-plans\.json/);
});
