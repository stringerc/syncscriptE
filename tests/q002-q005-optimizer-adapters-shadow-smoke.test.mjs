import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('optimizer adapter toggles and provider factory are present', () => {
  const adapters = read('src/orchestration/optimization-adapters.ts');
  const markers = [
    'OptimizationProviderToggleConfig',
    'buildOptimizationProviders',
    'readOptimizationProviderConfigFromEnv',
    'OPTIMIZER_CLASSICAL_LOCAL_ENABLED',
    'OPTIMIZER_CLASSICAL_CLOUD_ENABLED',
    'OPTIMIZER_QUANTUM_PILOT_ENABLED',
    'OPTIMIZER_QUANTUM_PILOT_LIVE_ENABLED',
    'OPTIMIZER_QUANTUM_PILOT_EXTERNAL_URL',
    'OPTIMIZER_QUANTUM_PILOT_TIMEOUT_MS',
    'executeQuantumPilotExternal',
  ];
  for (const marker of markers) {
    assert.ok(adapters.includes(marker), `Expected optimization adapter marker "${marker}"`);
  }
});

test('shadow comparison integration is wired into provider rail', () => {
  const rail = read('src/orchestration/optimization-provider.ts');
  const markers = [
    'OptimizationRailOptions',
    'shadowMode',
    'onShadowComparison',
    'executeShadowComparison',
    'shadowComparison',
    'shadowPassed',
    'attemptedProviders',
  ];
  for (const marker of markers) {
    assert.ok(rail.includes(marker), `Expected provider rail marker "${marker}"`);
  }
});
