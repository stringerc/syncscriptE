#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import test from 'node:test';

const root = process.cwd();

const checks = [
  {
    name: 'Flow types exist',
    file: 'src/types/workstream-flow.ts',
    includes: [
      'export interface WorkstreamFlowDocument',
      "export type WorkstreamFlowNodeKind = 'task' | 'event'",
      'export interface WorkstreamFlowEdge',
    ],
  },
  {
    name: 'Flow adapter builds document from tasks',
    file: 'src/utils/workstream-flow-adapter.ts',
    includes: [
      'export function buildWorkstreamFlowFromTasks',
      "data: { kind: 'dependency' }",
      'parentTaskId',
    ],
  },
  {
    name: 'Flow store persists per project',
    file: 'src/utils/workstream-flow-store.ts',
    includes: [
      "const FLOW_STORE_KEY = 'syncscript:workstream-flow:v1'",
      'export function upsertWorkstreamFlowDocument',
      'export function getWorkstreamFlowDocument',
    ],
  },
  {
    name: 'Projects OS uses WorkstreamFlowCanvas',
    file: 'src/components/projects/ProjectsOperatingSystem.tsx',
    includes: [
      'WorkstreamFlowCanvas',
      'isWorkstreamFlowCanvasEnabled',
      'Workstream Flow',
    ],
  },
  {
    name: 'Flow canvas supports connect/layout/history',
    file: 'src/components/projects/WorkstreamFlowCanvas.tsx',
    includes: [
      'onConnect',
      'autoLayoutWorkstream',
      'useWorkstreamHistory',
      'onAddEvent',
    ],
  },
  {
    name: 'Backend task normalize preserves flow fields',
    file: 'supabase/functions/make-server-57781ad9/email-task-routes.tsx',
    includes: [
      'parentTaskId',
      'dependencies',
      'flowLayout',
    ],
  },
];

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

test('workstream flow canvas smoke', async () => {
  const failures = [];
  for (const check of checks) {
    const content = await read(check.file);
    const missing = check.includes.filter((needle) => !content.includes(needle));
    if (missing.length > 0) failures.push({ ...check, missing });
  }

  if (failures.length > 0) {
    const details = failures
      .map((failure) => {
        const missingDetails = failure.missing.map((needle) => `  missing: ${needle}`).join('\n');
        return `- ${failure.name} (${failure.file})\n${missingDetails}`;
      })
      .join('\n');
    throw new Error(`WORKSTREAM FLOW SMOKE FAILED\n${details}`);
  }
});
