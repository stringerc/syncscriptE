/**
 * Production Edge entry is index.ts — social/productivity + financial must mount
 * (index.tsx is not deployed; drift caused missing /activity/* until 2026-05-01).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const idxTs = readFileSync(join(root, 'supabase/functions/make-server-57781ad9/index.ts'), 'utf8');

test('index.ts imports social productivity + financial routes', () => {
  assert.match(idxTs, /import\s+socialProductivityRoutes\s+from\s+["']\.\/social-productivity-routes\.tsx["']/);
  assert.match(idxTs, /import\s+financialRoutes\s+from\s+["']\.\/financial-routes\.tsx["']/);
});

test('index.ts imports capture inbox routes', () => {
  assert.match(idxTs, /import\s+captureInboxRoutes\s+from\s+["']\.\/capture-inbox-routes\.tsx["']/);
});

test('index.ts mounts productivity and financial under /make-server-57781ad9', () => {
  assert.match(idxTs, /app\.route\(['"]\/make-server-57781ad9['"],\s*socialProductivityRoutes\)/);
  assert.match(idxTs, /app\.route\(["']\/make-server-57781ad9\/financial["'],\s*financialRoutes\)/);
});

test('index.ts mounts capture inbox under /make-server-57781ad9', () => {
  assert.match(idxTs, /app\.route\(['"]\/make-server-57781ad9['"],\s*captureInboxRoutes\)/);
});
