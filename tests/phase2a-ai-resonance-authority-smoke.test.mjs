import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('ai context uses canonical hooks instead of mock-only authority', async () => {
  const aiContext = await read('src/contexts/AIContext.tsx');
  const markers = [
    "import { useTasks } from '../hooks/useTasks';",
    "import { useGoals } from '../hooks/useGoals';",
    "import { useCalendarEvents } from '../hooks/useCalendarEvents';",
    "import { useEnergy } from './EnergyContext';",
    "const { tasks: canonicalTasks } = useTasks();",
    "const { goals: canonicalGoals } = useGoals();",
    "const { events: canonicalCalendarEvents } = useCalendarEvents();",
    "const { energy } = useEnergy();",
    'toAiTaskStatus',
    'toAiTaskPriority',
    'toAiCalendarType',
  ];
  assert.ok(markers.every((marker) => aiContext.includes(marker)), 'Expected canonical authority markers in AI context');
  assert.equal(
    aiContext.includes('const [tasks] = useState<Task[]>(generateMockTasks())'),
    false,
    'Expected legacy mock-only task authority to be removed',
  );
});

test('resonance page mutation path remains task-command authority based', async () => {
  const resonance = await read('src/components/pages/ResonanceEnginePage.tsx');
  const markers = [
    'const { tasks: realTasks, updateTask, scheduleTask, unscheduleTask } = useTasks();',
    "recordTaskSurfaceSnapshot(\n      'resonance'",
    'scheduleTask(taskId,',
    'unscheduleTask(taskId)',
  ];
  assert.ok(markers.every((marker) => resonance.includes(marker)), 'Expected resonance authority markers');
});
