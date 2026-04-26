import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('resonance page emits canonical snapshot event with provenance', async () => {
  const resonance = await read('src/components/pages/ResonanceEnginePage.tsx');
  const markers = [
    "emitContractDomainEvent(",
    "'resonance.snapshot.computed'",
    "'resonance_snapshot'",
    'algorithmVersion: RESONANCE_ALGORITHM_VERSION',
    'taskInputCount',
    'eventInputCount',
    'provenance:',
    'sourceEventIds',
    'sourceTaskIds',
    "idempotencyKey: `resonance:${snapshotId}:",
  ];
  assert.ok(markers.every((marker) => resonance.includes(marker)), 'Expected resonance provenance event markers');
});
