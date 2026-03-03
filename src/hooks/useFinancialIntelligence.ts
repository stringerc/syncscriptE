import { useMemo } from 'react';
import type {
  CashflowPoint,
  FinancialAccount,
  FinancialAnomaly,
  FinancialSnapshot,
  FinancialTransaction,
} from '../types/financials';

const DAY_MS = 24 * 60 * 60 * 1000;

export function useFinancialIntelligence() {
  const accounts = useMemo<FinancialAccount[]>(
    () => [
      { id: 'acct_checking', name: 'Operating Checking', type: 'checking', currency: 'USD', balance: 82450, institution: 'Sync Federal' },
      { id: 'acct_savings', name: 'Reserve Savings', type: 'savings', currency: 'USD', balance: 120000, institution: 'Sync Federal' },
      { id: 'acct_credit', name: 'Operations Card', type: 'credit', currency: 'USD', balance: -12840, institution: 'Prime Card' },
      { id: 'acct_invest', name: 'Treasury Yield', type: 'investment', currency: 'USD', balance: 64000, institution: 'Capital Markets' },
    ],
    [],
  );

  const transactions = useMemo<FinancialTransaction[]>(() => {
    const now = Date.now();
    return [
      { id: 'tx_01', accountId: 'acct_checking', type: 'income', amount: 18400, category: 'subscriptions', description: 'Weekly subscriptions payout', occurredAt: new Date(now - 2 * DAY_MS).toISOString(), recurring: true },
      { id: 'tx_02', accountId: 'acct_checking', type: 'expense', amount: 7200, category: 'payroll', description: 'Contract payroll run', occurredAt: new Date(now - 3 * DAY_MS).toISOString(), recurring: true },
      { id: 'tx_03', accountId: 'acct_credit', type: 'expense', amount: 1800, category: 'ads', merchant: 'Meta Ads', description: 'Campaign spend', occurredAt: new Date(now - 4 * DAY_MS).toISOString() },
      { id: 'tx_04', accountId: 'acct_checking', type: 'expense', amount: 950, category: 'infrastructure', merchant: 'Vercel', description: 'Hosting + compute', occurredAt: new Date(now - 5 * DAY_MS).toISOString(), recurring: true },
      { id: 'tx_05', accountId: 'acct_checking', type: 'expense', amount: 4400, category: 'payroll', description: 'Part-time payroll', occurredAt: new Date(now - 9 * DAY_MS).toISOString() },
      { id: 'tx_06', accountId: 'acct_checking', type: 'income', amount: 17300, category: 'subscriptions', description: 'Weekly subscriptions payout', occurredAt: new Date(now - 10 * DAY_MS).toISOString(), recurring: true },
      { id: 'tx_07', accountId: 'acct_credit', type: 'expense', amount: 4600, category: 'ads', merchant: 'Google Ads', description: 'Acquisition push', occurredAt: new Date(now - 12 * DAY_MS).toISOString() },
      { id: 'tx_08', accountId: 'acct_checking', type: 'expense', amount: 9900, category: 'payroll', description: 'Core team payroll', occurredAt: new Date(now - 16 * DAY_MS).toISOString(), recurring: true },
      { id: 'tx_09', accountId: 'acct_checking', type: 'income', amount: 16200, category: 'subscriptions', description: 'Weekly subscriptions payout', occurredAt: new Date(now - 17 * DAY_MS).toISOString(), recurring: true },
      { id: 'tx_10', accountId: 'acct_checking', type: 'expense', amount: 1300, category: 'tools', merchant: 'OpenAI + AI infra', description: 'AI tooling', occurredAt: new Date(now - 20 * DAY_MS).toISOString(), recurring: true },
      { id: 'tx_11', accountId: 'acct_checking', type: 'expense', amount: 22500, category: 'payroll', description: 'Quarterly bonus payout', occurredAt: new Date(now - 24 * DAY_MS).toISOString() },
      { id: 'tx_12', accountId: 'acct_checking', type: 'income', amount: 15500, category: 'subscriptions', description: 'Weekly subscriptions payout', occurredAt: new Date(now - 25 * DAY_MS).toISOString(), recurring: true },
    ];
  }, []);

  const snapshot = useMemo<FinancialSnapshot>(() => {
    const monthAgo = Date.now() - 30 * DAY_MS;
    const monthly = transactions.filter((t) => new Date(t.occurredAt).getTime() >= monthAgo);
    const monthlyInflow = monthly.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const monthlyOutflow = monthly.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netMonthlyCashflow = monthlyInflow - monthlyOutflow;
    const totalCash = accounts.reduce((sum, a) => sum + a.balance, 0);
    const burn = Math.max(0, monthlyOutflow - monthlyInflow);
    const runwayMonths = burn > 0 ? totalCash / burn : 24;

    return {
      totalCash,
      monthlyInflow,
      monthlyOutflow,
      netMonthlyCashflow,
      runwayMonths,
      anomalyCount: 0,
    };
  }, [accounts, transactions]);

  const cashflowSeries = useMemo<CashflowPoint[]>(() => {
    const points: CashflowPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = Date.now() - (i + 1) * 7 * DAY_MS;
      const end = Date.now() - i * 7 * DAY_MS;
      const windowTx = transactions.filter((t) => {
        const ts = new Date(t.occurredAt).getTime();
        return ts >= start && ts < end;
      });
      points.push({
        date: new Date(end).toISOString(),
        inflow: windowTx.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        outflow: windowTx.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      });
    }
    return points;
  }, [transactions]);

  const anomalies = useMemo<FinancialAnomaly[]>(() => {
    const expenseTx = transactions.filter((t) => t.type === 'expense');
    const sorted = [...expenseTx].map((t) => t.amount).sort((a, b) => a - b);
    const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
    const outlier = expenseTx.find((t) => t.amount >= median * 2.4 && t.amount > 5000);

    const result: FinancialAnomaly[] = [];
    if (outlier) {
      result.push({
        id: 'anomaly_spike',
        severity: 'high',
        title: 'Expense Spike Detected',
        detail: `${outlier.category} spend of $${outlier.amount.toLocaleString()} exceeds normal range.`,
        suggestedAction: 'Review supplier terms and create temporary spend guardrail.',
      });
    }
    if (snapshot.runwayMonths < 6) {
      result.push({
        id: 'anomaly_runway',
        severity: 'high',
        title: 'Runway Risk',
        detail: `Estimated runway is ${snapshot.runwayMonths.toFixed(1)} months.`,
        suggestedAction: 'Reduce discretionary spend and accelerate retained-revenue initiatives.',
      });
    } else if (snapshot.runwayMonths < 12) {
      result.push({
        id: 'anomaly_runway_watch',
        severity: 'medium',
        title: 'Runway Watch',
        detail: `Runway is ${snapshot.runwayMonths.toFixed(1)} months; monitor burn weekly.`,
        suggestedAction: 'Lock weekly cashflow review cadence and churn-prevention campaign.',
      });
    }
    return result;
  }, [transactions, snapshot.runwayMonths]);

  const upcomingObligations = useMemo(() => {
    const now = Date.now();
    const horizon = now + 14 * DAY_MS;
    return transactions
      .filter((t) => t.type === 'expense' && t.recurring)
      .map((t) => ({
        ...t,
        dueAt: new Date(Math.min(horizon, new Date(t.occurredAt).getTime() + 30 * DAY_MS)).toISOString(),
      }))
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
      .slice(0, 6);
  }, [transactions]);

  const enrichedSnapshot = useMemo<FinancialSnapshot>(
    () => ({ ...snapshot, anomalyCount: anomalies.length }),
    [snapshot, anomalies.length],
  );

  return {
    accounts,
    transactions,
    snapshot: enrichedSnapshot,
    cashflowSeries,
    anomalies,
    upcomingObligations,
  };
}
