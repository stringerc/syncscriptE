import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('phase2b backend authority routing helper exposes schedule/task flags and command bridge', async () => {
  const helper = await read('src/contracts/runtime/backend-authority-routing.ts');
  const markers = [
    'VITE_PHASE2B_AUTHORITY_TASK_BACKEND',
    'VITE_PHASE2B_AUTHORITY_SCHEDULE_BACKEND',
    'VITE_PHASE2B_AUTHORITY_GOAL_BACKEND',
    'VITE_PHASE2B_AUTHORITY_PROJECT_BACKEND',
    'VITE_PHASE2B_AUTHORITY_SCHEDULE_STRICT',
    'VITE_PHASE2B_AUTHORITY_TASK_STRICT',
    'VITE_PHASE2B_AUTHORITY_GOAL_STRICT',
    'VITE_PHASE2B_AUTHORITY_PROJECT_STRICT',
    'syncscript:phase2b:authority:task:backend',
    'syncscript:phase2b:authority:schedule:backend',
    'syncscript:phase2b:authority:goal:backend',
    'syncscript:phase2b:authority:project:backend',
    'syncscript:phase2b:authority:task:strict',
    'syncscript:phase2b:authority:schedule:strict',
    'syncscript:phase2b:authority:goal:strict',
    'syncscript:phase2b:authority:project:strict',
    'isBackendAuthorityEnabled',
    'isBackendAuthorityStrictModeEnabled',
    'AUTHORITY_ROUTING_FLAG_KEYS',
    'getAuthorityRoutingSnapshot',
    'buildRuntimeAuthHeaders',
    'Authorization',
    'supabase.auth.getSession',
    'publicAnonKey',
    'sendBackendAuthorityCommand',
    "resource=contract-runtime-command",
  ];
  for (const marker of markers) {
    assert.ok(helper.includes(marker), `Missing backend authority routing marker "${marker}"`);
  }
});

test('task, schedule, goal, and project mutation paths wire routed backend authority execution', async () => {
  const tasksContext = await read('src/contexts/TasksContext.tsx');
  const scheduleHook = await read('src/hooks/useCalendarEvents.ts');
  const goalsHook = await read('src/hooks/useGoals.ts');
  const projectsSurface = await read('src/components/projects/ProjectsOperatingSystem.tsx');

  const taskMarkers = [
    'executeAuthorityRoutedCommand',
    "domain: 'task'",
    "domain: 'schedule'",
    "commandType: 'task.create'",
    "commandType: 'task.update'",
    "commandType: 'schedule.task.bind'",
    "commandType: 'schedule.task.unbind'",
  ];
  const scheduleMarkers = [
    'executeAuthorityRoutedCommand',
    "commandType: 'schedule.event.create'",
    "commandType: 'schedule.event.update'",
    "commandType: 'schedule.event.delete'",
  ];
  const goalMarkers = [
    'executeAuthorityRoutedCommand',
    "domain: 'goal'",
    "commandType: 'goal.create'",
    "commandType: 'goal.update'",
    "commandType: 'goal.delete'",
  ];
  const projectMarkers = [
    'executeAuthorityRoutedCommand',
    "domain: 'project'",
    "commandType: 'project.create'",
    "commandType: 'project.update'",
    "commandType: 'assignment.goal.project.map'",
  ];

  for (const marker of taskMarkers) {
    assert.ok(tasksContext.includes(marker), `Missing task authority scaffold marker "${marker}"`);
  }
  for (const marker of scheduleMarkers) {
    assert.ok(scheduleHook.includes(marker), `Missing schedule authority scaffold marker "${marker}"`);
  }
  for (const marker of goalMarkers) {
    assert.ok(goalsHook.includes(marker), `Missing goal authority scaffold marker "${marker}"`);
  }
  for (const marker of projectMarkers) {
    assert.ok(projectsSurface.includes(marker), `Missing project authority scaffold marker "${marker}"`);
  }
});
