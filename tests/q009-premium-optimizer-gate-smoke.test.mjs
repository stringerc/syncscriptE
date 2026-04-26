import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('advanced optimizer is gated by subscription access', () => {
  const page = read('src/components/pages/EnterpriseToolsPage.tsx');
  const markers = [
    'useSubscription',
    'advancedOptimizerEnabled',
    'advanced optimizer enabled',
    'advanced optimizer locked',
    'disabled={!advancedOptimizerEnabled}',
  ];
  for (const marker of markers) {
    assert.ok(page.includes(marker), `Expected premium gate marker "${marker}"`);
  }
});
