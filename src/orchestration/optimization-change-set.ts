export type OptimizationEntryDomain = 'schedule' | 'assignment';

export interface OptimizationChangeSetEntry {
  entityId: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  reason: string;
}

export interface OptimizationChangeSet {
  changeSetId: string;
  domain: OptimizationEntryDomain;
  generatedAt: string;
  objective: string;
  entries: OptimizationChangeSetEntry[];
}

export function buildOptimizationChangeSet(input: {
  domain: OptimizationEntryDomain;
  objective: string;
  entries: OptimizationChangeSetEntry[];
}): OptimizationChangeSet {
  return {
    changeSetId: `chg-${input.domain}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    domain: input.domain,
    generatedAt: new Date().toISOString(),
    objective: input.objective,
    entries: input.entries.slice(0, 100),
  };
}
