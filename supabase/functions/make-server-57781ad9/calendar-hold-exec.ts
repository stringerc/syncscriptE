/**
 * Shared calendar quick-hold logic for POST /calendar/hold and capture-inbox commit.
 */
import * as kv from "./kv_store.tsx";
import { appendLocalCalendarEvent } from "./calendar-local-kv.ts";
import {
  createGoogleCalendarEvent,
  createOutlookCalendarEvent,
  syncCalendarEventToTargets,
  type IntegrationActionResult,
  type CalendarEventInput,
} from "./integration-actions.tsx";

export const CALENDAR_HOLD_PREFS_KEY = (userId: string) => `calendar:hold_prefs:v1:${userId}`;
export const CALENDAR_SYNC_GROUPS_KEY = (userId: string) => `calendar:sync_groups:v1:${userId}`;

export type CalendarHoldPrefs = { autoTargets?: ("google" | "outlook")[] };

export type CalendarSyncGroup = {
  id: string;
  created_at: string;
  title: string;
  start_time: string;
  end_time: string;
  instances: { provider: string; event_id?: string; link?: string | null }[];
};

export function normalizeHoldTargets(raw: unknown): ("google" | "outlook")[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: ("google" | "outlook")[] = [];
  for (const x of raw) {
    const s = String(x).toLowerCase();
    if (s === "google" || s === "outlook") out.push(s);
  }
  return out.length ? out : null;
}

export async function appendCalendarSyncGroup(
  userId: string,
  title: string,
  startTime: string,
  endTime: string,
  results: IntegrationActionResult[],
): Promise<string | null> {
  const ok = results.filter((r) => r.success && r.data);
  if (ok.length === 0) return null;
  const id = crypto.randomUUID();
  const instances = ok.map((r) => ({
    provider: r.provider,
    event_id: r.data?.eventId as string | undefined,
    link: (r.data?.htmlLink ?? r.data?.webLink) as string | null | undefined,
  }));
  const row: CalendarSyncGroup = {
    id,
    created_at: new Date().toISOString(),
    title,
    start_time: startTime,
    end_time: endTime,
    instances,
  };
  const key = CALENDAR_SYNC_GROUPS_KEY(userId);
  const prev = (await kv.get(key)) as { groups?: CalendarSyncGroup[] } | null;
  const groups = Array.isArray(prev?.groups) ? [...prev.groups] : [];
  groups.unshift(row);
  await kv.set(key, { groups: groups.slice(0, 100) });
  return id;
}

function bodyTruthySyncscriptOnly(body: Record<string, unknown>): boolean {
  if (body.syncscript_only === true || body.local_only === true) return true;
  const a = String(body.syncscript_only ?? "").trim().toLowerCase();
  const b = String(body.local_only ?? "").trim().toLowerCase();
  return a === "true" || a === "1" || a === "yes" || b === "true" || b === "1" || b === "yes";
}

/** Same semantics as POST /calendar/hold (no Hono context). */
export async function runCalendarHold(
  userId: string,
  body: Record<string, unknown>,
): Promise<{ status: number; json: Record<string, unknown> }> {
  const title = String(body.title || "").trim();
  const startIso = String(body.start_iso || body.startTime || "").trim();
  let endIso = String(body.end_iso || body.endTime || "").trim();
  const timeZone = String(body.time_zone || body.timeZone || "").trim() || undefined;
  if (!title || !startIso) {
    return { status: 400, json: { error: "title and start_iso required" } };
  }
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) {
    return { status: 400, json: { error: "invalid start_iso" } };
  }
  let end: Date;
  if (endIso) {
    end = new Date(endIso);
    if (Number.isNaN(end.getTime())) {
      return { status: 400, json: { error: "invalid end_iso" } };
    }
  } else {
    end = new Date(start.getTime() + 30 * 60 * 1000);
  }

  if (bodyTruthySyncscriptOnly(body)) {
    const rec = await appendLocalCalendarEvent(userId, {
      title,
      start_iso: start.toISOString(),
      end_iso: end.toISOString(),
      source: "syncscript_only_hold",
    });
    return {
      status: 200,
      json: {
        success: true,
        local_only: true,
        code: "SYNCSCRIPT_ONLY",
        local_event_id: rec.id,
        message:
          "Saved to your SyncScript in-app calendar only. Google/Outlook were not contacted. Send syncscript_only: true on POST /calendar/hold (or MCP syncscript_calendar_hold) to keep holds in SyncScript.",
        results: [],
      },
    };
  }

  const rawProvider = String(body.provider || "auto").toLowerCase();
  if (!["auto", "google", "outlook"].includes(rawProvider)) {
    return { status: 400, json: { error: "provider must be auto, google, or outlook" } };
  }

  const eventInput: CalendarEventInput = {
    title,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    ...(timeZone ? { timeZone } : {}),
  };

  let results: IntegrationActionResult[];
  if (rawProvider === "google") {
    results = [await createGoogleCalendarEvent(userId, eventInput)];
  } else if (rawProvider === "outlook") {
    results = [await createOutlookCalendarEvent(userId, eventInput)];
  } else {
    const explicit = normalizeHoldTargets(body.targets);
    let targets: ("google" | "outlook")[];
    if (explicit) {
      targets = explicit;
    } else {
      const prefs = (await kv.get(CALENDAR_HOLD_PREFS_KEY(userId))) as CalendarHoldPrefs | null;
      targets = prefs?.autoTargets?.length ? prefs.autoTargets : ["google", "outlook"];
    }
    results = await syncCalendarEventToTargets(userId, eventInput, targets);
  }

  if (results.length === 0) {
    const rec = await appendLocalCalendarEvent(userId, {
      title,
      start_iso: eventInput.startTime,
      end_iso: eventInput.endTime,
      source: "no_external_calendar",
    });
    return {
      status: 200,
      json: {
        success: true,
        local_only: true,
        code: "NO_CALENDAR",
        local_event_id: rec.id,
        message:
          "Saved to your SyncScript calendar (in-app). Connect Google or Outlook under Settings → Integrations to sync to external calendars.",
        results: [],
      },
    };
  }

  const anySuccess = results.some((r) => r.success);
  if (!anySuccess) {
    return {
      status: 502,
      json: {
        error: results.map((r) => r.error || `${r.provider} failed`).join("; "),
        results: results.map((r) => ({
          provider: r.provider,
          success: r.success,
          error: r.error,
        })),
      },
    };
  }

  const syncGroupId = await appendCalendarSyncGroup(
    userId,
    title,
    eventInput.startTime,
    eventInput.endTime,
    results,
  );

  const firstOk = results.find((r) => r.success);
  const payload: Record<string, unknown> = {
    success: true,
    provider_mode: rawProvider,
    results: results.map((r) => ({
      provider: r.provider,
      success: r.success,
      error: r.error || null,
      data: r.data || null,
    })),
  };
  if (syncGroupId) {
    payload.sync_group_id = syncGroupId;
  }
  if (firstOk?.data) {
    payload.event_id = firstOk.data.eventId;
    payload.html_link = firstOk.data.htmlLink ?? firstOk.data.webLink;
    payload.summary = firstOk.data.summary ?? firstOk.data.subject;
  }
  return { status: 200, json: payload };
}
