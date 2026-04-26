#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import test from 'node:test';

const root = process.cwd();

const checks = [
  {
    name: 'Financials page exposes goal-linked planning queue controls',
    file: 'src/components/pages/FinancialsPage.tsx',
    includes: [
      'const [linkedGoalId, setLinkedGoalId] = useState',
      'Link generated tasks to a goal',
      'Queue All',
    ],
  },
  {
    name: 'Financial task descriptions include operating context',
    file: 'src/components/pages/FinancialsPage.tsx',
    includes: [
      'buildFinancialTaskDescription',
      'Net monthly cashflow',
      'Runway months',
      'Linked goal:',
    ],
  },
];

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

test('EX-020 financial planning center smoke', async () => {
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
    throw new Error(`EX-020 FINANCIAL PLANNING CENTER SMOKE FAILED\n${details}`);
  }
});
