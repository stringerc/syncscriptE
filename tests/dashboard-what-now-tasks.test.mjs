/**
 * Contract: "What should I be doing" must not require collaborators on every task.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('getTopPriorityTasks scores all incomplete tasks (solo + team)', () => {
  const src = readFileSync(join(root, 'src/utils/intelligent-task-selector.ts'), 'utf8');
  assert.match(
    src,
    /incomplete\.map\(\(task\)/,
    'eligible pool must include every incomplete task, not only collaborator rows',
  );
  assert.match(src, /collabNudge/, 'soft tie-break for collaboration should remain');
});

test('AIFocusSection documents empty state + link to tasks', () => {
  const src = readFileSync(join(root, 'src/components/AIFocusSection.tsx'), 'utf8');
  assert.match(src, /Go to tasks/);
  assert.match(src, /#\/tasks/);
});
