/**
 * Contract: event outbox + webhook subscriptions + dispatcher (Gap #1).
 *
 * Runs statically against the SQL + TS + dispatcher source so schema drift,
 * missing RLS, or missing retry discipline fails the release gate rather than
 * silently reaching prod.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = process.cwd();

const OUTBOX_MIGRATION = readFileSync(
  resolve(root, 'supabase/migrations/20260423160000_event_outbox_and_webhooks.sql'),
  'utf8',
);
const FLUSH_MIGRATION = readFileSync(
  resolve(root, 'supabase/migrations/20260423170000_pg_cron_webhooks_flush.sql'),
  'utf8',
);
const EVENTS_LIB = readFileSync(resolve(root, 'api/_lib/events.ts'), 'utf8');
const DISPATCHER = readFileSync(
  resolve(root, 'supabase/functions/make-server-57781ad9/webhook-dispatcher.tsx'),
  'utf8',
);
const EXECUTOR = readFileSync(resolve(root, 'api/_lib/nexus-actions-executor.ts'), 'utf8');

test('event_outbox table has idempotency + fanout tracking + indexes', () => {
  assert.match(OUTBOX_MIGRATION, /CREATE TABLE IF NOT EXISTS public\.event_outbox/);
  assert.match(OUTBOX_MIGRATION, /event_type\s+TEXT NOT NULL/);
  assert.match(OUTBOX_MIGRATION, /event_key\s+TEXT/);
  assert.match(OUTBOX_MIGRATION, /payload\s+JSONB NOT NULL/);
  assert.match(OUTBOX_MIGRATION, /fanout_at\s+TIMESTAMPTZ/);
  assert.match(OUTBOX_MIGRATION, /completed_at TIMESTAMPTZ/);
  assert.match(
    OUTBOX_MIGRATION,
    /CREATE UNIQUE INDEX IF NOT EXISTS uq_event_outbox_idempotency/,
    'idempotency key must be enforced by a unique index',
  );
});

test('webhook_subscriptions requires URL + secret + event_types array', () => {
  assert.match(OUTBOX_MIGRATION, /CREATE TABLE IF NOT EXISTS public\.webhook_subscriptions/);
  assert.match(OUTBOX_MIGRATION, /url\s+TEXT NOT NULL CHECK \(url ~ '\^https\?:\/\/'\)/);
  assert.match(OUTBOX_MIGRATION, /secret\s+TEXT NOT NULL/);
  assert.match(OUTBOX_MIGRATION, /event_types\s+TEXT\[\] NOT NULL/);
  assert.match(OUTBOX_MIGRATION, /active\s+BOOLEAN NOT NULL DEFAULT true/);
  assert.match(OUTBOX_MIGRATION, /consecutive_failures INT NOT NULL/);
});

test('webhook_deliveries unique (subscription_id, event_id) + lifecycle fields', () => {
  assert.match(OUTBOX_MIGRATION, /CREATE TABLE IF NOT EXISTS public\.webhook_deliveries/);
  assert.match(OUTBOX_MIGRATION, /status\s+TEXT NOT NULL CHECK \(status IN \('pending', 'delivered', 'failed', 'dlq'\)\)/);
  assert.match(OUTBOX_MIGRATION, /attempt\s+INT\s+NOT NULL DEFAULT 0/);
  assert.match(OUTBOX_MIGRATION, /next_attempt_at\s+TIMESTAMPTZ/);
  assert.match(OUTBOX_MIGRATION, /UNIQUE \(subscription_id, event_id\)/);
});

test('claim + fanout + finalize RPCs exist with SKIP LOCKED and service_role grants', () => {
  assert.match(OUTBOX_MIGRATION, /CREATE OR REPLACE FUNCTION public\.fanout_event_outbox/);
  assert.match(OUTBOX_MIGRATION, /CREATE OR REPLACE FUNCTION public\.claim_due_webhook_deliveries/);
  assert.match(OUTBOX_MIGRATION, /CREATE OR REPLACE FUNCTION public\.finalize_webhook_delivery/);
  assert.match(OUTBOX_MIGRATION, /FOR UPDATE SKIP LOCKED/, 'claim must use SKIP LOCKED for safe concurrency');
  assert.match(
    OUTBOX_MIGRATION,
    /GRANT\s+EXECUTE ON FUNCTION public\.fanout_event_outbox\(INT\)\s+TO service_role/,
  );
  assert.match(
    OUTBOX_MIGRATION,
    /GRANT\s+EXECUTE ON FUNCTION public\.claim_due_webhook_deliveries\(INT, INT\)\s+TO service_role/,
  );
});

test('RLS: users see own outbox + own subs + own deliveries; no cross-tenant read', () => {
  assert.match(OUTBOX_MIGRATION, /ALTER TABLE public\.event_outbox\s+ENABLE ROW LEVEL SECURITY/);
  assert.match(OUTBOX_MIGRATION, /ALTER TABLE public\.webhook_subscriptions\s+ENABLE ROW LEVEL SECURITY/);
  assert.match(OUTBOX_MIGRATION, /ALTER TABLE public\.webhook_deliveries\s+ENABLE ROW LEVEL SECURITY/);
  assert.match(OUTBOX_MIGRATION, /CREATE POLICY "event_outbox_read_own"/);
  assert.match(OUTBOX_MIGRATION, /CREATE POLICY "webhook_subs_insert_own"/);
  assert.match(OUTBOX_MIGRATION, /CREATE POLICY "webhook_subs_update_own"/);
  assert.match(OUTBOX_MIGRATION, /CREATE POLICY "webhook_subs_delete_own"/);
  assert.match(OUTBOX_MIGRATION, /CREATE POLICY "webhook_deliveries_read_own"/);
});

test('pg_cron schedules syncscript.webhooks.flush at 1-min cadence to Edge dispatcher', () => {
  assert.match(FLUSH_MIGRATION, /cron\.schedule\(\s*'syncscript\.webhooks\.flush',\s*'\* \* \* \* \*'/);
  assert.ok(
    FLUSH_MIGRATION.includes('/make-server-57781ad9/internal/webhooks/flush'),
    'flush cron must target the Edge dispatcher route',
  );
  assert.ok(
    FLUSH_MIGRATION.includes('syncscript_nexus_edge_secret'),
    'flush cron must authenticate via the vault-backed Edge secret',
  );
});

test('events catalog is the single source of truth for event types', () => {
  assert.match(EVENTS_LIB, /export const SYNCSCRIPT_EVENT_TYPES = \[/);
  for (const t of [
    'task.created',
    'task.completed',
    'event.created',
    'event.proposed',
    'invoice.sent',
    'invoice.paid',
    'playbook.run.started',
    'playbook.run.failed',
    'nexus.tool.called',
  ]) {
    assert.ok(EVENTS_LIB.includes(`'${t}'`), `SYNCSCRIPT_EVENT_TYPES must include '${t}'`);
  }
  assert.match(EVENTS_LIB, /export type SyncScriptEventType = \(typeof SYNCSCRIPT_EVENT_TYPES\)\[number\];/);
});

test('emitEvent swallows failures so a broken outbox never breaks the tool call', () => {
  // The helper MUST NOT throw to callers; confirm try/catch discipline.
  assert.match(EVENTS_LIB, /export async function emitEvent/);
  assert.match(EVENTS_LIB, /catch \(e\)/);
  assert.match(EVENTS_LIB, /return null;/);
});

test('executeNexusTool pipes every trace through emitToolEvents after audit', () => {
  assert.match(EXECUTOR, /await emitAudit\(actor, meta, trace\);/);
  assert.match(EXECUTOR, /await emitToolEvents\(actor, meta, trace\);/);
  assert.match(EXECUTOR, /emitEvent\(\{[\s\S]*?eventType: 'nexus\.tool\.called'/);
});

test('dispatcher HMAC-signs payloads, honors timeout, and DLQs after MAX_ATTEMPTS', () => {
  assert.match(DISPATCHER, /X-SyncScript-Signature/, 'every delivery must carry an HMAC signature header');
  assert.match(DISPATCHER, /hmacSign\(subscription\.secret, body\)/);
  assert.match(DISPATCHER, /DISPATCH_TIMEOUT_MS = 8_000/, 'one slow subscriber must not stall the dispatcher');
  assert.match(DISPATCHER, /MAX_ATTEMPTS = 10/);
  assert.match(DISPATCHER, /BACKOFF_SCHEDULE_SECONDS = \[60, 300, 900, 1800, 3600, 7200, 14400, 28800, 43200\]/);
  assert.ok(
    DISPATCHER.includes('fanout_event_outbox') &&
      DISPATCHER.includes('claim_due_webhook_deliveries') &&
      DISPATCHER.includes('finalize_webhook_delivery'),
    'dispatcher must use the RPC trio (no direct table writes)',
  );
});

test('dispatcher passes TRUE p_status — no dead branches in the RPC', () => {
  // Regression guard: the original dispatcher re-encoded 'failed' as 'pending',
  // which silently bypassed every subscription-counter branch. The RPC now
  // maps statuses in-SQL, so the dispatcher must pass its semantic status
  // unchanged ('delivered' | 'failed' | 'dlq').
  assert.match(
    DISPATCHER,
    /p_status:\s*finalStatus,/,
    "dispatcher must pass finalStatus directly — no 'failed' → 'pending' remap",
  );
  assert.ok(
    !DISPATCHER.includes(`finalStatus === "failed" ? "pending"`) &&
      !DISPATCHER.includes("finalStatus === 'failed' ? 'pending'"),
    'dispatcher must not down-convert "failed" to "pending" before the RPC',
  );
});

test('finalize_webhook_delivery validates p_status and maps to delivery row internally', () => {
  assert.match(
    OUTBOX_MIGRATION,
    /IF p_status NOT IN \('delivered', 'failed', 'dlq'\) THEN[\s\S]+RAISE EXCEPTION/,
    'RPC must reject unknown statuses rather than silently no-op',
  );
  assert.match(
    OUTBOX_MIGRATION,
    /row_status := CASE p_status[\s\S]+WHEN 'failed'\s+THEN 'pending'/,
    'RPC must translate p_status=failed into delivery.status=pending in SQL',
  );
});

test('dispatcher logs RPC errors instead of silently failing', () => {
  assert.match(DISPATCHER, /fanout_event_outbox failed/);
  assert.match(DISPATCHER, /claim_due_webhook_deliveries failed/);
  assert.match(DISPATCHER, /finalize_webhook_delivery failed/);
});

test('emitEvent caps payload size so one runaway tool cannot melt subscribers', () => {
  assert.match(EVENTS_LIB, /MAX_PAYLOAD_BYTES = 64 \* 1024/);
  assert.match(EVENTS_LIB, /function capPayload\(/);
  assert.match(EVENTS_LIB, /payload: capPayload\(input\.payload\)/);
});

test('concierge worker emits playbook.run.succeeded / failed / step.completed', () => {
  const worker = readFileSync(resolve(root, 'api/_lib/concierge-playbook-worker.ts'), 'utf8');
  assert.match(worker, /import \{ emitEvent \} from '\.\/events';/);
  assert.match(worker, /eventType: 'playbook\.run\.succeeded'/);
  assert.match(worker, /eventType: 'playbook\.run\.failed'/);
  assert.match(worker, /eventType: 'playbook\.run\.step\.completed'/);
});

test('dispatcher routes are mounted under /make-server-57781ad9 in the Edge entrypoint', () => {
  const indexTsx = readFileSync(
    resolve(root, 'supabase/functions/make-server-57781ad9/index.tsx'),
    'utf8',
  );
  const indexTs = readFileSync(
    resolve(root, 'supabase/functions/make-server-57781ad9/index.ts'),
    'utf8',
  );
  for (const [name, src] of [['index.tsx', indexTsx], ['index.ts', indexTs]]) {
    assert.match(
      src,
      /import \{ registerWebhookDispatcherRoutes \} from "\.\/webhook-dispatcher\.tsx";/,
      `${name} must import the dispatcher`,
    );
    assert.match(
      src,
      /registerWebhookDispatcherRoutes\(app\);/,
      `${name} must mount the dispatcher routes`,
    );
  }
  // Route paths inside the dispatcher must include the function prefix.
  assert.match(DISPATCHER, /app\.post\("\/make-server-57781ad9\/internal\/webhooks\/flush"/);
  assert.match(DISPATCHER, /app\.get\("\/make-server-57781ad9\/internal\/webhooks\/status"/);
});
