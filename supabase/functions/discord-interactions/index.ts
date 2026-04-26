import { Hono } from "https://deno.land/x/hono@v3.12.0/mod.ts";

const app = new Hono();

const PROJECT_REF = "kwhnrlzibgfedtxpkbgb";
const TARGET_URL = `https://${PROJECT_REF}.supabase.co/functions/v1/make-server-57781ad9/discord/interactions`;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const AUTH_KEY = SERVICE_ROLE_KEY || ANON_KEY;

const healthHandler = (c: any) => c.json({ ok: true, route: "discord-interactions-proxy" });
app.get("/", healthHandler);
app.get("/discord-interactions", healthHandler);
app.get("/discord-interactions/", healthHandler);

const interactionHandler = async (c: any) => {
  try {
    if (!AUTH_KEY) {
      return c.json({ error: "SUPABASE auth key not configured" }, 500);
    }

    const body = await c.req.raw.text();
    const signature = c.req.header("x-signature-ed25519") || "";
    const timestamp = c.req.header("x-signature-timestamp") || "";
    const discordPublicKey = c.req.header("x-discord-public-key") || "";

    const response = await fetch(TARGET_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "apikey": AUTH_KEY,
        "authorization": `Bearer ${AUTH_KEY}`,
        ...(signature ? { "x-signature-ed25519": signature } : {}),
        ...(timestamp ? { "x-signature-timestamp": timestamp } : {}),
        ...(discordPublicKey ? { "x-discord-public-key": discordPublicKey } : {}),
      },
      body,
    });

    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: { "content-type": "application/json" },
    });
  } catch (error: any) {
    return c.json({ error: error?.message || "Proxy failure" }, 500);
  }
};

app.post("/", interactionHandler);
app.post("/discord-interactions", interactionHandler);
app.post("/discord-interactions/", interactionHandler);

Deno.serve(app.fetch);
