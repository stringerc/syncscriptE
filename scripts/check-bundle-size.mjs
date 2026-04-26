#!/usr/bin/env node
/**
 * Bundle-size guard.
 *
 * Fails CI when any built chunk exceeds the configured cap. Prevents a 5 MB
 * import from sneaking through silently — Vite's built-in
 * `chunkSizeWarningLimit` only warns.
 *
 * Usage:
 *   node scripts/check-bundle-size.mjs --max-kb=900 --include='build/assets/*.js'
 */

import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { argv, exit } from 'node:process';

function parseArgs() {
  let maxKb = 1000;
  let includePattern = 'build/assets/*.js';
  for (const a of argv.slice(2)) {
    if (a.startsWith('--max-kb=')) maxKb = Number(a.slice(9));
    else if (a.startsWith('--include=')) includePattern = a.slice(10);
  }
  if (!Number.isFinite(maxKb) || maxKb <= 0) {
    console.error('--max-kb must be a positive number');
    exit(2);
  }
  const idx = includePattern.lastIndexOf('/');
  const dir = includePattern.slice(0, idx) || '.';
  const fileGlob = includePattern.slice(idx + 1);
  const pattern = new RegExp(
    '^' + fileGlob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$',
  );
  return { maxKb, includeDir: dir, pattern };
}

function main() {
  const { maxKb, includeDir, pattern } = parseArgs();
  if (!existsSync(includeDir)) {
    console.error(`[bundle-size-guard] Directory not found: ${includeDir}`);
    console.error('Did you forget to run `npm run build` first?');
    exit(2);
  }
  const files = readdirSync(includeDir)
    .filter((f) => pattern.test(f))
    .map((f) => {
      const fp = join(includeDir, f);
      return { file: f, path: fp, sizeKb: statSync(fp).size / 1024 };
    });

  if (files.length === 0) {
    console.error(`[bundle-size-guard] No files matched pattern in ${includeDir}`);
    exit(2);
  }

  const sorted = [...files].sort((a, b) => b.sizeKb - a.sizeKb);
  const violations = sorted.filter((f) => f.sizeKb > maxKb);

  console.log(`[bundle-size-guard] Cap: ${maxKb} KB`);
  console.log(`[bundle-size-guard] Largest chunks:`);
  for (const f of sorted.slice(0, 8)) {
    const flag = f.sizeKb > maxKb ? '  ❌' : '  ✓';
    console.log(`${flag} ${basename(f.file).padEnd(48)} ${f.sizeKb.toFixed(1)} KB`);
  }

  if (violations.length > 0) {
    console.error(
      `\n[bundle-size-guard] ${violations.length} chunk${violations.length === 1 ? '' : 's'} over ${maxKb} KB cap:`,
    );
    for (const v of violations) {
      console.error(
        `   ${basename(v.file)} — ${v.sizeKb.toFixed(1)} KB (over by ${(v.sizeKb - maxKb).toFixed(1)} KB)`,
      );
    }
    console.error(
      '\nFix options:\n' +
        '  • Lazy-load the heavy feature with React.lazy + import()\n' +
        '  • Split the chunk in vite.config.ts manualChunks\n' +
        '  • Remove a transitive heavy dependency (`npm ls <dep>`)\n' +
        '  • If genuinely necessary, raise --max-kb in .github/workflows/ci.yml with justification\n',
    );
    exit(1);
  }

  const totalKb = files.reduce((s, f) => s + f.sizeKb, 0);
  console.log(`\n[bundle-size-guard] OK — ${files.length} chunks, ${totalKb.toFixed(0)} KB total`);
  exit(0);
}

main();
