import {
  readProjectionEnvelope,
  writeProjectionEnvelope,
} from './projection-cache-envelope';

export type SurfaceParityIncidentSeverity = 'watch' | 'high' | 'critical';
export type SurfaceParityIncidentStatus = 'open' | 'acknowledged' | 'resolved';
export type SurfaceParityIncidentSlaTier = 'p1' | 'p2' | 'p3';
export type SurfaceParityIncidentRoutingTarget = 'oncall-engineering' | 'project-operator' | 'owner-review';

export interface SurfaceParityIncidentPolicy {
  slaTier: SurfaceParityIncidentSlaTier;
  routingTarget: SurfaceParityIncidentRoutingTarget;
  ackWithinMinutes: number;
  resolveWithinMinutes: number;
}

export interface SurfaceParityIncidentEntry {
  incidentId: string;
  workspaceId: string;
  incidentType?: 'parity_drift' | 'stale_snapshot_alarm';
  parityScore: number;
  missingTotal: number;
  consecutiveDriftCycles: number;
  severity: SurfaceParityIncidentSeverity;
  status: SurfaceParityIncidentStatus;
  summary: string;
  runbook: string[];
  runbookProgress?: boolean[];
  policyTier?: SurfaceParityIncidentSlaTier;
  routingTarget?: SurfaceParityIncidentRoutingTarget;
  ackDueAt?: string;
  resolveDueAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SurfaceParityDriftState {
  workspaceId: string;
  consecutiveDriftCycles: number;
  lastEvaluatedAt: string | null;
  lastEscalatedAt: string | null;
}

export interface SurfaceSnapshotAlarmState {
  workspaceId: string;
  lastEvaluatedAt: string | null;
  lastEscalatedAt: string | null;
}

const INCIDENTS_KEY = 'syncscript:phase2a:surface-parity-incidents';
const DRIFT_STATE_KEY = 'syncscript:phase2a:surface-parity-drift-state';
const SNAPSHOT_ALARM_STATE_KEY = 'syncscript:phase2a:surface-snapshot-alarm-state';
const INCIDENT_LIMIT = 200;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function defaultDriftState(workspaceId: string): SurfaceParityDriftState {
  return {
    workspaceId,
    consecutiveDriftCycles: 0,
    lastEvaluatedAt: null,
    lastEscalatedAt: null,
  };
}

function defaultSnapshotAlarmState(workspaceId: string): SurfaceSnapshotAlarmState {
  return {
    workspaceId,
    lastEvaluatedAt: null,
    lastEscalatedAt: null,
  };
}

function readDriftStateMap(): Record<string, SurfaceParityDriftState> {
  if (!canUseStorage()) return {};
  try {
    const raw = window.localStorage.getItem(DRIFT_STATE_KEY);
    const envelope = readProjectionEnvelope<Record<string, SurfaceParityDriftState>>(
      raw,
      (value): value is Record<string, SurfaceParityDriftState> =>
        Boolean(value) && typeof value === 'object' && !Array.isArray(value),
      'surface-parity-drift-state',
    );
    if (!envelope) return {};
    return envelope.payload;
  } catch {
    return {};
  }
}

function writeDriftStateMap(state: Record<string, SurfaceParityDriftState>): void {
  if (!canUseStorage()) return;
  try {
    const envelope = writeProjectionEnvelope(state, {
      projectionVersion: 1,
      sourceEventCursor: `surface-drift:${Date.now()}`,
    });
    window.localStorage.setItem(DRIFT_STATE_KEY, JSON.stringify(envelope));
  } catch {
    // best effort only
  }
}

function readSnapshotAlarmStateMap(): Record<string, SurfaceSnapshotAlarmState> {
  if (!canUseStorage()) return {};
  try {
    const raw = window.localStorage.getItem(SNAPSHOT_ALARM_STATE_KEY);
    const envelope = readProjectionEnvelope<Record<string, SurfaceSnapshotAlarmState>>(
      raw,
      (value): value is Record<string, SurfaceSnapshotAlarmState> =>
        Boolean(value) && typeof value === 'object' && !Array.isArray(value),
      'surface-snapshot-alarm-state',
    );
    if (!envelope) return {};
    return envelope.payload;
  } catch {
    return {};
  }
}

function writeSnapshotAlarmStateMap(state: Record<string, SurfaceSnapshotAlarmState>): void {
  if (!canUseStorage()) return;
  try {
    const envelope = writeProjectionEnvelope(state, {
      projectionVersion: 1,
      sourceEventCursor: `surface-snapshot-alarm:${Date.now()}`,
    });
    window.localStorage.setItem(SNAPSHOT_ALARM_STATE_KEY, JSON.stringify(envelope));
  } catch {
    // best effort only
  }
}

export function listSurfaceParityIncidents(limit = 24): SurfaceParityIncidentEntry[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(INCIDENTS_KEY);
    const envelope = readProjectionEnvelope<SurfaceParityIncidentEntry[]>(
      raw,
      (value): value is SurfaceParityIncidentEntry[] => Array.isArray(value),
      'surface-parity-incidents',
    );
    if (!envelope) return [];
    const entries = envelope.payload;
    const normalized = entries.map((entry) => {
      const steps = Array.isArray(entry.runbook) ? entry.runbook : [];
      const progressSeed = Array.isArray(entry.runbookProgress) ? entry.runbookProgress : [];
      const runbookProgress = steps.map((_, index) => Boolean(progressSeed[index]));
      return { ...entry, runbook: steps, runbookProgress };
    });
    return normalized.slice(-Math.max(1, Math.min(limit, INCIDENT_LIMIT)));
  } catch {
    return [];
  }
}

