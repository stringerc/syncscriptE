import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('batch6 bundle hardening policy is wired in vite config', async () => {
  const viteConfig = await read('vite.config.ts');
  const markers = [
    'manualChunks(id)',
    "return 'vendor-flow'",
    "return 'feature-projects-core'",
    "return 'feature-contract-runtime'",
    "return 'feature-task-template-library'",
    "return 'feature-task-timeline'",
    "return 'feature-task-automation'",
    "return 'feature-task-recurring'",
    "return 'feature-goals-advanced'",
  ];
  for (const marker of markers) {
    assert.ok(viteConfig.includes(marker), `Missing batch6 vite marker "${marker}"`);
  }
});

test('tasks/goals page uses lazy loading for heavy feature modules', async () => {
  const page = await read('src/components/pages/TasksGoalsPage.tsx');
  const markers = [
    'Suspense, lazy',
    "const ProjectsOperatingSystem = lazy(() =>",
    "const TaskTemplateLibrary = lazy(() =>",
    "const TaskTimelineView = lazy(() =>",
    "const GoalAnalyticsTab = lazy(() =>",
    'Loading workstream...',
    'Loading projects...',
  ];
  for (const marker of markers) {
    assert.ok(page.includes(marker), `Missing batch6 lazy marker "${marker}"`);
  }
});
