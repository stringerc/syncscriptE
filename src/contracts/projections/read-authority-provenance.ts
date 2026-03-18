import {
  readProjectionEnvelope,
  writeProjectionEnvelope,
} from './projection-cache-envelope';
import type { ContractDomain } from '../runtime/backend-projection-mirror';
import type { ReadAuthorityProvenance, ReadAuthoritySurface } from '../runtime/backend-read-authority';

const STORAGE_KEY = 'syncscript:phase2b:read-authority-provenance';
const ENTRY_LIMIT = 180;

export interface ReadAuthorityProvenanceEntry extends ReadAuthorityProvenance {
  entryId: string;
  workspaceId: string;
  capturedAt: string;
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function listReadAuthorityProvenance(limit = 80): ReadAuthorityProvenanceEntry[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const envelope = readProjectionEnvelope<ReadAuthorityProvenanceEntry[]>(
      raw,
      (value): value is ReadAuthorityProvenanceEntry[] => Array.isArray(value),
      'read-authority-provenance',
    );
    if (!envelope) return [];
    return envelope.payload.slice(-Math.max(1, Math.min(limit, ENTRY_LIMIT)));
  } catch {
    return [];
  }
}

export function recordReadAuthorityProvenance(
  surface: ReadAuthoritySurface,
  domain: ContractDomain,
  provenance: ReadAuthorityProvenance | null | undefined,
  workspaceId = 'workspace-main',
): void {
  if (!canUseStorage() || !provenance) return;
  try {
    const existing = listReadAuthorityProvenance(ENTRY_LIMIT).filter(
      (entry) =>
        !(
          entry.workspaceId === workspaceId &&
          entry.surface === surface &&
          entry.domain === domain &&
          entry.checkedAt === provenance.checkedAt &&
          entry.reason === provenance.reason &&
          entry.source === provenance.source
        ),
    );
    const entry: ReadAuthorityProvenanceEntry = {
      ...provenance,
      entryId: `${surface}:${domain}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
      workspaceId,
      capturedAt: new Date().toISOString(),
    };
    existing.push(entry);
    if (existing.length > ENTRY_LIMIT) {
      existing.splice(0, existing.length - ENTRY_LIMIT);
    }
    const envelope = writeProjectionEnvelope(existing, {
      projectionVersion: 1,
      sourceEventCursor: `${surface}:${domain}:${entry.capturedAt}`,
    });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // best-effort cache only
  }
}

export function getLatestReadAuthorityProvenanceBySurface(
  surface: ReadAuthoritySurface,
  workspaceId = 'workspace-main',
): Record<string, ReadAuthorityProvenanceEntry> {
  const latest: Record<string, ReadAuthorityProvenanceEntry> = {};
  const entries = listReadAuthorityProvenance(ENTRY_LIMIT)
    .filter((entry) => entry.surface === surface && entry.workspaceId === workspaceId)
    .sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime());

  for (const entry of entries) {
    latest[entry.domain] = entry;
  }
  return latest;
}
