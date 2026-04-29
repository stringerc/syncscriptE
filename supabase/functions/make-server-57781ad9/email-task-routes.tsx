import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";
import { getValidToken } from "./oauth-routes.tsx";
import { registerInvoiceBillingCron } from "./invoice-billing-cron.tsx";
import {
  createGoogleCalendarEvent,
  createOutlookCalendarEvent,
  syncCalendarEventToTargets,
  updateGoogleCalendarEvent,
  updateOutlookCalendarEvent,
  deleteGoogleCalendarEvent,
  deleteOutlookCalendarEvent,
  type IntegrationActionResult,
  type CalendarEventInput,
} from "./integration-actions.tsx";
import { recordTaskCompleted } from "./activity-record.ts";

const app = new Hono();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const TASKS_KEY = (userId: string) => `tasks:v1:${userId}`;
const CALENDAR_HOLD_PREFS_KEY = (userId: string) => `calendar:hold_prefs:v1:${userId}`;
const CALENDAR_SYNC_GROUPS_KEY = (userId: string) => `calendar:sync_groups:v1:${userId}`;

type CalendarHoldPrefs = { autoTargets?: ("google" | "outlook")[] };

type CalendarSyncGroup = {
  id: string;
  created_at: string;
  title: string;
  start_time: string;
  end_time: string;
  instances: { provider: string; event_id?: string; link?: string | null }[];
};

function normalizeHoldTargets(raw: unknown): ("google" | "outlook")[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: ("google" | "outlook")[] = [];
  for (const x of raw) {
    const s = String(x).toLowerCase();
    if (s === "google" || s === "outlook") out.push(s);
  }
  return out.length ? out : null;
}

