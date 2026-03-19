function normalizeId(value) {
  return String(value || '').trim().toLowerCase();
}

export function toAssignmentResourceKey(eventOrItem) {
  return `assignment-inbox::${eventOrItem.userId}::${eventOrItem.resourceType}::${eventOrItem.resourceId}`;
}

export function sortEventsDeterministically(events) {
  return [...events].sort((a, b) => {
    if ((a.sequence || 0) !== (b.sequence || 0)) return (a.sequence || 0) - (b.sequence || 0);
    if ((a.timestamp || '') !== (b.timestamp || '')) return (a.timestamp || '') < (b.timestamp || '') ? -1 : 1;
    return String(a.id || '').localeCompare(String(b.id || ''));
  });
}

export function buildAssignmentProjectionForUser(userId, events) {
  const normalizedUserId = normalizeId(userId);
  const ordered = sortEventsDeterministically(events).filter(
    (event) => normalizeId(event.targetUserId) === normalizedUserId,
  );

  const stateByResource = new Map();
  ordered.forEach((event) => {
    const resourceKey = toAssignmentResourceKey({
      userId: event.targetUserId,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
    });
    const state = !event.allowed
      ? 'blocked'
      : event.action === 'unassign'
        ? 'removed'
        : 'active';
    stateByResource.set(resourceKey, {
      taskId: String(event.taskId || ''),
      state,
      sequence: Number(event.sequence || 0),
    });
  });

  const activeTaskIds = new Set();
  const removedTaskIds = new Set();
  const blockedTaskIds = new Set();
  const activeResourceKeys = [];
  const removedResourceKeys = [];
  const blockedResourceKeys = [];

  stateByResource.forEach((value, key) => {
    if (value.state === 'active') {
      if (value.taskId) activeTaskIds.add(value.taskId);
      activeResourceKeys.push(key);
      return;
    }
    if (value.state === 'removed') {
      if (value.taskId) removedTaskIds.add(value.taskId);
      removedResourceKeys.push(key);
      return;
    }
    if (value.taskId) blockedTaskIds.add(value.taskId);
    blockedResourceKeys.push(key);
  });

  const latestSequence = ordered.length ? Number(ordered[ordered.length - 1].sequence || 0) : 0;
  return {
    userId: normalizedUserId,
    activeTaskIds: Array.from(activeTaskIds),
    removedTaskIds: Array.from(removedTaskIds),
    blockedTaskIds: Array.from(blockedTaskIds),
    activeResourceKeys,
    removedResourceKeys,
    blockedResourceKeys,
    latestSequence,
    totalUserEvents: ordered.length,
    convergedWithInbox: false,
  };
}

export function evaluateProjectionConvergence(projection, inboxItems) {
  const inboxByResourceKey = new Map();
  (inboxItems || []).forEach((item) => {
    inboxByResourceKey.set(toAssignmentResourceKey(item), item);
  });

  const expectedByResourceKey = new Map();
  (projection.activeResourceKeys || []).forEach((key) => expectedByResourceKey.set(key, { state: 'active' }));
  (projection.removedResourceKeys || []).forEach((key) => expectedByResourceKey.set(key, { state: 'removed' }));
  (projection.blockedResourceKeys || []).forEach((key) => expectedByResourceKey.set(key, { state: 'blocked' }));

  return (
    expectedByResourceKey.size === inboxByResourceKey.size &&
    Array.from(expectedByResourceKey.entries()).every(([resourceKey, expected]) => {
      const actual = inboxByResourceKey.get(resourceKey);
      return Boolean(actual && actual.state === expected.state);
    })
  );
}

function parseResourceKey(resourceKey) {
  const [prefix, userId, resourceType, ...resourceIdParts] = String(resourceKey || '').split('::');
  if (prefix !== 'assignment-inbox' || !userId || !resourceType || resourceIdParts.length === 0) {
    return null;
  }
  return {
    userId,
    resourceType,
    resourceId: resourceIdParts.join('::'),
  };
}

export function repairProjectionInbox(projection, inboxItems) {
  const existingByKey = new Map();
  (inboxItems || []).forEach((item) => {
    existingByKey.set(toAssignmentResourceKey(item), item);
  });

  const expectedStates = new Map();
  (projection.activeResourceKeys || []).forEach((key) => expectedStates.set(key, 'active'));
  (projection.removedResourceKeys || []).forEach((key) => expectedStates.set(key, 'removed'));
  (projection.blockedResourceKeys || []).forEach((key) => expectedStates.set(key, 'blocked'));

  const now = new Date().toISOString();
  const repairedItems = Array.from(expectedStates.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([resourceKey, state]) => {
      const parsed = parseResourceKey(resourceKey);
      if (!parsed) return null;
      const existing = existingByKey.get(resourceKey);
      return {
        id: resourceKey,
        userId: parsed.userId,
        resourceType: parsed.resourceType,
        resourceId: parsed.resourceId,
        taskId: String(existing?.taskId || parsed.resourceId || ''),
        eventId: String(existing?.eventId || ''),
        lastAction: String(existing?.lastAction || 'assign'),
        state,
        visible: existing?.visible ?? true,
        visibilityReasonCode: String(existing?.visibilityReasonCode || 'allow_workspace_member'),
        updatedAt: String(existing?.updatedAt || now),
      };
    })
    .filter(Boolean);

  const changed =
    repairedItems.length !== (inboxItems || []).length ||
    !repairedItems.every((item) => {
      const existing = existingByKey.get(toAssignmentResourceKey(item));
      return Boolean(existing && existing.state === item.state);
    });

  return {
    converged: evaluateProjectionConvergence(projection, repairedItems),
    changed,
    items: repairedItems,
  };
}
