import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('quantum adapter SDK docs and example connector exist', () => {
  const docs = read('src/orchestration/QUANTUM_ADAPTER_SDK.md');
  const example = read('src/orchestration/examples/quantum-origin-pilot-adapter.example.ts');
  const docMarkers = [
    'Quantum Adapter SDK',
    'OptimizationProviderContract',
    'OPTIMIZER_QUANTUM_PILOT_ENABLED',
    'OPTIMIZER_QUANTUM_PILOT_LIVE_ENABLED',
    'OPTIMIZER_QUANTUM_PILOT_EXTERNAL_URL',
    'advisory-first',
    'shadowBaselineProviderId',
  ];
  const exampleMarkers = [
    'createQuantumOriginPilotAdapter',
    "providerId: 'quantum-origin-pilot'",
    'reproducibilityToken',
    'advisoryOnly: true',
  ];
  for (const marker of docMarkers) {
    assert.ok(docs.includes(marker), `Expected quantum SDK doc marker "${marker}"`);
  }
  for (const marker of exampleMarkers) {
    assert.ok(example.includes(marker), `Expected quantum adapter example marker "${marker}"`);
  }
});
