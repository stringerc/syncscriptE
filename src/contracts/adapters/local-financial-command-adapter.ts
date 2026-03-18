import type {
  ApproveFinancialActionCommand,
  FinancialCommandPort,
  GenerateFinancialRecommendationCommand,
} from '../commands/financial-commands';
import type { ContractCommandContext, ContractCommandResult } from '../core/command-contract';
import {
  assertFinancialRecommendationContract,
  type FinancialRecommendationContract,
} from '../domains/financial-contract';
import { commandFailure, commandSuccess } from '../core/command-contract';

export interface FinancialSignalSnapshot {
  totalCash: number;
  monthlyInflow: number;
  monthlyOutflow: number;
  runwayMonths: number;
  anomalyCount: number;
  dataCompletenessScore: number;
}

function commandId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function computeConfidence(signal: FinancialSignalSnapshot): number {
  const completeness = Math.max(0, Math.min(100, Number(signal.dataCompletenessScore || 0)));
  const anomalyPenalty = Math.min(30, Math.max(0, Number(signal.anomalyCount || 0)) * 4);
  const runwayPenalty = signal.runwayMonths > 0 && signal.runwayMonths < 6 ? 12 : 0;
  return Math.max(0, Math.min(100, Math.round(completeness - anomalyPenalty - runwayPenalty)));
}

export class LocalFinancialCommandAdapter implements FinancialCommandPort {
  constructor(private readonly getSignalSnapshot: () => FinancialSignalSnapshot) {}

  async generateRecommendation(
    ctx: ContractCommandContext,
    command: GenerateFinancialRecommendationCommand,
  ): Promise<ContractCommandResult<{ recommendationId: string; recommendation: FinancialRecommendationContract }>> {
    const id = commandId('finance-generate');
    try {
      const signal = this.getSignalSnapshot();
      const recommendationId = `fin-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();
      const confidence = computeConfidence(signal);
      const recommendation: FinancialRecommendationContract = {
        entityKind: 'financial_recommendation',
        entityId: recommendationId,
        workspaceId: String(command.workspaceId || ctx.workspaceId || 'workspace-main'),
        version: 1,
        createdAt: now,
        updatedAt: now,
        recommendationId,
        title: command.objective || 'Financial recommendation',
        riskClass: command.riskClass,
        state: command.riskClass === 'high' || command.riskClass === 'critical' ? 'requires_approval' : 'advisory',
        inputsUsed: [
          `snapshot.totalCash:${signal.totalCash}`,
          `snapshot.monthlyInflow:${signal.monthlyInflow}`,
          `snapshot.monthlyOutflow:${signal.monthlyOutflow}`,
          `snapshot.runwayMonths:${signal.runwayMonths}`,
          `snapshot.anomalyCount:${signal.anomalyCount}`,
          `snapshot.dataCompleteness:${signal.dataCompletenessScore}`,
          `objective:${command.objective}`,
        ],
        policyApplied: command.policyIds?.length ? command.policyIds : ['policy.financial.default.guardrail'],
        confidence,
        rollbackPath:
          `rollback://financial-recommendation/${recommendationId}?restore=pre_decision` +
          `&workspace=${encodeURIComponent(command.workspaceId || ctx.workspaceId)}`,
        generatedAt: now,
      };

      const errors = assertFinancialRecommendationContract(recommendation);
      if (errors.length > 0) return commandFailure(id, errors);

      return commandSuccess(id, { recommendationId, recommendation });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Financial recommendation generation failed';
      return commandFailure(id, [message]);
    }
  }

  async approveAction(
    _ctx: ContractCommandContext,
    command: ApproveFinancialActionCommand,
  ): Promise<ContractCommandResult<{ recommendationId: string; approved: boolean; decidedAt: string }>> {
    const id = commandId('finance-approve');
    const recommendationId = String(command.recommendationId || '').trim();
    const approvalToken = String(command.approvalToken || '').trim();
    if (!recommendationId) return commandFailure(id, ['Missing recommendationId']);
    if (!approvalToken) return commandFailure(id, ['Missing approvalToken']);
    const decidedAt = new Date().toISOString();
    return commandSuccess(id, { recommendationId, approved: true, decidedAt });
  }
}
