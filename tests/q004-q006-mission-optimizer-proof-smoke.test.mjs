import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('mission cockpit surfaces optimizer delta and proof packet export', () => {
  const page = read('src/components/pages/MissionCockpitPage.tsx');
  const markers = [
    'exportOptimizationProofPacket',
    'Optimization Delta Summary',
    'solverType',
    'solverVersion',
    'reproducibilityToken',
    'replayMismatchDetails',
  ];
  for (const marker of markers) {
    assert.ok(page.includes(marker), `Expected mission optimizer proof marker "${marker}"`);
  }
});
