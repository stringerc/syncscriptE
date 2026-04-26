import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('phase2b roadmap covers all execution batches', async () => {
  const doc = await read('PHASE_2B_BACKEND_CUTOVER_AND_PERFORMANCE_ROADMAP.md');
  const markers = [
    'Batch 1: Backend Contract Runtime Foundation',
    'Batch 2: Schedule + Task Authority Flip',
    'Batch 3: Goal + Project + Assignment Authority Flip',
    'Batch 4: AI + Resonance Read-Path Hard Cut',
    'Batch 5: Data Migration and Historical Backfill',
    'Batch 6: Performance Hardening (Bundle/Chunking)',
  ];
  for (const marker of markers) {
    assert.ok(doc.includes(marker), `Missing Phase 2B roadmap marker "${marker}"`);
  }
});

test('phase2b roadmap defines rollback and verification controls', async () => {
  const doc = await read('PHASE_2B_BACKEND_CUTOVER_AND_PERFORMANCE_ROADMAP.md');
  const controls = [
    'Rollback Policy',
    'Immediate rollback triggers',
    'Test and Verification Protocol (Per Batch)',
    'feature flag for backend authority toggle by domain',
  ];
  for (const control of controls) {
    assert.ok(doc.includes(control), `Missing control "${control}" in Phase 2B roadmap`);
  }
});
