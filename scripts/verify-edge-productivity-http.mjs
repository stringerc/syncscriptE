#!/usr/bin/env node
/**
 * Live HTTP checks against Supabase Edge make-server-57781ad9 productivity routes.
 * Read-only for unauthenticated checks; optional SYNCSCRIPT_TEST_JWT for one POST + GET round-trip.
 *
 * Usage:
 *   node scripts/verify-edge-productivity-http.mjs
 *   SYNCSCRIPT_TEST_JWT="eyJ…" node scripts/verify-edge-productivity-http.mjs
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
