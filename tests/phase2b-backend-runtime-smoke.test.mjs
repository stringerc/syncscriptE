import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('phase2b backend runtime store exposes ledger and idempotency helpers', async () => {
  const store = await read('api/_lib/contract-runtime-store.ts');
  const markers = [
    'appendCommandRecord',
    'appendDomainEvent',
    'commandIdempotencyMap',
    'eventIdempotencyMap',
    'readProjectionEnvelope',
  ];
  for (const marker of markers) {
    assert.ok(store.includes(marker), `Missing backend runtime marker "${marker}"`);
  }
});

test('phase2b roadmap documents hobby-plan function budget constraint handling', async () => {
  const roadmap = await read('PHASE_2B_BACKEND_CUTOVER_AND_PERFORMANCE_ROADMAP.md');
  const markers = [
    'Hobby plan function budget',
    'single endpoint multiplexer',
    'Supabase Edge Function',
  ];
  for (const marker of markers) {
    assert.ok(roadmap.includes(marker), `Missing deployment-constraint marker "${marker}"`);
  }
});

test('batch1 routes contract runtime through existing insights endpoint', async () => {
  const endpoint = await read('api/ai/insights.ts');
  const markers = [
    "resource === 'contract-runtime-command'",
    "resource === 'contract-runtime-event'",
    "resource === 'contract-runtime-projection'",
    'appendCommandRecord',
    'appendDomainEvent',
    'readProjectionEnvelope',
  ];
  for (const marker of markers) {
    assert.ok(endpoint.includes(marker), `Missing endpoint marker "${marker}" for contract runtime routing`);
  }
});
