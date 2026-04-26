import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('phase2b final closeout report declares fully closed status', async () => {
  const report = await read('PHASE_2B_FINAL_CLOSEOUT_REPORT.md');
  const markers = [
    'Closeout Status: **FULLY_CLOSED**',
    'Executive Verdict',
    'Batch Outcomes',
    'Hard Gates Completed',
    'Final Evidence Capture',
    'Finalization Result',
  ];
  for (const marker of markers) {
    assert.ok(report.includes(marker), `Missing phase2b final closeout marker "${marker}"`);
  }
});

test('phase2b operator signoff runbook documents required production steps', async () => {
  const runbook = await read('PHASE_2B_OPERATOR_SIGNOFF_RUNBOOK.md');
  const markers = [
    'Mandatory Steps (in order)',
    'Generate Batch 5 migration dry-run plan',
    'Apply Batch 5 migration slice (idempotent)',
    'Export Batch 5 apply drift evidence',
    'Export Batch 5 rollout gate proof',
    'Post-Completion Updates',
  ];
  for (const marker of markers) {
    assert.ok(runbook.includes(marker), `Missing phase2b runbook marker "${marker}"`);
  }
});
