import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";

const app = new Hono();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

type AuthCtx = {
  userId: string;
  email?: string | null;
  /** Present when authenticated via PAT */
  patScopes?: string[] | null;
};

function hasScope(ctx: AuthCtx, need: string): boolean {
  if (!ctx.patScopes || ctx.patScopes.length === 0) return true;
  return ctx.patScopes.includes(need);
}

async function requireJwtOrPat(c: { req: { header: (n: string) => string | undefined } }): Promise<AuthCtx | null> {
  const accessToken = c.req.header("Authorization")?.split(" ")?.[1];
  if (!accessToken) return null;
  if (accessToken.startsWith("eyJ")) {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user?.id) return null;
    return { userId: user.id, email: user.email };
  }
  if (accessToken.startsWith("sspat_")) {
    const hash = await sha256Hex(accessToken);
    const { data, error } = await supabase
      .from("user_api_tokens")
      .select("user_id, scopes, id")
      .eq("token_hash", hash)
      .maybeSingle();
    if (error || !data?.user_id) return null;
    await supabase.from("user_api_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
    return { userId: String(data.user_id), patScopes: Array.isArray(data.scopes) ? data.scopes as string[] : [] };
  }
  return null;
}

/** JWT only — PAT cannot mint PATs */
async function requireJwtOnly(c: { req: { header: (n: string) => string | undefined } }): Promise<AuthCtx | null> {
  const accessToken = c.req.header("Authorization")?.split(" ")?.[1];
  if (!accessToken || !accessToken.startsWith("eyJ")) return null;
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user?.id) return null;
  return { userId: user.id, email: user.email };
}

const DEFAULT_PLAN_SECTIONS: Record<string, string> = {
  problem: "",
  solution: "",
  market: "",
  traction: "",
  team: "",
  financials: "",
  asks: "",
};

/** Sliding-window rate limit for POST /activity/events (per user id). */
const ACTIVITY_POST_TIMESTAMPS = new Map<string, number[]>();
const ACTIVITY_POST_MAX_PER_MINUTE = 60;

function allowActivityPost(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const prev = ACTIVITY_POST_TIMESTAMPS.get(userId) || [];
  const pruned = prev.filter((t) => now - t < windowMs);
  if (pruned.length >= ACTIVITY_POST_MAX_PER_MINUTE) {
    ACTIVITY_POST_TIMESTAMPS.set(userId, pruned);
    return false;
  }
  pruned.push(now);
  ACTIVITY_POST_TIMESTAMPS.set(userId, pruned);
  if (ACTIVITY_POST_TIMESTAMPS.size > 50_000) {
    for (const [k, v] of ACTIVITY_POST_TIMESTAMPS) {
      const kept = v.filter((t) => now - t < windowMs);
      if (kept.length === 0) ACTIVITY_POST_TIMESTAMPS.delete(k);
      else ACTIVITY_POST_TIMESTAMPS.set(k, kept);
    }
  }
  return true;
}

