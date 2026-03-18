import type { FinancialAnomaly, FinancialOutcomeMetrics, FinancialSnapshot } from '../types/financials';
import { analytics } from './analytics';

interface FinancialOutcomeSample {
  t: number;
  netMonthlyCashflow: number;
  monthlyInflow: number;
  monthlyOutflow: number;
  runwayMonths: number;
  anomalyCount: number;
  highRiskAnomalyCount: number;
}

const STORAGE_KEY = 'syncscript_financial_outcomes_v1';
const LAST_SENT_KEY = 'syncscript_financial_outcomes_last_sent_v1';
const MAX_SAMPLES = 120;
const TELEMETRY_MIN_INTERVAL_MS = 60_000;

function readHistory(): FinancialOutcomeSample[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(history: FinancialOutcomeSample[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_SAMPLES)));
  } catch {
    // best effort
  }
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function pct(value: number): number {
  return Number((value * 100).toFixed(2));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function overdraftRiskScore(sample: FinancialOutcomeSample): number {
  const runwayRisk = sample.runwayMonths <= 0 ? 1 : clamp(1 - sample.runwayMonths / 6, 0, 1);
  const cashflowRisk = sample.netMonthlyCashflow < 0 ? clamp(Math.abs(sample.netMonthlyCashflow) / Math.max(1, sample.monthlyOutflow), 0, 1) : 0;
  const anomalyRisk = clamp((sample.highRiskAnomalyCount * 0.4) + (sample.anomalyCount * 0.08), 0, 1);
  return clamp((runwayRisk * 0.45) + (cashflowRisk * 0.35) + (anomalyRisk * 0.2), 0, 1);
}

function savingsRate(sample: FinancialOutcomeSample): number {
  return (sample.monthlyInflow - sample.monthlyOutflow) / Math.max(1, sample.monthlyInflow);
}

function computeTrendPct(previous: number, current: number): number {
  if (!Number.isFinite(previous) || !Number.isFinite(current)) return 0;
  if (Math.abs(previous) < 1e-6) return current === 0 ? 0 : current > 0 ? 100 : -100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function computeForecastMissRatePct(history: FinancialOutcomeSample[]): number {
  if (history.length < 3) return 0;
  const misses: number[] = [];
  for (let i = 1; i < history.length; i += 1) {
    const expected = history[i - 1].netMonthlyCashflow;
    const actual = history[i].netMonthlyCashflow;
    const miss = Math.abs(actual - expected) / Math.max(1, Math.abs(expected));
    misses.push(clamp(miss, 0, 2));
  }
  return pct(average(misses));
}

function computeInterventionSuccessRatePct(history: FinancialOutcomeSample[]): number {
  if (history.length < 2) return 0;
  let successes = 0;
  let opportunities = 0;
  for (let i = 1; i < history.length; i += 1) {
    const prev = history[i - 1];
    const curr = history[i];
    const prevRisk = overdraftRiskScore(prev);
    const currRisk = overdraftRiskScore(curr);
    const prevSavings = savingsRate(prev);
    const currSavings = savingsRate(curr);
    const hadRiskSignal = prevRisk > 0.2 || prev.anomalyCount > 0 || prev.netMonthlyCashflow < 0;
    if (!hadRiskSignal) continue;
    opportunities += 1;
    if (currRisk <= prevRisk || currSavings >= prevSavings) successes += 1;
  }
  if (!opportunities) return 100;
  return pct(successes / opportunities);
}

export function updateFinancialOutcomeMetrics(
  snapshot: FinancialSnapshot,
  anomalies: FinancialAnomaly[],
): FinancialOutcomeMetrics {
  const nextSample: FinancialOutcomeSample = {
    t: Date.now(),
    netMonthlyCashflow: Number(snapshot.netMonthlyCashflow || 0),
    monthlyInflow: Number(snapshot.monthlyInflow || 0),
    monthlyOutflow: Number(snapshot.monthlyOutflow || 0),
    runwayMonths: Number(snapshot.runwayMonths || 0),
    anomalyCount: Number(snapshot.anomalyCount || anomalies.length || 0),
    highRiskAnomalyCount: anomalies.filter((item) => item.severity === 'high').length,
  };

  const history = [...readHistory(), nextSample].slice(-MAX_SAMPLES);
  writeHistory(history);

  const windowSize = Math.min(history.length, 14);
  const recent = history.slice(-windowSize);
  const previous = history.slice(-(windowSize * 2), -windowSize);

  const recentRisk = average(recent.map(overdraftRiskScore));
  const previousRisk = average(previous.map(overdraftRiskScore));
  const recentSavings = average(recent.map(savingsRate));
  const previousSavings = average(previous.map(savingsRate));

  const metrics: FinancialOutcomeMetrics = {
    windowSize,
    overdraftRiskTrendPct: Number((-computeTrendPct(previousRisk, recentRisk)).toFixed(2)),
    savingsRateTrendPct: Number(computeTrendPct(previousSavings, recentSavings).toFixed(2)),
    forecastMissRatePct: Number(computeForecastMissRatePct(recent).toFixed(2)),
    interventionSuccessRatePct: Number(computeInterventionSuccessRatePct(recent).toFixed(2)),
    measuredAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    const lastSent = Number(window.sessionStorage.getItem(LAST_SENT_KEY) || 0);
    const now = Date.now();
    if (now - lastSent >= TELEMETRY_MIN_INTERVAL_MS) {
      window.sessionStorage.setItem(LAST_SENT_KEY, String(now));
      analytics.trackEvent({
        category: 'Financials',
        action: 'financial_outcome_metrics_snapshot',
        value: Math.round(metrics.interventionSuccessRatePct),
        overdraft_risk_trend_pct: metrics.overdraftRiskTrendPct,
        savings_rate_trend_pct: metrics.savingsRateTrendPct,
        forecast_miss_rate_pct: metrics.forecastMissRatePct,
        intervention_success_rate_pct: metrics.interventionSuccessRatePct,
        sample_window: metrics.windowSize,
      });
    }
  }

  return metrics;
}
