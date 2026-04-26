#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import test from 'node:test';

const root = process.cwd();

const checks = [
  {
    name: 'Notification event model exposes budget + dedupe',
    file: 'src/utils/notification-event-model.ts',
    includes: [
      'export function applyNotificationBudget(',
      'dedupeWindowMs',
      'maxPerHourByPriority',
    ],
  },
  {
    name: 'Notifications sheet wires watch budget metadata',
    file: 'src/components/NotificationsSheet.tsx',
    includes: [
      'applyNotificationBudget(',
      'Watch budget:',
      'dropped',
    ],
  },
  {
    name: 'Task modal has consent-gated Nexus call action',
    file: 'src/components/TaskDetailModal.tsx',
    includes: [
      'Nexus Call',
      'callConsentGranted',
      '<PhoneCallPanel',
    ],
  },
  {
    name: 'Workstream canvas modal exists and can promote node',
    file: 'src/components/WorkstreamCanvasModal.tsx',
    includes: [
      'Workstream Canvas (MVP)',
      'onPromoteNode',
      'Promote to Project',
    ],
  },
  {
    name: 'Workstream promotion store persists promoted records',
    file: 'src/utils/workstream-promotion.ts',
    includes: [
      'PROMOTION_STORE_KEY',
      'promoteWorkstreamNodeToProject',
      'listPromotedWorkstreamProjects',
    ],
  },
  {
    name: 'Dashboard header includes Nexus pull-down entrypoint',
    file: 'src/components/DashboardHeader.tsx',
    includes: [
      'openNexusPullDown',
      'surface=pull-down-prototype',
      'nexus-pulldown-open',
    ],
  },
];

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

test('EX-016/017/018/021/024 thin-slice smoke', async () => {
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
    throw new Error(`EX-016/017/018/021/024 THIN-SLICE SMOKE FAILED\n${details}`);
  }
});
