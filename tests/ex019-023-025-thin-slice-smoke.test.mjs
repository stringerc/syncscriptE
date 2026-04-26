#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import test from 'node:test';

const root = process.cwd();

const checks = [
  {
    name: 'Timeline semantic zoom controls are wired',
    file: 'src/components/calendar/TimelineView.tsx',
    includes: [
      "export type TimelineSemanticZoom = 'year' | 'quarter' | 'month' | 'week' | 'day' | 'hour' | 'minute'",
      'semantic zoom:',
      'onSemanticZoomChange',
    ],
  },
  {
    name: 'Calendar page passes semantic zoom state to timeline',
    file: 'src/components/pages/CalendarEventsPage.tsx',
    includes: [
      'const [timelineSemanticZoom, setTimelineSemanticZoom] = useState<TimelineSemanticZoom>',
      'semanticZoom={timelineSemanticZoom}',
      'onSemanticZoomChange={setTimelineSemanticZoom}',
    ],
  },
  {
    name: 'Gaming primary-nav feature gate exists',
    file: 'src/utils/feature-gates.ts',
    includes: [
      'isGamingPrimaryNavEnabled',
      'VITE_ENABLE_GAMING_PRIMARY_NAV',
      'syncscript:feature:gaming-primary-nav',
    ],
  },
  {
    name: 'Sidebar and mobile nav gate gaming primary entry',
    file: 'src/components/Sidebar.tsx',
    includes: ['isGamingPrimaryNavEnabled()', "id: 'Gaming'"],
  },
  {
    name: 'Mobile nav gate includes gaming primary check',
    file: 'src/components/MobileNav.tsx',
    includes: ['isGamingPrimaryNavEnabled()', "id: 'Gaming'"],
  },
  {
    name: 'Core Chat naming replaces AI Insights panel wording',
    file: 'src/contexts/AIContext.tsx',
    includes: ['**Chat panel**', 'Open Chat Panel'],
  },
  {
    name: 'Assistant panel uses Chat wording for panel open path',
    file: 'src/components/AIAssistantPanel.tsx',
    includes: ['Chat panel opened', 'Open Chat Panel'],
  },
];

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

test('EX-019/023/025 thin-slice smoke', async () => {
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
    throw new Error(`EX-019/023/025 THIN-SLICE SMOKE FAILED\n${details}`);
  }
});
