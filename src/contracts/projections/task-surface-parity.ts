type TaskLike = { id: string };

export interface TaskSurfaceParityInput {
  tasksTab: TaskLike[];
  workstream?: TaskLike[] | null;
  projects?: TaskLike[] | null;
  dashboard?: TaskLike[] | null;
  goals?: TaskLike[] | null;
  resonance?: TaskLike[] | null;
  aiAssistant?: TaskLike[] | null;
}

export interface TaskSurfaceParityReport {
  canonicalCount: number;
  missingInWorkstream: string[];
  missingInProjects: string[];
  missingInDashboard: string[];
  missingInGoals: string[];
  missingInResonance: string[];
  missingInAIAssistant: string[];
  parityScore: number;
  observedSurfaces: {
    workstream: boolean;
    projects: boolean;
    dashboard: boolean;
    goals: boolean;
    resonance: boolean;
    aiAssistant: boolean;
  };
}

function toIdSet(items: TaskLike[]): Set<string> {
  return new Set((items || []).map((item) => String(item?.id || '').trim()).filter(Boolean));
}

function missingFromTarget(source: Set<string>, target: Set<string>): string[] {
  const missing: string[] = [];
  for (const id of source) {
    if (!target.has(id)) missing.push(id);
  }
  return missing;
}

export function buildTaskSurfaceParityReport(input: TaskSurfaceParityInput): TaskSurfaceParityReport {
  const canonical = toIdSet(input.tasksTab);
  const observedSurfaces = {
    workstream: Array.isArray(input.workstream),
    projects: Array.isArray(input.projects),
    dashboard: Array.isArray(input.dashboard),
    goals: Array.isArray(input.goals),
    resonance: Array.isArray(input.resonance),
    aiAssistant: Array.isArray(input.aiAssistant),
  };
  const workstream = observedSurfaces.workstream ? toIdSet(input.workstream || []) : canonical;
  const projects = observedSurfaces.projects ? toIdSet(input.projects || []) : canonical;
  const dashboard = observedSurfaces.dashboard ? toIdSet(input.dashboard || []) : canonical;
  const goals = observedSurfaces.goals ? toIdSet(input.goals || []) : canonical;
  const resonance = observedSurfaces.resonance ? toIdSet(input.resonance || []) : canonical;
  const aiAssistant = observedSurfaces.aiAssistant ? toIdSet(input.aiAssistant || []) : canonical;

  const missingInWorkstream = missingFromTarget(canonical, workstream);
  const missingInProjects = missingFromTarget(canonical, projects);
  const missingInDashboard = missingFromTarget(canonical, dashboard);
  const missingInGoals = missingFromTarget(canonical, goals);
  const missingInResonance = missingFromTarget(canonical, resonance);
  const missingInAIAssistant = missingFromTarget(canonical, aiAssistant);

  const canonicalCount = canonical.size;
  const observedSurfaceCount = [observedSurfaces.workstream, observedSurfaces.projects, observedSurfaces.dashboard]
    .concat([observedSurfaces.goals, observedSurfaces.resonance, observedSurfaces.aiAssistant])
    .filter(Boolean).length;
  const mismatchCount =
    missingInWorkstream.length +
    missingInProjects.length +
    missingInDashboard.length +
    missingInGoals.length +
    missingInResonance.length +
    missingInAIAssistant.length;
  const parityScore =
    canonicalCount === 0 || observedSurfaceCount === 0
      ? 1
      : Math.max(0, 1 - mismatchCount / (canonicalCount * observedSurfaceCount));

  return {
    canonicalCount,
    missingInWorkstream,
    missingInProjects,
    missingInDashboard,
    missingInGoals,
    missingInResonance,
    missingInAIAssistant,
    parityScore,
    observedSurfaces,
  };
}
