import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('goals hook is provider-backed single authority path', async () => {
  const goalsHook = await read('src/hooks/useGoals.ts');
  const markers = [
    'const GoalsContext = createContext<UseGoalsReturn | undefined>(undefined);',
    'function useGoalsState(): UseGoalsReturn {',
    'export function GoalsProvider',
    'return createElement(GoalsContext.Provider, { value }, children);',
    "throw new Error('useGoals must be used within GoalsProvider');",
  ];
  assert.ok(markers.every((marker) => goalsHook.includes(marker)), 'Expected provider-backed goal authority markers');
});

test('dashboard providers include GoalsProvider before AI surfaces', async () => {
  const app = await read('src/App.tsx');
  const markers = [
    "import { GoalsProvider } from './hooks/useGoals';",
    '<TasksProvider>',
    '<GoalsProvider>',
    '<AIProvider>',
  ];
  assert.ok(markers.every((marker) => app.includes(marker)), 'Expected GoalsProvider wiring in dashboard provider tree');
});
