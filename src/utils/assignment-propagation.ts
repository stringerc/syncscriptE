import {
  evaluateCrossUserVisibilityMatrix,
  type CollaborationVisibilityScope,
  type VisibilityMatrixDecision,
  type VisibilityMatrixInput,
} from './cross-user-visibility';
import {
  buildAssignmentProjectionForUser as buildAssignmentProjectionForUserCore,
  evaluateProjectionConvergence as evaluateProjectionConvergenceCore,
  repairProjectionInbox as repairProjectionInboxCore,
  sortEventsDeterministically as sortEventsDeterministicallyCore,
  toAssignmentResourceKey,
} from './assignment-propagation-core.mjs';

export interface AssignmentVisibilityContext {
  scope: CollaborationVisibilityScope;
  ownerUserId: string;
  teamMemberIds?: string[];
  workspaceMemberIds?: string[];
  friendPairs?: Array<{ a: string; b: string }>;
  explicitAllowUserIds?: string[];
  explicitDenyUserIds?: string[];
}

export interface AssignmentPropagationEvent {
  id: string;
  idempotencyKey: string;
  sequence: number;
  timestamp: string;
  action: 'assign' | 'unassign' | 'reassign';
  resourceType: 'task' | 'milestone' | 'step';
  resourceId: string;
  taskId: string;
  actorUserId: string;
  targetUserId: string;
  targetName?: string;
  targetRole?: string;
  allowed: boolean;
  scope: CollaborationVisibilityScope;
  workspaceId?: string;
  teamId?: string;
}

export interface AssignmentInboxItem {
  id: string;
  userId: string;
  resourceType: 'task' | 'milestone' | 'step';
  resourceId: string;
  taskId: string;
  eventId: string;
  lastAction: 'assign' | 'unassign' | 'reassign';
  state: 'active' | 'removed' | 'blocked';
  visible: boolean;
  visibilityReasonCode: VisibilityMatrixDecision['reasonCode'];
  updatedAt: string;
}

export interface AssignmentProjectionSnapshot {
  userId: string;
  activeTaskIds: string[];
  removedTaskIds: string[];
  blockedTaskIds: string[];
  activeResourceKeys: string[];
  removedResourceKeys: string[];
  blockedResourceKeys: string[];
  latestSequence: number;
  totalUserEvents: number;
  convergedWithInbox: boolean;
}

export interface EnqueueAssignmentPropagationInput {
  idempotencyKey?: string;
  action: 'assign' | 'unassign' | 'reassign';
  resourceType: 'task' | 'milestone' | 'step';
  resourceId: string;
  taskId?: string;
  actorUserId: string;
  targetUserId: string;
  targetName?: string;
  targetRole?: string;
  allowed: boolean;
  workspaceId?: string;
  teamId?: string;
  visibility: AssignmentVisibilityContext;
}

interface PropagationStore {
  outbox: AssignmentPropagationEvent[];
  inbox: AssignmentInboxItem[];
  idempotencyKeys: string[];
  sequence: number;
}

const STORAGE_KEY = 'syncscript_assignment_propagation_v1';
const MAX_EVENTS = 500;
const MAX_INBOX_ITEMS = 800;
const MAX_KEYS = 1200;

const memoryFallback = new Map<string, string>();

function normalizeId(value?: string): string {
  return String(value || '').trim();
}

function getStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage;
}

function safeGetItem(key: string): string | null {
  const storage = getStorage();
  if (!storage) return memoryFallback.get(key) || null;
  try {
    return storage.getItem(key);
  } catch {
    return memoryFallback.get(key) || null;
  }
}

function safeSetItem(key: string, value: string): void {
  const storage = getStorage();
  if (!storage) {
    memoryFallback.set(key, value);
    return;
  }
  try {
    storage.setItem(key, value);
  } catch {
    memoryFallback.set(key, value);
  }
}

function safeRemoveItem(key: string): void {
  const storage = getStorage();
  if (!storage) {
    memoryFallback.delete(key);
    return;
  }
  try {
    storage.removeItem(key);
  } catch {
    memoryFallback.delete(key);
  }
}

