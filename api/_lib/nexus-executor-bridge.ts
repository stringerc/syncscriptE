/**
 * Optional HTTP bridge from Vercel → external executor gateway (OpenClaw, Hermes-like
 * MCP host, custom worker). Same *contract spirit* as Edge `hermes-bridge` (tool + invoke),
 * but server-to-server from `/api/agent/*` with a shared secret so the gateway can
 * trust `X-SyncScript-User-Id` without exposing operator keys to the browser.
 *
 * Env (all optional until you run a gateway):
 *   NEXUS_EXECUTOR_BRIDGE_URL       — origin, no trailing slash (e.g. https://gateway.example)
 *   NEXUS_EXECUTOR_BRIDGE_SECRET    — Bearer token Vercel sends on probe + invoke
 *   NEXUS_EXECUTOR_BRIDGE_INVOKE_PATH — default `/v1/invoke` (Hermes-shaped POST body)
 */

const DEFAULT_INVOKE_PATH = '/v1/invoke';
const HEALTH_CANDIDATES = ['/health', '/healthz', '/'] as const;

export function getExecutorBridgeConfig(): {
  configured: boolean;
  baseUrl: string;
  invokePath: string;
  hasSecret: boolean;
} {
  const baseUrl = (process.env.NEXUS_EXECUTOR_BRIDGE_URL || '').replace(/\/$/, '');
  const rawPath = (process.env.NEXUS_EXECUTOR_BRIDGE_INVOKE_PATH || DEFAULT_INVOKE_PATH).trim();
  const invokePath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  return {
    configured: Boolean(baseUrl),
    baseUrl,
    invokePath: invokePath || DEFAULT_INVOKE_PATH,
    hasSecret: Boolean(process.env.NEXUS_EXECUTOR_BRIDGE_SECRET?.trim()),
  };
}

export type ExecutorBridgeProbeResult = {
  ok: boolean;
  configured: boolean;
  http_status?: number;
  path_used?: string;
  latency_ms?: number;
  error?: string;
};

/**
 * GET health against the configured bridge (no user payload). Uses secret when set.
 */
export async function probeExecutorBridge(): Promise<ExecutorBridgeProbeResult> {
  const c = getExecutorBridgeConfig();
  if (!c.configured) {
    return { ok: false, configured: false, error: 'bridge_url_not_set' };
  }
  const secret = process.env.NEXUS_EXECUTOR_BRIDGE_SECRET?.trim();
  const started = Date.now();
  const signal = AbortSignal.timeout(8000);

  for (const path of HEALTH_CANDIDATES) {
    try {
      const r = await fetch(`${c.baseUrl}${path}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
        },
        signal,
      });
      const latency_ms = Date.now() - started;
      if (r.ok) {
        return { ok: true, configured: true, http_status: r.status, path_used: path, latency_ms };
      }
      if (path === HEALTH_CANDIDATES[HEALTH_CANDIDATES.length - 1]) {
        return {
          ok: false,
          configured: true,
          http_status: r.status,
          path_used: path,
          latency_ms,
          error: `http_${r.status}`,
        };
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (path === HEALTH_CANDIDATES[HEALTH_CANDIDATES.length - 1]) {
        return { ok: false, configured: true, error: msg };
      }
    }
  }
  return { ok: false, configured: true, error: 'probe_exhausted' };
}

export type ExecutorBridgeInvokeResult = {
  ok: boolean;
  status: number;
  json?: unknown;
  text?: string;
};

/**
 * POST JSON to the gateway invoke path. Forwards caller `userId` as `X-SyncScript-User-Id`.
 * Body should match your gateway (Hermes-style: `{ tool, arguments?, idempotency_key? }`).
 */
export async function invokeExecutorBridge(input: {
  userId: string;
  body: unknown;
  timeoutMs?: number;
}): Promise<ExecutorBridgeInvokeResult> {
  const c = getExecutorBridgeConfig();
  if (!c.configured) {
    return { ok: false, status: 503, text: 'bridge_url_not_set' };
  }
  const secret = process.env.NEXUS_EXECUTOR_BRIDGE_SECRET?.trim();
  if (!secret) {
    return { ok: false, status: 503, text: 'bridge_secret_required_for_invoke' };
  }

  const url = `${c.baseUrl}${c.invokePath.startsWith('/') ? c.invokePath : `/${c.invokePath}`}`;
  const timeoutMs = input.timeoutMs ?? 45_000;

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${secret}`,
        'X-SyncScript-User-Id': input.userId,
      },
      body: JSON.stringify(input.body ?? {}),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await r.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      json = undefined;
    }
    return { ok: r.ok, status: r.status, json, text: json ? undefined : text };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, status: 502, text: msg };
  }
}