async function appendCalendarSyncGroup(
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

function toShortCalendarProvider(p: string): "google" | "outlook" | null {
  const s = p.toLowerCase();
  if (s.includes("google")) return "google";
  if (s.includes("outlook")) return "outlook";
  return null;
}

/** Reconcile KV-linked instances with desired targets; update/create/delete provider events. */
async function reconcileCalendarSyncGroupInstances(
  userId: string,
  group: CalendarSyncGroup,
  targets: ("google" | "outlook")[],
  eventInput: CalendarEventInput,
): Promise<{ instances: CalendarSyncGroup["instances"]; results: IntegrationActionResult[] }> {
  const results: IntegrationActionResult[] = [];
  const want = new Set(targets);
  const byShort = new Map<string, CalendarSyncGroup["instances"][number]>();

  for (const inst of group.instances) {
    const sh = toShortCalendarProvider(inst.provider);
    if (sh) byShort.set(sh, { ...inst });
  }

  for (const sh of ["google", "outlook"] as const) {
    const need = want.has(sh);
    const had = byShort.get(sh);

    if (!need && had?.event_id) {
      const r = sh === "google"
        ? await deleteGoogleCalendarEvent(userId, had.event_id)
        : await deleteOutlookCalendarEvent(userId, had.event_id);
      results.push(r);
      if (r.success) byShort.delete(sh);
      continue;
    }

    if (need && had?.event_id) {
      const r = sh === "google"
        ? await updateGoogleCalendarEvent(userId, had.event_id, eventInput)
        : await updateOutlookCalendarEvent(userId, had.event_id, eventInput);
      results.push(r);
      if (r.success) {
        byShort.set(sh, {
          provider: sh === "google" ? "google_calendar" : "outlook_calendar",
          event_id: (r.data?.eventId as string | undefined) || had.event_id,
          link: (r.data?.htmlLink ?? r.data?.webLink ?? had.link) as string | null | undefined,
        });
      }
      continue;
    }

    if (need && !had?.event_id) {
      const r = sh === "google"
        ? await createGoogleCalendarEvent(userId, eventInput)
        : await createOutlookCalendarEvent(userId, eventInput);
      results.push(r);
      if (r.success && r.data?.eventId) {
        byShort.set(sh, {
          provider: sh === "google" ? "google_calendar" : "outlook_calendar",
          event_id: r.data.eventId as string,
          link: (r.data.htmlLink ?? r.data.webLink) as string | null | undefined,
        });
      }
    }
  }

  return { instances: Array.from(byShort.values()), results };
}

const EMAIL_SETTINGS_KEY = (userId: string) => `email:settings:${userId}`;
const EMAIL_CACHE_KEY = (userId: string, provider: string) => `email:cache:${userId}:${provider}:metadata`;
const EMAIL_EVENT_DEDUPE_KEY = (provider: string, userId: string, messageId: string) =>
  `email:event:dedupe:${provider}:${userId}:${messageId}`;
const EMAIL_EVENT_LOG_KEY = (userId: string, ts: string) => `email:event:log:${userId}:${ts}`;

const DEFAULT_RETENTION_DAYS = 30;
const EMAIL_AUTOMATION_ENABLED = (Deno.env.get("EMAIL_AUTOMATION_ENABLED") || "true") !== "false";
const emailEventRateMap = new Map<string, { count: number; resetAt: number }>();

type AuthUser = { id: string; email?: string | null };

type TaskRecord = {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "todo" | "in_progress" | "completed";
  completed: boolean;
  energyLevel: "low" | "medium" | "high";
  estimatedTime: string;
  dueDate: string;
  scheduledTime?: string;
  progress: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  completedAt?: string | null;
  source?: string;
};

type EmailMetadata = {
  id: string;
  provider: "gmail" | "outlook";
  threadId?: string;
  folder: "inbox" | "sent";
  subject: string;
  from: string;
  to: string[];
  snippet: string;
  date: string;
  webLink?: string;
  cachedAt: string;
};

async function requireUser(c: any): Promise<AuthUser | null> {
  const accessToken = c.req.header("Authorization")?.split(" ")[1];
  if (!accessToken) return null;
  const { data: { user } } = await supabase.auth.getUser(accessToken);
  if (!user) return null;
  return { id: user.id, email: user.email };
}

function normalizeTask(raw: any, userName: string): TaskRecord {
  const now = new Date().toISOString();
  const due = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  return {
    id: String(raw?.id || `task_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`),
    title: String(raw?.title || "Untitled Task"),
    description: raw?.description ? String(raw.description) : "",
    priority: ["low", "medium", "high", "urgent"].includes(raw?.priority) ? raw.priority : "medium",
    status: ["todo", "in_progress", "completed"].includes(raw?.status)
      ? raw.status
      : (raw?.completed ? "completed" : "todo"),
    completed: Boolean(raw?.completed),
    energyLevel: ["low", "medium", "high"].includes(raw?.energyLevel) ? raw.energyLevel : "medium",
    estimatedTime: String(raw?.estimatedTime || "15 min"),
    dueDate: raw?.dueDate ? new Date(raw.dueDate).toISOString() : due,
    scheduledTime: raw?.scheduledTime ? new Date(raw.scheduledTime).toISOString() : undefined,
    progress: Number.isFinite(Number(raw?.progress)) ? Number(raw.progress) : (raw?.completed ? 100 : 0),
    tags: Array.isArray(raw?.tags) ? raw.tags.map((t: any) => String(t)) : [],
    createdAt: raw?.createdAt ? new Date(raw.createdAt).toISOString() : now,
    updatedAt: raw?.updatedAt ? new Date(raw.updatedAt).toISOString() : now,
    createdBy: String(raw?.createdBy || userName || "You"),
    completedAt: raw?.completedAt ? new Date(raw.completedAt).toISOString() : null,
    source: raw?.source ? String(raw.source) : undefined,
  };
}

async function getTasks(userId: string): Promise<TaskRecord[]> {
  const existing = await kv.get(TASKS_KEY(userId));
  if (!Array.isArray(existing)) return [];
  return existing as TaskRecord[];
}

async function saveTasks(userId: string, tasks: TaskRecord[]): Promise<void> {
  await kv.set(TASKS_KEY(userId), tasks);
}

function applyTaskFilters(tasks: TaskRecord[], q: URLSearchParams): TaskRecord[] {
  const priority = q.get("priority");
  const status = q.get("status");
  const tag = q.get("tag");
  const completed = q.get("completed");
  const scheduled = q.get("scheduled");

  let out = [...tasks];
  if (priority && priority !== "all") out = out.filter((t) => t.priority === priority);
  if (status && status !== "all") out = out.filter((t) => t.status === status);
  if (tag && tag !== "all") out = out.filter((t) => t.tags.includes(tag));
  if (completed === "true") out = out.filter((t) => t.completed);
  if (completed === "false") out = out.filter((t) => !t.completed);
  if (scheduled === "true") out = out.filter((t) => Boolean(t.scheduledTime));
  if (scheduled === "false") out = out.filter((t) => !t.scheduledTime);
  return out.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

function parseGmailHeader(headers: any[], key: string): string {
  return headers?.find((h: any) => h?.name?.toLowerCase() === key.toLowerCase())?.value || "";
}

function extractEmailList(value: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function decodeBase64UrlServer(input: string): string {
  try {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
    return atob(normalized + pad);
  } catch {
    return "";
  }
}

function encodeBase64UrlServer(input: string): string {
  try {
    const bytes = new TextEncoder().encode(input);
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  } catch {
    return "";
  }
}

async function fetchGmailAttachmentBody(
  token: string,
  messageId: string,
  attachmentId: string,
): Promise<string> {
  const resp = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!resp.ok) return "";
  const json = await resp.json();
  const data = String(json?.data || "");
  return data ? decodeBase64UrlServer(data) : "";
}

async function collectGmailBodyCandidates(
  payload: any,
  mimeType: string,
  token: string,
  messageId: string,
  acc: string[] = [],
): Promise<string[]> {
  if (!payload) return acc;

  if (payload.mimeType === mimeType) {
    const inlineData = String(payload?.body?.data || "");
    const attachmentId = String(payload?.body?.attachmentId || "");

    if (inlineData) {
      const decoded = decodeBase64UrlServer(inlineData);
      if (decoded) acc.push(decoded);
    } else if (attachmentId) {
      const decoded = await fetchGmailAttachmentBody(token, messageId, attachmentId);
      if (decoded) acc.push(decoded);
    }
  }

  if (Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      await collectGmailBodyCandidates(part, mimeType, token, messageId, acc);
    }
  }

  return acc;
}

function visibleTextScore(htmlOrText: string): number {
  const noTags = htmlOrText.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ");
  const normalized = noTags.replace(/\s+/g, " ").trim();
  return normalized.length;
}

function ensureReplySubject(subject?: string): string {
  const raw = String(subject || "").trim();
  if (!raw) return "Re: (no subject)";
  return /^re:/i.test(raw) ? raw : `Re: ${raw}`;
}

async function fetchGmailMessages(
  userId: string,
  folder: "inbox" | "sent",
  limit: number,
  cursor?: string,
  q?: string,
): Promise<{ messages: EmailMetadata[]; nextCursor: string | null }> {
  const token =
    (await getValidToken("google_mail", userId)) ||
    (await getValidToken("google_calendar", userId));
  if (!token) {
    throw new Error("No valid Google token found. Connect Gmail integration first.");
  }

  const query = [folder === "sent" ? "in:sent" : "in:inbox", q || ""].filter(Boolean).join(" ");
  const listParams = new URLSearchParams({
    maxResults: String(Math.max(1, Math.min(limit, 50))),
    q: query,
  });
  if (cursor) listParams.set("pageToken", cursor);

  const listResp = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${listParams.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listResp.ok) throw new Error(`Gmail list failed: ${await listResp.text()}`);
  const listJson = await listResp.json();
  const ids: string[] = (listJson.messages || []).map((m: any) => m.id).filter(Boolean);

  const details = await Promise.all(ids.map(async (id) => {
    const resp = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!resp.ok) return null;
    return await resp.json();
  }));

  const messages: EmailMetadata[] = details
    .filter(Boolean)
    .map((m: any) => ({
      id: m.id,
      provider: "gmail",
      threadId: m.threadId,
      folder,
      subject: parseGmailHeader(m.payload?.headers || [], "Subject") || "(no subject)",
      from: parseGmailHeader(m.payload?.headers || [], "From"),
      to: extractEmailList(parseGmailHeader(m.payload?.headers || [], "To")),
      snippet: String(m.snippet || ""),
      date: m.internalDate ? new Date(Number(m.internalDate)).toISOString() : new Date().toISOString(),
      webLink: `https://mail.google.com/mail/u/0/#${folder}/${m.id}`,
      cachedAt: new Date().toISOString(),
    }));

  return { messages, nextCursor: listJson.nextPageToken || null };
}

