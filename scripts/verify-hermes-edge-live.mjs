#!/usr/bin/env node
/**
 * Live smoke: Supabase Edge Hermes bridge GET /health (requires Supabase invoke headers).
 *
 * Env:
 *   HERMES_EDGE_LIVE_VERIFY=1 — fail if no base URL (strict)
 *   HERMES_REQUIRE_CONNECTED=1 — require success===true && hermesStatus===connected
 *   ENGRAM_LIVE_USE_DEFAULT_PROJECT_URL=1 — use public project URL from engram-public-supabase-url.mjs
 */
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

const usePublicDefault = process.env.ENGRAM_LIVE_USE_DEFAULT_PROJECT_URL === "1";
const baseUrl = fromEnv || (usePublicDefault ? PUBLIC_SUPABASE_PROJECT_URL.replace(/\/$/, "") : "");
const strict = process.env.HERMES_EDGE_LIVE_VERIFY === "1";
const requireConnected = process.env.HERMES_REQUIRE_CONNECTED === "1";
const allowNotDeployed = process.env.HERMES_LIVE_ALLOW_NOT_DEPLOYED === "1";

const anonKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  PUBLIC_SUPABASE_ANON_KEY;

function headers() {
  return {
    Accept: "application/json",
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };
}

async function main() {
  if (!baseUrl) {
    const msg =
      "verify-hermes-edge-live: skip (no SUPABASE_URL). Set ENGRAM_LIVE_USE_DEFAULT_PROJECT_URL=1 or HERMES_EDGE_LIVE_VERIFY=1 to fail.";
    if (strict) {
      console.error(msg);
      process.exit(1);
    }
    console.error(msg);
    process.exit(0);
  }

  const healthUrl = `${baseUrl}/functions/v1/make-server-57781ad9/hermes/health`;
  console.error(`verify-hermes-edge-live: ${healthUrl}`);

  const res = await fetch(healthUrl, { method: "GET", headers: headers() });
  const text = await res.text();
  let body = {};
  try {
    body = JSON.parse(text);
  } catch {
    /* ignore */
  }

  if (res.status === 404 && allowNotDeployed) {
    console.error("verify-hermes-edge-live: 404 — allowNotDeployed");
    process.exit(0);
  }

  if (!res.ok) {
    console.error(`verify-hermes-edge-live: HTTP ${res.status}`, text.slice(0, 200));
    process.exit(1);
  }

  if (requireConnected && (!body.success || body.hermesStatus !== "connected")) {
    console.error("verify-hermes-edge-live: require connected failed", body);
    process.exit(1);
  }

  console.error("verify-hermes-edge-live: ok", {
    hermesStatus: body.hermesStatus,
    probePath: body.probePath,
  });
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
