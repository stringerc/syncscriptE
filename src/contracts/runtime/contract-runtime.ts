import { ContractEventBus } from '../events/contract-event-bus';
import { createEnvelope } from '../core/event-envelope';
import type { ContractEntityKind } from '../core/entity-contract';
import type { ContractDomainEventType } from '../events/domain-events';

/** Payload shape for `agent.run.*` events (Hermes / executor visibility). */
export type AgentRunStepPayload = {
  runId: string;
  stepIndex: number;
  tool?: string;
  status: 'pending' | 'running' | 'ok' | 'error';
  argsSummary?: string;
  resultSummary?: string;
  linkedTaskId?: string;
  linkedEventId?: string;
};

const DEFAULT_WORKSPACE_ID = 'workspace-main';
/** Dispatched on `window` when a contract event is accepted (Agent run dock, traces, etc.). */
export const CONTRACT_EVENT_WINDOW_NAME = 'syncscript:contract-event';
const RECENT_EVENT_LIMIT = 200;

const eventBus = new ContractEventBus();
const recentContractEvents: Array<Record<string, unknown>> = [];

function resolveActorId(): string {
  try {
    return (
      window.localStorage.getItem('syncscript_auth_user_id') ||
      window.localStorage.getItem('auth_user_id') ||
      'system'
    );
  } catch {
    return 'system';
  }
}

export function getContractEventBus(): ContractEventBus {
  return eventBus;
}

export function listRecentContractEvents(limit = 50): Array<Record<string, unknown>> {
  return recentContractEvents.slice(-Math.max(1, Math.min(limit, RECENT_EVENT_LIMIT)));
}

export function emitContractDomainEvent(
  eventType: ContractDomainEventType,
  entityKind: ContractEntityKind,
  entityId: string,
  payload: Record<string, unknown>,
  options?: {
    workspaceId?: string;
    actorType?: 'human' | 'agent' | 'system';
    actorId?: string;
    idempotencyKey?: string;
  },
): { accepted: boolean; reason?: string; eventId?: string } {
  const actorId = options?.actorId || resolveActorId();
  const envelope = createEnvelope({
    eventType,
    entityKind,
    entityId,
    workspaceId: options?.workspaceId || DEFAULT_WORKSPACE_ID,
    idempotencyKey:
      options?.idempotencyKey ||
      `${eventType}:${entityKind}:${entityId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    payloadVersion: 1,
    actor: {
      actorType: options?.actorType || 'human',
      actorId,
    },
    payload,
  });

  const result = eventBus.dispatch(envelope as any);
  if (result.accepted && typeof window !== 'undefined') {
    recentContractEvents.push({
      eventId: envelope.eventId,
      eventType: envelope.eventType,
      entityKind: envelope.entityKind,
      entityId: envelope.entityId,
      workspaceId: envelope.workspaceId,
      occurredAt: envelope.occurredAt,
    });
    if (recentContractEvents.length > RECENT_EVENT_LIMIT) {
      recentContractEvents.splice(0, recentContractEvents.length - RECENT_EVENT_LIMIT);
    }
    window.dispatchEvent(new CustomEvent(CONTRACT_EVENT_WINDOW_NAME, { detail: envelope }));
  }
  return {
    accepted: result.accepted,
    reason: result.reason,
    eventId: result.accepted ? envelope.eventId : undefined,
  };
}

/** Start a traceable executor run (entityId should equal runId). */
export function emitAgentRunStarted(
  runId: string,
  payload: { label?: string; source?: string } = {},
): ReturnType<typeof emitContractDomainEvent> {
  return emitContractDomainEvent('agent.run.started', 'agent', runId, { ...payload, runId }, {
    actorType: 'agent',
    actorId: payload.source || 'hermes',
  });
}

export function emitAgentRunStep(
  runId: string,
  payload: AgentRunStepPayload,
): ReturnType<typeof emitContractDomainEvent> {
  return emitContractDomainEvent('agent.run.step', 'agent', runId, payload as Record<string, unknown>, {
    actorType: 'agent',
    actorId: 'hermes',
    idempotencyKey: `agent.run.step:${runId}:${payload.stepIndex}:${payload.tool || 'step'}`,
  });
}

export function emitAgentRunCompleted(
  runId: string,
  payload: { ok: boolean; summary?: string } = { ok: true },
): ReturnType<typeof emitContractDomainEvent> {
  return emitContractDomainEvent(
    'agent.run.completed',
    'agent',
    runId,
    { runId, ...payload },
    { actorType: 'agent', actorId: 'hermes' },
  );
}

export function emitAgentRunFailed(runId: string, message: string): ReturnType<typeof emitContractDomainEvent> {
  return emitContractDomainEvent(
    'agent.run.failed',
    'agent',
    runId,
    { runId, message },
    { actorType: 'agent', actorId: 'hermes' },
  );
}
