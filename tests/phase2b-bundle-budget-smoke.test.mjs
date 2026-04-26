import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('phase2b roadmap declares bundle targets and perf hardening scope', async () => {
  const doc = await read('PHASE_2B_BACKEND_CUTOVER_AND_PERFORMANCE_ROADMAP.md');
  const markers = [
    'Batch 6: Performance Hardening (Bundle/Chunking)',
    'no core route chunk > 500 kB uncompressed',
    'route-level split strategy',
    'manual chunk policy',
  ];
  for (const marker of markers) {
    assert.ok(doc.includes(marker), `Missing bundle marker "${marker}" in Phase 2B roadmap`);
  }
});

test('package scripts expose phase2b gate entry points', async () => {
  const pkg = await read('package.json');
  const scripts = [
    'test:phase2b-roadmap-smoke',
    'test:phase2b-execution-plan-smoke',
    'test:phase2b-bundle-budget-smoke',
    'test:phase2b-readiness-smoke',
  ];
  for (const script of scripts) {
    assert.ok(pkg.includes(`"${script}"`), `Missing package script "${script}"`);
  }
});