export function appendSurfaceParityIncident(entry: SurfaceParityIncidentEntry): void {
  if (!canUseStorage()) return;
  try {
    const existing = listSurfaceParityIncidents(INCIDENT_LIMIT);
    const steps = Array.isArray(entry.runbook) ? entry.runbook : [];
    const progressSeed = Array.isArray(entry.runbookProgress) ? entry.runbookProgress : [];
    const normalized: SurfaceParityIncidentEntry = {
      ...entry,
      runbook: steps,
      runbookProgress: steps.map((_, index) => Boolean(progressSeed[index])),
    };
    existing.push(normalized);
    if (existing.length > INCIDENT_LIMIT) {
      existing.splice(0, existing.length - INCIDENT_LIMIT);
    }
    const envelope = writeProjectionEnvelope(existing, {
      projectionVersion: 1,
      sourceEventCursor: String(entry.incidentId || `surface-incident:${Date.now()}`),
    });
    window.localStorage.setItem(INCIDENTS_KEY, JSON.stringify(envelope));
  } catch {
    // best effort only
  }
}

export function updateSurfaceParityIncidentStatus(
  incidentId: string,
  status: SurfaceParityIncidentStatus,
): void {
  if (!canUseStorage()) return;
  try {
    const incidents = listSurfaceParityIncidents(INCIDENT_LIMIT);
    const next = incidents.map((entry) =>
      entry.incidentId === incidentId
        ? { ...entry, status, updatedAt: new Date().toISOString() }
        : entry,
    );
    const envelope = writeProjectionEnvelope(next, {
      projectionVersion: 1,
      sourceEventCursor: `${incidentId}:${status}`,
    });
    window.localStorage.setItem(INCIDENTS_KEY, JSON.stringify(envelope));
  } catch {
    // best effort only
  }
}

export function autoResolveSurfaceParityIncidents(workspaceId: string): number {
  if (!canUseStorage()) return 0;
  try {
    const incidents = listSurfaceParityIncidents(INCIDENT_LIMIT);
    let resolvedCount = 0;
    const next = incidents.map((entry) => {
      const matchesWorkspace =
        entry.workspaceId === workspaceId || entry.workspaceId === 'workspace-main';
      const isActive = entry.status === 'open' || entry.status === 'acknowledged';
      if (!matchesWorkspace || !isActive) return entry;
      resolvedCount += 1;
      const runbookProgress = Array.isArray(entry.runbook)
        ? entry.runbook.map(() => true)
        : [];
      return {
        ...entry,
        status: 'resolved' as const,
        runbookProgress,
        updatedAt: new Date().toISOString(),
      };
    });
    if (resolvedCount === 0) return 0;
    const envelope = writeProjectionEnvelope(next, {
      projectionVersion: 1,
      sourceEventCursor: `surface-auto-resolve:${workspaceId}:${Date.now()}`,
    });
    window.localStorage.setItem(INCIDENTS_KEY, JSON.stringify(envelope));
    return resolvedCount;
  } catch {
    return 0;
  }
}