function readStore(): PropagationStore {
  try {
    const raw = safeGetItem(STORAGE_KEY);
    if (!raw) {
      return { outbox: [], inbox: [], idempotencyKeys: [], sequence: 0 };
    }
    const parsed = JSON.parse(raw);
    return {
      outbox: Array.isArray(parsed?.outbox) ? parsed.outbox : [],
      inbox: Array.isArray(parsed?.inbox) ? parsed.inbox : [],
      idempotencyKeys: Array.isArray(parsed?.idempotencyKeys) ? parsed.idempotencyKeys : [],
      sequence: Number.isFinite(parsed?.sequence) ? Number(parsed.sequence) : 0,
    };
  } catch {
    return { outbox: [], inbox: [], idempotencyKeys: [], sequence: 0 };
  }
}

function writeStore(store: PropagationStore): void {
  safeSetItem(
    STORAGE_KEY,
    JSON.stringify({
      outbox: store.outbox.slice(-MAX_EVENTS),
      inbox: store.inbox.slice(-MAX_INBOX_ITEMS),
      idempotencyKeys: store.idempotencyKeys.slice(-MAX_KEYS),
      sequence: Math.max(0, store.sequence),
    }),
  );
}

function buildDefaultIdempotencyKey(input: EnqueueAssignmentPropagationInput): string {
  const parts = [
    normalizeId(input.action).toLowerCase(),
    normalizeId(input.resourceType).toLowerCase(),
    normalizeId(input.resourceId),
    normalizeId(input.targetUserId).toLowerCase(),
    normalizeId(input.actorUserId).toLowerCase(),
  ];
  return parts.join('::');
}

function buildVisibilityInput(
  targetUserId: string,
  visibility: AssignmentVisibilityContext,
): VisibilityMatrixInput {
  return {
    actorUserId: targetUserId,
    ownerUserId: visibility.ownerUserId,
    scope: visibility.scope,
    teamMemberIds: visibility.teamMemberIds,
    workspaceMemberIds: visibility.workspaceMemberIds,
    friendPairs: visibility.friendPairs,
    explicitAllowUserIds: visibility.explicitAllowUserIds,
    explicitDenyUserIds: visibility.explicitDenyUserIds,
  };
}

function createInboxItem(
  event: AssignmentPropagationEvent,
  visibilityDecision: VisibilityMatrixDecision,
): AssignmentInboxItem {
  const blocked = !event.allowed;
  const removed = event.action === 'unassign';
  return {
    id: `assignment-inbox::${event.targetUserId}::${event.resourceType}::${event.resourceId}`,
    userId: event.targetUserId,
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    taskId: event.taskId,
    eventId: event.id,
    lastAction: event.action,
    state: blocked ? 'blocked' : removed ? 'removed' : 'active',
    visible: visibilityDecision.visible,
    visibilityReasonCode: visibilityDecision.reasonCode,
    updatedAt: event.timestamp,
  };
}

function sortEventsDeterministically(events: AssignmentPropagationEvent[]): AssignmentPropagationEvent[] {
  return sortEventsDeterministicallyCore(events) as AssignmentPropagationEvent[];
}

function toResourceKey(eventOrItem: { userId: string; resourceType: string; resourceId: string }): string {
  return toAssignmentResourceKey(eventOrItem as any);
}

