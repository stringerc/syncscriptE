/**
 * SyncScript event bus (outbox pattern).
 *
 * Every mutating action that should be visible to user-level webhook
 * subscribers (n8n / Make / Zapier / custom) calls `emitEvent`. Rows land
 * in `public.event_outbox`; the Edge dispatcher fans them out to
 * `public.webhook_deliveries`, signs with each subscription's secret, and
 * retries with exponential backoff.
 *
 * Keep this file small and dependency-free so it can be imported from
 * Vercel functions and anywhere else without dragging in heavy clients.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Canonical event type catalog. Add new events here (and only here) so
 * contract tests + typed subscribers stay in lockstep.
 */
export const SYNCSCRIPT_EVENT_TYPES = [
  // tasks / notes
  'task.created',
  'task.updated',
  'task.completed',
  'note.created',
  // calendar
  'event.proposed',
  'event.created',
  // documents
  'document.created',
  'document.updated',
  // invoices + signatures
  'invoice.sent',
  'invoice.paid',
  'invoice.overdue',
  'signature.requested',
  // playbooks (concierge)
  'playbook.run.started',
  'playbook.run.step.completed',
  'playbook.run.succeeded',
  'playbook.run.failed',
  // nexus surface
  'nexus.tool.called',
  'nexus.voice.turn.completed',
] as const;

export type SyncScriptEventType = (typeof SYNCSCRIPT_EVENT_TYPES)[number];

export function isSyncScriptEventType(v: string): v is SyncScriptEventType {
  return (SYNCSCRIPT_EVENT_TYPES as readonly string[]).includes(v);
}

export interface EmitEventInput {
  userId: string | null;
  eventType: SyncScriptEventType;
  /** Optional; when set, (user_id, event_type, event_key) is unique — duplicate emits are dropped. */
  eventKey?: string | null;
  payload?: Record<string, unknown>;
}

let cachedServiceClient: SupabaseClient | null = null;

function getServiceClient(): SupabaseClient | null {
  if (cachedServiceClient) return cachedServiceClient;
  const url =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) return null;
  cachedServiceClient = createClient(url, key, { auth: { persistSession: false } });
  return cachedServiceClient;
}

/**
 * Outbox rows are delivered over HTTP; cap payload so a runaway tool argument
 * can never fill Postgres or melt a subscriber. 64 KB is larger than any
 * legitimate SyncScript event payload and smaller than Supabase's jsonb hard
 * limits, giving us headroom without invisibly truncating real events.
 */
const MAX_PAYLOAD_BYTES = 64 * 1024;

function capPayload(payload: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!payload) return {};
  try {
    const serialized = JSON.stringify(payload);
    if (serialized.length <= MAX_PAYLOAD_BYTES) return payload;
    return {
      _truncated: true,
      _original_bytes: serialized.length,
      _max_bytes: MAX_PAYLOAD_BYTES,
    };
  } catch {
    return { _truncated: true, _reason: 'not_serializable' };
  }
}

/**
 * Fire-and-forget — never throws. A failure to emit must never break the
 * user-facing action that triggered it. Returns the inserted event id or
 * `null` when the event could not be recorded (missing env, dup key, etc).
 */
export async function emitEvent(input: EmitEventInput): Promise<string | null> {
  const sb = getServiceClient();
  if (!sb) return null;
  if (!input.userId) return null; // System-level events need a user_id scope

  try {
    const { data, error } = await sb
      .from('event_outbox')
      .insert({
        user_id: input.userId,
        event_type: input.eventType,
        event_key: input.eventKey ?? null,
        payload: capPayload(input.payload),
      })
      .select('id')
      .single();

    if (error) {
      // 23505 = unique_violation on idempotency key — expected under retries, not a bug.
      if ((error as { code?: string }).code === '23505') return null;
      console.warn('[events.emitEvent]', input.eventType, error.message);
      return null;
    }
    return (data as { id: string }).id;
  } catch (e) {
    console.warn('[events.emitEvent] threw', input.eventType, e);
    return null;
  }
}
