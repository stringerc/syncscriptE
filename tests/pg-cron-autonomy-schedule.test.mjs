/**
 * Contract: the autonomy migration schedules exactly the expected pg_cron
 * jobs with the expected schedules, and ships the concurrency-claim RPC
 * that `runConciergePlaybookTick` now depends on.
 *
 * Runs statically against the SQL file — no live DB required, so it works
 * in `npm test` alongside the other smoke contracts.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const MIGRATION = resolve(
  process.cwd(),
  'supabase/migrations/20260423150000_pg_cron_autonomy.sql',
);

const sql = readFileSync(MIGRATION, 'utf8');

const expected = [
  { name: 'syncscript.concierge.tick', schedule: '* * * * *', endpointHint: '/api/cron/concierge-playbook-tick' },
  { name: 'syncscript.phone.dispatch', schedule: '*/2 * * * *', endpointHint: '/api/cron/phone-dispatch' },
  { name: 'syncscript.process-emails', schedule: '*/5 * * * *', endpointHint: '/api/cron/process-emails' },
  { name: 'syncscript.tts.slo',        schedule: '*/10 * * * *', endpointHint: '/api/cron/tts-slo' },
  { name: 'syncscript.proactive.detect', schedule: '*/15 * * * *', endpointHint: '/make-server-57781ad9/admin/detect/all' },
];

test('pg_cron autonomy migration enables required extensions', () => {
  assert.match(sql, /CREATE EXTENSION IF NOT EXISTS pg_cron/);
  assert.match(sql, /CREATE EXTENSION IF NOT EXISTS pg_net/);
});

test('pg_cron autonomy migration ships concurrency-claim RPCs', () => {
  assert.match(
    sql,
    /CREATE OR REPLACE FUNCTION public\.claim_next_playbook_runs\(/,
    'claim_next_playbook_runs must be defined for the worker concurrency guard',
  );
  assert.match(
    sql,
    /CREATE OR REPLACE FUNCTION public\.release_playbook_run_claim\(/,
    'release_playbook_run_claim must be defined',
  );
  assert.match(sql, /FOR UPDATE SKIP LOCKED/, 'row lock must use SKIP LOCKED to be safe under concurrent ticks');
  assert.match(
    sql,
    /GRANT EXECUTE ON FUNCTION public\.claim_next_playbook_runs\(INT, INT\) TO service_role;/,
    'service_role must be able to call the claim RPC from the Vercel worker',
  );
});

test('pg_cron autonomy migration ships vault-backed HTTP helper', () => {
  assert.match(
    sql,
    /CREATE OR REPLACE FUNCTION public\.syncscript_autonomy_post\(/,
    'helper keeps HTTP + vault logic in one reviewable place',
  );
  assert.match(sql, /vault\.decrypted_secrets/, 'secrets must come from Supabase Vault, not inline strings');
  assert.match(sql, /SECURITY DEFINER/, 'helper must be SECURITY DEFINER so cron role can read vault via it');
});

for (const job of expected) {
  test(`schedules ${job.name} at ${job.schedule}`, () => {
    const scheduleRegex = new RegExp(
      `cron\\.schedule\\(\\s*'${escapeRegex(job.name)}',\\s*'${escapeRegex(job.schedule)}'`,
    );
    assert.match(sql, scheduleRegex, `expected cron.schedule('${job.name}', '${job.schedule}', ...)`);
    assert.ok(
      sql.includes(job.endpointHint),
      `expected ${job.name} target to include "${job.endpointHint}"`,
    );
  });
}

test('jobs are namespaced under syncscript.* so pause/unschedule stays contained', () => {
  const matches = sql.match(/cron\.schedule\(\s*'([^']+)'/g) || [];
  const names = matches.map((m) => m.replace(/^cron\.schedule\(\s*'/, '').replace(/'$/, ''));
  for (const name of names) {
    assert.ok(
      name.startsWith('syncscript.'),
      `cron job "${name}" must start with "syncscript." (operators filter by this prefix)`,
    );
  }
  assert.equal(names.length, expected.length, `expected ${expected.length} cron jobs, got ${names.length}`);
});

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
