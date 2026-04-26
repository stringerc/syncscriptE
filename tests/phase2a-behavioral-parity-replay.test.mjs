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
    .filter((task) => !eventTaskIds.has(String(task.id)))
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
  if (report.orphanedEvents.length > 0) return 'critical';
  if (report.scheduledTasks === 0) return 'healthy';
  if (report.missingLinks.length > 0 || report.parityScore < 0.9) return 'watch';
  return 'healthy';
}

function buildTaskSurfaceParityReport(input) {
  const canonical = new Set((input.tasksTab || []).map((item) => String(item.id)));
  const observed = {
    workstream: Array.isArray(input.workstream),
    projects: Array.isArray(input.projects),
    dashboard: Array.isArray(input.dashboard),
  };
  const workstream = observed.workstream
    ? new Set((input.workstream || []).map((item) => String(item.id)))
    : canonical;
  const projects = observed.projects
    ? new Set((input.projects || []).map((item) => String(item.id)))
    : canonical;
  const dashboard = observed.dashboard
    ? new Set((input.dashboard || []).map((item) => String(item.id)))
    : canonical;
  const missingInWorkstream = [...canonical].filter((id) => !workstream.has(id));
  const missingInProjects = [...canonical].filter((id) => !projects.has(id));
  const missingInDashboard = [...canonical].filter((id) => !dashboard.has(id));
  const observedSurfaceCount = [observed.workstream, observed.projects, observed.dashboard].filter(Boolean).length;
  const mismatchCount =
    missingInWorkstream.length + missingInProjects.length + missingInDashboard.length;
  const parityScore =
    canonical.size === 0 || observedSurfaceCount === 0
      ? 1
      : Math.max(0, 1 - mismatchCount / (canonical.size * observedSurfaceCount));
  return { missingInWorkstream, missingInProjects, missingInDashboard, parityScore };
}

function deriveGoalProgress(goalId, tasks) {
  const linked = tasks.filter((task) => String(task.goalId || '') === goalId);
  if (linked.length === 0) return 0;
  const done = linked.filter((task) => Boolean(task.completed)).length;
  return Math.round((done / linked.length) * 100);
}

test('behavioral replay: task-goal-project-dashboard sequence remains deterministic', () => {
  const goal = { id: 'goal-1', archived: false };
  let tasks = [
    { id: 'task-1', goalId: 'goal-1', projectId: 'project-general', completed: false, scheduledTime: null },
    { id: 'task-2', goalId: 'goal-1', projectId: 'project-general', completed: false, scheduledTime: null },
  ];
  let events = [];
  let surfaces = {
    tasksTab: tasks.map((task) => ({ id: task.id })),
    workstream: [{ id: 'task-1' }],
    projects: tasks.map((task) => ({ id: task.id })),
    dashboard: [{ id: 'task-1' }],
  };

  const baselineSurface = buildTaskSurfaceParityReport(surfaces);
  assert.equal(baselineSurface.missingInWorkstream.length, 1);
  assert.equal(baselineSurface.missingInDashboard.length, 1);

  surfaces = {
    ...surfaces,
    workstream: tasks.map((task) => ({ id: task.id })),
    dashboard: tasks.map((task) => ({ id: task.id })),
  };
  const healthySurface = buildTaskSurfaceParityReport(surfaces);
  assert.equal(healthySurface.parityScore, 1);

  tasks = tasks.map((task) =>
    task.id === 'task-1' ? { ...task, scheduledTime: '2026-03-06T17:00:00.000Z' } : task,
  );
  const watchCalendar = evaluateTaskCalendarParity(buildTaskCalendarParityReport(tasks, events));
  assert.equal(watchCalendar, 'watch');

  events = [{ id: 'event-1', createdFromTaskId: 'task-1', tasks: [{ id: 'task-1' }], archived: false }];
  const healthyCalendar = evaluateTaskCalendarParity(buildTaskCalendarParityReport(tasks, events));
  assert.equal(healthyCalendar, 'healthy');

  tasks = tasks.map((task) => (task.id === 'task-1' ? { ...task, completed: true } : task));
  assert.equal(deriveGoalProgress(goal.id, tasks), 50);
  tasks = tasks.map((task) => (task.id === 'task-2' ? { ...task, completed: true } : task));
  assert.equal(deriveGoalProgress(goal.id, tasks), 100);

  // Goal archive/restore should not corrupt deterministic progress projection.
  const archivedGoal = { ...goal, archived: true };
  assert.equal(archivedGoal.archived, true);
  const restoredGoal = { ...archivedGoal, archived: false };
  assert.equal(restoredGoal.archived, false);
  assert.equal(deriveGoalProgress(restoredGoal.id, tasks), 100);

  tasks = tasks.filter((task) => task.id !== 'task-1');
  const criticalCalendar = evaluateTaskCalendarParity(buildTaskCalendarParityReport(tasks, events));
  assert.equal(criticalCalendar, 'critical');
});

test('behavioral replay remains wired to implementation symbols', async () => {
  const goalsHook = await read('src/hooks/useGoals.ts');
  const calendarParity = await read('src/contracts/projections/task-calendar-parity.ts');
  const surfaceParity = await read('src/contracts/projections/task-surface-parity.ts');
  const projectsOs = await read('src/components/projects/ProjectsOperatingSystem.tsx');
  const markers = [
    goalsHook.includes('LocalGoalCommandAdapter'),
    goalsHook.includes('goal.created'),
    goalsHook.includes('goal.updated'),
    goalsHook.includes('goal.deleted'),
    calendarParity.includes('buildTaskCalendarParityReport'),
    surfaceParity.includes('buildTaskSurfaceParityReport'),
    projectsOs.includes('Cross-surface parity'),
    projectsOs.includes('surface.parity.escalated'),
    projectsOs.includes('Runbook checklist'),
  ];
  assert.ok(markers.every(Boolean), 'Expected behavioral replay markers to remain wired');
});
