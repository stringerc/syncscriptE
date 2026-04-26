import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

function assertTaskGraphInvariants(tasks, edges) {
  const errors = [];
  const ids = new Set(tasks.map((task) => task.entityId));
  for (const edge of edges) {
    if (!ids.has(edge.fromTaskId)) errors.push(`Missing source task for edge ${edge.fromTaskId} -> ${edge.toTaskId}`);
    if (!ids.has(edge.toTaskId)) errors.push(`Missing target task for edge ${edge.fromTaskId} -> ${edge.toTaskId}`);
  }
  const lineageKeySet = new Set();
  for (const task of tasks) {
    const key = String(task?.lineage?.lineageKey || '').trim().toLowerCase();
    if (!key) continue;
    if (lineageKeySet.has(key)) errors.push(`Duplicate lineage key detected: ${key}`);
    lineageKeySet.add(key);
  }
  return { ok: errors.length === 0, errors };
}

function assertScheduleBindings(tasksWithSchedule, bindings) {
  const errors = [];
  const bindingByTask = new Map(bindings.map((binding) => [binding.taskId, binding]));
  for (const task of tasksWithSchedule) {
    if (!task.eventId) continue;
    const binding = bindingByTask.get(task.taskId);
    if (!binding) errors.push(`Missing schedule binding for task ${task.taskId}`);
    else if (binding.eventId !== task.eventId) errors.push(`Task/event mismatch for task ${task.taskId}`);
  }
  return errors;
}

function isIdempotentDuplicate(current, previous) {
  if (!previous) return false;
  return (
    current.idempotencyKey === previous.idempotencyKey &&
    current.eventType === previous.eventType &&
    current.entityKind === previous.entityKind &&
    current.entityId === previous.entityId
  );
}

function assertFinancialRecommendationContract(rec) {
  const errors = [];
  if (!rec.inputsUsed?.length) errors.push('Recommendation missing inputsUsed');
  if (!rec.policyApplied?.length) errors.push('Recommendation missing policyApplied');
  if (!Number.isFinite(rec.confidence)) errors.push('Recommendation confidence invalid');
  if (!rec.rollbackPath?.trim()) errors.push('Recommendation missing rollbackPath');
  return errors;
}

test('task graph invariants catch duplicate lineage and missing nodes', () => {
  const result = assertTaskGraphInvariants(
    [
      { entityId: 't1', lineage: { lineageKey: 'line-1' } },
      { entityId: 't2', lineage: { lineageKey: 'line-1' } },
    ],
    [{ fromTaskId: 't1', toTaskId: 't-missing' }],
  );
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('Duplicate lineage key detected')));
  assert.ok(result.errors.some((error) => error.includes('Missing target task')));
});

test('schedule invariants catch missing and mismatched bindings', () => {
  const missing = assertScheduleBindings(
    [{ taskId: 'task-1', eventId: 'event-1' }],
    [],
  );
  assert.equal(missing.length, 1);
  assert.ok(missing[0].includes('Missing schedule binding'));

  const mismatch = assertScheduleBindings(
    [{ taskId: 'task-2', eventId: 'event-a' }],
    [{ bindingId: 'b-1', taskId: 'task-2', eventId: 'event-b' }],
  );
  assert.equal(mismatch.length, 1);
  assert.ok(mismatch[0].includes('Task/event mismatch'));
});

test('event envelope idempotency requires full key/entity/event match', () => {
  const previous = {
    idempotencyKey: 'idem-1',
    eventType: 'task.updated',
    entityKind: 'task',
    entityId: 'task-1',
  };
  const same = {
    idempotencyKey: 'idem-1',
    eventType: 'task.updated',
    entityKind: 'task',
    entityId: 'task-1',
  };
  const differentEntity = {
    idempotencyKey: 'idem-1',
    eventType: 'task.updated',
    entityKind: 'task',
    entityId: 'task-2',
  };
  assert.equal(isIdempotentDuplicate(same, previous), true);
  assert.equal(isIdempotentDuplicate(differentEntity, previous), false);
});

test('financial invariants enforce explainability completeness', () => {
  const invalid = assertFinancialRecommendationContract({
    inputsUsed: [],
    policyApplied: [],
    confidence: Number.NaN,
    rollbackPath: '',
  });
  assert.equal(invalid.length, 4);
  const valid = assertFinancialRecommendationContract({
    inputsUsed: ['snapshot.totalCash:100'],
    policyApplied: ['policy.financial.default.guardrail'],
    confidence: 86,
    rollbackPath: 'rollback://financial-recommendation/example',
  });
  assert.equal(valid.length, 0);
});

test('invariant implementation symbols are wired in contracts', async () => {
  const taskGraph = await read('src/contracts/domains/task-graph-contract.ts');
  const schedule = await read('src/contracts/domains/schedule-contract.ts');
  const envelope = await read('src/contracts/core/event-envelope.ts');
  const finance = await read('src/contracts/domains/financial-contract.ts');
  assert.ok(taskGraph.includes('assertTaskGraphInvariants'));
  assert.ok(schedule.includes('assertScheduleBindings'));
  assert.ok(envelope.includes('isIdempotentDuplicate'));
  assert.ok(finance.includes('assertFinancialRecommendationContract'));
});
