import type { FinancialScenarioInput, FinancialScenarioResult, FinancialSnapshot } from '../types/financials';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

export function simulateFinancialScenario(
  snapshot: FinancialSnapshot,
  input: FinancialScenarioInput,
): FinancialScenarioResult {
  const safeInput: FinancialScenarioInput = {
    horizonMonths: clamp(Math.round(input.horizonMonths || 3), 1, 24),
    expenseReductionPct: clamp(Number(input.expenseReductionPct || 0), 0, 80),
    incomeGrowthPct: clamp(Number(input.incomeGrowthPct || 0), 0, 200),
    oneTimeCashInjection: Math.max(0, Number(input.oneTimeCashInjection || 0)),
    reservePct: clamp(Number(input.reservePct || 15), 0, 80),
  };

  const baselineNet = Number(snapshot.netMonthlyCashflow || 0);
  const baselineOutflow = Number(snapshot.monthlyOutflow || 0);
  const baselineRunway = Number(snapshot.runwayMonths || 0);
  const baselineReserve = round2((Number(snapshot.totalCash || 0) * safeInput.reservePct) / 100);

  const adjustedOutflow = baselineOutflow * (1 - safeInput.expenseReductionPct / 100);
  const adjustedInflow = Number(snapshot.monthlyInflow || 0) * (1 + safeInput.incomeGrowthPct / 100);
  const scenarioNet = adjustedInflow - adjustedOutflow;
  const scenarioCash = Number(snapshot.totalCash || 0) + safeInput.oneTimeCashInjection;
  const scenarioReserve = round2((scenarioCash * safeInput.reservePct) / 100);
  const denominator = Math.max(1, Math.abs(adjustedOutflow));
  const scenarioRunway = scenarioCash > 0 ? scenarioCash / denominator : 0;

  const horizonWeight = clamp(safeInput.horizonMonths / 12, 0.1, 2);
  const weightedRunwayDelta = (scenarioRunway - baselineRunway) * horizonWeight;

  return {
    assumptions: safeInput,
    baseline: {
      projectedRunwayMonths: round2(baselineRunway),
      projectedNetMonthlyCashflow: round2(baselineNet),
      projectedReserveAmount: round2(baselineReserve),
    },
    scenario: {
      projectedRunwayMonths: round2(scenarioRunway),
      projectedNetMonthlyCashflow: round2(scenarioNet),
      projectedReserveAmount: round2(scenarioReserve),
    },
    delta: {
      runwayMonths: round2(weightedRunwayDelta),
      netMonthlyCashflow: round2(scenarioNet - baselineNet),
      reserveAmount: round2(scenarioReserve - baselineReserve),
    },
    rationale: [
      `Expense reduction applied: ${safeInput.expenseReductionPct.toFixed(1)}%`,
      `Income growth applied: ${safeInput.incomeGrowthPct.toFixed(1)}%`,
      `One-time cash injection: $${safeInput.oneTimeCashInjection.toLocaleString()}`,
      `Reserve policy set to ${safeInput.reservePct.toFixed(1)}% of total cash`,
      `Projection horizon: ${safeInput.horizonMonths} month(s)`,
    ],
    generatedAt: new Date().toISOString(),
  };
}
