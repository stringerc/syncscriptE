import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const visibilityMatrix = readFileSync(
  new URL('../src/utils/cross-user-visibility.ts', import.meta.url),
  'utf8'
);
const propagationBus = readFileSync(
  new URL('../src/utils/assignment-propagation.ts', import.meta.url),
  'utf8'
);
const taskDetailModal = readFileSync(
  new URL('../src/components/TaskDetailModal.tsx', import.meta.url),
  'utf8'
);
const tasksGoalsPage = readFileSync(
  new URL('../src/components/pages/TasksGoalsPage.tsx', import.meta.url),
  'utf8'
);
const calendarEventsPage = readFileSync(
  new URL('../src/components/pages/CalendarEventsPage.tsx', import.meta.url),
  'utf8'
);
const enterpriseChatTab = readFileSync(
  new URL('../src/components/enterprise/EnterpriseChatTab.tsx', import.meta.url),
  'utf8'
);

test('EX-047 visibility matrix exists with deny-by-default outcomes', () => {
  assert.match(visibilityMatrix, /export type CollaborationVisibilityScope/);
  assert.match(visibilityMatrix, /evaluateCrossUserVisibilityMatrix/);
  assert.match(visibilityMatrix, /deny_private_non_owner/);
  assert.match(visibilityMatrix, /deny_not_team_member/);
});

test('EX-048 propagation bus defines outbox and inbox contracts', () => {
  assert.match(propagationBus, /AssignmentPropagationEvent/);
  assert.match(propagationBus, /AssignmentInboxItem/);
  assert.match(propagationBus, /enqueueAssignmentPropagation/);
  assert.match(propagationBus, /getAssignmentPropagationOutbox/);
  assert.match(propagationBus, /getAssignmentPropagationInboxForUser/);
  assert.match(propagationBus, /getAssignmentProjectionForUser/);
  assert.match(propagationBus, /getAssignmentPropagationConsistencyReport/);
});

test('EX-052 deterministic projection controls are present', () => {
  assert.match(propagationBus, /idempotencyKey/);
  assert.match(propagationBus, /sequence/);
  assert.match(propagationBus, /deduped/);
  assert.match(propagationBus, /buildAssignmentProjectionForUser/);
  assert.match(propagationBus, /convergedWithInbox/);
  assert.match(propagationBus, /sortEventsDeterministically/);
  assert.match(propagationBus, /repairAssignmentPropagationInboxForUser/);
});

test('Task detail assignments emit propagation events', () => {
  assert.match(taskDetailModal, /emitAssignmentPropagation/);
  assert.match(taskDetailModal, /enqueueAssignmentPropagation/);
  assert.match(taskDetailModal, /resourceType: 'milestone'/);
  assert.match(taskDetailModal, /resourceType: 'step'/);
  assert.match(taskDetailModal, /resourceType: 'task'/);
});

test('EX-050 assigned surface consumes inbox projection', () => {
  assert.match(tasksGoalsPage, /getAssignmentProjectionForUser/);
  assert.match(tasksGoalsPage, /Assigned to Me/);
  assert.match(tasksGoalsPage, /activeViewFilter === 'assigned'/);
});

test('EX-050 calendar and chat surfaces consume inbox projection', () => {
  assert.match(calendarEventsPage, /getAssignmentProjectionForUser/);
  assert.match(calendarEventsPage, /unscheduledViewFilter/);
  assert.match(calendarEventsPage, /taskFilter=\{unscheduledViewFilter === 'assigned'/);
  assert.match(enterpriseChatTab, /getAssignmentProjectionForUser/);
  assert.match(enterpriseChatTab, /Assigned to You Snapshot/);
  assert.match(enterpriseChatTab, /convergence:/);
});
