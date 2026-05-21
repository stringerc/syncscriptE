#!/usr/bin/env node
/**
 * Advance concierge playbook runs via the same cron entrypoint as production.
 * Usage: CRON_SECRET=... APP_URL=https://www.syncscript.app node scripts/concierge-playbook-worker.mjs
 * Or set CONCIERGE_TICK_URL to a full POST URL (e.g. local Vercel dev).
 */
const process = globalThis.process;

const rawBase = (process.env.APP_URL || process.env.VERCEL_URL || '').replace(/\/$/, '');
const tickUrl =
  process.env.CONCIERGE_TICK_URL ||
  (rawBase.startsWith('http')
    ? `${rawBase}/api/cron/concierge-playbook-tick`
    : rawBase
      ? `https://${rawBase}/api/cron/concierge-playbook-tick`
      : '');
const secret = process.env.CRON_SECRET;

if (!tickUrl) {
  console.error('Set APP_URL, VERCEL_URL, or CONCIERGE_TICK_URL');
  process.exit(1);
}
if (!secret) {
  console.error('CRON_SECRET is required');
  process.exit(1);
}

const res = await fetch(tickUrl, {
  method: 'POST',
  headers: { Authorization: `Bearer ${secret}` },
});
const text = await res.text();
console.log(res.status, text);
process.exit(res.ok ? 0 : 1);
