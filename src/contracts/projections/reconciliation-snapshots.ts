import {
  readProjectionEnvelope,
  writeProjectionEnvelope,
} from './projection-cache-envelope';

export interface ReconciliationSnapshotEntry {
  snapshotId: string;
  runId: string;
  actionId: string;
  workspaceId: string;
  entityKind: 'task' | 'event';
  entityId: string;
  beforeState: Record<string, unknown>;
  afterState: Record<string, unknown>;
  capturedAt: string;
}

const STORAGE_KEY = 'syncscript:phase2a:reconciliation-snapshots';
const ENTRY_LIMIT = 300;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function listReconciliationSnapshots(limit = 50): ReconciliationSnapshotEntry[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const envelope = readProjectionEnvelope<ReconciliationSnapshotEntry[]>(
      raw,
      (value): value is ReconciliationSnapshotEntry[] => Array.isArray(value),
      'reconciliation-snapshots',
    );
    if (!envelope) return [];
    const entries = envelope.payload;
    return entries.slice(-Math.max(1, Math.min(limit, ENTRY_LIMIT)));
  } catch {
    return [];
  }
}

export function appendReconciliationSnapshot(entry: ReconciliationSnapshotEntry): void {
  if (!canUseStorage()) return;
  try {
    const existing = listReconciliationSnapshots(ENTRY_LIMIT);
    if (
      existing.some(
        (item) =>
          item.runId === entry.runId &&
          item.actionId === entry.actionId &&
          item.entityId === entry.entityId,
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
      sourceEventCursor: String(entry.snapshotId || entry.actionId || 'reconciliation-snapshot'),
    });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // best effort only
  }
}
