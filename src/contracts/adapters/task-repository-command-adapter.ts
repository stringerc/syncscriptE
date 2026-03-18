import type { CreateTaskCommand, PromoteLineageCommand, TaskCommandPort, UpdateTaskCommand } from '../commands/task-commands';
import type { ContractCommandContext, ContractCommandResult } from '../core/command-contract';
import { commandFailure, commandSuccess } from '../core/command-contract';
import { taskRepository } from '../../services';

function commandId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export class TaskRepositoryCommandAdapter implements TaskCommandPort {
  async createTask(
    _ctx: ContractCommandContext,
    command: CreateTaskCommand,
  ): Promise<ContractCommandResult<{ taskId: string }>> {
    const id = commandId('task-create');
    try {
      const created = await taskRepository.createTask({
        title: command.title,
        description: command.description,
        priority: command.priority || 'medium',
        projectId: command.projectId,
        goalId: command.goalId,
      } as any);
      const taskId = String((created as any)?.id || '').trim();
      if (!taskId) return commandFailure(id, ['Task repository did not return a task id']);
      return commandSuccess(id, { taskId });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Task create failed';
      return commandFailure(id, [message]);
    }
  }

  async updateTask(
    _ctx: ContractCommandContext,
    command: UpdateTaskCommand,
  ): Promise<ContractCommandResult<{ taskId: string }>> {
    const id = commandId('task-update');
    try {
      await taskRepository.updateTask(command.taskId, {
        title: command.title,
        description: command.description,
        status: command.status,
        priority: command.priority,
        dueDate: command.dueAt,
        scheduledTime: command.scheduledAt === null ? undefined : command.scheduledAt,
        projectId: command.projectId,
      } as any);
      return commandSuccess(id, { taskId: command.taskId });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Task update failed';
      return commandFailure(id, [message]);
    }
  }

  async promoteLineage(
    _ctx: ContractCommandContext,
    command: PromoteLineageCommand,
  ): Promise<ContractCommandResult<{ taskId: string }>> {
    const id = commandId('task-promote-lineage');
    try {
      const created = await taskRepository.createTask({
        title: command.targetTaskTitle,
        description: `Promoted from ${command.sourceEntityType}: ${command.sourceEntityTitle}`,
      } as any);
      const taskId = String((created as any)?.id || '').trim();
      if (!taskId) return commandFailure(id, ['Lineage promotion did not return a task id']);
      return commandSuccess(id, { taskId });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lineage promotion failed';
      return commandFailure(id, [message]);
    }
  }
}
