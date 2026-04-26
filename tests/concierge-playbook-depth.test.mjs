/**
 * In-depth static + crypto contract tests for concierge playbooks (no live DB/Twilio).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

/** Must match api/_lib/concierge-playbook-worker.ts signConciergeTpToken */
function signTpToken(secret, tpCallId) {
  if (!secret) return '';
  return createHmac('sha256', secret).update(tpCallId).digest('hex');
}

function verifyTpToken(secret, tpCallId, token) {
  const exp = signTpToken(secret, tpCallId);
  if (!exp || !token) return false;
  try {
    return timingSafeEqual(Buffer.from(exp, 'utf8'), Buffer.from(token, 'utf8'));
  } catch {
    return false;
  }
}

test('migration: core tables, RLS, seeds, third_party step index', () => {
  const sql = read('supabase/migrations/20260416190000_concierge_playbooks.sql');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.playbook_definitions/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.playbook_runs/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.playbook_steps/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.third_party_calls/);
  assert.match(sql, /step_id TEXT NOT NULL DEFAULT ''/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.email_expectations/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.confirmation_evidence/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.playbook_audit_events/);
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/);
  assert.match(sql, /concierge_demo_v1/);
  assert.match(sql, /concierge_email_smoke_v1/);
  assert.match(sql, /idx_third_party_calls_run_step/);
});

test('worker + routes wired: cron tick, concierge actions, TwiML T3, executor tools', () => {
  const cron = read('api/cron/[job].ts');
  assert.match(cron, /concierge-playbook-tick/);
  assert.match(cron, /handleConciergePlaybookTickHttp/);

  const concierge = read('api/concierge/[action].ts');
  assert.match(concierge, /case 'playbook'/);
  assert.match(concierge, /case 'inbound-email'/);
  assert.match(concierge, /case 'worker-tick'/);
  assert.match(concierge, /CONCIERGE_INBOUND_SECRET/);

  const twiml = read('api/phone/_route-twiml.ts');
  assert.match(twiml, /concierge-third-party/);
  assert.match(twiml, /concierge-tp-status/);
  assert.match(twiml, /completeThirdPartyCallFromTwilio/);
  assert.match(twiml, /verifyConciergeTpToken/);

  const worker = read('api/_lib/concierge-playbook-worker.ts');
  assert.match(worker, /third_party_call/);
  assert.match(worker, /wait_email/);
  assert.match(worker, /processInboundConciergeEmail/);
  assert.match(worker, /completeThirdPartyCallFromTwilio/);

  const exec = read('api/_lib/nexus-actions-executor.ts');
  assert.match(exec, /enqueue_playbook/);
  assert.match(exec, /get_playbook_status/);
  assert.match(exec, /cancel_playbook_run/);

  const tools = read('api/_lib/nexus-tools.ts');
  assert.match(tools, /name:\s*'enqueue_playbook'/);
  assert.match(tools, /name:\s*'get_playbook_status'/);
  assert.match(tools, /name:\s*'cancel_playbook_run'/);
});

test('shell script targets cron concierge-playbook-tick', () => {
  const sh = read('scripts/concierge-playbook-worker.mjs');
  assert.match(sh, /concierge-playbook-tick/);
  assert.match(sh, /CRON_SECRET/);
});

test('T3 token HMAC round-trip and rejection', () => {
  const secret = 'test-concierge-secret-32chars!!';
  const tpId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const good = signTpToken(secret, tpId);
  assert.equal(good.length, 64);
  assert.ok(verifyTpToken(secret, tpId, good));
  assert.ok(!verifyTpToken(secret, tpId, 'bad'));
  assert.ok(!verifyTpToken('', tpId, good));
});

test('research spec Appendix C still referenced', () => {
  const spec = read('integrations/research/nexus-concierge-playbooks.md');
  assert.match(spec, /Appendix C/);
});

test('integration script exists (npm run test:concierge:integration)', () => {
  const m = read('tests/concierge-playbook-integration.mjs');
  assert.match(m, /CONCIERGE_INTEGRATION/);
  assert.match(m, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(m, /concierge_demo_v1/);
});
