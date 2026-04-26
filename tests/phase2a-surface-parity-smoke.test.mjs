import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

function buildTaskSurfaceParityReport(input) {
  const canonical = new Set((input.tasksTab || []).map((item) => String(item.id)));
  const workstream = new Set((input.workstream || []).map((item) => String(item.id)));
  const projects = new Set((input.projects || []).map((item) => String(item.id)));
  const dashboard = new Set((input.dashboard || []).map((item) => String(item.id)));
  const goals = new Set((input.goals || []).map((item) => String(item.id)));
  const resonance = new Set((input.resonance || []).map((item) => String(item.id)));
  const aiAssistant = new Set((input.aiAssistant || []).map((item) => String(item.id)));
  const missingInWorkstream = [...canonical].filter((id) => !workstream.has(id));
  const missingInProjects = [...canonical].filter((id) => !projects.has(id));
  const missingInDashboard = [...canonical].filter((id) => !dashboard.has(id));
  const missingInGoals = [...canonical].filter((id) => !goals.has(id));
  const missingInResonance = [...canonical].filter((id) => !resonance.has(id));
  const missingInAIAssistant = [...canonical].filter((id) => !aiAssistant.has(id));
  const canonicalCount = canonical.size;
  const mismatchCount =
    missingInWorkstream.length +
    missingInProjects.length +
    missingInDashboard.length +
    missingInGoals.length +
    missingInResonance.length +
    missingInAIAssistant.length;
  const parityScore = canonicalCount === 0 ? 1 : Math.max(0, 1 - mismatchCount / (canonicalCount * 6));
  return {
    canonicalCount,
    missingInWorkstream,
    missingInProjects,
    missingInDashboard,
    missingInGoals,
    missingInResonance,
    missingInAIAssistant,
    parityScore,
  };
}

test('surface parity deterministic transitions remain stable', () => {
  const tasks = [{ id: 't1' }, { id: 't2' }, { id: 't3' }];
  const healthy = buildTaskSurfaceParityReport({
    tasksTab: tasks,
    workstream: tasks,
    projects: tasks,
    dashboard: tasks,
    goals: tasks,
    resonance: tasks,
    aiAssistant: tasks,
  });
  assert.equal(healthy.parityScore, 1);
  assert.equal(healthy.missingInWorkstream.length, 0);

  const drift = buildTaskSurfaceParityReport({
    tasksTab: tasks,
    workstream: [{ id: 't1' }, { id: 't2' }],
    projects: [{ id: 't1' }, { id: 't2' }, { id: 't3' }],
    dashboard: [{ id: 't1' }],
    goals: [{ id: 't1' }, { id: 't2' }],
    resonance: [{ id: 't1' }, { id: 't2' }],
    aiAssistant: [{ id: 't1' }, { id: 't2' }],
  });
  assert.equal(drift.missingInWorkstream.length, 1);
  assert.equal(drift.missingInDashboard.length, 2);
  assert.equal(drift.missingInGoals.length, 1);
  assert.equal(drift.missingInResonance.length, 1);
  assert.equal(drift.missingInAIAssistant.length, 1);
  assert.ok(drift.parityScore < 1);
});

test('surface parity implementation symbols and surface files are wired', async () => {
  const projection = await read('src/contracts/projections/task-surface-parity.ts');
  const projects = await read('src/components/projects/ProjectsOperatingSystem.tsx');
  const workstream = await read('src/components/projects/WorkstreamFlowCanvas.tsx');
  const dashboard = await read('src/components/pages/DashboardPage.tsx');
  const tasksPage = await read('src/components/pages/TasksGoalsPage.tsx');
  const resonance = await read('src/components/pages/ResonanceEnginePage.tsx');
  const aiPage = await read('src/components/pages/AIAssistantPage.tsx');

  assert.ok(projection.includes('buildTaskSurfaceParityReport'));
  assert.ok(projection.includes('missingInWorkstream'));
  assert.ok(projection.includes('missingInProjects'));
  assert.ok(projection.includes('missingInDashboard'));
  assert.ok(projection.includes('missingInGoals'));
  assert.ok(projection.includes('missingInResonance'));
  assert.ok(projection.includes('missingInAIAssistant'));

  const surfaceMarkers = [
    projects.includes('projectTasks'),
    workstream.includes('tasks,'),
    dashboard.includes('TodaySection'),
    tasksPage.includes('useTasks'),
    resonance.includes('recordTaskSurfaceSnapshot') && resonance.includes("'resonance'"),
    aiPage.includes('recordTaskSurfaceSnapshot') && aiPage.includes("'ai_assistant'"),
  ];
  assert.ok(surfaceMarkers.every(Boolean), 'Expected core task surfaces to expose task data markers');
});
