import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { toast } from 'sonner@2.0.3';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { WorkstreamFlowCanvas } from './WorkstreamFlowCanvas';
import { useTeam } from '../../contexts/TeamContext';
import {
  assignGoalToProject,
  createWorkspaceProject,
  getGoalProjectMap,
  listWorkspaceProjects,
  updateWorkspaceProject,
} from '../../utils/work-operating-model';
import type { WorkstreamFlowDocument } from '../../types/workstream-flow';
import {
  appendExecutionTrailEvent,
  getExecutionTrailUpdatedEventName,
  listExecutionTrailEventsForProject,
} from '../../utils/execution-trail';
import {
  getImplementationRunsUpdatedEventName,
  listImplementationRunsForProject,
  type ImplementationRunStatus,
} from '../../utils/execution-runs';
import { isWorkstreamFlowCanvasEnabled } from '../../utils/feature-gates';
import { classifyTaskStatusLane } from '../../utils/work-linkage';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';
import { createEmptyEvent } from '../../utils/sample-event-data';
import { buildTaskCalendarParityReport } from '../../contracts/projections/task-calendar-parity';
import { buildTaskAssignmentParityReport } from '../../contracts/projections/task-assignment-parity';
import { buildTaskSurfaceParityReport } from '../../contracts/projections/task-surface-parity';
import { buildSurfaceParityActions } from '../../contracts/projections/surface-parity-actions';
import {
  autoResolveSurfaceParityIncidents,
  appendSurfaceParityIncident,
  buildSurfaceParityIncidentPolicy,
  dueAtFromNow,
  evaluateSurfaceParityEscalation,
  evaluateSurfaceSnapshotAlarm,
  getSurfaceParityDriftState,
  isSurfaceParityIncidentRunbookComplete,
  listSurfaceParityIncidents,
  toggleSurfaceParityIncidentRunbookStep,
  updateSurfaceParityIncidentStatus,
} from '../../contracts/projections/surface-parity-incidents';
import {
  appendReconciliationLog,
  createReconciliationRunId,
  hasReconciliationActionApplied,
  listReconciliationLog,
} from '../../contracts/projections/reconciliation-log';
import { evaluateTaskCalendarParity } from '../../contracts/projections/parity-guardrail';
import { buildParityReconciliationActions } from '../../contracts/projections/parity-reconciliation-actions';
import {
  appendReconciliationSnapshot,
  listReconciliationSnapshots,
} from '../../contracts/projections/reconciliation-snapshots';
import {
  getTaskSurfaceSnapshotState,
  recordTaskSurfaceSnapshot,
  requestTaskSurfaceSnapshotRefresh,
  SURFACE_PARITY_SNAPSHOT_EVENT,
} from '../../contracts/projections/surface-parity-runtime';
import { runBackendShadowParityProbe, type BackendShadowParityReport } from '../../contracts/runtime/backend-shadow-parity';
import {
  syncShadowGoalProjection,
  syncShadowProjectProjection,
  syncShadowScheduleProjection,
  syncShadowTaskProjection,
} from '../../contracts/runtime/backend-projection-mirror';
import {
  AUTHORITY_ROUTING_FLAG_KEYS,
  executeAuthorityRoutedCommand,
  getAuthorityRoutingSnapshot,
} from '../../contracts/runtime/backend-authority-routing';
import {
  getReadAuthorityRoutingSnapshot,
  READ_AUTHORITY_FLAG_KEYS,
} from '../../contracts/runtime/backend-read-authority';
import {
  getLatestReadAuthorityProvenanceBySurface,
  listReadAuthorityProvenance,
} from '../../contracts/projections/read-authority-provenance';
import {
  appendBatch5MigrationBoundaryPlan,
  buildBatch5MigrationBoundaryPlan,
  listBatch5MigrationBoundaryPlans,
} from '../../contracts/projections/migration-boundary-planner';
import {
  applyBatch5Migration,
  listBatch5MigrationApplyRuns,
  listBatch5RollbackCheckpoints,
} from '../../contracts/projections/migration-apply-runtime';
import { commandFailure, commandSuccess } from '../../contracts/core/command-contract';

type AnyTask = Record<string, any>;
type AnyGoal = Record<string, any>;

type DragPayload =
  | {
      kind: 'task';
      taskId: string;
      title: string;
    }
  | {
      kind: 'milestone';
      taskId: string;
      milestoneId: string;
      title: string;
    }
  | {
      kind: 'step';
      taskId: string;
      milestoneId: string;
      stepId: string;
      title: string;
    };

type StatusLane = 'pending' | 'todo' | 'doing' | 'done';
type RunFilter = 'all' | ImplementationRunStatus;
type ProjectTab = 'overview' | 'status' | 'command';
type Batch1ReadinessVerdict = 'go' | 'no_go';
type Batch5RolloutGateVerdict = 'go' | 'no_go';

interface Batch1ShadowReadiness {
  verdict: Batch1ReadinessVerdict;
  summary: string;
  checks: Array<{
    id: string;
    label: string;
    pass: boolean;
    detail: string;
  }>;
}

interface Batch5RolloutGate {
  verdict: Batch5RolloutGateVerdict;
  summary: string;
  checks: Array<{
    id: string;
    label: string;
    pass: boolean;
    detail: string;
  }>;
}

interface Batch1ReadinessSnapshot {
  workspaceId: string;
  capturedAt: string;
  verdict: Batch1ReadinessVerdict;
  summary: string;
  checks: Array<{
    id: string;
    label: string;
    pass: boolean;
    detail: string;
  }>;
}

interface Batch1ReadinessCheckpoint {
  checkpointId: string;
  label: string;
  workspaceId: string;
  createdAt: string;
  status: 'candidate' | 'approved';
  readiness: Batch1ShadowReadiness;
  approvedAt?: string;
  approvedBy?: string;
  approverNote?: string;
  integrity: {
    algorithm: 'sha256';
    hash: string;
  };
}

function runStatusClasses(status: ImplementationRunStatus): string {
  if (status === 'completed') return 'border-emerald-500/40 text-emerald-300';
  if (status === 'failed') return 'border-rose-500/40 text-rose-300';
  if (status === 'waiting_approval') return 'border-amber-500/40 text-amber-300';
  if (status === 'executing') return 'border-cyan-500/40 text-cyan-300';
  if (status === 'planning') return 'border-indigo-500/40 text-indigo-300';
  return 'border-gray-600 text-gray-300';
}

function normalizeStatus(input: any): string {
  return String(input || '').toLowerCase().trim();
}

function extractBlockingDependencyIds(task: AnyTask): string[] {
  const deps = Array.isArray(task?.dependencies) ? task.dependencies : [];
  return deps
    .map((dep: any) => {
      if (typeof dep === 'string') return dep;
      if (!dep || typeof dep !== 'object') return '';
      const depType = normalizeStatus(dep.type);
      if (depType && depType !== 'blocked-by' && depType !== 'blocks' && depType !== 'related') {
        return '';
      }
      return String(dep.dependsOn || dep.taskId || dep.id || '').trim();
    })
    .filter(Boolean);
}

function getIncompleteBlockingTasks(task: AnyTask, byId: Map<string, AnyTask>): AnyTask[] {
  const dependencyIds = extractBlockingDependencyIds(task);
  return dependencyIds
    .map((id) => byId.get(id))
    .filter((dep): dep is AnyTask => Boolean(dep) && !dep.completed);
}

function classifyTaskStatus(task: AnyTask, byId: Map<string, AnyTask>): 'pending' | 'todo' | 'doing' | 'done' {
  return classifyTaskStatusLane(task, byId);
}

function coerceTaskProjectId(task: AnyTask): string {
  const raw = String(task?.projectId || '').trim();
  return raw || 'project-general';
}

function safeDateDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

const SURFACE_STALE_AFTER_MS = 20 * 60_000;
const SURFACE_CRITICAL_STALE_AFTER_MS = 45 * 60_000;
const BATCH1_READINESS_HISTORY_KEY = 'syncscript:phase2b:batch1-readiness-history';
const BATCH1_READINESS_CHECKPOINTS_KEY = 'syncscript:phase2b:batch1-readiness-checkpoints';

function snapshotFreshnessLabel(capturedAt: string | null): string {
  if (!capturedAt) return 'Not observed yet';
  const ageMs = Date.now() - new Date(capturedAt).getTime();
  if (!Number.isFinite(ageMs) || ageMs < 0) return 'Just now';
  if (ageMs < 60_000) return 'Fresh (<1m)';
  if (ageMs < 15 * 60_000) return `Fresh (${Math.round(ageMs / 60_000)}m)`;
  return `Stale (${Math.round(ageMs / 60_000)}m)`;
}

function dueInLabel(dueAt: string | null | undefined): string {
  if (!dueAt) return 'n/a';
  const deltaMs = new Date(dueAt).getTime() - Date.now();
  const minutes = Math.round(Math.abs(deltaMs) / 60_000);
  if (deltaMs < 0) return `Overdue ${minutes}m`;
  if (minutes < 1) return 'Due now';
  return `In ${minutes}m`;
}

function normalizeForHash(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((entry) => normalizeForHash(entry));
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    const normalized: Record<string, unknown> = {};
    for (const key of keys) {
      normalized[key] = normalizeForHash(record[key]);
    }
    return normalized;
  }
  return value;
}

