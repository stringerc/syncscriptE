export type InstitutionalReadinessStage = 'foundation' | 'pilot_ready' | 'institution_ready';

export interface InstitutionalReadinessInput {
  optimizationSuccessRatePct: number;
  replayPassRatePct: number;
  fallbackRatePct: number;
  p95LatencyMs: number;
  sampleSize: number;
  approvalCoveragePct: number;
  incidentsOpen: number;
}

export interface InstitutionalReadinessCriterion {
  id: string;
  label: string;
  target: string;
  actual: string;
  passed: boolean;
}

export interface InstitutionalReadinessScorecard {
  generatedAt: string;
  score: number;
  stage: InstitutionalReadinessStage;
  criteria: InstitutionalReadinessCriterion[];
  blockers: string[];
}

function asPct(value: number): string {
  return `${Number.isFinite(value) ? value.toFixed(1) : '0.0'}%`;
}

function asMs(value: number): string {
  return `${Math.round(Number.isFinite(value) ? value : 0)} ms`;
}

export function computeInstitutionalReadinessScorecard(
  input: InstitutionalReadinessInput,
): InstitutionalReadinessScorecard {
  const criteria: InstitutionalReadinessCriterion[] = [
    {
      id: 'volume',
      label: 'Evidence sample volume',
      target: '>= 30 runs',
      actual: `${Math.max(0, Math.floor(input.sampleSize))} runs`,
      passed: input.sampleSize >= 30,
    },
    {
      id: 'success',
      label: 'Optimization success rate',
      target: '>= 95.0%',
      actual: asPct(input.optimizationSuccessRatePct),
      passed: input.optimizationSuccessRatePct >= 95,
    },
    {
      id: 'replay',
      label: 'Replay pass rate',
      target: '>= 95.0%',
      actual: asPct(input.replayPassRatePct),
      passed: input.replayPassRatePct >= 95,
    },
    {
      id: 'fallback',
      label: 'Fallback rate discipline',
      target: '<= 10.0%',
      actual: asPct(input.fallbackRatePct),
      passed: input.fallbackRatePct <= 10,
    },
    {
      id: 'latency',
      label: 'P95 latency budget',
      target: '<= 1200 ms',
      actual: asMs(input.p95LatencyMs),
      passed: input.p95LatencyMs <= 1200,
    },
    {
      id: 'approvals',
      label: 'Approval-gated run coverage',
      target: '>= 90.0%',
      actual: asPct(input.approvalCoveragePct),
      passed: input.approvalCoveragePct >= 90,
    },
    {
      id: 'incidents',
      label: 'Open critical incidents',
      target: '<= 3',
      actual: `${Math.max(0, Math.floor(input.incidentsOpen))}`,
      passed: input.incidentsOpen <= 3,
    },
  ];

  const passed = criteria.filter((criterion) => criterion.passed).length;
  const score = Math.round((passed / criteria.length) * 100);
  const blockers = criteria.filter((criterion) => !criterion.passed).map((criterion) => criterion.label);
  const stage: InstitutionalReadinessStage =
    score >= 90 && blockers.length <= 1
      ? 'institution_ready'
      : score >= 70
        ? 'pilot_ready'
        : 'foundation';

  return {
    generatedAt: new Date().toISOString(),
    score,
    stage,
    criteria,
    blockers,
  };
}
