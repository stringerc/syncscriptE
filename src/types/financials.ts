export type FinancialAccountType = 'checking' | 'savings' | 'credit' | 'investment';

export interface FinancialAccount {
  id: string;
  name: string;
  type: FinancialAccountType;
  currency: string;
  balance: number;
  institution?: string;
}

export type FinancialTransactionType = 'income' | 'expense' | 'transfer';

export interface FinancialTransaction {
  id: string;
  accountId: string;
  type: FinancialTransactionType;
  amount: number;
  category: string;
  merchant?: string;
  description: string;
  occurredAt: string;
  recurring?: boolean;
}

export interface FinancialAnomaly {
  id: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  detail: string;
  suggestedAction: string;
}

export interface CashflowPoint {
  date: string;
  inflow: number;
  outflow: number;
}

export interface FinancialSnapshot {
  totalCash: number;
  monthlyInflow: number;
  monthlyOutflow: number;
  netMonthlyCashflow: number;
  runwayMonths: number;
  anomalyCount: number;
}
