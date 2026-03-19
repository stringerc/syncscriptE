import {
  readProjectionEnvelope,
  writeProjectionEnvelope,
} from './projection-cache-envelope';

export interface Batch5MigrationBoundaryPlan {
  planId: string;
  workspaceId: string;
  capturedAt: string;
  mode: 'dry_run' | 'apply';
  windows: {
    task: {
      from: string | null;
      to: string | null;
      entityCount: number;
      sampledEntityIds: string[];
    };
    schedule: {
      from: string | null;
      to: string | null;
      entityCount: number;
      sampledEntityIds: string[];
    };
  };
  replayPolicy: {
    idempotent: boolean;
    rollbackCheckpointRequired: boolean;
    parityGuard: 'strict';
  };
}

const STORAGE_KEY = 'syncscript:phase2b:batch5:migration-boundary-plans';
const ENTRY_LIMIT = 120;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function listBatch5MigrationBoundaryPlans(limit = 24): Batch5MigrationBoundaryPlan[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const envelope = readProjectionEnvelope<Batch5MigrationBoundaryPlan[]>(
      raw,
      (value): value is Batch5MigrationBoundaryPlan[] => Array.isArray(value),
      'batch5-migration-boundary-plans',
    );
    if (!envelope) return [];
    return envelope.payload.slice(-Math.max(1, Math.min(limit, ENTRY_LIMIT)));
  } catch {
    return [];
  }
}

export function appendBatch5MigrationBoundaryPlan(plan: Batch5MigrationBoundaryPlan): void {
  if (!canUseStorage()) return;
  try {
    const existing = listBatch5MigrationBoundaryPlans(ENTRY_LIMIT);
    if (existing.some((entry) => entry.planId === plan.planId)) return;
    existing.push(plan);
    if (existing.length > ENTRY_LIMIT) {
      existing.splice(0, existing.length - ENTRY_LIMIT);
    }
    const envelope = writeProjectionEnvelope(existing, {
      projectionVersion: 1,
      sourceEventCursor: plan.planId,
    });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // best-effort persistence only
  }
}

function toIsoOrNull(value: unknown): string | null {
  const parsed = value instanceof Date ? value : new Date(String(value || ''));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function minIso(values: Array<string | null>): string | null {
  const filtered = values.filter((value): value is string => Boolean(value));
  if (filtered.length === 0) return null;
  return filtered.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
}

function maxIso(values: Array<string | null>): string | null {
  const filtered = values.filter((value): value is string => Boolean(value));
  if (filtered.length === 0) return null;
  return filtered.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
}

export function buildBatch5MigrationBoundaryPlan(input: {
  workspaceId: string;
  tasks: Array<Record<string, unknown>>;
  scheduleEvents: Array<Record<string, unknown>>;
  mode?: 'dry_run' | 'apply';
}): Batch5MigrationBoundaryPlan {
  const taskTimes = input.tasks.flatMap((task) => [
    toIsoOrNull(task?.createdAt),
    toIsoOrNull(task?.updatedAt),
    toIsoOrNull(task?.dueDate),
    toIsoOrNull((task as any)?.scheduledTime),
  ]);
  const scheduleTimes = input.scheduleEvents.flatMap((event) => [
    toIsoOrNull(event?.createdAt),
    toIsoOrNull(event?.updatedAt),
    toIsoOrNull((event as any)?.startTime || event?.start),
    toIsoOrNull((event as any)?.endTime || event?.end),
  ]);

  const taskIds = input.tasks.map((task) => String(task?.id || '')).filter(Boolean);
  const scheduleIds = input.scheduleEvents.map((event) => String(event?.id || '')).filter(Boolean);
  const now = new Date().toISOString();

  return {
    planId: `batch5-plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    workspaceId: input.workspaceId || 'workspace-main',
    capturedAt: now,
    mode: input.mode || 'dry_run',
    windows: {
      task: {
        from: minIso(taskTimes),
        to: maxIso(taskTimes),
        entityCount: taskIds.length,
        sampledEntityIds: taskIds.slice(0, 10),
      },
      schedule: {
        from: minIso(scheduleTimes),
        to: maxIso(scheduleTimes),
        entityCount: scheduleIds.length,
        sampledEntityIds: scheduleIds.slice(0, 10),
      },
    },
    replayPolicy: {
      idempotent: true,
      rollbackCheckpointRequired: true,
      parityGuard: 'strict',
    },
  };
}
