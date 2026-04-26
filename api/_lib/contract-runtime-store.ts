type ContractDomain = 'task' | 'goal' | 'schedule' | 'project';

export interface CommandLedgerRecord {
  commandId: string;
  idempotencyKey: string;
  workspaceId: string;
  domain: ContractDomain;
  commandType: string;
  actorId: string;
  actorType: 'human' | 'agent' | 'system';
  payload: Record<string, unknown>;
  receivedAt: string;
  status: 'accepted' | 'replayed';
}

export interface DomainEventRecord {
  eventId: string;
  idempotencyKey: string;
  workspaceId: string;
  eventType: string;
  entityKind: string;
  entityId: string;
  payload: Record<string, unknown>;
  occurredAt: string;
  cursor: number;
}

export interface ProjectionEnvelope<TData = Record<string, unknown>> {
  projectionVersion: number;
  sourceEventCursor: number;
  generatedAt: string;
  data: TData;
}

type ProjectionEntityState = Record<ContractDomain, Array<Record<string, unknown>>>;

interface WorkspaceState {
  cursor: number;
  commandIdempotencyMap: Map<string, CommandLedgerRecord>;
  eventIdempotencyMap: Map<string, DomainEventRecord>;
  commands: CommandLedgerRecord[];
  events: DomainEventRecord[];
  projections: ProjectionEntityState;
}

const workspaceState = new Map<string, WorkspaceState>();

function emptyProjectionState(): ProjectionEntityState {
  return {
    task: [],
    goal: [],
    schedule: [],
    project: [],
  };
}

function getOrCreateWorkspaceState(workspaceId: string): WorkspaceState {
  const existing = workspaceState.get(workspaceId);
  if (existing) return existing;
  const created: WorkspaceState = {
    cursor: 0,
    commandIdempotencyMap: new Map(),
    eventIdempotencyMap: new Map(),
    commands: [],
    events: [],
    projections: emptyProjectionState(),
  };
  workspaceState.set(workspaceId, created);
  return created;
}

export function appendCommandRecord(
  input: Omit<CommandLedgerRecord, 'status' | 'receivedAt'> & { receivedAt?: string },
): CommandLedgerRecord {
  const state = getOrCreateWorkspaceState(input.workspaceId);
  const previous = state.commandIdempotencyMap.get(input.idempotencyKey);
  if (previous) {
    return { ...previous, status: 'replayed' };
  }
  const record: CommandLedgerRecord = {
    ...input,
    receivedAt: input.receivedAt || new Date().toISOString(),
    status: 'accepted',
  };
  state.commandIdempotencyMap.set(input.idempotencyKey, record);
  state.commands.push(record);
  return record;
}

export function appendDomainEvent(
  input: Omit<DomainEventRecord, 'cursor' | 'occurredAt'> & { occurredAt?: string },
): DomainEventRecord {
  const state = getOrCreateWorkspaceState(input.workspaceId);
  const previous = state.eventIdempotencyMap.get(input.idempotencyKey);
  if (previous) {
    return previous;
  }
  state.cursor += 1;
  const record: DomainEventRecord = {
    ...input,
    occurredAt: input.occurredAt || new Date().toISOString(),
    cursor: state.cursor,
  };
  state.eventIdempotencyMap.set(input.idempotencyKey, record);
  state.events.push(record);
  return record;
}

export function listCommandRecords(workspaceId: string, limit = 100): CommandLedgerRecord[] {
  const state = getOrCreateWorkspaceState(workspaceId);
  return state.commands.slice(-Math.max(1, Math.min(500, limit)));
}

export function listDomainEvents(workspaceId: string, limit = 100): DomainEventRecord[] {
  const state = getOrCreateWorkspaceState(workspaceId);
  return state.events.slice(-Math.max(1, Math.min(500, limit)));
}

export function setProjectionEntities(
  workspaceId: string,
  domain: ContractDomain,
  entities: Array<Record<string, unknown>>,
): void {
  const state = getOrCreateWorkspaceState(workspaceId);
  state.projections[domain] = Array.isArray(entities) ? entities : [];
}

export function readProjectionEnvelope(
  workspaceId: string,
  domain: ContractDomain,
): ProjectionEnvelope<{ domain: ContractDomain; entities: Array<Record<string, unknown>> }> {
  const state = getOrCreateWorkspaceState(workspaceId);
  return {
    projectionVersion: 1,
    sourceEventCursor: state.cursor,
    generatedAt: new Date().toISOString(),
    data: {
      domain,
      entities: state.projections[domain],
    },
  };
}

