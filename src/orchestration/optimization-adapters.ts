import type {
  OptimizationProviderContract,
  OptimizationProviderId,
  OptimizationRequestContract,
  OptimizationResultContract,
} from '../contracts/domains/optimization-provider-contract';

export interface OptimizationProviderToggleConfig {
  classicalLocalEnabled: boolean;
  classicalCloudEnabled: boolean;
  quantumPilotEnabled: boolean;
  quantumPilotLiveEnabled: boolean;
  quantumPilotExternalUrl?: string;
  quantumPilotApiKey?: string;
  quantumPilotTimeoutMs: number;
}

function toNumber(value: unknown, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function deterministicToken(providerId: OptimizationProviderId, requestId: string): string {
  return `${providerId}:${requestId}:v1`;
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized) return fallback;
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function clampConfidence(value: unknown, fallback: number): number {
  const numeric = toNumber(value, fallback);
  if (!Number.isFinite(numeric)) return fallback;
  if (numeric < 0) return 0;
  if (numeric > 1) return 1;
  return numeric;
}

function createProvider(
  providerId: OptimizationProviderId,
  enabled: boolean,
  runtimeMs: number,
  confidence: number,
  solverType: string,
  solverVersion: string,
  summary: string,
): OptimizationProviderContract {
  return {
    providerId,
    enabled,
    execute: async (request: OptimizationRequestContract): Promise<OptimizationResultContract> => ({
      resultId: `opt-${providerId}-${request.requestId}`,
      requestId: request.requestId,
      providerId,
      solverType,
      solverVersion,
      runtimeMs,
      costEstimate: Number((runtimeMs / 1000) * 0.0025).toFixed ? Number(((runtimeMs / 1000) * 0.0025).toFixed(4)) : 0,
      confidence,
      reproducibilityToken: deterministicToken(providerId, request.requestId),
      recommendationSummary: summary,
      advisoryOnly: providerId !== 'classical-local',
    }),
  };
}

async function executeQuantumPilotExternal(
  request: OptimizationRequestContract,
  config: OptimizationProviderToggleConfig,
): Promise<OptimizationResultContract> {
  const startedAt = Date.now();
  const endpointUrl = String(config.quantumPilotExternalUrl || '').trim();
  const controller = new AbortController();
  const timeoutMs = Math.max(1000, config.quantumPilotTimeoutMs);
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.quantumPilotApiKey ? { Authorization: `Bearer ${config.quantumPilotApiKey}` } : {}),
      },
      body: JSON.stringify({
        requestId: request.requestId,
        workspaceId: request.workspaceId,
        objective: request.objective,
        constraints: request.constraints,
        createdAt: request.createdAt,
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Quantum external endpoint failed (${response.status})`);
    }
    const payload = (await response.json()) as Record<string, unknown>;
    const runtimeFromClock = Date.now() - startedAt;
    return {
      resultId: String(payload.resultId || `opt-quantum-origin-pilot-${request.requestId}`),
      requestId: request.requestId,
      providerId: 'quantum-origin-pilot',
      solverType: String(payload.solverType || 'quantum-pilot-qaoa'),
      solverVersion: String(payload.solverVersion || 'pilot-external-v1'),
      runtimeMs: Math.max(1, toNumber(payload.runtimeMs, runtimeFromClock)),
      costEstimate: toNumber(payload.costEstimate, runtimeFromClock / 1000 * 0.0032),
      confidence: clampConfidence(payload.confidence, 0.92),
      reproducibilityToken: String(
        payload.reproducibilityToken || deterministicToken('quantum-origin-pilot', request.requestId),
      ),
      recommendationSummary: String(
        payload.recommendationSummary || 'Quantum-origin pilot external run completed in advisory mode.',
      ),
      advisoryOnly: true,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function createQuantumPilotProvider(config: OptimizationProviderToggleConfig): OptimizationProviderContract {
  return {
    providerId: 'quantum-origin-pilot',
    enabled: config.quantumPilotEnabled,
    execute: async (request: OptimizationRequestContract): Promise<OptimizationResultContract> => {
      if (config.quantumPilotLiveEnabled && config.quantumPilotExternalUrl) {
        return executeQuantumPilotExternal(request, config);
      }
      return {
        resultId: `opt-quantum-origin-pilot-${request.requestId}`,
        requestId: request.requestId,
        providerId: 'quantum-origin-pilot',
        solverType: 'quantum-pilot-qaoa',
        solverVersion: 'pilot-2026.03',
        runtimeMs: 430,
        costEstimate: 0.0011,
        confidence: 0.93,
        reproducibilityToken: deterministicToken('quantum-origin-pilot', request.requestId),
        recommendationSummary: 'Quantum-origin pilot adapter executed with advisory fallback posture.',
        advisoryOnly: true,
      };
    },
  };
}

export function buildOptimizationProviders(config: OptimizationProviderToggleConfig): OptimizationProviderContract[] {
  return [
    createProvider(
      'classical-local',
      config.classicalLocalEnabled,
      140,
      0.88,
      'classical-local-heuristic',
      'v1.2.0',
      'Local deterministic optimizer selected.',
    ),
    createProvider(
      'classical-cloud',
      config.classicalCloudEnabled,
      260,
      0.91,
      'classical-cloud-hybrid',
      'v2.1.0',
      'Cloud optimizer selected for expanded search horizon.',
    ),
    createQuantumPilotProvider(config),
  ];
}

export function readOptimizationProviderConfigFromEnv(): OptimizationProviderToggleConfig {
  const env = ((globalThis as any)?.process?.env || {}) as Record<string, unknown>;
  const cloudConfidenceBias = toNumber(env.OPTIMIZER_CLOUD_CONFIDENCE_BIAS, 0);
  const quantumDisabledByBias = cloudConfidenceBias > 0.5;
  const quantumPilotExternalUrl = String(env.OPTIMIZER_QUANTUM_PILOT_EXTERNAL_URL || '').trim();
  const quantumPilotTimeoutMs = Math.max(1000, toNumber(env.OPTIMIZER_QUANTUM_PILOT_TIMEOUT_MS, 12000));
  return {
    classicalLocalEnabled: toBoolean(env.OPTIMIZER_CLASSICAL_LOCAL_ENABLED, true),
    classicalCloudEnabled: toBoolean(env.OPTIMIZER_CLASSICAL_CLOUD_ENABLED, true),
    quantumPilotEnabled: toBoolean(env.OPTIMIZER_QUANTUM_PILOT_ENABLED, !quantumDisabledByBias),
    quantumPilotLiveEnabled: toBoolean(env.OPTIMIZER_QUANTUM_PILOT_LIVE_ENABLED, false),
    quantumPilotExternalUrl: quantumPilotExternalUrl || undefined,
    quantumPilotApiKey: String(env.OPTIMIZER_QUANTUM_PILOT_API_KEY || '').trim() || undefined,
    quantumPilotTimeoutMs,
  };
}
