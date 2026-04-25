#!/usr/bin/env node
/**
 * Guard: every `scripts/<name>.<ext>` reference inside a tracked workflow YAML
 * (i.e. anything CI actually runs) must point at a tracked script file.
 *
 * Why: `.gitignore` has `scripts/*` with a tiny `!scripts/<name>` allowlist.
 * It's easy to add a new CI step that calls a script that exists locally but
 * was never committed — CI then dies the next time it runs (sometimes 8 hours
 * later, on a schedule). This guard makes that failure mode visible at PR time.
 *
 * Scope (intentional):
 *   - Sources scanned: TRACKED workflow YAMLs only.
 *   - Targets validated: any `scripts/...mjs|sh|js|ts|cjs` substring.
 *
 * NOT scanned: package.json. Many `npm run X` targets are developer-only
 * smoke / evidence scripts that intentionally aren't shipped — failing the
 * guard on those would generate noise without catching real CI breakage.
 *
 * Local working-tree cruft (untracked YAMLs, modified-but-not-staged) is
 * IGNORED — only what's in git matters because that's what CI sees after
 * `actions/checkout`.
 *
 * Exit codes:
 *   0 — every workflow reference resolves to a tracked file
 *   1 — one or more references are dangling (printed with source location)
 */
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SCRIPT_REF = /scripts\/[A-Za-z0-9_/-]+\.(?:mjs|sh|js|ts|cjs)/g;

function trackedFiles() {
  return new Set(
    execSync('git ls-files', { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean),
  );
}

function* yamlPaths(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* yamlPaths(p);
    else if (e.name.endsWith('.yml') || e.name.endsWith('.yaml')) yield p;
  }
}

const tracked = trackedFiles();

const sources = [...yamlPaths('.github/workflows')].filter((p) => tracked.has(p));

if (sources.length === 0) {
  console.error('guard-ci-script-refs: no tracked workflow YAMLs found — nothing to check.');
  process.exit(0);
}

const refs = new Map(); // ref -> Set of source files
for (const src of sources) {
  let content;
  try {
    // Read tracked content from the index, not the working tree, so local
    // unstaged edits don't produce false positives on the same branch.
    content = execSync(`git show :${src}`, { encoding: 'utf8' });
  } catch {
    // Path tracked but unreadable from index (race during rebase, etc.) —
    // fall back to disk; if that fails too, skip the file.
    try {
      content = readFileSync(src, 'utf8');
    } catch {
      continue;
    }
  }
  for (const m of content.matchAll(SCRIPT_REF)) {
    if (!refs.has(m[0])) refs.set(m[0], new Set());
    refs.get(m[0]).add(src);
  }
}

const trackedScripts = new Set(
  [...tracked].filter((f) => f.startsWith('scripts/')),
);

const missing = [];
for (const [ref, srcSet] of refs.entries()) {
  if (!trackedScripts.has(ref)) {
    missing.push({ ref, sources: [...srcSet] });
  }
}

if (missing.length === 0) {
  console.log(
    `guard-ci-script-refs: ok — ${refs.size} script reference(s) across ${sources.length} tracked source(s); all committed.`,
  );
  process.exit(0);
}

console.error(
  `guard-ci-script-refs: FAIL — ${missing.length} script reference(s) point at uncommitted file(s):\n`,
);
for (const m of missing) {
  console.error(`  \u2717 ${m.ref}`);
  for (const src of m.sources) console.error(`      referenced in: ${src}`);
}
console.error('');
console.error('Fix:');
console.error('  1. Commit the script(s) under scripts/ to git.');
console.error('  2. Add `!<path>` to .gitignore so future clones keep them tracked');
console.error('     (the scripts/ folder defaults to ignored — see line 92 of .gitignore).');
process.exit(1);
