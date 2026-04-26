#!/usr/bin/env node
/**
 * CI-friendly console-error E2E: fresh build, Chromium, vite preview on a free port.
 * Avoids hard-coded E2E_PREVIEW_PORT collisions when a dev preview is already running.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const freePortScript = join(__dirname, 'free-tcp-port.mjs');

const port = execFileSync(process.execPath, [freePortScript], {
  encoding: 'utf8',
  cwd: repoRoot,
}).trim();

const env = { ...process.env, CI: 'true', E2E_PREVIEW_PORT: port };

const build = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  cwd: repoRoot,
  env: { ...env },
  shell: false,
});
if (build.status !== 0) process.exit(build.status ?? 1);

const install = spawnSync('npx', ['playwright', 'install', 'chromium'], {
  stdio: 'inherit',
  cwd: repoRoot,
  env: { ...env },
  shell: true,
});
if (install.status !== 0) process.exit(install.status ?? 1);

const test = spawnSync(
  'npx',
  ['playwright', 'test', 'e2e/console-errors.spec.ts', '--project=chromium'],
  { stdio: 'inherit', cwd: repoRoot, env: { ...env }, shell: true },
);
process.exit(test.status ?? 1);
