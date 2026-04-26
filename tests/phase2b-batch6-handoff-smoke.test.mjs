import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('phase2b batch6 gate report declares go with bundle budget cleared', async () => {
  const report = await read('PHASE_2B_BATCH6_GATE_REPORT.md');
  const markers = [
    'Status: **GO (bundle warning budget cleared, validation and deploy completed)**',
    'Gate Results',
    'Bundle warning budget',
    'Performance delta (build artifact level)',
    'TasksGoalsPage',
    'Latest Deployment Evidence',
  ];
  for (const marker of markers) {
    assert.ok(report.includes(marker), `Missing batch6 gate marker "${marker}"`);
  }
});

test('phase2b batch6 handoff doc confirms phase2b closeout readiness', async () => {
  const handoff = await read('PHASE_2B_BATCH6_HANDOFF.md');
  const markers = [
    'Handoff Status: **READY_FOR_PHASE2B_CLOSEOUT (all dependencies satisfied)**',
    'What Is Complete',
    'Remaining Operational Dependency',
    'Program Closeout Steps (Completed)',
    'Rollback Triggers',
  ];
  for (const marker of markers) {
    assert.ok(handoff.includes(marker), `Missing batch6 handoff marker "${marker}"`);
  }
});
