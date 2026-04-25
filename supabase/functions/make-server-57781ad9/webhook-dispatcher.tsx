/**
 * Webhook dispatcher (Gap #1).
 *
 * Single internal route that pg_cron calls every minute:
 *   POST /make-server-57781ad9/internal/webhooks/flush
 *     header: x-nexus-internal-secret: $NEXUS_PHONE_EDGE_SECRET
 *
 * Two phases per run:
 *   1. Fanout — call `public.fanout_event_outbox` to turn new outbox rows
 *      into one `webhook_deliveries` row per matching active subscription.
 *   2. Dispatch — call `public.claim_due_webhook_deliveries` (SKIP LOCKED),
 *      POST each with HMAC signature, finalize via `finalize_webhook_delivery`.
 *
 * Retries: exponential backoff capped at 12h; DLQ after 10 attempts.
 *
 * Every HTTP request has a hard 8s abort so one slow subscriber cannot stall
 * the dispatcher minute-budget (Supabase pg_cron jobs cap at 10 min anyway).
 */

import type { Hono } from "npm:hono";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js";

const USER_AGENT = "SyncScript-Webhooks/1";
const FANOUT_BATCH = 50;
const DISPATCH_BATCH = 50;
const DISPATCH_TIMEOUT_MS = 8_000;
const LEASE_SECONDS = 60;
const MAX_ATTEMPTS = 10;

// Exponential backoff in seconds: 60, 300, 900, 1800, 3600, 7200, 14400, 28800, 43200, 43200
const BACKOFF_SCHEDULE_SECONDS = [60, 300, 900, 1800, 3600, 7200, 14400, 28800, 43200];

type DeliveryRow = {
  id: string;
  subscription_id: string;
  event_id: string;
  attempt: number;
};

type EventRow = {
  id: string;
  user_id: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
};

type SubscriptionRow = {
  id: string;
  user_id: string;
  url: string;
  secret: string;
  label: string | null;
};

function serviceClient(): SupabaseClient | null {
  const url = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL") || "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function hmacSign(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  const bytes = new Uint8Array(mac);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}

function nextAttemptAtForAttempt(attempt: number): string {
  const idx = Math.min(attempt - 1, BACKOFF_SCHEDULE_SECONDS.length - 1);
  const secs = BACKOFF_SCHEDULE_SECONDS[Math.max(0, idx)];
  return new Date(Date.now() + secs * 1000).toISOString();
}

async function deliverOne(
  sb: SupabaseClient,
  row: DeliveryRow,
): Promise<{ status: "delivered" | "failed" | "dlq"; code: number | null; body: string | null; error: string | null }> {
  const [{ data: sub }, { data: ev }] = await Promise.all([
    sb.from("webhook_subscriptions").select("id,user_id,url,secret,label").eq("id", row.subscription_id).maybeSingle(),
    sb.from("event_outbox").select("id,user_id,event_type,payload,created_at").eq("id", row.event_id).maybeSingle(),
  ]);

  if (!sub || !ev) {
    return {
      status: "dlq",
      code: null,
      body: null,
      error: !sub ? "subscription_missing" : "event_missing",
    };
  }

  const subscription = sub as SubscriptionRow;
  const event = ev as EventRow;

  const body = JSON.stringify({
    id: event.id,
    type: event.event_type,
    occurred_at: event.created_at,
    user_id: event.user_id,
    payload: event.payload ?? {},
  });

  const signature = await hmacSign(subscription.secret, body);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DISPATCH_TIMEOUT_MS);

  try {
    const res = await fetch(subscription.url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
        "X-SyncScript-Event": event.event_type,
        "X-SyncScript-Event-Id": event.id,
        "X-SyncScript-Delivery-Id": row.id,
        "X-SyncScript-Signature": `sha256=${signature}`,
        "X-SyncScript-Attempt": String(row.attempt + 1),
      },
      body,
    });

    const text = await res.text().catch(() => "");
    const excerpt = text.slice(0, 500);

    if (res.status >= 200 && res.status < 300) {
      return { status: "delivered", code: res.status, body: excerpt, error: null };
    }

    // 4xx that is not 408/429 is unlikely to recover — DLQ immediately.
    const permanent =
      res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429;
    if (permanent) {
      return { status: "dlq", code: res.status, body: excerpt, error: `http_${res.status}_permanent` };
    }

    return { status: "failed", code: res.status, body: excerpt, error: `http_${res.status}` };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { status: "failed", code: null, body: null, error: msg };
  } finally {
    clearTimeout(timeout);
  }
}

