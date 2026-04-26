import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('financial backend centralizes explainability contract enforcement', () => {
  const source = read('supabase/functions/make-server-57781ad9/financial-routes.tsx');
  const markers = [
    'interface ExplainableFinancialRecommendation',
    'assertFinancialRecommendationContract',
    'enforceFinancialRecommendationContract',
    'explainableRecommendation',
    'Recommendation missing inputsUsed',
    'Recommendation missing policyApplied',
    'Recommendation missing rollbackPath',
  ];
  for (const marker of markers) {
    assert.ok(source.includes(marker), `Expected explainability marker "${marker}"`);
  }
});
