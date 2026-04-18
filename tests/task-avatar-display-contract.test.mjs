import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('task avatar helpers exist and are used on dashboard surfaces', () => {
  const util = readFileSync(join(root, 'src/utils/task-avatar-display.ts'), 'utf8');
  assert.match(util, /resolveTaskCardAvatar/);
  assert.match(util, /getTaskParticipantFaces/);
  assert.match(util, /collaboratorMatchesProfile/);

  const focus = readFileSync(join(root, 'src/components/AIFocusSection.tsx'), 'utf8');
  assert.match(focus, /getTaskParticipantFaces/);
  assert.ok(!focus.includes('collaborators?.[0]'));

  const today = readFileSync(join(root, 'src/components/TodayScheduleRefined.tsx'), 'utf8');
  assert.match(today, /getTaskParticipantFaces/);
});
