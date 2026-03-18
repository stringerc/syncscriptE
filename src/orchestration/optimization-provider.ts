import type {
  OptimizationProviderContract,
  OptimizationRequestContract,
  OptimizationResultContract,
} from '../contracts/domains/optimization-provider-contract';
import type { OptimizationRequest, OptimizationResult, OptimizationShadowComparison } from './optimization-types';

export interface OptimizationRailOptions {
  shadowMode?: boolean;
  shadowBaselineProviderId?: string;
  shadowProviderId?: string;
  onShadowComparison?: (comparison: OptimizationShadowComparison) => void;
}

function toContractRequest(request: OptimizationRequest): OptimizationRequestContract {
  return {
    requestId: request.requestId,
    workspaceId: request.context.workspaceId,
    objective: request.objective,
    constraints: request.constraints,
    createdAt: request.createdAt,
  };
}

function toResult(result: OptimizationResultContract): OptimizationResult {
  return {
    resultId: result.resultId,
    requestId: result.requestId,
    providerId: result.providerId,
    solverType: result.solverType,
    solverVersion: result.solverVersion,
    runtimeMs: result.runtimeMs,
    confidence: result.confidence,
    recommendationSummary: result.recommendationSummary,
    reproducibilityToken: result.reproducibilityToken,
    advisoryOnly: result.advisoryOnly,
    metadata: { costEstimate: result.costEstimate },
  };
}

export class OptimizationProviderRail {
  constructor(
    private readonly providers: OptimizationProviderContract[],
    private readonly options: OptimizationRailOptions = {},
  ) {}

  private listEnabledProviders(): OptimizationProviderContract[] {
    return this.providers.filter((provider) => provider.enabled);
  }

  async executePrimary(request: OptimizationRequest): Promise<OptimizationResult> {
    const provider = this.listEnabledProviders()[0];
    if (!provider) {
      throw new Error('No optimization provider enabled');
    }
    const result = await provider.execute(toContractRequest(request));
    return toResult(result);
  }

  async executeWithFallback(request: OptimizationRequest): Promise<OptimizationResult> {
    const enabledProviders = this.listEnabledProviders();
    if (!enabledProviders.length) {
      throw new Error('No optimization provider enabled');
    }

    let lastError: Error | null = null;
    const attemptedProviders: string[] = [];
    let providerIndex = -1;
    for (const provider of enabledProviders) {
      try {
        providerIndex += 1;
        attemptedProviders.push(provider.providerId);
        const result = await provider.execute(toContractRequest(request));
        const mapped = toResult(result);
        const shadowEnabled = this.options.shadowMode === true;
        if (
          shadowEnabled &&
          this.options.shadowBaselineProviderId &&
          this.options.shadowProviderId &&
          mapped.providerId === this.options.shadowBaselineProviderId
        ) {
          try {
            const shadow = await this.executeShadowComparison(
              request,
              this.options.shadowBaselineProviderId,
              this.options.shadowProviderId,
            );
            mapped.metadata = {
              ...(mapped.metadata || {}),
              fallbackUsed: providerIndex > 0,
              attemptedProviders,
              shadowComparison: shadow.comparison,
              shadowPassed: shadow.comparison.qualityDelta >= -0.1,
            };
            this.options.onShadowComparison?.(shadow.comparison);
            return mapped;
          } catch {
            mapped.metadata = {
              ...(mapped.metadata || {}),
              fallbackUsed: providerIndex > 0,
              attemptedProviders,
              shadowComparison: null,
              shadowPassed: false,
            };
            return mapped;
          }
        }
        mapped.metadata = {
          ...(mapped.metadata || {}),
          fallbackUsed: providerIndex > 0,
          attemptedProviders,
        };
        return mapped;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Optimization provider failed');
      }
    }
    throw lastError || new Error('Optimization provider chain failed');
  }

  async executeShadowComparison(
    request: OptimizationRequest,
    baselineProviderId: string,
    shadowProviderId: string
  ): Promise<{ baseline: OptimizationResult; shadow: OptimizationResult; comparison: OptimizationShadowComparison }> {
    const enabledProviders = this.listEnabledProviders();
    const baselineProvider = enabledProviders.find((provider) => provider.providerId === baselineProviderId);
    const shadowProvider = enabledProviders.find((provider) => provider.providerId === shadowProviderId);
    if (!baselineProvider || !shadowProvider) {
      throw new Error('Baseline or shadow optimization provider is not enabled');
    }

    const baselineRaw = await baselineProvider.execute(toContractRequest(request));
    const shadowRaw = await shadowProvider.execute(toContractRequest(request));
    const baseline = toResult(baselineRaw);
    const shadow = toResult(shadowRaw);
    return {
      baseline,
      shadow,
      comparison: {
        requestId: request.requestId,
        baselineProviderId: baseline.providerId,
        shadowProviderId: shadow.providerId,
        qualityDelta: Number((shadow.confidence - baseline.confidence).toFixed(4)),
        latencyDeltaMs: shadow.runtimeMs - baseline.runtimeMs,
        stabilityDelta: Number((shadow.advisoryOnly === baseline.advisoryOnly ? 1 : -1).toFixed(4)),
        comparedAt: new Date().toISOString(),
      },
    };
  }
}
