import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";
import { getValidToken } from "./oauth-routes.tsx";

const app = new Hono();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const TASKS_KEY = (userId: string) => `tasks:v1:${userId}`;
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
  const merged = normalizeTask({ ...tasks[idx], ...updates, id, updatedAt: new Date().toISOString() }, user.email || "You");
  tasks[idx] = merged;
  await saveTasks(user.id, tasks);
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
  return c.json(tasks[idx]);
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

    if (provider === "gmail") {
      const out = await fetchGmailMessages(user.id, folder, limit, cursor, search);
      messages = out.messages;
      nextCursor = out.nextCursor;
      await pruneAndSaveCache(user.id, "gmail", messages, retentionDays);
    } else if (provider === "outlook") {
      const out = await fetchOutlookMessages(user.id, folder, limit, cursor, search);
      messages = out.messages;
      nextCursor = out.nextCursor;
      await pruneAndSaveCache(user.id, "outlook", messages, retentionDays);
    } else {
      const eachLimit = Math.max(1, Math.floor(limit / 2));
      const [gmail, outlook] = await Promise.allSettled([
        fetchGmailMessages(user.id, folder, eachLimit, undefined, search),
        fetchOutlookMessages(user.id, folder, eachLimit, undefined, search),
      ]);
      if (gmail.status === "fulfilled") {
        messages.push(...gmail.value.messages);
        await pruneAndSaveCache(user.id, "gmail", gmail.value.messages, retentionDays);
      }
      if (outlook.status === "fulfilled") {
        messages.push(...outlook.value.messages);
        await pruneAndSaveCache(user.id, "outlook", outlook.value.messages, retentionDays);
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
      return c.json({ provider: "gmail", message: json });
    }

    if (provider === "outlook") {
      const token =
        (await getValidToken("outlook_mail", user.id)) ||
        (await getValidToken("outlook_calendar", user.id));
      if (!token) return c.json({ error: "Outlook not connected" }, 400);
      const resp = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages/${messageId}?$select=id,conversationId,subject,from,toRecipients,ccRecipients,body,bodyPreview,sentDateTime,receivedDateTime,webLink`,
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

export default app;
