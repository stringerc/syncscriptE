export type ExecutionTrailEventType =
  | 'run_created'
  | 'run_control'
  | 'operation_executed'
  | 'task_created'
  | 'artifact_stored'
  | 'memory_promoted'
  | 'status_updated'
  | 'task_reparented'
  | 'node_promoted'
  | 'branch_compressed'
  | 'integration_connected';

export interface ExecutionTrailEvent {
  id: string;
  createdAt: string;
  type: ExecutionTrailEventType;
  title: string;
  detail?: string;
  projectId?: string;
  taskId?: string;
  runId?: string;
  agentId?: string;
  agentName?: string;
  actor?: string;
  metadata?: Record<string, any>;
}

const EXECUTION_TRAIL_KEY = 'syncscript_execution_trail_v1';
const RUN_PROJECT_LINK_KEY = 'syncscript_run_project_link_v1';
const EXECUTION_TRAIL_UPDATED_EVENT = 'syncscript:execution-trail-updated';

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readEvents(): ExecutionTrailEvent[] {
  if (typeof window === 'undefined') return [];
  return safeParse<ExecutionTrailEvent[]>(window.localStorage.getItem(EXECUTION_TRAIL_KEY), []);
}

function writeEvents(events: ExecutionTrailEvent[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(EXECUTION_TRAIL_KEY, JSON.stringify(events.slice(0, 4000)));
    window.dispatchEvent(new CustomEvent(EXECUTION_TRAIL_UPDATED_EVENT));
  } catch {
    // non-blocking
  }
}

function readRunProjectMap(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  return safeParse<Record<string, string>>(window.localStorage.getItem(RUN_PROJECT_LINK_KEY), {});
}

function writeRunProjectMap(map: Record<string, string>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(RUN_PROJECT_LINK_KEY, JSON.stringify(map));
  } catch {
    // non-blocking
  }
}

export function bindExecutionRunToProject(runId: string, projectId: string) {
  const cleanRunId = String(runId || '').trim();
  const cleanProjectId = String(projectId || '').trim();
  if (!cleanRunId || !cleanProjectId) return;
  const current = readRunProjectMap();
  current[cleanRunId] = cleanProjectId;
  writeRunProjectMap(current);
}

export function getProjectIdForRun(runId: string): string | undefined {
  const cleanRunId = String(runId || '').trim();
  if (!cleanRunId) return undefined;
  return readRunProjectMap()[cleanRunId];
}

export function appendExecutionTrailEvent(
  input: Omit<ExecutionTrailEvent, 'id' | 'createdAt'> & { createdAt?: string },
): ExecutionTrailEvent {
  const event: ExecutionTrailEvent = {
    id: `exec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: input.createdAt || new Date().toISOString(),
    ...input,
  };
  const current = readEvents();
  writeEvents([event, ...current]);
  return event;
}

export function listExecutionTrailEventsForProject(
  projectId: string,
  options?: { includeGlobal?: boolean; limit?: number },
): ExecutionTrailEvent[] {
  const includeGlobal = options?.includeGlobal ?? true;
  const limit = Math.max(1, Math.min(options?.limit || 120, 500));
  const cleanProjectId = String(projectId || '').trim();
  const events = readEvents()
    .filter((event) => {
      if (!cleanProjectId) return true;
      if (event.projectId === cleanProjectId) return true;
      if (event.runId) {
        const mappedProject = getProjectIdForRun(event.runId);
        if (mappedProject && mappedProject === cleanProjectId) return true;
      }
      return includeGlobal && !event.projectId;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return events.slice(0, limit);
}

export function getExecutionTrailUpdatedEventName() {
  return EXECUTION_TRAIL_UPDATED_EVENT;
}
