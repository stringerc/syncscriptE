import type { AuthenticatedSupabaseUser } from './auth';
import { recordNexusToolAudit } from './nexus-audit';
import type { NexusToolTraceEntry } from './nexus-tools';

/** Vercel often exposes the project URL as VITE_* only; phone tools must hit the real Edge. */
function supabaseFunctionsBase(): string {
  const raw =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    '';
  const trimmed = raw.replace(/\/$/, '');
  if (trimmed) return trimmed;
  const ref = process.env.SUPABASE_PROJECT_ID || process.env.VITE_SUPABASE_PROJECT_ID || 'kwhnrlzibgfedtxpkbgb';
  return `https://${ref}.supabase.co`;
}

const SUPABASE_URL = supabaseFunctionsBase();

export type NexusActor =
  | { kind: 'jwt'; user: AuthenticatedSupabaseUser }
  | { kind: 'phone'; userId: string };

export interface NexusExecMeta {
  surface: 'voice' | 'text' | 'phone';
  requestId?: string;
}

function tasksEndpoint(): string {
  return `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/make-server-57781ad9/tasks`;
}

function phoneExecuteEndpoint(): string {
  return `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/make-server-57781ad9/phone/nexus-execute`;
}

function sourceForSurface(surface: NexusExecMeta['surface']): string {
  if (surface === 'phone') return 'nexus_phone';
  if (surface === 'text') return 'nexus_text';
  return 'nexus_voice';
}

function tagsForSurface(surface: NexusExecMeta['surface']): string[] {
  if (surface === 'phone') return ['nexus', 'phone'];
  if (surface === 'text') return ['nexus', 'text'];
  return ['nexus', 'voice'];
}

async function postTaskJwt(user: AuthenticatedSupabaseUser, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(tasksEndpoint(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${user.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`tasks API ${res.status}: ${text.slice(0, 300)}`);
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error('tasks API returned non-JSON');
  }
}

async function postTaskPhone(userId: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const secret = process.env.NEXUS_PHONE_EDGE_SECRET;
  if (!secret) {
    throw new Error('NEXUS_PHONE_EDGE_SECRET is not configured');
  }
  const anon = process.env.SUPABASE_ANON_KEY || '';
  const res = await fetch(phoneExecuteEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(anon ? { Authorization: `Bearer ${anon}` } : {}),
      'x-nexus-internal-secret': secret,
    },
    body: JSON.stringify({ userId, task: body }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`phone nexus-execute ${res.status}: ${text.slice(0, 300)}`);
  }
  return JSON.parse(text) as Record<string, unknown>;
}

async function createTaskForActor(actor: NexusActor, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (actor.kind === 'jwt') {
    return postTaskJwt(actor.user, body);
  }
  return postTaskPhone(actor.userId, body);
}

function userIdFromActor(actor: NexusActor): string {
  return actor.kind === 'jwt' ? actor.user.userId : actor.userId;
}

function parseArgs(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

async function emitAudit(actor: NexusActor, meta: NexusExecMeta, trace: NexusToolTraceEntry): Promise<void> {
  await recordNexusToolAudit({
    userId: userIdFromActor(actor),
    surface: meta.surface,
    requestId: meta.requestId,
    trace,
  });
}

/**
 * Runs one allowlisted tool. Returns a JSON-serializable result for the model.
 */
export async function executeNexusTool(
  name: string,
  argsJson: string,
  actor: NexusActor,
  meta: NexusExecMeta,
): Promise<{ trace: NexusToolTraceEntry; toolMessage: string }> {
  const args = parseArgs(argsJson);
  const src = sourceForSurface(meta.surface);
  const baseTags = tagsForSurface(meta.surface);

  const finish = async (trace: NexusToolTraceEntry, toolMessage: string) => {
    await emitAudit(actor, meta, trace);
    return { trace, toolMessage };
  };

  if (name === 'create_task') {
    const title = String(args.title || '').trim();
    if (!title) {
      return await finish(
        { tool: 'create_task', ok: false, error: 'missing_title' },
        JSON.stringify({ ok: false, error: 'title required' }),
      );
    }
    const description = args.description != null ? String(args.description) : '';
    const priority = ['low', 'medium', 'high', 'urgent'].includes(String(args.priority))
      ? String(args.priority)
      : 'medium';
    const dueDate =
      typeof args.due_date_iso === 'string' && args.due_date_iso.trim()
        ? new Date(args.due_date_iso).toISOString()
        : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    try {
      const created = await createTaskForActor(actor, {
        title,
        description,
        priority,
        energyLevel: 'medium',
        estimatedTime: '30 min',
        dueDate,
        tags: baseTags,
        source: src,
      });

      return await finish(
        {
          tool: 'create_task',
          ok: true,
          detail: { taskId: created.id, title: created.title },
        },
        JSON.stringify({
          ok: true,
          task_id: created.id,
          title: created.title,
        }),
      );
    } catch (e: any) {
      return await finish(
        { tool: 'create_task', ok: false, error: e?.message || 'task_create_failed' },
        JSON.stringify({ ok: false, error: String(e?.message || 'failed') }),
      );
    }
  }

  if (name === 'add_note') {
    const title = String(args.title || '').trim();
    const body = String(args.body || '').trim();
    if (!title || !body) {
      return await finish(
        { tool: 'add_note', ok: false, error: 'missing_title_or_body' },
        JSON.stringify({ ok: false, error: 'title and body required' }),
      );
    }

    try {
      const created = await createTaskForActor(actor, {
        title: `[Note] ${title}`,
        description: body,
        priority: 'low',
        energyLevel: 'low',
        estimatedTime: '15 min',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        tags: [...baseTags, 'note'],
        source: `${src}_note`,
      });

      return await finish(
        {
          tool: 'add_note',
          ok: true,
          detail: { taskId: created.id, title: created.title },
        },
        JSON.stringify({
          ok: true,
          note_item_id: created.id,
          title: created.title,
        }),
      );
    } catch (e: any) {
      return await finish(
        { tool: 'add_note', ok: false, error: e?.message || 'note_failed' },
        JSON.stringify({ ok: false, error: String(e?.message || 'failed') }),
      );
    }
  }

  if (name === 'propose_calendar_hold') {
    const title = String(args.title || '').trim();
    const startIso = String(args.start_iso || '').trim();
    const duration = Number(args.duration_minutes);
    if (!title || !startIso || !Number.isFinite(duration)) {
      return await finish(
        { tool: 'propose_calendar_hold', ok: false, error: 'invalid_fields' },
        JSON.stringify({ ok: false, error: 'title, start_iso, duration_minutes required' }),
      );
    }

    const proposal = {
      title,
      start_iso: new Date(startIso).toISOString(),
      duration_minutes: Math.min(480, Math.max(15, Math.round(duration))),
      applied: false,
    };

    return await finish(
      {
        tool: 'propose_calendar_hold',
        ok: true,
        detail: proposal,
      },
      JSON.stringify({ ok: true, proposal }),
    );
  }

  const unknownTrace: NexusToolTraceEntry = { tool: name, ok: false, error: 'unknown_tool' };
  return await finish(unknownTrace, JSON.stringify({ ok: false, error: 'unknown tool' }));
}
