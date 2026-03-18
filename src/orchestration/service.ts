import type {
  OrchestrationAdapter,
  OrchestrationRequest,
  OrchestrationResponse,
} from './types';
import type { OptimizationRequest, OptimizationResult, OptimizationShadowComparison } from './optimization-types';
import { OptimizationProviderRail } from './optimization-provider';

export class NexusOrchestrationService {
  private readonly adapters: OrchestrationAdapter[];
  private readonly fallbackProvider: OrchestrationAdapter;
  private readonly optimizationRail?: OptimizationProviderRail;

  constructor(
    adapters: OrchestrationAdapter[],
    fallbackProvider: OrchestrationAdapter,
    optimizationRail?: OptimizationProviderRail
  ) {
    this.adapters = adapters;
    this.fallbackProvider = fallbackProvider;
    this.optimizationRail = optimizationRail;
  }

  async execute(request: OrchestrationRequest): Promise<OrchestrationResponse> {
    const adapter = this.adapters.find((item) => item.isAvailable()) || this.fallbackProvider;
    return adapter.execute(request);
  }

  async executeOptimization(request: OptimizationRequest): Promise<OptimizationResult> {
    if (!this.optimizationRail) {
      throw new Error('Optimization rail is not configured');
    }
    return this.optimizationRail.executeWithFallback(request);
  }

  async executeOptimizationShadow(
    request: OptimizationRequest,
    baselineProviderId: string,
    shadowProviderId: string,
  ): Promise<{ baseline: OptimizationResult; shadow: OptimizationResult; comparison: OptimizationShadowComparison }> {
    if (!this.optimizationRail) {
      throw new Error('Optimization rail is not configured');
    }
    return this.optimizationRail.executeShadowComparison(request, baselineProviderId, shadowProviderId);
  }
}
