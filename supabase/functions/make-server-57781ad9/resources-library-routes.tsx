/**
 * User file library: Supabase Storage + Postgres metadata + polymorphic links.
 * Routes mounted at /make-server-57781ad9 (see index.tsx).
 *
 * Phase D (semantic file search): when ready, enable server-side text extraction into
 * `user_files.extracted_text`, optional pgvector on a `file_chunks` table, and
 * hybrid ranking — keep blobs here; do not duplicate storage keys.
 */
import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const BUCKET = "user-library";
const MAX_FILE_BYTES = 50 * 1024 * 1024;

type AuthUser = { id: string };

async function requireUser(c: { req: { header: (n: string) => string | undefined } }): Promise<AuthUser | null> {
  const accessToken = c.req.header("Authorization")?.split(" ")[1];
  if (!accessToken) return null;
  const { data: { user } } = await supabase.auth.getUser(accessToken);
  if (!user) return null;
  return { id: user.id };
}

async function getUserSubscription(userId: string): Promise<Record<string, unknown> | null> {
  const data = await kv.get(`subscription:${userId}`);
  return (data as Record<string, unknown>) || null;
}

function storageLimitMb(subscription: Record<string, unknown> | null): number {
  if (!subscription) return 100;
  const plan = String(subscription.plan || "");
  if (plan.includes("professional")) return 1000;
  if (plan.includes("enterprise")) return 10000;
  return 100;
}

async function getUsageStorageMb(userId: string): Promise<number> {
  const key = `usage:${userId}:${new Date().toISOString().slice(0, 7)}`;
  const u = await kv.get(key) as { storage_mb?: number } | null;
  return typeof u?.storage_mb === "number" ? u.storage_mb : 0;
}

async function addUsageStorageMb(userId: string, deltaMb: number): Promise<void> {
  const key = `usage:${userId}:${new Date().toISOString().slice(0, 7)}`;
  const u = (await kv.get(key)) as { tasks_created?: number; api_calls?: number; storage_mb?: number } | null;
  const next = {
    tasks_created: u?.tasks_created ?? 0,
    api_calls: u?.api_calls ?? 0,
    storage_mb: (u?.storage_mb ?? 0) + deltaMb,
  };
  await kv.set(key, next);
}

async function subtractUsageStorageMb(userId: string, deltaMb: number): Promise<void> {
  const key = `usage:${userId}:${new Date().toISOString().slice(0, 7)}`;
  const u = (await kv.get(key)) as { tasks_created?: number; api_calls?: number; storage_mb?: number } | null;
  const next = {
    tasks_created: u?.tasks_created ?? 0,
    api_calls: u?.api_calls ?? 0,
    storage_mb: Math.max(0, (u?.storage_mb ?? 0) - deltaMb),
  };
  await kv.set(key, next);
}

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 200) || "file";
}

/** Remove ILIKE wildcards from user input so queries stay literal (no accidental full-table match). */
function sanitizeForIlikeLiteral(q: string): string {
  return q.replace(/\\/g, "").replace(/%/g, "").replace(/_/g, "").trim();
}

async function sendResendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return { ok: false, error: "RESEND_API_KEY not configured" };
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "SyncScript <noreply@syncscript.app>",
      to: [to],
      subject,
      html,
    }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    return { ok: false, error: t.slice(0, 400) };
  }
  const data = await resp.json().catch(() => ({}));
  return { ok: true, id: data?.id };
}

async function ensureBucket(): Promise<boolean> {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((b) => b.name === BUCKET)) return true;
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: MAX_FILE_BYTES,
  });
  if (error) {
    console.error("[resources] createBucket:", error);
    return false;
  }
  return true;
}

const ENTITY_TYPES = new Set(["task", "calendar_event", "milestone", "step", "invoice", "goal", "library"]);

