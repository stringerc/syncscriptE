import type { ContractEntityIdentity } from '../core/entity-contract';

export type ContractTaskStatus = 'todo' | 'in_progress' | 'blocked' | 'completed';
export type ContractTaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskAssigneeContract {
  identityId: string;
  identityType: 'human' | 'agent';
  name: string;
  avatar?: string;
  role?: string;
  progress?: number;
}

export interface TaskLineageContract {
  parentTaskId?: string;
  sourceNodeId?: string;
  sourceEntityType?: 'task' | 'milestone' | 'step';
  sourceEntityId?: string;
  sourceEntityTitle?: string;
  lineageKey?: string;
}

export interface TaskNodeContract extends ContractEntityIdentity {
  entityKind: 'task';
  title: string;
  description?: string;
  status: ContractTaskStatus;
  priority: ContractTaskPriority;
  dueAt?: string;
  projectId?: string;
  goalId?: string;
  assignees: TaskAssigneeContract[];
  lineage?: TaskLineageContract;
}

export interface TaskGraphEdgeContract {
  fromTaskId: string;
  toTaskId: string;
  edgeType: 'depends_on' | 'blocked_by' | 'promoted_from' | 'belongs_to_project' | 'contributes_to_goal' | 'scheduled_as_event';
}

export interface TaskGraphInvariantResult {
  ok: boolean;
  errors: string[];
}

export function assertTaskGraphInvariants(
  tasks: TaskNodeContract[],
  edges: TaskGraphEdgeContract[],
): TaskGraphInvariantResult {
  const errors: string[] = [];
  const ids = new Set(tasks.map((task) => task.entityId));
  for (const edge of edges) {
    if (!ids.has(edge.fromTaskId)) errors.push(`Missing source task for edge ${edge.fromTaskId} -> ${edge.toTaskId}`);
    if (!ids.has(edge.toTaskId)) errors.push(`Missing target task for edge ${edge.fromTaskId} -> ${edge.toTaskId}`);
  }
  const lineageKeySet = new Set<string>();
  for (const task of tasks) {
    const key = String(task.lineage?.lineageKey || '').trim().toLowerCase();
    if (!key) continue;
    if (lineageKeySet.has(key)) errors.push(`Duplicate lineage key detected: ${key}`);
    lineageKeySet.add(key);
  }
  return { ok: errors.length === 0, errors };
}