async function fetchOutlookMessages(
  userId: string,
  folder: "inbox" | "sent",
  limit: number,
  cursor?: string,
  q?: string,
): Promise<{ messages: EmailMetadata[]; nextCursor: string | null }> {
  const token =
    (await getValidToken("outlook_mail", userId)) ||
    (await getValidToken("outlook_calendar", userId));
  if (!token) {
    throw new Error("No valid Outlook token found. Connect Outlook integration first.");
  }

  const mappedFolder = folder === "sent" ? "sentitems" : "inbox";
  const select = "$select=id,conversationId,subject,from,toRecipients,bodyPreview,receivedDateTime,sentDateTime,webLink";
  const top = `$top=${Math.max(1, Math.min(limit, 50))}`;
  const search = q ? `&$search="${q.replace(/"/g, "")}"` : "";
  const base = `https://graph.microsoft.com/v1.0/me/mailFolders/${mappedFolder}/messages?${select}&${top}${search}`;
  const url = cursor ? atob(cursor) : base;

  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      ConsistencyLevel: "eventual",
    },
  });
  if (!resp.ok) throw new Error(`Outlook list failed: ${await resp.text()}`);
  const json = await resp.json();
  const messages: EmailMetadata[] = (json.value || []).map((m: any) => ({
    id: m.id,
    provider: "outlook",
    threadId: m.conversationId,
    folder,
    subject: m.subject || "(no subject)",
    from: m.from?.emailAddress?.address || "",
    to: (m.toRecipients || []).map((r: any) => r?.emailAddress?.address).filter(Boolean),
    snippet: m.bodyPreview || "",
    date: m.sentDateTime || m.receivedDateTime || new Date().toISOString(),
    webLink: m.webLink,
    cachedAt: new Date().toISOString(),
  }));

  return {
    messages,
    nextCursor: json["@odata.nextLink"] ? btoa(json["@odata.nextLink"]) : null,
  };
}

async function pruneAndSaveCache(userId: string, provider: string, incoming: EmailMetadata[], retentionDays: number) {
  const existing = await kv.get(EMAIL_CACHE_KEY(userId, provider));
  const list = Array.isArray(existing) ? existing as EmailMetadata[] : [];
  const now = Date.now();
  const cutoff = now - retentionDays * 24 * 60 * 60 * 1000;
  const merged = [...incoming, ...list].filter((m, index, arr) => arr.findIndex((x) => x.id === m.id) === index);
  const pruned = merged.filter((m) => new Date(m.date).getTime() >= cutoff);
  await kv.set(EMAIL_CACHE_KEY(userId, provider), pruned.slice(0, 5000));
}

app.get("/tasks", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const tasks = await getTasks(user.id);
  return c.json(applyTaskFilters(tasks, new URL(c.req.url).searchParams));
});

