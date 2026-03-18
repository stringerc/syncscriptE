import type { ContractEntityKind } from './entity-contract';

export interface ContractActor {
  actorType: 'human' | 'agent' | 'system';
  actorId: string;
  actorLabel?: string;
}

export interface ContractEventEnvelope<TPayload = Record<string, unknown>> {
  eventId: string;
  eventType: string;
  entityKind: ContractEntityKind;
  entityId: string;
  workspaceId: string;
  occurredAt: string;
  idempotencyKey: string;
  payloadVersion: number;
  actor: ContractActor;
  payload: TPayload;
}

export function createEnvelope<TPayload>(
  input: Omit<ContractEventEnvelope<TPayload>, 'eventId' | 'occurredAt'> & {
    eventId?: string;
    occurredAt?: string;
  },
): ContractEventEnvelope<TPayload> {
  return {
    ...input,
    eventId: input.eventId || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    occurredAt: input.occurredAt || new Date().toISOString(),
  };
}

export function isIdempotentDuplicate(
  current: ContractEventEnvelope,
  previous: ContractEventEnvelope | null,
): boolean {
  if (!previous) return false;
  return (
    current.idempotencyKey === previous.idempotencyKey &&
    current.eventType === previous.eventType &&
    current.entityKind === previous.entityKind &&
    current.entityId === previous.entityId
  );
}
