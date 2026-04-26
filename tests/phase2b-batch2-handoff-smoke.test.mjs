import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('phase2b readiness gate report declares batch2 go status and checks', async () => {
  const report = await read('PHASE_2B_READINESS_GATE_REPORT.md');
  const markers = [
    'Status: **GO (Batch 2 handoff approved)**',
    'Batch 2 Entry Preconditions',
    'Latest Deployment Evidence',
    'Task-calendar parity remains deterministic under replay.',
  ];
  for (const marker of markers) {
    assert.ok(report.includes(marker), `Missing readiness report marker "${marker}"`);
  }
});

test('phase2b batch2 handoff doc captures rollout and rollback controls', async () => {
  const handoff = await read('PHASE_2B_BATCH2_HANDOFF.md');
  const markers = [
    'Handoff Status: **READY**',
    'Batch 2 First Execution Steps',
    'Verification Protocol for Batch 2 (Mandatory)',
    'Rollback Triggers',
  ];
  for (const marker of markers) {
    assert.ok(handoff.includes(marker), `Missing batch2 handoff marker "${marker}"`);
  }
});
