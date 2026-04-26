import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('phase2a runtime and adapter scaffolds exist', async () => {
  const files = [
    'src/contracts/runtime/contract-runtime.ts',
    'src/contracts/adapters/task-repository-command-adapter.ts',
    'src/contracts/adapters/local-schedule-command-adapter.ts',
    'src/contracts/adapters/local-financial-command-adapter.ts',
    'src/contracts/adapters/local-team-command-adapter.ts',
    'src/contracts/adapters/local-goal-command-adapter.ts',
    'src/contracts/commands/schedule-commands.ts',
    'src/contracts/commands/financial-commands.ts',
    'src/contracts/commands/assignment-commands.ts',
    'src/contracts/commands/goal-commands.ts',
    'src/contracts/projections/task-calendar-parity.ts',
    'src/contracts/projections/parity-guardrail.ts',
    'src/contracts/projections/parity-reconciliation-actions.ts',
  ];
  for (const file of files) {
    const contents = await read(file);
    assert.ok(contents.length > 0, `Expected non-empty scaffold file: ${file}`);
  }
});

test('financial write path exposes explainability command markers', async () => {
  const financialHook = await read('src/hooks/useFinancialIntelligence.ts');
  const requiredMarkers = [
    'LocalFinancialCommandAdapter',
    'generateExplainableRecommendation',
    'approveRecommendation',
    'finance.recommendation.generated',
    'finance.action.approved',
  ];
  for (const marker of requiredMarkers) {
    assert.ok(financialHook.includes(marker), `Expected useFinancialIntelligence to include "${marker}"`);
  }
});

test('task write paths emit canonical contract events', async () => {
  const tasksContext = await read('src/contexts/TasksContext.tsx');
  const requiredEventTypes = [
    'task.created',
    'task.updated',
    'task.deleted',
    'schedule.binding.created',
    'schedule.binding.deleted',
  ];
  for (const eventType of requiredEventTypes) {
    assert.ok(
      tasksContext.includes(eventType),
      `Expected TasksContext to emit "${eventType}"`,
    );
  }
});

test('team write paths are adapter-wired and emit assignment events', async () => {
  const teamContext = await read('src/contexts/TeamContext.tsx');
  const requiredMarkers = [
    'LocalTeamCommandAdapter',
    'assignment.updated',
    'inviteMember',
    'removeMember',
    'updateMember',
  ];
  for (const marker of requiredMarkers) {
    assert.ok(teamContext.includes(marker), `Expected TeamContext to include "${marker}"`);
  }
});

test('calendar write paths emit schedule event contracts', async () => {
  const calendarHook = await read('src/hooks/useCalendarEvents.ts');
  const requiredEventTypes = [
    'schedule.event.created',
    'schedule.event.updated',
    'schedule.event.deleted',
    'LocalScheduleCommandAdapter',
  ];
  for (const eventType of requiredEventTypes) {
    assert.ok(
      calendarHook.includes(eventType),
      `Expected useCalendarEvents to emit "${eventType}"`,
    );
  }
});

test('goal write paths are adapter-wired and emit goal events', async () => {
  const goalsHook = await read('src/hooks/useGoals.ts');
  const requiredMarkers = [
    'LocalGoalCommandAdapter',
    'goal.created',
    'goal.updated',
    'goal.deleted',
    'createGoal',
    'updateGoal',
    'deleteGoal',
  ];
  for (const marker of requiredMarkers) {
    assert.ok(goalsHook.includes(marker), `Expected useGoals to include "${marker}"`);
  }
});

test('projects operating system renders parity health inputs', async () => {
  const projectsOs = await read('src/components/projects/ProjectsOperatingSystem.tsx');
  const requiredMarkers = [
    'buildTaskCalendarParityReport',
    'evaluateTaskCalendarParity',
    'buildParityReconciliationActions',
    'Apply high-confidence fixes',
    'paritySafeMode',
    'parityApplyLockRef',
    'Reconciliation history',
    'useCalendarEvents',
    'Task-calendar parity',
    'appendReconciliationLog',
  ];
  for (const marker of requiredMarkers) {
    assert.ok(
      projectsOs.includes(marker),
      `Expected ProjectsOperatingSystem to include "${marker}"`,
    );
  }
});
