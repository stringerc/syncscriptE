/**
 * Engram Bridge — Supabase Edge proxy to Engram (agent registry / discovery / orchestration).
 *
 * SyncScript web app → this Edge route → ENGRAM_BASE_URL (deployed Engram or tunnel).
 * Mirrors the OpenClaw bridge pattern (policy at the edge, no direct browser→Engram in prod).
 *
 * Configure (Supabase project secrets / env):
 *   ENGRAM_BASE_URL       — e.g. https://engram.example.com  (no trailing slash)
 *   ENGRAM_UPSTREAM_TOKEN — Bearer token Engram accepts for upstream calls (translate/delegate require scopes on that token)
 */

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import type { Context } from "npm:hono";
import { authenticateUser } from "./openclaw-security.tsx";

const engramBridge = new Hono();

const ENGRAM_BASE_URL = (Deno.env.get("ENGRAM_BASE_URL") || "").replace(/\/$/, "");
const ENGRAM_UPSTREAM_TOKEN = Deno.env.get("ENGRAM_UPSTREAM_TOKEN") || "";

/** Max JSON body size for POST proxies (translate / delegate). */
const MAX_BODY_BYTES = 256 * 1024;

const TIMEOUT_MS = {
  health: 8000,
  discover: 15000,
  post: 30000,
} as const;

function getRequestId(c: Context): string {
  const fromClient =
    c.req.header("X-Request-ID") ||
    c.req.header("x-request-id") ||
    c.req.header("X-Correlation-ID") ||
    "";
  const trimmed = fromClient.trim();
  if (trimmed.length > 0 && trimmed.length <= 128) {
    return trimmed;
  }
  return crypto.randomUUID();
}

function baseUpstreamHeaders(requestId: string): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/json",
    "X-Request-ID": requestId,
  };
  if (ENGRAM_UPSTREAM_TOKEN) {
    h["Authorization"] = `Bearer ${ENGRAM_UPSTREAM_TOKEN}`;
  }
  return h;
}

function jsonPostUpstreamHeaders(requestId: string): Record<string, string> {
  return {
    ...baseUpstreamHeaders(requestId),
    "Content-Type": "application/json",
  };
}

/**
 * Many stacks expose `/`, `/health`, or `/healthz`. Try in order until one returns 2xx.
 */
async function probeEngramLiveness(
  baseUrl: string,
  requestId: string,
  timeoutMs: number,
): Promise<{ ok: boolean; pathUsed: string; httpStatus: number }> {
  const paths = ["/", "/health", "/healthz"];
  const signal = AbortSignal.timeout(timeoutMs);
  let lastPath = "/";
  let lastStatus = 0;
  for (const p of paths) {
    lastPath = p;
    try {
      const r = await fetch(`${baseUrl}${p}`, {
        method: "GET",
        headers: baseUpstreamHeaders(requestId),
        signal,
      });
      lastStatus = r.status;
      if (r.ok) {
        return { ok: true, pathUsed: p, httpStatus: r.status };
      }
    } catch {
      // try next path
    }
  }
  return { ok: false, pathUsed: lastPath, httpStatus: lastStatus };
}

function jsonWithRequestId(c: Context, body: object, status: number, requestId: string) {
  return c.json(body, status, { "X-Request-ID": requestId });
}

async function requireSignedInUser(c: Context, requestId: string) {
  const authHeader = c.req.header("Authorization");
  const auth = await authenticateUser(authHeader);
  if (!auth.success || !auth.user) {
    return {
      ok: false as const,
      response: jsonWithRequestId(
        c,
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        401,
        requestId,
      ),
    };
  }
  const uid = auth.user.id;
  if (uid === "anon" || String(uid).startsWith("guest_")) {
    return {
      ok: false as const,
      response: jsonWithRequestId(
        c,
        { error: "Sign in required", code: "SIGN_IN_REQUIRED" },
        403,
        requestId,
      ),
    };
  }
  return { ok: true as const };
}

