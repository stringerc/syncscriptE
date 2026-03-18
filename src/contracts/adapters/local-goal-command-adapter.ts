import type {
  CreateGoalCommand,
  DeleteGoalCommand,
  GoalCommandPort,
  UpdateGoalCommand,
} from '../commands/goal-commands';
import type { ContractCommandContext, ContractCommandResult } from '../core/command-contract';
import { commandFailure, commandSuccess } from '../core/command-contract';

type GoalLike = {
  id: string;
  title?: string;
  progress?: number;
};

function commandId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function goalId(): string {
  return `goal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class LocalGoalCommandAdapter implements GoalCommandPort {
  constructor(private readonly getGoals: () => GoalLike[]) {}

  async createGoal(
    _ctx: ContractCommandContext,
    command: CreateGoalCommand,
  ): Promise<ContractCommandResult<{ goalId: string }>> {
    const id = commandId('goal-create');
    const title = String(command.title || '').trim();
    if (!title) return commandFailure(id, ['Missing goal title']);
    return commandSuccess(id, { goalId: goalId() });
  }

  async updateGoal(
    _ctx: ContractCommandContext,
    command: UpdateGoalCommand,
  ): Promise<ContractCommandResult<{ goalId: string }>> {
    const id = commandId('goal-update');
    const goalIdValue = String(command.goalId || '').trim();
    if (!goalIdValue) return commandFailure(id, ['Missing goalId']);
    const goal = this.getGoals().find((entry) => String(entry.id) === goalIdValue);
    if (!goal) return commandFailure(id, [`Goal not found: ${goalIdValue}`]);
    if (command.progress != null && (!Number.isFinite(command.progress) || command.progress < 0 || command.progress > 100)) {
      return commandFailure(id, ['Goal progress must be between 0 and 100']);
    }
    return commandSuccess(id, { goalId: goalIdValue });
  }

  async deleteGoal(
    _ctx: ContractCommandContext,
    command: DeleteGoalCommand,
  ): Promise<ContractCommandResult<{ goalId: string }>> {
    const id = commandId('goal-delete');
    const goalIdValue = String(command.goalId || '').trim();
    if (!goalIdValue) return commandFailure(id, ['Missing goalId']);
    const goal = this.getGoals().find((entry) => String(entry.id) === goalIdValue);
    if (!goal) return commandFailure(id, [`Goal not found: ${goalIdValue}`]);
    return commandSuccess(id, { goalId: goalIdValue });
  }
}