app.post("/tasks", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json();
  const tasks = await getTasks(user.id);
  const now = new Date().toISOString();
  const task = normalizeTask({
    ...body,
    id: `task_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
    createdAt: now,
    updatedAt: now,
    completed: false,
    status: "todo",
    progress: 0,
  }, user.email || "You");
  tasks.push(task);
  await saveTasks(user.id, tasks);

  const verify = await getTasks(user.id);
  if (!verify.some((t) => t.id === task.id)) {
    console.error("[TASKS] Write-verify FAILED for", task.id, "user", user.id);
    return c.json({ error: "Task write could not be verified — please retry" }, 500);
  }

  return c.json(task);
});

app.put("/tasks/:id", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const id = c.req.param("id");
  const updates = await c.req.json();
  const tasks = await getTasks(user.id);
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx < 0) return c.json({ error: "Task not found" }, 404);
  const wasCompleted = Boolean(tasks[idx].completed);
  const merged = normalizeTask({ ...tasks[idx], ...updates, id, updatedAt: new Date().toISOString() }, user.email || "You");
  tasks[idx] = merged;
  await saveTasks(user.id, tasks);
  if (merged.completed && !wasCompleted) {
    void recordTaskCompleted(supabase, user.id, { id: merged.id, title: merged.title });
  }
  return c.json(merged);
});

app.delete("/tasks/:id", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const id = c.req.param("id");
  const tasks = await getTasks(user.id);
  const next = tasks.filter((t) => t.id !== id);
  await saveTasks(user.id, next);
  return c.json({ success: true });
});

app.post("/tasks/:id/toggle", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const id = c.req.param("id");
  const tasks = await getTasks(user.id);
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx < 0) return c.json({ error: "Task not found" }, 404);
  const current = tasks[idx];
  const completed = !current.completed;
  tasks[idx] = normalizeTask(
    {
      ...current,
      completed,
      status: completed ? "completed" : "todo",
      progress: completed ? 100 : Math.min(current.progress, 99),
      completedAt: completed ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    },
    user.email || "You",
  );
  await saveTasks(user.id, tasks);
  if (completed) {
    void recordTaskCompleted(supabase, user.id, { id: tasks[idx].id, title: tasks[idx].title });
  }
  return c.json(tasks[idx]);
});

/**
 * GET /calendar/hold-preferences — default calendars for provider=auto (Hermes + UI).
 * PUT body: { autoTargets: ("google"|"outlook")[] } — empty = all connected (same as both).
 */
app.get("/calendar/hold-preferences", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const prefs = (await kv.get(CALENDAR_HOLD_PREFS_KEY(user.id))) as CalendarHoldPrefs | null;
  return c.json({
    autoTargets: prefs?.autoTargets ?? ["google", "outlook"],
    hint: "Omit or set both for ‘all connected’. Single entry limits auto holds to that provider only.",
  });
});

app.put("/calendar/hold-preferences", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  let body: Record<string, unknown> = {};
  try {
    body = (await c.req.json()) as Record<string, unknown>;
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const raw = body.autoTargets;
  if (raw !== undefined && !Array.isArray(raw)) {
    return c.json({ error: "autoTargets must be an array" }, 400);
  }
  const normalized = normalizeHoldTargets(raw ?? ["google", "outlook"]);
  if (!normalized) {
    await kv.set(CALENDAR_HOLD_PREFS_KEY(user.id), { autoTargets: ["google", "outlook"] });
    return c.json({ ok: true, autoTargets: ["google", "outlook"] });
  }
  await kv.set(CALENDAR_HOLD_PREFS_KEY(user.id), { autoTargets: normalized });
  return c.json({ ok: true, autoTargets: normalized });
});

/** GET /calendar/sync-groups — recent linked holds (same logical event across providers). For merged UI. */
app.get("/calendar/sync-groups", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const prev = (await kv.get(CALENDAR_SYNC_GROUPS_KEY(user.id))) as { groups?: CalendarSyncGroup[] } | null;
  const groups = Array.isArray(prev?.groups) ? prev.groups : [];
  return c.json({ groups });
});

/**
 * PATCH /calendar/sync-group/:id — update title/time and/or which providers host this hold.
 * Body: { targets: ("google"|"outlook")[], title?, start_time?, end_time?, time_zone? }
 */
app.patch("/calendar/sync-group/:id", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const id = c.req.param("id");
  let body: Record<string, unknown> = {};
  try {
    body = (await c.req.json()) as Record<string, unknown>;
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const targets = normalizeHoldTargets(body.targets);
  if (!targets?.length) {
    return c.json({ error: "targets must be a non-empty array of google and/or outlook" }, 400);
  }

  const key = CALENDAR_SYNC_GROUPS_KEY(user.id);
  const prev = (await kv.get(key)) as { groups?: CalendarSyncGroup[] } | null;
  const groups = Array.isArray(prev?.groups) ? [...prev.groups] : [];
  const idx = groups.findIndex((g) => g.id === id);
  if (idx < 0) return c.json({ error: "Sync group not found" }, 404);
  const group = groups[idx];

  const title =
    typeof body.title === "string" && body.title.trim() ? body.title.trim() : group.title;
  const start_time =
    typeof body.start_time === "string" && body.start_time.trim()
      ? body.start_time.trim()
      : group.start_time;
  const end_time =
    typeof body.end_time === "string" && body.end_time.trim()
      ? body.end_time.trim()
      : group.end_time;
  const timeZone =
    typeof body.time_zone === "string" && body.time_zone.trim()
      ? body.time_zone.trim()
      : undefined;

  const eventInput: CalendarEventInput = {
    title,
    startTime: start_time,
    endTime: end_time,
    ...(timeZone ? { timeZone } : {}),
  };

  const { instances, results } = await reconcileCalendarSyncGroupInstances(
    user.id,
    group,
    targets,
    eventInput,
  );

  const anyFailure = results.some((r) => !r.success);
  if (anyFailure) {
    return c.json(
      {
        error: results.filter((r) => !r.success).map((r) => r.error || r.provider).join("; "),
        results,
      },
      502,
    );
  }

  if (instances.length === 0) {
    groups.splice(idx, 1);
    await kv.set(key, { groups });
    return c.json({ ok: true, removed: true, results });
  }

  groups[idx] = {
    ...group,
    title,
    start_time,
    end_time,
    instances,
  };
  await kv.set(key, { groups });
  return c.json({ ok: true, group: groups[idx], results });
});

/**
 * POST /calendar/hold — authenticated quick hold (Hermes executor + connected calendars).
 * Body: { title, start_iso, end_iso?, provider?, time_zone?, targets? }
 *   provider: "auto" | "google" | "outlook"
 *   targets: optional ["google","outlook"] when provider=auto — per-request override; else uses GET /calendar/hold-preferences.
 * Default end = start + 30m if end_iso omitted.
 * Response may include sync_group_id when instances are recorded for cross-calendar linking.
 */
app.post("/calendar/hold", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  let body: Record<string, unknown> = {};
  try {
    body = (await c.req.json()) as Record<string, unknown>;
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const title = String(body.title || "").trim();
  const startIso = String(body.start_iso || body.startTime || "").trim();
  let endIso = String(body.end_iso || body.endTime || "").trim();
  const timeZone = String(body.time_zone || body.timeZone || "").trim() || undefined;
  const rawProvider = String(body.provider || "auto").toLowerCase();
  if (!title || !startIso) {
    return c.json({ error: "title and start_iso required" }, 400);
  }
  if (!["auto", "google", "outlook"].includes(rawProvider)) {
    return c.json({ error: "provider must be auto, google, or outlook" }, 400);
  }
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) {
    return c.json({ error: "invalid start_iso" }, 400);
  }
  let end: Date;
  if (endIso) {
    end = new Date(endIso);
    if (Number.isNaN(end.getTime())) {
      return c.json({ error: "invalid end_iso" }, 400);
    }
  } else {
    end = new Date(start.getTime() + 30 * 60 * 1000);
  }

  const eventInput = {
    title,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    ...(timeZone ? { timeZone } : {}),
  };

  let results: IntegrationActionResult[];
  if (rawProvider === "google") {
    results = [await createGoogleCalendarEvent(user.id, eventInput)];
  } else if (rawProvider === "outlook") {
    results = [await createOutlookCalendarEvent(user.id, eventInput)];
  } else {
    const explicit = normalizeHoldTargets(body.targets);
    let targets: ("google" | "outlook")[];
    if (explicit) {
      targets = explicit;
    } else {
      const prefs = (await kv.get(CALENDAR_HOLD_PREFS_KEY(user.id))) as CalendarHoldPrefs | null;
      targets = prefs?.autoTargets?.length ? prefs.autoTargets : ["google", "outlook"];
    }
    results = await syncCalendarEventToTargets(user.id, eventInput, targets);
  }

  if (results.length === 0) {
    return c.json(
      {
        error: "No calendar connected — connect Google Calendar and/or Outlook in Integrations",
        code: "NO_CALENDAR",
      },
      422,
    );
  }

  const anySuccess = results.some((r) => r.success);
  if (!anySuccess) {
    return c.json(
      {
        error: results.map((r) => r.error || `${r.provider} failed`).join("; "),
        results: results.map((r) => ({
          provider: r.provider,
          success: r.success,
          error: r.error,
        })),
      },
      502,
    );
  }

  const syncGroupId = await appendCalendarSyncGroup(
    user.id,
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
  return c.json(payload);
});

app.get("/email/settings", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const settings = (await kv.get(EMAIL_SETTINGS_KEY(user.id))) || {};
  return c.json({
    autoCompleteSentEmails: settings.autoCompleteSentEmails ?? true,
    retentionDays: settings.retentionDays ?? DEFAULT_RETENTION_DAYS,
  });
});

app.put("/email/settings", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json();
  const current = (await kv.get(EMAIL_SETTINGS_KEY(user.id))) || {};
  const next = {
    ...current,
    autoCompleteSentEmails: body.autoCompleteSentEmails ?? current.autoCompleteSentEmails ?? true,
    retentionDays: Math.max(1, Math.min(365, Number(body.retentionDays || current.retentionDays || DEFAULT_RETENTION_DAYS))),
    updatedAt: new Date().toISOString(),
  };
  await kv.set(EMAIL_SETTINGS_KEY(user.id), next);
  return c.json(next);
});

app.post("/email/events/sent", async (c) => {
  if (!EMAIL_AUTOMATION_ENABLED) {
    return c.json({ error: "Email automation is disabled" }, 503);
  }
  const webhookSecret = Deno.env.get("EMAIL_EVENT_WEBHOOK_SECRET");
  const headerSecret = c.req.header("x-syncscript-webhook-secret");
  const authUser = await requireUser(c);
  if (webhookSecret && headerSecret !== webhookSecret && !authUser) {
    return c.json({ error: "Unauthorized webhook call" }, 401);
  }

  const body = await c.req.json();
  const userId = String(body.userId || authUser?.id || "");
  if (!userId) return c.json({ error: "userId is required" }, 400);
  if (authUser && authUser.id !== userId) return c.json({ error: "Forbidden userId mismatch" }, 403);

  const rateKey = `${userId}:${c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown"}`;
  const now = Date.now();
  const current = emailEventRateMap.get(rateKey);
  if (!current || now > current.resetAt) {
    emailEventRateMap.set(rateKey, { count: 1, resetAt: now + 60_000 });
  } else if (current.count >= 60) {
    return c.json({ error: "Rate limit exceeded for email sent events" }, 429);
  } else {
    current.count += 1;
  }

  const provider = (String(body.provider || "gmail").toLowerCase() === "outlook" ? "outlook" : "gmail");
  const messageId = String(body.messageId || body.id || "");
  if (!messageId) return c.json({ error: "messageId is required" }, 400);
  const dedupeKey = EMAIL_EVENT_DEDUPE_KEY(provider, userId, messageId);
  if (await kv.get(dedupeKey)) return c.json({ success: true, deduped: true });

  const settings = (await kv.get(EMAIL_SETTINGS_KEY(userId))) || {};
  const shouldAutoComplete = settings.autoCompleteSentEmails ?? true;
  if (!shouldAutoComplete) {
    await kv.set(dedupeKey, { at: new Date().toISOString(), skipped: true });
    return c.json({ success: true, skipped: "autoCompleteSentEmails disabled" });
  }

  const toList = Array.isArray(body.to) ? body.to.map((v: any) => String(v)) : [];
  const subject = String(body.subject || "(no subject)");
  const occurredAt = body.occurredAt ? new Date(body.occurredAt).toISOString() : new Date().toISOString();

  const tasks = await getTasks(userId);
  const newTask = normalizeTask({
    id: `task_email_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
    title: `Email sent: ${subject}`,
    description: `Auto-completed from ${provider} sent message to ${toList.join(", ") || "recipient"}.`,
    priority: "medium",
    status: "completed",
    completed: true,
    energyLevel: "low",
    estimatedTime: "5 min",
    dueDate: occurredAt,
    progress: 100,
    tags: ["email", "auto-complete", `provider:${provider}`],
    createdAt: occurredAt,
    updatedAt: occurredAt,
    completedAt: occurredAt,
    source: "email.sent",
  }, "Automation");
  tasks.unshift(newTask);
  await saveTasks(userId, tasks);

  await kv.set(dedupeKey, { at: new Date().toISOString() });
  await kv.set(EMAIL_EVENT_LOG_KEY(userId, `${Date.now()}_${crypto.randomUUID().slice(0, 6)}`), {
    provider,
    messageId,
    subject,
    to: toList,
    occurredAt,
    taskId: newTask.id,
    createdAt: new Date().toISOString(),
  });

  const metadata: EmailMetadata = {
    id: messageId,
    provider: provider as "gmail" | "outlook",
    folder: "sent",
    subject,
    from: String(body.from || authUser?.email || ""),
    to: toList,
    snippet: String(body.snippet || ""),
    date: occurredAt,
    webLink: body.webLink ? String(body.webLink) : undefined,
    cachedAt: new Date().toISOString(),
  };
  const retentionDays = Number(settings.retentionDays || DEFAULT_RETENTION_DAYS);
  await pruneAndSaveCache(userId, provider, [metadata], retentionDays);

  return c.json({ success: true, taskId: newTask.id });
});

app.get("/email/messages", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const q = new URL(c.req.url).searchParams;
  const provider = (q.get("provider") || "all").toLowerCase();
  const folder = (q.get("folder") || "inbox").toLowerCase() === "sent" ? "sent" : "inbox";
  const limit = Math.max(1, Math.min(100, Number(q.get("limit") || 25)));
  const cursor = q.get("cursor") || undefined;
  const search = q.get("q") || undefined;
  const settings = (await kv.get(EMAIL_SETTINGS_KEY(user.id))) || {};
  const retentionDays = Number(settings.retentionDays || DEFAULT_RETENTION_DAYS);

  try {
    let messages: EmailMetadata[] = [];
    let nextCursor: string | null = null;
    const providerErrors: Record<string, string> = {};

    if (provider === "gmail") {
      try {
        const out = await fetchGmailMessages(user.id, folder, limit, cursor, search);
        messages = out.messages;
        nextCursor = out.nextCursor;
        await pruneAndSaveCache(user.id, "gmail", messages, retentionDays);
      } catch (error) {
        providerErrors.gmail = String(error || "Gmail fetch failed");
        const cached = await kv.get(EMAIL_CACHE_KEY(user.id, "gmail"));
        const cachedList = Array.isArray(cached) ? (cached as EmailMetadata[]) : [];
        const filtered = cachedList
          .filter((m) => m.folder === folder)
          .filter((m) => !search || m.subject.toLowerCase().includes(search.toLowerCase()) || m.snippet.toLowerCase().includes(search.toLowerCase()))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, limit);
        messages = filtered;
      }
    } else if (provider === "outlook") {
      try {
        const out = await fetchOutlookMessages(user.id, folder, limit, cursor, search);
        messages = out.messages;
        nextCursor = out.nextCursor;
        await pruneAndSaveCache(user.id, "outlook", messages, retentionDays);
      } catch (error) {
        providerErrors.outlook = String(error || "Outlook fetch failed");
        const cached = await kv.get(EMAIL_CACHE_KEY(user.id, "outlook"));
        const cachedList = Array.isArray(cached) ? (cached as EmailMetadata[]) : [];
        const filtered = cachedList
          .filter((m) => m.folder === folder)
          .filter((m) => !search || m.subject.toLowerCase().includes(search.toLowerCase()) || m.snippet.toLowerCase().includes(search.toLowerCase()))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, limit);
        messages = filtered;
      }
    } else {
      const eachLimit = Math.max(1, Math.floor(limit / 2));
      const [gmail, outlook] = await Promise.allSettled([
        fetchGmailMessages(user.id, folder, eachLimit, undefined, search),
        fetchOutlookMessages(user.id, folder, eachLimit, undefined, search),
      ]);
      if (gmail.status === "fulfilled") {
        messages.push(...gmail.value.messages);
        await pruneAndSaveCache(user.id, "gmail", gmail.value.messages, retentionDays);
      } else {
        providerErrors.gmail = String(gmail.reason || "Gmail fetch failed");
      }
      if (outlook.status === "fulfilled") {
        messages.push(...outlook.value.messages);
        await pruneAndSaveCache(user.id, "outlook", outlook.value.messages, retentionDays);
      } else {
        providerErrors.outlook = String(outlook.reason || "Outlook fetch failed");
      }
      messages = messages.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
    }

    return c.json({
      messages,
      nextCursor,
      provider,
      folder,
      count: messages.length,
      retentionDays,
      providerErrors,
    });
  } catch (error) {
    console.error("[EMAIL] list messages failed:", error);
    return c.json({ error: "Failed to fetch messages", details: String(error) }, 500);
  }
});

app.get("/email/messages/:provider/:messageId", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const provider = c.req.param("provider");
  const messageId = c.req.param("messageId");

  try {
    if (provider === "gmail") {
      const token =
        (await getValidToken("google_mail", user.id)) ||
        (await getValidToken("google_calendar", user.id));
      if (!token) return c.json({ error: "Gmail not connected" }, 400);
      const resp = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) return c.json({ error: await resp.text() }, resp.status as any);
      const json = await resp.json();
      const [plainCandidates, htmlCandidates] = await Promise.all([
        collectGmailBodyCandidates(json?.payload, "text/plain", token, messageId),
        collectGmailBodyCandidates(json?.payload, "text/html", token, messageId),
      ]);
      const resolvedPlain = [...plainCandidates].sort((a, b) => visibleTextScore(b) - visibleTextScore(a))[0] || "";
      const resolvedHtml = [...htmlCandidates].sort((a, b) => visibleTextScore(b) - visibleTextScore(a))[0] || "";
      return c.json({
        provider: "gmail",
        message: json,
        resolved: {
          plain: resolvedPlain,
          html: resolvedHtml,
        },
      });
    }

    if (provider === "outlook") {
      const token =
        (await getValidToken("outlook_mail", user.id)) ||
        (await getValidToken("outlook_calendar", user.id));
      if (!token) return c.json({ error: "Outlook not connected" }, 400);
      const resp = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages/${messageId}?$select=id,conversationId,internetMessageId,subject,from,toRecipients,ccRecipients,body,bodyPreview,sentDateTime,receivedDateTime,webLink`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!resp.ok) return c.json({ error: await resp.text() }, resp.status as any);
      const json = await resp.json();
      return c.json({ provider: "outlook", message: json });
    }

    return c.json({ error: "Invalid provider" }, 400);
  } catch (error) {
    console.error("[EMAIL] message detail failed:", error);
    return c.json({ error: "Failed to fetch message detail", details: String(error) }, 500);
  }
});

app.post("/email/reply", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const body = await c.req.json();
    const provider = String(body?.provider || "").toLowerCase();
    const messageId = String(body?.messageId || "").trim();
    const to = String(body?.to || "").trim();
    const subject = ensureReplySubject(body?.subject);
    const bodyText = String(body?.bodyText || "").trim();
    const threadId = String(body?.threadId || "").trim();
    const inReplyTo = String(body?.inReplyTo || "").trim();
    const references = String(body?.references || "").trim();

    if (!messageId) return c.json({ error: "messageId is required" }, 400);
    if (!to) return c.json({ error: "to is required" }, 400);
    if (!bodyText) return c.json({ error: "bodyText is required" }, 400);

    if (provider === "gmail") {
      const token =
        (await getValidToken("google_mail", user.id)) ||
        (await getValidToken("google_calendar", user.id));
      if (!token) return c.json({ error: "Gmail not connected" }, 400);

      const lines = [
        `To: ${to}`,
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        'Content-Type: text/plain; charset="UTF-8"',
      ];
      if (inReplyTo) lines.push(`In-Reply-To: ${inReplyTo}`);
      if (references || inReplyTo) lines.push(`References: ${references || inReplyTo}`);
      const rawMime = `${lines.join("\r\n")}\r\n\r\n${bodyText}\r\n`;
      const raw = encodeBase64UrlServer(rawMime);
      if (!raw) return c.json({ error: "Failed to encode message" }, 500);

      const sendResp = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          raw,
          threadId: threadId || undefined,
        }),
      });
      if (!sendResp.ok) {
        return c.json({ error: "Gmail send failed", details: await sendResp.text() }, sendResp.status as any);
      }
      const sent = await sendResp.json();
      return c.json({
        success: true,
        provider: "gmail",
        sentMessageId: sent?.id || null,
        threadId: sent?.threadId || threadId || null,
      });
    }

    if (provider === "outlook") {
      const token =
        (await getValidToken("outlook_mail", user.id)) ||
        (await getValidToken("outlook_calendar", user.id));
      if (!token) return c.json({ error: "Outlook not connected" }, 400);

      const replyResp = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${messageId}/reply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment: bodyText }),
      });
      if (!replyResp.ok) {
        return c.json({ error: "Outlook reply failed", details: await replyResp.text() }, replyResp.status as any);
      }
      return c.json({
        success: true,
        provider: "outlook",
        sentMessageId: null,
        threadId: threadId || null,
      });
    }

    return c.json({ error: "Invalid provider" }, 400);
  } catch (error) {
    console.error("[EMAIL] reply failed:", error);
    return c.json({ error: "Failed to send reply", details: String(error) }, 500);
  }
});

