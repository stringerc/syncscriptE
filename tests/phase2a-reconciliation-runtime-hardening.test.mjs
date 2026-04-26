import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('projects reconciliation runtime includes idempotency lock and safe mode', async () => {
  const file = await read('src/components/projects/ProjectsOperatingSystem.tsx');
  const markers = [
    'parityApplyLockRef',
    'paritySafeMode',
    'createReconciliationRunId',
    'hasReconciliationActionApplied',
    'Safe mode dry run',
    'Simulate high-confidence fixes',
  ];
  for (const marker of markers) {
    assert.ok(file.includes(marker), `Expected marker "${marker}" in ProjectsOperatingSystem`);
  }
});

test('projects reconciliation runtime includes post-apply verification loop', async () => {
  const file = await read('src/components/projects/ProjectsOperatingSystem.tsx');
  const markers = [
    'Post-apply verification loop',
    'buildTaskCalendarParityReport',
    'Parity reconciliation verification warning',
  ];
  for (const marker of markers) {
    assert.ok(file.includes(marker), `Expected marker "${marker}" in ProjectsOperatingSystem`);
  }
});
