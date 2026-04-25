/**
 * Nexus Agent Runner — main entry.
 *
 * Two surfaces:
 *   1. HTTP /v1/runs/start — Vercel calls this to wake the runner up immediately
 *      (otherwise we'd wait until the next poll cycle).
 *   2. Background poller — claims due agent_runs every 5s via SKIP LOCKED RPC.
 *
 * Concurrency: AGENT_RUNNER_MAX_CONCURRENCY (default 4) — Oracle ARM A1
 * with 24 GB RAM comfortably runs ~4 Chromium instances in parallel.
 */
import http from 'node:http';
import { createClient } from '@supabase/supabase-js';
import { runAgentLoop } from './agent-loop.mjs';

const PORT = parseInt(process.env.AGENT_RUNNER_PORT || '18790', 10);
const TOKEN = process.env.AGENT_RUNNER_TOKEN || '';
const POLL_INTERVAL = parseInt(process.env.AGENT_RUNNER_POLL_INTERVAL_MS || '5000', 10);
const LEASE_SECONDS = parseInt(process.env.AGENT_RUNNER_HEARTBEAT_LEASE_SECONDS || '300', 10);
const MAX_CONCURRENCY = parseInt(process.env.AGENT_RUNNER_MAX_CONCURRENCY || '4', 10);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY; runner cannot start.');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

let activeRuns = 0;
const startedAt = new Date().toISOString();

async function processOneRun(run) {
  activeRuns++;
  console.log(`[runner] starting run ${run.id} (goal: "${run.goal_text.slice(0, 80)}")`);
  try {
    const result = await runAgentLoop({ run, sb });
    console.log(`[runner] run ${run.id} → ${result.outcome} (${result.stepsExecuted} steps, ${result.totalCostCents}¢)`);
  } catch (e) {
    console.error(`[runner] run ${run.id} crashed:`, e?.message || e);
    try {
      await sb.rpc('complete_agent_run', {
        p_run_id: run.id,
        p_status: 'failed',
        p_summary: null,
        p_error_text: String(e?.message || e).slice(0, 1000),
        p_total_cost_cents: 0,
      });
    } catch {}
  } finally {
    activeRuns--;
  }
}

async function pollOnce() {
  if (activeRuns >= MAX_CONCURRENCY) return;
  const slots = MAX_CONCURRENCY - activeRuns;
  const { data, error } = await sb.rpc('claim_next_agent_runs', {
    lease_seconds: LEASE_SECONDS,
    limit_n: slots,
  });
  if (error) {
    console.warn('[runner] claim error:', error.message);
    return;
  }
  if (!data || data.length === 0) return;
  // Fire and forget — `processOneRun` handles its own errors and concurrency tracking.
  for (const run of data) processOneRun(run);
}

function startPoller() {
  setInterval(() => {
    pollOnce().catch((e) => console.warn('[runner] poll exception:', e?.message || e));
  }, POLL_INTERVAL);
  console.log(`[runner] poller every ${POLL_INTERVAL}ms, max concurrency ${MAX_CONCURRENCY}`);
}

function startHttp() {
  const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'GET' && req.url === '/v1/health') {
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, started_at: startedAt, active_runs: activeRuns, max_concurrency: MAX_CONCURRENCY }));
      return;
    }

    if (req.method === 'POST' && req.url === '/v1/runs/start') {
      const auth = req.headers['authorization'] || '';
      if (TOKEN && auth !== `Bearer ${TOKEN}`) {
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'unauthorized' }));
        return;
      }
      let chunks = [];
      for await (const c of req) chunks.push(c);
      let body;
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { body = {}; }
      // Wake the poller — actual claim happens via SKIP LOCKED, so this is just a hint.
      pollOnce().catch(() => {});
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, hinted_run_id: body.run_id || null }));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'not_found' }));
  });

  server.listen(PORT, () => {
    console.log(`[runner] listening on :${PORT}`);
  });
}

process.on('SIGTERM', () => {
  console.log('[runner] SIGTERM — letting active runs drain');
  // Don't kill in-flight runs; tini will SIGKILL after grace period.
});

startPoller();
startHttp();
