import type { OptimizationReplayVerdict, OptimizationResult } from './optimization-types';

export function validateOptimizationReplay(
  original: OptimizationResult,
  replay: OptimizationResult
): OptimizationReplayVerdict {
  const mismatches: string[] = [];

  if (original.providerId !== replay.providerId) {
    mismatches.push(`provider mismatch: ${original.providerId} vs ${replay.providerId}`);
  }
  if (original.solverType !== replay.solverType) {
    mismatches.push(`solver mismatch: ${original.solverType} vs ${replay.solverType}`);
  }
  if (original.reproducibilityToken !== replay.reproducibilityToken) {
    mismatches.push('reproducibility token mismatch');
  }
  if (Math.abs(original.confidence - replay.confidence) > 0.05) {
    mismatches.push('confidence drift exceeds threshold (0.05)');
  }

  return {
    requestId: original.requestId,
    resultId: replay.resultId,
    passed: mismatches.length === 0,
    checkedAt: new Date().toISOString(),
    mismatchDetails: mismatches.length ? mismatches.join('; ') : undefined,
  };
}
