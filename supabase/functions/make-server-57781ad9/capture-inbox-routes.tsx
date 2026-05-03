import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";
import { hasScope, requireJwtOrPat, type AuthCtx } from "./pat-auth.ts";
import * as kv from "./kv_store.tsx";
import { runCalendarHold } from "./calendar-hold-exec.ts";
import { recordTaskCompleted } from "./activity-record.ts";

const app = new Hono();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const TASKS_KEY = (userId: string) => `tasks:v1:${userId}`;

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

function normalizeTask(raw: Record<string, unknown>, userName: string): TaskRecord {
  const now = new Date().toISOString();
  const due = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  return {
    id: String(raw?.id || `task_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`),
    title: String(raw?.title || "Untitled Task"),
    description: raw?.description ? String(raw.description) : "",
    priority: ["low", "medium", "high", "urgent"].includes(String(raw?.priority))
      ? (raw.priority as TaskRecord["priority"])
      : "medium",
    status: ["todo", "in_progress", "completed"].includes(String(raw?.status))
      ? (raw.status as TaskRecord["status"])
      : (raw?.completed ? "completed" : "todo"),
    completed: Boolean(raw?.completed),
    energyLevel: ["low", "medium", "high"].includes(String(raw?.energyLevel))
      ? (raw.energyLevel as TaskRecord["energyLevel"])
      : "medium",
    estimatedTime: String(raw?.estimatedTime || "15 min"),
    dueDate: raw?.dueDate ? new Date(String(raw.dueDate)).toISOString() : due,
    scheduledTime: raw?.scheduledTime ? new Date(String(raw.scheduledTime)).toISOString() : undefined,
    progress: Number.isFinite(Number(raw?.progress)) ? Number(raw.progress) : (raw?.completed ? 100 : 0),
    tags: Array.isArray(raw?.tags) ? (raw.tags as unknown[]).map((t) => String(t)) : [],
    createdAt: raw?.createdAt ? new Date(String(raw.createdAt)).toISOString() : now,
    updatedAt: raw?.updatedAt ? new Date(String(raw.updatedAt)).toISOString() : now,
    createdBy: String(raw?.createdBy || userName || "You"),
    completedAt: raw?.completedAt ? new Date(String(raw.completedAt)).toISOString() : null,
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

async function requireCapture(
  c: { json: (b: unknown, s?: number) => Response; req: { header: (n: string) => string | undefined } },
  scope: "capture:read" | "capture:write" | "capture:commit",
): Promise<AuthCtx | Response> {
  const auth = await requireJwtOrPat(c, supabase);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  const ctx: AuthCtx = { userId: auth.userId, email: auth.email, patScopes: auth.patScopes };
  if (auth.patScopes && !hasScope(ctx, scope)) return c.json({ error: "Forbidden" }, 403);
  return ctx;
}

/** PAT: capture:commit plus the same scope as the direct write API for that kind. */
async function requireCommitForKind(
  c: { json: (b: unknown, s?: number) => Response; req: { header: (n: string) => string | undefined } },
  kind: string,
): Promise<AuthCtx | Response> {
  const auth = await requireJwtOrPat(c, supabase);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  const ctx: AuthCtx = { userId: auth.userId, email: auth.email, patScopes: auth.patScopes };
  if (auth.patScopes) {
    if (!hasScope(ctx, "capture:commit")) return c.json({ error: "Forbidden" }, 403);
    if (kind === "task_draft" && !hasScope(ctx, "tasks:write")) return c.json({ error: "Forbidden" }, 403);
    if (kind === "calendar_hold_draft" && !hasScope(ctx, "calendar:write")) {
      return c.json({ error: "Forbidden" }, 403);
    }
    if (kind === "generic") return c.json({ error: "Forbidden" }, 403);
  }
  return ctx;
}

function payloadAsRecord(payload: unknown): Record<string, unknown> {
  return typeof payload === "object" && payload !== null && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : {};
}

app.get("/capture/inbox", async (c) => {
  const auth = await requireCapture(c, "capture:read");
  if (auth instanceof Response) return auth;
  const status = String(c.req.query("status") || "pending").trim();
  const allowed = new Set(["pending", "committed", "dismissed", "all"]);
  if (!allowed.has(status)) return c.json({ error: "invalid status" }, 400);

  let q = supabase.from("user_capture_inbox").select(
    "id, kind, title, payload, source, status, commit_result, created_at, updated_at",
  ).eq("user_id", auth.userId).order("created_at", { ascending: false }).limit(100);
  if (status !== "all") q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ items: data || [] });
});

