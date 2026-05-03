#!/usr/bin/env node
/**
 * Live HTTP checks against Supabase Edge make-server-57781ad9 productivity routes.
 * Read-only for unauthenticated checks; optional SYNCSCRIPT_TEST_JWT for one POST + GET round-trip.
 * Also: calendar + profile + invalid-PAT smoke (401) so Cursor MCP surfaces are mounted after deploy.
 *
 * Usage:
 *   node scripts/verify-edge-productivity-http.mjs
 *   SYNCSCRIPT_TEST_JWT="eyJ…" node scripts/verify-edge-productivity-http.mjs
 *   SYNCSCRIPT_TEST_PAT="sspat_…" node scripts/verify-edge-productivity-http.mjs   # default-scopes PAT from Settings
 *   SYNCSCRIPT_TEST_PAT_FORBIDDEN="sspat_…" …   # optional: PAT missing tasks:read → GET /tasks must be 403
 */
const PROJECT = process.env.SUPABASE_PROJECT_REF || 'kwhnrlzibgfedtxpkbgb';
const ANON = process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3aG5ybHppYmdmZWR0eHBrYmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzk3OTMsImV4cCI6MjA3NjY1NTc5M30.vvV5Ksaq70soeLzwDr7AuXiUFPhwcRV4m78PD4qtFu8';
const BASE = `https://${PROJECT}.supabase.co/functions/v1/make-server-57781ad9`;

const headersAnonOnly = { apikey: ANON };
const headersJwt = (jwt) => ({
  apikey: ANON,
  Authorization: `Bearer ${jwt}`,
  'Content-Type': 'application/json',
});

const headersPat = (pat) => ({
  apikey: ANON,
  Authorization: `Bearer ${pat}`,
  'Content-Type': 'application/json',
});

let failed = 0;
async function check(name, fn) {
  try {
    const skip = await fn();
    if (skip === 'skip') console.log(`SKIP ${name}`);
    else console.log(`OK  ${name}`);
  } catch (e) {
    failed++;
    console.error(`FAIL ${name}:`, e?.message || e);
  }
}

await check('GET /activity/summary (no user JWT) → 401', async () => {
  const r = await fetch(`${BASE}/activity/summary?days=7`, { headers: headersAnonOnly });
  if (r.status !== 401) throw new Error(`expected 401, got ${r.status}`);
});

await check('POST /activity/events (no user JWT) → 401', async () => {
  const r = await fetch(`${BASE}/activity/events`, {
    method: 'POST',
    headers: { ...headersAnonOnly, 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType: 'generic', intensity: 1 }),
  });
  if (r.status !== 401) throw new Error(`expected 401, got ${r.status}`);
});

await check('GET /business-plan (no user JWT) → 401', async () => {
  const r = await fetch(`${BASE}/business-plan`, { headers: headersAnonOnly });
  if (r.status !== 401) throw new Error(`expected 401, got ${r.status}`);
});

await check('GET /tasks (no user JWT) → 401', async () => {
  const r = await fetch(`${BASE}/tasks`, { headers: headersAnonOnly });
  if (r.status !== 401) throw new Error(`expected 401, got ${r.status}`);
});

await check('GET /capture/inbox (no user JWT) → 401', async () => {
  const r = await fetch(`${BASE}/capture/inbox`, { headers: headersAnonOnly });
  // 404 = older Edge bundle without capture-inbox routes; redeploy make-server then expect 401.
  if (r.status === 404) return 'skip';
  if (r.status !== 401) throw new Error(`expected 401, got ${r.status}`);
});

await check('GET /calendar/sync-groups (no user JWT) → 401', async () => {
  const r = await fetch(`${BASE}/calendar/sync-groups`, { headers: headersAnonOnly });
  if (r.status !== 401) throw new Error(`expected 401, got ${r.status}`);
});

await check('GET /calendar/hold-preferences (no user JWT) → 401', async () => {
  const r = await fetch(`${BASE}/calendar/hold-preferences`, { headers: headersAnonOnly });
  if (r.status !== 401) throw new Error(`expected 401, got ${r.status}`);
});

await check('GET /calendar/local-events (no user JWT) → 401', async () => {
  const r = await fetch(`${BASE}/calendar/local-events`, { headers: headersAnonOnly });
  if (r.status === 404) return 'skip';
  if (r.status !== 401) throw new Error(`expected 401, got ${r.status}`);
});

await check('POST /calendar/hold (no user JWT) → 401', async () => {
  const r = await fetch(`${BASE}/calendar/hold`, {
    method: 'POST',
    headers: { ...headersAnonOnly, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'verify', start_iso: new Date().toISOString() }),
  });
  if (r.status !== 401) throw new Error(`expected 401, got ${r.status}`);
});

await check('POST /calendar/external/delete (no user JWT) → 401', async () => {
  const r = await fetch(`${BASE}/calendar/external/delete`, {
    method: 'POST',
    headers: { ...headersAnonOnly, 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'google', event_id: 'dummy' }),
  });
  if (r.status !== 401) throw new Error(`expected 401, got ${r.status}`);
});

await check('GET /user/profile (no user JWT) → 401', async () => {
  const r = await fetch(`${BASE}/user/profile`, { headers: headersAnonOnly });
  if (r.status !== 401) throw new Error(`expected 401, got ${r.status}`);
});

await check('GET /tasks (invalid PAT) → 401', async () => {
  const r = await fetch(`${BASE}/tasks`, {
    headers: { ...headersAnonOnly, Authorization: 'Bearer sspat_not_a_real_token_0000000000000000' },
  });
  if (r.status !== 401) throw new Error(`expected 401, got ${r.status}`);
});

