import type { FinancialOperatingMode } from '../types/financials';

interface FinancialOperatingModeConfig {
  id: FinancialOperatingMode;
  label: string;
  description: string;
  riskTolerance: 'low' | 'medium' | 'high';
  executionBias: 'cash_preservation' | 'balanced' | 'growth_acceleration';
}

export const FINANCIAL_OPERATING_MODES: FinancialOperatingModeConfig[] = [
  {
    id: 'protect_cash',
    label: 'Protect Cash',
    description: 'Prioritize burn reduction, runway protection, and rapid mitigation tasks.',
    riskTolerance: 'low',
    executionBias: 'cash_preservation',
  },
  {
    id: 'growth_push',
    label: 'Growth Push',
    description: 'Prioritize controlled expansion opportunities while monitoring downside risk.',
    riskTolerance: 'high',
    executionBias: 'growth_acceleration',
  },
  {
    id: 'stability',
    label: 'Stability',
    description: 'Balance resilience and growth with steady, confidence-weighted execution.',
    riskTolerance: 'medium',
    executionBias: 'balanced',
  },
];

export function getFinancialOperatingModeConfig(mode: FinancialOperatingMode) {
  return FINANCIAL_OPERATING_MODES.find((item) => item.id === mode) || FINANCIAL_OPERATING_MODES[2];
}