app.get("/email/automation/metrics", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const tasks = await getTasks(user.id);
  const emailCompleted = tasks.filter((t) => t.completed && t.tags?.includes("email")).length;
  const logs = await kv.getByPrefix(`email:event:log:${user.id}:`);
  return c.json({
    emailCompletedTasks: emailCompleted,
    sentEventsProcessed: Array.isArray(logs) ? logs.length : 0,
  });
});

/**
 * Internal: Vercel Nexus phone tool executor (secret header). Creates tasks in KV for userId without a browser JWT.
 */
app.post("/phone/nexus-execute", async (c) => {
  const secret = Deno.env.get("NEXUS_PHONE_EDGE_SECRET");
  const hdr = c.req.header("x-nexus-internal-secret");
  if (!secret || hdr !== secret) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const body = await c.req.json().catch(() => ({}));
  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const task = body.task;
  if (!userId || !task || typeof task !== "object") {
    return c.json({ error: "userId and task object required" }, 400);
  }
  const { data: userRow, error: userErr } = await supabase.auth.admin.getUserById(userId);
  if (userErr || !userRow?.user) {
    return c.json({ error: "Invalid user" }, 404);
  }
  const emailLabel = userRow.user.email || "You";
  const tasks = await getTasks(userId);
  const now = new Date().toISOString();
  const normalized = normalizeTask(
    {
      ...task,
      id: `task_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
      createdAt: now,
      updatedAt: now,
      completed: false,
      status: "todo",
      progress: 0,
    },
    emailLabel,
  );
  tasks.push(normalized);
  await saveTasks(userId, tasks);

  const verify = await getTasks(userId);
  if (!verify.some((t) => t.id === normalized.id)) {
    console.error("[PHONE-NEXUS] Write-verify FAILED for", normalized.id, "user", userId);
    return c.json({ error: "Task write could not be verified — please retry" }, 500);
  }

  return c.json(normalized);
});

// ============================================================================
// INVOICE ROUTES — KV-backed invoice persistence
// ============================================================================

const INVOICES_KEY = (userId: string) => `invoices:v1:${userId}`;

type InvoiceRecord = {
  id: string;
  status: "sent" | "viewed" | "paid" | "overdue" | "cancelled";
  to_email: string;
  to_name?: string;
  items: { description: string; quantity: number; unit_price: number }[];
  subtotal: number;
  tax_percent?: number;
  tax_amount: number;
  total: number;
  notes?: string;
  due_date?: string;
  created_at: string;
  paid_at?: string;
  viewed_at?: string;
  stripe_payment_link?: string;
  stripe_session_id?: string;
  resend_email_id?: string;
  _userId?: string;
  reminder_count?: number;
  last_reminder_at?: string;
  to_phone?: string;
  collection_call_consent?: boolean;
  last_collection_call_at?: string;
};

async function getInvoices(userId: string): Promise<InvoiceRecord[]> {
  const existing = await kv.get(INVOICES_KEY(userId));
  if (!Array.isArray(existing)) return [];
  return existing as InvoiceRecord[];
}

async function saveInvoices(userId: string, invoices: InvoiceRecord[]): Promise<void> {
  await kv.set(INVOICES_KEY(userId), invoices);
}

app.get("/invoices", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const invoices = await getInvoices(user.id);
  return c.json(invoices);
});

app.post("/invoices", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json();
  const invoices = await getInvoices(user.id);
  const invoice: InvoiceRecord = {
    id: String(body.id || `INV-${Date.now()}`),
    status: body.status || "sent",
    to_email: String(body.to_email || ""),
    to_name: body.to_name ? String(body.to_name) : undefined,
    items: Array.isArray(body.items) ? body.items : [],
    subtotal: Number(body.subtotal) || 0,
    tax_percent: body.tax_percent ? Number(body.tax_percent) : undefined,
    tax_amount: Number(body.tax_amount) || 0,
    total: Number(body.total) || 0,
    notes: body.notes ? String(body.notes) : undefined,
    due_date: body.due_date ? String(body.due_date) : undefined,
    created_at: body.created_at || new Date().toISOString(),
    paid_at: body.paid_at || undefined,
    viewed_at: body.viewed_at || undefined,
    stripe_payment_link: body.stripe_payment_link || undefined,
    stripe_session_id: body.stripe_session_id || undefined,
    resend_email_id: body.resend_email_id || undefined,
    _userId: user.id,
    to_phone: body.to_phone ? String(body.to_phone) : undefined,
    collection_call_consent: Boolean(body.collection_call_consent),
    reminder_count: typeof body.reminder_count === "number" ? body.reminder_count : undefined,
    last_reminder_at: body.last_reminder_at ? String(body.last_reminder_at) : undefined,
    last_collection_call_at: body.last_collection_call_at ? String(body.last_collection_call_at) : undefined,
  };
  invoices.push(invoice);
  await saveInvoices(user.id, invoices);
  return c.json(invoice);
});

app.put("/invoices/:id", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const id = c.req.param("id");
  const updates = await c.req.json();
  const invoices = await getInvoices(user.id);
  const idx = invoices.findIndex((inv) => inv.id === id);
  if (idx < 0) return c.json({ error: "Invoice not found" }, 404);
  invoices[idx] = { ...invoices[idx], ...updates, id };
  await saveInvoices(user.id, invoices);
  return c.json(invoices[idx]);
});

app.delete("/invoices/:id", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const id = c.req.param("id");
  const invoices = await getInvoices(user.id);
  const next = invoices.filter((inv) => inv.id !== id);
  if (next.length === invoices.length) return c.json({ error: "Invoice not found" }, 404);
  await saveInvoices(user.id, next);
  return c.json({ success: true });
});

const INVOICE_SETTINGS_KEY = (userId: string) => `invoice_settings:${userId}`;

app.get("/invoice-settings", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const settings = await kv.get(INVOICE_SETTINGS_KEY(user.id));
  const opted = await kv.get(`benchmark_opt_in:${user.id}`);
  return c.json({
    ...(settings || { default_from: "resend", business_name: "", business_email: "" }),
    benchmark_opt_in: opted === true,
  });
});

app.put("/invoice-settings", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json();
  if (typeof body.benchmark_opt_in === "boolean") {
    await kv.set(`benchmark_opt_in:${user.id}`, body.benchmark_opt_in);
  }
  const { benchmark_opt_in: _b, ...rest } = body as Record<string, unknown>;
  const current = (await kv.get(INVOICE_SETTINGS_KEY(user.id))) || {};
  const updated = { ...(current as object), ...rest };
  await kv.set(INVOICE_SETTINGS_KEY(user.id), updated);
  const opted = await kv.get(`benchmark_opt_in:${user.id}`);
  return c.json({ ...updated, benchmark_opt_in: opted === true });
});

app.get("/invoice-settings/connected-emails", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const emails: { provider: string; email: string }[] = [];
  for (const provider of ["google_mail", "outlook_mail"]) {
    const token = await kv.get(`oauth:${provider}:${user.id}`);
    if (token && typeof token === "object" && (token as any).access_token) {
      emails.push({ provider, email: (token as any).email || `${provider} connected` });
    }
  }
  return c.json(emails);
});

const RECURRING_INVOICES_KEY = (userId: string) => `recurring_invoices:v1:${userId}`;

app.get("/recurring-invoices", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const raw = await kv.get(RECURRING_INVOICES_KEY(user.id));
  return c.json(Array.isArray(raw) ? raw : []);
});

app.put("/recurring-invoices", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json().catch(() => ({}));
  const schedules = Array.isArray(body.schedules) ? body.schedules : [];
  await kv.set(RECURRING_INVOICES_KEY(user.id), schedules);
  return c.json({ success: true, count: schedules.length });
});

app.get("/benchmarks/summary", async (c) => {
  const raw = await kv.get("benchmark:invoice_stats_v1");
  return c.json(raw || { avg_invoice: 0, sample_size: 0, at: null });
});

/**
 * Internal: future Gmail-driven proposal drafts (extend with Pub/Sub webhook).
 */
app.post("/internal/email-proposal-tick", async (c) => {
  const secret = Deno.env.get("NEXUS_PHONE_EDGE_SECRET");
  const hdr = c.req.header("x-nexus-internal-secret");
  if (!secret || hdr !== secret) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return c.json({
    ok: true,
    scanned: 0,
    note: "Connect Gmail push ingestion to populate proposal drafts from subject/body keywords.",
  });
});

app.post("/internal/bench/aggregate", async (c) => {
  const secret = Deno.env.get("NEXUS_PHONE_EDGE_SECRET");
  const hdr = c.req.header("x-nexus-internal-secret");
  if (!secret || hdr !== secret) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const rows = await kv.getKeyValueByPrefix("invoices:v1:");
  let sum = 0;
  let n = 0;
  for (const row of rows) {
    const userId = row.key.replace("invoices:v1:", "");
    const opted = await kv.get(`benchmark_opt_in:${userId}`);
    if (opted !== true) continue;
    if (!Array.isArray(row.value)) continue;
    for (const inv of row.value as { total?: number }[]) {
      if (typeof inv.total === "number" && inv.total > 0) {
        sum += inv.total;
        n++;
      }
    }
  }
  const agg = {
    avg_invoice: n > 0 ? Math.round((sum / n) * 100) / 100 : 0,
    sample_size: n,
    at: new Date().toISOString(),
  };
  await kv.set("benchmark:invoice_stats_v1", agg);
  return c.json({ ok: true, ...agg });
});

app.post("/internal/firma-webhook", async (c) => {
  const nexus = Deno.env.get("NEXUS_PHONE_EDGE_SECRET");
  const hdrN = c.req.header("x-nexus-internal-secret");
  const whSecret = Deno.env.get("FIRMA_WEBHOOK_SECRET");
  const hdrW = c.req.header("x-firma-webhook-secret");
  const authorized =
    (nexus && hdrN === nexus) ||
    (whSecret && hdrW === whSecret);
  if (!authorized) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const body = await c.req.json().catch(() => ({}));
  const id = `firma_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  await kv.set(`firma_event:${id}`, { ...body, received_at: new Date().toISOString() });
  return c.json({ received: true });
});

// ============================================================================
// CUSTOM AGENT PERSONAS
// ============================================================================

const AGENT_PERSONAS_KEY = (userId: string) => `agent_personas:${userId}`;

app.get("/agent-personas", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const personas = await kv.get(AGENT_PERSONAS_KEY(user.id));
  return c.json(Array.isArray(personas) ? personas : []);
});

app.post("/agent-personas", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json();
  const personas = (await kv.get(AGENT_PERSONAS_KEY(user.id))) || [];
  const list = Array.isArray(personas) ? personas : [];
  const newAgent = {
    id: `custom_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`,
    name: String(body.name || "Custom Agent").slice(0, 50),
    specialty: String(body.specialty || "General").slice(0, 200),
    color: String(body.color || "#8b5cf6"),
    icon: String(body.icon || "🤖").slice(0, 4),
    systemPrompt: String(body.systemPrompt || "").slice(0, 2000),
    isPreset: false,
  };
  list.push(newAgent);
  await kv.set(AGENT_PERSONAS_KEY(user.id), list);
  return c.json(newAgent);
});

