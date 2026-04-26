import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const brainRoot = join(__dirname, '../api/ai/_lib/nexus-brain');

function readJson(rel) {
  return JSON.parse(readFileSync(join(brainRoot, rel), 'utf8'));
}

test('nexus-brain manifest has version and schema', () => {
  const m = readJson('manifest.json');
  assert.match(m.version, /^\d{4}-\d{2}-\d{2}\.\d+$/);
  assert.equal(m.schema, 1);
  assert.equal(m.brainId, 'syncscript-nexus');
});

test('public plans match expected canonical pricing', () => {
  const p = readJson('knowledge/public-plans.json');
  assert.equal(p.trialDays, 14);
  const names = p.plans.map((x) => x.name);
  assert.deepEqual(names, ['Free', 'Starter', 'Professional', 'Enterprise']);
  const starter = p.plans.find((x) => x.name === 'Starter');
  assert.equal(starter.price, 19);
  assert.equal(starter.priceAnnual, 15);
  const pro = p.plans.find((x) => x.name === 'Professional');
  assert.equal(pro.price, 49);
  assert.equal(pro.priceAnnual, 39);
});

test('product facts include support and elevator copy', () => {
  const f = readJson('knowledge/product-facts.json');
  const ids = f.facts.map((x) => x.id);
  assert.ok(ids.includes('syncscript-elevator'));
  assert.ok(ids.includes('support-contact'));
  const support = f.facts.find((x) => x.id === 'support-contact');
  assert.match(support.text, /syncscript/i);
});

test('signed-in boundaries policy is non-empty', () => {
  const b = readJson('policies/signed-in-boundaries.json');
  assert.ok(b.id);
  assert.ok(b.appendix.length > 40);
  assert.match(b.appendix, /PRIVATE CONTEXT/i);
});

test('tool registry lists deterministic pricing tool', () => {
  const t = readJson('tools/registry.json');
  const ids = t.tools.map((x) => x.id);
  assert.ok(ids.includes('nexus.get_public_pricing'));
  assert.ok(t.tools.every((x) => x.riskClass));
});
