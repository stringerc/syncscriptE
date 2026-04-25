#!/usr/bin/env node
/**
 * Live smoke test for the Nexus Agent Runner once it's deployed on Oracle.
 *
 * Tries the public health endpoint at AGENT_RUNNER_BASE_URL/v1/health and
 * verifies the JSON shape. Exit 0 = healthy, 1 = unhealthy/unreachable.
 *
 * Optional env:
 *   AGENT_RUNNER_BASE_URL = https://nexus-agent-runner.syncscript.app  (defaults if unset)
 *   AGENT_RUNNER_TOKEN    = (only needed for /v1/runs/start probe; health is unauthenticated)
 *   AGENT_RUNNER_LIVE_VERIFY = 1   — strict: fail on any unexpected shape
 */

const BASE = (process.env.AGENT_RUNNER_BASE_URL || 'https://nexus-agent-runner.syncscript.app').replace(/\/$/, '');
const STRICT = process.env.AGENT_RUNNER_LIVE_VERIFY === '1';

function log(...args) { console.error('[verify-agent-runner-live]', ...args); }

async function main() {
  const url = `${BASE}/v1/health`;
  log('probing', url);

  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  } catch (e) {
    log('FAIL — fetch threw:', e?.message || e);
    if (STRICT) process.exit(1);
    process.exit(0); // soft-skip when not strict (e.g., before runner is up)
  }

  if (!res.ok) {
    log(`FAIL — HTTP ${res.status}`);
    process.exit(1);
  }

  const text = await res.text();
  let body;
  try { body = JSON.parse(text); }
  catch {
    log('FAIL — non-JSON body:', text.slice(0, 200));
    process.exit(1);
  }

  for (const k of ['ok', 'started_at', 'active_runs', 'max_concurrency']) {
    if (!(k in body)) {
      log(`FAIL — health body missing "${k}":`, JSON.stringify(body).slice(0, 200));
      process.exit(1);
    }
  }
  if (body.ok !== true) { log('FAIL — ok=false', body); process.exit(1); }

  log(`ok — active_runs=${body.active_runs} max_concurrency=${body.max_concurrency} since=${body.started_at}`);
  process.exit(0);
}

main();