app.get("/activity/summary", async (c) => {
  const auth = await requireJwtOrPat(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  if (auth.patScopes && !hasScope(auth, "tasks:read") && !hasScope(auth, "activity:read")) {
    return c.json({ error: "Forbidden" }, 403);
  }
  const days = Math.min(400, Math.max(1, Number(c.req.query("days")) || 371));
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  const { data, error } = await supabase
    .from("user_activity_events")
    .select("occurred_at, intensity")
    .eq("user_id", auth.userId)
    .gte("occurred_at", since.toISOString());
  if (error) return c.json({ error: error.message }, 500);
  const byDay = new Map<string, number>();
  for (const row of data || []) {
    const d = String(row.occurred_at || "").slice(0, 10);
    if (!d) continue;
    byDay.set(d, (byDay.get(d) || 0) + Math.max(0, Math.min(20, Number(row.intensity) || 1)));
  }
  return c.json({ days, cells: Array.from(byDay.entries()).map(([date, count]) => ({ date, count })) });
});

app.post("/activity/events", async (c) => {
  const auth = await requireJwtOrPat(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  if (!allowActivityPost(auth.userId)) {
    return c.json({ error: "Too many activity events; retry in a minute." }, 429);
  }
  if (auth.patScopes && !hasScope(auth, "activity:write")) {
    return c.json({ error: "Forbidden" }, 403);
  }
  let body: Record<string, unknown> = {};
  try {
    body = (await c.req.json()) as Record<string, unknown>;
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const eventType = String(body.eventType || body.event_type || "").trim();
  const allowed = new Set(["focus_block", "external_ide_session", "generic", "goal_progress", "calendar_event_done"]);
  if (!allowed.has(eventType)) {
    return c.json({ error: "Invalid event_type" }, 400);
  }
  const intensity = Math.min(100, Math.max(0, Number(body.intensity) || 1));
  const metadata = typeof body.metadata === "object" && body.metadata !== null
    ? body.metadata as Record<string, unknown>
    : {};
  const visibilityRaw = String(body.visibility || "private").trim();
  const visibility = ["private", "friends", "public_summary"].includes(visibilityRaw) ? visibilityRaw : "private";
  const occurredAt = typeof body.occurred_at === "string" ? body.occurred_at : new Date().toISOString();
  const { data, error } = await supabase.from("user_activity_events").insert({
    user_id: auth.userId,
    event_type: eventType,
    intensity,
    metadata,
    occurred_at: occurredAt,
    visibility,
  }).select("id").maybeSingle();
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ id: data?.id });
});

app.get("/business-plan", async (c) => {
  const auth = await requireJwtOrPat(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  if (auth.patScopes && !hasScope(auth, "business_plan:read")) {
    return c.json({ error: "Forbidden" }, 403);
  }
  const { data, error } = await supabase
    .from("user_business_plans")
    .select("sections, updated_at")
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (error) return c.json({ error: error.message }, 500);
  const sections = { ...DEFAULT_PLAN_SECTIONS, ...(data?.sections as Record<string, string> || {}) };
  return c.json({ sections, updatedAt: data?.updated_at || null });
});

app.put("/business-plan", async (c) => {
  const auth = await requireJwtOrPat(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  if (auth.patScopes && !hasScope(auth, "business_plan:write")) {
    return c.json({ error: "Forbidden" }, 403);
  }
  let body: Record<string, unknown> = {};
  try {
    body = (await c.req.json()) as Record<string, unknown>;
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const raw = body.sections;
  if (!raw || typeof raw !== "object") return c.json({ error: "sections object required" }, 400);
  const merged = { ...DEFAULT_PLAN_SECTIONS };
  for (const k of Object.keys(DEFAULT_PLAN_SECTIONS)) {
    if (k in (raw as Record<string, unknown>)) {
      merged[k] = String((raw as Record<string, unknown>)[k] ?? "").slice(0, 20000);
    }
  }
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("user_business_plans")
    .upsert({ user_id: auth.userId, sections: merged, updated_at: now }, { onConflict: "user_id" })
    .select("sections, updated_at")
    .maybeSingle();
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ sections: data?.sections || merged, updatedAt: data?.updated_at });
});

app.get("/business-plan/export.md", async (c) => {
  const auth = await requireJwtOrPat(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  if (auth.patScopes && !hasScope(auth, "business_plan:read")) {
    return c.json({ error: "Forbidden" }, 403);
  }
  const { data, error } = await supabase
    .from("user_business_plans")
    .select("sections, updated_at")
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (error) return c.json({ error: error.message }, 500);
  const sections = { ...DEFAULT_PLAN_SECTIONS, ...(data?.sections as Record<string, string> || {}) };
  const labels: Record<string, string> = {
    problem: "Problem",
    solution: "Solution",
    market: "Market",
    traction: "Traction",
    team: "Team",
    financials: "Financials",
    asks: "Asks",
  };
  let md = `# SyncScript business plan\n\n_Exported ${new Date().toISOString()}_\n\n`;
  if (data?.updated_at) md += `_Last saved in app: ${data.updated_at}_\n\n`;
  for (const key of Object.keys(DEFAULT_PLAN_SECTIONS)) {
    md += `## ${labels[key] || key}\n\n${sections[key]?.trim() || "_TBD_"}\n\n`;
  }
  return c.text(md, 200, { "Content-Type": "text/markdown; charset=utf-8" });
});

app.get("/social/prefs", async (c) => {
  const auth = await requireJwtOrPat(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  const { data, error } = await supabase
    .from("user_social_prefs")
    .select("heatmap_visibility, friend_feed_opt_in, updated_at")
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (error) return c.json({ error: error.message }, 500);
  return c.json({
    heatmapVisibility: data?.heatmap_visibility || "private",
    friendFeedOptIn: Boolean(data?.friend_feed_opt_in),
    updatedAt: data?.updated_at || null,
  });
});

app.put("/social/prefs", async (c) => {
  const auth = await requireJwtOnly(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  let body: Record<string, unknown> = {};
  try {
    body = (await c.req.json()) as Record<string, unknown>;
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const { data: existing } = await supabase
    .from("user_social_prefs")
    .select("heatmap_visibility, friend_feed_opt_in")
    .eq("user_id", auth.userId)
    .maybeSingle();
  const heatmapRaw = String(body.heatmapVisibility || body.heatmap_visibility || "").trim();
  const heatmap_visibility = ["private", "friends", "public_summary"].includes(heatmapRaw)
    ? heatmapRaw
    : String(existing?.heatmap_visibility || "private");
  const friendRaw = body.friendFeedOptIn ?? body.friend_feed_opt_in;
  const friend_feed_opt_in = typeof friendRaw === "boolean"
    ? friendRaw
    : Boolean(existing?.friend_feed_opt_in);
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("user_social_prefs")
    .upsert(
      { user_id: auth.userId, heatmap_visibility, friend_feed_opt_in, updated_at: now },
      { onConflict: "user_id" },
    )
    .select("heatmap_visibility, friend_feed_opt_in, updated_at")
    .maybeSingle();
  if (error) return c.json({ error: error.message }, 500);
  return c.json({
    heatmapVisibility: data?.heatmap_visibility,
    friendFeedOptIn: Boolean(data?.friend_feed_opt_in),
    updatedAt: data?.updated_at,
  });
});

app.get("/friends/activity-feed", async (c) => {
  const auth = await requireJwtOnly(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  const limit = Math.min(100, Math.max(1, Number(c.req.query("limit")) || 40));
  const jwt = c.req.header("Authorization")?.split(" ")?.[1];
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
  if (!jwt || !anon) return c.json({ events: [] });
  try {
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      anon,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } },
    );
    const { data, error } = await userClient.rpc("social_friend_activity_feed", { p_limit: limit });
    if (error) {
      console.warn("[friends-feed]", error.message);
      return c.json({ events: [] });
    }
    return c.json({ events: data || [] });
  } catch (e) {
    console.warn("[friends-feed]", String(e));
    return c.json({ events: [] });
  }
});

app.get("/api-tokens", async (c) => {
  const auth = await requireJwtOnly(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  const { data, error } = await supabase
    .from("user_api_tokens")
    .select("id, scopes, label, created_at, last_used_at")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false });
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ tokens: data || [] });
});

app.post("/api-tokens", async (c) => {
  const auth = await requireJwtOnly(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  let body: Record<string, unknown> = {};
  try {
    body = (await c.req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  const label = String(body.label || "Cursor / MCP").trim().slice(0, 80);
  const rawScopes = body.scopes;
  const defaultScopes = [
    "tasks:read",
    "tasks:write",
    "activity:read",
    "activity:write",
    "business_plan:read",
    "business_plan:write",
  ];
  const scopes = Array.isArray(rawScopes) && rawScopes.length
    ? rawScopes.map((s) => String(s)).filter(Boolean).slice(0, 12)
    : defaultScopes;
  const plain = `sspat_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const token_hash = await sha256Hex(plain);
  const { data, error } = await supabase
    .from("user_api_tokens")
    .insert({ user_id: auth.userId, token_hash, scopes, label })
    .select("id, scopes, label, created_at")
    .maybeSingle();
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ token: plain, id: data?.id, scopes: data?.scopes, label: data?.label, createdAt: data?.created_at });
});

app.delete("/api-tokens/:id", async (c) => {
  const auth = await requireJwtOnly(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  const id = c.req.param("id");
  const { error } = await supabase.from("user_api_tokens").delete().eq("id", id).eq("user_id", auth.userId);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ ok: true });
});

export default app;