await check('GET /health → 200', async () => {
  const r = await fetch(`${BASE}/health`, { headers: headersAnonOnly });
  if (r.status !== 200) throw new Error(`expected 200, got ${r.status}`);
  const j = await r.json();
  if (j.status !== 'ok') throw new Error('expected { status: "ok" }');
});

await check('GET /tasks (forbidden-scope PAT) → 403', async () => {
  const pat = process.env.SYNCSCRIPT_TEST_PAT_FORBIDDEN;
  if (!pat) return 'skip';
  const r = await fetch(`${BASE}/tasks`, { headers: headersPat(pat) });
  if (r.status !== 403) throw new Error(`expected 403, got ${r.status}`);
});

await check('GET /tasks (real PAT + tasks:read) → 200 array', async () => {
  const pat = process.env.SYNCSCRIPT_TEST_PAT;
  if (!pat) return 'skip';
  const r = await fetch(`${BASE}/tasks`, { headers: headersPat(pat) });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${await r.text()}`);
  const data = await r.json();
  if (!Array.isArray(data)) throw new Error('expected JSON array');
});

await check('GET /user/profile (real PAT + profile:read) → 200 + id', async () => {
  const pat = process.env.SYNCSCRIPT_TEST_PAT;
  if (!pat) return 'skip';
  const r = await fetch(`${BASE}/user/profile`, { headers: headersPat(pat) });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${await r.text()}`);
  const j = await r.json();
  if (!j.id) throw new Error('missing profile id');
});

await check('POST /calendar/hold (real PAT + calendar:write) → 200|502', async () => {
  const pat = process.env.SYNCSCRIPT_TEST_PAT;
  if (!pat) return 'skip';
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const r = await fetch(`${BASE}/calendar/hold`, {
    method: 'POST',
    headers: headersPat(pat),
    body: JSON.stringify({
      title: 'verify-edge-productivity-http PAT probe',
      start_iso: start,
      provider: 'auto',
    }),
  });
  if (![200, 502].includes(r.status)) {
    throw new Error(`expected 200 (provider or local_only hold) or 502 (provider error); got ${r.status} ${await r.text()}`);
  }
});

await check('POST /calendar/hold syncscript_only (real PAT) → 200 SYNCSCRIPT_ONLY', async () => {
  const pat = process.env.SYNCSCRIPT_TEST_PAT;
  if (!pat) return 'skip';
  const t0 = Date.now() + 72 * 60 * 60 * 1000;
  const start = new Date(t0).toISOString();
  const end = new Date(t0 + 30 * 60 * 1000).toISOString();
  const r = await fetch(`${BASE}/calendar/hold`, {
    method: 'POST',
    headers: headersPat(pat),
    body: JSON.stringify({
      title: 'verify-edge syncscript_only',
      start_iso: start,
      end_iso: end,
      syncscript_only: true,
    }),
  });
  if (r.status !== 200) throw new Error(`HTTP ${r.status} ${await r.text()}`);
  const j = await r.json();
  if (!j.local_only || j.code !== 'SYNCSCRIPT_ONLY') {
    throw new Error('expected local_only + code SYNCSCRIPT_ONLY');
  }
  if (!j.local_event_id) throw new Error('missing local_event_id');
});

await check('POST /activity/events (malformed JSON) → 400 after auth', async () => {
  const jwt = process.env.SYNCSCRIPT_TEST_JWT;
  if (!jwt) return 'skip';
  const r = await fetch(`${BASE}/activity/events`, {
    method: 'POST',
    headers: { ...headersJwt(jwt), 'Content-Type': 'application/json' },
    body: '{ not json',
  });
  if (r.status !== 400) throw new Error(`expected 400, got ${r.status}`);
});

await check('POST /activity/events (invalid eventType) → 400', async () => {
  const jwt = process.env.SYNCSCRIPT_TEST_JWT;
  if (!jwt) return 'skip';
  const r = await fetch(`${BASE}/activity/events`, {
    method: 'POST',
    headers: headersJwt(jwt),
    body: JSON.stringify({ eventType: 'not_allowed', intensity: 1 }),
  });
  if (r.status !== 400) throw new Error(`expected 400, got ${r.status}`);
});

await check('GET /tasks (real JWT) → 200 array', async () => {
  const jwt = process.env.SYNCSCRIPT_TEST_JWT;
  if (!jwt) return 'skip';
  const r = await fetch(`${BASE}/tasks`, { headers: headersJwt(jwt) });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${await r.text()}`);
  const data = await r.json();
  if (!Array.isArray(data)) throw new Error('expected JSON array');
});

await check('GET /activity/summary (real JWT) → 200 + cells array', async () => {
  const jwt = process.env.SYNCSCRIPT_TEST_JWT;
  if (!jwt) return 'skip';
  const r = await fetch(`${BASE}/activity/summary?days=14`, { headers: headersJwt(jwt) });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${await r.text()}`);
  const j = await r.json();
  if (!Array.isArray(j.cells)) throw new Error('missing cells array');
});

await check('POST /activity/events generic (real JWT) → 200 + id', async () => {
  const jwt = process.env.SYNCSCRIPT_TEST_JWT;
  if (!jwt) return 'skip';
  const r = await fetch(`${BASE}/activity/events`, {
    method: 'POST',
    headers: headersJwt(jwt),
    body: JSON.stringify({
      eventType: 'generic',
      intensity: 1,
      visibility: 'private',
      metadata: { source: 'verify-edge-productivity-http.mjs', at: new Date().toISOString() },
    }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${await r.text()}`);
  const j = await r.json();
  if (!j.id) throw new Error('missing id');
});

if (failed) {
  console.error(`\nverify-edge-productivity-http: ${failed} check(s) failed.`);
  process.exit(1);
}
console.log('\nverify-edge-productivity-http: all runnable checks passed.');
