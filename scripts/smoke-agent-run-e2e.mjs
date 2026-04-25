#!/usr/bin/env node
/**
 * End-to-end smoke test for the Nexus Agent Runner pipeline.
 *
 * Exercises:
 *   1. Insert an agent_runs row using the service-role key (skip the Vercel /api/agent
 *      dispatcher so we test the runner pipeline in isolation).
 *   2. Watch /v1/health on the runner — active_runs should bump 0 → 1 within ~6s
 *      (poll interval is 5s).
 *   3. Watch agent_runs.status transition queued → running → done|failed|paused.
 *   4. Watch agent_run_steps populate as the LLM emits actions.
 *   5. Print the final summary + step count.
 *
 * Required env (load from Vercel: `vercel env pull /tmp/.env.runner.tmp --environment=production --yes`):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional:
 *   AGENT_RUNNER_BASE_URL (default: GH var or trycloudflare URL)
 *   SMOKE_USER_ID (default: first authenticated user in the table)
 *   SMOKE_GOAL    (default: short example.com extract)
 *   SMOKE_TIMEOUT_MS (default: 180000)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kwhnrlzibgfedtxpkbgb.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY env');
  process.exit(2);
}
const RUNNER_BASE = (process.env.AGENT_RUNNER_BASE_URL || '').replace(/\/$/, '');
const SMOKE_GOAL = process.env.SMOKE_GOAL ||
  'Go to https://example.com and extract the H1 heading text. Then call finish() with that text as the summary.';
const TIMEOUT_MS = parseInt(process.env.SMOKE_TIMEOUT_MS || '180000', 10);

const sb = createClient(SUPABASE_URL, KEY, { auth: { persistSession: false } });

function log(...args) { console.log(`[smoke ${new Date().toISOString().slice(11, 19)}]`, ...args); }
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function pickUserId() {
  if (process.env.SMOKE_USER_ID) return process.env.SMOKE_USER_ID;
  const { data, error } = await sb.auth.admin.listUsers({ perPage: 1 });
  if (error) throw error;
  if (!data?.users?.length) throw new Error('No auth users to attribute the run to');
  return data.users[0].id;
}

async function probeRunnerHealth() {
  if (!RUNNER_BASE) return null;
  try {
    const r = await fetch(`${RUNNER_BASE}/v1/health`, { signal: AbortSignal.timeout(5000) });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

async function main() {
  log('runner base url:', RUNNER_BASE || '(unset — will skip /v1/health probe)');

  const initialHealth = await probeRunnerHealth();
  if (initialHealth) log('initial health:', initialHealth);

  const userId = await pickUserId();
  log('attribution user_id:', userId);

  // Ensure user has an automation_policies row + reasonable tier
  await sb.from('automation_policies').upsert({
    user_id: userId,
    tier: 'A', // read-only, safest
    daily_run_cap: 100,
    daily_cost_cap_cents: 100,
    agent_paused: false,
  }, { onConflict: 'user_id' });

  log('inserting agent_runs row…');
  const { data: ins, error: insErr } = await sb.from('agent_runs').insert({
    user_id: userId,
    goal_text: SMOKE_GOAL,
    status: 'queued',
    provider: 'nvidia',
    model: 'meta/llama-3.2-90b-vision-instruct',
    tier_at_start: 'A',
  }).select('*').single();
  if (insErr) throw insErr;
  log('inserted run id:', ins.id);

  // Hint the runner so we don't wait the full poll interval.
  if (RUNNER_BASE && process.env.AGENT_RUNNER_TOKEN) {
    try {
      await fetch(`${RUNNER_BASE}/v1/runs/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.AGENT_RUNNER_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_id: ins.id }),
        signal: AbortSignal.timeout(5000),
      });
      log('hinted runner /v1/runs/start');
    } catch (e) { log('hint failed (non-fatal):', e?.message); }
  }

  const start = Date.now();
  let lastStatus = 'queued';
  let lastSteps = 0;
  let runnerHadActive = false;

  while (Date.now() - start < TIMEOUT_MS) {
    await sleep(2000);

    const { data: row } = await sb.from('agent_runs').select('*').eq('id', ins.id).single();
    const { count: stepCount } = await sb
      .from('agent_run_steps')
      .select('id', { count: 'exact', head: true })
      .eq('run_id', ins.id);

    const health = await probeRunnerHealth();
    if (health && health.active_runs > 0) runnerHadActive = true;

    if (row.status !== lastStatus || (stepCount || 0) !== lastSteps) {
      lastStatus = row.status;
      lastSteps = stepCount || 0;
      log(`status=${row.status}  steps=${lastSteps}  active_runs=${health?.active_runs ?? '?'}`);
    }

    if (['done', 'failed', 'cancelled', 'paused'].includes(row.status)) {
      log('=== final state ===');
      log('status:', row.status);
      log('steps:', stepCount);
      log('summary:', row.summary || '(none)');
      log('error:', row.error_text || '(none)');
      log('cost:', row.total_cost_cents, '¢');

      // Pull the last few step rows
      const { data: lastStepsRows } = await sb
        .from('agent_run_steps').select('step_index,kind,payload')
        .eq('run_id', ins.id).order('step_index', { ascending: true }).limit(10);
      if (lastStepsRows?.length) {
        log('--- step trail ---');
        for (const s of lastStepsRows) {
          const summary = JSON.stringify(s.payload).slice(0, 120);
          console.log(`  [${s.step_index}] ${s.kind}: ${summary}`);
        }
      }

      const passed =
        ['done', 'paused'].includes(row.status) &&
        runnerHadActive &&
        (stepCount || 0) > 0;

      console.log('');
      if (passed) {
        log('✅ SMOKE PASS — runner claimed, executed steps, completed.');
        process.exit(0);
      } else {
        log('❌ SMOKE FAIL —', { status: row.status, runnerHadActive, stepCount });
        process.exit(1);
      }
    }
  }

  log('❌ TIMEOUT — last status:', lastStatus, 'steps:', lastSteps, 'runner active sighted:', runnerHadActive);
  process.exit(1);
}

main().catch((e) => { console.error('[smoke] crash:', e?.stack || e); process.exit(2); });
