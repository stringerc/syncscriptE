import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('reconciliation audit export markers are present', async () => {
  const projectsOs = await read('src/components/projects/ProjectsOperatingSystem.tsx');
  const markers = [
    'handleExportReconciliationHistory',
    'reconciliationModeFilter',
    'reconciliationOutcomeFilter',
    'Export',
    'filteredReconciliationHistory',
    'listReconciliationSnapshots',
  ];
  for (const marker of markers) {
    assert.ok(projectsOs.includes(marker), `Expected marker "${marker}" in ProjectsOperatingSystem`);
  }
});

test('reconciliation snapshots storage utilities exist', async () => {
  const snapshots = await read('src/contracts/projections/reconciliation-snapshots.ts');
  const markers = [
    'appendReconciliationSnapshot',
    'listReconciliationSnapshots',
    'beforeState',
    'afterState',
  ];
  for (const marker of markers) {
    assert.ok(snapshots.includes(marker), `Expected marker "${marker}" in reconciliation snapshots module`);
  }
});
