import type { TaskSurfaceParityReport } from './task-surface-parity';
import type { TaskSurfaceSnapshotState } from './surface-parity-runtime';

export type SurfaceParityActionType =
  | 'request_surface_refresh'
  | 'copy_missing_ids'
  | 'export_missing_ids'
  | 'investigate_surface_projection';

export interface SurfaceParityAction {
  id: string;
  type: SurfaceParityActionType;
  priority: 'high' | 'medium' | 'low';
  summary: string;
  surface?: 'workstream' | 'projects' | 'dashboard' | 'goals' | 'resonance' | 'ai_assistant';
}

export interface SurfaceParitySnapshotBundle {
  tasksTab: TaskSurfaceSnapshotState;
  workstream: TaskSurfaceSnapshotState;
  projects: TaskSurfaceSnapshotState;
  dashboard: TaskSurfaceSnapshotState;
  goals: TaskSurfaceSnapshotState;
  resonance: TaskSurfaceSnapshotState;
  aiAssistant: TaskSurfaceSnapshotState;
}

function isStale(capturedAt: string | null, staleAfterMs = 15 * 60_000): boolean {
  if (!capturedAt) return true;
  const age = Date.now() - new Date(capturedAt).getTime();
  return !Number.isFinite(age) || age > staleAfterMs;
}

export function buildSurfaceParityActions(
  report: TaskSurfaceParityReport,
  snapshots: SurfaceParitySnapshotBundle,
): SurfaceParityAction[] {
  const actions: SurfaceParityAction[] = [];
  const staleSurfaceCount = [
    snapshots.workstream,
    snapshots.projects,
    snapshots.dashboard,
    snapshots.goals,
    snapshots.resonance,
    snapshots.aiAssistant,
  ].filter((snapshot) => isStale(snapshot.capturedAt)).length;
  if (staleSurfaceCount > 0) {
    actions.push({
      id: 'surface.request-refresh',
      type: 'request_surface_refresh',
      priority: 'high',
      summary: `Request fresh snapshots (${staleSurfaceCount} stale surface${staleSurfaceCount > 1 ? 's' : ''})`,
    });
  }

  if (report.missingInWorkstream.length > 0) {
    actions.push({
      id: 'surface.workstream.gaps',
      type: 'copy_missing_ids',
      priority: report.missingInWorkstream.length >= 5 ? 'high' : 'medium',
      summary: `Workstream missing ${report.missingInWorkstream.length} canonical task(s)`,
      surface: 'workstream',
    });
  }
  if (report.missingInDashboard.length > 0) {
    actions.push({
      id: 'surface.dashboard.gaps',
      type: 'copy_missing_ids',
      priority: report.missingInDashboard.length >= 5 ? 'high' : 'medium',
      summary: `Dashboard missing ${report.missingInDashboard.length} canonical task(s)`,
      surface: 'dashboard',
    });
  }
  if (report.missingInProjects.length > 0) {
    actions.push({
      id: 'surface.projects.gaps',
      type: 'copy_missing_ids',
      priority: report.missingInProjects.length >= 5 ? 'high' : 'medium',
      summary: `Projects projection missing ${report.missingInProjects.length} canonical task(s)`,
      surface: 'projects',
    });
  }
  if (report.missingInGoals.length > 0) {
    actions.push({
      id: 'surface.goals.gaps',
      type: 'copy_missing_ids',
      priority: report.missingInGoals.length >= 5 ? 'high' : 'medium',
      summary: `Goals surface missing ${report.missingInGoals.length} canonical task(s)`,
      surface: 'goals',
    });
  }
  if (report.missingInResonance.length > 0) {
    actions.push({
      id: 'surface.resonance.gaps',
      type: 'copy_missing_ids',
      priority: report.missingInResonance.length >= 5 ? 'high' : 'medium',
      summary: `Resonance surface missing ${report.missingInResonance.length} canonical task(s)`,
      surface: 'resonance',
    });
  }
  if (report.missingInAIAssistant.length > 0) {
    actions.push({
      id: 'surface.ai-assistant.gaps',
      type: 'copy_missing_ids',
      priority: report.missingInAIAssistant.length >= 5 ? 'high' : 'medium',
      summary: `AI Assistant surface missing ${report.missingInAIAssistant.length} canonical task(s)`,
      surface: 'ai_assistant',
    });
  }

  if (report.parityScore < 0.98) {
    actions.push({
      id: 'surface.export-gap-list',
      type: 'export_missing_ids',
      priority: report.parityScore < 0.9 ? 'high' : 'medium',
      summary: 'Export cross-surface gap list for operator audit and remediation',
    });
  }

  if (report.parityScore < 0.85) {
    actions.push({
      id: 'surface.investigate',
      type: 'investigate_surface_projection',
      priority: 'high',
      summary: 'Investigate projection/runtime drift before authority cutover',
    });
  }
  return actions;
}
