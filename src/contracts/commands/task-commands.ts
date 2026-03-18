import type { ContractCommandContext, ContractCommandResult } from '../core/command-contract';
import type { ContractTaskPriority, TaskNodeContract } from '../domains/task-graph-contract';

export interface CreateTaskCommand {
  title: string;
  description?: string;
  priority?: ContractTaskPriority;
  projectId?: string;
  goalId?: string;
}

export interface UpdateTaskCommand {
  taskId: string;
  title?: string;
  description?: string;
  status?: TaskNodeContract['status'];
  priority?: ContractTaskPriority;
  dueAt?: string;
  scheduledAt?: string | null;
  projectId?: string;
}

export interface PromoteLineageCommand {
  sourceNodeId: string;
  sourceEntityType: 'milestone' | 'step';
  sourceEntityId?: string;
  sourceEntityTitle: string;
  targetTaskTitle: string;
}

export interface TaskCommandPort {
  createTask: (ctx: ContractCommandContext, command: CreateTaskCommand) => Promise<ContractCommandResult<{ taskId: string }>>;
  updateTask: (ctx: ContractCommandContext, command: UpdateTaskCommand) => Promise<ContractCommandResult<{ taskId: string }>>;
  promoteLineage: (ctx: ContractCommandContext, command: PromoteLineageCommand) => Promise<ContractCommandResult<{ taskId: string }>>;
}
