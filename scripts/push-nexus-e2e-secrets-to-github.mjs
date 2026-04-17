#!/usr/bin/env node
/**
 * Reads NEXUS_LIVE_TEST_EMAIL / NEXUS_LIVE_TEST_PASSWORD from .env and sets
 * GitHub Actions repository secrets (never prints secret values).
 *
 * Usage: node scripts/push-nexus-e2e-secrets-to-github.mjs
 * Requires: gh auth login, repo origin pointing at github.com
 *
 * Optional: NEXUS_E2E_INCLUDE_PLACES=1 NEXUS_E2E_INCLUDE_VOICE=1 in .env to
 * also push those flags (defaults: set both to "1" for CI opt-in tests).
 */
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env');

function parseEnv(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    const i = s.indexOf('=');
    if (i === -1) continue;
    const k = s.slice(0, i).trim();
    let v = s.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1).replace(/\\n/g, '\n');
    }
    out[k] = v;
  }
  return out;
}

function ghSecretSetFromStdin(name, value) {
  execFileSync('gh', ['secret', 'set', name], {
    input: value,
    stdio: ['pipe', 'inherit', 'inherit'],
    cwd: root,
  });
}

function ghSecretSetBody(name, value) {
  execFileSync('gh', ['secret', 'set', name, '-b', value], {
    stdio: 'inherit',
    cwd: root,
  });
}

if (!existsSync(envPath)) {
  console.error('Missing .env — run npm run bootstrap:nexus-verify-user first.');
  process.exit(1);
}

const env = parseEnv(readFileSync(envPath, 'utf8'));
const email = env.NEXUS_LIVE_TEST_EMAIL || env.E2E_LOGIN_EMAIL;
const password = env.NEXUS_LIVE_TEST_PASSWORD || env.E2E_LOGIN_PASSWORD;

if (!email || !password) {
  console.error(
    'Missing NEXUS_LIVE_TEST_EMAIL / NEXUS_LIVE_TEST_PASSWORD in .env',
  );
  process.exit(1);
}

console.log('Setting GitHub secrets (values not shown)…');
ghSecretSetFromStdin('NEXUS_LIVE_TEST_EMAIL', email);
ghSecretSetFromStdin('NEXUS_LIVE_TEST_PASSWORD', password);
// Optional alias names used by workflow
ghSecretSetFromStdin('E2E_LOGIN_EMAIL', email);
ghSecretSetFromStdin('E2E_LOGIN_PASSWORD', password);

const places = env.NEXUS_E2E_INCLUDE_PLACES ?? '1';
const voice = env.NEXUS_E2E_INCLUDE_VOICE ?? '1';
ghSecretSetBody('NEXUS_E2E_INCLUDE_PLACES', places);
ghSecretSetBody('NEXUS_E2E_INCLUDE_VOICE', voice);

console.log('Done: NEXUS_LIVE_TEST_*, E2E_LOGIN_*, NEXUS_E2E_INCLUDE_PLACES, NEXUS_E2E_INCLUDE_VOICE');
