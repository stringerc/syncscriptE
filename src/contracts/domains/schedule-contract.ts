import type { ContractEntityIdentity } from '../core/entity-contract';

export type ScheduleStatus = 'scheduled' | 'active' | 'completed' | 'archived';

export interface EventBlockContract extends ContractEntityIdentity {
  entityKind: 'event';
  title: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  scheduleStatus: ScheduleStatus;
  sourceTaskId?: string;
  sourceGoalId?: string;
  projectId?: string;
}

export interface ScheduleBindingContract {
  bindingId: string;
  taskId: string;
  eventId: string;
  scheduledAt: string;
}

export function assertScheduleBindings(
  tasksWithSchedule: Array<{ taskId: string; eventId?: string }>,
  bindings: ScheduleBindingContract[],
): string[] {
  const errors: string[] = [];
  const bindingByTask = new Map(bindings.map((binding) => [binding.taskId, binding]));
  for (const task of tasksWithSchedule) {
    if (!task.eventId) continue;
    const binding = bindingByTask.get(task.taskId);
    if (!binding) errors.push(`Missing schedule binding for task ${task.taskId}`);
    else if (binding.eventId !== task.eventId) errors.push(`Task/event mismatch for task ${task.taskId}`);
  }
  return errors;
}
