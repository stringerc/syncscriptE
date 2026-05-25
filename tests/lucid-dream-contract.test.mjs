/**
 * Contract tests for Lucid Dreaming & Astral Projections System.
 * Ensures speculative sandbox engines, external sensing gateways, dynamic Vercel cron registration,
 * app routing, and premium dashboard interfaces conform to the SyncScript system specifications.
 * Does not require external API secrets.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('Lucid Sandbox Compiler api/_lib/lucid-sandbox.ts syntax and scoring contract', () => {
  const src = readFileSync(join(root, 'api/_lib/lucid-sandbox.ts'), 'utf8');
  assert.match(src, /export async function executeLucidDreamCycle/, 'must export executeLucidDreamCycle');
  assert.match(src, /kvGet\(`user_tasks:\$\{userId\}`\)/, 'must fetch user tasks');
  assert.match(src, /iqsScore:/, 'must include IQS score');
  assert.match(src, /oqsScore:/, 'must include OQS score');
  assert.match(src, /delta:/, 'must calculate delta');
  assert.match(src, /scoreRubric:/, 'must have scoreRubric object');
  assert.match(src, /kvSet\(`lucid_proposal:\$\{userId\}`/, 'must cache proposal in KV');
});

test('Astral Gateways Sensing api/_lib/astral-gateways.ts syntax and P2P exchange contract', () => {
  const src = readFileSync(join(root, 'api/_lib/astral-gateways.ts'), 'utf8');
  assert.match(src, /export async function executeAstralProjections/, 'must export executeAstralProjections');
  assert.match(src, /kvSet\(`astral_insights:\$\{userId\}`/, 'must cache astral insights in KV');
  assert.match(src, /dependencies:/, 'must scan dependency versions');
  assert.match(src, /endpoints:/, 'must track API endpoint latencies');
  assert.match(src, /heuristics:/, 'must emulate peer-to-peer heuristic synchronization');
});

test('Dynamic Cron Router api/cron/[job].ts dream/sensing support', () => {
  const src = readFileSync(join(root, 'api/cron/[job].ts'), 'utf8');
  assert.match(src, /case 'lucid-dream':/, 'must support case lucid-dream in switch statement');
  assert.match(src, /case 'astral-project':/, 'must support case astral-project in switch statement');
  assert.match(src, /async function handleLucidDream/, 'must define handleLucidDream helper');
  assert.match(src, /async function handleAstralProject/, 'must define handleAstralProject helper');
});

test('Premium Consciousness Dashboard src/components/pages/LucidDashboardPage.tsx frontend contracts', () => {
  const src = readFileSync(join(root, 'src/components/pages/LucidDashboardPage.tsx'), 'utf8');
  assert.match(src, /export function LucidDashboardPage\(\)/, 'must export LucidDashboardPage component');
  assert.match(src, /fetch\('\/api\/cron\/lucid-dream\?userId=user_001'\)/, 'must query cached speculative patches');
  assert.match(src, /fetch\('\/api\/cron\/astral-project\?userId=user_001'\)/, 'must query cached astral insights');
  assert.match(src, /Wake and Merge/, 'must display Wake and Merge control action button');
  assert.match(src, /Trigger Lucid Dream/, 'must display Trigger Lucid Dream active button');
  assert.match(src, /Project External Probes/, 'must display Project External Probes active button');
});

test('Router Integration src/App.tsx lazy load and path mounts', () => {
  const src = readFileSync(join(root, 'src/App.tsx'), 'utf8');
  assert.match(src, /const LucidDashboardPage = lazy\(/, 'must lazy load LucidDashboardPage');
  assert.match(src, /path="dashboard\/lucid"/, 'must mount path dashboard/lucid');
  assert.match(src, /path="dashboard\/brain"/, 'must mount redirect path dashboard/brain');
});
