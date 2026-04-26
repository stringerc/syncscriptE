import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('phase2 to phase2a continuity checklist exists with core sections', async () => {
  const doc = await read('PHASE_2_TO_2A_CONTINUITY_CHECKLIST.md');
  const markers = [
    'Phase 2 Baseline Commitments',
    'Phase 2A Migration Guardrails',
    'Must-Pass Gates Per Change',
    'Change Control Rule',
  ];
  for (const marker of markers) {
    assert.ok(doc.includes(marker), `Missing marker "${marker}" in continuity checklist`);
  }
});

test('continuity checklist references phase2 baseline sources', async () => {
  const doc = await read('PHASE_2_TO_2A_CONTINUITY_CHECKLIST.md');
  const references = [
    'src/PHASE_2_COMPLETE_SUMMARY.md',
    'src/PHASE_2_PROGRESS.md',
    'src/PHASE_2_RESEARCH_SUMMARY.md',
  ];
  for (const ref of references) {
    assert.ok(doc.includes(ref), `Missing baseline source reference "${ref}"`);
  }
});
