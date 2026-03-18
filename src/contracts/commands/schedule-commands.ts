import type { ContractCommandContext, ContractCommandResult } from '../core/command-contract';
import type { EventBlockContract } from '../domains/schedule-contract';

export interface CreateScheduleEventCommand {
  event: EventBlockContract;
}

export interface UpdateScheduleEventCommand {
  eventId: string;
  updates: Partial<EventBlockContract>;
}

export interface DeleteScheduleEventCommand {
  eventId: string;
}

export interface ScheduleCommandPort {
  createEvent: (
    ctx: ContractCommandContext,
    command: CreateScheduleEventCommand,
  ) => Promise<ContractCommandResult<{ eventId: string }>>;
  updateEvent: (
    ctx: ContractCommandContext,
    command: UpdateScheduleEventCommand,
  ) => Promise<ContractCommandResult<{ eventId: string }>>;
  deleteEvent: (
    ctx: ContractCommandContext,
    command: DeleteScheduleEventCommand,
  ) => Promise<ContractCommandResult<{ eventId: string }>>;
}
