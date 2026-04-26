/**
 * APNs device token registration — pairs with Capacitor Push in `src/native/bootstrap-capacitor.ts`.
 * Store tokens in KV for later broadcast (campaigns, mission alerts, library search done).
 */
import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

type AuthUser = { id: string };

async function requireUser(c: { req: { header: (n: string) => string | undefined } }): Promise<AuthUser | null> {
  const accessToken = c.req.header("Authorization")?.split(" ")[1];
  if (!accessToken) return null;
  const { data: { user } } = await supabase.auth.getUser(accessToken);
  if (!user) return null;
  return { id: user.id };
}

const TOKEN_KEY = (userId: string) => `push_device:${userId}`;

app.post("/register", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json().catch(() => ({}));
  const token = String(body.token || "").trim();
  const platform = String(body.platform || "ios").trim().slice(0, 32);
  if (!token || token.length < 10) {
    return c.json({ error: "invalid_token" }, 400);
  }

  const payload = {
    token,
    platform,
    updated_at: new Date().toISOString(),
  };
  await kv.set(TOKEN_KEY(user.id), payload);

  return c.json({ ok: true });
});

app.get("/status", async (c) => {
  const user = await requireUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const row = await kv.get(TOKEN_KEY(user.id)) as { token?: string; updated_at?: string } | null;
  return c.json({
    ok: true,
    registered: Boolean(row?.token),
    updated_at: row?.updated_at ?? null,
  });
});

export default app;
