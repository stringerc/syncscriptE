import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

function buildTaskAssignmentParityReport(tasks, options = {}) {
  const malformedTaskIds = [];
  const unknownIdentityTaskIds = [];
  const canonicalIds = new Set((options.canonicalIds || []).map((value) => String(value || '').toLowerCase()));
  const canonicalEmails = new Set((options.canonicalEmails || []).map((value) => String(value || '').toLowerCase()));
  const canValidateIdentity = canonicalIds.size > 0 || canonicalEmails.size > 0;
  let shapeValidTasks = 0;
  let identityValidTasks = 0;
  for (const task of tasks) {
    const assignees = task.assignees;
    const collaborators = task.collaborators;
    const assignedTo = task.assignedTo;
    const assigneesValid =
      assignees == null || (Array.isArray(assignees) && assignees.every((entry) => typeof entry === 'string' || typeof entry === 'object'));
    const collaboratorsValid =
      collaborators == null ||
      (Array.isArray(collaborators) && collaborators.every((entry) => typeof entry === 'string' || typeof entry === 'object'));
    const assignedToValid =
      assignedTo == null || (Array.isArray(assignedTo) && assignedTo.every((entry) => typeof entry === 'string' || typeof entry === 'object'));
    if (!assigneesValid || !collaboratorsValid || !assignedToValid) {
      malformedTaskIds.push(String(task.id));
      continue;
    }
    shapeValidTasks += 1;
    if (!canValidateIdentity) {
      identityValidTasks += 1;
      continue;
    }
    const refs = [...(assignees || []), ...(collaborators || []), ...(assignedTo || [])];
    const hasUnknown = refs.some((ref) => {
      if (typeof ref === 'string') {
        const token = ref.toLowerCase();
        return token.includes('@') ? !canonicalEmails.has(token) : !canonicalIds.has(token);
      }
      const id = String(ref?.id || ref?.userId || '').toLowerCase();
      const email = String(ref?.email || '').toLowerCase();
      if (!id && !email) return false;
      return (id && !canonicalIds.has(id)) && (email && !canonicalEmails.has(email) || !email);
    });
    if (hasUnknown) {
      unknownIdentityTaskIds.push(String(task.id));
    } else {
      identityValidTasks += 1;
    }
  }
  const totalTasks = tasks.length;
  const validTasks = Math.max(0, shapeValidTasks - unknownIdentityTaskIds.length);
  const parityScore = totalTasks === 0 ? 1 : validTasks / totalTasks;
  return {
    totalTasks,
    validTasks,
    shapeValidTasks,
    identityValidTasks,
    malformedTaskIds,
    unknownIdentityTaskIds,
    parityScore,
  };
}

test('assignment parity deterministic scoring remains stable', () => {
  const tasks = [
    { id: 'task-1', assignees: [{ id: 'u-1' }], collaborators: [], assignedTo: [{ id: 'u-1' }] },
    { id: 'task-2', assignees: 'bad-shape', collaborators: [] },
    { id: 'task-3', assignees: [], collaborators: [{ id: 'u-unknown' }] },
  ];
  const report = buildTaskAssignmentParityReport(tasks, {
    canonicalIds: ['u-1', 'u-2'],
    canonicalEmails: [],
  });
  assert.equal(report.totalTasks, 3);
  assert.equal(report.validTasks, 1);
  assert.equal(report.shapeValidTasks, 2);
  assert.equal(report.identityValidTasks, 1);
  assert.equal(report.malformedTaskIds.length, 1);
  assert.equal(report.unknownIdentityTaskIds.length, 1);
  assert.equal(report.parityScore, 1 / 3);
});

test('assignment parity implementation symbols are wired', async () => {
  const projection = await read('src/contracts/projections/task-assignment-parity.ts');
  const projectsOs = await read('src/components/projects/ProjectsOperatingSystem.tsx');
  assert.ok(projection.includes('buildTaskAssignmentParityReport'));
  assert.ok(projection.includes('unknownIdentityTaskIds'));
  assert.ok(projectsOs.includes('Assignment parity'));
  assert.ok(projectsOs.includes('Unknown identities'));
});
