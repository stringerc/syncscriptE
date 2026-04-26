import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('phase2a authority map covers critical domains', async () => {
  const doc = await read('PHASE_2A_AUTHORITY_MIGRATION_MAP.md');
  const domains = [
    'Tasks',
    'Workstream',
    'Goals',
    'Calendar events',
    'Team and assignment',
    'Integrations',
    'Financials',
    'Resonance',
  ];
  for (const domain of domains) {
    assert.ok(doc.includes(domain), `Missing domain "${domain}" in authority map`);
  }
});

test('phase2a implementation plan has staged execution', async () => {
  const doc = await read('PHASE_2A_IMPLEMENTATION_PLAN.md');
  const checkpoints = [
    'Stage 0',
    'Stage 1',
    'Stage 2',
    'Stage 3',
    'Stage 4',
    'Definition of Done',
  ];
  for (const checkpoint of checkpoints) {
    assert.ok(doc.includes(checkpoint), `Missing checkpoint "${checkpoint}" in implementation plan`);
  }
});
