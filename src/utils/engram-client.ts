/**
 * Engram — calls Supabase Edge `engram-bridge` (never raw Engram URL in production).
 * Enable with VITE_ENGRAM_ENABLED=true and deploy ENGRAM_BASE_URL on Edge.
 */

import { supabaseUrl } from "./supabase/info";
import { supabaseFunctionsGatewayHeaders } from "./supabase-functions-gateway";
import type { EngramAgentRegistryRow, EngramBridgeHealth } from "../types/engram";

const BRIDGE_BASE = `${supabaseUrl}/functions/v1/make-server-57781ad9/engram`;

export function isEngramClientEnabled(): boolean {
  const v = import.meta.env.VITE_ENGRAM_ENABLED;
  return v === "true" || v === "1";
}

export async function fetchEngramBridgeHealth(requestId?: string): Promise<EngramBridgeHealth> {
  const r = await fetch(`${BRIDGE_BASE}/health`, {
    method: "GET",
    headers: supabaseFunctionsGatewayHeaders(requestId ? requestIdHeader(requestId) : {}),
    signal: AbortSignal.timeout(8000),
  });
  const data = (await r.json().catch(() => ({}))) as EngramBridgeHealth;
  return { ...data, success: r.ok && !!data.success };
}

/**
 * Authenticated discovery — requires a real Supabase session (not anon-only).
 */
function requestIdHeader(requestId?: string): Record<string, string> {
  const id = requestId?.trim() || crypto.randomUUID();
  return { "X-Request-ID": id };
}

export async function fetchEngramDiscover(
  accessToken: string,
  query?: { protocol?: string; capability?: string },
  requestId?: string,
): Promise<EngramAgentRegistryRow[]> {
  if (!isEngramClientEnabled()) {
    return [];
  }
  const params = new URLSearchParams();
  if (query?.protocol) params.set("protocol", query.protocol);
  if (query?.capability) params.set("capability", query.capability);
  const qs = params.toString();
  const url = `${BRIDGE_BASE}/discover${qs ? `?${qs}` : ""}`;
  const r = await fetch(url, {
    method: "GET",
    headers: {
      ...supabaseFunctionsGatewayHeaders(),
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...requestIdHeader(requestId),
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) {
    const err = await r.text();
    throw new Error(`Engram discover failed: ${r.status} ${err}`);
  }
  return (await r.json()) as EngramAgentRegistryRow[];
}

/** Proxies to Engram `/api/v1/translate` via Edge; requires `ENGRAM_UPSTREAM_TOKEN` on Edge. */
export async function fetchEngramTranslate(
  accessToken: string,
  body: Record<string, unknown>,
  requestId?: string,
): Promise<unknown> {
  if (!isEngramClientEnabled()) {
    throw new Error("Engram client is disabled (VITE_ENGRAM_ENABLED)");
  }
  const r = await fetch(`${BRIDGE_BASE}/translate`, {
    method: "POST",
    headers: {
      ...supabaseFunctionsGatewayHeaders(),
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...requestIdHeader(requestId),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(`Engram translate failed: ${r.status} ${text}`);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/** Proxies to Engram `/api/v1/delegate` via Edge; requires `ENGRAM_UPSTREAM_TOKEN` on Edge. */
export async function fetchEngramDelegate(
  accessToken: string,
  body: { command: string; source_agent?: string },
  requestId?: string,
): Promise<unknown> {
  if (!isEngramClientEnabled()) {
    throw new Error("Engram client is disabled (VITE_ENGRAM_ENABLED)");
  }
  const r = await fetch(`${BRIDGE_BASE}/delegate`, {
    method: "POST",
    headers: {
      ...supabaseFunctionsGatewayHeaders(),
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...requestIdHeader(requestId),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(`Engram delegate failed: ${r.status} ${text}`);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
