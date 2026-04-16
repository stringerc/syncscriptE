#!/usr/bin/env node
/**
 * Read-only report: compare registry "latest" vs local CLIs for agent tooling.
 * Hermes in this repo is source in integrations/ — no npm upstream; track via git.
 *
 * Usage: node scripts/report-external-tooling-versions.mjs [--json]
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function sh(cmd, opts = {}) {
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      ...opts,
    }).trim();
  } catch {
    return null;
  }
}

function npmView(pkg) {
  return sh(`npm view ${pkg} version 2>/dev/null`);
}

const jsonMode = process.argv.includes('--json');

const report = {
  generatedAt: new Date().toISOString(),
  node: process.version,
  npm: sh('npm --version'),
  registry: {
    openclaw: npmView('openclaw'),
  },
  localCli: {
    openclaw: sh('openclaw --version 2>/dev/null'),
    cursor_agent: sh('cursor-agent --version 2>/dev/null'),
    claude: sh('claude --version 2>/dev/null'),
  },
  hermes: {
    note: 'Hermes executor is repo-local (integrations/hermes-executor-server.mjs); update via git + Edge deploy, not npm.',
    bridgeContract: 'See integrations/HERMES.md and tests/hermes-edge-contract.test.mjs',
  },
  n8n: {
    note: 'n8n is catalog-only in SyncScript (integration-catalog). Self-hosted n8n: use upstream release notes + Docker image tags or n8n upgrade docs — not wired in this repo.',
  },
  cursorIde: {
    note: 'Cursor desktop auto-updates inside the app (Check for Updates). No stable public API for "latest Cursor build" in CI; subscribe to changelog or in-app updates.',
    changelog: 'https://cursor.com/changelog',
  },
};

let lockOpenclaw = null;
try {
  const lock = readFileSync(join(root, 'package-lock.json'), 'utf8');
  const m = lock.match(/"node_modules\/openclaw"[\s\S]*?"version"\s*:\s*"([^"]+)"/);
  if (m) lockOpenclaw = m[1];
} catch {
  /* optional */
}
report.lockfile = lockOpenclaw ? { openclaw: lockOpenclaw } : {};

if (jsonMode) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

console.log('=== SyncScript tooling radar (read-only) ===\n');
console.log(`Time: ${report.generatedAt}`);
console.log(`Node: ${report.node}  npm: ${report.npm}\n`);
console.log('Registry (npm latest):');
console.log(`  openclaw        ${report.registry.openclaw ?? 'n/a'}\n`);
console.log('Local CLIs (if installed):');
console.log(`  openclaw        ${report.localCli.openclaw ?? '(not in PATH)'}`);
console.log(`  cursor-agent    ${report.localCli.cursor_agent ?? '(not in PATH)'}`);
console.log(`  claude          ${report.localCli.claude ?? '(not in PATH)'}\n`);
if (report.lockfile.openclaw) {
  console.log(`package-lock openclaw: ${report.lockfile.openclaw}\n`);
}
console.log('Hermes:', report.hermes.note);
console.log('n8n:   ', report.n8n.note);
console.log('Cursor IDE:', report.cursorIde.note);
console.log(`  ${report.cursorIde.changelog}\n`);
console.log('Suggested automation: weekly GitHub Action `tooling-radar`, Dependabot for npm + actions, manual Cursor updates.');
