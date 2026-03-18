import {
  readProjectionEnvelope,
  writeProjectionEnvelope,
} from './projection-cache-envelope';

export type TaskSurfaceName =
  | 'tasks_tab'
  | 'workstream'
  | 'projects'
  | 'dashboard'
  | 'goals'
  | 'resonance'
  | 'ai_assistant';

export interface TaskSurfaceSnapshot {
  surface: TaskSurfaceName;
  scopeId: string;
  taskIds: string[];
  capturedAt: string;
}

export interface TaskSurfaceSnapshotState {
  observed: boolean;
  scopeId: string;
  capturedAt: string | null;
  taskIds: string[];
}

const STORAGE_KEY = 'syncscript:phase2a:surface-parity-snapshots';
const ENTRY_LIMIT = 80;
export const SURFACE_PARITY_SNAPSHOT_EVENT = 'syncscript:phase2a:surface-snapshot-updated';
export const SURFACE_PARITY_REFRESH_REQUEST_EVENT =
  'syncscript:phase2a:surface-snapshot-refresh-request';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalizeIds(taskIds: string[]): string[] {
  return Array.from(new Set((taskIds || []).map((id) => String(id || '').trim()).filter(Boolean)));
}

export function listTaskSurfaceSnapshots(limit = ENTRY_LIMIT): TaskSurfaceSnapshot[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const envelope = readProjectionEnvelope<TaskSurfaceSnapshot[]>(
      raw,
      (value): value is TaskSurfaceSnapshot[] => Array.isArray(value),
      'surface-parity-snapshots',
    );
    if (!envelope) return [];
    return envelope.payload.slice(-Math.max(1, Math.min(limit, ENTRY_LIMIT)));
  } catch {
    return [];
  }
}

export function recordTaskSurfaceSnapshot(
  surface: TaskSurfaceName,
  taskIds: string[],
  scopeId = 'workspace-main',
): void {
  if (!canUseStorage()) return;
  try {
    const existing = listTaskSurfaceSnapshots(ENTRY_LIMIT).filter(
      (entry) => !(entry.surface === surface && entry.scopeId === scopeId),
    );
    const next: TaskSurfaceSnapshot = {
      surface,
      scopeId,
      taskIds: normalizeIds(taskIds),
      capturedAt: new Date().toISOString(),
    };
    existing.push(next);
    if (existing.length > ENTRY_LIMIT) {
      existing.splice(0, existing.length - ENTRY_LIMIT);
    }
    const envelope = writeProjectionEnvelope(existing, {
      projectionVersion: 1,
      sourceEventCursor: `${surface}:${scopeId}:${next.capturedAt}`,
    });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    window.dispatchEvent(
      new CustomEvent(SURFACE_PARITY_SNAPSHOT_EVENT, {
        detail: { surface, scopeId, count: next.taskIds.length, capturedAt: next.capturedAt },
      }),
    );
  } catch {
    // best-effort only
  }
}

export function getTaskSurfaceSnapshotState(
  surface: TaskSurfaceName,
  scopeId: string,
  fallbackScopeId?: string,
): TaskSurfaceSnapshotState {
  const snapshots = listTaskSurfaceSnapshots(ENTRY_LIMIT);
  const exact = snapshots.find((entry) => entry.surface === surface && entry.scopeId === scopeId);
  if (exact) {
    return {
      observed: true,
      scopeId: exact.scopeId,
      capturedAt: exact.capturedAt,
      taskIds: exact.taskIds,
    };
  }
  if (fallbackScopeId) {
    const fallback = snapshots.find(
      (entry) => entry.surface === surface && entry.scopeId === fallbackScopeId,
    );
    if (fallback) {
      return {
        observed: true,
        scopeId: fallback.scopeId,
        capturedAt: fallback.capturedAt,
        taskIds: fallback.taskIds,
      };
    }
  }
  return {
    observed: false,
    scopeId,
    capturedAt: null,
    taskIds: [],
  };
}

export function requestTaskSurfaceSnapshotRefresh(
  surface: TaskSurfaceName | 'all',
  scopeId = 'workspace-main',
): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(SURFACE_PARITY_REFRESH_REQUEST_EVENT, {
      detail: {
        surface,
        scopeId,
        requestedAt: new Date().toISOString(),
      },
    }),
  );
}
