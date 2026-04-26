import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('financial scenario engine provides deterministic simulation contract', () => {
  const util = read('src/utils/financial-scenario-engine.ts');
  const markers = [
    'simulateFinancialScenario',
    'horizonMonths',
    'expenseReductionPct',
    'incomeGrowthPct',
    'oneTimeCashInjection',
    'reservePct',
    'delta',
    'rationale',
  ];
  for (const marker of markers) {
    assert.ok(util.includes(marker), `Expected marker "${marker}"`);
  }
});

test('financial hook and page wire scenario engine output', () => {
  const hook = read('src/hooks/useFinancialIntelligence.ts');
  const page = read('src/components/pages/FinancialsPage.tsx');
  assert.ok(hook.includes('runScenario'));
  assert.ok(hook.includes('latestScenarioResult'));
  assert.ok(page.includes('Deterministic What-If Scenario'));
  assert.ok(page.includes('Run scenario'));
  assert.ok(page.includes('Runway delta'));
});
