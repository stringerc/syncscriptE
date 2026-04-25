/**
 * Stage D: HMAC bitwise parity between Deno's crypto.subtle (dispatcher) and
 * Node's crypto.createHmac (what n8n / subscribers will use).
 *
 * Both must produce the SAME lowercase hex string for identical (secret, body).
 * Uses Node's built-in webcrypto (same Web Crypto API Deno exposes) to prove
 * parity without standing up a Deno runtime in the test suite.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto, createHmac } from 'node:crypto';

/** Deno-style HMAC — EXACT code from supabase/functions/.../webhook-dispatcher.tsx. */
async function denoStyleHmac(secret, body) {
  const enc = new TextEncoder();
  const key = await webcrypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await webcrypto.subtle.sign('HMAC', key, enc.encode(body));
  const bytes = new Uint8Array(mac);
  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  return hex;
}

/** Node-style HMAC — what a subscriber (n8n, Express, etc.) writes by default. */
function nodeStyleHmac(secret, body) {
  return createHmac('sha256', secret).update(body).digest('hex');
}

const fixtures = [
  { name: 'ascii',       secret: 'testkey',           body: '{"hello":"world"}' },
  { name: 'unicode',     secret: 'π-secret',          body: '{"msg":"héllo 👋"}' },
  { name: 'long body',   secret: 'k',                 body: JSON.stringify({ blob: 'x'.repeat(5_000) }) },
  { name: 'empty body',  secret: 'k',                 body: '' },
  { name: 'hex-like',    secret: 'deadbeef',          body: '{"id":"abc-123"}' },
];

for (const f of fixtures) {
  test(`HMAC parity: ${f.name}`, async () => {
    const deno = await denoStyleHmac(f.secret, f.body);
    const node = nodeStyleHmac(f.secret, f.body);
    assert.equal(deno, node, `mismatch on ${f.name}: deno=${deno} node=${node}`);
    assert.equal(deno.length, 64, 'sha256 hex must be 64 chars');
    assert.ok(/^[0-9a-f]{64}$/.test(deno), 'must be lowercase hex');
  });
}

test('known fixture — catches any future encoding change', async () => {
  // Golden value computed at author-time; if this changes, something silently shifted.
  const deno = await denoStyleHmac('testkey', '{"hello":"world"}');
  const node = nodeStyleHmac('testkey', '{"hello":"world"}');
  assert.equal(deno, node);
  // Both implementations must produce exactly this signature (verified 2026-04-24):
  assert.equal(
    deno,
    '514d0bc3e4f9cef7955b9c90a312474b39baba997cba0a2d628433e1b99deaf9',
    'HMAC of {"hello":"world"} with testkey has a known, documented value; if it changed, investigate before deploying.',
  );
});
