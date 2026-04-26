import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAssignmentProjectionForUser,
  evaluateProjectionConvergence,
  repairProjectionInbox,
} from '../src/utils/assignment-propagation-core.mjs';

function event(overrides = {}) {
  return {
    id: overrides.id || 'evt-1',
    taskId: overrides.taskId || 'task-1',
    resourceType: overrides.resourceType || 'task',
    resourceId: overrides.resourceId || (overrides.taskId || 'task-1'),
    action: overrides.action || 'assign',
    targetUserId: overrides.targetUserId || 'user-b',
    actorUserId: overrides.actorUserId || 'user-a',
    ownerUserId: overrides.ownerUserId || 'user-a',
    visibilityScope: overrides.visibilityScope || 'workspace',
    allowed: overrides.allowed ?? true,
    decisionReasonCode: overrides.decisionReasonCode || 'allow_workspace_member',
    sequence: overrides.sequence ?? 1,
    timestamp: overrides.timestamp || '2026-03-06T12:00:00.000Z',
  };
}

function synthesizeEvents() {
  return [
    event({ id: 'evt-001', taskId: 'task-a', targetUserId: 'user-b', action: 'assign', sequence: 1 }),
    event({ id: 'evt-002', taskId: 'task-a', targetUserId: 'user-b', action: 'unassign', sequence: 2 }),
    event({ id: 'evt-003', taskId: 'task-a', targetUserId: 'user-b', action: 'assign', sequence: 3 }),
    event({ id: 'evt-004', taskId: 'task-b', targetUserId: 'user-b', action: 'assign', sequence: 4 }),
    event({ id: 'evt-005', taskId: 'task-c', targetUserId: 'user-c', action: 'assign', sequence: 5 }),
    event({ id: 'evt-006', taskId: 'task-b', targetUserId: 'user-b', action: 'unassign', sequence: 6 }),
    event({ id: 'evt-007', taskId: 'task-c', targetUserId: 'user-c', action: 'unassign', sequence: 7 }),
    event({ id: 'evt-008', taskId: 'task-d', targetUserId: 'user-c', action: 'assign', sequence: 8 }),
    event({ id: 'evt-009', taskId: 'task-b', targetUserId: 'user-b', action: 'assign', sequence: 9 }),
    event({ id: 'evt-010', taskId: 'task-d', targetUserId: 'user-c', action: 'assign', sequence: 10, allowed: false }),
    event({ id: 'evt-011', taskId: 'task-e', targetUserId: 'user-c', action: 'assign', sequence: 11 }),
    event({ id: 'evt-012', taskId: 'task-e', targetUserId: 'user-c', action: 'unassign', sequence: 12 }),
  ];
}

function injectDeterministicDrift(inboxItems, cycle) {
  if (!inboxItems.length) return inboxItems;
  const next = inboxItems.map((item) => ({ ...item }));
  const index = cycle % next.length;
  const item = next[index];
  item.state = item.state === 'active' ? 'removed' : 'active';
  if (cycle % 3 === 0) {
    next.pop();
  }
  return next;
}

test('replay soak: repeated refresh cycles repair drift and stay converged', () => {
  const events = synthesizeEvents();
  const projectionB = buildAssignmentProjectionForUser('user-b', events);
  const projectionC = buildAssignmentProjectionForUser('user-c', events);

  let inboxB = [];
  let inboxC = [];

  for (let cycle = 0; cycle < 25; cycle += 1) {
    inboxB = injectDeterministicDrift(inboxB, cycle);
    inboxC = injectDeterministicDrift(inboxC, cycle + 1);

    const repairedB = repairProjectionInbox(projectionB, inboxB);
    const repairedC = repairProjectionInbox(projectionC, inboxC);

    assert.equal(repairedB.converged, true);
    assert.equal(repairedC.converged, true);
    assert.equal(evaluateProjectionConvergence(projectionB, repairedB.items), true);
    assert.equal(evaluateProjectionConvergence(projectionC, repairedC.items), true);

    // Simulate immediate post-refresh check; second pass should be idempotent.
    const verifyB = repairProjectionInbox(projectionB, repairedB.items);
    const verifyC = repairProjectionInbox(projectionC, repairedC.items);
    assert.equal(verifyB.changed, false);
    assert.equal(verifyC.changed, false);

    inboxB = repairedB.items;
    inboxC = repairedC.items;
  }
});

test('replay soak: trailing replay windows preserve terminal state', () => {
  const events = synthesizeEvents();
  const fullProjectionB = buildAssignmentProjectionForUser('user-b', events);
  const fullProjectionC = buildAssignmentProjectionForUser('user-c', events);

  // Windows must include the terminal event for each tracked resource.
  const trailingWindows = [10, 11, 12];
  trailingWindows.forEach((windowSize) => {
    const windowEvents = events.slice(-windowSize);
    const projectionB = buildAssignmentProjectionForUser('user-b', windowEvents);
    const projectionC = buildAssignmentProjectionForUser('user-c', windowEvents);

    assert.deepEqual(projectionB.activeTaskIds, fullProjectionB.activeTaskIds);
    assert.deepEqual(projectionB.removedTaskIds, fullProjectionB.removedTaskIds);
    assert.deepEqual(projectionB.blockedTaskIds, fullProjectionB.blockedTaskIds);

    assert.deepEqual(projectionC.activeTaskIds, fullProjectionC.activeTaskIds);
    assert.deepEqual(projectionC.removedTaskIds, fullProjectionC.removedTaskIds);
    assert.deepEqual(projectionC.blockedTaskIds, fullProjectionC.blockedTaskIds);
  });
});
