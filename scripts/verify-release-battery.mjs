#!/usr/bin/env node
/**
 * Multi-angle release verification: contracts, Edge HTTP, prod HTML checklist,
 * local preview console errors, Playwright against prod (signed-in + nav + Nexus task),
 * then live prod smoke (routes + TTS POST).
 *
 * Prerequisites: repo-root `.env` with E2E / NEXUS creds for signed-in Playwright specs.
 * Optional: `SYNCSCRIPT_TEST_JWT` in `.env` for extra Edge productivity checks.
 *
 * Note: `e2e/nexus-login-create-task.spec.ts` is intentionally omitted here — it can exceed
 * several minutes when the LLM/tool loop is slow. Run it separately: `npm run test:e2e:nexus-task`.
 *
 * Usage:
 *   npm run verify:release-battery
 *   PLAYWRIGHT_BASE_URL=https://www.syncscript.app npm run verify:release-battery
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const base = (process.env.PLAYWRIGHT_BASE_URL || 'https://www.syncscript.app').replace(/\/$/, '');

const env = { ...process.env, CI: 'true', PLAYWRIGHT_BASE_URL: base };

function run(name, command, args, extraEnv = {}) {
  console.log(`\n========== ${name} ==========\n`);
  const r = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...env, ...extraEnv },
    shell: false,
  });
  if (r.status !== 0) {
    console.error(`\n>>> FAILED: ${name} (exit ${r.status ?? r.signal})\n`);
    return false;
  }
  console.log(`\n>>> OK: ${name}\n`);
  return true;
}

let failed = 0;
const fail = () => {
  failed++;
};

if (!run('npm test', 'npm', ['test'])) fail();

if (!run('guard:dashboard-route-shell', 'npm', ['run', 'guard:dashboard-route-shell'])) fail();

const edgeArgs = existsSync(join(root, '.env'))
  ? ['--env-file=.env', join(root, 'scripts/verify-edge-productivity-http.mjs')]
  : [join(root, 'scripts/verify-edge-productivity-http.mjs')];
if (!run('verify-edge-productivity-http', 'node', edgeArgs)) fail();

if (!run('verify-prod-build', 'node', [join(root, 'scripts/verify-prod-build.mjs'), base])) fail();

if (!run('verify-post-deploy-checklist', 'node', [join(root, 'scripts/verify-post-deploy-checklist.mjs')], { VERIFY_PROD_URL: base }))
  fail();

if (!run('verify:console-errors', 'npm', ['run', 'verify:console-errors'])) fail();

if (!run('playwright install chromium', 'npx', ['playwright', 'install', 'chromium'])) fail();

const e2eFiles = [
  'e2e/signed-in-productivity-edge.spec.ts',
  'e2e/nexus-signed-in-profile-and-calendar.spec.ts',
  'e2e/dashboard-nav.spec.ts',
  'e2e/dashboard-nav-legacy-redirect.spec.ts',
  'e2e/dashboard-page-health.spec.ts',
];
if (!run('playwright prod E2E', 'npx', ['playwright', 'test', ...e2eFiles, '--project=chromium'])) fail();

if (!run('verify:prod:live', 'npm', ['run', 'verify:prod:live'], { BASE_URL: base })) fail();

console.log(`\n========== SUMMARY: ${failed} failed step(s) ==========\n`);
process.exit(failed > 0 ? 1 : 0);
