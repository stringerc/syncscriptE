import type { ContractEntityIdentity } from '../core/entity-contract';

export type GoalLifecycleStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned';
export type GoalHealthStatus = 'healthy' | 'at_risk' | 'blocked';

export interface GoalNodeContract extends ContractEntityIdentity {
  entityKind: 'goal';
  title: string;
  description?: string;
  lifecycleStatus: GoalLifecycleStatus;
  healthStatus: GoalHealthStatus;
  progress: number;
  targetAt?: string;
  projectId?: string;
}

export interface GoalTaskLinkContract {
  goalId: string;
  taskId: string;
  contributionWeight?: number;
}

export function assertGoalProgressBounds(goals: GoalNodeContract[]): string[] {
  const errors: string[] = [];
  for (const goal of goals) {
    if (goal.progress < 0 || goal.progress > 100) {
      errors.push(`Goal ${goal.entityId} progress out of range`);
    }
  }
  return errors;
}