app.post("/resources/upload", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  if (!(await ensureBucket())) {
    return c.json({ error: "storage_unavailable" }, 503);
  }

  const subscription = await getUserSubscription(user.id);
  const limitMb = storageLimitMb(subscription);
  const usedMb = await getUsageStorageMb(user.id);
  if (usedMb >= limitMb) {
    return c.json({ error: "storage_quota_exceeded", limit_mb: limitMb }, 413);
  }

  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return c.json({ error: "invalid_form" }, 400);
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return c.json({ error: "file_required" }, 400);
  }

  if (file.size > MAX_FILE_BYTES) {
    return c.json({ error: "file_too_large", max_bytes: MAX_FILE_BYTES }, 413);
  }

  const projectedMb = Math.ceil(file.size / (1024 * 1024)) || 1;
  if (usedMb + projectedMb > limitMb) {
    return c.json({ error: "storage_quota_exceeded", limit_mb: limitMb }, 413);
  }

  const buf = await file.arrayBuffer();
  const sha = await sha256Hex(buf);

  const contextType = String(formData.get("contextType") || "").trim();
  const contextId = String(formData.get("contextId") || "").trim();

  const fileId = crypto.randomUUID();
  const safeName = sanitizeFilename(file.name);
  const storagePath = `${user.id}/${fileId}/${safeName}`;

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(storagePath, buf, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (upErr) {
    console.error("[resources] upload:", upErr);
    return c.json({ error: "upload_failed", detail: upErr.message }, 500);
  }

  const { data: row, error: insErr } = await supabase
    .from("user_files")
    .insert({
      id: fileId,
      owner_user_id: user.id,
      storage_bucket: BUCKET,
      storage_path: storagePath,
      provider: "supabase",
      sha256: sha,
      size_bytes: file.size,
      mime_type: file.type || null,
      original_filename: file.name,
    })
    .select("id")
    .single();

  if (insErr || !row) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    console.error("[resources] insert user_files:", insErr);
    return c.json({ error: "metadata_failed" }, 500);
  }

  let linkId: string | null = null;
  if (contextType && contextId && ENTITY_TYPES.has(contextType)) {
    const { data: linkRow, error: linkErr } = await supabase
      .from("file_entity_links")
      .insert({
        file_id: fileId,
        owner_user_id: user.id,
        entity_type: contextType,
        entity_id: contextId,
      })
      .select("id")
      .single();
    if (!linkErr && linkRow) linkId = linkRow.id as string;
  }

  await addUsageStorageMb(user.id, projectedMb);

  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 3600);

  return c.json({
    ok: true,
    provider: "supabase" as const,
    objectKey: storagePath,
    url: signed?.signedUrl || "",
    contentType: file.type || "application/octet-stream",
    size: file.size,
    file_id: fileId,
    sha256: sha,
    link_id: linkId,
  });
});

app.get("/resources/files", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const url = new URL(c.req.url);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "30", 10)));
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10));

  const { data, error, count } = await supabase
    .from("user_files")
    .select("id, storage_path, size_bytes, mime_type, original_filename, created_at, sha256", { count: "exact" })
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[resources] list:", error);
    return c.json({ error: "list_failed" }, 500);
  }

  return c.json({
    ok: true,
    files: data ?? [],
    total: count ?? 0,
    limit,
    offset,
  });
});

/**
 * Unified library search: filename + optional extracted_text (same endpoint for web, iOS, Watch clients).
 * Query params: q (required), limit (default 20, max 50)
 */