export function toggleSurfaceParityIncidentRunbookStep(
  incidentId: string,
  stepIndex: number,
  completed: boolean,
): void {
  if (!canUseStorage()) return;
  try {
    const incidents = listSurfaceParityIncidents(INCIDENT_LIMIT);
    const next = incidents.map((entry) => {
      if (entry.incidentId !== incidentId) return entry;
      const steps = Array.isArray(entry.runbook) ? entry.runbook : [];
      if (stepIndex < 0 || stepIndex >= steps.length) return entry;
      const progress = Array.isArray(entry.runbookProgress)
        ? [...entry.runbookProgress]
        : steps.map(() => false);
      progress[stepIndex] = Boolean(completed);
      return {
        ...entry,
        runbookProgress: progress,
        updatedAt: new Date().toISOString(),
      };
    });
    const envelope = writeProjectionEnvelope(next, {
      projectionVersion: 1,
      sourceEventCursor: `${incidentId}:runbook:${stepIndex}:${completed ? '1' : '0'}`,
    });
    window.localStorage.setItem(INCIDENTS_KEY, JSON.stringify(envelope));
  } catch {
    // best effort only
  }
}

export function isSurfaceParityIncidentRunbookComplete(entry: SurfaceParityIncidentEntry): boolean {
  if (!Array.isArray(entry.runbook) || entry.runbook.length === 0) return true;
  const progress = Array.isArray(entry.runbookProgress)
    ? entry.runbookProgress
    : entry.runbook.map(() => false);
  return entry.runbook.every((_, index) => Boolean(progress[index]));
}

export function getSurfaceParityDriftState(workspaceId: string): SurfaceParityDriftState {
  const map = readDriftStateMap();
  return map[workspaceId] || defaultDriftState(workspaceId);
}

export function evaluateSurfaceParityEscalation(input: {
  workspaceId: string;
  parityScore: number;
  missingTotal: number;
  observedSurfaceCount: number;
}): {
  shouldEscalate: boolean;
  severity: SurfaceParityIncidentSeverity;
  driftState: SurfaceParityDriftState;
} {
  const now = new Date().toISOString();
  const map = readDriftStateMap();
  const current = map[input.workspaceId] || defaultDriftState(input.workspaceId);
  const hasDrift =
    input.observedSurfaceCount > 0 && (input.parityScore < 0.98 || input.missingTotal > 0);
  const nextDriftCycles = hasDrift ? current.consecutiveDriftCycles + 1 : 0;
  const severity: SurfaceParityIncidentSeverity =
    input.parityScore < 0.8 || input.missingTotal >= 8
      ? 'critical'
      : input.parityScore < 0.9 || input.missingTotal >= 4
      ? 'high'
      : 'watch';
  const cooldownMs = 15 * 60_000;
  const lastEscalationAge =
    current.lastEscalatedAt == null ? Number.POSITIVE_INFINITY : Date.now() - new Date(current.lastEscalatedAt).getTime();
  const cooldownElapsed = !Number.isFinite(lastEscalationAge) || lastEscalationAge >= cooldownMs;
  const thresholdReached =
    nextDriftCycles >= 3 && (input.parityScore < 0.9 || input.missingTotal >= 3);
  const shouldEscalate = Boolean(hasDrift && thresholdReached && cooldownElapsed);

  const driftState: SurfaceParityDriftState = {
    workspaceId: input.workspaceId,
    consecutiveDriftCycles: nextDriftCycles,
    lastEvaluatedAt: now,
    lastEscalatedAt: shouldEscalate ? now : current.lastEscalatedAt,
  };
  map[input.workspaceId] = driftState;
  writeDriftStateMap(map);
  return { shouldEscalate, severity, driftState };
}

