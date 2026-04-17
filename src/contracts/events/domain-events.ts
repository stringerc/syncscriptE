import type { ContractEventEnvelope } from '../core/event-envelope';

export type ContractDomainEventType =
  | 'task.created'
  | 'task.updated'
  | 'task.deleted'
  | 'lineage.promoted'
  | 'goal.created'
  | 'goal.updated'
  | 'goal.deleted'
  | 'schedule.binding.created'
  | 'schedule.binding.updated'
  | 'schedule.binding.deleted'
  | 'schedule.event.created'
  | 'schedule.event.updated'
  | 'schedule.event.deleted'
  | 'assignment.updated'
  | 'integration.binding.updated'
  | 'finance.recommendation.generated'
  | 'finance.action.approved'
  | 'resonance.snapshot.computed'
  | 'run.proof.finalized'
  /** Hermes / executor agent — structured progress for UI “Agent run” dock */
  | 'agent.run.started'
  | 'agent.run.step'
  | 'agent.run.completed'
  | 'agent.run.failed';

export type ContractDomainEvent = ContractEventEnvelope<Record<string, unknown>> & {
  eventType: ContractDomainEventType;
};

export interface EventDispatchResult {
  accepted: boolean;
  reason?: string;
}

export function validateEvent(event: ContractDomainEvent): string[] {
  const errors: string[] = [];
  if (!event.eventId) errors.push('eventId required');
  if (!event.eventType) errors.push('eventType required');
  if (!event.entityKind) errors.push('entityKind required');
  if (!event.entityId) errors.push('entityId required');
  if (!event.idempotencyKey) errors.push('idempotencyKey required');
  return errors;
}
