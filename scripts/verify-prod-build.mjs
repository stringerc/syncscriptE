#!/usr/bin/env node
/**
 * Compare local git HEAD to production index.html <!-- syncscript-build:SHA --> comment.
 * Usage: node scripts/verify-prod-build.mjs [https://www.syncscript.app]
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const url = process.argv[2] || process.env.VERIFY_PROD_URL || 'https://www.syncscript.app';

let localSha;
try {
  localSha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch {
  console.error('verify-prod-build: not a git repo or git missing');
  process.exit(2);
}

const res = await fetch(url, { redirect: 'follow', headers: { 'cache-control': 'no-cache' } });
if (!res.ok) {
  console.error(`verify-prod-build: GET ${url} → ${res.status}`);
  process.exit(1);
}
const html = await res.text();
const m = html.match(/<!--\s*syncscript-build:([a-f0-9]+)\s*-->/i);
if (!m) {
  console.error('verify-prod-build: no <!-- syncscript-build:... --> in index.html');
  console.error('  Likely causes: production not deployed from this repo/branch, or stale CDN/service-worker cache.');
  console.error('  Local HEAD:', localSha);
  console.error('  Fix: push main → Vercel production; hard-reload; confirm Settings → Git → stringerc/syncscriptE + main.');
  console.error('  Source: vite.config.ts plugin syncscript-build-html-comment (injected on `npm run build`).');
  process.exit(1);
}

const remote = m[1];
const match =
  remote === localSha ||
  localSha.startsWith(remote) ||
  remote.startsWith(localSha);

console.log(`verify-prod-build: local ${localSha} | prod HTML ${remote} | ${match ? 'MATCH' : 'MISMATCH'}`);
process.exit(match ? 0 : 1);
