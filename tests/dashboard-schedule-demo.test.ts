/**
 * Contract tests for dashboard schedule demo merge (empty vs. established user, all-complete).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  withDashboardScheduleDemoFallback,
  isDashboardDemoTask,
} from '../src/utils/dashboard-schedule-demo';

const makeTask = (id: string, overrides: Record<string, unknown> = {}) =>
  ({
    id,
    title: 't',
    completed: false,
    ...overrides,
  }) as import('../src/types/task').Task;

test('open real task: list unchanged', () => {
  const r = withDashboardScheduleDemoFallback([makeTask('a', { title: 'Open' })], {
    hasEstablishedTaskHistory: false,
  });
  assert.equal(r.length, 1);
  assert.equal(r[0].id, 'a');
});

test('all real tasks complete: no schedule demos appended', () => {
  const r = withDashboardScheduleDemoFallback(
    [makeTask('a', { completed: true, status: 'completed' })],
    { hasEstablishedTaskHistory: false },
  );
  assert.equal(r.length, 1);
  assert.equal(r[0].completed, true);
  assert.equal(isDashboardDemoTask(r[0]), false);
});

test('empty list, new user: demos present', () => {
  const r = withDashboardScheduleDemoFallback([], { hasEstablishedTaskHistory: false });
  assert.ok(r.length > 0);
  assert.ok(r.some((t) => isDashboardDemoTask(t)));
});

test('empty list, established user: no demos', () => {
  const r = withDashboardScheduleDemoFallback([], { hasEstablishedTaskHistory: true });
  assert.equal(r.length, 0);
});
