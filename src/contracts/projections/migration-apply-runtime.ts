import {
  readProjectionEnvelope,
  writeProjectionEnvelope,
} from './projection-cache-envelope';

export interface Batch5MigrationApplyRun {
  runId: string;
  workspaceId: string;
  planId: string;
  idempotencyKey: string;
  approvedCheckpointId: string;
  status: 'applied' | 'replayed';
  detail: string;
  appliedAt: string;
}

export interface Batch5RollbackCheckpoint {
  checkpointId: string;
  runId: string;
  workspaceId: string;
  planId: string;
  approvedCheckpointId: string;
  capturedAt: string;
  beforeState: {
    taskCount: number;
    scheduleCount: number;
    taskSampleIds: string[];
    scheduleSampleIds: string[];
    stateSignature: string;
    taskCalendarParityPercent: number;
    crossSurfaceParityPercent: number;
    backendMirrorParityPercent: number;
  };
}

const APPLY_RUNS_STORAGE_KEY = 'syncscript:phase2b:batch5:migration-apply-runs';
const ROLLBACK_CHECKPOINTS_STORAGE_KEY = 'syncscript:phase2b:batch5:migration-rollback-checkpoints';
const ENTRY_LIMIT = 160;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function buildStateSignature(taskIds: string[], scheduleIds: string[]): string {
  const left = taskIds.slice(0, 10).join('|');
  const right = scheduleIds.slice(0, 10).join('|');
  return `t:${taskIds.length}:${left}::s:${scheduleIds.length}:${right}`;
}

export function listBatch5MigrationApplyRuns(limit = 40): Batch5MigrationApplyRun[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(APPLY_RUNS_STORAGE_KEY);
    const envelope = readProjectionEnvelope<Batch5MigrationApplyRun[]>(
      raw,
      (value): value is Batch5MigrationApplyRun[] => Array.isArray(value),
      'batch5-migration-apply-runs',
    );
    if (!envelope) return [];
    return envelope.payload.slice(-Math.max(1, Math.min(limit, ENTRY_LIMIT)));
  } catch {
    return [];
  }
}

function appendBatch5MigrationApplyRun(entry: Batch5MigrationApplyRun): void {
  if (!canUseStorage()) return;
  try {
    const existing = listBatch5MigrationApplyRuns(ENTRY_LIMIT);
    if (existing.some((item) => item.runId === entry.runId)) return;
    existing.push(entry);
    if (existing.length > ENTRY_LIMIT) {
      existing.splice(0, existing.length - ENTRY_LIMIT);
    }
    const envelope = writeProjectionEnvelope(existing, {
      projectionVersion: 1,
      sourceEventCursor: entry.runId,
    });
    window.localStorage.setItem(APPLY_RUNS_STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // best-effort persistence
  }
}

export function listBatch5RollbackCheckpoints(limit = 40): Batch5RollbackCheckpoint[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(ROLLBACK_CHECKPOINTS_STORAGE_KEY);
    const envelope = readProjectionEnvelope<Batch5RollbackCheckpoint[]>(
      raw,
      (value): value is Batch5RollbackCheckpoint[] => Array.isArray(value),
      'batch5-migration-rollback-checkpoints',
    );
    if (!envelope) return [];
    return envelope.payload.slice(-Math.max(1, Math.min(limit, ENTRY_LIMIT)));
  } catch {
    return [];
  }
}

