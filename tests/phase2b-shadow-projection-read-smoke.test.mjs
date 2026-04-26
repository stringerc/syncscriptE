import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('phase2b shadow projection helper supports feature-flagged read/write path', async () => {
  const helper = await read('src/contracts/runtime/backend-projection-mirror.ts');
  const markers = [
    'isBackendProjectionShadowEnabled',
    'buildRuntimeAuthHeaders',
    'readBackendProjection',
    'writeBackendProjection',
    'syncShadowTaskProjection',
    'syncShadowGoalProjection',
    'syncShadowScheduleProjection',
    'syncShadowProjectProjection',
    "resource: 'contract-runtime-projection'",
    'VITE_PHASE2B_SHADOW_PROJECTIONS',
    'VITE_PHASE2B_AUTHORITY_TASK_BACKEND',
    'VITE_PHASE2B_AUTHORITY_SCHEDULE_BACKEND',
    'VITE_PHASE2B_AUTHORITY_GOAL_BACKEND',
    'VITE_PHASE2B_AUTHORITY_PROJECT_BACKEND',
    'syncscript:phase2b:authority:task:backend',
    'syncscript:phase2b:authority:schedule:backend',
    'syncscript:phase2b:authority:goal:backend',
    'syncscript:phase2b:authority:project:backend',
    'Authorization',
    'supabase.auth.getSession',
    'publicAnonKey',
  ];
  for (const marker of markers) {
    assert.ok(helper.includes(marker), `Missing shadow projection marker "${marker}"`);
  }
});

test('tasks refresh path wires non-authoritative shadow projection read', async () => {
  const tasksContext = await read('src/contexts/TasksContext.tsx');
  const markers = [
    'syncShadowTaskProjection',
    'Shadow reads are non-authoritative in Batch 1',
  ];
  for (const marker of markers) {
    assert.ok(tasksContext.includes(marker), `Missing task shadow-read wiring marker "${marker}"`);
  }
});

test('goals and schedule flows wire non-authoritative shadow projection sync', async () => {
  const goalsHook = await read('src/hooks/useGoals.ts');
  const scheduleHook = await read('src/hooks/useCalendarEvents.ts');
  const goalMarkers = [
    'syncShadowGoalProjection',
    'Shadow reads are non-authoritative in Batch 1; never block goal state updates',
  ];
  const scheduleMarkers = [
    'syncShadowScheduleProjection',
    'Shadow reads are non-authoritative in Batch 1; never block calendar updates',
  ];
  const projectsPage = await read('src/components/projects/ProjectsOperatingSystem.tsx');
  const projectMarkers = [
    'syncShadowProjectProjection',
    'Shadow reads are non-authoritative in Batch 1; never block project state updates',
  ];
  for (const marker of goalMarkers) {
    assert.ok(goalsHook.includes(marker), `Missing goal shadow-read wiring marker "${marker}"`);
  }
  for (const marker of scheduleMarkers) {
    assert.ok(scheduleHook.includes(marker), `Missing schedule shadow-read wiring marker "${marker}"`);
  }
  for (const marker of projectMarkers) {
    assert.ok(projectsPage.includes(marker), `Missing project shadow-read wiring marker "${marker}"`);
  }
});
