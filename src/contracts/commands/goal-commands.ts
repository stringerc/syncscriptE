import type { ContractCommandContext, ContractCommandResult } from '../core/command-contract';

export interface CreateGoalCommand {
  title: string;
  description?: string;
  category?: string;
  deadline?: string;
  projectId?: string;
}

export interface UpdateGoalCommand {
  goalId: string;
  title?: string;
  description?: string;
  category?: string;
  progress?: number;
  status?: string;
  completed?: boolean;
  archived?: boolean;
}

export interface DeleteGoalCommand {
  goalId: string;
}

export interface GoalCommandPort {
  createGoal: (
    ctx: ContractCommandContext,
    command: CreateGoalCommand,
  ) => Promise<ContractCommandResult<{ goalId: string }>>;
  updateGoal: (
    ctx: ContractCommandContext,
    command: UpdateGoalCommand,
  ) => Promise<ContractCommandResult<{ goalId: string }>>;
  deleteGoal: (
    ctx: ContractCommandContext,
    command: DeleteGoalCommand,
  ) => Promise<ContractCommandResult<{ goalId: string }>>;
}
