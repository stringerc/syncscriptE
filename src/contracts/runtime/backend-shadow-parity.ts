import { readBackendProjection, type ContractDomain } from './backend-projection-mirror';

export interface BackendShadowParityDomainReport {
  domain: ContractDomain;
  localCount: number;
  backendCount: number | null;
  status: 'match' | 'drift' | 'unavailable';
}

export interface BackendShadowParityReport {
  checkedAt: string;
  parityScore: number;
  mismatchDomains: ContractDomain[];
  unavailableDomains: ContractDomain[];
  domains: BackendShadowParityDomainReport[];
}

function asCount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function readBackendEntityCount(envelope: unknown): number | null {
  if (!envelope || typeof envelope !== 'object') return null;
  const data = (envelope as Record<string, unknown>).data;
  if (!data || typeof data !== 'object') return null;
  const entities = (data as Record<string, unknown>).entities;
  if (!Array.isArray(entities)) return null;
  return entities.length;
}

export async function runBackendShadowParityProbe(
  localDomainCounts: Record<ContractDomain, number>,
  workspaceId = 'workspace-main',
): Promise<BackendShadowParityReport> {
  const domains: ContractDomain[] = ['task', 'goal', 'schedule', 'project'];
  const rows = await Promise.all(
    domains.map(async (domain): Promise<BackendShadowParityDomainReport> => {
      const localCount = asCount(localDomainCounts[domain]);
      const backendEnvelope = await readBackendProjection(domain, workspaceId).catch(() => null);
      const backendCount = readBackendEntityCount(backendEnvelope);
      if (backendCount === null) {
        return {
          domain,
          localCount,
          backendCount: null,
          status: 'unavailable',
        };
      }
      return {
        domain,
        localCount,
        backendCount,
        status: backendCount === localCount ? 'match' : 'drift',
      };
    }),
  );

  const comparableRows = rows.filter((row) => row.status !== 'unavailable');
  const matchedCount = comparableRows.filter((row) => row.status === 'match').length;
  const parityScore = comparableRows.length === 0 ? 0 : matchedCount / comparableRows.length;

  return {
    checkedAt: new Date().toISOString(),
    parityScore,
    mismatchDomains: rows.filter((row) => row.status === 'drift').map((row) => row.domain),
    unavailableDomains: rows.filter((row) => row.status === 'unavailable').map((row) => row.domain),
    domains: rows,
  };
}
