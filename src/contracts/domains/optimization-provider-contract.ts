export type OptimizationProviderId = 'classical-local' | 'classical-cloud' | 'quantum-origin-pilot';

export interface OptimizationRequestContract {
  requestId: string;
  workspaceId: string;
  objective: string;
  constraints: Record<string, unknown>;
  createdAt: string;
}

export interface OptimizationResultContract {
  resultId: string;
  requestId: string;
  providerId: OptimizationProviderId;
  solverType: string;
  solverVersion: string;
  runtimeMs: number;
  costEstimate?: number;
  confidence: number;
  reproducibilityToken: string;
  recommendationSummary: string;
  advisoryOnly: boolean;
}

export interface OptimizationProviderContract {
  providerId: OptimizationProviderId;
  enabled: boolean;
  execute: (request: OptimizationRequestContract) => Promise<OptimizationResultContract>;
}

export function shouldRequireClassicalFallback(providerId: OptimizationProviderId): boolean {
  return providerId === 'quantum-origin-pilot';
}
