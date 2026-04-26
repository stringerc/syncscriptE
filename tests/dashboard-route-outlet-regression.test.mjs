/**
 * Contract: dashboard routes use DashboardShell + Outlet; sidebar targets have Route entries.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appPath = join(root, 'src', 'App.tsx');
const app = readFileSync(appPath, 'utf8');
const navPath = join(root, 'src', 'utils', 'navigation.ts');
const nav = readFileSync(navPath, 'utf8');

test('App.tsx uses DashboardShell + Outlet, not DashboardRoutes + nested splat', () => {
  assert.match(app, /function DashboardShell/);
  assert.match(app, /<Outlet\s*\/?>/);
  assert.equal(app.includes('function DashboardRoutes'), false);
  assert.equal(/path="\*\/"\s+element=\{<DashboardRoutes/.test(app), false);
});

test('App.tsx declares legacy /dashboard/* redirects (header search used these paths)', () => {
  for (const seg of [
    'dashboard/tasks',
    'dashboard/calendar',
    'dashboard/analytics',
    'dashboard/ai-assistant',
    'dashboard/gamification',
  ]) {
    const needle = `path="${seg}"`;
    assert.ok(
      app.includes(needle),
      `App.tsx must include ${needle} with Navigate to canonical route`,
    );
  }
});

test('every main sidebar path has a matching Route path= in App.tsx (under shell)', () => {
  const pathStrings = [];
  const re = /sidebar:\s*\{([^}]+)\}/s;
  const m = nav.match(re);
  assert.ok(m, 'navigation.ts should contain sidebar: { ... }');
  const block = m[1];
  for (const line of block.split('\n')) {
    const pm = line.match(/^\s*(\w+):\s*'(\/[^']+)'/);
    if (!pm) continue;
    const url = pm[2];
    if (url === '/' || url.startsWith('/app')) continue;
    pathStrings.push(url.replace(/^\//, ''));
  }
  assert.ok(pathStrings.includes('dashboard'));
  assert.ok(pathStrings.includes('tasks'));
  for (const seg of pathStrings) {
    const needle = `path="${seg}"`;
    assert.ok(
      app.includes(needle),
      `App.tsx must declare ${needle} for sidebar link /${seg} (add Route or fix navigation.ts)`,
    );
  }
});