app.get("/resources/search", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const url = new URL(c.req.url);
  const rawQ = String(url.searchParams.get("q") || "").trim();
  if (!rawQ || rawQ.length > 200) {
    return c.json({ error: "invalid_query", hint: "q must be 1–200 chars" }, 400);
  }
  const safeQ = sanitizeForIlikeLiteral(rawQ);
  if (!safeQ) {
    return c.json({ error: "invalid_query", hint: "q contained no searchable characters" }, 400);
  }
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
  const pattern = `%${safeQ}%`;

  const cols = "id, storage_path, size_bytes, mime_type, original_filename, created_at, sha256";

  const [byName, byText] = await Promise.all([
    supabase
      .from("user_files")
      .select(cols)
      .eq("owner_user_id", user.id)
      .ilike("original_filename", pattern)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("user_files")
      .select(cols)
      .eq("owner_user_id", user.id)
      .ilike("extracted_text", pattern)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  if (byName.error) {
    console.error("[resources] search filename:", byName.error);
    return c.json({ error: "search_failed" }, 500);
  }
  if (byText.error) {
    console.error("[resources] search text:", byText.error);
    return c.json({ error: "search_failed" }, 500);
  }

  const merged = new Map<string, Record<string, unknown>>();
  for (const row of [...(byName.data ?? []), ...(byText.data ?? [])]) {
    const id = row.id as string;
    if (!merged.has(id)) merged.set(id, row as Record<string, unknown>);
  }
  const files = Array.from(merged.values()).sort((a, b) => {
    const ta = new Date(String(a.created_at || 0)).getTime();
    const tb = new Date(String(b.created_at || 0)).getTime();
    return tb - ta;
  }).slice(0, limit);

  return c.json({
    ok: true,
    query: safeQ,
    files,
    count: files.length,
  });
});

/**
 * Email a signed download link for a library file to the authenticated user's account email.
 */
app.post("/resources/file/:id/email-self", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const accessToken = c.req.header("Authorization")?.split(" ")[1];
  if (!accessToken) return c.json({ error: "Unauthorized" }, 401);

  const { data: authData } = await supabase.auth.getUser(accessToken);
  const to = authData?.user?.email;
  if (!to) return c.json({ error: "no_email_on_account" }, 400);

  const id = c.req.param("id");
  if (!id) return c.json({ error: "missing_id" }, 400);

  const { data: fileRow, error } = await supabase
    .from("user_files")
    .select("id, original_filename, storage_path, owner_user_id")
    .eq("id", id)
    .maybeSingle();

  if (error || !fileRow || fileRow.owner_user_id !== user.id) {
    return c.json({ error: "not_found" }, 404);
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(fileRow.storage_path as string, 3600);
  if (signErr || !signed?.signedUrl) {
    return c.json({ error: "sign_failed" }, 500);
  }

  const name = String(fileRow.original_filename || "file");
  const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:24px;">
  <p style="color:#334155;font-size:15px;">Your SyncScript library file is ready to download (link expires in 1 hour):</p>
  <p style="font-size:16px;font-weight:600;color:#0f172a;">${name.replace(/</g, "&lt;")}</p>
  <p><a href="${signed.signedUrl}" style="color:#6366f1;">Download</a></p>
  <p style="color:#94a3b8;font-size:12px;">Sent from SyncScript library.</p>
</div>`;

  const sent = await sendResendEmail(to, `SyncScript library: ${name}`, html);
  if (!sent.ok) {
    return c.json({ error: "email_failed", detail: sent.error }, 502);
  }
  return c.json({ ok: true, email_id: sent.id, to });
});

/**
 * Pin a file to the user's library collection (entity_type `library`).
 */
app.post("/resources/file/:id/pin-to-library", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const id = c.req.param("id");
  if (!id) return c.json({ error: "missing_id" }, 400);

  const body = await c.req.json().catch(() => ({}));
  const entityId = String(body.entity_id || "default").trim().slice(0, 200) || "default";

  const { data: fileRow } = await supabase
    .from("user_files")
    .select("id")
    .eq("id", id)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!fileRow) return c.json({ error: "not_found" }, 404);

  const { data: link, error } = await supabase
    .from("file_entity_links")
    .insert({
      file_id: id,
      owner_user_id: user.id,
      entity_type: "library",
      entity_id: entityId,
    })
    .select("id")
    .single();

  if (error) {
    if (String(error.message || "").includes("duplicate") || error.code === "23505") {
      return c.json({ ok: true, duplicate: true, entity_id: entityId });
    }
    return c.json({ error: "link_failed", detail: error.message }, 500);
  }
  return c.json({ ok: true, link_id: link?.id, entity_id: entityId });
});

app.get("/resources/file/:id/signed-url", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const id = c.req.param("id");
  if (!id) return c.json({ error: "missing_id" }, 400);

  const { data: fileRow, error } = await supabase
    .from("user_files")
    .select("storage_path, owner_user_id")
    .eq("id", id)
    .maybeSingle();

  if (error || !fileRow || fileRow.owner_user_id !== user.id) {
    return c.json({ error: "not_found" }, 404);
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(fileRow.storage_path as string, 3600);
  if (signErr || !signed) {
    return c.json({ error: "sign_failed" }, 500);
  }
  return c.json({ ok: true, url: signed.signedUrl, expires_in: 3600 });
});

app.post("/resources/link", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json().catch(() => ({}));
  const fileId = String(body.file_id || "").trim();
  const entityType = String(body.entity_type || "").trim();
  const entityId = String(body.entity_id || "").trim();
  const role = body.role != null ? String(body.role) : null;

  if (!fileId || !entityType || !entityId || !ENTITY_TYPES.has(entityType)) {
    return c.json({ error: "invalid_body" }, 400);
  }

  const { data: fileRow } = await supabase
    .from("user_files")
    .select("id")
    .eq("id", fileId)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!fileRow) return c.json({ error: "file_not_found" }, 404);

  const { data: link, error } = await supabase
    .from("file_entity_links")
    .insert({
      file_id: fileId,
      owner_user_id: user.id,
      entity_type: entityType,
      entity_id: entityId,
      ...(role ? { role } : {}),
    })
    .select("id")
    .single();

  if (error) {
    if (String(error.message || "").includes("duplicate") || error.code === "23505") {
      return c.json({ ok: true, duplicate: true });
    }
    return c.json({ error: "link_failed", detail: error.message }, 500);
  }
  return c.json({ ok: true, link_id: link?.id });
});

app.delete("/resources/file/:id", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const id = c.req.param("id");
  if (!id) return c.json({ error: "missing_id" }, 400);

  const { data: fileRow, error } = await supabase
    .from("user_files")
    .select("id, storage_path, size_bytes")
    .eq("id", id)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (error || !fileRow) return c.json({ error: "not_found" }, 404);

  await supabase.storage.from(BUCKET).remove([fileRow.storage_path as string]);
  const { error: delErr } = await supabase.from("user_files").delete().eq("id", id);
  if (delErr) {
    return c.json({ error: "delete_failed" }, 500);
  }

  const mb = Math.ceil(Number(fileRow.size_bytes || 0) / (1024 * 1024)) || 1;
  await subtractUsageStorageMb(user.id, mb);

  return c.json({ ok: true });
});

export default app;