engramBridge.use(
  "*",
  cors({
    origin: (origin) => {
      const allowed = [
        "https://syncscript.app",
        "https://www.syncscript.app",
        "https://the-new-syncscript.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
      ];
      if (origin && allowed.includes(origin)) return origin;
      if (origin && origin.includes("syncscript") && origin.endsWith(".vercel.app")) {
        return origin;
      }
      return origin || "*";
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Request-ID", "X-Correlation-ID"],
    exposeHeaders: ["X-Request-ID"],
  }),
);

/** Liveness: Edge can reach Engram root (same as local smoke test). */
engramBridge.get("/health", async (c) => {
  const requestId = getRequestId(c);
  if (!ENGRAM_BASE_URL) {
    return jsonWithRequestId(
      c,
      {
        success: false,
        engramStatus: "unconfigured",
        message: "Set ENGRAM_BASE_URL on the Edge function",
      },
      503,
      requestId,
    );
  }
  try {
    const probe = await probeEngramLiveness(ENGRAM_BASE_URL, requestId, TIMEOUT_MS.health);
    return c.json(
      {
        success: probe.ok,
        engramStatus: probe.ok ? "connected" : "degraded",
        httpStatus: probe.httpStatus,
        probePath: probe.pathUsed,
      },
      probe.ok ? 200 : 503,
      { "X-Request-ID": requestId },
    );
  } catch (e) {
    return jsonWithRequestId(
      c,
      {
        success: false,
        engramStatus: "disconnected",
        error: String(e),
      },
      503,
      requestId,
    );
  }
});

/**
 * Authenticated proxy to GET /api/v1/discover — lists registered agents (may include internal URLs).
 * Requires Supabase JWT or anon (same auth plane as OpenClaw bridge).
 */
engramBridge.get("/discover", async (c) => {
  const requestId = getRequestId(c);
  if (!ENGRAM_BASE_URL) {
    return jsonWithRequestId(
      c,
      { error: "Engram not configured", code: "ENGRAM_UNCONFIGURED" },
      503,
      requestId,
    );
  }

  const gate = await requireSignedInUser(c, requestId);
  if (!gate.ok) return gate.response;

  const url = new URL(c.req.url);
  const search = url.search || "";
  const upstream = `${ENGRAM_BASE_URL}/api/v1/discover${search}`;

  try {
    const r = await fetch(upstream, {
      method: "GET",
      headers: baseUpstreamHeaders(requestId),
      signal: AbortSignal.timeout(TIMEOUT_MS.discover),
    });
    const text = await r.text();
    const ct = r.headers.get("content-type") || "application/json";
    return new Response(text, {
      status: r.status,
      headers: {
        "Content-Type": ct,
        "X-Request-ID": requestId,
      },
    });
  } catch (e) {
    console.error("[Engram Bridge] discover failed:", { requestId, err: String(e) });
    return jsonWithRequestId(
      c,
      { error: "Engram upstream error", code: "ENGRAM_UPSTREAM" },
      502,
      requestId,
    );
  }
});

/**
 * POST /translate — proxy to Engram /api/v1/translate (requires translate:a2a on upstream token).
 */
engramBridge.post("/translate", async (c) => {
  const requestId = getRequestId(c);
  if (!ENGRAM_BASE_URL) {
    return jsonWithRequestId(
      c,
      { error: "Engram not configured", code: "ENGRAM_UNCONFIGURED" },
      503,
      requestId,
    );
  }
  if (!ENGRAM_UPSTREAM_TOKEN) {
    return jsonWithRequestId(
      c,
      {
        error: "POST orchestration requires ENGRAM_UPSTREAM_TOKEN",
        code: "ENGRAM_TOKEN_REQUIRED",
      },
      503,
      requestId,
    );
  }

  const gate = await requireSignedInUser(c, requestId);
  if (!gate.ok) return gate.response;

  const raw = await c.req.arrayBuffer();
  if (raw.byteLength === 0) {
    return jsonWithRequestId(c, { error: "Empty body", code: "EMPTY_BODY" }, 400, requestId);
  }
  if (raw.byteLength > MAX_BODY_BYTES) {
    return jsonWithRequestId(
      c,
      { error: "Payload too large", code: "PAYLOAD_TOO_LARGE" },
      413,
      requestId,
    );
  }
  try {
    JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return jsonWithRequestId(c, { error: "Invalid JSON body", code: "INVALID_JSON" }, 400, requestId);
  }

  const upstream = `${ENGRAM_BASE_URL}/api/v1/translate`;
  try {
    const r = await fetch(upstream, {
      method: "POST",
      headers: jsonPostUpstreamHeaders(requestId),
      body: raw,
      signal: AbortSignal.timeout(TIMEOUT_MS.post),
    });
    const text = await r.text();
    const ct = r.headers.get("content-type") || "application/json";
    return new Response(text, {
      status: r.status,
      headers: {
        "Content-Type": ct,
        "X-Request-ID": requestId,
      },
    });
  } catch (e) {
    console.error("[Engram Bridge] translate failed:", { requestId, err: String(e) });
    return jsonWithRequestId(
      c,
      { error: "Engram upstream error", code: "ENGRAM_UPSTREAM" },
      502,
      requestId,
    );
  }
});

/**
 * POST /delegate — proxy to Engram /api/v1/delegate.
 */
engramBridge.post("/delegate", async (c) => {
  const requestId = getRequestId(c);
  if (!ENGRAM_BASE_URL) {
    return jsonWithRequestId(
      c,
      { error: "Engram not configured", code: "ENGRAM_UNCONFIGURED" },
      503,
      requestId,
    );
  }
  if (!ENGRAM_UPSTREAM_TOKEN) {
    return jsonWithRequestId(
      c,
      {
        error: "POST orchestration requires ENGRAM_UPSTREAM_TOKEN",
        code: "ENGRAM_TOKEN_REQUIRED",
      },
      503,
      requestId,
    );
  }

  const gate = await requireSignedInUser(c, requestId);
  if (!gate.ok) return gate.response;

  const raw = await c.req.arrayBuffer();
  if (raw.byteLength === 0) {
    return jsonWithRequestId(c, { error: "Empty body", code: "EMPTY_BODY" }, 400, requestId);
  }
  if (raw.byteLength > MAX_BODY_BYTES) {
    return jsonWithRequestId(
      c,
      { error: "Payload too large", code: "PAYLOAD_TOO_LARGE" },
      413,
      requestId,
    );
  }
  try {
    JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return jsonWithRequestId(c, { error: "Invalid JSON body", code: "INVALID_JSON" }, 400, requestId);
  }

  const upstream = `${ENGRAM_BASE_URL}/api/v1/delegate`;
  try {
    const r = await fetch(upstream, {
      method: "POST",
      headers: jsonPostUpstreamHeaders(requestId),
      body: raw,
      signal: AbortSignal.timeout(TIMEOUT_MS.post),
    });
    const text = await r.text();
    const ct = r.headers.get("content-type") || "application/json";
    return new Response(text, {
      status: r.status,
      headers: {
        "Content-Type": ct,
        "X-Request-ID": requestId,
      },
    });
  } catch (e) {
    console.error("[Engram Bridge] delegate failed:", { requestId, err: String(e) });
    return jsonWithRequestId(
      c,
      { error: "Engram upstream error", code: "ENGRAM_UPSTREAM" },
      502,
      requestId,
    );
  }
});

export default engramBridge;
