import { createHash } from 'crypto';

export type NexusTraceSurface = 'guest' | 'user';

export type NexusTraceOutcome =
  | 'ok'
  | 'error'
  | 'rate_limited'
  | 'validation_error'
  | 'ai_unconfigured';

export type NexusTracePathway = 'llm' | 'deterministic_pricing' | 'stream' | 'stream_fallback' | 'tools';

/** One JSON line per request for Vercel / Mission Control log drains. Never include raw user text or private context. */
export function emitNexusTrace(ev: {
  surface: NexusTraceSurface;
  requestId: string;
  outcome: NexusTraceOutcome;
  pathway: NexusTracePathway;
  brainVersion: string;
  latencyMs: number;
  sessionKey?: string;
  model?: string;
  provider?: string;
  /** Serialized private context byte length only (user surface). */
  privateContextBytes?: number;
  errorCode?: string;
  httpStatus?: number;
  responseChars?: number;
  /** Which Nexus persona mode was applied (no user text). */
  personaMode?: 'standard' | 'halo_inspired';
  /** User surface + tools path: count of tool executions returned to the client. */
  toolTraceEntries?: number;
  /** User surface + tools path: tool loop applied a repair/nudge path. */
  toolRepairNudged?: boolean;
}): void {
  const line = {
    nexus_trace: 'v1',
    ts: new Date().toISOString(),
    ...ev,
  };
  console.log(JSON.stringify(line));
}

export function newNexusRequestId(): string {
  return `nx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function hashSessionKey(sessionId: string): string {
  return createHash('sha256').update(sessionId).digest('hex').slice(0, 16);
}
