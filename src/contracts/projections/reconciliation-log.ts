import {
  readProjectionEnvelope,
  writeProjectionEnvelope,
} from './projection-cache-envelope';

export interface ReconciliationLogEntry {
  entryId: string;
  runId?: string;
  actionId?: string;
  eventType: string;
  entityKind: string;
  entityId: string;
  workspaceId: string;
  mode?: 'dry_run' | 'apply';
  outcome?: 'simulated' | 'applied' | 'skipped' | 'failed';
  detail?: string;
  occurredAt: string;
}

const STORAGE_KEY = 'syncscript:phase2a:reconciliation-log';
const ENTRY_LIMIT = 300;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function listReconciliationLog(limit = 50): ReconciliationLogEntry[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const envelope = readProjectionEnvelope<ReconciliationLogEntry[]>(
      raw,
      (value): value is ReconciliationLogEntry[] => Array.isArray(value),
      'reconciliation-log',
    );
    if (!envelope) return [];
    const entries = envelope.payload;
    return entries.slice(-Math.max(1, Math.min(limit, ENTRY_LIMIT)));
  } catch {
    return [];
  }
}

export function hasReconciliationActionApplied(actionId: string, workspaceId: string): boolean {
  if (!actionId || !workspaceId) return false;
  const entries = listReconciliationLog(ENTRY_LIMIT);
  return entries.some(
    (entry) =>
      entry.actionId === actionId &&
      entry.workspaceId === workspaceId &&
      entry.outcome === 'applied',
  );
}

export function createReconciliationRunId(workspaceId: string): string {
  const safeWorkspace = String(workspaceId || 'workspace-main').replace(/[^a-zA-Z0-9_-]/g, '-');
  return `recon-${safeWorkspace}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function appendReconciliationLog(entry: ReconciliationLogEntry): void {
  if (!canUseStorage()) return;
  try {
    const existing = listReconciliationLog(ENTRY_LIMIT);
    if (
      entry.actionId &&
      existing.some(
        (item) =>
          item.actionId === entry.actionId &&
          item.workspaceId === entry.workspaceId &&
          item.runId === entry.runId &&
          item.outcome === entry.outcome,
      )
    ) {
      return;
    }
    existing.push(entry);
    if (existing.length > ENTRY_LIMIT) {
      existing.splice(0, existing.length - ENTRY_LIMIT);
    }
    const envelope = writeProjectionEnvelope(existing, {
      projectionVersion: 1,
      sourceEventCursor: String(entry.entryId || entry.eventType || 'reconciliation-log'),
    });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // best effort only
  }
}
