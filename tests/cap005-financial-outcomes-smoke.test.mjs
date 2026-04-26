import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('financial outcome telemetry utility exists with CAP-005 metrics', () => {
  const util = read('src/utils/financial-outcome-telemetry.ts');
  const markers = [
    'updateFinancialOutcomeMetrics',
    'overdraftRiskTrendPct',
    'savingsRateTrendPct',
    'forecastMissRatePct',
    'interventionSuccessRatePct',
    'financial_outcome_metrics_snapshot',
  ];
  for (const marker of markers) {
    assert.ok(util.includes(marker), `Expected marker "${marker}"`);
  }
});

test('financial hook and page expose CAP-005 metrics', () => {
  const hook = read('src/hooks/useFinancialIntelligence.ts');
  const page = read('src/components/pages/FinancialsPage.tsx');
  assert.ok(hook.includes('outcomeMetrics'));
  assert.ok(hook.includes('updateFinancialOutcomeMetrics'));
  assert.ok(page.includes('Overdraft risk trend'));
  assert.ok(page.includes('Savings-rate trend'));
  assert.ok(page.includes('Forecast miss rate'));
  assert.ok(page.includes('Intervention success'));
});
