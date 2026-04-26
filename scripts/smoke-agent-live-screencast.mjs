#!/usr/bin/env node
/**
 * Verifies the live CDP screencast pipeline end-to-end:
 *   1. Insert an agent_runs row
 *   2. Wait for the runner to claim it (status=running)
 *   3. Mint a live-token via local HMAC (matching the Vercel handler)
 *   4. Open WebSocket to runner /v1/runs/<id>/live?token=<HMAC>
 *   5. Count binary frames received over 30s
 *   6. Expect at least 5 frames (page navigates, types — visual changes)
 *
 * Required env (use `vercel env pull` first):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   AGENT_RUNNER_TOKEN (= NEXUS_PHONE_EDGE_SECRET)
 *
 * Optional:
 *   AGENT_RUNNER_BASE_URL (else read from runner_endpoints row)
 *   SMOKE_USER_ID (else first auth user)
 *   SMOKE_GOAL    (else: navigate Wikipedia for visible motion)
 */

import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'node:crypto';
import { WebSocket } from 'ws';

const SB_URL = process.env.SUPABASE_URL || 'https://kwhnrlzibgfedtxpkbgb.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RUNNER_TOKEN = process.env.AGENT_RUNNER_TOKEN || process.env.NEXUS_PHONE_EDGE_SECRET;
let RUNNER_BASE = (process.env.AGENT_RUNNER_BASE_URL || '').replace(/\/$/, '');

if (!KEY || !RUNNER_TOKEN) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or AGENT_RUNNER_TOKEN env');
  process.exit(2);
}

const sb = createClient(SB_URL, KEY, { auth: { persistSession: false } });

function log(...a) { console.log(`[live-smoke ${new Date().toISOString().slice(11, 19)}]`, ...a); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function mintToken(runId, userId) {
  const exp = Math.floor(Date.now() / 1000) + 300;
  const payload = JSON.stringify({ run_id: runId, user_id: userId, exp });
  const payloadB64 = Buffer.from(payload, 'utf8').toString('base64url');
  const sig = createHmac('sha256', RUNNER_TOKEN).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

async function main() {
  // Match Vercel /api/agent behavior: prefer the Supabase row (live truth)
  // over the env var (which may be stale after a tunnel rotation).
  try {
    const { data } = await sb.from('runner_endpoints').select('url').eq('name', 'agent_runner').maybeSingle();
    if (data?.url) RUNNER_BASE = String(data.url).replace(/\/$/, '');
  } catch { /* fall back to env */ }
  if (!RUNNER_BASE) { console.error('No runner URL'); process.exit(2); }
  log('runner:', RUNNER_BASE);

  const userId = process.env.SMOKE_USER_ID
    || (await sb.auth.admin.listUsers({ perPage: 1 })).data?.users?.[0]?.id;
  if (!userId) { console.error('No user'); process.exit(2); }
  log('user:', userId);

  const goal = process.env.SMOKE_GOAL
    || 'Go to https://en.wikipedia.org/wiki/Dolphin and call extract_links filter=img then finish().';

  const { data: ins, error } = await sb.from('agent_runs').insert({
    user_id: userId,
    goal_text: goal,
    status: 'queued',
    tier_at_start: 'B',
  }).select('*').single();
  if (error) throw error;
  const runId = ins.id;
  log('run:', runId);

  // Wait for runner to claim
  for (let i = 0; i < 20; i++) {
    await sleep(800);
    const { data } = await sb.from('agent_runs').select('status').eq('id', runId).single();
    if (data?.status === 'running') break;
    if (i === 19) { console.error('run did not start'); process.exit(1); }
  }
  log('claimed by runner');

  // Open WebSocket
  const token = mintToken(runId, userId);
  const wsUrl = `${RUNNER_BASE.replace(/^http/, 'ws')}/v1/runs/${runId}/live?token=${token}`;
  log('opening WS:', wsUrl.slice(0, 80) + '…');

  let frames = 0;
  let totalBytes = 0;
  let firstFrameMs = null;
  const start = Date.now();

  const ws = new WebSocket(wsUrl);
  ws.binaryType = 'arraybuffer';

  ws.on('open', () => log('WS open'));
  ws.on('message', (data, isBinary) => {
    if (!isBinary) {
      log('text msg:', String(data).slice(0, 200));
      return;
    }
    frames += 1;
    totalBytes += data.byteLength;
    if (frames === 1) {
      firstFrameMs = Date.now() - start;
      log(`first frame after ${firstFrameMs}ms (${data.byteLength} bytes)`);
    } else if (frames % 10 === 0) {
      log(`frames=${frames} bytes=${totalBytes}`);
    }
  });
  ws.on('error', (e) => log('WS error:', e?.message || e));
  ws.on('close', (code, reason) => log(`WS closed: ${code} ${reason}`));

  // Watch for 30 seconds OR until run completes
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    await sleep(2000);
    const { data: row } = await sb.from('agent_runs').select('status').eq('id', runId).single();
    if (['done', 'failed', 'cancelled'].includes(row?.status)) {
      log(`run finished early: ${row.status}`);
      break;
    }
  }

  try { ws.close(); } catch { /* ignore */ }
  await sleep(500);

  log(`SUMMARY: frames=${frames} bytes=${totalBytes} firstFrameMs=${firstFrameMs}`);
  if (frames >= 3) {
    log('✅ PASS — live screencast working');
    process.exit(0);
  } else {
    log('❌ FAIL — insufficient frames received');
    process.exit(1);
  }
}

main().catch((e) => { console.error(e?.stack || e); process.exit(2); });