export function evaluateSurfaceSnapshotAlarm(input: {
  workspaceId: string;
  snapshotAgesMs: Record<string, number>;
  staleAfterMs?: number;
  criticalAfterMs?: number;
}): {
  shouldEscalate: boolean;
  severity: SurfaceParityIncidentSeverity;
  staleSurfaces: string[];
  maxAgeMs: number;
  staleAfterMs: number;
  criticalAfterMs: number;
  alarmState: SurfaceSnapshotAlarmState;
} {
  const staleAfterMs = Math.max(60_000, input.staleAfterMs ?? 20 * 60_000);
  const criticalAfterMs = Math.max(staleAfterMs + 60_000, input.criticalAfterMs ?? 45 * 60_000);
  const nowIso = new Date().toISOString();
  const stateMap = readSnapshotAlarmStateMap();
  const current = stateMap[input.workspaceId] || defaultSnapshotAlarmState(input.workspaceId);
  const staleSurfaces = Object.entries(input.snapshotAgesMs)
    .filter(([, age]) => Number.isFinite(age) && age > staleAfterMs)
    .map(([surface]) => surface);
  const maxAgeMs = Object.values(input.snapshotAgesMs).reduce((acc, age) => {
    if (!Number.isFinite(age)) return acc;
    return Math.max(acc, age);
  }, 0);
  const severity: SurfaceParityIncidentSeverity =
    maxAgeMs >= criticalAfterMs || staleSurfaces.length >= 4
      ? 'critical'
      : staleSurfaces.length >= 2
      ? 'high'
      : 'watch';
  const cooldownMs = severity === 'critical' ? 10 * 60_000 : severity === 'high' ? 20 * 60_000 : 45 * 60_000;
  const lastEscalationAge =
    current.lastEscalatedAt == null
      ? Number.POSITIVE_INFINITY
      : Date.now() - new Date(current.lastEscalatedAt).getTime();
  const cooldownElapsed = !Number.isFinite(lastEscalationAge) || lastEscalationAge >= cooldownMs;
  const shouldEscalate = staleSurfaces.length > 0 && cooldownElapsed;
  const alarmState: SurfaceSnapshotAlarmState = {
    workspaceId: input.workspaceId,
    lastEvaluatedAt: nowIso,
    lastEscalatedAt: shouldEscalate ? nowIso : current.lastEscalatedAt,
  };
  stateMap[input.workspaceId] = alarmState;
  writeSnapshotAlarmStateMap(stateMap);
  return {
    shouldEscalate,
    severity,
    staleSurfaces,
    maxAgeMs,
    staleAfterMs,
    criticalAfterMs,
    alarmState,
  };
}

export function buildSurfaceParityIncidentPolicy(input: {
  severity: SurfaceParityIncidentSeverity;
  missingTotal: number;
  consecutiveDriftCycles: number;
}): SurfaceParityIncidentPolicy {
  if (
    input.severity === 'critical' ||
    input.missingTotal >= 8 ||
    input.consecutiveDriftCycles >= 6
  ) {
    return {
      slaTier: 'p1',
      routingTarget: 'oncall-engineering',
      ackWithinMinutes: 15,
      resolveWithinMinutes: 120,
    };
  }
  if (
    input.severity === 'high' ||
    input.missingTotal >= 4 ||
    input.consecutiveDriftCycles >= 4
  ) {
    return {
      slaTier: 'p2',
      routingTarget: 'project-operator',
      ackWithinMinutes: 60,
      resolveWithinMinutes: 480,
    };
  }
  return {
    slaTier: 'p3',
    routingTarget: 'owner-review',
    ackWithinMinutes: 240,
    resolveWithinMinutes: 1440,
  };
}

export function dueAtFromNow(minutes: number): string {
  return new Date(Date.now() + Math.max(1, minutes) * 60_000).toISOString();
}
