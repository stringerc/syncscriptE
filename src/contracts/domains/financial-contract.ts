import type { ContractEntityIdentity } from '../core/entity-contract';

export type FinancialRiskClass = 'low' | 'medium' | 'high' | 'critical';
export type RecommendationState = 'advisory' | 'requires_approval' | 'approved' | 'executed' | 'rolled_back';

export interface FinancialPostingContract extends ContractEntityIdentity {
  entityKind: 'financial_posting';
  accountId: string;
  amount: number;
  direction: 'debit' | 'credit';
  category: string;
  occurredAt: string;
  description: string;
  sourceProvider?: string;
}

export interface FinancialRecommendationContract extends ContractEntityIdentity {
  entityKind: 'financial_recommendation';
  recommendationId: string;
  title: string;
  riskClass: FinancialRiskClass;
  state: RecommendationState;
  inputsUsed: string[];
  policyApplied: string[];
  confidence: number;
  rollbackPath: string;
  generatedAt: string;
}

export interface FinancialPolicyDecisionContract {
  decisionId: string;
  recommendationId: string;
  approved: boolean;
  approverIdentityId?: string;
  reason?: string;
  decidedAt: string;
}

export function assertFinancialRecommendationContract(rec: FinancialRecommendationContract): string[] {
  const errors: string[] = [];
  if (!rec.inputsUsed?.length) errors.push('Recommendation missing inputsUsed');
  if (!rec.policyApplied?.length) errors.push('Recommendation missing policyApplied');
  if (!Number.isFinite(rec.confidence)) errors.push('Recommendation confidence invalid');
  if (!rec.rollbackPath?.trim()) errors.push('Recommendation missing rollbackPath');
  return errors;
}
