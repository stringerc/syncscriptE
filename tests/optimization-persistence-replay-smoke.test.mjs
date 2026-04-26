import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('mission bridge persists optimization runs/results and enforces replay gate', () => {
  const bridge = read('supabase/functions/make-server-57781ad9/openclaw-bridge.tsx');
  const markers = [
    'interface OptimizationRunRecord',
    'interface OptimizationResultRecord',
    'toOptimizationRunKey',
    'toOptimizationResultKey',
    'upsertOptimizationRun',
    'createOptimizationResultIfAbsent',
    'optimization_replay_mismatch',
    "node.kind === 'optimize'",
    'replayPassed',
    "status: 'blocked'",
    'approvalId',
  ];
  for (const marker of markers) {
    assert.ok(bridge.includes(marker), `Expected mission bridge marker "${marker}"`);
  }
});

test('mission runtime blocks optimize node completion on replay fail', () => {
  const runtime = read('src/orchestration/mission-runtime.ts');
  const markers = [
    "node.kind === 'optimize'",
    'replayPassed === false',
    "input.nextStatus === 'completed'",
    "const nextStatus = replayFailed ? 'blocked' : input.nextStatus",
  ];
  for (const marker of markers) {
    assert.ok(runtime.includes(marker), `Expected replay guard marker "${marker}"`);
  }
});

test('optimization persistence migrations are present', () => {
  const runsMigration = read('supabase/migrations/20260317080000_create_optimization_runs.sql');
  const resultsMigration = read('supabase/migrations/20260317080100_create_optimization_results.sql');
  assert.ok(runsMigration.includes('create table if not exists public.optimization_runs'));
  assert.ok(runsMigration.includes('optimization_runs_idempotency_key_idx'));
  assert.ok(resultsMigration.includes('create table if not exists public.optimization_results'));
  assert.ok(resultsMigration.includes('optimization_results_repro_token_idx'));
});
