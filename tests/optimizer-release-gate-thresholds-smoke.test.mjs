import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('optimizer release gate enforces threshold evidence fields', () => {
  const gate = read('scripts/release-gate-optimizer.mjs');
  const markers = [
    'optimizer-gate-evidence.latest.json',
    'minBenchmarkSampleSize',
    'minReplayPassRate',
    'minFallbackSafetyRate',
    'p95LatencyMs',
    'latencyBudgetMs',
    'replay pass rate',
    'fallback safety rate',
  ];
  for (const marker of markers) {
    assert.ok(gate.includes(marker), `Expected release gate marker "${marker}"`);
  }
});

test('optimizer threshold evidence bundle includes required sections', () => {
  const evidenceRaw = read('evidence/optimizer/optimizer-gate-evidence.latest.json');
  const evidence = JSON.parse(evidenceRaw);
  assert.ok(evidence.benchmark, 'Missing benchmark block');
  assert.ok(evidence.replay, 'Missing replay block');
  assert.ok(evidence.fallback, 'Missing fallback block');
  assert.ok(evidence.integrity, 'Missing integrity block');
});
