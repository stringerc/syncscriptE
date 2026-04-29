/**
 * Contract: dashboard schedule demos never drive "What should I do?" ranking,
 * and projection metadata matches merge semantics.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveDashboardScheduleProjection,
  listOpenUserTasks,
  isDashboardDemoTask,
  withDashboardScheduleDemoFallback,
} from '../src/utils/dashboard-schedule-demo';
import { getTopPriorityTasks } from '../src/utils/intelligent-task-selector';

const makeTask = (id: string, overrides: Record<string, unknown> = {}) =>
  ({
    id,
    title: 't',
    completed: false,
    ...overrides,
  }) as import('../src/types/task').Task;

test('demo-only schedule: getTopPriorityTasks returns no rows', () => {
  const { scheduleTasks, demoFallbackActive } = resolveDashboardScheduleProjection([], {
    hasEstablishedTaskHistory: false,
  });
  assert.equal(demoFallbackActive, true);
  assert.ok(scheduleTasks.length > 0);
  assert.ok(scheduleTasks.every((t) => isDashboardDemoTask(t)));
  const ranked = getTopPriorityTasks(scheduleTasks, 3);
  assert.equal(ranked.length, 0);
});

test('mixed is impossible from projection — open real user task keeps demos off list', () => {
  const { scheduleTasks, demoFallbackActive } = resolveDashboardScheduleProjection(
    [makeTask('real-1', { title: 'Do the thing' })],
    { hasEstablishedTaskHistory: false },
  );
  assert.equal(demoFallbackActive, false);
  assert.ok(!scheduleTasks.some(isDashboardDemoTask));
  const ranked = getTopPriorityTasks(scheduleTasks, 2);
  assert.equal(ranked[0]?.task.id, 'real-1');
});

test('listOpenUserTasks excludes demos and completed', () => {
  const demos = resolveDashboardScheduleProjection([], { hasEstablishedTaskHistory: false })
    .scheduleTasks;
  const mixed = [...demos.slice(0, 1), makeTask('u1', { title: 'User open' })];
  const open = listOpenUserTasks(mixed);
  assert.ok(open.every((t) => t.id === 'u1'));
});

test('projection.scheduleTasks matches withDashboardScheduleDemoFallback', () => {
  const a = resolveDashboardScheduleProjection([], { hasEstablishedTaskHistory: false })
    .scheduleTasks;
  const b = withDashboardScheduleDemoFallback([], { hasEstablishedTaskHistory: false });
  assert.deepEqual(
    a.map((t) => t.id),
    b.map((t) => t.id),
  );
});
