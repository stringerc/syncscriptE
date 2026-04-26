import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('schedule and assignment optimization change-set entrypoint exists', () => {
  const changeSet = read('src/orchestration/optimization-change-set.ts');
  const calendar = read('src/components/CalendarOptimizeButton.tsx');
  const markers = [
    "OptimizationEntryDomain = 'schedule' | 'assignment'",
    'buildOptimizationChangeSet',
    'domain: \'schedule\'',
    'Export Change-set',
  ];
  assert.ok(changeSet.includes(markers[0]), `Expected marker "${markers[0]}"`);
  assert.ok(changeSet.includes(markers[1]), `Expected marker "${markers[1]}"`);
  assert.ok(calendar.includes(markers[2]), `Expected marker "${markers[2]}"`);
  assert.ok(calendar.includes(markers[3]), `Expected marker "${markers[3]}"`);
});
