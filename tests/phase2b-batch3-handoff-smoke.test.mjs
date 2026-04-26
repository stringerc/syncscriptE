import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('phase2b batch3 gate report declares go with operator signoff evidence', async () => {
  const report = await read('PHASE_2B_BATCH3_GATE_REPORT.md');
  const markers = [
    'Status: **GO (operator signoff completed in authenticated production workspace)**',
    'Gate Results',
    'Latest Deployment Evidence',
    'Operator Signoff Evidence (Completed)',
    'phase2b-batch3-goal-strict-proof',
    'phase2b-batch3-project-strict-proof',
  ];
  for (const marker of markers) {
    assert.ok(report.includes(marker), `Missing batch3 gate marker "${marker}"`);
  }
});

test('phase2b batch3 handoff doc confirms batch4-ready closeout', async () => {
  const handoff = await read('PHASE_2B_BATCH3_HANDOFF.md');
  const markers = [
    'Handoff Status: **READY_FOR_BATCH4**',
    'Batch 3 Operator Closeout (Completed)',
    'Batch 4 First Execution Steps',
    'Verification Protocol for Batch 4 (Mandatory)',
    'Rollback Triggers',
  ];
  for (const marker of markers) {
    assert.ok(handoff.includes(marker), `Missing batch3 handoff marker "${marker}"`);
  }
});
