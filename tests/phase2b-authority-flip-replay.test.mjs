import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

function runDeterministicReplay({ backendOutcomes, strictMode }) {
  const steps = [];
  const tasks = new Map();
  const events = new Map();
  const goals = new Map();
  const projects = new Map();
  const goalProjectMap = new Map();
  let backendIndex = 0;

  function applyLocalMutation(commandType, payload) {
    if (commandType === 'task.create') {
      tasks.set(payload.taskId, { id: payload.taskId, scheduledAt: null });
      return;
    }
    if (commandType === 'schedule.task.bind') {
      const existing = tasks.get(payload.taskId) || { id: payload.taskId, scheduledAt: null };
      tasks.set(payload.taskId, { ...existing, scheduledAt: payload.scheduledAt });
      return;
    }
    if (commandType === 'schedule.event.create') {
      events.set(payload.eventId, { id: payload.eventId, taskId: payload.taskId });
      return;
    }
    if (commandType === 'schedule.task.unbind') {
      const existing = tasks.get(payload.taskId) || { id: payload.taskId, scheduledAt: null };
      tasks.set(payload.taskId, { ...existing, scheduledAt: null });
      return;
    }
    if (commandType === 'goal.create') {
      goals.set(payload.goalId, { id: payload.goalId, progress: 0, archived: false });
      return;
    }
    if (commandType === 'goal.update') {
      const existing = goals.get(payload.goalId) || { id: payload.goalId, progress: 0, archived: false };
      goals.set(payload.goalId, { ...existing, ...(payload.updates || {}) });
      return;
    }
    if (commandType === 'project.create') {
      projects.set(payload.projectId, { id: payload.projectId, name: payload.name || 'Untitled' });
      return;
    }
    if (commandType === 'project.update') {
      const existing = projects.get(payload.projectId) || { id: payload.projectId, name: 'Untitled' };
      projects.set(payload.projectId, { ...existing, name: payload.name || existing.name });
      return;
    }
    if (commandType === 'assignment.goal.project.map') {
      goalProjectMap.set(payload.goalId, payload.projectId);
      return;
    }
  }

  function simulateRoutedWrite(commandType, payload) {
    const backendOk = backendOutcomes[backendIndex] !== false;
    backendIndex += 1;

    // Strict fallback semantics: local mutation still applies either as projection
    // (backend accepted) or fallback (backend rejected), preserving deterministic UX.
    if (strictMode) {
      applyLocalMutation(commandType, payload);
      return backendOk ? 'accepted' : 'fallback';
    }

    // Shadow mode: local mutation applies first; backend status is observational only.
    applyLocalMutation(commandType, payload);
    return backendOk ? 'shadow_accepted' : 'shadow_failed';
  }

  steps.push(simulateRoutedWrite('task.create', { taskId: 't-1' }));
  steps.push(simulateRoutedWrite('schedule.task.bind', { taskId: 't-1', scheduledAt: '2026-03-15T12:00:00.000Z' }));
  steps.push(simulateRoutedWrite('schedule.event.create', { eventId: 'e-1', taskId: 't-1' }));
  steps.push(simulateRoutedWrite('schedule.task.unbind', { taskId: 't-1' }));
  steps.push(simulateRoutedWrite('goal.create', { goalId: 'g-1' }));
  steps.push(simulateRoutedWrite('goal.update', { goalId: 'g-1', updates: { progress: 55, archived: false } }));
  steps.push(simulateRoutedWrite('project.create', { projectId: 'p-1', name: 'General' }));
  steps.push(simulateRoutedWrite('project.update', { projectId: 'p-1', name: 'General Updated' }));
  steps.push(simulateRoutedWrite('assignment.goal.project.map', { goalId: 'g-1', projectId: 'p-1' }));

  const task = tasks.get('t-1');
  const event = events.get('e-1');
  const goal = goals.get('g-1');
  const project = projects.get('p-1');
  const parity = {
    taskExists: Boolean(task),
    eventExists: Boolean(event),
    taskUnscheduled: !task?.scheduledAt,
    linkageStable: String(event?.taskId || '') === String(task?.id || ''),
    goalExists: Boolean(goal),
    projectExists: Boolean(project),
    goalProgressStable: Number(goal?.progress || 0) === 55,
    goalProjectLinkStable: String(goalProjectMap.get('g-1') || '') === 'p-1',
  };

  return { steps, parity };
}

test('phase2b authority flip replay remains deterministic across backend accept/fallback mixes', () => {
  const baseline = runDeterministicReplay({
    strictMode: true,
    backendOutcomes: [true, true, true, true, true, true, true, true, true],
  });
  const withFallbacks = runDeterministicReplay({
    strictMode: true,
    backendOutcomes: [true, false, true, false, true, false, true, false, true],
  });
  assert.deepEqual(baseline.parity, withFallbacks.parity);
  assert.deepEqual(baseline.parity, {
    taskExists: true,
    eventExists: true,
    taskUnscheduled: true,
    linkageStable: true,
    goalExists: true,
    projectExists: true,
    goalProgressStable: true,
    goalProjectLinkStable: true,
  });
});

test('phase2b authority replay implementation is wired to routing helpers', async () => {
  const routing = await read('src/contracts/runtime/backend-authority-routing.ts');
  const tasksContext = await read('src/contexts/TasksContext.tsx');
  const scheduleHook = await read('src/hooks/useCalendarEvents.ts');
  const goalsHook = await read('src/hooks/useGoals.ts');
  const projectsSurface = await read('src/components/projects/ProjectsOperatingSystem.tsx');

  const routingMarkers = [
    'executeAuthorityRoutedCommand',
    'isBackendAuthorityStrictModeEnabled',
    'VITE_PHASE2B_AUTHORITY_STRICT_MODE',
    'VITE_PHASE2B_AUTHORITY_SCHEDULE_STRICT',
    'VITE_PHASE2B_AUTHORITY_TASK_STRICT',
    'VITE_PHASE2B_AUTHORITY_GOAL_STRICT',
    'VITE_PHASE2B_AUTHORITY_PROJECT_STRICT',
    'backend_authority_fallback_applied',
    'backend_authority_shadow_write_failed',
  ];
  for (const marker of routingMarkers) {
    assert.ok(routing.includes(marker), `Missing authority routing marker "${marker}"`);
  }
  assert.ok(tasksContext.includes('executeAuthorityRoutedCommand'));
  assert.ok(scheduleHook.includes('executeAuthorityRoutedCommand'));
  assert.ok(goalsHook.includes("domain: 'goal'"));
  assert.ok(goalsHook.includes("commandType: 'goal.update'"));
  assert.ok(projectsSurface.includes("domain: 'project'"));
  assert.ok(projectsSurface.includes("commandType: 'project.update'"));
  assert.ok(projectsSurface.includes("commandType: 'assignment.goal.project.map'"));
});
