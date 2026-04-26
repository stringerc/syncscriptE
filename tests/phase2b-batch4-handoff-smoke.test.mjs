import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('phase2b batch4 gate report declares go with operator signoff evidence', async () => {
  const report = await read('PHASE_2B_BATCH4_GATE_REPORT.md');
  const markers = [
    'Status: **GO (operator signoff completed in authenticated production workspace)**',
    'Gate Results',
    'Latest Deployment Evidence',
    'Operator Signoff Evidence (Completed)',
    'phase2b-batch4-ai-strict-proof',
    'phase2b-batch4-resonance-strict-proof',
  ];
  for (const marker of markers) {
    assert.ok(report.includes(marker), `Missing batch4 gate marker "${marker}"`);
  }
});

test('phase2b batch4 handoff doc confirms batch5-ready closeout', async () => {
  const handoff = await read('PHASE_2B_BATCH4_HANDOFF.md');
  const markers = [
    'Handoff Status: **READY_FOR_BATCH5**',
    'Batch 4 Operator Closeout (Completed)',
    'Batch 5 First Execution Steps',
    'Verification Protocol for Batch 5 (Mandatory)',
    'Rollback Triggers',
  ];
  for (const marker of markers) {
    assert.ok(handoff.includes(marker), `Missing batch4 handoff marker "${marker}"`);
  }
});
