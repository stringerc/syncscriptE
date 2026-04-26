#!/usr/bin/env node
/**
 * Live integration: Supabase concierge schema + seeds; optional FK smoke row; optional Twilio account probe.
 *
 * Does not run in default `npm test`. Invoke:
 *   CONCIERGE_INTEGRATION=1 SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run test:concierge:integration
 *
 * Env:
 *   CONCIERGE_INTEGRATION=1           — required to do anything (otherwise exit 0 with skip message)
 *   SUPABASE_URL                      — project URL (or VITE_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY         — service role (bypasses RLS; never commit)
 *
 * Optional:
 *   CONCIERGE_TEST_USER_ID=<uuid>     — real auth.users id; inserts then deletes one playbook_runs row
 *   CONCIERGE_TWILIO_ACCOUNT_CHECK=1  — GET Twilio Account (validates SID/token; no outbound call)
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN — required when account check enabled
 *
 * Strict CI (fail when integration not configured):
 *   CONCIERGE_INTEGRATION_STRICT=1
 *
 * Twilio trial / SyncScript voice numbers live in Vercel env and MEMORY.md ops notes — not in git.
 */

import { createClient } from '@supabase/supabase-js';

const strict = process.env.CONCIERGE_INTEGRATION_STRICT === '1';
const enabled = process.env.CONCIERGE_INTEGRATION === '1';

function supabaseUrl() {
  return (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ''
  )
    .trim()
    .replace(/\/$/, '');
}

async function checkSeededPlaybooks(sb) {
  const { data: defs, error } = await sb
    .from('playbook_definitions')
    .select('id,slug,name,max_tier,is_system')
    .in('slug', ['concierge_demo_v1', 'concierge_email_smoke_v1']);

  if (error) {
    throw new Error(`playbook_definitions query: ${error.message}`);
  }
  if (!defs || defs.length < 2) {
    throw new Error(
      `Expected 2 seeded rows (concierge_demo_v1, concierge_email_smoke_v1); got ${defs?.length ?? 0}. Apply migration 20260416190000_concierge_playbooks.sql to this database.`,
    );
  }

  const demo = defs.find((d) => d.slug === 'concierge_demo_v1');
  const email = defs.find((d) => d.slug === 'concierge_email_smoke_v1');
  if (!demo?.id || !email?.id) {
    throw new Error('Seed playbooks missing id');
  }
  if (demo.max_tier !== 3) {
    throw new Error(`concierge_demo_v1 max_tier expected 3, got ${demo.max_tier}`);
  }
  if (email.max_tier !== 2) {
    throw new Error(`concierge_email_smoke_v1 max_tier expected 2, got ${email.max_tier}`);
  }
  if (!demo.is_system || !email.is_system) {
    throw new Error('Expected is_system true for seeded playbooks');
  }

  return { demo, email };
}

async function smokeInsertDeleteRun(sb, emailDef, testUserId) {
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(testUserId)) {
    throw new Error('CONCIERGE_TEST_USER_ID must be a valid UUID');
  }

  const correlationId = `pb_int_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  const { data: run, error: insErr } = await sb
    .from('playbook_runs')
    .insert({
      playbook_id: emailDef.id,
      user_id: testUserId,
      status: 'running',
      correlation_id: correlationId,
      current_step_id: 'e1',
      context: {},
    })
    .select('id')
    .single();

  if (insErr) {
    throw new Error(`playbook_runs insert (check user exists in auth.users): ${insErr.message}`);
  }

  const { error: delErr } = await sb.from('playbook_runs').delete().eq('id', run.id);
  if (delErr) {
    throw new Error(`playbook_runs cleanup delete: ${delErr.message}`);
  }
}

async function checkTwilioAccount() {
  const sid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const token = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  if (!sid || !token) {
    throw new Error('CONCIERGE_TWILIO_ACCOUNT_CHECK=1 requires TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
  }

  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}.json`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Twilio Account GET ${res.status}: ${text.slice(0, 300)}`);
  }
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error('Twilio Account GET returned non-JSON');
  }
  if (body.sid !== sid) {
    throw new Error('Twilio Account response sid mismatch');
  }
}

async function main() {
  if (!enabled) {
    const msg =
      'concierge-playbook-integration: skip (set CONCIERGE_INTEGRATION=1, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)';
    if (strict) {
      console.error(msg);
      process.exit(1);
    }
    console.error(msg);
    process.exit(0);
  }

  const url = supabaseUrl();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !key) {
    const msg = 'concierge-playbook-integration: missing SUPABASE_URL (or VITE_*) or SUPABASE_SERVICE_ROLE_KEY';
    console.error(msg);
    process.exit(strict ? 1 : 0);
  }

  const sb = createClient(url, key);

  const { demo, email } = await checkSeededPlaybooks(sb);
  console.error(
    `concierge-playbook-integration: seeds ok (demo tier ${demo.max_tier}, email tier ${email.max_tier})`,
  );

  const testUserId = (process.env.CONCIERGE_TEST_USER_ID || '').trim();
  if (testUserId) {
    await smokeInsertDeleteRun(sb, email, testUserId);
    console.error('concierge-playbook-integration: playbook_runs insert/delete smoke ok');
  }

  if (process.env.CONCIERGE_TWILIO_ACCOUNT_CHECK === '1') {
    await checkTwilioAccount();
    console.error('concierge-playbook-integration: Twilio Account GET ok (no call placed)');
  }

  console.error('concierge-playbook-integration: all checks passed');
  process.exit(0);
}

main().catch((e) => {
  console.error('concierge-playbook-integration: FAIL', e instanceof Error ? e.message : e);
  process.exit(1);
});