async function computeSha256Hex(payload: unknown): Promise<string> {
  const normalized = normalizeForHash(payload);
  const message = JSON.stringify(normalized);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(message);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }
  let hash = 2166136261;
  for (let index = 0; index < message.length; index += 1) {
    hash ^= message.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fallback-${(hash >>> 0).toString(16)}`;
}

function getTaskMilestones(task: AnyTask): any[] {
  if (Array.isArray(task?.milestones)) return task.milestones;
  if (Array.isArray(task?.subtasks)) return task.subtasks;
  return [];
}

function buildBatch1ShadowReadiness(input: {
  taskCalendarParityPercent: number;
  crossSurfaceParityPercent: number;
  backendMirrorParityPercent: number;
  unavailableBackendDomains: string[];
  backendDomainCount: number;
}): Batch1ShadowReadiness {
  const checks = [
    {
      id: 'task_calendar_parity',
      label: 'Task-calendar parity >= 90%',
      pass: input.taskCalendarParityPercent >= 90,
      detail: `${input.taskCalendarParityPercent}%`,
    },
    {
      id: 'cross_surface_parity',
      label: 'Cross-surface parity >= 90%',
      pass: input.crossSurfaceParityPercent >= 90,
      detail: `${input.crossSurfaceParityPercent}%`,
    },
    {
      id: 'backend_mirror_parity',
      label: 'Backend mirror parity >= 90%',
      pass: input.backendMirrorParityPercent >= 90,
      detail: `${input.backendMirrorParityPercent}%`,
    },
    {
      id: 'backend_domain_availability',
      label: 'All backend mirror domains available',
      pass: input.unavailableBackendDomains.length === 0 && input.backendDomainCount === 4,
      detail:
        input.unavailableBackendDomains.length === 0
          ? `${input.backendDomainCount}/4 domains available`
          : `Unavailable: ${input.unavailableBackendDomains.join(', ')}`,
    },
  ];

  const passCount = checks.filter((check) => check.pass).length;
  const verdict: Batch1ReadinessVerdict = passCount === checks.length ? 'go' : 'no_go';
  const summary =
    verdict === 'go'
      ? 'Batch 1 shadow-readiness gates passed.'
      : `Batch 1 shadow-readiness blocked (${passCount}/${checks.length} checks passing).`;

  return {
    verdict,
    summary,
    checks,
  };
}

function buildBatch5RolloutGate(input: {
  approvedCheckpointSelected: boolean;
  hasMigrationPlan: boolean;
  hasApplyRun: boolean;
  hasRollbackCheckpoint: boolean;
  taskCalendarParityPercent: number;
  crossSurfaceParityPercent: number;
  backendMirrorParityPercent: number;
  replayAssertionPassed: boolean;
  replayAssertionRunId: string;
  latestApplyRunId: string;
}): Batch5RolloutGate {
  const checks = [
    {
      id: 'approved_checkpoint_selected',
      label: 'Approved checkpoint selected',
      pass: input.approvedCheckpointSelected,
      detail: input.approvedCheckpointSelected ? 'selected' : 'missing',
    },
    {
      id: 'migration_plan_present',
      label: 'Migration plan generated',
      pass: input.hasMigrationPlan,
      detail: input.hasMigrationPlan ? 'present' : 'missing',
    },
    {
      id: 'migration_apply_recorded',
      label: 'Migration apply run recorded',
      pass: input.hasApplyRun,
      detail: input.hasApplyRun ? 'recorded' : 'missing',
    },
    {
      id: 'rollback_checkpoint_present',
      label: 'Rollback checkpoint linked',
      pass: input.hasRollbackCheckpoint,
      detail: input.hasRollbackCheckpoint ? 'linked' : 'missing',
    },
    {
      id: 'task_calendar_parity',
      label: 'Task-calendar parity >= 90%',
      pass: input.taskCalendarParityPercent >= 90,
      detail: `${input.taskCalendarParityPercent}%`,
    },
    {
      id: 'cross_surface_parity',
      label: 'Cross-surface parity >= 90%',
      pass: input.crossSurfaceParityPercent >= 90,
      detail: `${input.crossSurfaceParityPercent}%`,
    },
    {
      id: 'backend_mirror_parity',
      label: 'Backend mirror parity >= 90%',
      pass: input.backendMirrorParityPercent >= 90,
      detail: `${input.backendMirrorParityPercent}%`,
    },
    {
      id: 'replay_parity_assertion',
      label: 'Replay parity assertion passed',
      pass: input.replayAssertionPassed && input.replayAssertionRunId === input.latestApplyRunId,
      detail:
        input.replayAssertionPassed && input.replayAssertionRunId === input.latestApplyRunId
          ? 'passed'
          : 'missing_or_failed',
    },
  ];
  const passCount = checks.filter((check) => check.pass).length;
  const verdict: Batch5RolloutGateVerdict = passCount === checks.length ? 'go' : 'no_go';
  const summary =
    verdict === 'go'
      ? 'Batch 5 rollout gate passed (approved checkpoint + replay parity assertions).'
      : `Batch 5 rollout gate blocked (${passCount}/${checks.length} checks passing).`;
  return {
    verdict,
    summary,
    checks,
  };
}

function readBatch1ReadinessHistory(): Batch1ReadinessSnapshot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(BATCH1_READINESS_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return null;
        const record = entry as Record<string, unknown>;
        const workspaceId = String(record.workspaceId || '').trim();
        const capturedAt = String(record.capturedAt || '').trim();
        const verdict = record.verdict === 'go' ? 'go' : 'no_go';
        const summary = String(record.summary || '').trim();
        const checks = Array.isArray(record.checks) ? (record.checks as any[]) : [];
        if (!workspaceId || !capturedAt) return null;
        return {
          workspaceId,
          capturedAt,
          verdict,
          summary,
          checks: checks.map((check) => ({
            id: String(check?.id || ''),
            label: String(check?.label || ''),
            pass: Boolean(check?.pass),
            detail: String(check?.detail || ''),
          })),
        } as Batch1ReadinessSnapshot;
      })
      .filter(Boolean) as Batch1ReadinessSnapshot[];
  } catch {
    return [];
  }
}

function writeBatch1ReadinessHistory(entries: Batch1ReadinessSnapshot[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BATCH1_READINESS_HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // Ignore storage write failures in telemetry/history path.
  }
}

function readBatch1ReadinessCheckpoints(): Batch1ReadinessCheckpoint[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(BATCH1_READINESS_CHECKPOINTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return null;
        const record = entry as Record<string, unknown>;
        const checkpointId = String(record.checkpointId || '').trim();
        const label = String(record.label || '').trim();
        const workspaceId = String(record.workspaceId || '').trim();
        const createdAt = String(record.createdAt || '').trim();
        const status = record.status === 'approved' ? 'approved' : 'candidate';
        const readiness = record.readiness as Batch1ShadowReadiness | undefined;
        const integrity = record.integrity as { algorithm?: string; hash?: string } | undefined;
        if (!checkpointId || !label || !workspaceId || !createdAt || !readiness || !integrity?.hash) return null;
        return {
          checkpointId,
          label,
          workspaceId,
          createdAt,
          status,
          readiness,
          approvedAt: record.approvedAt ? String(record.approvedAt) : undefined,
          approvedBy: record.approvedBy ? String(record.approvedBy) : undefined,
          approverNote: record.approverNote ? String(record.approverNote) : undefined,
          integrity: {
            algorithm: 'sha256',
            hash: String(integrity.hash),
          },
        } as Batch1ReadinessCheckpoint;
      })
      .filter(Boolean) as Batch1ReadinessCheckpoint[];
  } catch {
    return [];
  }
}

function writeBatch1ReadinessCheckpoints(entries: Batch1ReadinessCheckpoint[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BATCH1_READINESS_CHECKPOINTS_KEY, JSON.stringify(entries));
  } catch {
    // Ignore storage write failures in checkpoint path.
  }
}

function buildMilestonePatch(task: AnyTask, nextMilestones: any[]): Record<string, any> {
  if (Array.isArray(task?.milestones)) return { milestones: nextMilestones };
  if (Array.isArray(task?.subtasks)) return { subtasks: nextMilestones };
  return { milestones: nextMilestones };
}

function getPrimaryAssigneeLabel(task: AnyTask): string {
  const assignees = Array.isArray(task?.assignees) ? task.assignees : [];
  const first = assignees[0];
  if (!first) return 'Unassigned';
  if (typeof first === 'string') return first;
  return String(first?.name || first?.email || first?.id || 'Unassigned');
}

interface ProjectsOperatingSystemProps {
  tasks: AnyTask[];
  goals: AnyGoal[];
  updateTask: (id: string, updates: any) => Promise<any>;
  createTask: (input: any) => Promise<any>;
  deleteTask?: (id: string) => Promise<void>;
  mode?: 'projects' | 'workstream';
}

export function ProjectsOperatingSystem({
  tasks,
  goals,
  updateTask,
  createTask,
  deleteTask,
  mode = 'projects',
}: ProjectsOperatingSystemProps) {
  const [projectName, setProjectName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('project-general');
  const [internalTab, setInternalTab] = useState<ProjectTab>('overview');
  const [projectVersion, setProjectVersion] = useState(0);
  const [goalLinkVersion, setGoalLinkVersion] = useState(0);
  const [trailVersion, setTrailVersion] = useState(0);
  const [runStatusFilter, setRunStatusFilter] = useState<RunFilter>('all');
  const [flowInspectorTaskId, setFlowInspectorTaskId] = useState<string | null>(null);
  const [flowInspectorTitle, setFlowInspectorTitle] = useState('');
  const [flowInspectorStatus, setFlowInspectorStatus] = useState('todo');
  const [flowInspectorPriority, setFlowInspectorPriority] = useState('medium');
  const [flowQuickAddTitle, setFlowQuickAddTitle] = useState('');
  const [highlightTaskId, setHighlightTaskId] = useState<string | null>(null);
  const [collapsedTaskIds, setCollapsedTaskIds] = useState<Record<string, boolean>>({});
  const [showCompressedBranches, setShowCompressedBranches] = useState(false);
  const [workstreamBlankStart, setWorkstreamBlankStart] = useState(true);
  const { events: calendarEvents, addEvent, deleteEvent } = useCalendarEvents();
  const { teams } = useTeam();
  const [contractPulse, setContractPulse] = useState<{ eventType: string; occurredAt: string } | null>(null);
  const [reconciliationVersion, setReconciliationVersion] = useState(0);
  const [surfaceParityVersion, setSurfaceParityVersion] = useState(0);
  const [showSurfaceParityActions, setShowSurfaceParityActions] = useState(false);
  const [surfaceIncidentVersion, setSurfaceIncidentVersion] = useState(0);
  const [showParityActions, setShowParityActions] = useState(false);
  const [parityApplying, setParityApplying] = useState(false);
  const [paritySafeMode, setParitySafeMode] = useState(true);
  const [reconciliationModeFilter, setReconciliationModeFilter] = useState<'all' | 'apply' | 'dry_run'>('all');
  const [reconciliationOutcomeFilter, setReconciliationOutcomeFilter] = useState<'all' | 'simulated' | 'applied' | 'skipped' | 'failed'>('all');
  const parityApplyLockRef = useRef<string | null>(null);
  const projectTasksRef = useRef<AnyTask[]>([]);
  const projectCalendarEventsRef = useRef<any[]>([]);
  const parityReportRef = useRef<ReturnType<typeof buildTaskCalendarParityReport> | null>(null);
  const [shadowParityReport, setShadowParityReport] = useState<BackendShadowParityReport | null>(null);
  const [batch1ReadinessHistoryVersion, setBatch1ReadinessHistoryVersion] = useState(0);
  const [batch1ReadinessCheckpointVersion, setBatch1ReadinessCheckpointVersion] = useState(0);
  const [authoritySnapshotVersion, setAuthoritySnapshotVersion] = useState(0);
  const [batch5MigrationPlanVersion, setBatch5MigrationPlanVersion] = useState(0);
  const [batch5MigrationApplyVersion, setBatch5MigrationApplyVersion] = useState(0);
  const [batch5ReplayAssertion, setBatch5ReplayAssertion] = useState<{
    passed: boolean;
    runId: string;
    checkedAt: string;
    detail: string;
  } | null>(null);
  const [selectedApprovedCheckpointId, setSelectedApprovedCheckpointId] = useState<string>('');
  const lastReadinessSnapshotSignatureRef = useRef<string>('');
  const [blockerRun, setBlockerRun] = useState<{
    sourceTaskId: string;
    blockerIds: string[];
    index: number;
  } | null>(null);

  const projects = useMemo(() => listWorkspaceProjects(), [projectVersion, tasks.length, goals.length]);
  const flowCanvasEnabled = useMemo(() => isWorkstreamFlowCanvasEnabled(), []);
  const goalProjectMap = useMemo(() => getGoalProjectMap(), [goalLinkVersion, goals.length]);
  const tasksById = useMemo(() => new Map(tasks.map((task) => [String(task.id), task])), [tasks]);
  const projectExecutionTrail = useMemo(
    () => listExecutionTrailEventsForProject(selectedProjectId, { includeGlobal: true, limit: 80 }),
    [selectedProjectId, trailVersion],
  );
  const projectRuns = useMemo(
    () => listImplementationRunsForProject(selectedProjectId, 24),
    [selectedProjectId, trailVersion],
  );
  const runStatusCounts = useMemo(() => {
    const counts: Record<RunFilter, number> = {
      all: projectRuns.length,
      queued: 0,
      planning: 0,
      waiting_approval: 0,
      executing: 0,
      completed: 0,
      failed: 0,
    };
    for (const run of projectRuns) {
      counts[run.status] += 1;
    }
    return counts;
  }, [projectRuns]);
  const filteredProjectRuns = useMemo(
    () => (runStatusFilter === 'all' ? projectRuns : projectRuns.filter((run) => run.status === runStatusFilter)),
    [projectRuns, runStatusFilter],
  );

  const projectTasks = useMemo(
    () => tasks.filter((task) => coerceTaskProjectId(task) === selectedProjectId),
    [tasks, selectedProjectId],
  );
  const projectTaskIdSet = useMemo(() => {
    return new Set(projectTasks.map((task) => String(task.id)));
  }, [projectTasks]);
  const projectScheduledEventIdSet = useMemo(() => {
    return new Set(
      projectTasks
        .map((task) => String((task as any)?.scheduledEventId || '').trim())
        .filter(Boolean),
    );
  }, [projectTasks]);
  const projectCalendarEvents = useMemo(
    () =>
      calendarEvents.filter((event: any) => {
        const eventIds = [String((event as any)?.id || '').trim(), String((event as any)?.entityId || '').trim()].filter(Boolean);
        if (eventIds.some((eventId) => projectScheduledEventIdSet.has(eventId))) return true;
        const createdFromTaskId = String((event as any)?.createdFromTaskId || '').trim();
        const sourceTaskId = String((event as any)?.sourceTaskId || '').trim();
        if (createdFromTaskId && projectTaskIdSet.has(createdFromTaskId)) return true;
        if (sourceTaskId && projectTaskIdSet.has(sourceTaskId)) return true;
        const linkedTaskIds = Array.isArray((event as any)?.linkedTaskIds) ? (event as any).linkedTaskIds : [];
        if (linkedTaskIds.some((taskId: any) => projectTaskIdSet.has(String(taskId || '')))) return true;
        const linkedTasks = Array.isArray((event as any)?.tasks) ? (event as any).tasks : [];
        return linkedTasks.some((task: any) => projectTaskIdSet.has(String(task?.id || '')));
      }),
    [calendarEvents, projectTaskIdSet, projectScheduledEventIdSet],
  );
  const parityReport = useMemo(
    () => buildTaskCalendarParityReport(projectTasks as any[], projectCalendarEvents as any[]),
    [projectTasks, projectCalendarEvents],
  );
  const parityScorePercent = useMemo(
    () => Math.round((parityReport.parityScore || 0) * 100),
    [parityReport.parityScore],
  );
  const parityGuardrail = useMemo(
    () => evaluateTaskCalendarParity(parityReport),
    [parityReport],
  );
  const assignmentParityReport = useMemo(
    () =>
      buildTaskAssignmentParityReport(projectTasks as any[], {
        canonicalIds: Array.from(
          new Set(
            teams
              .flatMap((team) => team.members || [])
              .map((member) => String((member as any)?.userId || '').trim())
              .filter(Boolean),
          ),
        ),
        canonicalEmails: Array.from(
          new Set(
            teams
              .flatMap((team) => team.members || [])
              .map((member) => String((member as any)?.email || '').trim().toLowerCase())
              .filter(Boolean),
          ),
        ),
      }),
    [projectTasks, teams],
  );
  const assignmentParityPercent = useMemo(
    () => Math.round((assignmentParityReport.parityScore || 0) * 100),
    [assignmentParityReport.parityScore],
  );
  const taskSurfaceSnapshots = useMemo(
    () => ({
      tasksTab: getTaskSurfaceSnapshotState('tasks_tab', selectedProjectId, 'workspace-main'),
      workstream: getTaskSurfaceSnapshotState('workstream', selectedProjectId, 'workspace-main'),
      projects: getTaskSurfaceSnapshotState('projects', selectedProjectId, 'workspace-main'),
      dashboard: getTaskSurfaceSnapshotState('dashboard', selectedProjectId, 'workspace-main'),
      goals: getTaskSurfaceSnapshotState('goals', selectedProjectId, 'workspace-main'),
      resonance: getTaskSurfaceSnapshotState('resonance', selectedProjectId, 'workspace-main'),
      aiAssistant: getTaskSurfaceSnapshotState('ai_assistant', selectedProjectId, 'workspace-main'),
    }),
    [selectedProjectId, surfaceParityVersion],
  );
  const taskSurfaceParityReport = useMemo(() => {
    const scoped = (ids: string[]) =>
      ids.filter((id) => projectTaskIdSet.has(String(id))).map((id) => ({ id: String(id) }));
    return buildTaskSurfaceParityReport({
      tasksTab: projectTasks.map((task) => ({ id: String(task.id) })),
      workstream: taskSurfaceSnapshots.workstream.observed ? scoped(taskSurfaceSnapshots.workstream.taskIds) : null,
      projects: taskSurfaceSnapshots.projects.observed ? scoped(taskSurfaceSnapshots.projects.taskIds) : null,
      dashboard: taskSurfaceSnapshots.dashboard.observed ? scoped(taskSurfaceSnapshots.dashboard.taskIds) : null,
      goals: taskSurfaceSnapshots.goals.observed ? scoped(taskSurfaceSnapshots.goals.taskIds) : null,
      resonance: taskSurfaceSnapshots.resonance.observed
        ? scoped(taskSurfaceSnapshots.resonance.taskIds)
        : null,
      aiAssistant: taskSurfaceSnapshots.aiAssistant.observed
        ? scoped(taskSurfaceSnapshots.aiAssistant.taskIds)
        : null,
    });
  }, [projectTaskIdSet, projectTasks, taskSurfaceSnapshots]);
  const taskSurfaceParityPercent = useMemo(
    () => Math.round((taskSurfaceParityReport.parityScore || 0) * 100),
    [taskSurfaceParityReport.parityScore],
  );
  const taskSurfaceParityActions = useMemo(
    () => buildSurfaceParityActions(taskSurfaceParityReport, taskSurfaceSnapshots),
    [taskSurfaceParityReport, taskSurfaceSnapshots],
  );
  const surfaceParityMissingTotal = useMemo(
    () =>
      taskSurfaceParityReport.missingInWorkstream.length +
      taskSurfaceParityReport.missingInProjects.length +
      taskSurfaceParityReport.missingInDashboard.length +
      taskSurfaceParityReport.missingInGoals.length +
      taskSurfaceParityReport.missingInResonance.length +
      taskSurfaceParityReport.missingInAIAssistant.length,
    [taskSurfaceParityReport],
  );
  const staleSurfaceNames = useMemo(
    () =>
      Object.entries({
        tasks_tab: taskSurfaceSnapshots.tasksTab,
        workstream: taskSurfaceSnapshots.workstream,
        projects: taskSurfaceSnapshots.projects,
        dashboard: taskSurfaceSnapshots.dashboard,
        goals: taskSurfaceSnapshots.goals,
        resonance: taskSurfaceSnapshots.resonance,
        ai_assistant: taskSurfaceSnapshots.aiAssistant,
      })
        .filter(([, snapshot]) => Boolean(snapshot?.observed && snapshot?.capturedAt))
        .map(([surface, snapshot]) => ({
          surface,
          ageMs: Math.max(0, Date.now() - new Date(String(snapshot?.capturedAt)).getTime()),
        }))
        .filter((entry) => Number.isFinite(entry.ageMs) && entry.ageMs > SURFACE_STALE_AFTER_MS)
        .map((entry) => entry.surface),
    [surfaceParityVersion, taskSurfaceSnapshots],
  );
  const surfaceDriftState = useMemo(
    () => getSurfaceParityDriftState(selectedProjectId || 'workspace-main'),
    [selectedProjectId, surfaceIncidentVersion],
  );
  const recentSurfaceIncidents = useMemo(
    () =>
      listSurfaceParityIncidents(16)
        .filter(
          (entry) => entry.workspaceId === selectedProjectId || entry.workspaceId === 'workspace-main',
        )
        .reverse(),
    [selectedProjectId, surfaceIncidentVersion],
  );
  const batch1Readiness = useMemo(
    () =>
      buildBatch1ShadowReadiness({
        taskCalendarParityPercent: parityScorePercent,
        crossSurfaceParityPercent: taskSurfaceParityPercent,
        backendMirrorParityPercent: Math.round((shadowParityReport?.parityScore || 0) * 100),
        unavailableBackendDomains: shadowParityReport?.unavailableDomains || [],
        backendDomainCount: shadowParityReport?.domains.length || 0,
      }),
    [parityScorePercent, shadowParityReport, taskSurfaceParityPercent],
  );
  const batch1ReadinessHistory = useMemo(
    () =>
      readBatch1ReadinessHistory()
        .filter((entry) => entry.workspaceId === selectedProjectId || entry.workspaceId === 'workspace-main')
        .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
        .slice(0, 12),
    [batch1ReadinessHistoryVersion, selectedProjectId],
  );
  const batch1ReadinessCheckpoints = useMemo(
    () =>
      readBatch1ReadinessCheckpoints()
        .filter((entry) => entry.workspaceId === selectedProjectId || entry.workspaceId === 'workspace-main')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 12),
    [batch1ReadinessCheckpointVersion, selectedProjectId],
  );
  const approvedBatch1Checkpoints = useMemo(
    () => batch1ReadinessCheckpoints.filter((entry) => entry.status === 'approved'),
    [batch1ReadinessCheckpoints],
  );
  const authorityRoutingSnapshot = useMemo(
    () => getAuthorityRoutingSnapshot(),
    [batch1ReadinessHistoryVersion, batch1ReadinessCheckpointVersion, authoritySnapshotVersion],
  );
  const readAuthorityRoutingSnapshot = useMemo(
    () => getReadAuthorityRoutingSnapshot(),
    [batch1ReadinessHistoryVersion, batch1ReadinessCheckpointVersion, authoritySnapshotVersion],
  );
  const aiReadAuthorityProvenance = useMemo(
    () => getLatestReadAuthorityProvenanceBySurface('ai', selectedProjectId || 'workspace-main'),
    [selectedProjectId, authoritySnapshotVersion, contractPulse, surfaceParityVersion],
  );
  const resonanceReadAuthorityProvenance = useMemo(
    () => getLatestReadAuthorityProvenanceBySurface('resonance', selectedProjectId || 'workspace-main'),
    [selectedProjectId, authoritySnapshotVersion, contractPulse, surfaceParityVersion],
  );
  const recentReadAuthorityProvenance = useMemo(
    () =>
      listReadAuthorityProvenance(24).filter(
        (entry) => entry.workspaceId === selectedProjectId || entry.workspaceId === 'workspace-main',
      ),
    [selectedProjectId, authoritySnapshotVersion, contractPulse, surfaceParityVersion],
  );
  const parityActions = useMemo(
    () => buildParityReconciliationActions(parityReport),
    [parityReport],
  );
  const recentReconciliationEvents = useMemo(
    () => listReconciliationLog(3),
    [reconciliationVersion],
  );
  const reconciliationHistory = useMemo(
    () =>
      listReconciliationLog(18).filter(
        (entry) => entry.workspaceId === selectedProjectId || entry.workspaceId === 'workspace-main',
      ),
    [reconciliationVersion, selectedProjectId],
  );
  const filteredReconciliationHistory = useMemo(
    () =>
      reconciliationHistory.filter((entry) => {
        const modeOk = reconciliationModeFilter === 'all' || entry.mode === reconciliationModeFilter;
        const outcomeOk = reconciliationOutcomeFilter === 'all' || entry.outcome === reconciliationOutcomeFilter;
        return modeOk && outcomeOk;
      }),
    [reconciliationHistory, reconciliationModeFilter, reconciliationOutcomeFilter],
  );
  const reconciliationSnapshots = useMemo(
    () =>
      listReconciliationSnapshots(24).filter(
        (entry) => entry.workspaceId === selectedProjectId || entry.workspaceId === 'workspace-main',
      ),
    [reconciliationVersion, selectedProjectId],
  );
  const batch5MigrationPlans = useMemo(
    () =>
      listBatch5MigrationBoundaryPlans(24)
        .filter((entry) => entry.workspaceId === selectedProjectId || entry.workspaceId === 'workspace-main')
        .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()),
    [selectedProjectId, batch5MigrationPlanVersion],
  );
  const batch5MigrationApplyRuns = useMemo(
    () =>
      listBatch5MigrationApplyRuns(24)
        .filter((entry) => entry.workspaceId === selectedProjectId || entry.workspaceId === 'workspace-main')
        .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()),
    [selectedProjectId, batch5MigrationApplyVersion],
  );
  const batch5RollbackCheckpoints = useMemo(
    () =>
      listBatch5RollbackCheckpoints(24)
        .filter((entry) => entry.workspaceId === selectedProjectId || entry.workspaceId === 'workspace-main')
        .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()),
    [selectedProjectId, batch5MigrationApplyVersion],
  );
  const latestBatch5ApplyRun = useMemo(() => batch5MigrationApplyRuns[0] || null, [batch5MigrationApplyRuns]);
  const latestBatch5RollbackCheckpoint = useMemo(
    () =>
      (latestBatch5ApplyRun
        ? batch5RollbackCheckpoints.find((entry) => entry.runId === latestBatch5ApplyRun.runId)
        : null) || batch5RollbackCheckpoints[0] || null,
    [batch5RollbackCheckpoints, latestBatch5ApplyRun],
  );
  const batch5RolloutGate = useMemo(
    () =>
      buildBatch5RolloutGate({
        approvedCheckpointSelected: Boolean(
          approvedBatch1Checkpoints.find((entry) => entry.checkpointId === selectedApprovedCheckpointId),
        ),
        hasMigrationPlan: batch5MigrationPlans.length > 0,
        hasApplyRun: Boolean(latestBatch5ApplyRun),
        hasRollbackCheckpoint: Boolean(latestBatch5RollbackCheckpoint),
        taskCalendarParityPercent: parityScorePercent,
        crossSurfaceParityPercent: taskSurfaceParityPercent,
        backendMirrorParityPercent: Math.round((shadowParityReport?.parityScore || 0) * 100),
        replayAssertionPassed: Boolean(batch5ReplayAssertion?.passed),
        replayAssertionRunId: String(batch5ReplayAssertion?.runId || ''),
        latestApplyRunId: String(latestBatch5ApplyRun?.runId || ''),
      }),
    [
      approvedBatch1Checkpoints,
      batch5MigrationPlans,
      latestBatch5ApplyRun,
      latestBatch5RollbackCheckpoint,
      parityScorePercent,
      selectedApprovedCheckpointId,
      shadowParityReport?.parityScore,
      taskSurfaceParityPercent,
      batch5ReplayAssertion,
    ],
  );

  useEffect(() => {
    projectTasksRef.current = projectTasks;
  }, [projectTasks]);

  useEffect(() => {
    projectCalendarEventsRef.current = projectCalendarEvents as any[];
  }, [projectCalendarEvents]);

  useEffect(() => {
    parityReportRef.current = parityReport;
  }, [parityReport]);

  useEffect(() => {
    recordTaskSurfaceSnapshot(
      'projects',
      projectTasks.map((task) => String(task?.id || '')).filter(Boolean),
      selectedProjectId || 'workspace-main',
    );
  }, [projectTasks, selectedProjectId]);

  useEffect(() => {
    void syncShadowProjectProjection(projects as Array<Record<string, unknown>>).catch(() => {
      // Shadow reads are non-authoritative in Batch 1; never block project state updates.
    });
  }, [projects]);

  useEffect(() => {
    // Backfill all shadow projections whenever authority/strict routing changes or core domain snapshots move.
    void Promise.all([
      syncShadowTaskProjection(tasks as Array<Record<string, unknown>>),
      syncShadowGoalProjection(goals as Array<Record<string, unknown>>),
      syncShadowScheduleProjection(calendarEvents as Array<Record<string, unknown>>),
      syncShadowProjectProjection(projects as Array<Record<string, unknown>>),
    ]).catch(() => {
      // Never block system-health rendering on shadow backfill attempts.
    });
  }, [
    tasks,
    goals,
    calendarEvents,
    projects,
    authorityRoutingSnapshot.taskBackendEnabled,
    authorityRoutingSnapshot.scheduleBackendEnabled,
    authorityRoutingSnapshot.goalBackendEnabled,
    authorityRoutingSnapshot.projectBackendEnabled,
    authorityRoutingSnapshot.strictTaskEnabled,
    authorityRoutingSnapshot.strictScheduleEnabled,
    authorityRoutingSnapshot.strictGoalEnabled,
    authorityRoutingSnapshot.strictProjectEnabled,
  ]);

  useEffect(() => {
    let cancelled = false;
    const runProbe = async () => {
      const report = await runBackendShadowParityProbe({
        task: tasks.length,
        goal: goals.length,
        schedule: calendarEvents.length,
        project: projects.length,
      }).catch(() => null);
      if (!cancelled && report) {
        setShadowParityReport(report);
      }
    };
    void runProbe();
    return () => {
      cancelled = true;
    };
  }, [calendarEvents.length, goals.length, projects.length, tasks.length]);

  useEffect(() => {
    const signature = JSON.stringify({
      workspaceId: selectedProjectId,
      verdict: batch1Readiness.verdict,
      checks: batch1Readiness.checks.map((check) => ({ id: check.id, pass: check.pass, detail: check.detail })),
    });
    if (lastReadinessSnapshotSignatureRef.current === signature) return;
    lastReadinessSnapshotSignatureRef.current = signature;
    const nextEntry: Batch1ReadinessSnapshot = {
      workspaceId: selectedProjectId || 'workspace-main',
      capturedAt: new Date().toISOString(),
      verdict: batch1Readiness.verdict,
      summary: batch1Readiness.summary,
      checks: batch1Readiness.checks,
    };
    const history = readBatch1ReadinessHistory();
    const scoped = history.filter((entry) => entry.workspaceId === nextEntry.workspaceId);
    const others = history.filter((entry) => entry.workspaceId !== nextEntry.workspaceId);
    const nextScoped = [nextEntry, ...scoped].slice(0, 40);
    writeBatch1ReadinessHistory([...nextScoped, ...others]);
    setBatch1ReadinessHistoryVersion((prev) => prev + 1);
  }, [batch1Readiness, selectedProjectId]);

  useEffect(() => {
    if (approvedBatch1Checkpoints.length === 0) {
      if (selectedApprovedCheckpointId) setSelectedApprovedCheckpointId('');
      return;
    }
    const exists = approvedBatch1Checkpoints.some(
      (entry) => entry.checkpointId === selectedApprovedCheckpointId,
    );
    if (!exists) {
      setSelectedApprovedCheckpointId(approvedBatch1Checkpoints[0].checkpointId);
    }
  }, [approvedBatch1Checkpoints, selectedApprovedCheckpointId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onSurfaceSnapshot = () => setSurfaceParityVersion((prev) => prev + 1);
    window.addEventListener(SURFACE_PARITY_SNAPSHOT_EVENT, onSurfaceSnapshot as EventListener);
    return () => window.removeEventListener(SURFACE_PARITY_SNAPSHOT_EVENT, onSurfaceSnapshot as EventListener);
  }, []);

  useEffect(() => {
    const workspaceId = selectedProjectId || 'workspace-main';
    const missingTotal =
      taskSurfaceParityReport.missingInWorkstream.length +
      taskSurfaceParityReport.missingInProjects.length +
      taskSurfaceParityReport.missingInDashboard.length +
      taskSurfaceParityReport.missingInGoals.length +
      taskSurfaceParityReport.missingInResonance.length +
      taskSurfaceParityReport.missingInAIAssistant.length;
    const observedSurfaceCount = [
      taskSurfaceParityReport.observedSurfaces.workstream,
      taskSurfaceParityReport.observedSurfaces.projects,
      taskSurfaceParityReport.observedSurfaces.dashboard,
      taskSurfaceParityReport.observedSurfaces.goals,
      taskSurfaceParityReport.observedSurfaces.resonance,
      taskSurfaceParityReport.observedSurfaces.aiAssistant,
    ].filter(Boolean).length;
    const result = evaluateSurfaceParityEscalation({
      workspaceId,
      parityScore: taskSurfaceParityReport.parityScore,
      missingTotal,
      observedSurfaceCount,
    });
    if (!result.shouldEscalate) {
      setSurfaceIncidentVersion((prev) => prev + 1);
      return;
    }
    const incidentId = `surface-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const summary =
      `Cross-surface parity drift escalated (${Math.round(taskSurfaceParityReport.parityScore * 100)}%). ` +
      `Missing IDs -> workstream:${taskSurfaceParityReport.missingInWorkstream.length}, ` +
      `projects:${taskSurfaceParityReport.missingInProjects.length}, dashboard:${taskSurfaceParityReport.missingInDashboard.length}, ` +
      `goals:${taskSurfaceParityReport.missingInGoals.length}, resonance:${taskSurfaceParityReport.missingInResonance.length}, ` +
      `ai:${taskSurfaceParityReport.missingInAIAssistant.length}.`;
    const runbook = [
      'Request surface refresh across active views and wait for snapshot updates.',
      'Copy gap IDs per affected surface and verify projection adapters for those entities.',
      'Export surface parity artifact and attach to reconciliation/audit handoff.',
      'If drift persists for 3+ cycles, keep authority in safe mode and investigate projection runtime.',
    ];
    const policy = buildSurfaceParityIncidentPolicy({
      severity: result.severity,
      missingTotal,
      consecutiveDriftCycles: result.driftState.consecutiveDriftCycles,
    });
    appendSurfaceParityIncident({
      incidentId,
      workspaceId,
      incidentType: 'parity_drift',
      parityScore: taskSurfaceParityReport.parityScore,
      missingTotal,
      consecutiveDriftCycles: result.driftState.consecutiveDriftCycles,
      severity: result.severity,
      status: 'open',
      summary,
      runbook,
      policyTier: policy.slaTier,
      routingTarget: policy.routingTarget,
      ackDueAt: dueAtFromNow(policy.ackWithinMinutes),
      resolveDueAt: dueAtFromNow(policy.resolveWithinMinutes),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    appendReconciliationLog({
      entryId: `surface-escalation-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      eventType: 'surface.parity.escalated',
      entityKind: 'workspace',
      entityId: workspaceId,
      workspaceId,
      mode: 'apply',
      outcome: 'failed',
      detail: summary,
      occurredAt: new Date().toISOString(),
    });
    toast.warning('Surface parity drift escalated', {
      description: `${result.severity.toUpperCase()} incident created for operator follow-up.`,
    });
    setReconciliationVersion((prev) => prev + 1);
    setSurfaceIncidentVersion((prev) => prev + 1);
  }, [selectedProjectId, taskSurfaceParityReport, surfaceParityVersion]);

  useEffect(() => {
    const workspaceId = selectedProjectId || 'workspace-main';
    const snapshotAgesMs = Object.fromEntries(
      Object.entries({
        tasks_tab: taskSurfaceSnapshots.tasksTab,
        workstream: taskSurfaceSnapshots.workstream,
        projects: taskSurfaceSnapshots.projects,
        dashboard: taskSurfaceSnapshots.dashboard,
        goals: taskSurfaceSnapshots.goals,
        resonance: taskSurfaceSnapshots.resonance,
        ai_assistant: taskSurfaceSnapshots.aiAssistant,
      })
        .filter(([, snapshot]) => Boolean(snapshot?.observed && snapshot?.capturedAt))
        .map(([surface, snapshot]) => [
          surface,
          Math.max(0, Date.now() - new Date(String(snapshot.capturedAt)).getTime()),
        ]),
    );
    const alarm = evaluateSurfaceSnapshotAlarm({
      workspaceId,
      snapshotAgesMs,
      staleAfterMs: SURFACE_STALE_AFTER_MS,
      criticalAfterMs: SURFACE_CRITICAL_STALE_AFTER_MS,
    });
    if (!alarm.shouldEscalate) return;
    const incidentId = `surface-stale-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const maxAgeMinutes = Math.max(1, Math.round(alarm.maxAgeMs / 60_000));
    const summary =
      `Snapshot staleness alarm (${alarm.severity.toUpperCase()}) across ${alarm.staleSurfaces.length} surface(s); ` +
      `oldest snapshot ${maxAgeMinutes}m. Surfaces: ${alarm.staleSurfaces.join(', ')}.`;
    const runbook = [
      'Request surface refresh and keep impacted tabs active until fresh snapshots are recorded.',
      'Export surface parity artifact and attach to incident handoff for operator traceability.',
      'If staleness persists after refresh, verify projection listeners and surface snapshot runtime wiring.',
      'Escalate to on-call routing target if stale windows exceed policy thresholds.',
    ];
    const policy = buildSurfaceParityIncidentPolicy({
      severity: alarm.severity,
      missingTotal: alarm.staleSurfaces.length,
      consecutiveDriftCycles: Math.max(0, surfaceDriftState.consecutiveDriftCycles),
    });
    appendSurfaceParityIncident({
      incidentId,
      workspaceId,
      incidentType: 'stale_snapshot_alarm',
      parityScore: taskSurfaceParityReport.parityScore,
      missingTotal: alarm.staleSurfaces.length,
      consecutiveDriftCycles: surfaceDriftState.consecutiveDriftCycles,
      severity: alarm.severity,
      status: 'open',
      summary,
      runbook,
      policyTier: policy.slaTier,
      routingTarget: policy.routingTarget,
      ackDueAt: dueAtFromNow(policy.ackWithinMinutes),
      resolveDueAt: dueAtFromNow(policy.resolveWithinMinutes),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    appendReconciliationLog({
      entryId: `surface-stale-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      eventType: 'surface.snapshot.stale.alarm',
      entityKind: 'workspace',
      entityId: workspaceId,
      workspaceId,
      mode: 'apply',
      outcome: 'failed',
      detail: summary,
      occurredAt: new Date().toISOString(),
    });
    toast.warning('Surface snapshot staleness alarm', {
      description: `${alarm.severity.toUpperCase()} stale snapshot incident created.`,
    });
    setReconciliationVersion((prev) => prev + 1);
    setSurfaceIncidentVersion((prev) => prev + 1);
  }, [selectedProjectId, surfaceDriftState.consecutiveDriftCycles, taskSurfaceParityReport, taskSurfaceSnapshots]);

  useEffect(() => {
    const workspaceId = selectedProjectId || 'workspace-main';
    const parityHealthy = taskSurfaceParityPercent >= 98 && surfaceParityMissingTotal === 0;
    const snapshotsHealthy = staleSurfaceNames.length === 0;
    if (!parityHealthy || !snapshotsHealthy) return;
    const resolvedCount = autoResolveSurfaceParityIncidents(workspaceId);
    if (resolvedCount <= 0) return;
    appendReconciliationLog({
      entryId: `surface-auto-resolve-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      eventType: 'surface.incidents.auto_resolved',
      entityKind: 'workspace',
      entityId: workspaceId,
      workspaceId,
      mode: 'apply',
      outcome: 'applied',
      detail: `Automatically resolved ${resolvedCount} stale/drift incident(s) after healthy parity recovery.`,
      occurredAt: new Date().toISOString(),
    });
    setReconciliationVersion((prev) => prev + 1);
    setSurfaceIncidentVersion((prev) => prev + 1);
    toast.success(`Auto-resolved ${resolvedCount} stale incident${resolvedCount === 1 ? '' : 's'}.`);
  }, [
    selectedProjectId,
    staleSurfaceNames.length,
    surfaceParityMissingTotal,
    taskSurfaceParityPercent,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem('syncscript:phase2a:parity-safe-mode');
    if (raw === null) return;
    setParitySafeMode(raw === '1');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('syncscript:phase2a:parity-safe-mode', paritySafeMode ? '1' : '0');
  }, [paritySafeMode]);

  const projectGoals = useMemo(
    () => goals.filter((goal) => (goalProjectMap[String(goal.id)] || 'project-general') === selectedProjectId),
    [goals, goalProjectMap, selectedProjectId],
  );

  const scheduledProjectTasks = useMemo(
    () =>
      [...projectTasks]
        .filter((task) => task?.scheduledTime || task?.dueDate)
        .sort((a, b) => {
          const aTime = new Date(a.scheduledTime || a.dueDate || 0).getTime();
          const bTime = new Date(b.scheduledTime || b.dueDate || 0).getTime();
          return aTime - bTime;
        })
        .slice(0, 12),
    [projectTasks],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = `syncscript:workstream-blank-start:${selectedProjectId}`;
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      setWorkstreamBlankStart(true);
      return;
    }
    setWorkstreamBlankStart(raw === '1');
  }, [selectedProjectId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent)?.detail as any;
      const eventType = String(detail?.eventType || '').trim();
      if (!eventType) return;
      const workspaceId = String(detail?.workspaceId || '').trim();
      if (workspaceId && workspaceId !== 'workspace-main' && workspaceId !== selectedProjectId) return;
      appendReconciliationLog({
        entryId: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        eventType,
        entityKind: String(detail?.entityKind || ''),
        entityId: String(detail?.entityId || ''),
        workspaceId: workspaceId || 'workspace-main',
        mode: 'apply',
        outcome: 'applied',
        occurredAt: String(detail?.occurredAt || new Date().toISOString()),
      });
      setReconciliationVersion((prev) => prev + 1);
      setContractPulse({
        eventType,
        occurredAt: String(detail?.occurredAt || new Date().toISOString()),
      });
    };
    window.addEventListener('syncscript:contract-event', handler as EventListener);
    return () => window.removeEventListener('syncscript:contract-event', handler as EventListener);
  }, [selectedProjectId]);

  const groupedStatus = useMemo(() => {
    const lanes: Record<'pending' | 'todo' | 'doing' | 'done', AnyTask[]> = {
      pending: [],
      todo: [],
      doing: [],
      done: [],
    };
    for (const task of projectTasks) {
      lanes[classifyTaskStatus(task, tasksById)].push(task);
    }
    return lanes;
  }, [projectTasks, tasksById]);
  const completionRate = useMemo(() => {
    if (projectTasks.length === 0) return 0;
    return Math.round((groupedStatus.done.length / projectTasks.length) * 100);
  }, [groupedStatus.done.length, projectTasks.length]);
  const activeRate = useMemo(() => {
    if (projectTasks.length === 0) return 0;
    return Math.round((groupedStatus.doing.length / projectTasks.length) * 100);
  }, [groupedStatus.doing.length, projectTasks.length]);
  const blockedRate = useMemo(() => {
    if (projectTasks.length === 0) return 0;
    return Math.round((groupedStatus.pending.length / projectTasks.length) * 100);
  }, [groupedStatus.pending.length, projectTasks.length]);
  const readyNowTasks = useMemo(() => groupedStatus.todo.slice(0, 6), [groupedStatus.todo]);
  const blockedTasks = useMemo(() => groupedStatus.pending.slice(0, 6), [groupedStatus.pending]);
  const selectedFlowTask = useMemo(
    () => (flowInspectorTaskId ? tasksById.get(flowInspectorTaskId) || null : null),
    [flowInspectorTaskId, tasksById],
  );

  useEffect(() => {
    if (!selectedFlowTask) {
      setFlowInspectorTitle('');
      setFlowInspectorStatus('todo');
      setFlowInspectorPriority('medium');
      return;
    }
    setFlowInspectorTitle(String(selectedFlowTask.title || ''));
    setFlowInspectorStatus(String(selectedFlowTask.status || (selectedFlowTask.completed ? 'completed' : 'todo')));
    setFlowInspectorPriority(String(selectedFlowTask.priority || 'medium'));
  }, [selectedFlowTask]);

  useEffect(() => {
    setFlowInspectorTaskId(null);
  }, [selectedProjectId]);

  const handleCreateFlowEvent = async (label: string) => {
    const clean = String(label || '').trim();
    if (!clean) return;
    await createTask({
      title: clean,
      description: 'Created from Workstream library block.',
      priority: 'medium',
      energyLevel: 'medium',
      estimatedTime: '30 min',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      tags: ['flow-event'],
      projectId: selectedProjectId,
      status: 'todo',
    });
    appendExecutionTrailEvent({
      type: 'task_created',
      title: `Flow block created: ${clean}`,
      detail: 'Created from Workstream library',
      projectId: selectedProjectId,
      actor: 'User',
    });
    setTrailVersion((prev) => prev + 1);
    setFlowQuickAddTitle('');
  };

  const handleSaveFlowInspector = async () => {
    if (!selectedFlowTask) return;
    const nextStatus = String(flowInspectorStatus || 'todo');
    await updateTask(String(selectedFlowTask.id), {
      title: flowInspectorTitle.trim() || String(selectedFlowTask.title || 'Untitled event'),
      status: nextStatus,
      completed: nextStatus === 'completed' || nextStatus === 'done',
      priority: flowInspectorPriority,
    });
    toast.success('Flow event updated');
  };

  const handleFlowTemplateDragStart = (title: string) => (event: DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.setData('application/x-syncscript-flow-template', JSON.stringify({ title }));
    event.dataTransfer.effectAllowed = 'copy';
  };

  const handleCreateProject = async () => {
    const name = projectName.trim();
    if (!name) {
      toast.error('Project name is required');
      return;
    }
    let createdProject: { id: string; name: string } | null = null;
    const routed = await executeAuthorityRoutedCommand({
      domain: 'project',
      commandType: 'project.create',
      workspaceId: 'workspace-main',
      payload: {
        name,
        color: '#06b6d4',
      },
      runLocal: async () => {
        const created = createWorkspaceProject({
          name,
          color: '#06b6d4',
        });
        if (!created?.id) {
          return commandFailure(`project-create-failed-${Date.now()}`, ['Project create failed']);
        }
        createdProject = created;
        return commandSuccess(`project-create-${created.id}`, {
          projectId: created.id,
        });
      },
    });
    if (!routed.ok || !createdProject) {
      toast.error(routed.errors[0] || 'Project create failed');
      return;
    }
    const created = createdProject;
    setProjectVersion((prev) => prev + 1);
    appendExecutionTrailEvent({
      type: 'run_created',
      title: `Project created: ${created.name}`,
      detail: 'Workspace project scaffold initialized',
      projectId: created.id,
      actor: 'User',
    });
    setTrailVersion((prev) => prev + 1);
    setProjectName('');
    setSelectedProjectId(created.id);
    toast.success(`Project created: ${created.name}`);
  };

  const handleAssignTaskProject = async (taskId: string, projectId: string) => {
    await updateTask(taskId, { projectId });
    appendExecutionTrailEvent({
      type: 'status_updated',
      title: 'Task assigned to project',
      detail: `Task ${taskId} moved to ${projectId}`,
      taskId,
      projectId,
      actor: 'User',
    });
    setTrailVersion((prev) => prev + 1);
  };

  const handleAssignGoalProject = async (goalId: string, projectId: string) => {
    const routed = await executeAuthorityRoutedCommand({
      domain: 'project',
      commandType: 'assignment.goal.project.map',
      workspaceId: selectedProjectId || 'workspace-main',
      payload: {
        goalId,
        projectId,
      },
      runLocal: async () => {
        assignGoalToProject(goalId, projectId);
        return commandSuccess(`goal-project-map-${goalId}-${projectId}`);
      },
    });
    if (!routed.ok) {
      toast.error(routed.errors[0] || 'Goal project update failed');
      return;
    }
    setGoalLinkVersion((prev) => prev + 1);
    toast.success('Goal project updated');
    appendExecutionTrailEvent({
      type: 'status_updated',
      title: 'Goal assigned to project',
      detail: `Goal ${goalId} mapped to ${projectId}`,
      projectId,
      actor: 'User',
      metadata: { goalId },
    });
    setTrailVersion((prev) => prev + 1);
  };

  const handleRenameProject = async (nextName: string) => {
    let updatedProject: { id: string; name: string } | null = null;
    const routed = await executeAuthorityRoutedCommand({
      domain: 'project',
      commandType: 'project.update',
      workspaceId: selectedProjectId || 'workspace-main',
      payload: {
        projectId: selectedProjectId,
        name: nextName,
      },
      runLocal: async () => {
        const updated = updateWorkspaceProject(selectedProjectId, { name: nextName });
        if (!updated?.id) {
          return commandFailure(`project-update-failed-${Date.now()}`, ['Project rename failed']);
        }
        updatedProject = updated;
        return commandSuccess(`project-update-${updated.id}`, { projectId: updated.id });
      },
    });
    if (!routed.ok) {
      toast.error(routed.errors[0] || 'Project rename failed');
      return;
    }
    const updated = updatedProject;
    if (!updated) return;
    setProjectVersion((prev) => prev + 1);
    appendExecutionTrailEvent({
      type: 'status_updated',
      title: 'Project renamed',
      detail: `${selectedProjectId} -> ${updated.name}`,
      projectId: selectedProjectId,
      actor: 'User',
    });
    setTrailVersion((prev) => prev + 1);
  };

  const handleManualSaveProject = (snapshot: WorkstreamFlowDocument) => {
    appendExecutionTrailEvent({
      type: 'status_updated',
      title: 'Workstream project saved',
      detail: `${snapshot.nodes.length} nodes / ${snapshot.edges.length} connections`,
      projectId: selectedProjectId,
      actor: 'User',
    });
    setTrailVersion((prev) => prev + 1);
  };

  const handleToggleBlankStart = (next: boolean) => {
    setWorkstreamBlankStart(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`syncscript:workstream-blank-start:${selectedProjectId}`, next ? '1' : '0');
    }
  };

  const handleApplyParityActions = async () => {
    const actionable = parityActions.filter((action) => action.type === 'link_missing_task' || action.type === 'remove_orphan_event');
    if (actionable.length === 0) {
      toast.info('No high-confidence parity actions to apply.');
      return;
    }
    if (parityApplyLockRef.current) {
      toast.info('A reconciliation run is already in progress.');
      return;
    }
    const opKey = `${selectedProjectId}:${actionable.map((action) => action.id).join('|')}`;
    const approved = window.confirm(
      `Apply ${actionable.length} high-confidence reconciliation action(s)?\n\nThis will create missing schedule links and remove orphaned events.`,
    );
    if (!approved) return;
    const runId = createReconciliationRunId(selectedProjectId);
    const baselineReport = parityReportRef.current || parityReport;
    const simulatedTasks = [...projectTasksRef.current];
    const simulatedEvents = [...projectCalendarEventsRef.current];

    for (const action of actionable) {
      if (action.type === 'link_missing_task') {
        const taskId = String(action.taskId || '').trim();
        if (!taskId) continue;
        const task = simulatedTasks.find((entry) => String(entry.id) === taskId);
        if (!task) continue;
        const exists = simulatedEvents.some((event: any) => {
          const eventId = String(event?.id || '').trim();
          const eventEntityId = String(event?.entityId || '').trim();
          const scheduledEventId = String((task as any)?.scheduledEventId || '').trim();
          if (scheduledEventId && (eventId === scheduledEventId || eventEntityId === scheduledEventId)) return true;
          const createdFromTaskId = String(event?.createdFromTaskId || '').trim();
          const sourceTaskId = String(event?.sourceTaskId || '').trim();
          if (createdFromTaskId === taskId) return true;
          if (sourceTaskId === taskId) return true;
          const linkedTaskIds = Array.isArray(event?.linkedTaskIds) ? event.linkedTaskIds : [];
          if (linkedTaskIds.some((linkedTaskId: any) => String(linkedTaskId || '') === taskId)) return true;
          const linked = Array.isArray(event?.tasks) ? event.tasks : [];
          return linked.some((linkedTask: any) => String(linkedTask?.id || '') === taskId);
        });
        if (exists) continue;
        simulatedEvents.push({
          id: `simulate-${taskId}`,
          createdFromTaskId: taskId,
          tasks: [{ id: taskId }],
        });
        continue;
      }
      if (action.type === 'remove_orphan_event') {
        const eventId = String(action.eventId || '').trim();
        if (!eventId) continue;
        const idx = simulatedEvents.findIndex((event: any) => String(event?.id || '') === eventId);
        if (idx >= 0) simulatedEvents.splice(idx, 1);
      }
    }

    const dryRunReport = buildTaskCalendarParityReport(simulatedTasks as any[], simulatedEvents as any[]);
    if (paritySafeMode) {
      toast.info(
        `Safe mode dry run: ${baselineReport.missingLinks.length + baselineReport.orphanedEvents.length} -> ${dryRunReport.missingLinks.length + dryRunReport.orphanedEvents.length} drift signals.`,
      );
      for (const action of actionable) {
        appendReconciliationLog({
          entryId: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          runId,
          actionId: action.id,
          eventType: 'reconciliation.action.simulated',
          entityKind: action.type === 'remove_orphan_event' ? 'event' : 'task',
          entityId: String(action.eventId || action.taskId || ''),
          workspaceId: selectedProjectId,
          mode: 'dry_run',
          outcome: 'simulated',
          detail: action.summary,
          occurredAt: new Date().toISOString(),
        });
      }
      setReconciliationVersion((prev) => prev + 1);
      appendExecutionTrailEvent({
        type: 'status_updated',
        title: 'Parity reconciliation dry run',
        detail: `Projected score ${Math.round((baselineReport.parityScore || 0) * 100)}% -> ${Math.round((dryRunReport.parityScore || 0) * 100)}%`,
        projectId: selectedProjectId,
        actor: 'System',
      });
      setTrailVersion((prev) => prev + 1);
      return;
    }

    parityApplyLockRef.current = opKey;
    setParityApplying(true);
    let appliedCount = 0;
    try {
      for (const action of actionable) {
        if (hasReconciliationActionApplied(action.id, selectedProjectId)) {
          appendReconciliationLog({
            entryId: `skip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            runId,
            actionId: action.id,
            eventType: 'reconciliation.action.skipped',
            entityKind: action.type === 'remove_orphan_event' ? 'event' : 'task',
            entityId: String(action.eventId || action.taskId || ''),
            workspaceId: selectedProjectId,
            mode: 'apply',
            outcome: 'skipped',
            detail: 'Action already applied in prior run.',
            occurredAt: new Date().toISOString(),
          });
          continue;
        }
        if (action.type === 'link_missing_task') {
          const taskId = String(action.taskId || '').trim();
          if (!taskId) continue;
          const task = projectTasks.find((entry) => String(entry.id) === taskId);
          if (!task) continue;
          const existingEvent = projectCalendarEvents.find((event: any) => {
            const eventId = String(event?.id || '').trim();
            const eventEntityId = String(event?.entityId || '').trim();
            const scheduledEventId = String((task as any)?.scheduledEventId || '').trim();
            if (scheduledEventId && (eventId === scheduledEventId || eventEntityId === scheduledEventId)) return true;
            const createdFromTaskId = String(event?.createdFromTaskId || '').trim();
            const sourceTaskId = String(event?.sourceTaskId || '').trim();
            if (createdFromTaskId === taskId) return true;
            if (sourceTaskId === taskId) return true;
            const linkedTaskIds = Array.isArray(event?.linkedTaskIds) ? event.linkedTaskIds : [];
            if (linkedTaskIds.some((linkedTaskId: any) => String(linkedTaskId || '') === taskId)) return true;
            const linked = Array.isArray(event?.tasks) ? event.tasks : [];
            return linked.some((linkedTask: any) => String(linkedTask?.id || '') === taskId);
          });
          if (existingEvent) continue;

          const now = new Date();
          const start = task?.scheduledTime ? new Date(task.scheduledTime) : task?.dueDate ? new Date(task.dueDate) : now;
          const safeStart = Number.isNaN(start.getTime()) ? now : start;
          const end = new Date(safeStart.getTime() + 60 * 60 * 1000);
          const base = createEmptyEvent() as Record<string, any>;
          const eventId = `reconcile-${taskId}-${Date.now()}`;
          const taskBefore = {
            scheduledTime: task?.scheduledTime || null,
            scheduledEventId: task?.scheduledEventId || null,
            isScheduled: Boolean(task?.isScheduled),
          };
          addEvent({
            ...base,
            id: eventId,
            title: String(task.title || 'Recovered scheduled task'),
            startTime: safeStart,
            endTime: end,
            isScheduled: true,
            hierarchyType: 'primary',
            createdFromTaskId: taskId,
            tasks: [{ id: taskId }],
            updatedAt: new Date(),
          } as any);
          await updateTask(taskId, { scheduledEventId: eventId, isScheduled: true } as any);
          appendReconciliationSnapshot({
            snapshotId: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            runId,
            actionId: action.id,
            workspaceId: selectedProjectId,
            entityKind: 'task',
            entityId: taskId,
            beforeState: taskBefore,
            afterState: {
              scheduledEventId: eventId,
              isScheduled: true,
            },
            capturedAt: new Date().toISOString(),
          });
          appendReconciliationSnapshot({
            snapshotId: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            runId,
            actionId: action.id,
            workspaceId: selectedProjectId,
            entityKind: 'event',
            entityId: eventId,
            beforeState: {},
            afterState: {
              title: String(task.title || 'Recovered scheduled task'),
              createdFromTaskId: taskId,
            },
            capturedAt: new Date().toISOString(),
          });
          appendExecutionTrailEvent({
            type: 'status_updated',
            title: 'Parity reconciliation: linked scheduled task',
            detail: `Task ${taskId} linked to event ${eventId}`,
            projectId: selectedProjectId,
            taskId,
            actor: 'System',
          });
          appendReconciliationLog({
            entryId: `apply-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            runId,
            actionId: action.id,
            eventType: 'reconciliation.action.applied',
            entityKind: 'task',
            entityId: taskId,
            workspaceId: selectedProjectId,
            mode: 'apply',
            outcome: 'applied',
            detail: `Linked task ${taskId} to event ${eventId}`,
            occurredAt: new Date().toISOString(),
          });
          appliedCount += 1;
          continue;
        }
        if (action.type === 'remove_orphan_event') {
          const eventId = String(action.eventId || '').trim();
          if (!eventId) continue;
          const orphanBefore = projectCalendarEvents.find((entry: any) => String(entry?.id || '') === eventId);
          deleteEvent(eventId);
          appendReconciliationSnapshot({
            snapshotId: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            runId,
            actionId: action.id,
            workspaceId: selectedProjectId,
            entityKind: 'event',
            entityId: eventId,
            beforeState: orphanBefore && typeof orphanBefore === 'object' ? { ...(orphanBefore as Record<string, unknown>) } : {},
            afterState: { deleted: true },
            capturedAt: new Date().toISOString(),
          });
          appendExecutionTrailEvent({
            type: 'status_updated',
            title: 'Parity reconciliation: removed orphaned event',
            detail: `Removed orphaned event ${eventId}`,
            projectId: selectedProjectId,
            actor: 'System',
          });
          appendReconciliationLog({
            entryId: `apply-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            runId,
            actionId: action.id,
            eventType: 'reconciliation.action.applied',
            entityKind: 'event',
            entityId: eventId,
            workspaceId: selectedProjectId,
            mode: 'apply',
            outcome: 'applied',
            detail: `Removed orphaned event ${eventId}`,
            occurredAt: new Date().toISOString(),
          });
          appliedCount += 1;
        }
      }
      setReconciliationVersion((prev) => prev + 1);
      setTrailVersion((prev) => prev + 1);
      toast.success(`Applied ${appliedCount} reconciliation action(s).`);

      // Post-apply verification loop: confirm parity improved before closing the run.
      let verified = false;
      for (let attempt = 0; attempt < 6; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 120));
        const latestReport = buildTaskCalendarParityReport(
          projectTasksRef.current as any[],
          projectCalendarEventsRef.current as any[],
        );
        const baselineDrift = baselineReport.missingLinks.length + baselineReport.orphanedEvents.length;
        const latestDrift = latestReport.missingLinks.length + latestReport.orphanedEvents.length;
        if (latestDrift <= baselineDrift) {
          verified = true;
          toast.success(`Post-apply verification passed (drift ${baselineDrift} -> ${latestDrift}).`);
          break;
        }
      }

      if (!verified) {
        const rollbackHint = actionable
          .map((action) => action.type === 'link_missing_task'
            ? `remove recovered link for task ${String(action.taskId || '?')}`
            : `restore orphaned event ${String(action.eventId || '?')} from backup`)
          .join('; ');
        appendExecutionTrailEvent({
          type: 'status_updated',
          title: 'Parity reconciliation verification warning',
          detail: `Post-apply verification could not confirm improvement. Rollback hint: ${rollbackHint}`,
          projectId: selectedProjectId,
          actor: 'System',
        });
        appendReconciliationLog({
          entryId: `verify-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          runId,
          eventType: 'reconciliation.verification.warning',
          entityKind: 'workspace',
          entityId: selectedProjectId,
          workspaceId: selectedProjectId,
          mode: 'apply',
          outcome: 'failed',
          detail: rollbackHint,
          occurredAt: new Date().toISOString(),
        });
        setReconciliationVersion((prev) => prev + 1);
        setTrailVersion((prev) => prev + 1);
        toast.warning('Parity verification uncertain. Review reconciliation hints in execution trail.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to apply reconciliation actions';
      toast.error('Reconciliation apply failed', { description: message });
    } finally {
      parityApplyLockRef.current = null;
      setParityApplying(false);
    }
  };

  const handleExportReconciliationHistory = () => {
    if (typeof window === 'undefined') return;
    const payload = {
      workspaceId: selectedProjectId,
      exportedAt: new Date().toISOString(),
      modeFilter: reconciliationModeFilter,
      outcomeFilter: reconciliationOutcomeFilter,
      entries: filteredReconciliationHistory,
      snapshots: reconciliationSnapshots,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `reconciliation-history-${selectedProjectId}-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
    toast.success('Reconciliation history exported.');
  };

  const handleExportTaskSurfaceParity = async () => {
    if (typeof window === 'undefined') return;
    const selectedSignoffCheckpoint =
      approvedBatch1Checkpoints.find((entry) => entry.checkpointId === selectedApprovedCheckpointId) || null;
    const payload = {
      packetVersion: '1.0',
      packetKind: 'surface-parity-evidence',
      workspaceId: selectedProjectId,
      exportedAt: new Date().toISOString(),
      policy: {
        staleAfterMs: SURFACE_STALE_AFTER_MS,
        criticalAfterMs: SURFACE_CRITICAL_STALE_AFTER_MS,
      },
      canonicalTaskIds: projectTasks.map((task) => String(task.id)),
      report: taskSurfaceParityReport,
      snapshots: taskSurfaceSnapshots,
      signoffCheckpoint: selectedSignoffCheckpoint,
    };
    const integrity = {
      algorithm: 'sha256',
      hash: await computeSha256Hex(payload),
    };
    const artifact = {
      ...payload,
      integrity,
    };
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `surface-parity-${selectedProjectId}-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
    toast.success(`Surface parity evidence exported (${integrity.hash.slice(0, 12)}...).`);
  };

  const handleExportBackendShadowParity = async () => {
    if (typeof window === 'undefined' || !shadowParityReport) return;
    const selectedSignoffCheckpoint =
      approvedBatch1Checkpoints.find((entry) => entry.checkpointId === selectedApprovedCheckpointId) || null;
    const payload = {
      packetVersion: '1.0',
      packetKind: 'backend-shadow-parity-evidence',
      workspaceId: selectedProjectId,
      exportedAt: new Date().toISOString(),
      localDomainCounts: {
        task: tasks.length,
        goal: goals.length,
        schedule: calendarEvents.length,
        project: projects.length,
      },
      report: shadowParityReport,
      signoffCheckpoint: selectedSignoffCheckpoint,
    };
    const integrity = {
      algorithm: 'sha256',
      hash: await computeSha256Hex(payload),
    };
    const artifact = {
      ...payload,
      integrity,
    };
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `backend-shadow-parity-${selectedProjectId}-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
    toast.success(`Backend mirror parity evidence exported (${integrity.hash.slice(0, 12)}...).`);
  };

  const handleExportBatch1ShadowEvidencePack = async () => {
    if (typeof window === 'undefined') return;
    const selectedSignoffCheckpoint =
      approvedBatch1Checkpoints.find((entry) => entry.checkpointId === selectedApprovedCheckpointId) || null;
    const payload = {
      packetVersion: '1.0',
      packetKind: 'phase2b-batch1-shadow-evidence-pack',
      workspaceId: selectedProjectId,
      exportedAt: new Date().toISOString(),
      policy: {
        staleAfterMs: SURFACE_STALE_AFTER_MS,
        criticalAfterMs: SURFACE_CRITICAL_STALE_AFTER_MS,
      },
      localDomainCounts: {
        task: tasks.length,
        goal: goals.length,
        schedule: calendarEvents.length,
        project: projects.length,
      },
      taskCalendarParity: {
        report: parityReport,
        guardrail: parityGuardrail,
        actions: parityActions,
        reconciliationHistory: filteredReconciliationHistory,
      },
      crossSurfaceParity: {
        report: taskSurfaceParityReport,
        actions: taskSurfaceParityActions,
        snapshots: taskSurfaceSnapshots,
      },
      backendMirrorParity: shadowParityReport,
      batch1Readiness,
      batch1ReadinessHistory,
      batch1ReadinessCheckpoints,
      signoffCheckpoint: selectedSignoffCheckpoint,
      incidents: {
        driftState: surfaceDriftState,
        recentSurfaceIncidents,
      },
      reconciliationSnapshots,
      contractPulse,
    };
    const integrity = {
      algorithm: 'sha256',
      hash: await computeSha256Hex(payload),
    };
    const artifact = {
      ...payload,
      integrity,
    };
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `phase2b-batch1-shadow-evidence-pack-${selectedProjectId}-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
    toast.success(`Batch 1 shadow evidence pack exported (${integrity.hash.slice(0, 12)}...).`);
  };

  const handleExportBatch1ReadinessTrend = async () => {
    if (typeof window === 'undefined') return;
    const selectedSignoffCheckpoint =
      approvedBatch1Checkpoints.find((entry) => entry.checkpointId === selectedApprovedCheckpointId) || null;
    const payload = {
      packetVersion: '1.0',
      packetKind: 'phase2b-batch1-readiness-trend',
      workspaceId: selectedProjectId,
      exportedAt: new Date().toISOString(),
      currentReadiness: batch1Readiness,
      history: batch1ReadinessHistory,
      checkpoints: batch1ReadinessCheckpoints,
      signoffCheckpoint: selectedSignoffCheckpoint,
    };
    const integrity = {
      algorithm: 'sha256',
      hash: await computeSha256Hex(payload),
    };
    const artifact = {
      ...payload,
      integrity,
    };
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `phase2b-batch1-readiness-trend-${selectedProjectId}-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
    toast.success(`Batch 1 readiness trend exported (${integrity.hash.slice(0, 12)}...).`);
  };

  const handleExportBatch2PreflipBaseline = async () => {
    if (typeof window === 'undefined') return;
    const selectedSignoffCheckpoint =
      approvedBatch1Checkpoints.find((entry) => entry.checkpointId === selectedApprovedCheckpointId) || null;
    if (!selectedSignoffCheckpoint) {
      toast.error('Approved checkpoint required before Batch 2 pre-flip export.');
      return;
    }
    const payload = {
      packetVersion: '1.0',
      packetKind: 'phase2b-batch2-preflip-baseline',
      workspaceId: selectedProjectId,
      exportedAt: new Date().toISOString(),
      signoffCheckpoint: selectedSignoffCheckpoint,
      authorityRouting: authorityRoutingSnapshot,
      rolloutPlan: {
        order: ['schedule', 'task'],
        strictMode: {
          schedule: true,
          task: false,
        },
        rollbackPolicy: 'local-fallback-on-backend-failure',
      },
      readiness: batch1Readiness,
      parity: {
        taskCalendar: parityReport,
        crossSurface: taskSurfaceParityReport,
        backendMirror: shadowParityReport,
      },
      incidents: recentSurfaceIncidents,
    };
    const integrity = {
      algorithm: 'sha256',
      hash: await computeSha256Hex(payload),
    };
    const artifact = {
      ...payload,
      integrity,
    };
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `phase2b-batch2-preflip-baseline-${selectedProjectId}-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
    toast.success(`Batch 2 pre-flip baseline exported (${integrity.hash.slice(0, 12)}...).`);
  };

  const handleExportBatch2ScheduleStrictProof = async () => {
    if (typeof window === 'undefined') return;
    const selectedSignoffCheckpoint =
      approvedBatch1Checkpoints.find((entry) => entry.checkpointId === selectedApprovedCheckpointId) || null;
    if (!selectedSignoffCheckpoint) {
      toast.error('Approved checkpoint required before Batch 2 schedule-strict proof export.');
      return;
    }
    if (!authorityRoutingSnapshot.scheduleBackendEnabled || !authorityRoutingSnapshot.strictScheduleEnabled) {
      toast.error('Schedule backend + schedule strict must be ON before exporting schedule-strict proof.');
      return;
    }
    if (authorityRoutingSnapshot.strictTaskEnabled) {
      toast.error('Task strict must remain OFF during schedule-first proof export.');
      return;
    }
    const payload = {
      packetVersion: '1.0',
      packetKind: 'phase2b-batch2-schedule-strict-proof',
      workspaceId: selectedProjectId,
      exportedAt: new Date().toISOString(),
      signoffCheckpoint: selectedSignoffCheckpoint,
      authorityRouting: authorityRoutingSnapshot,
      rolloutInvariant: {
        scheduleBackendRequired: true,
        scheduleStrictRequired: true,
        taskStrictRequired: false,
      },
      readiness: batch1Readiness,
      parity: {
        taskCalendar: parityReport,
        crossSurface: taskSurfaceParityReport,
        backendMirror: shadowParityReport,
      },
      incidents: recentSurfaceIncidents,
    };
    const integrity = {
      algorithm: 'sha256',
      hash: await computeSha256Hex(payload),
    };
    const artifact = {
      ...payload,
      integrity,
    };
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `phase2b-batch2-schedule-strict-proof-${selectedProjectId}-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
    toast.success(`Batch 2 schedule-strict proof exported (${integrity.hash.slice(0, 12)}...).`);
  };

  const handleExportBatch3PreflipBaseline = async () => {
    if (typeof window === 'undefined') return;
    const selectedSignoffCheckpoint =
      approvedBatch1Checkpoints.find((entry) => entry.checkpointId === selectedApprovedCheckpointId) || null;
    if (!selectedSignoffCheckpoint) {
      toast.error('Approved checkpoint required before Batch 3 pre-flip export.');
      return;
    }
    const payload = {
      packetVersion: '1.0',
      packetKind: 'phase2b-batch3-preflip-baseline',
      workspaceId: selectedProjectId,
      exportedAt: new Date().toISOString(),
      signoffCheckpoint: selectedSignoffCheckpoint,
      authorityRouting: authorityRoutingSnapshot,
      rolloutPlan: {
        order: ['goal', 'project'],
        strictMode: {
          goal: true,
          project: false,
        },
        rollbackPolicy: 'local-fallback-on-backend-failure',
      },
      readiness: batch1Readiness,
      parity: {
        taskCalendar: parityReport,
        crossSurface: taskSurfaceParityReport,
        backendMirror: shadowParityReport,
      },
      incidents: recentSurfaceIncidents,
    };
    const integrity = {
      algorithm: 'sha256',
      hash: await computeSha256Hex(payload),
    };
    const artifact = {
      ...payload,
      integrity,
    };
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `phase2b-batch3-preflip-baseline-${selectedProjectId}-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
    toast.success(`Batch 3 pre-flip baseline exported (${integrity.hash.slice(0, 12)}...).`);
  };

  const handleExportBatch3GoalStrictProof = async () => {
    if (typeof window === 'undefined') return;
    const selectedSignoffCheckpoint =
      approvedBatch1Checkpoints.find((entry) => entry.checkpointId === selectedApprovedCheckpointId) || null;
    if (!selectedSignoffCheckpoint) {
      toast.error('Approved checkpoint required before Batch 3 goal-strict proof export.');
      return;
    }
    if (!authorityRoutingSnapshot.goalBackendEnabled || !authorityRoutingSnapshot.strictGoalEnabled) {
      toast.error('Goal backend + goal strict must be ON before exporting goal-strict proof.');
      return;
    }
    if (authorityRoutingSnapshot.strictProjectEnabled) {
      toast.error('Project strict must remain OFF during goal-first proof export.');
      return;
    }
    const payload = {
      packetVersion: '1.0',
      packetKind: 'phase2b-batch3-goal-strict-proof',
      workspaceId: selectedProjectId,
      exportedAt: new Date().toISOString(),
      signoffCheckpoint: selectedSignoffCheckpoint,
      authorityRouting: authorityRoutingSnapshot,
      rolloutInvariant: {
        goalBackendRequired: true,
        goalStrictRequired: true,
        projectStrictRequired: false,
      },
      readiness: batch1Readiness,
      parity: {
        taskCalendar: parityReport,
        crossSurface: taskSurfaceParityReport,
        backendMirror: shadowParityReport,
      },
      incidents: recentSurfaceIncidents,
    };
    const integrity = {
      algorithm: 'sha256',
      hash: await computeSha256Hex(payload),
    };
    const artifact = {
      ...payload,
      integrity,
    };
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `phase2b-batch3-goal-strict-proof-${selectedProjectId}-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
    toast.success(`Batch 3 goal-strict proof exported (${integrity.hash.slice(0, 12)}...).`);
  };

  const handleExportBatch3ProjectStrictProof = async () => {
    if (typeof window === 'undefined') return;
    const selectedSignoffCheckpoint =
      approvedBatch1Checkpoints.find((entry) => entry.checkpointId === selectedApprovedCheckpointId) || null;
    if (!selectedSignoffCheckpoint) {
      toast.error('Approved checkpoint required before Batch 3 project-strict proof export.');
      return;
    }
    if (!authorityRoutingSnapshot.strictGoalEnabled) {
      toast.error('Goal strict must remain ON before exporting project-strict proof.');
      return;
    }
    if (!authorityRoutingSnapshot.projectBackendEnabled || !authorityRoutingSnapshot.strictProjectEnabled) {
      toast.error('Project backend + project strict must be ON before exporting project-strict proof.');
      return;
    }
    const payload = {
      packetVersion: '1.0',
      packetKind: 'phase2b-batch3-project-strict-proof',
      workspaceId: selectedProjectId,
      exportedAt: new Date().toISOString(),
      signoffCheckpoint: selectedSignoffCheckpoint,
      authorityRouting: authorityRoutingSnapshot,
      rolloutInvariant: {
        goalStrictRequired: true,
        projectBackendRequired: true,
        projectStrictRequired: true,
      },
      readiness: batch1Readiness,
      parity: {
        taskCalendar: parityReport,
        crossSurface: taskSurfaceParityReport,
        backendMirror: shadowParityReport,
      },
      incidents: recentSurfaceIncidents,
    };
    const integrity = {
      algorithm: 'sha256',
      hash: await computeSha256Hex(payload),
    };
    const artifact = {
      ...payload,
      integrity,
    };
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `phase2b-batch3-project-strict-proof-${selectedProjectId}-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
    toast.success(`Batch 3 project-strict proof exported (${integrity.hash.slice(0, 12)}...).`);
  };

  const handleExportBatch4PreflipBaseline = async () => {
    if (typeof window === 'undefined') return;
    const selectedSignoffCheckpoint =
      approvedBatch1Checkpoints.find((entry) => entry.checkpointId === selectedApprovedCheckpointId) || null;
    if (!selectedSignoffCheckpoint) {
      toast.error('Approved checkpoint required before Batch 4 pre-flip export.');
      return;
    }
    if (!readAuthorityRoutingSnapshot.aiReadBackendEnabled) {
      toast.error('AI read backend must be ON before exporting Batch 4 pre-flip baseline.');
      return;
    }
    if (readAuthorityRoutingSnapshot.aiReadStrictEnabled || readAuthorityRoutingSnapshot.resonanceReadStrictEnabled) {
      toast.error('AI/Resonance read strict modes must remain OFF during Batch 4 pre-flip export.');
      return;
    }
    const payload = {
      packetVersion: '1.0',
      packetKind: 'phase2b-batch4-preflip-baseline',
      workspaceId: selectedProjectId,
      exportedAt: new Date().toISOString(),
      signoffCheckpoint: selectedSignoffCheckpoint,
      authorityRouting: authorityRoutingSnapshot,
      readAuthorityRouting: readAuthorityRoutingSnapshot,
      rolloutPlan: {
        order: ['ai', 'resonance'],
        strictMode: {
          ai: true,
          resonance: false,
        },
        rollbackPolicy: 'local-read-fallback-on-backend-failure',
      },
      provenance: {
        ai: aiReadAuthorityProvenance,
        resonance: resonanceReadAuthorityProvenance,
        recent: recentReadAuthorityProvenance,
      },
      readiness: batch1Readiness,
      parity: {
        taskCalendar: parityReport,
        crossSurface: taskSurfaceParityReport,
        backendMirror: shadowParityReport,
      },
      incidents: recentSurfaceIncidents,
    };
    const integrity = {
      algorithm: 'sha256',
      hash: await computeSha256Hex(payload),
    };
    const artifact = {
      ...payload,
      integrity,
    };
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `phase2b-batch4-preflip-baseline-${selectedProjectId}-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
    toast.success(`Batch 4 pre-flip baseline exported (${integrity.hash.slice(0, 12)}...).`);
  };

  const handleExportBatch4AiStrictProof = async () => {
    if (typeof window === 'undefined') return;
    const selectedSignoffCheckpoint =
      approvedBatch1Checkpoints.find((entry) => entry.checkpointId === selectedApprovedCheckpointId) || null;
    if (!selectedSignoffCheckpoint) {
      toast.error('Approved checkpoint required before Batch 4 AI strict proof export.');
      return;
    }
    if (!readAuthorityRoutingSnapshot.aiReadBackendEnabled || !readAuthorityRoutingSnapshot.aiReadStrictEnabled) {
      toast.error('AI read backend + AI read strict must be ON before exporting Batch 4 AI strict proof.');
      return;
    }
    if (readAuthorityRoutingSnapshot.resonanceReadStrictEnabled) {
      toast.error('Resonance read strict must remain OFF during AI-first strict proof export.');
      return;
    }
    const payload = {
      packetVersion: '1.0',
      packetKind: 'phase2b-batch4-ai-strict-proof',
      workspaceId: selectedProjectId,
      exportedAt: new Date().toISOString(),
      signoffCheckpoint: selectedSignoffCheckpoint,
      readAuthorityRouting: readAuthorityRoutingSnapshot,
      rolloutInvariant: {
        aiReadBackendRequired: true,
        aiReadStrictRequired: true,
        resonanceReadStrictRequired: false,
      },
      provenance: {
        ai: aiReadAuthorityProvenance,
        resonance: resonanceReadAuthorityProvenance,
        recent: recentReadAuthorityProvenance,
      },
      readiness: batch1Readiness,
      parity: {
        taskCalendar: parityReport,
        crossSurface: taskSurfaceParityReport,
        backendMirror: shadowParityReport,
      },
      incidents: recentSurfaceIncidents,
    };
    const integrity = {
      algorithm: 'sha256',
      hash: await computeSha256Hex(payload),
    };
    const artifact = {
      ...payload,
      integrity,
    };
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `phase2b-batch4-ai-strict-proof-${selectedProjectId}-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
    toast.success(`Batch 4 AI strict proof exported (${integrity.hash.slice(0, 12)}...).`);
  };

  const handleExportBatch4ResonanceStrictProof = async () => {
    if (typeof window === 'undefined') return;
    const selectedSignoffCheckpoint =
      approvedBatch1Checkpoints.find((entry) => entry.checkpointId === selectedApprovedCheckpointId) || null;
    if (!selectedSignoffCheckpoint) {
      toast.error('Approved checkpoint required before Batch 4 resonance strict proof export.');
      return;
    }
    if (!readAuthorityRoutingSnapshot.aiReadStrictEnabled) {
      toast.error('AI read strict must remain ON before exporting resonance strict proof.');
      return;
    }
    if (
      !readAuthorityRoutingSnapshot.resonanceReadBackendEnabled ||
      !readAuthorityRoutingSnapshot.resonanceReadStrictEnabled
    ) {
      toast.error('Resonance read backend + resonance read strict must be ON before exporting strict proof.');
      return;
    }
    const payload = {
      packetVersion: '1.0',
      packetKind: 'phase2b-batch4-resonance-strict-proof',
      workspaceId: selectedProjectId,
      exportedAt: new Date().toISOString(),
      signoffCheckpoint: selectedSignoffCheckpoint,
      readAuthorityRouting: readAuthorityRoutingSnapshot,
      rolloutInvariant: {
        aiReadStrictRequired: true,
        resonanceReadBackendRequired: true,
        resonanceReadStrictRequired: true,
      },
      provenance: {
        ai: aiReadAuthorityProvenance,
        resonance: resonanceReadAuthorityProvenance,
        recent: recentReadAuthorityProvenance,
      },
      readiness: batch1Readiness,
      parity: {
        taskCalendar: parityReport,
        crossSurface: taskSurfaceParityReport,
        backendMirror: shadowParityReport,
      },
      incidents: recentSurfaceIncidents,
    };
    const integrity = {
      algorithm: 'sha256',
      hash: await computeSha256Hex(payload),
    };
    const artifact = {
      ...payload,
      integrity,
    };
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `phase2b-batch4-resonance-strict-proof-${selectedProjectId}-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
    toast.success(`Batch 4 resonance strict proof exported (${integrity.hash.slice(0, 12)}...).`);
  };

  const handleGenerateBatch5MigrationDryRunPlan = () => {
    if (typeof window === 'undefined') return;
    const plan = buildBatch5MigrationBoundaryPlan({
      workspaceId: selectedProjectId || 'workspace-main',
      tasks: projectTasks as Array<Record<string, unknown>>,
      scheduleEvents: projectCalendarEvents as Array<Record<string, unknown>>,
      mode: 'dry_run',
    });
    appendBatch5MigrationBoundaryPlan(plan);
    appendReconciliationLog({
      entryId: `batch5-plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      eventType: 'batch5.migration.plan.generated',
      entityKind: 'workspace',
      entityId: selectedProjectId || 'workspace-main',
      workspaceId: selectedProjectId || 'workspace-main',
      mode: 'dry_run',
      outcome: 'simulated',
      detail: `taskWindow:${plan.windows.task.from || 'n/a'}..${plan.windows.task.to || 'n/a'} scheduleWindow:${plan.windows.schedule.from || 'n/a'}..${plan.windows.schedule.to || 'n/a'}`,
      occurredAt: new Date().toISOString(),
    });
    setBatch5MigrationPlanVersion((prev) => prev + 1);
    setReconciliationVersion((prev) => prev + 1);
    toast.success(
      `Batch 5 migration dry-run plan generated (${plan.planId.slice(-8)}).`,
    );
  };

  const handleExportBatch5MigrationDryRunPlan = async () => {
    if (typeof window === 'undefined') return;
    const selectedSignoffCheckpoint =
      approvedBatch1Checkpoints.find((entry) => entry.checkpointId === selectedApprovedCheckpointId) || null;
    if (!selectedSignoffCheckpoint) {
      toast.error('Approved checkpoint required before Batch 5 migration dry-run export.');
      return;
    }
    const latestPlan =
      batch5MigrationPlans[0] ||
      buildBatch5MigrationBoundaryPlan({
        workspaceId: selectedProjectId || 'workspace-main',
        tasks: projectTasks as Array<Record<string, unknown>>,
        scheduleEvents: projectCalendarEvents as Array<Record<string, unknown>>,
        mode: 'dry_run',
      });
    if (batch5MigrationPlans.length === 0) {
      appendBatch5MigrationBoundaryPlan(latestPlan);
      setBatch5MigrationPlanVersion((prev) => prev + 1);
    }

    const payload = {
      packetVersion: '1.0',
      packetKind: 'phase2b-batch5-migration-dry-run-plan',
      workspaceId: selectedProjectId,
      exportedAt: new Date().toISOString(),
      signoffCheckpoint: selectedSignoffCheckpoint,
      migrationPlan: latestPlan,
      authorityRouting: authorityRoutingSnapshot,
      readAuthorityRouting: readAuthorityRoutingSnapshot,
      readiness: batch1Readiness,
      parity: {
        taskCalendar: parityReport,
        crossSurface: taskSurfaceParityReport,
        backendMirror: shadowParityReport,
      },
      incidents: recentSurfaceIncidents,
      reconciliationSnapshots,
    };
    const integrity = {
      algorithm: 'sha256',
      hash: await computeSha256Hex(payload),
    };
    const artifact = {
      ...payload,
      integrity,
    };
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `phase2b-batch5-migration-dry-run-plan-${selectedProjectId}-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
    toast.success(`Batch 5 migration dry-run plan exported (${integrity.hash.slice(0, 12)}...).`);
  };

  const handleApplyBatch5MigrationSlice = () => {
    if (typeof window === 'undefined') return;
    const selectedSignoffCheckpoint =
      approvedBatch1Checkpoints.find((entry) => entry.checkpointId === selectedApprovedCheckpointId) || null;
    if (!selectedSignoffCheckpoint) {
      toast.error('Approved checkpoint required before Batch 5 migration apply.');
      return;
    }
    if (batch1Readiness.verdict !== 'go') {
      toast.error('Batch 1 readiness must be GO before Batch 5 migration apply.');
      return;
    }
    const latestPlan = batch5MigrationPlans[0];
    if (!latestPlan) {
      toast.error('Generate a Batch 5 migration dry-run plan before apply.');
      return;
    }

    const idempotencyKey = `batch5-apply:${selectedProjectId}:${latestPlan.planId}:${selectedSignoffCheckpoint.checkpointId}`;
    const result = applyBatch5Migration({
      workspaceId: selectedProjectId || 'workspace-main',
      planId: latestPlan.planId,
      approvedCheckpointId: selectedSignoffCheckpoint.checkpointId,
      idempotencyKey,
      tasks: projectTasks as Array<Record<string, unknown>>,
      scheduleEvents: projectCalendarEvents as Array<Record<string, unknown>>,
      paritySnapshot: {
        taskCalendarParityPercent: parityScorePercent,
        crossSurfaceParityPercent: taskSurfaceParityPercent,
        backendMirrorParityPercent: Math.round((shadowParityReport?.parityScore || 0) * 100),
      },
    });
    const replayProbe = applyBatch5Migration({
      workspaceId: selectedProjectId || 'workspace-main',
      planId: latestPlan.planId,
      approvedCheckpointId: selectedSignoffCheckpoint.checkpointId,
      idempotencyKey,
      tasks: projectTasks as Array<Record<string, unknown>>,
      scheduleEvents: projectCalendarEvents as Array<Record<string, unknown>>,
      paritySnapshot: {
        taskCalendarParityPercent: parityScorePercent,
        crossSurfaceParityPercent: taskSurfaceParityPercent,
        backendMirrorParityPercent: Math.round((shadowParityReport?.parityScore || 0) * 100),
      },
    });
    const replayPassed = replayProbe.replayed && replayProbe.run.runId === result.run.runId;
    setBatch5ReplayAssertion({
      passed: replayPassed,
      runId: result.run.runId,
      checkedAt: new Date().toISOString(),
      detail: replayPassed
        ? 'batch5_replay_assertion_passed'
        : 'batch5_replay_assertion_failed_run_id_mismatch_or_non_replay',
    });

    appendReconciliationLog({
      entryId: `batch5-apply-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      runId: result.run.runId,
      eventType: result.replayed ? 'batch5.migration.apply.replayed' : 'batch5.migration.apply.applied',
      entityKind: 'workspace',
      entityId: selectedProjectId || 'workspace-main',
      workspaceId: selectedProjectId || 'workspace-main',
      mode: 'apply',
      outcome: result.replayed ? 'skipped' : 'applied',
      detail: `plan:${latestPlan.planId} rollback:${result.rollbackCheckpoint.checkpointId}`,
      occurredAt: new Date().toISOString(),
    });
    appendReconciliationLog({
      entryId: `batch5-replay-assert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      runId: result.run.runId,
      eventType: replayPassed
        ? 'batch5.migration.replay.assertion.passed'
        : 'batch5.migration.replay.assertion.failed',
      entityKind: 'workspace',
      entityId: selectedProjectId || 'workspace-main',
      workspaceId: selectedProjectId || 'workspace-main',
      mode: 'apply',
      outcome: replayPassed ? 'applied' : 'failed',
      detail: replayPassed ? 'replay_idempotency_confirmed' : 'replay_assertion_failed',
      occurredAt: new Date().toISOString(),
    });
    setBatch5MigrationApplyVersion((prev) => prev + 1);
    setReconciliationVersion((prev) => prev + 1);
    if (result.replayed) {
      toast.success(`Batch 5 apply replayed safely (idempotency hit: ${result.run.runId.slice(-8)}).`);
      return;
    }
    if (!replayPassed) {
      toast.error('Batch 5 replay assertion failed. Keep rollout blocked until investigated.');
      return;
    }
    toast.success(`Batch 5 apply slice recorded (${result.run.runId.slice(-8)}).`);
  };

  const handleExportBatch5ApplyDriftEvidence = async () => {
    if (typeof window === 'undefined') return;
    const selectedSignoffCheckpoint =
      approvedBatch1Checkpoints.find((entry) => entry.checkpointId === selectedApprovedCheckpointId) || null;
    if (!selectedSignoffCheckpoint) {
      toast.error('Approved checkpoint required before Batch 5 apply evidence export.');
      return;
    }
    const latestRun = batch5MigrationApplyRuns[0];
    if (!latestRun) {
      toast.error('Run Batch 5 migration apply at least once before exporting apply evidence.');
      return;
    }
    const linkedRollback =
      batch5RollbackCheckpoints.find((entry) => entry.runId === latestRun.runId) || batch5RollbackCheckpoints[0];
    if (!linkedRollback) {
      toast.error('Rollback checkpoint required before exporting Batch 5 apply evidence.');
      return;
    }
    if (batch5RolloutGate.verdict !== 'go') {
      toast.error('Batch 5 rollout gate must be GO before exporting apply evidence.');
      return;
    }
    const currentStateSignature = `t:${projectTasks.length}:${projectTasks
      .map((task) => String(task.id))
      .slice(0, 10)
      .join('|')}::s:${projectCalendarEvents.length}:${projectCalendarEvents
      .map((event: any) => String(event?.id || ''))
      .slice(0, 10)
      .join('|')}`;
    const currentParity = {
      taskCalendarParityPercent: parityScorePercent,
      crossSurfaceParityPercent: taskSurfaceParityPercent,
      backendMirrorParityPercent: Math.round((shadowParityReport?.parityScore || 0) * 100),
    };
    const driftDiff = {
      taskCountDelta: projectTasks.length - linkedRollback.beforeState.taskCount,
      scheduleCountDelta: projectCalendarEvents.length - linkedRollback.beforeState.scheduleCount,
      signatureChanged: linkedRollback.beforeState.stateSignature !== currentStateSignature,
      parityDelta: {
        taskCalendar:
          currentParity.taskCalendarParityPercent - linkedRollback.beforeState.taskCalendarParityPercent,
        crossSurface:
          currentParity.crossSurfaceParityPercent - linkedRollback.beforeState.crossSurfaceParityPercent,
        backendMirror:
          currentParity.backendMirrorParityPercent - linkedRollback.beforeState.backendMirrorParityPercent,
      },
    };

    const payload = {
      packetVersion: '1.0',
      packetKind: 'phase2b-batch5-migration-apply-evidence',
      workspaceId: selectedProjectId,
      exportedAt: new Date().toISOString(),
      signoffCheckpoint: selectedSignoffCheckpoint,
      migrationPlan:
        batch5MigrationPlans.find((entry) => entry.planId === latestRun.planId) || batch5MigrationPlans[0] || null,
      applyRun: latestRun,
      rollbackCheckpoint: linkedRollback,
      rolloutGate: batch5RolloutGate,
      replayAssertion: batch5ReplayAssertion,
      currentParity,
      driftDiff,
      readiness: batch1Readiness,
      parity: {
        taskCalendar: parityReport,
        crossSurface: taskSurfaceParityReport,
        backendMirror: shadowParityReport,
      },
      incidents: recentSurfaceIncidents,
      reconciliationSnapshots,
    };
    const integrity = {
      algorithm: 'sha256',
      hash: await computeSha256Hex(payload),
    };
    const artifact = {
      ...payload,
      integrity,
    };
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `phase2b-batch5-migration-apply-evidence-${selectedProjectId}-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
    toast.success(`Batch 5 apply evidence exported (${integrity.hash.slice(0, 12)}...).`);
  };

  const handleExportBatch5RolloutGateProof = async () => {
    if (typeof window === 'undefined') return;
    const selectedSignoffCheckpoint =
      approvedBatch1Checkpoints.find((entry) => entry.checkpointId === selectedApprovedCheckpointId) || null;
    if (!selectedSignoffCheckpoint) {
      toast.error('Approved checkpoint required before Batch 5 rollout gate export.');
      return;
    }
    if (batch5RolloutGate.verdict !== 'go') {
      toast.error('Batch 5 rollout gate must be GO before exporting rollout proof.');
      return;
    }
    const payload = {
      packetVersion: '1.0',
      packetKind: 'phase2b-batch5-rollout-gate-proof',
      workspaceId: selectedProjectId,
      exportedAt: new Date().toISOString(),
      signoffCheckpoint: selectedSignoffCheckpoint,
      rolloutGate: batch5RolloutGate,
      replayAssertion: batch5ReplayAssertion,
      latestApplyRun: latestBatch5ApplyRun,
      latestRollbackCheckpoint: latestBatch5RollbackCheckpoint,
      readiness: batch1Readiness,
      parity: {
        taskCalendar: parityReport,
        crossSurface: taskSurfaceParityReport,
        backendMirror: shadowParityReport,
      },
      incidents: recentSurfaceIncidents,
    };
    const integrity = {
      algorithm: 'sha256',
      hash: await computeSha256Hex(payload),
    };
    const artifact = {
      ...payload,
      integrity,
    };
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `phase2b-batch5-rollout-gate-proof-${selectedProjectId}-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
    toast.success(`Batch 5 rollout gate proof exported (${integrity.hash.slice(0, 12)}...).`);
  };

  const handleApplyScheduleFirstStrictPreset = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(AUTHORITY_ROUTING_FLAG_KEYS.scheduleBackend, 'true');
    window.localStorage.setItem(AUTHORITY_ROUTING_FLAG_KEYS.scheduleStrict, 'true');
    window.localStorage.setItem(AUTHORITY_ROUTING_FLAG_KEYS.taskBackend, 'false');
    window.localStorage.setItem(AUTHORITY_ROUTING_FLAG_KEYS.taskStrict, 'false');
    window.localStorage.setItem(AUTHORITY_ROUTING_FLAG_KEYS.strictGlobal, 'false');
    setAuthoritySnapshotVersion((prev) => prev + 1);
    toast.success('Schedule-first strict preset applied.');
  };

  const handleApplyGoalFirstStrictPreset = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(AUTHORITY_ROUTING_FLAG_KEYS.goalBackend, 'true');
    window.localStorage.setItem(AUTHORITY_ROUTING_FLAG_KEYS.goalStrict, 'true');
    window.localStorage.setItem(AUTHORITY_ROUTING_FLAG_KEYS.projectBackend, 'false');
    window.localStorage.setItem(AUTHORITY_ROUTING_FLAG_KEYS.projectStrict, 'false');
    window.localStorage.setItem(AUTHORITY_ROUTING_FLAG_KEYS.strictGlobal, 'false');
    setAuthoritySnapshotVersion((prev) => prev + 1);
    toast.success('Goal-first strict preset applied.');
  };

  const handleApplyProjectStrictPreset = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(AUTHORITY_ROUTING_FLAG_KEYS.goalBackend, 'true');
    window.localStorage.setItem(AUTHORITY_ROUTING_FLAG_KEYS.goalStrict, 'true');
    window.localStorage.setItem(AUTHORITY_ROUTING_FLAG_KEYS.projectBackend, 'true');
    window.localStorage.setItem(AUTHORITY_ROUTING_FLAG_KEYS.projectStrict, 'true');
    window.localStorage.setItem(AUTHORITY_ROUTING_FLAG_KEYS.strictGlobal, 'false');
    setAuthoritySnapshotVersion((prev) => prev + 1);
    toast.success('Project strict preset applied.');
  };

  const handleApplyAiReadFirstStrictPreset = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(READ_AUTHORITY_FLAG_KEYS.aiReadBackend, 'true');
    window.localStorage.setItem(READ_AUTHORITY_FLAG_KEYS.aiReadStrict, 'true');
    window.localStorage.setItem(READ_AUTHORITY_FLAG_KEYS.resonanceReadBackend, 'false');
    window.localStorage.setItem(READ_AUTHORITY_FLAG_KEYS.resonanceReadStrict, 'false');
    setAuthoritySnapshotVersion((prev) => prev + 1);
    toast.success('AI read-first strict preset applied.');
  };

  const handleApplyResonanceReadStrictPreset = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(READ_AUTHORITY_FLAG_KEYS.aiReadBackend, 'true');
    window.localStorage.setItem(READ_AUTHORITY_FLAG_KEYS.aiReadStrict, 'true');
    window.localStorage.setItem(READ_AUTHORITY_FLAG_KEYS.resonanceReadBackend, 'true');
    window.localStorage.setItem(READ_AUTHORITY_FLAG_KEYS.resonanceReadStrict, 'true');
    setAuthoritySnapshotVersion((prev) => prev + 1);
    toast.success('Resonance read strict preset applied.');
  };

  const handleRollbackAuthorityPreset = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(AUTHORITY_ROUTING_FLAG_KEYS.scheduleBackend, 'false');
    window.localStorage.setItem(AUTHORITY_ROUTING_FLAG_KEYS.scheduleStrict, 'false');
    window.localStorage.setItem(AUTHORITY_ROUTING_FLAG_KEYS.taskBackend, 'false');
    window.localStorage.setItem(AUTHORITY_ROUTING_FLAG_KEYS.taskStrict, 'false');
    window.localStorage.setItem(AUTHORITY_ROUTING_FLAG_KEYS.goalBackend, 'false');
    window.localStorage.setItem(AUTHORITY_ROUTING_FLAG_KEYS.goalStrict, 'false');
    window.localStorage.setItem(AUTHORITY_ROUTING_FLAG_KEYS.projectBackend, 'false');
    window.localStorage.setItem(AUTHORITY_ROUTING_FLAG_KEYS.projectStrict, 'false');
    window.localStorage.setItem(AUTHORITY_ROUTING_FLAG_KEYS.strictGlobal, 'false');
    window.localStorage.setItem(READ_AUTHORITY_FLAG_KEYS.aiReadBackend, 'false');
    window.localStorage.setItem(READ_AUTHORITY_FLAG_KEYS.aiReadStrict, 'false');
    window.localStorage.setItem(READ_AUTHORITY_FLAG_KEYS.resonanceReadBackend, 'false');
    window.localStorage.setItem(READ_AUTHORITY_FLAG_KEYS.resonanceReadStrict, 'false');
    setAuthoritySnapshotVersion((prev) => prev + 1);
    toast.success('Authority flags rolled back to local-only.');
  };

  const handleFreezeBatch1ReadinessSnapshot = async () => {
    if (typeof window === 'undefined') return;
    const now = new Date();
    const label = `batch1-signoff-candidate-${now.toISOString().replace(/[:.]/g, '-')}`;
    const checkpointPayload = {
      checkpointId: `batch1-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label,
      workspaceId: selectedProjectId || 'workspace-main',
      createdAt: now.toISOString(),
      status: 'candidate' as const,
      readiness: batch1Readiness,
    };
    const checkpoint: Batch1ReadinessCheckpoint = {
      ...checkpointPayload,
      integrity: {
        algorithm: 'sha256',
        hash: await computeSha256Hex(checkpointPayload),
      },
    };
    const history = readBatch1ReadinessCheckpoints();
    const scoped = history.filter((entry) => entry.workspaceId === checkpoint.workspaceId);
    const others = history.filter((entry) => entry.workspaceId !== checkpoint.workspaceId);
    const nextScoped = [checkpoint, ...scoped].slice(0, 40);
    writeBatch1ReadinessCheckpoints([...nextScoped, ...others]);
    setBatch1ReadinessCheckpointVersion((prev) => prev + 1);
    toast.success(`Frozen readiness snapshot (${checkpoint.integrity.hash.slice(0, 12)}...).`);
  };

  const handlePromoteCheckpointToSignoff = async (checkpointId: string) => {
    if (typeof window === 'undefined') return;
    const checkpoints = readBatch1ReadinessCheckpoints();
    const checkpoint = checkpoints.find((entry) => entry.checkpointId === checkpointId);
    if (!checkpoint) {
      toast.error('Checkpoint not found.');
      return;
    }
    if (checkpoint.status === 'approved') {
      toast.info('Checkpoint already approved and immutable.');
      return;
    }

    const approverNote = window.prompt('Enter approver note for signoff (required):', '')?.trim() || '';
    if (!approverNote) {
      toast.error('Approver note is required to approve signoff.');
      return;
    }

    const approver =
      window.localStorage.getItem('syncscript_auth_user_email') ||
      window.localStorage.getItem('syncscript_auth_user_id') ||
      'operator';

    const updatedCheckpoints = checkpoints.map((entry) => {
      if (entry.checkpointId !== checkpointId) return entry;
      const approvedPayload = {
        checkpointId: entry.checkpointId,
        label: entry.label,
        workspaceId: entry.workspaceId,
        createdAt: entry.createdAt,
        status: 'approved' as const,
        readiness: entry.readiness,
        approvedAt: new Date().toISOString(),
        approvedBy: approver,
        approverNote,
      };
      return {
        ...approvedPayload,
        integrity: {
          algorithm: 'sha256' as const,
          hash: '',
        },
      };
    });

    const finalized = await Promise.all(
      updatedCheckpoints.map(async (entry) => {
        if (entry.checkpointId !== checkpointId) return entry;
        const payload = {
          checkpointId: entry.checkpointId,
          label: entry.label,
          workspaceId: entry.workspaceId,
          createdAt: entry.createdAt,
          status: entry.status,
          readiness: entry.readiness,
          approvedAt: entry.approvedAt,
          approvedBy: entry.approvedBy,
          approverNote: entry.approverNote,
        };
        return {
          ...entry,
          integrity: {
            algorithm: 'sha256' as const,
            hash: await computeSha256Hex(payload),
          },
        };
      }),
    );

    writeBatch1ReadinessCheckpoints(finalized);
    setBatch1ReadinessCheckpointVersion((prev) => prev + 1);
    const approved = finalized.find((entry) => entry.checkpointId === checkpointId);
    toast.success(
      `Checkpoint approved (${approved?.integrity.hash.slice(0, 12) || 'hash unavailable'}...).`,
    );
  };

  const handleRequestSurfaceRefresh = () => {
    requestTaskSurfaceSnapshotRefresh('all', selectedProjectId || 'workspace-main');
    setSurfaceParityVersion((prev) => prev + 1);
    toast.success('Surface refresh requested across active views.');
  };

  const copySurfaceGapList = async (
    surface: 'workstream' | 'projects' | 'dashboard' | 'goals' | 'resonance' | 'ai_assistant',
  ) => {
    const ids =
      surface === 'workstream'
        ? taskSurfaceParityReport.missingInWorkstream
        : surface === 'projects'
        ? taskSurfaceParityReport.missingInProjects
        : surface === 'dashboard'
        ? taskSurfaceParityReport.missingInDashboard
        : surface === 'goals'
        ? taskSurfaceParityReport.missingInGoals
        : surface === 'resonance'
        ? taskSurfaceParityReport.missingInResonance
        : taskSurfaceParityReport.missingInAIAssistant;
    if (!ids.length) {
      toast.success('No missing IDs for this surface.');
      return;
    }
    const summary = `${surface}: ${ids.join(', ')}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(summary);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = summary;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      toast.success(`Copied ${surface} gap list.`);
    } catch {
      toast.error('Could not copy gap list.');
    }
  };

  const handleUpdateSurfaceIncidentStatus = (
    incidentId: string,
    status: 'acknowledged' | 'resolved',
  ) => {
    if (status === 'resolved') {
      const incident = recentSurfaceIncidents.find((entry) => entry.incidentId === incidentId);
      if (incident && !isSurfaceParityIncidentRunbookComplete(incident as any)) {
        toast.error('Complete all runbook steps before resolving this incident.');
        return;
      }
    }
    updateSurfaceParityIncidentStatus(incidentId, status);
    setSurfaceIncidentVersion((prev) => prev + 1);
    toast.success(`Incident marked ${status}.`);
  };

  const handleToggleSurfaceRunbookStep = (
    incidentId: string,
    stepIndex: number,
    completed: boolean,
  ) => {
    toggleSurfaceParityIncidentRunbookStep(incidentId, stepIndex, completed);
    setSurfaceIncidentVersion((prev) => prev + 1);
  };

  const handleExportSurfaceIncidents = async () => {
    if (typeof window === 'undefined') return;
    const selectedSignoffCheckpoint =
      approvedBatch1Checkpoints.find((entry) => entry.checkpointId === selectedApprovedCheckpointId) || null;
    const payload = {
      packetVersion: '1.1',
      packetKind: 'surface-parity-incident-evidence',
      workspaceId: selectedProjectId,
      exportedAt: new Date().toISOString(),
      policy: {
        staleAfterMs: SURFACE_STALE_AFTER_MS,
        criticalAfterMs: SURFACE_CRITICAL_STALE_AFTER_MS,
      },
      driftState: surfaceDriftState,
      incidents: recentSurfaceIncidents,
      signoffCheckpoint: selectedSignoffCheckpoint,
    };
    const integrity = {
      algorithm: 'sha256',
      hash: await computeSha256Hex(payload),
    };
    const artifact = {
      ...payload,
      integrity,
    };
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `surface-parity-incidents-${selectedProjectId}-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
    toast.success(`Surface incident evidence exported (${integrity.hash.slice(0, 12)}...).`);
  };

  const handleStartDrag = (payload: DragPayload) => (event: DragEvent) => {
    event.dataTransfer.setData('application/json', JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'move';
  };

  const promoteMilestoneOrStepToTask = async (payload: DragPayload, targetParentId?: string) => {
    if (payload.kind === 'task') {
      if (targetParentId && targetParentId !== payload.taskId) {
        // Prevent cyclic trees: source cannot become child of its own descendant.
        let cursor: string | undefined = targetParentId;
        while (cursor) {
          if (cursor === payload.taskId) {
            toast.error('Invalid move: this would create a cycle in the workstream tree.');
            return;
          }
          const cursorTask = tasksById.get(cursor);
          const nextParent = String(cursorTask?.parentTaskId || '').trim();
          cursor = nextParent || undefined;
        }
        await updateTask(payload.taskId, { parentTaskId: targetParentId });
        appendExecutionTrailEvent({
          type: 'task_reparented',
          title: 'Task moved in workstream',
          detail: `${payload.title} -> parent ${targetParentId}`,
          projectId: selectedProjectId,
          taskId: payload.taskId,
          actor: 'User',
        });
        setTrailVersion((prev) => prev + 1);
      } else if (!targetParentId) {
        await updateTask(payload.taskId, { parentTaskId: null });
        appendExecutionTrailEvent({
          type: 'task_reparented',
          title: 'Task moved to root',
          detail: payload.title,
          projectId: selectedProjectId,
          taskId: payload.taskId,
          actor: 'User',
        });
        setTrailVersion((prev) => prev + 1);
      }
      return;
    }

    const sourceTask = tasksById.get(payload.taskId);
    if (!sourceTask) return;
    const sourceProjectId = coerceTaskProjectId(sourceTask);
    const sourceMilestones = getTaskMilestones(sourceTask);

    const newTask = await createTask({
      title: payload.title,
      description: `Promoted from ${payload.kind} in ${sourceTask.title || 'task'}.`,
      priority: sourceTask.priority || 'medium',
      energyLevel: sourceTask.energyLevel || 'medium',
      dueDate: sourceTask.dueDate || safeDateDaysFromNow(7),
      tags: Array.isArray(sourceTask.tags) ? sourceTask.tags : [],
      goalId: sourceTask.goalId,
      projectId: sourceProjectId,
      parentTaskId: targetParentId || sourceTask.id,
      assignees: Array.isArray(sourceTask.assignees) ? sourceTask.assignees : [],
      collaborators: Array.isArray(sourceTask.collaborators) ? sourceTask.collaborators : [],
      resources: Array.isArray(sourceTask.resources) ? sourceTask.resources : [],
      status: 'todo',
    });
    const newTaskId = String(newTask?.id || '').trim();

    if (payload.kind === 'milestone') {
      const promotedMilestone = sourceMilestones.find((milestone: any) => String(milestone.id) === payload.milestoneId);
      const promotedSteps = Array.isArray(promotedMilestone?.steps) ? promotedMilestone.steps : [];
      const upgradedMilestones = promotedSteps.map((step: any, index: number) => ({
        id: step?.id || `ms-${Date.now()}-${index}`,
        title: step?.title || `Step ${index + 1}`,
        completed: Boolean(step?.completed),
        steps: [],
        resources: Array.isArray(step?.resources) ? step.resources : [],
        assignedTo: step?.assignedTo ? [step.assignedTo] : [],
      }));
      const milestonePatch: Record<string, any> = {
        ...buildMilestonePatch(sourceTask, sourceMilestones.filter((milestone: any) => String(milestone.id) !== payload.milestoneId)),
      };
      await updateTask(sourceTask.id, milestonePatch);
      if (promotedMilestone && newTaskId) {
        await updateTask(newTaskId, {
          resources: Array.isArray(promotedMilestone.resources) ? promotedMilestone.resources : [],
          assignees: Array.isArray(promotedMilestone.assignedTo) ? promotedMilestone.assignedTo : [],
          milestones: upgradedMilestones,
        });
      }
    } else if (payload.kind === 'step') {
      const nextMilestones = sourceMilestones.map((milestone: any) => {
        if (String(milestone.id) !== payload.milestoneId) return milestone;
        const nextSteps = (Array.isArray(milestone.steps) ? milestone.steps : []).filter(
          (step: any) => String(step.id) !== payload.stepId,
        );
        return { ...milestone, steps: nextSteps };
      });
      const promotedMilestone = sourceMilestones.find((milestone: any) => String(milestone.id) === payload.milestoneId);
      const promotedStep = (Array.isArray(promotedMilestone?.steps) ? promotedMilestone.steps : []).find(
        (step: any) => String(step.id) === payload.stepId,
      );
      await updateTask(sourceTask.id, buildMilestonePatch(sourceTask, nextMilestones));
      if (promotedStep && newTaskId) {
        await updateTask(newTaskId, {
          resources: Array.isArray(promotedStep.resources) ? promotedStep.resources : [],
          assignees: promotedStep.assignedTo ? [promotedStep.assignedTo] : [],
        });
      }
    }

    appendExecutionTrailEvent({
      type: 'node_promoted',
      title: `${payload.kind === 'step' ? 'Step' : 'Milestone'} promoted to task`,
      detail: payload.title,
      projectId: sourceProjectId,
      taskId: String(newTask?.id || ''),
      actor: 'User',
      metadata: { sourceTaskId: payload.taskId },
    });
    setTrailVersion((prev) => prev + 1);

    toast.success(`Promoted to task: ${newTask?.title || payload.title}`);
  };

  const handleDropOnRoot = async (event: DragEvent) => {
    event.preventDefault();
    const raw = event.dataTransfer.getData('application/json');
    if (!raw) return;
    try {
      const payload = JSON.parse(raw) as DragPayload;
      await promoteMilestoneOrStepToTask(payload, undefined);
    } catch {
      toast.error('Could not process dropped item');
    }
  };

  const handleDropOnTask = (targetTaskId: string) => async (event: DragEvent) => {
    event.preventDefault();
    const raw = event.dataTransfer.getData('application/json');
    if (!raw) return;
    try {
      const payload = JSON.parse(raw) as DragPayload;
      if (payload.kind === 'task' && payload.taskId === targetTaskId) return;
      await promoteMilestoneOrStepToTask(payload, targetTaskId);
    } catch {
      toast.error('Could not process dropped item');
    }
  };

  const applyTaskLane = async (taskId: string, lane: StatusLane) => {
    const task = tasksById.get(taskId);
    if (!task) return false;
    if (lane === 'done') {
      const incompleteDeps = getIncompleteBlockingTasks(task, tasksById);
      if (incompleteDeps.length > 0) {
        const blockerTitles = incompleteDeps.slice(0, 4).map((dep) => String(dep.title || dep.id));
        const blockerSummary =
          blockerTitles.length > 0 ? blockerTitles.join(', ') : `${incompleteDeps.length} blocking task(s)`;
        const shouldOverride = window.confirm(
          `This task is blocked by incomplete dependencies:\n\n${blockerSummary}\n\nMark as done anyway?`,
        );
        if (!shouldOverride) {
          toast.info('Move cancelled. Complete blocker tasks first or choose override.');
          return false;
        }
      }
    }

    if (lane === 'done') {
      await updateTask(taskId, { completed: true, status: 'completed' });
      appendExecutionTrailEvent({
        type: 'status_updated',
        title: 'Task moved to done',
        detail: String(task.title || taskId),
        projectId: coerceTaskProjectId(task),
        taskId,
        actor: 'User',
      });
      setTrailVersion((prev) => prev + 1);
      return true;
    }
    if (lane === 'doing') {
      await updateTask(taskId, { completed: false, status: 'doing' });
      appendExecutionTrailEvent({
        type: 'status_updated',
        title: 'Task moved to doing',
        detail: String(task.title || taskId),
        projectId: coerceTaskProjectId(task),
        taskId,
        actor: 'User',
      });
      setTrailVersion((prev) => prev + 1);
      return true;
    }
    if (lane === 'todo') {
      await updateTask(taskId, { completed: false, status: 'todo' });
      appendExecutionTrailEvent({
        type: 'status_updated',
        title: 'Task moved to to do',
        detail: String(task.title || taskId),
        projectId: coerceTaskProjectId(task),
        taskId,
        actor: 'User',
      });
      setTrailVersion((prev) => prev + 1);
      return true;
    }
    await updateTask(taskId, { completed: false, status: 'pending' });
    appendExecutionTrailEvent({
      type: 'status_updated',
      title: 'Task moved to pending',
      detail: String(task.title || taskId),
      projectId: coerceTaskProjectId(task),
      taskId,
      actor: 'User',
    });
    setTrailVersion((prev) => prev + 1);
    return true;
  };

  const handleDropOnStatusLane = (lane: StatusLane) => async (event: DragEvent) => {
    event.preventDefault();
    const raw = event.dataTransfer.getData('application/json');
    if (!raw) return;
    try {
      const payload = JSON.parse(raw) as DragPayload;
      if (payload.kind !== 'task') {
        toast.info('Only task cards can be moved across status lanes.');
        return;
      }
      const moved = await applyTaskLane(payload.taskId, lane);
      if (moved) {
        toast.success(`Task moved to ${lane}`);
      }
    } catch {
      toast.error('Could not move task to lane');
    }
  };

  const focusTaskInStatusBoard = (taskId: string, persist = false) => {
    if (mode === 'projects') {
      setInternalTab('status');
    }
    setHighlightTaskId(taskId);
    window.setTimeout(() => {
      const element = document.getElementById(`project-status-task-${taskId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
    if (!persist) {
      window.setTimeout(() => setHighlightTaskId((prev) => (prev === taskId ? null : prev)), 2200);
    }
  };

  const focusTaskInWorkstream = (taskId: string) => {
    setShowCompressedBranches(true);
    window.setTimeout(() => {
      const element = document.getElementById(`project-workstream-task-${taskId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightTaskId(taskId);
        window.setTimeout(() => setHighlightTaskId((prev) => (prev === taskId ? null : prev)), 2200);
      } else {
        toast.info('Task node not visible in this project workstream yet.');
      }
    }, 50);
  };

  const handleResolveBlockers = (task: AnyTask) => {
    const blockers = getIncompleteBlockingTasks(task, tasksById);
    if (blockers.length === 0) {
      toast.success('No active blockers on this task.');
      return;
    }
    const firstBlocker = blockers[0];
    focusTaskInStatusBoard(String(firstBlocker.id));
    toast.info(`Jumped to blocker: ${String(firstBlocker.title || firstBlocker.id)}`);
  };

  const handleResolveAllBlockers = (task: AnyTask) => {
    const blockers = getIncompleteBlockingTasks(task, tasksById);
    if (blockers.length === 0) {
      toast.success('No active blockers on this task.');
      return;
    }
    const blockerIds = blockers.map((blocker) => String(blocker.id));
    setBlockerRun({
      sourceTaskId: String(task.id),
      blockerIds,
      index: 0,
    });
    focusTaskInStatusBoard(blockerIds[0], true);
    toast.info(`Blocker run started (${blockerIds.length} blockers)`);
  };

  const moveBlockerRun = (delta: number) => {
    setBlockerRun((prev) => {
      if (!prev) return prev;
      const nextIndex = prev.index + delta;
      if (nextIndex < 0 || nextIndex >= prev.blockerIds.length) return prev;
      const nextId = prev.blockerIds[nextIndex];
      focusTaskInStatusBoard(nextId, true);
      return { ...prev, index: nextIndex };
    });
  };

  const rootTasks = useMemo(
    () => projectTasks.filter((task) => !String(task?.parentTaskId || '').trim()),
    [projectTasks],
  );

  const childrenByParent = useMemo(() => {
    const map = new Map<string, AnyTask[]>();
    for (const task of projectTasks) {
      const parentId = String(task?.parentTaskId || '').trim();
      if (!parentId) continue;
      const current = map.get(parentId) || [];
      current.push(task);
      map.set(parentId, current);
    }
    return map;
  }, [projectTasks]);

  const countDescendants = (taskId: string): number => {
    const children = childrenByParent.get(taskId) || [];
    return children.reduce((sum, child) => sum + 1 + countDescendants(String(child.id)), 0);
  };

  const isBranchCompleted = (taskId: string): boolean => {
    const task = tasksById.get(taskId);
    if (!task || !task.completed) return false;
    const children = childrenByParent.get(taskId) || [];
    return children.every((child) => isBranchCompleted(String(child.id)));
  };

  const compressCompletedBranches = () => {
    const next: Record<string, boolean> = {};
    for (const task of projectTasks) {
      const taskId = String(task.id);
      const descendants = countDescendants(taskId);
      if (descendants > 0 && isBranchCompleted(taskId)) {
        next[taskId] = true;
      }
    }
    setCollapsedTaskIds(next);
    setShowCompressedBranches(false);
    appendExecutionTrailEvent({
      type: 'branch_compressed',
      title: 'Compressed completed branches',
      detail: `${Object.keys(next).length} branch(es) compressed`,
      projectId: selectedProjectId,
      actor: 'User',
    });
    setTrailVersion((prev) => prev + 1);
    toast.success('Compressed completed branches');
  };

  useEffect(() => {
    const handleUpdated = () => setTrailVersion((prev) => prev + 1);
    const trailEvent = getExecutionTrailUpdatedEventName();
    const runsEvent = getImplementationRunsUpdatedEventName();
    window.addEventListener(trailEvent, handleUpdated as EventListener);
    window.addEventListener(runsEvent, handleUpdated as EventListener);
    return () => {
      window.removeEventListener(trailEvent, handleUpdated as EventListener);
      window.removeEventListener(runsEvent, handleUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!blockerRun) return;
    const remainingIds = blockerRun.blockerIds.filter((id) => {
      const blockerTask = tasksById.get(id);
      return Boolean(blockerTask) && !blockerTask.completed;
    });

    if (remainingIds.length === 0) {
      setBlockerRun(null);
      setHighlightTaskId(null);
      toast.success('All blockers resolved in this run.');
      return;
    }

    const currentId = blockerRun.blockerIds[blockerRun.index];
    let nextIndex = remainingIds.indexOf(currentId);
    if (nextIndex < 0) {
      nextIndex = Math.min(blockerRun.index, remainingIds.length - 1);
      focusTaskInStatusBoard(remainingIds[nextIndex], true);
    }

    const changedIds = remainingIds.join('|') !== blockerRun.blockerIds.join('|');
    if (changedIds || nextIndex !== blockerRun.index) {
      setBlockerRun((prev) => (prev
        ? {
            ...prev,
            blockerIds: remainingIds,
            index: nextIndex,
          }
        : prev));
    }
  }, [blockerRun, tasksById]);

  const renderTaskTree = (task: AnyTask, depth = 0) => {
    const children = childrenByParent.get(String(task.id)) || [];
    const taskId = String(task.id);
    const collapsed = Boolean(collapsedTaskIds[taskId]) && !showCompressedBranches;
    const hiddenCount = collapsed ? countDescendants(taskId) : 0;
    return (
      <div key={String(task.id)} className="space-y-2">
        <div
          id={`project-workstream-task-${taskId}`}
          className="rounded-lg border border-gray-700 bg-[#1f2330] p-3"
          style={
            highlightTaskId === taskId
              ? {
                  marginLeft: `${Math.min(depth, 6) * 16}px`,
                  boxShadow: '0 0 0 1px rgba(56, 189, 248, 0.75), 0 0 18px rgba(56, 189, 248, 0.3)',
                }
              : { marginLeft: `${Math.min(depth, 6) * 16}px` }
          }
          data-highlighted={highlightTaskId === taskId}
          aria-selected={highlightTaskId === taskId}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropOnTask(String(task.id))}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{task.title}</p>
              <p className="text-xs text-gray-400">Drop here to make child task</p>
              {classifyTaskStatus(task, tasksById) === 'pending' ? (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {getIncompleteBlockingTasks(task, tasksById).slice(0, 3).map((dep) => (
                    <Badge
                      key={`${task.id}-pending-${String(dep.id)}`}
                      variant="outline"
                      className="border-amber-500/40 text-[10px] text-amber-300"
                    >
                      blocked by {String(dep.title || dep.id)}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
            <Badge variant="outline" className="border-gray-600 text-gray-300">
              {classifyTaskStatus(task, tasksById)}
            </Badge>
          </div>
          {children.length > 0 ? (
            <div className="mt-1.5">
              <button
                type="button"
                onClick={() =>
                  setCollapsedTaskIds((prev) => ({
                    ...prev,
                    [taskId]: !prev[taskId],
                  }))
                }
                className="rounded border border-gray-600 px-1.5 py-0.5 text-[10px] text-gray-300 hover:border-gray-500"
              >
                {collapsed ? `Expand (${hiddenCount})` : 'Collapse branch'}
              </button>
            </div>
          ) : null}

          {getTaskMilestones(task).length > 0 ? (
            <div className="mt-3 space-y-1 rounded-md bg-[#171b23] p-2">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">Milestones & steps (draggable)</p>
              {getTaskMilestones(task).map((milestone: any) => (
                <div key={String(milestone.id)} className="rounded border border-gray-700 px-2 py-1">
                  <div
                    className="cursor-grab text-xs text-indigo-200"
                    draggable
                    onDragStart={handleStartDrag({
                      kind: 'milestone',
                      taskId: String(task.id),
                      milestoneId: String(milestone.id),
                      title: String(milestone.title || 'Milestone'),
                    })}
                  >
                    ◦ {milestone.title || 'Untitled milestone'}
                  </div>
                  {Array.isArray(milestone.steps) && milestone.steps.length > 0 ? (
                    <div className="mt-1 space-y-0.5 pl-3">
                      {milestone.steps.map((step: any) => (
                        <div
                          key={String(step.id)}
                          className="cursor-grab text-xs text-cyan-200"
                          draggable
                          onDragStart={handleStartDrag({
                            kind: 'step',
                            taskId: String(task.id),
                            milestoneId: String(milestone.id),
                            stepId: String(step.id),
                            title: String(step.title || 'Step'),
                          })}
                        >
                          - {step.title || 'Untitled step'}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
        {!collapsed ? children.map((child) => renderTaskTree(child, depth + 1)) : null}
        {collapsed ? (
          <p
            style={{ marginLeft: `${Math.min(depth + 1, 6) * 16}px` }}
            className="text-[11px] text-gray-500"
          >
            {hiddenCount} item(s) compressed in this branch
          </p>
        ) : null}
      </div>
    );
  };

  if (mode === 'workstream') {
    return (
      <div
        className="flex h-full min-h-0 flex-col gap-2 overflow-hidden"
        style={{ height: 'calc(100dvh - 70px)', minHeight: '860px' }}
      >
        <div className="flex items-center justify-end">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="h-8 min-w-[220px] border-gray-700 bg-[#0f141f] text-gray-100">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent className="border-gray-700 bg-[#0f141f] text-gray-100">
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
        {flowCanvasEnabled ? (
          <WorkstreamFlowCanvas
            tasks={projectTasks}
            projectId={selectedProjectId}
            projectName={projects.find((project) => project.id === selectedProjectId)?.name || 'Untitled Workflow'}
            createTask={createTask}
            updateTask={updateTask}
            deleteTask={deleteTask}
            onSelectTaskId={setFlowInspectorTaskId}
            fullViewport
            startBlank={workstreamBlankStart}
            onUpdateProjectName={handleRenameProject}
            onSaveProject={handleManualSaveProject}
            onToggleBlankStart={handleToggleBlankStart}
          />
        ) : (
          <div
            className="rounded-xl border border-dashed border-indigo-500/40 bg-indigo-500/5 p-4"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDropOnRoot}
          >
            <p className="text-sm font-semibold text-indigo-200">Workstream</p>
            <p className="text-xs text-gray-400">Flow canvas is disabled for this environment.</p>
          </div>
        )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-700 bg-[#1c212d] p-4">
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <div className="min-w-[220px] flex-1 space-y-1.5">
            <Label className="text-xs text-gray-300">Create project</Label>
            <Input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="e.g., Q2 Growth Engine"
              className="h-9 border-gray-700 bg-[#12151b] text-sm"
            />
          </div>
          <Button onClick={handleCreateProject}>Create Project</Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {projects.map((project) => {
            const active = selectedProjectId === project.id;
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => setSelectedProjectId(project.id)}
                className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                  active
                    ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-200'
                    : 'border-gray-700 bg-[#171b23] text-gray-300 hover:border-gray-600'
                }`}
              >
                {project.name}
              </button>
            );
          })}
        </div>
      </div>

      {mode === 'projects' ? (
        <Tabs value={internalTab} onValueChange={(v) => setInternalTab(v as ProjectTab)} className="w-full">
          <TabsList className="grid w-full max-w-xl grid-cols-3 bg-[#1a1d24]">
            <TabsTrigger value="overview">Project Overview</TabsTrigger>
            <TabsTrigger value="status">Status Board</TabsTrigger>
            <TabsTrigger value="command">Command Center</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="rounded-xl border border-cyan-500/25 bg-gradient-to-r from-[#162132] via-[#141d2b] to-[#101722] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/80">Project cockpit</p>
                  <p className="text-xl font-semibold text-white">
                    {projects.find((project) => project.id === selectedProjectId)?.name || 'General Project'}
                  </p>
                  <p className="mt-1 text-xs text-gray-300">
                    Clear signal on what is blocked, what is ready now, and what to execute next.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {contractPulse ? (
                    <Badge variant="outline" className="border-cyan-500/40 text-cyan-200">
                      {contractPulse.eventType}
                    </Badge>
                  ) : null}
                  {recentReconciliationEvents.length > 0 ? (
                    <Badge variant="outline" className="border-gray-600 text-gray-300">
                      Reconciliation {recentReconciliationEvents.length}
                    </Badge>
                  ) : null}
                  <Button size="sm" variant="outline" onClick={() => setInternalTab('status')}>
                    Open Status Board
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setInternalTab('command')}>
                    Open Command Center
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <div className="max-h-[78vh] overflow-y-auto rounded-lg border border-gray-700 bg-[#1e2430] p-3 pr-2">
                <p className="text-xs text-gray-400">Tasks</p>
                <p className="text-xl font-semibold text-white">{projectTasks.length}</p>
              </div>
              <div className="rounded-lg border border-gray-700 bg-[#1e2430] p-3">
                <p className="text-xs text-gray-400">Goals</p>
                <p className="text-xl font-semibold text-white">{projectGoals.length}</p>
              </div>
              <div className="rounded-lg border border-gray-700 bg-[#1e2430] p-3">
                <p className="text-xs text-gray-400">Ready now</p>
                <p className="text-xl font-semibold text-cyan-200">{groupedStatus.todo.length}</p>
              </div>
              <div className="rounded-lg border border-gray-700 bg-[#1e2430] p-3">
                <p className="text-xs text-gray-400">In execution</p>
                <p className="text-xl font-semibold text-indigo-200">{groupedStatus.doing.length}</p>
              </div>
              <div className="rounded-lg border border-gray-700 bg-[#1e2430] p-3">
                <p className="text-xs text-gray-400">Blocked</p>
                <p className="text-xl font-semibold text-amber-300">{groupedStatus.pending.length}</p>
              </div>
              <div className="rounded-lg border border-gray-700 bg-[#1e2430] p-3">
                <p className="text-xs text-gray-400">Completion</p>
                <p className="text-xl font-semibold text-emerald-300">{completionRate}%</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-lg border border-gray-700 bg-[#1e2430] p-3">
                <p className="text-xs uppercase tracking-wide text-gray-400">System health</p>
                <div className="mt-2 space-y-2">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px] text-gray-300">
                      <span>Completion rate</span>
                      <span>{completionRate}%</span>
                    </div>
                    <div className="h-1.5 rounded bg-gray-800">
                      <div className="h-1.5 rounded bg-emerald-400" style={{ width: `${completionRate}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px] text-gray-300">
                      <span>Active execution</span>
                      <span>{activeRate}%</span>
                    </div>
                    <div className="h-1.5 rounded bg-gray-800">
                      <div className="h-1.5 rounded bg-cyan-400" style={{ width: `${activeRate}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px] text-gray-300">
                      <span>Blocked pressure</span>
                      <span>{blockedRate}%</span>
                    </div>
                    <div className="h-1.5 rounded bg-gray-800">
                      <div className="h-1.5 rounded bg-amber-400" style={{ width: `${blockedRate}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px] text-gray-300">
                      <span>Task-calendar parity</span>
                      <span>{parityScorePercent}%</span>
                    </div>
                    <div className="h-1.5 rounded bg-gray-800">
                      <div
                        className={`h-1.5 rounded ${parityScorePercent >= 90 ? 'bg-emerald-400' : parityScorePercent >= 70 ? 'bg-amber-400' : 'bg-rose-400'}`}
                        style={{ width: `${parityScorePercent}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="border-gray-600 text-[10px] text-gray-300">
                        Scheduled {parityReport.scheduledTasks}
                      </Badge>
                      <Badge variant="outline" className="border-cyan-500/40 text-[10px] text-cyan-200">
                        Linked {parityReport.linkedTasks}
                      </Badge>
                      {parityReport.missingLinks.length > 0 ? (
                        <Badge variant="outline" className="border-amber-500/40 text-[10px] text-amber-300">
                          Missing {parityReport.missingLinks.length}
                        </Badge>
                      ) : null}
                      {parityReport.orphanedEvents.length > 0 ? (
                        <Badge variant="outline" className="border-rose-500/40 text-[10px] text-rose-300">
                          Orphaned {parityReport.orphanedEvents.length}
                        </Badge>
                      ) : null}
                    </div>
                    <p
                      className={`mt-1 text-[10px] ${
                        parityGuardrail.level === 'critical'
                          ? 'text-rose-300'
                          : parityGuardrail.level === 'watch'
                          ? 'text-amber-300'
                          : 'text-emerald-300'
                      }`}
                    >
                      {parityGuardrail.summary}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowParityActions((prev) => !prev)}
                        className="rounded border border-indigo-500/40 bg-indigo-500/10 px-1.5 py-0.5 text-[10px] text-indigo-200 hover:bg-indigo-500/20"
                      >
                        {showParityActions ? 'Hide actions' : 'Show actions'}
                      </button>
                      <span className="text-[10px] text-gray-500">
                        {parityActions.length} reconciliation action(s)
                      </span>
                      <button
                        type="button"
                        onClick={() => setParitySafeMode((prev) => !prev)}
                        className={`rounded border px-1.5 py-0.5 text-[10px] ${
                          paritySafeMode
                            ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                            : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                        }`}
                      >
                        {paritySafeMode ? 'Safe mode ON (dry run)' : 'Safe mode OFF (apply)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleApplyParityActions()}
                        disabled={parityApplying || parityActions.length === 0}
                        className="rounded border border-cyan-500/40 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-200 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {parityApplying ? 'Applying...' : paritySafeMode ? 'Simulate high-confidence fixes' : 'Apply high-confidence fixes'}
                      </button>
                    </div>
                    {showParityActions && parityActions.length > 0 ? (
                      <div className="mt-1.5 space-y-1">
                        {parityActions.slice(0, 5).map((action) => (
                          <p key={action.id} className="text-[10px] text-gray-400">
                            [{action.priority}] {action.summary}
                          </p>
                        ))}
                      </div>
                    ) : null}
                    {recentReconciliationEvents.length > 0 ? (
                      <div className="mt-1.5 space-y-1">
                        {recentReconciliationEvents.map((entry, index) => (
                          <p key={`${entry.eventType}-${entry.occurredAt}-${index}`} className="text-[10px] text-gray-500">
                            {entry.eventType} - {new Date(entry.occurredAt).toLocaleTimeString()}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px] text-gray-300">
                      <span>Assignment parity</span>
                      <span>{assignmentParityPercent}%</span>
                    </div>
                    <div className="h-1.5 rounded bg-gray-800">
                      <div
                        className={`h-1.5 rounded ${assignmentParityPercent >= 95 ? 'bg-emerald-400' : assignmentParityPercent >= 80 ? 'bg-amber-400' : 'bg-rose-400'}`}
                        style={{ width: `${assignmentParityPercent}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="border-gray-600 text-[10px] text-gray-300">
                        Valid {assignmentParityReport.validTasks}
                      </Badge>
                      <Badge variant="outline" className="border-gray-600 text-[10px] text-gray-300">
                        Shape OK {assignmentParityReport.shapeValidTasks}
                      </Badge>
                      {assignmentParityReport.malformedTaskIds.length > 0 ? (
                        <Badge variant="outline" className="border-rose-500/40 text-[10px] text-rose-300">
                          Malformed {assignmentParityReport.malformedTaskIds.length}
                        </Badge>
                      ) : null}
                      {assignmentParityReport.unknownIdentityTaskIds.length > 0 ? (
                        <Badge variant="outline" className="border-amber-500/40 text-[10px] text-amber-300">
                          Unknown identities {assignmentParityReport.unknownIdentityTaskIds.length}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px] text-gray-300">
                      <span>Cross-surface parity</span>
                      <span>{taskSurfaceParityPercent}%</span>
                    </div>
                    <div className="h-1.5 rounded bg-gray-800">
                      <div
                        className={`h-1.5 rounded ${taskSurfaceParityPercent >= 95 ? 'bg-emerald-400' : taskSurfaceParityPercent >= 80 ? 'bg-amber-400' : 'bg-rose-400'}`}
                        style={{ width: `${taskSurfaceParityPercent}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="border-gray-600 text-[10px] text-gray-300">
                        Canonical {taskSurfaceParityReport.canonicalCount}
                      </Badge>
                      <Badge variant="outline" className="border-cyan-500/40 text-[10px] text-cyan-200">
                        Workstream missing {taskSurfaceParityReport.missingInWorkstream.length}
                      </Badge>
                      <Badge variant="outline" className="border-indigo-500/40 text-[10px] text-indigo-200">
                        Dashboard missing {taskSurfaceParityReport.missingInDashboard.length}
                      </Badge>
                      <Badge variant="outline" className="border-amber-500/40 text-[10px] text-amber-200">
                        Goals missing {taskSurfaceParityReport.missingInGoals.length}
                      </Badge>
                      <Badge variant="outline" className="border-violet-500/40 text-[10px] text-violet-200">
                        Resonance missing {taskSurfaceParityReport.missingInResonance.length}
                      </Badge>
                      <Badge variant="outline" className="border-sky-500/40 text-[10px] text-sky-200">
                        AI missing {taskSurfaceParityReport.missingInAIAssistant.length}
                      </Badge>
                      <Badge variant="outline" className="border-gray-600 text-[10px] text-gray-300">
                        Tasks tab {snapshotFreshnessLabel(taskSurfaceSnapshots.tasksTab.capturedAt)}
                      </Badge>
                      <Badge variant="outline" className="border-gray-600 text-[10px] text-gray-300">
                        Workstream {snapshotFreshnessLabel(taskSurfaceSnapshots.workstream.capturedAt)}
                      </Badge>
                      <Badge variant="outline" className="border-gray-600 text-[10px] text-gray-300">
                        Dashboard {snapshotFreshnessLabel(taskSurfaceSnapshots.dashboard.capturedAt)}
                      </Badge>
                      <Badge variant="outline" className="border-gray-600 text-[10px] text-gray-300">
                        Goals {snapshotFreshnessLabel(taskSurfaceSnapshots.goals.capturedAt)}
                      </Badge>
                      <Badge variant="outline" className="border-gray-600 text-[10px] text-gray-300">
                        Resonance {snapshotFreshnessLabel(taskSurfaceSnapshots.resonance.capturedAt)}
                      </Badge>
                      <Badge variant="outline" className="border-gray-600 text-[10px] text-gray-300">
                        AI Assistant {snapshotFreshnessLabel(taskSurfaceSnapshots.aiAssistant.capturedAt)}
                      </Badge>
                    </div>
                    {shadowParityReport ? (
                      <div className="mt-1.5">
                        <div className="mb-1 flex items-center justify-between text-[11px] text-gray-300">
                          <span>Backend mirror parity</span>
                          <span>{Math.round(shadowParityReport.parityScore * 100)}%</span>
                        </div>
                        <div className="h-1.5 rounded bg-gray-800">
                          <div
                            className={`h-1.5 rounded ${
                              shadowParityReport.parityScore >= 0.95
                                ? 'bg-emerald-400'
                                : shadowParityReport.parityScore >= 0.8
                                  ? 'bg-amber-400'
                                  : 'bg-rose-400'
                            }`}
                            style={{ width: `${Math.round(shadowParityReport.parityScore * 100)}%` }}
                          />
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {shadowParityReport.domains.map((domain) => (
                            <Badge
                              key={domain.domain}
                              variant="outline"
                              className={`text-[10px] ${
                                domain.status === 'match'
                                  ? 'border-emerald-500/40 text-emerald-200'
                                  : domain.status === 'drift'
                                    ? 'border-amber-500/40 text-amber-200'
                                    : 'border-gray-600 text-gray-300'
                              }`}
                            >
                              {domain.domain}: {domain.localCount}/{domain.backendCount ?? '-'}
                            </Badge>
                          ))}
                        </div>
                        <div className="mt-1.5">
                          <button
                            type="button"
                            onClick={() => void handleExportBackendShadowParity()}
                            className="rounded border border-cyan-500/40 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-200 hover:bg-cyan-500/20"
                          >
                            Export backend mirror parity
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleExportBatch1ShadowEvidencePack()}
                            className="ml-1.5 rounded border border-indigo-500/40 bg-indigo-500/10 px-1.5 py-0.5 text-[10px] text-indigo-200 hover:bg-indigo-500/20"
                          >
                            Export Batch 1 shadow evidence pack
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleExportBatch2PreflipBaseline()}
                            className="ml-1.5 rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-200 hover:bg-emerald-500/20"
                          >
                            Export Batch 2 pre-flip baseline
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleExportBatch2ScheduleStrictProof()}
                            className="ml-1.5 rounded border border-violet-500/40 bg-violet-500/10 px-1.5 py-0.5 text-[10px] text-violet-200 hover:bg-violet-500/20"
                          >
                            Export Batch 2 schedule strict proof
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleExportBatch3PreflipBaseline()}
                            className="ml-1.5 rounded border border-fuchsia-500/40 bg-fuchsia-500/10 px-1.5 py-0.5 text-[10px] text-fuchsia-200 hover:bg-fuchsia-500/20"
                          >
                            Export Batch 3 pre-flip baseline
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleExportBatch3GoalStrictProof()}
                            className="ml-1.5 rounded border border-emerald-400/40 bg-emerald-400/10 px-1.5 py-0.5 text-[10px] text-emerald-100 hover:bg-emerald-400/20"
                          >
                            Export Batch 3 goal strict proof
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleExportBatch3ProjectStrictProof()}
                            className="ml-1.5 rounded border border-sky-400/40 bg-sky-400/10 px-1.5 py-0.5 text-[10px] text-sky-100 hover:bg-sky-400/20"
                          >
                            Export Batch 3 project strict proof
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleExportBatch4PreflipBaseline()}
                            className="ml-1.5 rounded border border-teal-400/40 bg-teal-400/10 px-1.5 py-0.5 text-[10px] text-teal-100 hover:bg-teal-400/20"
                          >
                            Export Batch 4 pre-flip baseline
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleExportBatch4AiStrictProof()}
                            className="ml-1.5 rounded border border-cyan-400/40 bg-cyan-400/10 px-1.5 py-0.5 text-[10px] text-cyan-100 hover:bg-cyan-400/20"
                          >
                            Export Batch 4 AI strict proof
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleExportBatch4ResonanceStrictProof()}
                            className="ml-1.5 rounded border border-violet-400/40 bg-violet-400/10 px-1.5 py-0.5 text-[10px] text-violet-100 hover:bg-violet-400/20"
                          >
                            Export Batch 4 resonance strict proof
                          </button>
                          <button
                            type="button"
                            onClick={handleGenerateBatch5MigrationDryRunPlan}
                            className="ml-1.5 rounded border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-100 hover:bg-amber-400/20"
                          >
                            Generate Batch 5 migration dry-run plan
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleExportBatch5MigrationDryRunPlan()}
                            className="ml-1.5 rounded border border-orange-400/40 bg-orange-400/10 px-1.5 py-0.5 text-[10px] text-orange-100 hover:bg-orange-400/20"
                          >
                            Export Batch 5 migration dry-run plan
                          </button>
                          <button
                            type="button"
                            onClick={handleApplyBatch5MigrationSlice}
                            className="ml-1.5 rounded border border-red-400/40 bg-red-400/10 px-1.5 py-0.5 text-[10px] text-red-100 hover:bg-red-400/20"
                          >
                            Apply Batch 5 migration slice (idempotent)
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleExportBatch5ApplyDriftEvidence()}
                            className="ml-1.5 rounded border border-pink-400/40 bg-pink-400/10 px-1.5 py-0.5 text-[10px] text-pink-100 hover:bg-pink-400/20"
                          >
                            Export Batch 5 apply drift evidence
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleExportBatch5RolloutGateProof()}
                            className="ml-1.5 rounded border border-lime-400/40 bg-lime-400/10 px-1.5 py-0.5 text-[10px] text-lime-100 hover:bg-lime-400/20"
                          >
                            Export Batch 5 rollout gate proof
                          </button>
                        </div>
                      </div>
                    ) : null}
                    <div className="mt-1.5 rounded border border-gray-700 bg-[#1b212c] p-2">
                      <div className="mb-1 flex items-center justify-between text-[11px]">
                        <span className="text-gray-300">Batch 1 readiness verdict</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            batch1Readiness.verdict === 'go'
                              ? 'border-emerald-500/40 text-emerald-200'
                              : 'border-rose-500/40 text-rose-200'
                          }`}
                        >
                          {batch1Readiness.verdict === 'go' ? 'GO' : 'NO_GO'}
                        </Badge>
                      </div>
                      <p
                        className={`text-[10px] ${
                          batch1Readiness.verdict === 'go' ? 'text-emerald-300' : 'text-rose-300'
                        }`}
                      >
                        {batch1Readiness.summary}
                      </p>
                      <div className="mt-1.5 space-y-1">
                        {batch1Readiness.checks.map((check) => (
                          <p
                            key={check.id}
                            className={`text-[10px] ${
                              check.pass ? 'text-emerald-300' : 'text-amber-300'
                            }`}
                          >
                            [{check.pass ? 'PASS' : 'FAIL'}] {check.label} ({check.detail})
                          </p>
                        ))}
                      </div>
                      <div className="mt-2 rounded border border-gray-700 bg-[#151a22] p-1.5">
                        <div className="mb-1 flex items-center justify-between">
                          <p className="text-[10px] text-gray-300">Readiness trend (last {batch1ReadinessHistory.length})</p>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => void handleFreezeBatch1ReadinessSnapshot()}
                              className="rounded border border-emerald-500/40 bg-emerald-500/10 px-1 py-0.5 text-[10px] text-emerald-200 hover:bg-emerald-500/20"
                            >
                              Freeze snapshot
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleExportBatch1ReadinessTrend()}
                              className="rounded border border-indigo-500/40 bg-indigo-500/10 px-1 py-0.5 text-[10px] text-indigo-200 hover:bg-indigo-500/20"
                            >
                              Export trend
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {batch1ReadinessHistory.slice(0, 6).map((entry) => {
                            const failedCount = entry.checks.filter((check) => !check.pass).length;
                            return (
                              <p key={`${entry.workspaceId}-${entry.capturedAt}`} className="text-[10px] text-gray-400">
                                {new Date(entry.capturedAt).toLocaleTimeString()} - {entry.verdict.toUpperCase()} - failed checks {failedCount}
                              </p>
                            );
                          })}
                          {batch1ReadinessHistory.length === 0 ? (
                            <p className="text-[10px] text-gray-500">No readiness snapshots yet.</p>
                          ) : null}
                        </div>
                        <div className="mt-2 border-t border-gray-700/60 pt-1.5">
                          <p className="text-[10px] text-gray-300">
                            Approved signoff checkpoint for exports
                          </p>
                          <div className="mt-1">
                            <Select
                              value={selectedApprovedCheckpointId}
                              onValueChange={(value) => setSelectedApprovedCheckpointId(value)}
                              disabled={approvedBatch1Checkpoints.length === 0}
                            >
                              <SelectTrigger className="h-7 border-gray-700 bg-[#0f141d] text-[10px] text-gray-200">
                                <SelectValue
                                  placeholder={
                                    approvedBatch1Checkpoints.length === 0
                                      ? 'No approved checkpoints'
                                      : 'Select approved checkpoint'
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent className="border-gray-700 bg-[#111827] text-gray-100">
                                {approvedBatch1Checkpoints.map((checkpoint) => (
                                  <SelectItem
                                    key={checkpoint.checkpointId}
                                    value={checkpoint.checkpointId}
                                    className="text-[10px]"
                                  >
                                    {checkpoint.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${
                                authorityRoutingSnapshot.scheduleBackendEnabled
                                  ? 'border-emerald-500/40 text-emerald-200'
                                  : 'border-gray-600 text-gray-300'
                              }`}
                            >
                              Schedule backend {authorityRoutingSnapshot.scheduleBackendEnabled ? 'ON' : 'OFF'}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${
                                authorityRoutingSnapshot.strictScheduleEnabled
                                  ? 'border-emerald-500/40 text-emerald-200'
                                  : 'border-gray-600 text-gray-300'
                              }`}
                            >
                              Schedule strict {authorityRoutingSnapshot.strictScheduleEnabled ? 'ON' : 'OFF'}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${
                                authorityRoutingSnapshot.strictTaskEnabled
                                  ? 'border-amber-500/40 text-amber-200'
                                  : 'border-gray-600 text-gray-300'
                              }`}
                            >
                              Task strict {authorityRoutingSnapshot.strictTaskEnabled ? 'ON' : 'OFF'}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${
                                authorityRoutingSnapshot.goalBackendEnabled
                                  ? 'border-emerald-500/40 text-emerald-200'
                                  : 'border-gray-600 text-gray-300'
                              }`}
                            >
                              Goal backend {authorityRoutingSnapshot.goalBackendEnabled ? 'ON' : 'OFF'}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${
                                authorityRoutingSnapshot.strictGoalEnabled
                                  ? 'border-emerald-500/40 text-emerald-200'
                                  : 'border-gray-600 text-gray-300'
                              }`}
                            >
                              Goal strict {authorityRoutingSnapshot.strictGoalEnabled ? 'ON' : 'OFF'}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${
                                authorityRoutingSnapshot.projectBackendEnabled
                                  ? 'border-sky-500/40 text-sky-200'
                                  : 'border-gray-600 text-gray-300'
                              }`}
                            >
                              Project backend {authorityRoutingSnapshot.projectBackendEnabled ? 'ON' : 'OFF'}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${
                                authorityRoutingSnapshot.strictProjectEnabled
                                  ? 'border-sky-500/40 text-sky-200'
                                  : 'border-gray-600 text-gray-300'
                              }`}
                            >
                              Project strict {authorityRoutingSnapshot.strictProjectEnabled ? 'ON' : 'OFF'}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${
                                readAuthorityRoutingSnapshot.aiReadBackendEnabled
                                  ? 'border-cyan-500/40 text-cyan-200'
                                  : 'border-gray-600 text-gray-300'
                              }`}
                            >
                              AI read backend {readAuthorityRoutingSnapshot.aiReadBackendEnabled ? 'ON' : 'OFF'}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${
                                readAuthorityRoutingSnapshot.aiReadStrictEnabled
                                  ? 'border-cyan-500/40 text-cyan-200'
                                  : 'border-gray-600 text-gray-300'
                              }`}
                            >
                              AI read strict {readAuthorityRoutingSnapshot.aiReadStrictEnabled ? 'ON' : 'OFF'}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${
                                readAuthorityRoutingSnapshot.resonanceReadBackendEnabled
                                  ? 'border-violet-500/40 text-violet-200'
                                  : 'border-gray-600 text-gray-300'
                              }`}
                            >
                              Resonance read backend{' '}
                              {readAuthorityRoutingSnapshot.resonanceReadBackendEnabled ? 'ON' : 'OFF'}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${
                                readAuthorityRoutingSnapshot.resonanceReadStrictEnabled
                                  ? 'border-violet-500/40 text-violet-200'
                                  : 'border-gray-600 text-gray-300'
                              }`}
                            >
                              Resonance read strict{' '}
                              {readAuthorityRoutingSnapshot.resonanceReadStrictEnabled ? 'ON' : 'OFF'}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="border-orange-500/40 text-[9px] text-orange-200"
                            >
                              Batch 5 plans {batch5MigrationPlans.length}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="border-red-500/40 text-[9px] text-red-200"
                            >
                              Batch 5 apply runs {batch5MigrationApplyRuns.length}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="border-pink-500/40 text-[9px] text-pink-200"
                            >
                              Rollback checkpoints {batch5RollbackCheckpoints.length}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${
                                batch5RolloutGate.verdict === 'go'
                                  ? 'border-emerald-500/40 text-emerald-200'
                                  : 'border-rose-500/40 text-rose-200'
                              }`}
                            >
                              Batch 5 rollout gate {batch5RolloutGate.verdict === 'go' ? 'GO' : 'NO_GO'}
                            </Badge>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            <button
                              type="button"
                              onClick={handleApplyScheduleFirstStrictPreset}
                              className="rounded border border-emerald-500/40 bg-emerald-500/10 px-1 py-0.5 text-[9px] text-emerald-200 hover:bg-emerald-500/20"
                            >
                              Apply schedule-first strict preset
                            </button>
                            <button
                              type="button"
                              onClick={handleApplyGoalFirstStrictPreset}
                              className="rounded border border-emerald-500/40 bg-emerald-500/10 px-1 py-0.5 text-[9px] text-emerald-200 hover:bg-emerald-500/20"
                            >
                              Apply goal-first strict preset
                            </button>
                            <button
                              type="button"
                              onClick={handleApplyProjectStrictPreset}
                              className="rounded border border-sky-500/40 bg-sky-500/10 px-1 py-0.5 text-[9px] text-sky-200 hover:bg-sky-500/20"
                            >
                              Apply project strict preset
                            </button>
                            <button
                              type="button"
                              onClick={handleApplyAiReadFirstStrictPreset}
                              className="rounded border border-cyan-500/40 bg-cyan-500/10 px-1 py-0.5 text-[9px] text-cyan-200 hover:bg-cyan-500/20"
                            >
                              Apply AI read-first strict preset
                            </button>
                            <button
                              type="button"
                              onClick={handleApplyResonanceReadStrictPreset}
                              className="rounded border border-violet-500/40 bg-violet-500/10 px-1 py-0.5 text-[9px] text-violet-200 hover:bg-violet-500/20"
                            >
                              Apply resonance read strict preset
                            </button>
                            <button
                              type="button"
                              onClick={handleGenerateBatch5MigrationDryRunPlan}
                              className="rounded border border-orange-500/40 bg-orange-500/10 px-1 py-0.5 text-[9px] text-orange-200 hover:bg-orange-500/20"
                            >
                              Generate Batch 5 dry-run plan
                            </button>
                            <button
                              type="button"
                              onClick={handleApplyBatch5MigrationSlice}
                              className="rounded border border-red-500/40 bg-red-500/10 px-1 py-0.5 text-[9px] text-red-200 hover:bg-red-500/20"
                            >
                              Apply Batch 5 migration slice (idempotent)
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleExportBatch5ApplyDriftEvidence()}
                              className="rounded border border-pink-500/40 bg-pink-500/10 px-1 py-0.5 text-[9px] text-pink-200 hover:bg-pink-500/20"
                            >
                              Export Batch 5 apply drift evidence
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleExportBatch5RolloutGateProof()}
                              className="rounded border border-lime-500/40 bg-lime-500/10 px-1 py-0.5 text-[9px] text-lime-200 hover:bg-lime-500/20"
                            >
                              Export Batch 5 rollout gate proof
                            </button>
                            <button
                              type="button"
                              onClick={handleRollbackAuthorityPreset}
                              className="rounded border border-gray-600 bg-gray-800/40 px-1 py-0.5 text-[9px] text-gray-200 hover:bg-gray-800"
                            >
                              Rollback authority flags
                            </button>
                          </div>
                          <p className="text-[10px] text-gray-300">
                            Frozen checkpoints ({batch1ReadinessCheckpoints.length})
                          </p>
                          <div className="mt-1 space-y-1">
                            {batch1ReadinessCheckpoints.slice(0, 3).map((checkpoint) => (
                              <div key={checkpoint.checkpointId} className="rounded border border-gray-700/70 bg-[#10151d] px-1.5 py-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-[10px] text-gray-300">
                                    {checkpoint.label} - {checkpoint.readiness.verdict.toUpperCase()}
                                  </p>
                                  <div className="flex items-center gap-1">
                                    <Badge
                                      variant="outline"
                                      className={`text-[9px] ${
                                        checkpoint.status === 'approved'
                                          ? 'border-emerald-500/40 text-emerald-200'
                                          : 'border-amber-500/40 text-amber-200'
                                      }`}
                                    >
                                      {checkpoint.status === 'approved' ? 'APPROVED' : 'CANDIDATE'}
                                    </Badge>
                                    {checkpoint.status !== 'approved' ? (
                                      <button
                                        type="button"
                                        onClick={() => void handlePromoteCheckpointToSignoff(checkpoint.checkpointId)}
                                        className="rounded border border-emerald-500/40 bg-emerald-500/10 px-1 py-0.5 text-[9px] text-emerald-200 hover:bg-emerald-500/20"
                                      >
                                        Approve signoff
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                                <p className="mt-0.5 text-[9px] text-gray-500">
                                  {checkpoint.integrity.hash.slice(0, 10)}...
                                  {checkpoint.approvedBy ? ` - by ${checkpoint.approvedBy}` : ''}
                                  {checkpoint.approvedAt ? ` - ${new Date(checkpoint.approvedAt).toLocaleTimeString()}` : ''}
                                </p>
                                {checkpoint.approverNote ? (
                                  <p className="mt-0.5 text-[9px] text-gray-400">
                                    Note: {checkpoint.approverNote}
                                  </p>
                                ) : null}
                              </div>
                            ))}
                            {batch1ReadinessCheckpoints.length === 0 ? (
                              <p className="text-[10px] text-gray-500">No frozen checkpoints yet.</p>
                            ) : null}
                          </div>
                          <p className="mt-1 text-[10px] text-gray-300">
                            Batch 5 migration plans ({batch5MigrationPlans.length})
                          </p>
                          <div className="mt-1 space-y-1">
                            {batch5MigrationPlans.slice(0, 2).map((plan) => (
                              <div
                                key={plan.planId}
                                className="rounded border border-gray-700/70 bg-[#10151d] px-1.5 py-1"
                              >
                                <p className="text-[10px] text-gray-300">
                                  {plan.mode.toUpperCase()} - task {plan.windows.task.entityCount} / schedule{' '}
                                  {plan.windows.schedule.entityCount}
                                </p>
                                <p className="mt-0.5 text-[9px] text-gray-500">
                                  task window: {plan.windows.task.from || 'n/a'} {'->'} {plan.windows.task.to || 'n/a'}
                                </p>
                              </div>
                            ))}
                            {batch5MigrationPlans.length === 0 ? (
                              <p className="text-[10px] text-gray-500">No Batch 5 migration plans generated yet.</p>
                            ) : null}
                          </div>
                          <p className="mt-1 text-[10px] text-gray-300">
                            Batch 5 apply runs ({batch5MigrationApplyRuns.length})
                          </p>
                          <div className="mt-1 space-y-1">
                            {batch5MigrationApplyRuns.slice(0, 2).map((run) => (
                              <div
                                key={run.runId}
                                className="rounded border border-gray-700/70 bg-[#10151d] px-1.5 py-1"
                              >
                                <p className="text-[10px] text-gray-300">
                                  {run.status.toUpperCase()} - plan {run.planId.slice(-8)} - checkpoint{' '}
                                  {run.approvedCheckpointId.slice(-8)}
                                </p>
                                <p className="mt-0.5 text-[9px] text-gray-500">
                                  idempotency: {run.idempotencyKey.slice(0, 36)}
                                </p>
                              </div>
                            ))}
                            {batch5MigrationApplyRuns.length === 0 ? (
                              <p className="text-[10px] text-gray-500">No Batch 5 apply runs recorded yet.</p>
                            ) : null}
                          </div>
                          <p className="mt-1 text-[10px] text-gray-300">
                            Batch 5 rollback checkpoints ({batch5RollbackCheckpoints.length})
                          </p>
                          <div className="mt-1 space-y-1">
                            {batch5RollbackCheckpoints.slice(0, 2).map((checkpoint) => (
                              <div
                                key={checkpoint.checkpointId}
                                className="rounded border border-gray-700/70 bg-[#10151d] px-1.5 py-1"
                              >
                                <p className="text-[10px] text-gray-300">
                                  {checkpoint.checkpointId.slice(-8)} - task {checkpoint.beforeState.taskCount} /
                                  schedule {checkpoint.beforeState.scheduleCount}
                                </p>
                                <p className="mt-0.5 text-[9px] text-gray-500">
                                  signature: {checkpoint.beforeState.stateSignature.slice(0, 42)}
                                </p>
                              </div>
                            ))}
                            {batch5RollbackCheckpoints.length === 0 ? (
                              <p className="text-[10px] text-gray-500">
                                No Batch 5 rollback checkpoints captured yet.
                              </p>
                            ) : null}
                          </div>
                          <p className="mt-1 text-[10px] text-gray-300">
                            Batch 5 rollout gate: {batch5RolloutGate.verdict.toUpperCase()}
                          </p>
                          <div className="mt-1 rounded border border-gray-700/70 bg-[#10151d] px-1.5 py-1">
                            <p
                              className={`text-[10px] ${
                                batch5RolloutGate.verdict === 'go' ? 'text-emerald-300' : 'text-rose-300'
                              }`}
                            >
                              {batch5RolloutGate.summary}
                            </p>
                            <div className="mt-1 space-y-0.5">
                              {batch5RolloutGate.checks.map((check) => (
                                <p
                                  key={check.id}
                                  className={`text-[9px] ${check.pass ? 'text-emerald-300' : 'text-amber-300'}`}
                                >
                                  [{check.pass ? 'PASS' : 'FAIL'}] {check.label} ({check.detail})
                                </p>
                              ))}
                            </div>
                            <p className="mt-1 text-[9px] text-gray-500">
                              replay assertion: {batch5ReplayAssertion?.detail || 'not_observed_yet'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRequestSurfaceRefresh}
                        className="rounded border border-indigo-500/40 bg-indigo-500/10 px-1.5 py-0.5 text-[10px] text-indigo-200 hover:bg-indigo-500/20"
                      >
                        Request surface refresh
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleExportTaskSurfaceParity()}
                        className="rounded border border-cyan-500/40 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-200 hover:bg-cyan-500/20"
                      >
                        Export surface parity
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSurfaceParityActions((prev) => !prev)}
                        className="rounded border border-gray-600 bg-gray-800/40 px-1.5 py-0.5 text-[10px] text-gray-200 hover:bg-gray-800"
                      >
                        {showSurfaceParityActions ? 'Hide actions' : 'Show actions'}
                      </button>
                    </div>
                    {showSurfaceParityActions && taskSurfaceParityActions.length > 0 ? (
                      <div className="mt-1.5 space-y-1">
                        {taskSurfaceParityActions.slice(0, 6).map((action) => (
                          <div
                            key={action.id}
                            className="flex flex-wrap items-center justify-between gap-1 rounded border border-gray-700 bg-[#171b23] px-1.5 py-1"
                          >
                            <p className="text-[10px] text-gray-300">
                              [{action.priority}] {action.summary}
                            </p>
                            <div className="flex items-center gap-1">
                              {action.type === 'request_surface_refresh' ? (
                                <button
                                  type="button"
                                  onClick={handleRequestSurfaceRefresh}
                                  className="rounded border border-indigo-500/40 bg-indigo-500/10 px-1 py-0.5 text-[10px] text-indigo-200 hover:bg-indigo-500/20"
                                >
                                  Run
                                </button>
                              ) : null}
                              {action.type === 'copy_missing_ids' && action.surface ? (
                                <button
                                  type="button"
                                  onClick={() => void copySurfaceGapList(action.surface)}
                                  className="rounded border border-cyan-500/40 bg-cyan-500/10 px-1 py-0.5 text-[10px] text-cyan-200 hover:bg-cyan-500/20"
                                >
                                  Copy IDs
                                </button>
                              ) : null}
                              {action.type === 'export_missing_ids' ? (
                                <button
                                  type="button"
                                  onClick={() => void handleExportTaskSurfaceParity()}
                                  className="rounded border border-emerald-500/40 bg-emerald-500/10 px-1 py-0.5 text-[10px] text-emerald-200 hover:bg-emerald-500/20"
                                >
                                  Export
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-2 rounded border border-gray-700 bg-[#171b23] p-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] text-gray-300">
                          Drift cycles: {surfaceDriftState.consecutiveDriftCycles}
                        </p>
                        <button
                          type="button"
                          onClick={() => void handleExportSurfaceIncidents()}
                          className="rounded border border-gray-600 px-1 py-0.5 text-[10px] text-gray-300 hover:bg-gray-800"
                        >
                          Export incidents
                        </button>
                      </div>
                      <div className="mt-1 space-y-1">
                        {recentSurfaceIncidents.slice(0, 3).map((incident) => (
                          <div
                            key={incident.incidentId}
                            className="rounded border border-gray-700 bg-[#131720] px-1.5 py-1"
                          >
                            {(() => {
                              const runbookComplete = isSurfaceParityIncidentRunbookComplete(incident as any);
                              const runbookProgress = Array.isArray((incident as any).runbookProgress)
                                ? ((incident as any).runbookProgress as boolean[])
                                : [];
                              return (
                                <>
                            <p className="text-[10px] text-gray-300">
                              [{incident.severity}] {incident.summary}
                            </p>
                            <div className="mt-1 rounded border border-gray-700/80 bg-[#0f141d] p-1">
                              <p className="text-[10px] text-gray-400">Runbook checklist</p>
                              <div className="mt-1 space-y-1">
                                {(incident.runbook || []).map((step, stepIndex) => (
                                  <label
                                    key={`${incident.incidentId}-step-${stepIndex}`}
                                    className="flex cursor-pointer items-start gap-1.5 text-[10px] text-gray-300"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={Boolean(runbookProgress[stepIndex])}
                                      onChange={(event) =>
                                        handleToggleSurfaceRunbookStep(
                                          incident.incidentId,
                                          stepIndex,
                                          event.target.checked,
                                        )
                                      }
                                      className="mt-[2px] h-3 w-3 rounded border-gray-500 bg-transparent"
                                    />
                                    <span>{step}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div className="mt-1 flex items-center gap-1">
                              <Badge
                                variant="outline"
                                className="border-gray-600 text-[10px] text-gray-300"
                              >
                                {incident.status}
                              </Badge>
                              {incident.incidentType ? (
                                <Badge
                                  variant="outline"
                                  className="border-rose-500/40 text-[10px] text-rose-200"
                                >
                                  {incident.incidentType}
                                </Badge>
                              ) : null}
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  runbookComplete
                                    ? 'border-emerald-500/40 text-emerald-300'
                                    : 'border-amber-500/40 text-amber-300'
                                }`}
                              >
                                {runbookComplete ? 'Runbook complete' : 'Runbook pending'}
                              </Badge>
                              {incident.policyTier ? (
                                <Badge
                                  variant="outline"
                                  className="border-indigo-500/40 text-[10px] text-indigo-200"
                                >
                                  SLA {incident.policyTier.toUpperCase()}
                                </Badge>
                              ) : null}
                              {incident.routingTarget ? (
                                <Badge
                                  variant="outline"
                                  className="border-cyan-500/40 text-[10px] text-cyan-200"
                                >
                                  Route: {incident.routingTarget}
                                </Badge>
                              ) : null}
                              {incident.ackDueAt ? (
                                <Badge
                                  variant="outline"
                                  className="border-gray-600 text-[10px] text-gray-300"
                                >
                                  Ack {dueInLabel(incident.ackDueAt)}
                                </Badge>
                              ) : null}
                              {incident.resolveDueAt ? (
                                <Badge
                                  variant="outline"
                                  className="border-gray-600 text-[10px] text-gray-300"
                                >
                                  Resolve {dueInLabel(incident.resolveDueAt)}
                                </Badge>
                              ) : null}
                              {incident.status === 'open' ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateSurfaceIncidentStatus(
                                      incident.incidentId,
                                      'acknowledged',
                                    )
                                  }
                                  className="rounded border border-amber-500/40 bg-amber-500/10 px-1 py-0.5 text-[10px] text-amber-200 hover:bg-amber-500/20"
                                >
                                  Acknowledge
                                </button>
                              ) : null}
                              {incident.status !== 'resolved' ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateSurfaceIncidentStatus(incident.incidentId, 'resolved')
                                  }
                                  disabled={!runbookComplete}
                                  className="rounded border border-emerald-500/40 bg-emerald-500/10 px-1 py-0.5 text-[10px] text-emerald-200 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Resolve
                                </button>
                              ) : null}
                            </div>
                                </>
                              );
                            })()}
                          </div>
                        ))}
                        {recentSurfaceIncidents.length === 0 ? (
                          <p className="text-[10px] text-gray-500">No surface drift incidents recorded.</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-700 bg-[#1e2430] p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">Ready now queue</p>
                  <Badge variant="outline" className="border-cyan-500/40 text-cyan-200">
                    {readyNowTasks.length}
                  </Badge>
                </div>
                <div className="space-y-1.5">
                  {readyNowTasks.map((task) => (
                    <div key={`ready-${String(task.id)}`} className="rounded border border-gray-700 bg-[#171b23] px-2 py-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-gray-100">{task.title}</p>
                        <button
                          type="button"
                          onClick={() => focusTaskInWorkstream(String(task.id))}
                          className="rounded border border-cyan-500/40 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-200 hover:bg-cyan-500/20"
                        >
                          Open node
                        </button>
                      </div>
                      <p className="mt-0.5 text-[10px] text-gray-500">Owner: {getPrimaryAssigneeLabel(task)}</p>
                    </div>
                  ))}
                  {readyNowTasks.length === 0 ? <p className="text-xs text-gray-400">No tasks are immediately ready.</p> : null}
                </div>
              </div>

              <div className="rounded-lg border border-gray-700 bg-[#1e2430] p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">Blockers requiring action</p>
                  <Badge variant="outline" className="border-amber-500/40 text-amber-300">
                    {blockedTasks.length}
                  </Badge>
                </div>
                <div className="space-y-1.5">
                  {blockedTasks.map((task) => (
                    <div key={`blocked-${String(task.id)}`} className="rounded border border-gray-700 bg-[#171b23] px-2 py-1.5">
                      <p className="truncate text-xs text-gray-100">{task.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {getIncompleteBlockingTasks(task, tasksById).slice(0, 2).map((dep) => (
                          <Badge
                            key={`blocked-chip-${String(task.id)}-${String(dep.id)}`}
                            variant="outline"
                            className="border-amber-500/40 text-[10px] text-amber-300"
                          >
                            {String(dep.title || dep.id)}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleResolveBlockers(task)}
                          className="rounded border border-cyan-500/40 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-200 hover:bg-cyan-500/20"
                        >
                          Resolve blockers
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveAllBlockers(task)}
                          className="rounded border border-indigo-500/40 bg-indigo-500/10 px-1.5 py-0.5 text-[10px] text-indigo-200 hover:bg-indigo-500/20"
                        >
                          Resolve all
                        </button>
                      </div>
                    </div>
                  ))}
                  {blockedTasks.length === 0 ? <p className="text-xs text-gray-400">No blockers in this project.</p> : null}
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-gray-700 bg-[#1e2430] p-3 lg:col-span-2">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">Reconciliation history</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-indigo-500/40 text-indigo-200">
                      Snapshots {reconciliationSnapshots.length}
                    </Badge>
                    <Badge variant="outline" className="border-gray-600 text-gray-300">
                      {filteredReconciliationHistory.length}
                    </Badge>
                    <button
                      type="button"
                      onClick={handleExportReconciliationHistory}
                      className="rounded border border-cyan-500/40 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-200 hover:bg-cyan-500/20"
                    >
                      Export
                    </button>
                  </div>
                </div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Select
                    value={reconciliationModeFilter}
                    onValueChange={(value) => setReconciliationModeFilter(value as 'all' | 'apply' | 'dry_run')}
                  >
                    <SelectTrigger className="h-7 w-[120px] border-gray-700 bg-[#12151b] text-[10px] text-gray-200">
                      <SelectValue placeholder="Mode" />
                    </SelectTrigger>
                    <SelectContent className="border-gray-700 bg-[#12151b] text-gray-200">
                      <SelectItem value="all">Mode: all</SelectItem>
                      <SelectItem value="apply">Mode: apply</SelectItem>
                      <SelectItem value="dry_run">Mode: dry run</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={reconciliationOutcomeFilter}
                    onValueChange={(value) => setReconciliationOutcomeFilter(value as 'all' | 'simulated' | 'applied' | 'skipped' | 'failed')}
                  >
                    <SelectTrigger className="h-7 w-[150px] border-gray-700 bg-[#12151b] text-[10px] text-gray-200">
                      <SelectValue placeholder="Outcome" />
                    </SelectTrigger>
                    <SelectContent className="border-gray-700 bg-[#12151b] text-gray-200">
                      <SelectItem value="all">Outcome: all</SelectItem>
                      <SelectItem value="simulated">Outcome: simulated</SelectItem>
                      <SelectItem value="applied">Outcome: applied</SelectItem>
                      <SelectItem value="skipped">Outcome: skipped</SelectItem>
                      <SelectItem value="failed">Outcome: failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="max-h-[140px] space-y-1 overflow-auto pr-1">
                  {filteredReconciliationHistory.length > 0 ? (
                    filteredReconciliationHistory.slice().reverse().map((entry, idx) => (
                      <p key={`${entry.entryId}-${idx}`} className="text-[10px] text-gray-400">
                        [{entry.mode || 'apply'}:{entry.outcome || 'applied'}] {entry.eventType} :: {entry.entityKind}:{entry.entityId}
                      </p>
                    ))
                  ) : (
                    <p className="text-[10px] text-gray-500">No reconciliation history for current filters.</p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-gray-700 bg-[#1e2430] p-3">
                <p className="mb-2 text-sm font-medium text-white">Tasks in project</p>
                <div className="max-h-[360px] space-y-2 overflow-auto pr-1">
                  {projectTasks.map((task) => (
                    <div key={String(task.id)} className="rounded border border-gray-700 bg-[#171b23] p-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-gray-100">{task.title}</p>
                        <Badge variant="outline" className="border-gray-600 text-gray-300">
                          {classifyTaskStatus(task, tasksById)}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <Select
                          value={coerceTaskProjectId(task)}
                          onValueChange={(value) => {
                            void handleAssignTaskProject(String(task.id), value);
                          }}
                        >
                          <SelectTrigger className="h-8 border-gray-700 bg-[#12151b] text-xs text-gray-200">
                            <SelectValue placeholder="Assign project" />
                          </SelectTrigger>
                          <SelectContent className="border-gray-700 bg-[#12151b]">
                            {projects.map((project) => (
                              <SelectItem key={`${task.id}-${project.id}`} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                  {projectTasks.length === 0 ? <p className="text-xs text-gray-400">No tasks in this project yet.</p> : null}
                </div>
              </div>

              <div className="rounded-lg border border-gray-700 bg-[#1e2430] p-3">
                <p className="mb-2 text-sm font-medium text-white">Goals in project</p>
                <div className="max-h-[360px] space-y-2 overflow-auto pr-1">
                  {projectGoals.map((goal) => (
                    <div key={String(goal.id)} className="rounded border border-gray-700 bg-[#171b23] p-2">
                      <p className="text-sm text-gray-100">{goal.title}</p>
                      <div className="mt-2">
                        <Select
                          value={goalProjectMap[String(goal.id)] || 'project-general'}
                          onValueChange={(value) => handleAssignGoalProject(String(goal.id), value)}
                        >
                          <SelectTrigger className="h-8 border-gray-700 bg-[#12151b] text-xs text-gray-200">
                            <SelectValue placeholder="Assign project" />
                          </SelectTrigger>
                          <SelectContent className="border-gray-700 bg-[#12151b]">
                            {projects.map((project) => (
                              <SelectItem key={`${goal.id}-${project.id}`} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                  {projectGoals.length === 0 ? <p className="text-xs text-gray-400">No goals in this project yet.</p> : null}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-700 bg-[#1e2430] p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-white">Implementation Runs</p>
                <Badge variant="outline" className="border-cyan-500/40 text-cyan-300">
                  {filteredProjectRuns.length}/{projectRuns.length} run(s)
                </Badge>
              </div>
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                {(['all', 'queued', 'planning', 'waiting_approval', 'executing', 'completed', 'failed'] as RunFilter[]).map((status) => (
                  <button
                    key={`run-filter-${status}`}
                    type="button"
                    onClick={() => setRunStatusFilter(status)}
                    className={`rounded border px-2 py-0.5 text-[10px] ${
                      runStatusFilter === status
                        ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-200'
                        : 'border-gray-700 bg-[#171b23] text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {status} ({runStatusCounts[status]})
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                {filteredProjectRuns.slice(0, 12).map((run) => (
                  <div key={run.runId} className="rounded border border-gray-700 bg-[#171b23] px-2 py-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-gray-100">{run.title || 'Implementation run'}</p>
                      <Badge variant="outline" className={runStatusClasses(run.status)}>
                        {run.status}
                      </Badge>
                    </div>
                    <p className="truncate text-[11px] text-gray-400">{run.objective || run.lastEvent || run.runId}</p>
                    <div className="mt-0.5 flex items-center justify-between text-[10px] text-gray-500">
                      <span>ops: {run.metrics?.operationCount || 0}</span>
                      <span>{new Date(run.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {run.taskId && tasksById.has(String(run.taskId)) ? (
                      <div className="mt-1 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => focusTaskInStatusBoard(String(run.taskId))}
                          className="rounded border border-cyan-500/40 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-200 hover:bg-cyan-500/20"
                        >
                          Open task (status)
                        </button>
                        <button
                          type="button"
                          onClick={() => focusTaskInWorkstream(String(run.taskId))}
                          className="rounded border border-indigo-500/40 bg-indigo-500/10 px-1.5 py-0.5 text-[10px] text-indigo-200 hover:bg-indigo-500/20"
                        >
                          Open node (workstream)
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
                {filteredProjectRuns.length === 0 ? (
                  <p className="text-xs text-gray-400">No implementation runs recorded for this project yet.</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-lg border border-gray-700 bg-[#1e2430] p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-white">Project Architecture Timeline</p>
                <Badge variant="outline" className="border-indigo-500/40 text-indigo-300">
                  {projectExecutionTrail.length} event(s)
                </Badge>
              </div>
              <div className="space-y-1.5">
                {projectExecutionTrail.slice(0, 24).map((event) => (
                  <div key={event.id} className="rounded border border-gray-700 bg-[#171b23] px-2 py-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-gray-100">{event.title}</p>
                      <p className="text-[10px] text-gray-500">
                        {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {event.detail ? <p className="text-[11px] text-gray-400">{event.detail}</p> : null}
                  </div>
                ))}
                {projectExecutionTrail.length === 0 ? (
                  <p className="text-xs text-gray-400">No execution events yet for this project.</p>
                ) : null}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="status" className="mt-4">
            {blockerRun ? (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-2.5">
                <p className="text-xs text-indigo-100">
                  Resolving blockers for task `{blockerRun.sourceTaskId}`:
                  {' '}
                  {blockerRun.index + 1}/{blockerRun.blockerIds.length}
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveBlockerRun(-1)}
                    disabled={blockerRun.index <= 0}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveBlockerRun(1)}
                    disabled={blockerRun.index >= blockerRun.blockerIds.length - 1}
                  >
                    Next
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setBlockerRun(null);
                      setHighlightTaskId(null);
                    }}
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : null}
            <div className="grid gap-3 lg:grid-cols-4">
              {(['pending', 'todo', 'doing', 'done'] as const).map((lane) => (
                <div
                  key={lane}
                  className="rounded-lg border border-gray-700 bg-[#1f2430] p-3"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleDropOnStatusLane(lane)}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-gray-400">{lane}</p>
                    <Badge variant="outline" className="border-gray-600 text-gray-300">
                      {groupedStatus[lane].length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {groupedStatus[lane].map((task) => (
                      <div
                        key={String(task.id)}
                        id={`project-status-task-${String(task.id)}`}
                        className="cursor-grab rounded border border-gray-700 bg-[#171b23] p-2 text-xs text-gray-200"
                        data-highlighted={highlightTaskId === String(task.id)}
                        style={
                          highlightTaskId === String(task.id)
                            ? { boxShadow: '0 0 0 1px rgba(56, 189, 248, 0.75), 0 0 18px rgba(56, 189, 248, 0.3)' }
                            : undefined
                        }
                        draggable
                        onDragStart={handleStartDrag({
                          kind: 'task',
                          taskId: String(task.id),
                          title: String(task.title || 'Task'),
                        })}
                      >
                        <p>{task.title}</p>
                        {lane === 'pending' ? (
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            {getIncompleteBlockingTasks(task, tasksById).slice(0, 3).map((dep) => (
                              <Badge
                                key={`${task.id}-lane-pending-${String(dep.id)}`}
                                variant="outline"
                                className="border-amber-500/40 text-[10px] text-amber-300"
                              >
                                blocked by {String(dep.title || dep.id)}
                              </Badge>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleResolveBlockers(task)}
                              className="rounded border border-cyan-500/40 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-200 hover:bg-cyan-500/20"
                            >
                              Resolve blockers
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResolveAllBlockers(task)}
                              className="rounded border border-indigo-500/40 bg-indigo-500/10 px-1.5 py-0.5 text-[10px] text-indigo-200 hover:bg-indigo-500/20"
                            >
                              Resolve all
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                    {groupedStatus[lane].length === 0 ? <p className="text-[11px] text-gray-500">No tasks</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="command" className="mt-4 space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-[#1e2430] px-3 py-2">
              <p className="text-xs text-gray-300">
                Command Center unifies workstream execution, status flow, and schedule planning for this project.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  window.location.href = '/resonance-engine';
                }}
              >
                Open Resonance Planner
              </Button>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="min-h-[360px] rounded-lg border border-gray-700 bg-[#1e2430] p-3">
                <p className="mb-2 text-sm font-medium text-white">Project Schedule</p>
                <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
                  {scheduledProjectTasks.map((task) => {
                    const when = task.scheduledTime || task.dueDate;
                    return (
                      <div key={`schedule-${String(task.id)}`} className="rounded border border-gray-700 bg-[#171b23] p-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs text-gray-100">{task.title}</p>
                          <Badge variant="outline" className="border-gray-600 text-gray-300">
                            {classifyTaskStatus(task, tasksById)}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-gray-400">
                          <span>{when ? new Date(when).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No date'}</span>
                          <span>{getPrimaryAssigneeLabel(task)}</span>
                        </div>
                      </div>
                    );
                  })}
                  {scheduledProjectTasks.length === 0 ? (
                    <p className="text-xs text-gray-400">No scheduled tasks yet for this project.</p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-lg border border-gray-700 bg-[#1e2430] p-3">
                <p className="mb-2 text-sm font-medium text-white">Workstream Vertical View</p>
                <div className="space-y-1.5">
                  {rootTasks.slice(0, 10).map((task) => {
                    const childCount = (childrenByParent.get(String(task.id)) || []).length;
                    return (
                      <div key={`vertical-${String(task.id)}`} className="rounded border border-gray-700 bg-[#171b23] px-2 py-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs text-gray-100">{task.title}</p>
                          <span className="text-[10px] text-gray-500">{childCount} child</span>
                        </div>
                        <p className="text-[10px] text-gray-500">Owner: {getPrimaryAssigneeLabel(task)}</p>
                      </div>
                    );
                  })}
                  {rootTasks.length === 0 ? <p className="text-xs text-gray-400">No root tasks yet.</p> : null}
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              {(['pending', 'todo', 'doing', 'done'] as const).map((lane) => (
                <div key={`command-lane-${lane}`} className="rounded-lg border border-gray-700 bg-[#1f2430] p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">{lane}</p>
                    <Badge variant="outline" className="border-gray-600 text-gray-300">{groupedStatus[lane].length}</Badge>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    {lane === 'pending' ? 'Blocked' : lane === 'todo' ? 'Ready queue' : lane === 'doing' ? 'In execution' : 'Completed'}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      ) : null}

      {flowCanvasEnabled ? (
        <div className="rounded-2xl border border-gray-700 bg-[#0b0f17] p-2">
          <p className="sr-only">Workstream Flow</p>
          <div className="mb-2 flex items-center justify-end gap-2 px-2 pt-1">
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="min-w-[220px] border-gray-700 bg-[#0f141f] text-gray-100">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent className="border-gray-700 bg-[#0f141f] text-gray-100">
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <WorkstreamFlowCanvas
            tasks={projectTasks}
            projectId={selectedProjectId}
            projectName={projects.find((project) => project.id === selectedProjectId)?.name || 'Untitled Workflow'}
            createTask={createTask}
            updateTask={updateTask}
            deleteTask={deleteTask}
            onSelectTaskId={setFlowInspectorTaskId}
            startBlank={workstreamBlankStart}
            onUpdateProjectName={handleRenameProject}
            onSaveProject={handleManualSaveProject}
            onToggleBlankStart={handleToggleBlankStart}
          />
        </div>
      ) : (
        <div
          className="rounded-xl border border-dashed border-indigo-500/40 bg-indigo-500/5 p-4"
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDropOnRoot}
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-200">Workstream</p>
              <p className="text-xs text-gray-400">
                Drag milestones/steps out of tasks to convert into new child tasks. Drag tasks onto tasks to re-parent.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={compressCompletedBranches}
                className="rounded border border-indigo-500/40 bg-indigo-500/10 px-2 py-1 text-[11px] text-indigo-200 hover:bg-indigo-500/20"
              >
                Compress completed branches
              </button>
              <button
                type="button"
                onClick={() => setShowCompressedBranches((prev) => !prev)}
                className="rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-200 hover:bg-cyan-500/20"
              >
                {showCompressedBranches ? 'Hide compressed' : 'Show compressed'}
              </button>
              <Badge variant="outline" className="border-indigo-500/40 text-indigo-300">
                Drop zone: root level
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            {rootTasks.map((task) => (
              <div key={String(task.id)}>
                <div
                  className="mb-2 cursor-grab rounded-md border border-gray-700 bg-[#1f2330] px-2 py-1 text-xs text-cyan-200"
                  draggable
                  onDragStart={handleStartDrag({
                    kind: 'task',
                    taskId: String(task.id),
                    title: String(task.title || 'Task'),
                  })}
                >
                  Drag task: {task.title}
                </div>
                {renderTaskTree(task)}
              </div>
            ))}
            {rootTasks.length === 0 ? <p className="text-xs text-gray-500">No tasks in this project yet.</p> : null}
          </div>
        </div>
      )}
    </div>
  );
}
