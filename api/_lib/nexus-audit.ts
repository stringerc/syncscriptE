import { createClient } from '@supabase/supabase-js';
import type { NexusToolTraceEntry } from './nexus-tools';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Persist one tool execution for compliance / debugging (service role insert).
 */
export async function recordNexusToolAudit(entry: {
  userId: string;
  surface: 'voice' | 'text' | 'phone';
  requestId?: string;
  trace: NexusToolTraceEntry;
  idempotencyKey?: string;
}): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_KEY) return;
  try {
    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    await sb.from('nexus_tool_audit').insert({
      user_id: entry.userId,
      surface: entry.surface,
      request_id: entry.requestId ?? null,
      tool_name: entry.trace.tool,
      ok: entry.trace.ok,
      detail: (entry.trace.detail ?? null) as Record<string, unknown> | null,
      idempotency_key: entry.idempotencyKey ?? null,
    });
  } catch (e) {
    console.warn('[nexus-audit] insert failed', e);
  }
}

export async function recordNexusCallSummary(row: {
  userId: string;
  sessionId?: string;
  surface: 'voice' | 'text' | 'phone';
  summaryText: string;
  toolTrace: unknown;
  messageCount: number;
}): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_KEY) return;
  try {
    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    await sb.from('nexus_call_session_summaries').insert({
      user_id: row.userId,
      session_id: row.sessionId ?? null,
      surface: row.surface,
      summary_text: row.summaryText,
      tool_trace: row.toolTrace,
      message_count: row.messageCount,
    });
  } catch (e) {
    console.warn('[nexus-audit] summary insert failed', e);
  }
}
