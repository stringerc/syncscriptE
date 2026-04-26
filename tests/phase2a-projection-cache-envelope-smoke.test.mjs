import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('projection cache envelope utilities exist', async () => {
  const projectionEnvelope = await read('src/contracts/projections/projection-cache-envelope.ts');
  const markers = [
    'ProjectionCacheEnvelope',
    'projectionVersion',
    'sourceEventCursor',
    'generatedAt',
    'readProjectionEnvelope',
    'writeProjectionEnvelope',
  ];
  for (const marker of markers) {
    assert.ok(projectionEnvelope.includes(marker), `Expected projection envelope marker "${marker}"`);
  }
});

test('phase2a projection stores use envelope metadata', async () => {
  const reconciliationLog = await read('src/contracts/projections/reconciliation-log.ts');
  const reconciliationSnapshots = await read('src/contracts/projections/reconciliation-snapshots.ts');
  const surfaceRuntime = await read('src/contracts/projections/surface-parity-runtime.ts');
  const surfaceIncidents = await read('src/contracts/projections/surface-parity-incidents.ts');

  const markers = [
    reconciliationLog.includes('readProjectionEnvelope') && reconciliationLog.includes('writeProjectionEnvelope'),
    reconciliationSnapshots.includes('readProjectionEnvelope') &&
      reconciliationSnapshots.includes('writeProjectionEnvelope'),
    surfaceRuntime.includes('readProjectionEnvelope') && surfaceRuntime.includes('writeProjectionEnvelope'),
    surfaceIncidents.includes('readProjectionEnvelope') && surfaceIncidents.includes('writeProjectionEnvelope'),
    surfaceIncidents.includes('surface-parity-drift-state'),
  ];
  assert.ok(markers.every(Boolean), 'Expected projection envelope wiring across phase2a stores');
});
