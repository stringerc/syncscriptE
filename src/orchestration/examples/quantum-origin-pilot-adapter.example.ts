import type {
  OptimizationProviderContract,
  OptimizationRequestContract,
  OptimizationResultContract,
} from '../../contracts/domains/optimization-provider-contract';

/**
 * Example adapter for Q-011 connector integration.
 * Replace the simulated payload with vendor SDK calls.
 */
export function createQuantumOriginPilotAdapter(enabled = false): OptimizationProviderContract {
  return {
    providerId: 'quantum-origin-pilot',
    enabled,
    execute: async (request: OptimizationRequestContract): Promise<OptimizationResultContract> => {
      return {
        resultId: `opt-quantum-${request.requestId}`,
        requestId: request.requestId,
        providerId: 'quantum-origin-pilot',
        solverType: 'qaoa',
        solverVersion: 'pilot-2026.03',
        runtimeMs: 470,
        costEstimate: 0.0062,
        confidence: 0.92,
        reproducibilityToken: `quantum-origin-pilot:${request.requestId}:v1`,
        recommendationSummary: 'Quantum-origin pilot run completed in advisory mode.',
        advisoryOnly: true,
      };
    },
  };
}
