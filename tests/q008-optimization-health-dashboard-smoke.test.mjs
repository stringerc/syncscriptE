import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('enterprise tools page includes optimization health dashboard controls', () => {
  const page = read('src/components/pages/EnterpriseToolsPage.tsx');
  const markers = [
    'Optimization Health',
    'Success Rate',
    'Fallback Rate',
    'Replay Pass Rate',
    'P50/P95 Latency',
    'Export incidents',
    'optimizationProviderFilter',
    'optimizationRouteFilter',
    'optimizationWorkspaceFilter',
    'exportOptimizationIncidents',
    'filteredOptimizationRows',
  ];
  for (const marker of markers) {
    assert.ok(page.includes(marker), `Expected marker "${marker}"`);
  }
});
