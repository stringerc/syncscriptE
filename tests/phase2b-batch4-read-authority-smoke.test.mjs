import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('phase2b batch4 read authority runtime exposes ai and resonance backend-first flags', async () => {
  const runtime = await read('src/contracts/runtime/backend-read-authority.ts');
  const markers = [
    'VITE_PHASE2B_AUTHORITY_AI_READ_BACKEND',
    'VITE_PHASE2B_AUTHORITY_RESONANCE_READ_BACKEND',
    'VITE_PHASE2B_AUTHORITY_AI_READ_STRICT',
    'VITE_PHASE2B_AUTHORITY_RESONANCE_READ_STRICT',
    'executeReadAuthority',
    'backend_read_authority_preferred',
    'backend_read_authority_fallback_local',
    'READ_AUTHORITY_FLAG_KEYS',
  ];
  for (const marker of markers) {
    assert.ok(runtime.includes(marker), `Missing read authority marker "${marker}"`);
  }
});

test('phase2b batch4 read authority wiring is present for ai and resonance surfaces', async () => {
  const aiContext = await read('src/contexts/AIContext.tsx');
  const resonancePage = await read('src/components/pages/ResonanceEnginePage.tsx');

  const aiMarkers = [
    "surface: 'ai'",
    "domain: 'task'",
    "domain: 'goal'",
    "domain: 'schedule'",
    'ai.read.authority.observed',
  ];
  for (const marker of aiMarkers) {
    assert.ok(aiContext.includes(marker), `Missing AI read authority marker "${marker}"`);
  }

  const resonanceMarkers = [
    "surface: 'resonance'",
    "domain: 'task'",
    "domain: 'schedule'",
    'readAuthority',
  ];
  for (const marker of resonanceMarkers) {
    assert.ok(
      resonancePage.includes(marker),
      `Missing resonance read authority marker "${marker}"`,
    );
  }
});
