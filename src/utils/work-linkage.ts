type AnyTask = Record<string, any>;

export interface TaskGoalLinkage {
  linkedGoalId?: string;
  linkedGoalTitle?: string;
}

export interface TaskProjectLinkage {
  linkedProjectId?: string;
  linkedProjectName?: string;
}

export function getTaskGoalLinkage(task: AnyTask, goalTitleById: Map<string, string>): TaskGoalLinkage {
  const linkedGoalId = task?.goalId ? String(task.goalId) : undefined;
  const linkedGoalTitle = linkedGoalId ? goalTitleById.get(linkedGoalId) : undefined;
  return { linkedGoalId, linkedGoalTitle };
}

export function getTaskProjectLinkage(task: AnyTask, projectNameById: Map<string, string>): TaskProjectLinkage {
  const linkedProjectId = task?.projectId ? String(task.projectId) : undefined;
  const linkedProjectName = linkedProjectId ? projectNameById.get(linkedProjectId) : undefined;
  return { linkedProjectId, linkedProjectName };
}

export function classifyTaskStatusLane(task: AnyTask, byId: Map<string, AnyTask>): 'pending' | 'todo' | 'doing' | 'done' {
  if (task?.completed) return 'done';
  const deps = Array.isArray(task?.dependencies) ? task.dependencies : [];
  const hasBlockingDeps = deps
    .map((dep: any) => {
      if (typeof dep === 'string') return dep;
      return String(dep?.dependsOn || dep?.taskId || dep?.id || '').trim();
    })
    .filter(Boolean)
    .some((id: string) => {
      const depTask = byId.get(id);
      return Boolean(depTask) && !depTask.completed;
    });
  if (hasBlockingDeps) return 'pending';
  const normalizedStatus = String(task?.status || '').trim().toLowerCase();
  if (['doing', 'in_progress', 'in-progress', 'active', 'started'].includes(normalizedStatus)) {
    return 'doing';
  }
  return 'todo';
}
