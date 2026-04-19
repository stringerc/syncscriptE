#!/usr/bin/env node
/**
 * Production smoke for /api/ai/nexus-user (no secrets required for basic checks).
 *
 * Usage:
 *   node scripts/smoke-nexus-user-prod.mjs
 *   BASE_URL=https://www.syncscript.app node scripts/smoke-nexus-user-prod.mjs
 *
 * Optional — full signed-in probe (expect 200 or detailed 500 JSON):
 *   NEXUS_SMOKE_BEARER="eyJ..." node scripts/smoke-nexus-user-prod.mjs
 *
 * Get a JWT: DevTools → Application → Local Storage → supabase auth token, or Network tab
 * Authorization header on any authenticated API call.
 */
import assert from 'node:assert/strict';

const base = (process.env.BASE_URL || 'https://www.syncscript.app').replace(/\/$/, '');
const url = `${base}/api/ai/nexus-user`;

async function main() {
  console.log(`\n=== nexus-user smoke → ${url} ===\n`);

  const opt = await fetch(url, { method: 'OPTIONS' });
  assert.equal(opt.status, 204, `OPTIONS expected 204, got ${opt.status}`);

  const noAuth = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'ping' }),
  });
  assert.equal(noAuth.status, 401, `POST without Authorization expected 401, got ${noAuth.status}`);

  const bearer = process.env.NEXUS_SMOKE_BEARER?.trim();
  if (bearer) {
    const signed = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearer}`,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Reply with exactly: ok' }],
        privateContext: {},
        enableTools: false,
        voiceMode: false,
      }),
    });
    const j = await signed.json().catch(() => ({}));
    console.log('Signed-in probe status:', signed.status);
    console.log('Response keys:', Object.keys(j));
    if (!signed.ok) {
      console.log('error:', j.error);
      console.log('errorCode:', j.errorCode);
      console.log('detail:', j.detail?.slice?.(0, 400));
      console.log('requestId:', j.requestId || signed.headers.get('x-nexus-request-id'));
    }
    assert.ok(
      signed.status === 200 || signed.status === 401 || signed.status === 500,
      `Unexpected status ${signed.status}`,
    );
  } else {
    console.log('Skip signed-in probe (set NEXUS_SMOKE_BEARER to test with a real JWT).\n');
  }

  console.log('smoke-nexus-user-prod: basic checks passed.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
