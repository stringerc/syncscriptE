/**
 * In-app calendar rows when no external calendar is connected (parity with Nexus voice local save).
 * Stored in KV; dashboard hydrates via GET /calendar/local-events.
 */
import * as kv from "./kv_store.tsx";

const LOCAL_EVENTS_KEY = (userId: string) => `calendar:local_events:v1:${userId}`;

export type KvLocalCalendarEvent = {
  id: string;
  title: string;
  start_iso: string;
  end_iso: string;
  source?: string;
  created_at: string;
};

export async function listLocalCalendarEvents(userId: string): Promise<KvLocalCalendarEvent[]> {
  const row = (await kv.get(LOCAL_EVENTS_KEY(userId))) as { events?: KvLocalCalendarEvent[] } | null;
  return Array.isArray(row?.events) ? row.events : [];
}

export async function appendLocalCalendarEvent(
  userId: string,
  input: { title: string; start_iso: string; end_iso: string; source?: string },
): Promise<KvLocalCalendarEvent> {
  const id = crypto.randomUUID();
  const rec: KvLocalCalendarEvent = {
    id,
    title: String(input.title || "Event").trim() || "Event",
    start_iso: input.start_iso,
    end_iso: input.end_iso,
    source: input.source || "calendar_hold",
    created_at: new Date().toISOString(),
  };
  const prev = await listLocalCalendarEvents(userId);
  const events = [rec, ...prev].slice(0, 500);
  await kv.set(LOCAL_EVENTS_KEY(userId), { events });
  return rec;
}
