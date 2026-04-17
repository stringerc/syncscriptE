import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function read(rel) {
  return readFileSync(join(__dirname, '../', rel), 'utf8');
}

test('Nexus voice: AudioContext resume + Kokoro direct fallback (no browser SpeechSynthesis)', () => {
  const ctx = read('src/contexts/NexusVoiceCallContext.tsx');
  const markers = [
    'didAudioPlay()',
    'await this.ctx.resume()',
    'await ctx.resume()',
    'ttsVoiceCandidates',
    'fetchDirectKokoroBuffer',
    'KOKORO_DIRECT_URL',
    'isVoiceOrClientError',
    'ensureSpokenOrNotify',
    'player.didAudioPlay()',
    'setVoiceError',
  ];
  for (const m of markers) {
    assert.ok(ctx.includes(m), `Expected NexusVoiceCallContext to include "${m}"`);
  }
  assert.ok(
    !ctx.includes('speakBrowserUtterance'),
    'Nexus must not use browser SpeechSynthesis (robotic); speakBrowserUtterance should be absent',
  );
  assert.ok(
    !ctx.includes('speechSynthesis'),
    'NexusVoiceCallContext must not reference window.speechSynthesis',
  );
});

test('Nexus voice: SSE must not double-queue TTS (tokens + finalContent)', () => {
  const ctx = read('src/contexts/NexusVoiceCallContext.tsx');
  assert.match(ctx, /ttsQueuedFromTokens/);
  assert.match(ctx, /Already queued TTS from token stream/);
});

test('nexus-guest: omit finalContent when stream tokens were emitted', () => {
  const api = read('api/ai/nexus-guest.ts');
  assert.match(api, /emittedStreamToken/);
  assert.match(api, /fullContent\.trim\(\) && !emittedStreamToken/);
});

test('useVoiceStream: stop recognition restart on mic not-allowed', () => {
  const hook = read('src/hooks/useVoiceStream.ts');
  assert.match(hook, /event\.error === 'not-allowed'/);
  assert.match(hook, /shouldRestartRef\.current = false/);
});
