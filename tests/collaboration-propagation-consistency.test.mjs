import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAssignmentProjectionForUser,
  evaluateProjectionConvergence,
  repairProjectionInbox,
  sortEventsDeterministically,
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

test('deterministic replay converges on latest per-resource state', () => {
  const events = [
    event({
      id: 'evt-3',
      action: 'assign',
      sequence: 3,
      timestamp: '2026-03-06T12:00:03.000Z',
    }),
    event({
      id: 'evt-1',
      action: 'assign',
      sequence: 1,
      timestamp: '2026-03-06T12:00:01.000Z',
    }),
    event({
      id: 'evt-2',
      action: 'unassign',
      sequence: 2,
      timestamp: '2026-03-06T12:00:02.000Z',
    }),
  ];

  const ordered = sortEventsDeterministically(events);
  assert.deepEqual(
    ordered.map((item) => item.id),
    ['evt-1', 'evt-2', 'evt-3'],
  );

  const projection = buildAssignmentProjectionForUser('user-b', events);
  assert.equal(projection.latestSequence, 3);
  assert.equal(projection.totalUserEvents, 3);
  assert.deepEqual(projection.activeTaskIds, ['task-1']);
  assert.equal(projection.removedTaskIds.length, 0);
});

test('blocked + unassign offboarding replay leaves resource removed', () => {
  const events = [
    event({
      id: 'evt-1',
      taskId: 'task-offboard',
      action: 'assign',
      sequence: 11,
      timestamp: '2026-03-06T12:01:01.000Z',
    }),
    event({
      id: 'evt-2',
      taskId: 'task-offboard',
      action: 'assign',
      allowed: false,
      decisionReasonCode: 'deny_not_workspace_member',
      sequence: 12,
      timestamp: '2026-03-06T12:01:02.000Z',
    }),
    event({
      id: 'evt-3',
      taskId: 'task-offboard',
      action: 'unassign',
      allowed: true,
      sequence: 13,
      timestamp: '2026-03-06T12:01:03.000Z',
    }),
  ];

  const projection = buildAssignmentProjectionForUser('user-b', events);
  assert.equal(projection.activeTaskIds.length, 0);
  assert.deepEqual(projection.removedTaskIds, ['task-offboard']);
  assert.equal(projection.blockedTaskIds.length, 0);
});

test('multi-user reassign isolates each user projection deterministically', () => {
  const events = [
    event({
      id: 'evt-1',
      taskId: 'task-r',
      targetUserId: 'user-b',
      action: 'assign',
      sequence: 21,
      timestamp: '2026-03-06T12:02:01.000Z',
    }),
    event({
      id: 'evt-2',
      taskId: 'task-r',
      targetUserId: 'user-b',
      action: 'unassign',
      sequence: 22,
      timestamp: '2026-03-06T12:02:02.000Z',
    }),
    event({
      id: 'evt-3',
      taskId: 'task-r',
      targetUserId: 'user-c',
      action: 'assign',
      sequence: 23,
      timestamp: '2026-03-06T12:02:03.000Z',
    }),
  ];

  const projectionB = buildAssignmentProjectionForUser('user-b', events);
  const projectionC = buildAssignmentProjectionForUser('user-c', events);
  assert.equal(projectionB.activeTaskIds.length, 0);
  assert.deepEqual(projectionB.removedTaskIds, ['task-r']);
  assert.deepEqual(projectionC.activeTaskIds, ['task-r']);
  assert.equal(projectionC.removedTaskIds.length, 0);
});

test('convergence check detects inbox drift and passes when reconciled', () => {
  const events = [
    event({
      id: 'evt-1',
      taskId: 'task-c1',
      sequence: 31,
      timestamp: '2026-03-06T12:03:01.000Z',
    }),
    event({
      id: 'evt-2',
      taskId: 'task-c2',
      sequence: 32,
      timestamp: '2026-03-06T12:03:02.000Z',
    }),
  ];
  const projection = buildAssignmentProjectionForUser('user-b', events);

  const driftedInbox = [
    {
      userId: 'user-b',
      taskId: 'task-c1',
      resourceType: 'task',
      resourceId: 'task-c1',
      state: 'active',
    },
  ];
  assert.equal(evaluateProjectionConvergence(projection, driftedInbox), false);

  const reconciledInbox = [
    {
      userId: 'user-b',
      taskId: 'task-c1',
      resourceType: 'task',
      resourceId: 'task-c1',
      state: 'active',
    },
    {
      userId: 'user-b',
      taskId: 'task-c2',
      resourceType: 'task',
      resourceId: 'task-c2',
      state: 'active',
    },
  ];
  assert.equal(evaluateProjectionConvergence(projection, reconciledInbox), true);
});

