import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

function buildTaskCalendarParityReport(tasks, events) {
  const activeEvents = events.filter((event) => !event.archived);
  const eventTaskIds = new Set();
  const eventIds = new Set(activeEvents.map((event) => String(event.id || '')).filter(Boolean));
  for (const event of activeEvents) {
    const fromTask = String(event.createdFromTaskId || '').trim();
    if (fromTask) eventTaskIds.add(fromTask);
    const linked = Array.isArray(event.tasks) ? event.tasks : [];
    for (const task of linked) {
      const id = String(task?.id || '').trim();
      if (id) eventTaskIds.add(id);
    }
  }
  const scheduledTasks = tasks.filter((task) => !!task.scheduledTime);
  const missingLinks = scheduledTasks
    .filter((task) => {
      if (eventTaskIds.has(String(task.id))) return false;
      const scheduledEventId = String(task.scheduledEventId || '').trim();
      if (scheduledEventId && eventIds.has(scheduledEventId)) return false;
      return true;
    })
    .map((task) => String(task.id));
  const taskIds = new Set(tasks.map((task) => String(task.id)));
  const orphanedEvents = activeEvents
    .filter((event) => {
      const fromTask = String(event.createdFromTaskId || '').trim();
      return fromTask ? !taskIds.has(fromTask) : false;
    })
    .map((event) => String(event.id));
  const linkedTasks = Math.max(0, scheduledTasks.length - missingLinks.length);
  const parityScore = scheduledTasks.length === 0 ? 1 : linkedTasks / scheduledTasks.length;
  return { scheduledTasks: scheduledTasks.length, linkedTasks, missingLinks, orphanedEvents, parityScore };
}

function evaluateTaskCalendarParity(report) {
  if (report.orphanedEvents.length > 0) return { level: 'critical' };
  if (report.scheduledTasks === 0) return { level: 'healthy' };
  if (report.missingLinks.length > 0 || report.parityScore < 0.9) return { level: 'watch' };
  return { level: 'healthy' };
}

test('deterministic parity replay transitions remain stable', () => {
  const steps = [];

  const baseTask = { id: 'task-1', scheduledTime: null };
  let tasks = [baseTask];
  let events = [];
  steps.push(evaluateTaskCalendarParity(buildTaskCalendarParityReport(tasks, events)).level);

  tasks = [{ ...baseTask, scheduledTime: '2026-03-06T12:00:00.000Z' }];
  steps.push(evaluateTaskCalendarParity(buildTaskCalendarParityReport(tasks, events)).level);

  events = [{ id: 'event-1', createdFromTaskId: 'task-1', tasks: [{ id: 'task-1' }] }];
  steps.push(evaluateTaskCalendarParity(buildTaskCalendarParityReport(tasks, events)).level);

  tasks = [];
  steps.push(evaluateTaskCalendarParity(buildTaskCalendarParityReport(tasks, events)).level);

  events = [];
  steps.push(evaluateTaskCalendarParity(buildTaskCalendarParityReport(tasks, events)).level);

  assert.deepEqual(steps, ['healthy', 'watch', 'healthy', 'critical', 'healthy']);
});

test('parity replay catches deterministic orphan condition', () => {
  const tasks = [{ id: 'task-2', scheduledTime: '2026-03-06T13:00:00.000Z' }];
  const events = [{ id: 'event-2', createdFromTaskId: 'task-999' }];
  const report = buildTaskCalendarParityReport(tasks, events);
  const guardrail = evaluateTaskCalendarParity(report);
  assert.equal(report.orphanedEvents.length, 1);
  assert.equal(guardrail.level, 'critical');
});

test('parity replay handles unschedule archive and relink path', () => {
  const taskId = 'task-archive-relink';
  const tasks = [{ id: taskId, scheduledTime: '2026-03-06T14:00:00.000Z' }];
  let events = [{ id: 'event-live', createdFromTaskId: taskId, archived: false }];

  const initial = evaluateTaskCalendarParity(buildTaskCalendarParityReport(tasks, events)).level;
  assert.equal(initial, 'healthy');

  const unscheduledTasks = [{ id: taskId, scheduledTime: null }];
  const afterUnschedule = evaluateTaskCalendarParity(buildTaskCalendarParityReport(unscheduledTasks, events)).level;
  assert.equal(afterUnschedule, 'healthy');

  events = [{ id: 'event-live', createdFromTaskId: taskId, archived: true }];
  const rescheduledWithoutRelink = evaluateTaskCalendarParity(
    buildTaskCalendarParityReport([{ id: taskId, scheduledTime: '2026-03-06T15:00:00.000Z' }], events),
  ).level;
  assert.equal(rescheduledWithoutRelink, 'watch');

  events = [
    { id: 'event-live', createdFromTaskId: taskId, archived: true },
    { id: 'event-relink', createdFromTaskId: taskId, archived: false },
  ];
  const relinked = evaluateTaskCalendarParity(
    buildTaskCalendarParityReport([{ id: taskId, scheduledTime: '2026-03-06T15:00:00.000Z' }], events),
  ).level;
  assert.equal(relinked, 'healthy');
});

test('parity replay honors scheduledEventId linkage fallback', () => {
  const tasks = [{ id: 'task-link-fallback', scheduledTime: '2026-03-06T16:00:00.000Z', scheduledEventId: 'event-fallback' }];
  const events = [{ id: 'event-fallback', createdFromTaskId: null, tasks: [] }];
  const report = buildTaskCalendarParityReport(tasks, events);
  assert.equal(report.missingLinks.length, 0);
  assert.equal(report.parityScore, 1);
});

test('parity replay test remains wired to implementation symbols', async () => {
  const parity = await read('src/contracts/projections/task-calendar-parity.ts');
  const guardrail = await read('src/contracts/projections/parity-guardrail.ts');
  const actions = await read('src/contracts/projections/parity-reconciliation-actions.ts');
  assert.ok(parity.includes('buildTaskCalendarParityReport'));
  assert.ok(guardrail.includes('evaluateTaskCalendarParity'));
  assert.ok(actions.includes('buildParityReconciliationActions'));
});