export function enqueueAssignmentPropagation(input: EnqueueAssignmentPropagationInput): {
  event: AssignmentPropagationEvent;
  inboxItem: AssignmentInboxItem | null;
  deduped: boolean;
} {
  const store = readStore();
  const idempotencyKey = normalizeId(input.idempotencyKey) || buildDefaultIdempotencyKey(input);

  if (store.idempotencyKeys.includes(idempotencyKey)) {
    const existingEvent = [...store.outbox].reverse().find((event) => event.idempotencyKey === idempotencyKey);
    if (existingEvent) {
      const existingInbox = [...store.inbox].reverse().find((item) => item.eventId === existingEvent.id);
      return { event: existingEvent, inboxItem: existingInbox || null, deduped: true };
    }
  }

  const nextSequence = store.sequence + 1;
  const timestamp = new Date().toISOString();
  const event: AssignmentPropagationEvent = {
    id: `assignment-outbox-${nextSequence}-${Math.random().toString(36).slice(2, 8)}`,
    idempotencyKey,
    sequence: nextSequence,
    timestamp,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: normalizeId(input.resourceId),
    taskId: normalizeId(input.taskId) || normalizeId(input.resourceId),
    actorUserId: normalizeId(input.actorUserId),
    targetUserId: normalizeId(input.targetUserId),
    targetName: normalizeId(input.targetName) || undefined,
    targetRole: normalizeId(input.targetRole) || undefined,
    allowed: Boolean(input.allowed),
    scope: input.visibility.scope,
    workspaceId: normalizeId(input.workspaceId) || undefined,
    teamId: normalizeId(input.teamId) || undefined,
  };

  store.outbox.push(event);
  store.idempotencyKeys.push(idempotencyKey);
  store.sequence = nextSequence;

  const visibilityDecision = evaluateCrossUserVisibilityMatrix(
    buildVisibilityInput(event.targetUserId, input.visibility),
  );
  const inboxItem = createInboxItem(event, visibilityDecision);

  const existingInboxIndex = store.inbox.findIndex((item) => item.id === inboxItem.id);
  if (existingInboxIndex >= 0) {
    store.inbox[existingInboxIndex] = inboxItem;
  } else {
    store.inbox.push(inboxItem);
  }

  writeStore(store);
  return { event, inboxItem, deduped: false };
}

export function getAssignmentPropagationOutbox(): AssignmentPropagationEvent[] {
  return readStore().outbox;
}

export function getAssignmentPropagationInboxForUser(userId: string): AssignmentInboxItem[] {
  const normalized = normalizeId(userId);
  return readStore()
    .inbox
    .filter((item) => normalizeId(item.userId) === normalized)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function buildAssignmentProjectionForUser(
  userId: string,
  events: AssignmentPropagationEvent[],
): AssignmentProjectionSnapshot {
  return buildAssignmentProjectionForUserCore(userId, events as any) as AssignmentProjectionSnapshot;
}

export function getAssignmentProjectionForUser(userId: string): AssignmentProjectionSnapshot {
  const store = readStore();
  const projection = buildAssignmentProjectionForUser(userId, store.outbox);
  const inbox = getAssignmentPropagationInboxForUser(userId);

  const convergedWithInbox = evaluateProjectionConvergenceCore(projection as any, inbox as any);

  return {
    ...projection,
    convergedWithInbox,
  };
}

export function getAssignmentPropagationConsistencyReport(userIds?: string[]) {
  const normalizedUserIds = (userIds || [])
    .map((value) => normalizeId(value))
    .filter(Boolean);
  const store = readStore();
  const resolvedUserIds =
    normalizedUserIds.length > 0
      ? normalizedUserIds
      : Array.from(new Set(store.outbox.map((event) => normalizeId(event.targetUserId)).filter(Boolean)));

  const projections = resolvedUserIds.map((id) => getAssignmentProjectionForUser(id));
  const convergedUsers = projections.filter((snapshot) => snapshot.convergedWithInbox).length;
  return {
    totalUsers: projections.length,
    convergedUsers,
    nonConvergedUsers: projections.length - convergedUsers,
    convergenceRate: projections.length ? convergedUsers / projections.length : 1,
    projections,
  };
}

export function repairAssignmentPropagationInboxForUser(userId: string) {
  const normalizedUserId = normalizeId(userId);
  const store = readStore();
  const projection = buildAssignmentProjectionForUser(normalizedUserId, store.outbox);
  const existingInbox = getAssignmentPropagationInboxForUser(normalizedUserId);
  const repaired = repairProjectionInboxCore(projection as any, existingInbox as any);

  const nonUserInboxItems = store.inbox.filter((item) => normalizeId(item.userId) !== normalizedUserId);
  store.inbox = [...nonUserInboxItems, ...(repaired.items as AssignmentInboxItem[])].slice(-MAX_INBOX_ITEMS);
  writeStore(store);

  return {
    userId: normalizedUserId,
    changed: repaired.changed,
    convergedWithInbox: repaired.converged,
    repairedItems: repaired.items.length,
  };
}

export function clearAssignmentPropagationStore(): void {
  safeRemoveItem(STORAGE_KEY);
}