test('cross-user replay window matches full-stream terminal state', () => {
  const events = [
    event({
      id: 'evt-1',
      taskId: 'task-w1',
      targetUserId: 'user-b',
      action: 'assign',
      sequence: 41,
      timestamp: '2026-03-06T12:04:01.000Z',
    }),
    event({
      id: 'evt-2',
      taskId: 'task-w1',
      targetUserId: 'user-b',
      action: 'unassign',
      sequence: 42,
      timestamp: '2026-03-06T12:04:02.000Z',
    }),
    event({
      id: 'evt-3',
      taskId: 'task-w1',
      targetUserId: 'user-b',
      action: 'assign',
      sequence: 43,
      timestamp: '2026-03-06T12:04:03.000Z',
    }),
    event({
      id: 'evt-4',
      taskId: 'task-w2',
      targetUserId: 'user-c',
      action: 'assign',
      sequence: 44,
      timestamp: '2026-03-06T12:04:04.000Z',
    }),
    event({
      id: 'evt-5',
      taskId: 'task-w2',
      targetUserId: 'user-c',
      action: 'unassign',
      sequence: 45,
      timestamp: '2026-03-06T12:04:05.000Z',
    }),
    event({
      id: 'evt-6',
      taskId: 'task-w2',
      targetUserId: 'user-c',
      action: 'assign',
      sequence: 46,
      timestamp: '2026-03-06T12:04:06.000Z',
    }),
  ];

  const replayWindow = events.slice(-4);
  const fullB = buildAssignmentProjectionForUser('user-b', events);
  const fullC = buildAssignmentProjectionForUser('user-c', events);
  const windowB = buildAssignmentProjectionForUser('user-b', replayWindow);
  const windowC = buildAssignmentProjectionForUser('user-c', replayWindow);

  assert.deepEqual(windowB.activeTaskIds, fullB.activeTaskIds);
  assert.deepEqual(windowB.removedTaskIds, fullB.removedTaskIds);
  assert.deepEqual(windowC.activeTaskIds, fullC.activeTaskIds);
  assert.deepEqual(windowC.removedTaskIds, fullC.removedTaskIds);
});

test('replay tie-breaker is deterministic when sequence matches', () => {
  const sameSequenceEvents = [
    event({
      id: 'evt-z',
      taskId: 'task-tie',
      targetUserId: 'user-b',
      action: 'unassign',
      sequence: 50,
      timestamp: '2026-03-06T12:05:00.000Z',
    }),
    event({
      id: 'evt-a',
      taskId: 'task-tie',
      targetUserId: 'user-b',
      action: 'assign',
      sequence: 50,
      timestamp: '2026-03-06T12:05:00.000Z',
    }),
  ];

  const ordered = sortEventsDeterministically(sameSequenceEvents);
  assert.deepEqual(
    ordered.map((item) => item.id),
    ['evt-a', 'evt-z'],
  );

  const projection = buildAssignmentProjectionForUser('user-b', sameSequenceEvents);
  assert.deepEqual(projection.activeTaskIds, []);
  assert.deepEqual(projection.removedTaskIds, ['task-tie']);
});

test('inbox repair reconciles drift to deterministic projection', () => {
  const events = [
    event({
      id: 'evt-61',
      taskId: 'task-r1',
      targetUserId: 'user-b',
      action: 'assign',
      sequence: 61,
      timestamp: '2026-03-06T12:06:01.000Z',
    }),
    event({
      id: 'evt-62',
      taskId: 'task-r2',
      targetUserId: 'user-b',
      action: 'unassign',
      sequence: 62,
      timestamp: '2026-03-06T12:06:02.000Z',
    }),
  ];

  const projection = buildAssignmentProjectionForUser('user-b', events);
  const driftedInbox = [
    {
      id: 'assignment-inbox::user-b::task::task-r1',
      userId: 'user-b',
      taskId: 'task-r1',
      resourceType: 'task',
      resourceId: 'task-r1',
      state: 'removed',
    },
  ];

  assert.equal(evaluateProjectionConvergence(projection, driftedInbox), false);
  const repaired = repairProjectionInbox(projection, driftedInbox);
  assert.equal(repaired.changed, true);
  assert.equal(repaired.converged, true);
  assert.equal(evaluateProjectionConvergence(projection, repaired.items), true);
});

test('repeated repair cycles are idempotent after first reconciliation', () => {
  const events = [
    event({
      id: 'evt-71',
      taskId: 'task-s1',
      targetUserId: 'user-c',
      action: 'assign',
      sequence: 71,
      timestamp: '2026-03-06T12:07:01.000Z',
    }),
    event({
      id: 'evt-72',
      taskId: 'task-s2',
      targetUserId: 'user-c',
      action: 'assign',
      sequence: 72,
      timestamp: '2026-03-06T12:07:02.000Z',
    }),
    event({
      id: 'evt-73',
      taskId: 'task-s1',
      targetUserId: 'user-c',
      action: 'unassign',
      sequence: 73,
      timestamp: '2026-03-06T12:07:03.000Z',
    }),
  ];
  const projection = buildAssignmentProjectionForUser('user-c', events);
  let inboxState = [
    {
      id: 'assignment-inbox::user-c::task::task-s1',
      userId: 'user-c',
      taskId: 'task-s1',
      resourceType: 'task',
      resourceId: 'task-s1',
      state: 'active',
    },
  ];

  const firstPass = repairProjectionInbox(projection, inboxState);
  assert.equal(firstPass.changed, true);
  assert.equal(firstPass.converged, true);
  inboxState = firstPass.items;

  const secondPass = repairProjectionInbox(projection, inboxState);
  assert.equal(secondPass.changed, false);
  assert.equal(secondPass.converged, true);
  assert.deepEqual(secondPass.items, inboxState);
});