app.post("/capture/inbox", async (c) => {
  const auth = await requireCapture(c, "capture:write");
  if (auth instanceof Response) return auth;
  let body: Record<string, unknown> = {};
  try {
    body = (await c.req.json()) as Record<string, unknown>;
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const kind = String(body.kind || "").trim();
  if (!["task_draft", "calendar_hold_draft", "generic"].includes(kind)) {
    return c.json({ error: "kind must be task_draft, calendar_hold_draft, or generic" }, 400);
  }
  const title = String(body.title || "").trim().slice(0, 500);
  const source = String(body.source || "cursor").trim().slice(0, 120);
  const payload = payloadAsRecord(body.payload);

  const { data, error } = await supabase.from("user_capture_inbox").insert({
    user_id: auth.userId,
    kind,
    title: title || (kind === "task_draft" ? "Suggested task" : kind === "calendar_hold_draft" ? "Suggested hold" : "Note"),
    payload,
    source,
    status: "pending",
  }).select("id, kind, title, payload, source, status, created_at").maybeSingle();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.post("/capture/inbox/:id/commit", async (c) => {
  const id = c.req.param("id");
  if (!id) return c.json({ error: "missing id" }, 400);

  const baseAuth = await requireJwtOrPat(c, supabase);
  if (!baseAuth) return c.json({ error: "Unauthorized" }, 401);

  const { data: row, error: fetchErr } = await supabase
    .from("user_capture_inbox")
    .select("id, user_id, kind, title, payload, status")
    .eq("id", id)
    .eq("user_id", baseAuth.userId)
    .maybeSingle();
  if (fetchErr) return c.json({ error: fetchErr.message }, 500);
  if (!row) return c.json({ error: "Not found" }, 404);

  const auth = await requireCommitForKind(c, String(row.kind));
  if (auth instanceof Response) return auth;

  if (row.status !== "pending") {
    return c.json({ ok: true, already: true, status: row.status });
  }

  const kind = String(row.kind);
  const payload = payloadAsRecord(row.payload);
  const nowIso = new Date().toISOString();

  if (kind === "generic") {
    return c.json({ error: "Nothing to commit for generic items" }, 400);
  }

  if (kind === "task_draft") {
    const taskBody = payloadAsRecord(payload.task ?? payload);
    const tasks = await getTasks(auth.userId);
    const task = normalizeTask(
      {
        ...taskBody,
        title: String(taskBody.title || row.title || "Untitled Task"),
        id: `task_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
        createdAt: nowIso,
        updatedAt: nowIso,
        completed: false,
        status: "todo",
        progress: 0,
      },
      auth.email || "You",
    );
    tasks.push(task);
    await saveTasks(auth.userId, tasks);
    const verify = await getTasks(auth.userId);
    if (!verify.some((t) => t.id === task.id)) {
      return c.json({ error: "Task write could not be verified — please retry" }, 500);
    }
    if (task.completed) {
      void recordTaskCompleted(supabase, auth.userId, { id: task.id, title: task.title });
    }
    const commitResult = { kind, task_id: task.id };
    const { error: upErr } = await supabase.from("user_capture_inbox").update({
      status: "committed",
      commit_result: commitResult,
      updated_at: nowIso,
    }).eq("id", id).eq("user_id", auth.userId);
    if (upErr) return c.json({ error: upErr.message }, 500);
    return c.json({ ok: true, task });
  }

  if (kind === "calendar_hold_draft") {
    const holdBody = { ...payload, title: String(payload.title || row.title || "").trim() || undefined };
    const out = await runCalendarHold(auth.userId, holdBody);
    if (out.status < 200 || out.status >= 300) {
      return c.json({ error: (out.json.error as string) || "calendar hold failed", details: out.json }, out.status);
    }
    const { error: upErr } = await supabase.from("user_capture_inbox").update({
      status: "committed",
      commit_result: out.json,
      updated_at: nowIso,
    }).eq("id", id).eq("user_id", auth.userId);
    if (upErr) return c.json({ error: upErr.message }, 500);
    return c.json({ ok: true, calendar: out.json });
  }

  return c.json({ error: "unsupported kind" }, 400);
});

app.post("/capture/inbox/:id/dismiss", async (c) => {
  const auth = await requireCapture(c, "capture:write");
  if (auth instanceof Response) return auth;
  const id = c.req.param("id");
  if (!id) return c.json({ error: "missing id" }, 400);

  const { data: row, error: fetchErr } = await supabase
    .from("user_capture_inbox")
    .select("id, user_id, status")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr) return c.json({ error: fetchErr.message }, 500);
  if (!row || row.user_id !== auth.userId) return c.json({ error: "Not found" }, 404);
  if (row.status !== "pending") {
    return c.json({ ok: true, already: true, status: row.status });
  }

  const nowIso = new Date().toISOString();
  const { error } = await supabase.from("user_capture_inbox").update({
    status: "dismissed",
    updated_at: nowIso,
  }).eq("id", id).eq("user_id", auth.userId);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ ok: true });
});

export default app;
