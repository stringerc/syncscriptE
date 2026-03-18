import { getProjectIdForRun } from './execution-trail';

export type ImplementationRunStatus =
  | 'queued'
  | 'planning'
  | 'waiting_approval'
  | 'executing'
  | 'completed'
  | 'failed';

export interface ImplementationRunRecord {
  runId: string;
  title: string;
  objective: string;
  status: ImplementationRunStatus;
  createdAt: string;
  updatedAt: string;
  projectId?: string;
  taskId?: string;
  workspaceId?: string;
  userId?: string;
  agentId?: string;
  agentName?: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  lastEvent?: string;
  metrics?: {
    operationCount?: number;
    approvalTurns?: number;
    failureClass?: string;
  };
}

const IMPLEMENTATION_RUNS_KEY = 'syncscript_implementation_runs_v1';
const IMPLEMENTATION_RUNS_UPDATED_EVENT = 'syncscript:implementation-runs-updated';

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readRuns(): ImplementationRunRecord[] {
  if (typeof window === 'undefined') return [];
  return safeParse<ImplementationRunRecord[]>(window.localStorage.getItem(IMPLEMENTATION_RUNS_KEY), []);
}

function writeRuns(runs: ImplementationRunRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(IMPLEMENTATION_RUNS_KEY, JSON.stringify(runs.slice(0, 2000)));
    window.dispatchEvent(new CustomEvent(IMPLEMENTATION_RUNS_UPDATED_EVENT));
  } catch {
    // non-blocking persistence
  }
}

export function normalizeImplementationRunStatus(raw: unknown): ImplementationRunStatus {
  const value = String(raw || '').toLowerCase().trim();
  if (value === 'queued' || value === 'pending' || value === 'created') return 'queued';
  if (value === 'planning') return 'planning';
  if (value === 'waiting_approval' || value === 'awaiting_approval' || value === 'approval_required' || value === 'paused')
    return 'waiting_approval';
  if (value === 'executing' || value === 'running' || value === 'in_progress' || value === 'in-progress') return 'executing';
  if (value === 'failed' || value === 'error' || value === 'cancelled' || value === 'canceled') return 'failed';
  return 'completed';
}

export function upsertImplementationRun(input: {
  runId: string;
  title?: string;
  objective?: string;
  status: ImplementationRunStatus;
  projectId?: string;
  taskId?: string;
  workspaceId?: string;
  userId?: string;
  agentId?: string;
  agentName?: string;
  lastEvent?: string;
  metadata?: Record<string, any>;
}) {
  const runId = String(input.runId || '').trim();
  if (!runId) return;
  const now = new Date().toISOString();
  const current = readRuns();
  const index = current.findIndex((run) => run.runId === runId);
  const resolvedProject = input.projectId || getProjectIdForRun(runId);
  if (index < 0) {
    const created: ImplementationRunRecord = {
      runId,
      title: String(input.title || 'Implementation run').trim() || 'Implementation run',
      objective: String(input.objective || '').trim(),
      status: input.status,
      projectId: resolvedProject,
      taskId: input.taskId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      agentId: input.agentId,
      agentName: input.agentName,
      createdAt: now,
      updatedAt: now,
      startedAt: input.status === 'executing' ? now : undefined,
      completedAt: input.status === 'completed' ? now : undefined,
      failedAt: input.status === 'failed' ? now : undefined,
      lastEvent: input.lastEvent,
      metrics: {
        operationCount: 0,
        approvalTurns: 0,
        failureClass: String(input.metadata?.failureClass || '').trim() || undefined,
      },
    };
    writeRuns([created, ...current]);
    return;
  }

  const existing = current[index];
  const next: ImplementationRunRecord = {
    ...existing,
    title: String(input.title || existing.title || 'Implementation run').trim() || 'Implementation run',
    objective: String(input.objective || existing.objective || '').trim(),
    status: input.status,
    projectId: resolvedProject || existing.projectId,
    taskId: input.taskId || existing.taskId,
    workspaceId: input.workspaceId || existing.workspaceId,
    userId: input.userId || existing.userId,
    agentId: input.agentId || existing.agentId,
    agentName: input.agentName || existing.agentName,
    updatedAt: now,
    startedAt: existing.startedAt || (input.status === 'executing' ? now : undefined),
    completedAt: input.status === 'completed' ? now : existing.completedAt,
    failedAt: input.status === 'failed' ? now : existing.failedAt,
    lastEvent: input.lastEvent || existing.lastEvent,
    metrics: {
      operationCount: existing.metrics?.operationCount || 0,
      approvalTurns: existing.metrics?.approvalTurns || 0,
      failureClass:
        String(input.metadata?.failureClass || '').trim() ||
        existing.metrics?.failureClass,
    },
  };
  const nextRuns = [...current];
  nextRuns[index] = next;
  writeRuns(nextRuns);
}

export function noteImplementationRunOperation(runId: string, summary?: string) {
  const cleanRunId = String(runId || '').trim();
  if (!cleanRunId) return;
  const current = readRuns();
  const index = current.findIndex((run) => run.runId === cleanRunId);
  if (index < 0) return;
  const run = current[index];
  const nextRuns = [...current];
  nextRuns[index] = {
    ...run,
    status: run.status === 'queued' || run.status === 'planning' ? 'executing' : run.status,
    updatedAt: new Date().toISOString(),
    startedAt: run.startedAt || new Date().toISOString(),
    lastEvent: summary || run.lastEvent,
    metrics: {
      ...run.metrics,
      operationCount: (run.metrics?.operationCount || 0) + 1,
    },
  };
  writeRuns(nextRuns);
}

export function listImplementationRunsForProject(projectId: string, limit = 40): ImplementationRunRecord[] {
  const cleanProjectId = String(projectId || '').trim();
  const max = Math.max(1, Math.min(limit, 200));
  return readRuns()
    .filter((run) => {
      if (!cleanProjectId) return true;
      return run.projectId === cleanProjectId || getProjectIdForRun(run.runId) === cleanProjectId;
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, max);
}

export function getImplementationRunsUpdatedEventName() {
  return IMPLEMENTATION_RUNS_UPDATED_EVENT;
}
