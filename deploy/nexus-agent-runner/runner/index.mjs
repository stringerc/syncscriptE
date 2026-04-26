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
import crypto from 'node:crypto';
import { WebSocketServer } from 'ws';
import { createClient } from '@supabase/supabase-js';
import { runAgentLoop } from './agent-loop.mjs';
import { subscribeToRun, screencastStats } from './screencast.mjs';

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

/**
 * HMAC tokens for /live WebSocket auth. Vercel's /api/agent/live-token
 * issues these — they encode { run_id, user_id, exp } signed with the
 * shared AGENT_RUNNER_TOKEN. We verify locally so the runner never has
 * to call back to Supabase per WS connection.
 *
 * Format: base64url(JSON_payload).base64url(HMAC_SHA256(payload))
 */
function verifyLiveToken(token, expectedRunId) {
  if (!token || !TOKEN) return { ok: false, error: 'missing_token' };
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return { ok: false, error: 'malformed' };
  const payloadB64 = token.slice(0, dotIdx);
  const sigB64 = token.slice(dotIdx + 1);
  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch { return { ok: false, error: 'malformed' }; }

  const expected = crypto.createHmac('sha256', TOKEN).update(payloadB64).digest('base64url');
  // Constant-time compare
  const sigBuf = Buffer.from(sigB64, 'base64url');
  const expBuf = Buffer.from(expected, 'base64url');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { ok: false, error: 'bad_signature' };
  }
  if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
    return { ok: false, error: 'expired' };
  }
  if (payload.run_id !== expectedRunId) {
    return { ok: false, error: 'run_mismatch' };
  }
  return { ok: true, payload };
}

function startHttp() {
  const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'GET' && req.url === '/v1/health') {
      res.writeHead(200);
      res.end(JSON.stringify({
        ok: true,
        started_at: startedAt,
        active_runs: activeRuns,
        max_concurrency: MAX_CONCURRENCY,
        screencasts: screencastStats(),
      }));
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

  // WebSocket upgrade for /v1/runs/<id>/live?token=<HMAC>
  const wss = new WebSocketServer({ noServer: true, perMessageDeflate: false });
  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url, 'http://x');
    const m = /^\/v1\/runs\/([0-9a-f-]{36})\/live$/.exec(url.pathname);
    if (!m) {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
      return;
    }
    const runId = m[1];
    const token = url.searchParams.get('token');
    const verify = verifyLiveToken(token, runId);
    if (!verify.ok) {
      socket.write(`HTTP/1.1 401 Unauthorized\r\nContent-Type: text/plain\r\n\r\n${verify.error}`);
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      const subscribed = subscribeToRun(runId, ws);
      if (subscribed) {
        // Heartbeat ping every 20s so Cloudflare doesn't idle the
        // connection if the page is still and emits no frames.
        const hb = setInterval(() => {
          if (ws.readyState !== 1) return clearInterval(hb);
          try { ws.ping(); } catch { /* ignore */ }
        }, 20_000);
        ws.on('close', () => clearInterval(hb));
      }
    });
  });

  server.listen(PORT, () => {
    console.log(`[runner] listening on :${PORT} (HTTP + WS /live)`);
  });
}

process.on('SIGTERM', () => {
  console.log('[runner] SIGTERM — letting active runs drain');
  // Don't kill in-flight runs; tini will SIGKILL after grace period.
});

startPoller();
startHttp();
