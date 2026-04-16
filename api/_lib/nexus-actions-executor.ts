import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import type { AuthenticatedSupabaseUser } from './auth';
import { recordNexusToolAudit } from './nexus-audit';
import type { NexusToolTraceEntry } from './nexus-tools';
import { generateInvoiceHtml, type InvoiceItem } from './invoice-html';

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
  const anon = process.env.SUPABASE_ANON_KEY || '';
  const res = await fetchWithRetry(tasksEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(anon ? { apikey: anon } : {}),
      Authorization: `Bearer ${user.accessToken}`,
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
  const res = await fetchWithRetry(phoneExecuteEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(anon ? { apikey: anon, Authorization: `Bearer ${anon}` } : {}),
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

function supabaseUrlForDb(): string {
  return (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ''
  );
}

function supabaseForUserJwt(user: AuthenticatedSupabaseUser) {
  const url = supabaseUrlForDb();
  const anon = process.env.SUPABASE_ANON_KEY || '';
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${user.accessToken}` } },
  });
}

const TRANSIENT_RETRY_COUNT = 2;
const TRANSIENT_RETRY_DELAY_MS = 600;
const TRANSIENT_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = TRANSIENT_RETRY_COUNT,
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url, init);
      if (res.ok || !TRANSIENT_STATUS_CODES.has(res.status) || attempt === retries) {
        return res;
      }
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err: any) {
      lastError = err;
      if (attempt === retries) throw lastError;
    }
    await new Promise((r) => setTimeout(r, TRANSIENT_RETRY_DELAY_MS * (attempt + 1)));
  }
  throw lastError || new Error('fetchWithRetry exhausted');
}

function parseArgs(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** KV /tasks and /phone/nexus-execute return a flat task object with `id`. */
function assertTaskResponse(data: Record<string, unknown>, context: string): { id: string; title: string } {
  const id = String(data?.id ?? '').trim();
  if (!id) {
    throw new Error(`${context}: task API response missing id`);
  }
  return { id, title: String(data?.title ?? '').trim() || 'Untitled' };
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
    let dueDate: string;
    if (typeof args.due_date_iso === 'string' && args.due_date_iso.trim()) {
      dueDate = new Date(args.due_date_iso).toISOString();
    } else {
      const eod = new Date();
      eod.setHours(23, 59, 59, 0);
      dueDate = eod.toISOString();
    }

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
      const safe = assertTaskResponse(created as Record<string, unknown>, 'create_task');

      return await finish(
        {
          tool: 'create_task',
          ok: true,
          detail: { taskId: safe.id, title: safe.title },
        },
        JSON.stringify({
          ok: true,
          task_id: safe.id,
          title: safe.title,
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
      const safe = assertTaskResponse(created as Record<string, unknown>, 'add_note');

      return await finish(
        {
          tool: 'add_note',
          ok: true,
          detail: { taskId: safe.id, title: safe.title },
        },
        JSON.stringify({
          ok: true,
          note_item_id: safe.id,
          title: safe.title,
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

    const startDate = new Date(startIso);
    const durationMin = Math.min(480, Math.max(15, Math.round(duration)));
    const endDate = new Date(startDate.getTime() + durationMin * 60_000);

    const proposal = {
      title,
      start_iso: startDate.toISOString(),
      end_iso: endDate.toISOString(),
      duration_minutes: durationMin,
      applied: false,
    };

    if (meta.surface === 'phone') {
      const startLabel = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const endLabel = endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const dateLabel = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      try {
        const created = await createTaskForActor(actor, {
          title: `\u{1F4C5} ${title}`,
          description: `Calendar event: ${startLabel} \u2013 ${endLabel}, ${dateLabel}`,
          priority: 'medium',
          energyLevel: 'medium',
          estimatedTime: `${durationMin} min`,
          dueDate: startDate.toISOString(),
          scheduledTime: startDate.toISOString(),
          tags: [...baseTags, 'calendar-event'],
          source: `${src}_calendar`,
        });
        const safe = assertTaskResponse(created as Record<string, unknown>, 'propose_calendar_hold');
        proposal.applied = true;
        return await finish(
          {
            tool: 'propose_calendar_hold',
            ok: true,
            detail: { ...proposal, taskId: safe.id },
          },
          JSON.stringify({ ok: true, saved: true, task_id: safe.id, title, start_iso: startDate.toISOString(), end_iso: endDate.toISOString() }),
        );
      } catch (e: any) {
        return await finish(
          { tool: 'propose_calendar_hold', ok: false, error: e?.message || 'event_save_failed' },
          JSON.stringify({ ok: false, error: String(e?.message || 'failed to save event') }),
        );
      }
    }

    return await finish(
      {
        tool: 'propose_calendar_hold',
        ok: true,
        detail: proposal,
      },
      JSON.stringify({ ok: true, proposal }),
    );
  }

  if (name === 'create_document') {
    const docTitle = String(args.title || '').trim();
    const docContent = String(args.content || '').trim();
    const docFormat = ['document', 'spreadsheet', 'invoice'].includes(String(args.format))
      ? String(args.format)
      : 'document';

    if (!docTitle || !docContent) {
      return await finish(
        { tool: 'create_document', ok: false, error: 'missing_title_or_content' },
        JSON.stringify({ ok: false, error: 'title and content required' }),
      );
    }

    return await finish(
      {
        tool: 'create_document',
        ok: true,
        detail: { title: docTitle, content: docContent, format: docFormat },
      },
      JSON.stringify({ ok: true, title: docTitle, format: docFormat, message: 'Document created and opened in the editor.' }),
    );
  }

  if (name === 'update_document') {
    const docContent = String(args.content || '').trim();
    const docTitleRaw = String(args.title || '').trim();
    const docFormat = ['document', 'spreadsheet', 'invoice'].includes(String(args.format))
      ? String(args.format)
      : 'document';

    if (!docContent) {
      return await finish(
        { tool: 'update_document', ok: false, error: 'missing_content' },
        JSON.stringify({ ok: false, error: 'content required' }),
      );
    }

    const docTitle = docTitleRaw || 'Document';

    return await finish(
      {
        tool: 'update_document',
        ok: true,
        detail: { title: docTitle, content: docContent, format: docFormat },
      },
      JSON.stringify({
        ok: true,
        title: docTitle,
        format: docFormat,
        message: 'Document updated in the editor.',
      }),
    );
  }

  if (name === 'send_invoice') {
    const toEmail = String(args.to_email || '').trim();
    const toName = args.to_name ? String(args.to_name).trim() : '';
    const rawItems = Array.isArray(args.items) ? args.items : [];
    const taxPercent = typeof args.tax_percent === 'number' ? args.tax_percent : 0;
    const notes = args.notes ? String(args.notes).trim() : '';
    const dueDate = args.due_date ? String(args.due_date).trim() : '';

    if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
      return await finish(
        { tool: 'send_invoice', ok: false, error: 'invalid_email' },
        JSON.stringify({ ok: false, error: 'Valid to_email is required' }),
      );
    }
    if (rawItems.length === 0) {
      return await finish(
        { tool: 'send_invoice', ok: false, error: 'no_items' },
        JSON.stringify({ ok: false, error: 'At least one line item is required' }),
      );
    }

    const items: InvoiceItem[] = rawItems.map((it: any) => ({
      description: String(it.description || 'Item'),
      quantity: typeof it.quantity === 'number' && it.quantity > 0 ? it.quantity : 1,
      unit_price: typeof it.unit_price === 'number' ? it.unit_price : 0,
    }));

    const subtotal = items.reduce((s, it) => s + it.quantity * it.unit_price, 0);
    const taxAmount = taxPercent > 0 ? Math.round(subtotal * (taxPercent / 100) * 100) / 100 : 0;
    const total = Math.round((subtotal + taxAmount) * 100) / 100;

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const senderName = actor.kind === 'jwt' ? (actor.user.email || 'SyncScript User') : 'SyncScript User';
    const senderEmail = actor.kind === 'jwt' ? (actor.user.email || undefined) : undefined;

    const invoiceData = {
      invoiceNumber,
      date: today,
      dueDate: dueDate || undefined,
      fromName: senderName,
      fromEmail: senderEmail,
      toName: toName || undefined,
      toEmail,
      items,
      taxPercent: taxPercent > 0 ? taxPercent : undefined,
      subtotal,
      taxAmount,
      total,
      notes: notes || undefined,
    };

    let paymentUrl: string | undefined;
    let stripeSessionId: string | undefined;
    try {
      const anon = process.env.SUPABASE_ANON_KEY || '';
      const stripeRes = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/make-server-57781ad9/stripe/create-invoice-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(anon ? { apikey: anon, Authorization: `Bearer ${anon}` } : {}),
        },
        body: JSON.stringify({
          invoice_id: invoiceNumber,
          amount_cents: Math.round(total * 100),
          description: items.map(i => i.description).join(', '),
          customer_email: toEmail,
          user_id: userIdFromActor(actor),
        }),
      });
      if (stripeRes.ok) {
        const stripeData = await stripeRes.json() as { url?: string; session_id?: string };
        paymentUrl = stripeData.url || undefined;
        stripeSessionId = stripeData.session_id || undefined;
      }
    } catch (e: any) {
      console.warn('[send_invoice] Stripe payment link creation failed (invoice will send without pay link):', e?.message);
    }

    const trackingPixelUrl = `https://www.syncscript.app/api/invoice/track?id=${encodeURIComponent(invoiceNumber)}&uid=${encodeURIComponent(userIdFromActor(actor))}`;
    invoiceData.paymentUrl = paymentUrl;
    invoiceData.trackingPixelUrl = trackingPixelUrl;
    const html = generateInvoiceHtml(invoiceData);

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return await finish(
        { tool: 'send_invoice', ok: false, error: 'email_not_configured' },
        JSON.stringify({ ok: false, error: 'Email service not configured' }),
      );
    }

    try {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'SyncScript Invoicing <invoices@syncscript.app>',
          to: [toEmail],
          subject: `Invoice ${invoiceNumber} — ${items.map(i => i.description).join(', ')} (${invoiceData.total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })})`,
          reply_to: senderEmail || 'support@syncscript.app',
          html,
        }),
      });

      if (!emailRes.ok) {
        const errText = await emailRes.text();
        return await finish(
          { tool: 'send_invoice', ok: false, error: `resend_${emailRes.status}: ${errText.slice(0, 200)}` },
          JSON.stringify({ ok: false, error: 'Failed to send invoice email' }),
        );
      }

      const emailData = await emailRes.json() as { id?: string };

      const uid = userIdFromActor(actor);
      const invoiceRecord = {
        id: invoiceNumber,
        status: 'sent' as const,
        to_email: toEmail,
        to_name: toName || undefined,
        items,
        subtotal,
        tax_percent: taxPercent > 0 ? taxPercent : undefined,
        tax_amount: taxAmount,
        total,
        notes: notes || undefined,
        due_date: dueDate || undefined,
        created_at: new Date().toISOString(),
        resend_email_id: emailData.id || undefined,
        stripe_payment_link: paymentUrl || undefined,
        stripe_session_id: stripeSessionId || undefined,
        _userId: uid,
      };

      if (actor.kind === 'jwt') {
        const anon = process.env.SUPABASE_ANON_KEY || '';
        fetchWithRetry(`${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/make-server-57781ad9/invoices`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(anon ? { apikey: anon } : {}),
            Authorization: `Bearer ${actor.user.accessToken}`,
          },
          body: JSON.stringify(invoiceRecord),
        }).catch((e) => console.error('[send_invoice] Failed to persist invoice to KV:', e?.message));
      } else {
        const secret = process.env.NEXUS_PHONE_EDGE_SECRET;
        const anon = process.env.SUPABASE_ANON_KEY || '';
        if (secret) {
          fetchWithRetry(`${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/make-server-57781ad9/invoices/phone-upsert`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(anon ? { apikey: anon, Authorization: `Bearer ${anon}` } : {}),
              'x-nexus-internal-secret': secret,
            },
            body: JSON.stringify({ userId: uid, invoice: invoiceRecord }),
          }).catch((e) => console.error('[send_invoice] phone-upsert failed:', e?.message));
        }
      }

      return await finish(
        {
          tool: 'send_invoice',
          ok: true,
          detail: {
            invoiceId: invoiceNumber,
            emailId: emailData.id,
            to: toEmail,
            total,
            itemCount: items.length,
          },
        },
        JSON.stringify({
          ok: true,
          invoice_id: invoiceNumber,
          sent_to: toEmail,
          total: invoiceData.total.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
          items: items.length,
          message: `Invoice ${invoiceNumber} sent to ${toEmail} for ${invoiceData.total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
        }),
      );
    } catch (e: any) {
      return await finish(
        { tool: 'send_invoice', ok: false, error: e?.message || 'send_failed' },
        JSON.stringify({ ok: false, error: 'Failed to send invoice' }),
      );
    }
  }

  if (name === 'enqueue_playbook') {
    if (actor.kind !== 'jwt') {
      return await finish(
        { tool: 'enqueue_playbook', ok: false, error: 'jwt_only' },
        JSON.stringify({ ok: false, error: 'Playbooks require a signed-in session' }),
      );
    }
    const slug = String(args.slug || '').trim();
    const context = (args.context && typeof args.context === 'object' ? args.context : {}) as Record<string, unknown>;
    if (!slug) {
      return await finish(
        { tool: 'enqueue_playbook', ok: false, error: 'missing_slug' },
        JSON.stringify({ ok: false, error: 'slug required' }),
      );
    }
    const sb = supabaseForUserJwt(actor.user);
    const { data: defn, error: e1 } = await sb.from('playbook_definitions').select('id').eq('slug', slug).maybeSingle();
    if (e1 || !defn?.id) {
      return await finish(
        { tool: 'enqueue_playbook', ok: false, error: 'unknown_slug' },
        JSON.stringify({ ok: false, error: 'Unknown playbook slug' }),
      );
    }
    const { data: defFull } = await sb.from('playbook_definitions').select('definition').eq('id', defn.id).single();
    const rawDef = defFull?.definition as { steps?: Array<{ id: string }> } | undefined;
    const firstStepId = rawDef?.steps?.[0]?.id || null;
    const correlationId = `pb_${randomUUID().replace(/-/g, '')}`;
    const { data: run, error: e2 } = await sb
      .from('playbook_runs')
      .insert({
        playbook_id: defn.id,
        user_id: actor.user.userId,
        status: 'running',
        correlation_id: correlationId,
        current_step_id: firstStepId,
        context,
      })
      .select('id,status,correlation_id,current_step_id')
      .single();
    if (e2 || !run) {
      return await finish(
        { tool: 'enqueue_playbook', ok: false, error: 'insert_failed', detail: { message: e2?.message } },
        JSON.stringify({ ok: false, error: 'Could not start playbook' }),
      );
    }
    return await finish(
      {
        tool: 'enqueue_playbook',
        ok: true,
        detail: {
          run_id: run.id,
          correlation_id: correlationId,
          status: run.status,
          current_step_id: run.current_step_id,
        },
      },
      JSON.stringify({
        ok: true,
        run_id: run.id,
        correlation_id: correlationId,
        message: 'Playbook run started. Progress is advanced by the concierge worker.',
      }),
    );
  }

  if (name === 'get_playbook_status') {
    if (actor.kind !== 'jwt') {
      return await finish(
        { tool: 'get_playbook_status', ok: false, error: 'jwt_only' },
        JSON.stringify({ ok: false, error: 'Requires signed-in session' }),
      );
    }
    const runId = String(args.run_id || '').trim();
    if (!runId) {
      return await finish(
        { tool: 'get_playbook_status', ok: false, error: 'missing_run_id' },
        JSON.stringify({ ok: false, error: 'run_id required' }),
      );
    }
    const sb = supabaseForUserJwt(actor.user);
    const { data: run, error } = await sb.from('playbook_runs').select('*').eq('id', runId).maybeSingle();
    if (error || !run) {
      return await finish(
        { tool: 'get_playbook_status', ok: false, error: 'not_found' },
        JSON.stringify({ ok: false, error: 'Run not found' }),
      );
    }
    return await finish(
      { tool: 'get_playbook_status', ok: true, detail: run as Record<string, unknown> },
      JSON.stringify({ ok: true, run }),
    );
  }

  if (name === 'cancel_playbook_run') {
    if (actor.kind !== 'jwt') {
      return await finish(
        { tool: 'cancel_playbook_run', ok: false, error: 'jwt_only' },
        JSON.stringify({ ok: false, error: 'Requires signed-in session' }),
      );
    }
    const runId = String(args.run_id || '').trim();
    if (!runId) {
      return await finish(
        { tool: 'cancel_playbook_run', ok: false, error: 'missing_run_id' },
        JSON.stringify({ ok: false, error: 'run_id required' }),
      );
    }
    const sb = supabaseForUserJwt(actor.user);
    const { data: updated, error } = await sb
      .from('playbook_runs')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', runId)
      .eq('user_id', actor.user.userId)
      .in('status', ['running', 'waiting'])
      .select('id,status')
      .maybeSingle();
    if (error || !updated) {
      return await finish(
        { tool: 'cancel_playbook_run', ok: false, error: 'cancel_failed' },
        JSON.stringify({ ok: false, error: 'Could not cancel run (wrong id or already finished).' }),
      );
    }
    return await finish(
      { tool: 'cancel_playbook_run', ok: true, detail: updated as Record<string, unknown> },
      JSON.stringify({ ok: true, message: 'Playbook run cancelled.' }),
    );
  }

  if (name === 'send_document_for_signature') {
    const title = String(args.title || '').trim();
    const content = String(args.content || '').trim();
    const signerEmail = String(args.signer_email || '').trim();
    const signerName = String(args.signer_name || '').trim();
    if (!title || !content || !signerEmail) {
      return await finish(
        { tool: 'send_document_for_signature', ok: false, error: 'missing_fields' },
        JSON.stringify({ ok: false, error: 'title, content, and signer_email required' }),
      );
    }
    const base =
      process.env.APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
      'https://www.syncscript.app';
    const secret = process.env.NEXUS_PHONE_EDGE_SECRET;
    if (!secret) {
      return await finish(
        { tool: 'send_document_for_signature', ok: false, error: 'not_configured' },
        JSON.stringify({ ok: false, error: 'Signing not configured' }),
      );
    }
    try {
      const r = await fetch(`${base.replace(/\/$/, '')}/api/firma/create-signing-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nexus-internal-secret': secret,
        },
        body: JSON.stringify({
          title,
          content,
          signer_email: signerEmail,
          signer_name: signerName || signerEmail,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        return await finish(
          { tool: 'send_document_for_signature', ok: false, error: 'firma_failed' },
          JSON.stringify({ ok: false, error: (data as any)?.error || 'Firma request failed' }),
        );
      }
      return await finish(
        { tool: 'send_document_for_signature', ok: true, detail: data as Record<string, unknown> },
        JSON.stringify({ ok: true, message: 'Signing request created. The signer will receive an email from our e-sign provider.' }),
      );
    } catch (e: any) {
      return await finish(
        { tool: 'send_document_for_signature', ok: false, error: e?.message || 'failed' },
        JSON.stringify({ ok: false, error: String(e?.message || 'failed') }),
      );
    }
  }

  const unknownTrace: NexusToolTraceEntry = { tool: name, ok: false, error: 'unknown_tool' };
  return await finish(unknownTrace, JSON.stringify({ ok: false, error: 'unknown tool' }));
}
