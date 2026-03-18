import type { Event } from '../../utils/event-task-types';
import type {
  CreateScheduleEventCommand,
  DeleteScheduleEventCommand,
  ScheduleCommandPort,
  UpdateScheduleEventCommand,
} from '../commands/schedule-commands';
import type { ContractCommandContext, ContractCommandResult } from '../core/command-contract';
import { commandFailure, commandSuccess } from '../core/command-contract';

function commandId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export class LocalScheduleCommandAdapter implements ScheduleCommandPort {
  constructor(
    private readonly getEvents: () => Event[],
    private readonly applyEvents: (updater: (prev: Event[]) => Event[]) => void,
  ) {}

  async createEvent(
    _ctx: ContractCommandContext,
    command: CreateScheduleEventCommand,
  ): Promise<ContractCommandResult<{ eventId: string }>> {
    const id = commandId('schedule-create');
    const eventId = String(command?.event?.entityId || '').trim();
    if (!eventId) return commandFailure(id, ['Missing event entityId']);
    this.applyEvents((prev) => [...prev, command.event as unknown as Event]);
    return commandSuccess(id, { eventId });
  }

  async updateEvent(
    _ctx: ContractCommandContext,
    command: UpdateScheduleEventCommand,
  ): Promise<ContractCommandResult<{ eventId: string }>> {
    const id = commandId('schedule-update');
    const eventId = String(command?.eventId || '').trim();
    if (!eventId) return commandFailure(id, ['Missing eventId']);
    const exists = this.getEvents().some((event) => String(event?.id || '') === eventId);
    if (!exists) return commandFailure(id, [`Event not found: ${eventId}`]);
    this.applyEvents((prev) =>
      prev.map((event) =>
        String(event?.id || '') === eventId
          ? ({ ...event, ...(command.updates as unknown as Record<string, unknown>) } as Event)
          : event,
      ),
    );
    return commandSuccess(id, { eventId });
  }

  async deleteEvent(
    _ctx: ContractCommandContext,
    command: DeleteScheduleEventCommand,
  ): Promise<ContractCommandResult<{ eventId: string }>> {
    const id = commandId('schedule-delete');
    const eventId = String(command?.eventId || '').trim();
    if (!eventId) return commandFailure(id, ['Missing eventId']);
    const exists = this.getEvents().some((event) => String(event?.id || '') === eventId);
    if (!exists) return commandFailure(id, [`Event not found: ${eventId}`]);
    this.applyEvents((prev) => prev.filter((event) => String(event?.id || '') !== eventId));
    return commandSuccess(id, { eventId });
  }
}