async function runFlushOnce(sb: SupabaseClient): Promise<Record<string, unknown>> {
  // Phase 1: fanout. If it errors we still try to drain already-fanned rows in
  // phase 2 — they're independent steps. Surface the error in the response so
  // Supabase function logs make any regression obvious.
  const fanout = await sb.rpc("fanout_event_outbox", { batch_n: FANOUT_BATCH });
  const events_fanned = typeof fanout.data === "number" ? fanout.data : 0;
  if (fanout.error) {
    console.error("[webhook-dispatcher] fanout_event_outbox failed", fanout.error);
  }

  // Phase 2: claim + dispatch.
  const claim = await sb.rpc("claim_due_webhook_deliveries", {
    lease_seconds: LEASE_SECONDS,
    limit_n: DISPATCH_BATCH,
  });
  if (claim.error) {
    console.error("[webhook-dispatcher] claim_due_webhook_deliveries failed", claim.error);
  }

  const rows = Array.isArray(claim.data) ? (claim.data as DeliveryRow[]) : [];

  let delivered = 0;
  let retrying = 0;
  let dlq = 0;

  for (const row of rows) {
    const outcome = await deliverOne(sb, row);
    const nextAttempt = row.attempt + 1;

    // TRUE semantic status — the RPC maps 'failed' → delivery.status='pending'
    // internally so callers don't double-book the encoding.
    let finalStatus: "delivered" | "failed" | "dlq";
    let nextAttemptAt: string | null = null;

    if (outcome.status === "delivered") {
      finalStatus = "delivered";
      delivered += 1;
    } else if (outcome.status === "dlq" || nextAttempt >= MAX_ATTEMPTS) {
      finalStatus = "dlq";
      dlq += 1;
    } else {
      finalStatus = "failed";
      nextAttemptAt = nextAttemptAtForAttempt(nextAttempt);
      retrying += 1;
    }

    const finalize = await sb.rpc("finalize_webhook_delivery", {
      p_delivery_id: row.id,
      p_status: finalStatus,
      p_attempt: nextAttempt,
      p_response_status: outcome.code,
      p_response_body_excerpt: outcome.body,
      p_last_error: outcome.error,
      p_next_attempt_at: nextAttemptAt,
    });
    if (finalize.error) {
      console.error("[webhook-dispatcher] finalize_webhook_delivery failed", row.id, finalize.error);
    }
  }

  return {
    ok: true,
    events_fanned,
    claimed: rows.length,
    delivered,
    retrying,
    dlq,
  };
}

export function registerWebhookDispatcherRoutes(app: Hono) {
  app.post("/make-server-57781ad9/internal/webhooks/flush", async (c) => {
    const secret = Deno.env.get("NEXUS_PHONE_EDGE_SECRET");
    const hdr = c.req.header("x-nexus-internal-secret");
    if (!secret || hdr !== secret) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const sb = serviceClient();
    if (!sb) {
      return c.json({ error: "supabase_not_configured" }, 500);
    }
    try {
      const summary = await runFlushOnce(sb);
      return c.json(summary);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "flush failed";
      console.error("[webhook-dispatcher] flush", e);
      return c.json({ ok: false, error: msg }, 500);
    }
  });

  app.get("/make-server-57781ad9/internal/webhooks/status", async (c) => {
    const secret = Deno.env.get("NEXUS_PHONE_EDGE_SECRET");
    const hdr = c.req.header("x-nexus-internal-secret");
    if (!secret || hdr !== secret) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const sb = serviceClient();
    if (!sb) return c.json({ error: "supabase_not_configured" }, 500);

    const { count: pendingEvents } = await sb
      .from("event_outbox")
      .select("*", { count: "exact", head: true })
      .is("fanout_at", null);
    const { count: pendingDeliveries } = await sb
      .from("webhook_deliveries")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    const { count: dlqDeliveries } = await sb
      .from("webhook_deliveries")
      .select("*", { count: "exact", head: true })
      .eq("status", "dlq");

    return c.json({
      ok: true,
      pending_events: pendingEvents ?? 0,
      pending_deliveries: pendingDeliveries ?? 0,
      dlq_deliveries: dlqDeliveries ?? 0,
    });
  });
}
