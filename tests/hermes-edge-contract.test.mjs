/**
 * Static contract: Hermes Edge bridge + mount + client path.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const bridgePath = join(root, 'supabase/functions/make-server-57781ad9/hermes-bridge.tsx');
const indexTsPath = join(root, 'supabase/functions/make-server-57781ad9/index.ts');
const indexTsxPath = join(root, 'supabase/functions/make-server-57781ad9/index.tsx');
const clientPath = join(root, 'src/utils/hermes-client.ts');
const docPath = join(root, 'integrations/HERMES.md');

test('hermes-bridge.tsx defines health, tools, invoke + HERMES_BASE_URL', () => {
  const b = readFileSync(bridgePath, 'utf8');
  assert.match(b, /hermesBridge\.get\(\s*"\/health"/);
  assert.match(b, /hermesBridge\.get\(\s*"\/tools"/);
  assert.match(b, /hermesBridge\.post\(\s*"\/invoke"/);
  assert.match(b, /HERMES_BASE_URL/);
  assert.match(b, /\/v1\/tools/);
  assert.match(b, /\/v1\/invoke/);
  assert.match(b, /authenticateUser/);
  assert.match(b, /Authorization:\s*authz/);
});

test('index.ts and index.tsx mount hermes bridge', () => {
  for (const p of [indexTsPath, indexTsxPath]) {
    const s = readFileSync(p, 'utf8');
    assert.match(s, /import\s+hermesBridge\s+from\s+["']\.\/hermes-bridge\.tsx["']/);
    assert.match(s, /app\.route\(\s*["']\/make-server-57781ad9\/hermes["']\s*,\s*hermesBridge\s*\)/);
  }
});

test('hermes-client targets Supabase function path', () => {
  const c = readFileSync(clientPath, 'utf8');
  assert.match(c, /\/functions\/v1\/make-server-57781ad9\/hermes/);
  assert.match(c, /fetchHermesBridgeHealth/);
  assert.match(c, /invokeHermesTool/);
});

test('HERMES.md documents contract and tools', () => {
  const d = readFileSync(docPath, 'utf8');
  assert.match(d, /apply_task_patch/);
  assert.match(d, /create_calendar_hold/);
  assert.match(d, /agent\.run\.step/);
});
