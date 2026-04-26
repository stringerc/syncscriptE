import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('phase2b batch5 gate report declares go with captured operator evidence', async () => {
  const report = await read('PHASE_2B_BATCH5_GATE_REPORT.md');
  const markers = [
    'Status: **GO (operator evidence captured)**',
    'Gate Results',
    'Latest Deployment Evidence',
    'Operator Evidence Capture (Completed)',
    'phase2b-batch5-migration-apply-evidence',
    'phase2b-batch5-rollout-gate-proof',
  ];
  for (const marker of markers) {
    assert.ok(report.includes(marker), `Missing batch5 gate marker "${marker}"`);
  }
});

test('phase2b batch5 handoff doc confirms batch6-ready with signoff completed', async () => {
  const handoff = await read('PHASE_2B_BATCH5_HANDOFF.md');
  const markers = [
    'Handoff Status: **READY_FOR_BATCH6 (operator evidence captured)**',
    'Batch 5 Operator Closeout (Completed)',
    'Batch 6 First Execution Steps',
    'Verification Protocol for Batch 6 (Mandatory)',
    'Rollback Triggers',
  ];
  for (const marker of markers) {
    assert.ok(handoff.includes(marker), `Missing batch5 handoff marker "${marker}"`);
  }
});
