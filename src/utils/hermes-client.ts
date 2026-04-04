/**
 * Hermes — calls Supabase Edge `hermes-bridge` (never raw Hermes URL in production).
 * Set `HERMES_BASE_URL` on Edge; optional `VITE_HERMES_ENABLED=true` to enable client helpers.
 */

import { publicAnonKey, supabaseUrl } from './supabase/info';
import {
  emitAgentRunCompleted,
  emitAgentRunFailed,
  emitAgentRunStarted,
  emitAgentRunStep,
} from '../contracts/runtime/contract-runtime';

const BRIDGE_BASE = `${supabaseUrl}/functions/v1/make-server-57781ad9/hermes`;

export function isHermesClientEnabled(): boolean {
  const v = import.meta.env.VITE_HERMES_ENABLED;
  return v === 'true' || v === '1';
}

export type HermesBridgeHealth = {
  success?: boolean;
  hermesStatus?: string;
  httpStatus?: number;
  probePath?: string;
  message?: string;
};

function requestIdHeader(requestId?: string): Record<string, string> {
  const id = requestId?.trim() || crypto.randomUUID();
  return { 'X-Request-ID': id };
}

/** Supabase Functions gateway requires Authorization + apikey (anon is public; same as verify-hermes-edge-live.mjs). */
function supabaseGatewayHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    Authorization: `Bearer ${publicAnonKey}`,
    apikey: publicAnonKey,
    ...extra,
  };
}

export async function fetchHermesBridgeHealth(requestId?: string): Promise<HermesBridgeHealth> {
  const r = await fetch(`${BRIDGE_BASE}/health`, {
    method: 'GET',
    headers: supabaseGatewayHeaders(requestId ? requestIdHeader(requestId) : {}),
    signal: AbortSignal.timeout(8000),
  });
  const data = (await r.json().catch(() => ({}))) as HermesBridgeHealth;
  return { ...data, success: r.ok && !!data.success };
}

export type HermesToolMeta = {
  name: string;
  description?: string;
  input_schema?: Record<string, unknown>;
};

export async function fetchHermesTools(
  accessToken: string,
  requestId?: string,
): Promise<{ tools?: HermesToolMeta[] }> {
  if (!isHermesClientEnabled()) {
    return { tools: [] };
  }
  const r = await fetch(`${BRIDGE_BASE}/tools`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      ...requestIdHeader(requestId),
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Hermes tools failed: ${r.status} ${t}`);
  }
  return (await r.json()) as { tools?: HermesToolMeta[] };
}

export type HermesInvokeBody = {
  tool: string;
  arguments?: Record<string, unknown>;
  idempotency_key?: string;
};

export type HermesTraceRow = { step: string; status: string; detail?: string | null; at?: string };

export type HermesInvokeResponse = {
  ok?: boolean;
  tool?: string;
  run_id?: string;
  result?: unknown;
  trace?: HermesTraceRow[];
  error?: string;
  deduped?: boolean;
};

/**
 * Invoke a Hermes tool via Edge; optionally maps `trace[]` → contract `agent.run.*` events for the dock.
 */
export async function invokeHermesTool(
  accessToken: string,
  body: HermesInvokeBody,
  options?: { emitTrace?: boolean; requestId?: string },
): Promise<HermesInvokeResponse> {
  if (!isHermesClientEnabled()) {
    throw new Error('Hermes client is disabled (set VITE_HERMES_ENABLED=1)');
  }
  const r = await fetch(`${BRIDGE_BASE}/invoke`, {
    method: 'POST',
    headers: {
      ...supabaseGatewayHeaders(),
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...requestIdHeader(options?.requestId),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45000),
  });
  const text = await r.text();
  let data: HermesInvokeResponse = {};
  try {
    data = JSON.parse(text) as HermesInvokeResponse;
  } catch {
    throw new Error(`Hermes invoke: ${r.status} ${text.slice(0, 200)}`);
  }

  if (options?.emitTrace !== false && typeof window !== 'undefined') {
    const runId = data.run_id || crypto.randomUUID();
    if (data.trace?.length) {
      emitAgentRunStarted(runId, { label: body.tool, source: 'hermes' });
      data.trace.forEach((row, i) => {
        emitAgentRunStep(runId, {
          runId,
          stepIndex: i,
          tool: body.tool,
          status: row.status === 'error' ? 'error' : 'ok',
          argsSummary: row.step,
          resultSummary: row.detail || undefined,
        });
      });
    }
    if (data.trace?.length || data.ok === false) {
      if (data.ok === false) {
        emitAgentRunFailed(runId, data.error || 'invoke failed');
      } else {
        emitAgentRunCompleted(runId, {
          ok: true,
          summary: data.deduped ? 'deduped' : 'completed',
        });
      }
    }
  }

  return data;
}
