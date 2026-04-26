#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import test from 'node:test';

const root = process.cwd();

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

test('strict evidence closure checklist', async () => {
  const traceability = await read('TRACEABILITY_LIVE.md');
  const council = await read('COUNCIL_MEMBER_CHECKLIST.md');
  const board = await read('TASKS_CHAT_VISION_RECOMMENDATIONS.md');

  const traceHasOpen = /\|\s*open\s*\|/i.test(traceability) || /\bin progress\b/i.test(traceability);
  if (traceHasOpen) {
    throw new Error('Traceability still contains open/in-progress entries.');
  }

  const councilUnchecked = council
    .split('\n')
    .filter((line) => /\[ \]/.test(line) && !line.includes('`[ ]` pending'));
  if (councilUnchecked.length > 0) {
    throw new Error(`Council checklist has unchecked items:\n${councilUnchecked.join('\n')}`);
  }

  const boardUnchecked = board
    .split('\n')
    .filter((line) => /\[ \]/.test(line));
  if (boardUnchecked.length > 0) {
    throw new Error(`Execution board checklist has unchecked items:\n${boardUnchecked.join('\n')}`);
  }
});
