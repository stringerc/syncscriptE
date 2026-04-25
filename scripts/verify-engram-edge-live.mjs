#!/usr/bin/env node
/**
 * Live smoke test: Supabase Edge Engram bridge (public /health + optional authenticated /discover).
 *
 * Loads env from process.env (use: node --env-file=.env scripts/verify-engram-edge-live.mjs).
 * Never prints tokens, anon keys, or service role keys — only hostnames and HTTP metadata.
 *
 * Exit codes:
 *   0 — checks passed, or skipped (see stderr)
 *   1 — required check failed
 *
 * Optional env:
 *   ENGRAM_EDGE_LIVE_VERIFY=1 — fail if SUPABASE_URL missing (strict CI/local gate)
 *   ENGRAM_REQUIRE_CONNECTED=1 — require health JSON success===true and engramStatus===connected
 *   ENGRAM_LIVE_USER_JWT — if set, GET /discover with Bearer (must be a real user JWT, not anon)
 */

import assert from "node:assert/strict";
import {
  PUBLIC_SUPABASE_ANON_KEY,
  PUBLIC_SUPABASE_PROJECT_URL,
} from "./engram-public-supabase-url.mjs";

const fromEnv = (
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  ""
).replace(/\/$/, "");

/** Use repo public project URL when env unset (same behavior as Vite client fallback). */
const usePublicDefault = process.env.ENGRAM_LIVE_USE_DEFAULT_PROJECT_URL === "1";
const baseUrl = fromEnv || (usePublicDefault ? PUBLIC_SUPABASE_PROJECT_URL.replace(/\/$/, "") : "");
const strict = process.env.ENGRAM_EDGE_LIVE_VERIFY === "1";
const requireConnected = process.env.ENGRAM_REQUIRE_CONNECTED === "1";
const allowNotDeployed = process.env.ENGRAM_LIVE_ALLOW_NOT_DEPLOYED === "1";
const userJwt = process.env.ENGRAM_LIVE_USER_JWT;

const anonKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  PUBLIC_SUPABASE_ANON_KEY;

function supabaseInvokeHeaders() {
  return {
    Accept: "application/json",
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };
}

function redactUrl(u) {
  try {
    const x = new URL(u);
    return `${x.protocol}//${x.hostname}${x.pathname}`;
  } catch {
    return "(invalid-url)";
  }
}

function getHeader(res, name) {
  const lower = name.toLowerCase();
  for (const [k, v] of res.headers.entries()) {
    if (k.toLowerCase() === lower) return v;
  }
  return "";
}

function requestCorrelationId(res) {
  return (
    getHeader(res, "x-request-id") ||
    getHeader(res, "sb-request-id") ||
    ""
  );
}

async function main() {
  if (!baseUrl) {
    const msg =
      "verify-engram-edge-live: skip (no SUPABASE_URL / VITE_SUPABASE_URL). Set ENGRAM_LIVE_USE_DEFAULT_PROJECT_URL=1 to use the public project URL from scripts/engram-public-supabase-url.mjs, or ENGRAM_EDGE_LIVE_VERIFY=1 to fail instead of skip.";
    if (strict) {
      console.error(msg);
      process.exit(1);
    }
    console.error(msg);
    process.exit(0);
  }

  if (baseUrl === PUBLIC_SUPABASE_PROJECT_URL.replace(/\/$/, "")) {
    console.error("verify-engram-edge-live: using PUBLIC_SUPABASE_PROJECT_URL (client fallback; not a secret)");
  }

  const bridgeBase = `${baseUrl}/functions/v1/make-server-57781ad9/engram`;
  const healthUrl = `${bridgeBase}/health`;

  console.error(`verify-engram-edge-live: probing ${redactUrl(healthUrl)}`);

  const healthRes = await fetch(healthUrl, {
    method: "GET",
    headers: supabaseInvokeHeaders(),
    signal: AbortSignal.timeout(20000),
  });

  if (healthRes.status === 404) {
    const msg =
      "verify-engram-edge-live: Engram path returned 404 — deploy the Edge function that includes engram-bridge (make-server-57781ad9) or confirm the URL path.";
    if (allowNotDeployed) {
      console.error(msg + " (ENGRAM_LIVE_ALLOW_NOT_DEPLOYED=1 — exiting 0)");
      process.exit(0);
    }
    throw new Error(msg);
  }

  const rid = requestCorrelationId(healthRes);
  assert.ok(rid && rid.length > 0, "response must include X-Request-ID or sb-request-id");

  const text = await healthRes.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`health: expected JSON body, got: ${text.slice(0, 200)}`);
  }

  assert.ok(
    typeof body === "object" && body !== null,
    "health: body must be an object",
  );

  if (healthRes.status !== 200 && healthRes.status !== 503) {
    throw new Error(`health: unexpected HTTP ${healthRes.status}`);
  }

  const status = body.engramStatus;
  assert.ok(
    ["connected", "degraded", "disconnected", "unconfigured"].includes(status) ||
      body.success === false,
    "health: expected engramStatus or success field from bridge",
  );

  if (requireConnected) {
    assert.equal(body.success, true, "ENGRAM_REQUIRE_CONNECTED: success must be true");
    assert.equal(status, "connected", "ENGRAM_REQUIRE_CONNECTED: engramStatus must be connected");
  }

  console.error(
    `verify-engram-edge-live: health OK — http=${healthRes.status} engramStatus=${status ?? "?"} requestId=${rid.slice(0, 36)}…`,
  );

  if (userJwt && String(userJwt).length > 20) {
    const discoverUrl = `${bridgeBase}/discover`;
    const dRes = await fetch(discoverUrl, {
      method: "GET",
      headers: {
        ...supabaseInvokeHeaders(),
        Authorization: `Bearer ${userJwt}`,
      },
      signal: AbortSignal.timeout(25000),
    });
    const dRid = requestCorrelationId(dRes);
    assert.ok(dRid && dRid.length > 0, "discover: response must include X-Request-ID or sb-request-id");

    if (dRes.status === 401 || dRes.status === 403) {
      console.error(
        `verify-engram-edge-live: discover returned ${dRes.status} (token may be expired or guest/anon — not a hard failure)`,
      );
    } else if (dRes.status === 503) {
      const t = await dRes.text();
      console.error(
        `verify-engram-edge-live: discover 503 (Engram may be unconfigured upstream): ${t.slice(0, 120)}`,
      );
    } else {
      assert.ok(dRes.ok, `discover: expected 2xx, got ${dRes.status}`);
      const ct = dRes.headers.get("content-type") || "";
      assert.ok(ct.includes("json"), "discover: expected JSON content-type");
      console.error(`verify-engram-edge-live: discover OK — http=${dRes.status}`);
    }
  } else {
    console.error(
      "verify-engram-edge-live: skip discover (set ENGRAM_LIVE_USER_JWT for signed-in smoke)",
    );
  }

  console.error("verify-engram-edge-live: all checks passed");
}

main().catch((e) => {
  console.error("verify-engram-edge-live: FAIL", e.message || e);
  process.exit(1);
});
