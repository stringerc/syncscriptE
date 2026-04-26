import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('phase2b execution plan contains batch tracker with all waves', async () => {
  const doc = await read('PHASE_2B_EXECUTION_PLAN.md');
  const batches = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6'];
  for (const batch of batches) {
    assert.ok(doc.includes(`| ${batch} |`), `Missing batch row "${batch}" in Phase 2B execution plan`);
  }
});

test('phase2b execution plan defines operating and validation protocol', async () => {
  const doc = await read('PHASE_2B_EXECUTION_PLAN.md');
  const markers = [
    'Operating Model',
    'Validation Protocol (Per Batch)',
    'Batch 1 Detail (Immediate)',
  ];
  assert.ok(doc.includes(markers[0]), `Missing marker "${markers[0]}" in execution plan`);
  assert.ok(doc.includes(markers[1]), `Missing marker "${markers[1]}" in execution plan`);
  assert.ok(doc.includes('Rollback Plan'), 'Missing "Rollback Plan" section in execution plan');
});
