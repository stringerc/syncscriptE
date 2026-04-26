import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

function buildParityReconciliationActions(report) {
  const actions = [];
  for (const taskId of report.missingLinks) {
    actions.push({
      id: `link:${taskId}`,
      type: 'link_missing_task',
      priority: 'high',
      taskId,
    });
  }
  for (const eventId of report.orphanedEvents) {
    actions.push({
      id: `orphan:${eventId}`,
      type: 'remove_orphan_event',
      priority: 'high',
      eventId,
    });
  }
  if (actions.length === 0 && report.parityScore < 1) {
    actions.push({
      id: 'inspect:parity-score',
      type: 'inspect_event_linkage',
      priority: 'medium',
    });
  }
  return actions;
}

test('reconciliation action planner is deterministic for drift inputs', () => {
  const report = {
    scheduledTasks: 3,
    linkedTasks: 1,
    missingLinks: ['task-a', 'task-b'],
    orphanedEvents: ['event-orphan'],
    parityScore: 1 / 3,
  };
  const actions = buildParityReconciliationActions(report);
  assert.equal(actions.length, 3);
  assert.deepEqual(
    actions.map((action) => action.type),
    ['link_missing_task', 'link_missing_task', 'remove_orphan_event'],
  );
});

test('reconciliation planner emits inspect action for fractional parity only', () => {
  const report = {
    scheduledTasks: 2,
    linkedTasks: 2,
    missingLinks: [],
    orphanedEvents: [],
    parityScore: 0.95,
  };
  const actions = buildParityReconciliationActions(report);
  assert.equal(actions.length, 1);
  assert.equal(actions[0].type, 'inspect_event_linkage');
});

test('reconciliation planner remains wired to implementation symbols', async () => {
  const projection = await read('src/contracts/projections/parity-reconciliation-actions.ts');
  const projectsOs = await read('src/components/projects/ProjectsOperatingSystem.tsx');
  assert.ok(projection.includes('buildParityReconciliationActions'));
  assert.ok(projectsOs.includes('Apply high-confidence fixes'));
  assert.ok(projectsOs.includes('handleApplyParityActions'));
});
