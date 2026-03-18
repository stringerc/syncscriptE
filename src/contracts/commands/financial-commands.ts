import type { ContractCommandContext, ContractCommandResult } from '../core/command-contract';
import type { FinancialRecommendationContract, FinancialRiskClass } from '../domains/financial-contract';

export interface GenerateFinancialRecommendationCommand {
  workspaceId: string;
  objective: string;
  riskClass: FinancialRiskClass;
  policyIds: string[];
}

export interface ApproveFinancialActionCommand {
  recommendationId: string;
  approvalToken: string;
  reason?: string;
}

export interface FinancialCommandPort {
  generateRecommendation: (
    ctx: ContractCommandContext,
    command: GenerateFinancialRecommendationCommand,
  ) => Promise<ContractCommandResult<{ recommendationId: string; recommendation: FinancialRecommendationContract }>>;
  approveAction: (
    ctx: ContractCommandContext,
    command: ApproveFinancialActionCommand,
  ) => Promise<ContractCommandResult<{ recommendationId: string; approved: boolean; decidedAt: string }>>;
}