app.delete("/agent-personas/:id", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const id = c.req.param("id");
  const personas = (await kv.get(AGENT_PERSONAS_KEY(user.id))) || [];
  const list = Array.isArray(personas) ? personas : [];
  const next = list.filter((a: any) => a.id !== id);
  await kv.set(AGENT_PERSONAS_KEY(user.id), next);
  return c.json({ success: true });
});

/**
 * Internal: upsert invoice from Nexus phone executor (no user JWT).
 * Requires NEXUS_PHONE_EDGE_SECRET header.
 */
app.post("/invoices/phone-upsert", async (c) => {
  const secret = Deno.env.get("NEXUS_PHONE_EDGE_SECRET");
  const hdr = c.req.header("x-nexus-internal-secret");
  if (!secret || hdr !== secret) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const body = await c.req.json().catch(() => ({}));
  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  if (!userId) return c.json({ error: "userId required" }, 400);
  const invoices = await getInvoices(userId);
  const rec = body.invoice as Record<string, unknown>;
  if (!rec || typeof rec !== "object") return c.json({ error: "invoice required" }, 400);
  const id = String(rec.id || "").trim();
  if (!id) return c.json({ error: "invoice.id required" }, 400);
  const idx = invoices.findIndex((inv) => inv.id === id);
  const merged: InvoiceRecord = {
    id,
    status: (rec.status as InvoiceRecord["status"]) || "sent",
    to_email: String(rec.to_email || ""),
    to_name: rec.to_name ? String(rec.to_name) : undefined,
    items: Array.isArray(rec.items) ? rec.items as InvoiceRecord["items"] : [],
    subtotal: Number(rec.subtotal) || 0,
    tax_percent: rec.tax_percent != null ? Number(rec.tax_percent) : undefined,
    tax_amount: Number(rec.tax_amount) || 0,
    total: Number(rec.total) || 0,
    notes: rec.notes ? String(rec.notes) : undefined,
    due_date: rec.due_date ? String(rec.due_date) : undefined,
    created_at: rec.created_at ? String(rec.created_at) : new Date().toISOString(),
    paid_at: rec.paid_at ? String(rec.paid_at) : undefined,
    viewed_at: rec.viewed_at ? String(rec.viewed_at) : undefined,
    stripe_payment_link: rec.stripe_payment_link ? String(rec.stripe_payment_link) : undefined,
    stripe_session_id: rec.stripe_session_id ? String(rec.stripe_session_id) : undefined,
    resend_email_id: rec.resend_email_id ? String(rec.resend_email_id) : undefined,
    _userId: userId,
    to_phone: rec.to_phone ? String(rec.to_phone) : undefined,
    collection_call_consent: Boolean(rec.collection_call_consent),
    reminder_count: typeof rec.reminder_count === "number" ? rec.reminder_count : undefined,
    last_reminder_at: rec.last_reminder_at ? String(rec.last_reminder_at) : undefined,
    last_collection_call_at: rec.last_collection_call_at ? String(rec.last_collection_call_at) : undefined,
  };
  if (idx >= 0) invoices[idx] = { ...invoices[idx], ...merged, id };
  else invoices.push(merged);
  await saveInvoices(userId, invoices);
  return c.json(merged);
});

registerInvoiceBillingCron(app);

/**
 * Internal: update invoice status without user JWT (for webhooks/cron).
 * Requires NEXUS_PHONE_EDGE_SECRET header.
 */
app.post("/invoices/update-status", async (c) => {
  const secret = Deno.env.get("NEXUS_PHONE_EDGE_SECRET");
  const hdr = c.req.header("x-nexus-internal-secret");
  if (!secret || hdr !== secret) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const body = await c.req.json().catch(() => ({}));
  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const invoiceId = typeof body.invoiceId === "string" ? body.invoiceId.trim() : "";
  const status = body.status;
  if (!userId || !invoiceId || !status) {
    return c.json({ error: "userId, invoiceId, and status required" }, 400);
  }
  const invoices = await getInvoices(userId);
  const idx = invoices.findIndex((inv) => inv.id === invoiceId);
  if (idx < 0) return c.json({ error: "Invoice not found" }, 404);
  invoices[idx] = { ...invoices[idx], status, ...(status === "paid" ? { paid_at: new Date().toISOString() } : {}), ...(status === "viewed" && !invoices[idx].viewed_at ? { viewed_at: new Date().toISOString() } : {}) };
  await saveInvoices(userId, invoices);
  return c.json(invoices[idx]);
});

export default app;
