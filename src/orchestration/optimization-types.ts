import type { OptimizationProviderId } from '../contracts/domains/optimization-provider-contract';

export type OptimizationDomain = 'schedule' | 'assignment' | 'financial' | 'general';

export interface OptimizationContext {
  missionId?: string;
  runId?: string;
  userId: string;
  workspaceId: string;
}

export interface OptimizationRequest {
  requestId: string;
  objective: string;
  constraints: Record<string, unknown>;
  domain: OptimizationDomain;
  createdAt: string;
  context: OptimizationContext;
}

export interface OptimizationResult {
  resultId: string;
  requestId: string;
  providerId: OptimizationProviderId;
  solverType: string;
  solverVersion: string;
  runtimeMs: number;
  confidence: number;
  recommendationSummary: string;
  reproducibilityToken: string;
  advisoryOnly: boolean;
  metadata?: Record<string, unknown>;
}

export interface OptimizationShadowComparison {
  requestId: string;
  baselineProviderId: OptimizationProviderId;
  shadowProviderId: OptimizationProviderId;
  qualityDelta: number;
  latencyDeltaMs: number;
  stabilityDelta: number;
  comparedAt: string;
}

export interface OptimizationReplayVerdict {
  requestId: string;
  resultId: string;
  passed: boolean;
  checkedAt: string;
  mismatchDetails?: string;
}