function appendBatch5RollbackCheckpoint(entry: Batch5RollbackCheckpoint): void {
  if (!canUseStorage()) return;
  try {
    const existing = listBatch5RollbackCheckpoints(ENTRY_LIMIT);
    if (existing.some((item) => item.checkpointId === entry.checkpointId)) return;
    existing.push(entry);
    if (existing.length > ENTRY_LIMIT) {
      existing.splice(0, existing.length - ENTRY_LIMIT);
    }
    const envelope = writeProjectionEnvelope(existing, {
      projectionVersion: 1,
      sourceEventCursor: entry.checkpointId,
    });
    window.localStorage.setItem(ROLLBACK_CHECKPOINTS_STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // best-effort persistence
  }
}

export interface ApplyBatch5MigrationInput {
  workspaceId: string;
  planId: string;
  approvedCheckpointId: string;
  idempotencyKey: string;
  tasks: Array<Record<string, unknown>>;
  scheduleEvents: Array<Record<string, unknown>>;
  paritySnapshot?: {
    taskCalendarParityPercent: number;
    crossSurfaceParityPercent: number;
    backendMirrorParityPercent: number;
  };
}

export interface ApplyBatch5MigrationResult {
  run: Batch5MigrationApplyRun;
  rollbackCheckpoint: Batch5RollbackCheckpoint;
  replayed: boolean;
}

export function applyBatch5Migration(input: ApplyBatch5MigrationInput): ApplyBatch5MigrationResult {
  const workspaceId = input.workspaceId || 'workspace-main';
  const now = new Date().toISOString();

  const existingRun = listBatch5MigrationApplyRuns(ENTRY_LIMIT)
    .slice()
    .reverse()
    .find(
      (entry) =>
        entry.workspaceId === workspaceId &&
        entry.idempotencyKey === input.idempotencyKey &&
        entry.planId === input.planId,
    );

  if (existingRun) {
    const existingCheckpoint =
      listBatch5RollbackCheckpoints(ENTRY_LIMIT)
        .slice()
        .reverse()
        .find((entry) => entry.runId === existingRun.runId) || {
        checkpointId: `batch5-rollback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        runId: existingRun.runId,
        workspaceId,
        planId: input.planId,
        approvedCheckpointId: input.approvedCheckpointId,
        capturedAt: now,
        beforeState: {
          taskCount: input.tasks.length,
          scheduleCount: input.scheduleEvents.length,
          taskSampleIds: input.tasks.map((row) => String(row?.id || '')).filter(Boolean).slice(0, 12),
          scheduleSampleIds: input.scheduleEvents
            .map((row) => String(row?.id || ''))
            .filter(Boolean)
            .slice(0, 12),
          stateSignature: buildStateSignature(
            input.tasks.map((row) => String(row?.id || '')).filter(Boolean),
            input.scheduleEvents.map((row) => String(row?.id || '')).filter(Boolean),
          ),
          taskCalendarParityPercent: Math.round(input.paritySnapshot?.taskCalendarParityPercent || 0),
          crossSurfaceParityPercent: Math.round(input.paritySnapshot?.crossSurfaceParityPercent || 0),
          backendMirrorParityPercent: Math.round(input.paritySnapshot?.backendMirrorParityPercent || 0),
        },
      };
    if (!listBatch5RollbackCheckpoints(ENTRY_LIMIT).some((entry) => entry.runId === existingRun.runId)) {
      appendBatch5RollbackCheckpoint(existingCheckpoint);
    }
    return {
      run: { ...existingRun, status: 'replayed' },
      rollbackCheckpoint: existingCheckpoint,
      replayed: true,
    };
  }

  const run: Batch5MigrationApplyRun = {
    runId: `batch5-apply-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    workspaceId,
    planId: input.planId,
    idempotencyKey: input.idempotencyKey,
    approvedCheckpointId: input.approvedCheckpointId,
    status: 'applied',
    detail: 'batch5_migration_apply_scaffold',
    appliedAt: now,
  };

  const taskIds = input.tasks.map((row) => String(row?.id || '')).filter(Boolean);
  const scheduleIds = input.scheduleEvents.map((row) => String(row?.id || '')).filter(Boolean);

  const rollbackCheckpoint: Batch5RollbackCheckpoint = {
    checkpointId: `batch5-rollback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    runId: run.runId,
    workspaceId,
    planId: input.planId,
    approvedCheckpointId: input.approvedCheckpointId,
    capturedAt: now,
    beforeState: {
      taskCount: taskIds.length,
      scheduleCount: scheduleIds.length,
      taskSampleIds: taskIds.slice(0, 12),
      scheduleSampleIds: scheduleIds.slice(0, 12),
      stateSignature: buildStateSignature(taskIds, scheduleIds),
      taskCalendarParityPercent: Math.round(input.paritySnapshot?.taskCalendarParityPercent || 0),
      crossSurfaceParityPercent: Math.round(input.paritySnapshot?.crossSurfaceParityPercent || 0),
      backendMirrorParityPercent: Math.round(input.paritySnapshot?.backendMirrorParityPercent || 0),
    },
  };

  appendBatch5MigrationApplyRun(run);
  appendBatch5RollbackCheckpoint(rollbackCheckpoint);

  return {
    run,
    rollbackCheckpoint,
    replayed: false,
  };
}
