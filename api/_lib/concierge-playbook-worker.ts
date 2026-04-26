/**
 * Concierge playbook worker — advances runs (nexus_tool, wait_email, third_party_call T3).
 * Uses service role for DB; nexus_tool steps use phone-edge execution path (userId).
 */

import { createHmac, createHash, timingSafeEqual } from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { executeNexusTool } from './nexus-actions-executor';
import { twilioCreateCall, getTwilioConfig } from '../phone/_helpers';
import { emitEvent } from './events';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export function serviceSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SERVICE_KEY);
}

export function signConciergeTpToken(tpCallId: string): string {
  const secret = process.env.NEXUS_PHONE_EDGE_SECRET || '';
  if (!secret) return '';
  return createHmac('sha256', secret).update(tpCallId).digest('hex');
}

export function verifyConciergeTpToken(tpCallId: string, token: string): boolean {
  const exp = signConciergeTpToken(tpCallId);
  if (!exp || !token) return false;
  try {
    return timingSafeEqual(Buffer.from(exp, 'utf8'), Buffer.from(token, 'utf8'));
  } catch {
    return false;
  }
}

export async function getThirdPartyCallScriptForTwiml(
  tpCallId: string,
): Promise<{ script: string; recording_disclosure: boolean } | null> {
  const sb = serviceSupabase();
  if (!sb) return null;
  const { data } = await sb.from('third_party_calls').select('template_snapshot').eq('id', tpCallId).maybeSingle();
  const snap = data?.template_snapshot as Record<string, unknown> | undefined;
  if (!snap) return null;
  return {
    script: String(snap.script || ''),
    recording_disclosure: snap.recording_disclosure === true,
  };
}

type DefStep = {
  id: string;
  type: string;
  tool?: string;
  map?: Record<string, string>;
  template_id?: string;
  requires_tier?: number;
  timeout_hours?: number;
  expectation_id?: string;
};

type PlaybookDefJson = {
  version?: number;
  inputs?: Array<{ id: string; type: string; required?: boolean }>;
  steps: DefStep[];
  on_failure?: { type: string; title: string };
};

type DefWithTier = PlaybookDefJson & { max_tier: number };

function parseDefinition(raw: unknown): PlaybookDefJson | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const steps = o.steps;
  if (!Array.isArray(steps) || steps.length === 0) return null;
  return { ...o, steps: steps as DefStep[] } as PlaybookDefJson;
}

function applyMap(map: Record<string, string> | undefined, context: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!map) return out;
  for (const [k, v] of Object.entries(map)) {
    if (typeof v === 'string') {
      out[k] = v.replace(/\{\{(\w+)\}\}/g, (_, key) => String(context[key] ?? ''));
    } else {
      out[k] = v;
    }
  }
  return out;
}

async function audit(
  sb: SupabaseClient,
  actor: string,
  action: string,
  entity: string,
  entityId: string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await sb.from('playbook_audit_events').insert({
      actor,
      action,
      entity,
      entity_id: entityId,
      metadata: metadata ?? null,
    });
  } catch (e) {
    console.warn('[concierge] audit insert failed', e);
  }
}

async function advanceRun(
  sb: SupabaseClient,
  runId: string,
  def: DefWithTier,
  currentStepId: string,
  userId: string,
): Promise<void> {
  const idx = def.steps.findIndex((s) => s.id === currentStepId);
  if (idx < 0) return;
  const next = def.steps[idx + 1];
  if (!next) {
    await sb
      .from('playbook_runs')
      .update({ status: 'completed', current_step_id: currentStepId, updated_at: new Date().toISOString() })
      .eq('id', runId);
    await audit(sb, 'worker', 'run_completed', 'playbook_run', runId, { user_id: userId });
    await emitEvent({
      userId,
      eventType: 'playbook.run.succeeded',
      eventKey: runId,
      payload: { run_id: runId, final_step_id: currentStepId },
    });
    return;
  }
  await sb
    .from('playbook_runs')
    .update({ status: 'running', current_step_id: next.id, updated_at: new Date().toISOString() })
    .eq('id', runId);
  await emitEvent({
    userId,
    eventType: 'playbook.run.step.completed',
    eventKey: `${runId}:${currentStepId}`,
    payload: { run_id: runId, completed_step_id: currentStepId, next_step_id: next.id },
  });
}

async function failRun(sb: SupabaseClient, runId: string, message: string, userId: string): Promise<void> {
  await sb
    .from('playbook_runs')
    .update({ status: 'failed', error: message.slice(0, 2000), updated_at: new Date().toISOString() })
    .eq('id', runId);
  await audit(sb, 'worker', 'run_failed', 'playbook_run', runId, { message, user_id: userId });
  await emitEvent({
    userId,
    eventType: 'playbook.run.failed',
    eventKey: runId,
    payload: { run_id: runId, error: message.slice(0, 500) },
  });
}

async function upsertStepDone(sb: SupabaseClient, runId: string, stepId: string): Promise<void> {
  const now = new Date().toISOString();
  await sb.from('playbook_steps').upsert(
    {
      run_id: runId,
      step_id: stepId,
      state: 'done',
      started_at: now,
      finished_at: now,
    },
    { onConflict: 'run_id,step_id' },
  );
}

function templateSnapshotFor(id: string): Record<string, unknown> {
  if (id === 'venue_reservation_v1') {
    return {
      template_id: 'venue_reservation_v1',
      script:
        'Hello. This is an automated call placed through SyncScript regarding a reservation inquiry. ' +
        'If you can hear this message, please hold briefly or leave availability after the tone. Thank you.',
      recording_disclosure: true,
    };
  }
  return { template_id: id, script: 'Automated SyncScript third-party call.', recording_disclosure: true };
}

async function handleNexusToolStep(
  sb: SupabaseClient,
  run: { id: string; user_id: string; context: Record<string, unknown> | null },
  def: DefWithTier,
  step: DefStep,
): Promise<void> {
  const tool = String(step.tool || '').trim();
  if (!tool) {
    await failRun(sb, run.id, 'nexus_tool_missing_tool', run.user_id);
    return;
  }
  const merged = applyMap(step.map, run.context || {});
  const { trace, toolMessage } = await executeNexusTool(
    tool,
    JSON.stringify(merged),
    { kind: 'phone', userId: run.user_id },
    { surface: 'text', requestId: run.id },
  );
  if (!trace.ok) {
    await failRun(sb, run.id, trace.error || 'nexus_tool_failed', run.user_id);
    return;
  }
  await upsertStepDone(sb, run.id, step.id);
  await audit(sb, 'worker', 'nexus_tool_ok', 'playbook_run', run.id, {
    tool,
    detail: trace.detail ?? null,
    preview: toolMessage.slice(0, 200),
  });
  await advanceRun(sb, run.id, def, step.id, run.user_id);
}

async function handleWaitEmailSetup(
  sb: SupabaseClient,
  run: {
    id: string;
    user_id: string;
    correlation_id: string;
    context: Record<string, unknown> | null;
  },
  _def: DefWithTier,
  step: DefStep,
): Promise<void> {
  const hours = typeof step.timeout_hours === 'number' ? step.timeout_hours : 72;
  const timeoutAt = new Date(Date.now() + hours * 3600 * 1000).toISOString();

  const { data: existing } = await sb
    .from('email_expectations')
    .select('id,status')
    .eq('run_id', run.id)
    .eq('pattern', run.correlation_id)
    .maybeSingle();

  if (!existing) {
    await sb.from('email_expectations').insert({
      run_id: run.id,
      match_mode: 'subject_token',
      pattern: run.correlation_id,
      timeout_at: timeoutAt,
      status: 'open',
    });
    await audit(sb, 'worker', 'email_expectation_created', 'playbook_run', run.id, { pattern: run.correlation_id });
  }

  await sb
    .from('playbook_runs')
    .update({ status: 'waiting', updated_at: new Date().toISOString() })
    .eq('id', run.id);
}

async function checkEmailWaitTimeout(
  sb: SupabaseClient,
  run: { id: string; user_id: string; correlation_id: string },
  step: DefStep,
  def: DefWithTier,
): Promise<void> {
  const { data: exp } = await sb
    .from('email_expectations')
    .select('id,status,timeout_at')
    .eq('run_id', run.id)
    .eq('pattern', run.correlation_id)
    .maybeSingle();

  if (!exp || exp.status !== 'open') return;

  if (new Date(exp.timeout_at as string).getTime() <= Date.now()) {
    await sb.from('email_expectations').update({ status: 'expired' }).eq('id', exp.id);
    const title = def.on_failure?.title || 'Playbook email wait expired';
    if (def.on_failure?.type === 'create_task') {
      await executeNexusTool(
        'create_task',
        JSON.stringify({ title }),
        { kind: 'phone', userId: run.user_id },
        { surface: 'text', requestId: run.id },
      );
    }
    await failRun(sb, run.id, 'email_wait_expired', run.user_id);
  }
}

async function handleThirdPartyCall(
  sb: SupabaseClient,
  run: { id: string; user_id: string; context: Record<string, unknown> | null; current_step_id: string | null },
  def: DefWithTier,
  step: DefStep,
): Promise<void> {
  if (step.requires_tier != null && step.requires_tier > def.max_tier) {
    await failRun(sb, run.id, 'tier_denied', run.user_id);
    return;
  }

  const rawPhone = String(run.context?.venue_phone ?? run.context?.target_phone ?? '').trim();
  const e164 = rawPhone.startsWith('+') ? rawPhone : rawPhone ? `+${rawPhone.replace(/\D/g, '')}` : '';
  if (!e164 || e164.length < 8) {
    await failRun(sb, run.id, 'missing_venue_phone', run.user_id);
    return;
  }

  const templateId = String(step.template_id || 'venue_reservation_v1');

  const { data: existing } = await sb
    .from('third_party_calls')
    .select('id,status,twilio_call_sid')
    .eq('run_id', run.id)
    .eq('step_id', step.id)
    .maybeSingle();

  if (existing?.twilio_call_sid) {
    return;
  }

  if (existing && existing.status === 'queued' && !existing.twilio_call_sid) {
    return;
  }

  const snap = templateSnapshotFor(templateId);
  const { data: inserted, error: insErr } = await sb
    .from('third_party_calls')
    .insert({
      run_id: run.id,
      step_id: step.id,
      to_e164: e164,
      template_id: templateId,
      template_snapshot: snap,
      status: 'queued',
    })
    .select('id')
    .single();

  if (insErr || !inserted?.id) {
    console.error('[concierge] third_party insert', insErr);
    await failRun(sb, run.id, 'tp_row_failed', run.user_id);
    return;
  }

  const tpId = inserted.id as string;
  const token = signConciergeTpToken(tpId);
  const config = getTwilioConfig();
  const base = config.appUrl.replace(/\/$/, '');
  const twimlUrl = `${base}/api/phone/twiml?handler=concierge-third-party&tp=${encodeURIComponent(tpId)}&token=${encodeURIComponent(token)}`;
  const statusCallbackUrl = `${base}/api/phone/twiml?handler=concierge-tp-status&tp=${encodeURIComponent(tpId)}`;

  const result = await twilioCreateCall({
    to: e164,
    twimlUrl,
    statusCallbackUrl,
    timeout: 45,
  });

  if (!result.success) {
    await sb
      .from('third_party_calls')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', tpId);
    await failRun(sb, run.id, result.error || 'twilio_failed', run.user_id);
    return;
  }

  await sb
    .from('third_party_calls')
    .update({
      twilio_call_sid: result.callSid,
      status: 'ringing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', tpId);

  await sb
    .from('playbook_runs')
    .update({ status: 'waiting', updated_at: new Date().toISOString() })
    .eq('id', run.id);

  await audit(sb, 'worker', 'third_party_call_placed', 'playbook_run', run.id, {
    tp_id: tpId,
    call_sid: result.callSid,
  });
}

async function processOneRun(sb: SupabaseClient, run: Record<string, unknown>): Promise<void> {
  const runId = String(run.id);
  const userId = String(run.user_id);
  const playbookId = String(run.playbook_id);
  const correlationId = String(run.correlation_id);
  const status = String(run.status);
  const currentStepId = run.current_step_id ? String(run.current_step_id) : '';
  const context = (run.context && typeof run.context === 'object' ? run.context : {}) as Record<string, unknown>;

  const { data: defRow, error: dErr } = await sb
    .from('playbook_definitions')
    .select('id,definition,max_tier')
    .eq('id', playbookId)
    .single();

  if (dErr || !defRow) {
    await failRun(sb, runId, 'definition_missing', userId);
    return;
  }

  const def = parseDefinition(defRow.definition);
  if (!def) {
    await failRun(sb, runId, 'definition_invalid', userId);
    return;
  }

  const defWithTier = { ...def, max_tier: Number(defRow.max_tier ?? 0) };

  const steps = def.steps;
  const firstId = steps[0]?.id || '';
  const activeId = currentStepId || firstId;
  const step = steps.find((s) => s.id === activeId);
  if (!step) {
    await failRun(sb, runId, 'step_not_found', userId);
    return;
  }

  if (status === 'waiting') {
    if (step.type === 'wait_email') {
      await checkEmailWaitTimeout(sb, { id: runId, user_id: userId, correlation_id: correlationId }, step, defWithTier);
    }
    return;
  }

  if (status !== 'running') return;

  const { data: doneRow } = await sb
    .from('playbook_steps')
    .select('state')
    .eq('run_id', runId)
    .eq('step_id', step.id)
    .maybeSingle();

  if (doneRow?.state === 'done') {
    await advanceRun(sb, runId, defWithTier, step.id, userId);
    return;
  }

  switch (step.type) {
    case 'nexus_tool':
      await handleNexusToolStep(sb, { id: runId, user_id: userId, context }, defWithTier, step);
      break;
    case 'wait_email':
      await handleWaitEmailSetup(sb, { id: runId, user_id: userId, correlation_id: correlationId, context }, defWithTier, step);
      break;
    case 'third_party_call':
      await handleThirdPartyCall(
        sb,
        { id: runId, user_id: userId, context, current_step_id: activeId },
        defWithTier,
        step,
      );
      break;
    default:
      await failRun(sb, runId, `unknown_step:${step.type}`, userId);
  }
}

/**
 * Per-run claim lease. Two overlapping ticks (e.g. pg_cron firing every minute
 * while the previous tick hasn’t finished) must not advance the same run
 * concurrently. The `claim_next_playbook_runs` RPC atomically locks rows with
 * `FOR UPDATE SKIP LOCKED`, sets `claimed_at`, and returns them. On Supabase
 * projects where the RPC isn’t deployed yet we fall back to the plain select —
 * safe for a single-worker cadence.
 */
const CLAIM_LEASE_SECONDS = 120;
const CLAIM_BATCH_LIMIT = 30;

export async function runConciergePlaybookTick(): Promise<{ processed: number; errors: string[] }> {
  const sb = serviceSupabase();
  const errors: string[] = [];
  if (!sb) {
    return { processed: 0, errors: ['supabase_not_configured'] };
  }

  let runs: Array<Record<string, unknown>> = [];
  let usedClaim = false;
  const claim = await sb.rpc('claim_next_playbook_runs', {
    lease_seconds: CLAIM_LEASE_SECONDS,
    limit_n: CLAIM_BATCH_LIMIT,
  });

  if (!claim.error && Array.isArray(claim.data)) {
    runs = claim.data as Array<Record<string, unknown>>;
    usedClaim = true;
  } else {
    // Migration not applied yet — fall back to legacy select.
    const { data, error } = await sb
      .from('playbook_runs')
      .select('*')
      .in('status', ['running', 'waiting'])
      .order('updated_at', { ascending: true })
      .limit(CLAIM_BATCH_LIMIT);
    if (error) {
      return { processed: 0, errors: [error.message] };
    }
    runs = (data || []) as Array<Record<string, unknown>>;
  }

  let n = 0;
  for (const run of runs) {
    const runId = typeof run?.id === 'string' ? run.id : '';
    try {
      await processOneRun(sb, run);
      n += 1;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(msg);
      console.error('[concierge] process run', runId || '(unknown)', e);
    } finally {
      if (usedClaim && runId) {
        try {
          await sb.rpc('release_playbook_run_claim', { run_id: runId });
        } catch (releaseErr) {
          console.warn('[concierge] release claim failed', runId, releaseErr);
        }
      }
    }
  }

  return { processed: n, errors };
}

export async function processInboundConciergeEmail(params: {
  correlation_id: string;
  subject?: string;
  raw_body: string;
}): Promise<{ matched: boolean; run_id?: string }> {
  const sb = serviceSupabase();
  if (!sb) return { matched: false };

  const token = params.correlation_id.trim();
  if (!token) return { matched: false };

  const { data: runRow } = await sb.from('playbook_runs').select('id,user_id,status').eq('correlation_id', token).maybeSingle();

  if (!runRow?.id) return { matched: false };

  const runId = runRow.id as string;
  const userId = runRow.user_id as string;

  const { data: exp } = await sb
    .from('email_expectations')
    .select('id,status')
    .eq('run_id', runId)
    .eq('pattern', token)
    .maybeSingle();

  if (!exp || exp.status !== 'open') {
    return { matched: false, run_id: runId };
  }

  const raw = params.raw_body || '';
  const rawHash = createHash('sha256').update(raw, 'utf8').digest('hex');
  const subj = params.subject || '';
  const extracted = {
    subject_matched: subj.includes(token),
    confidence: subj.includes(token) || raw.includes(token) ? 0.9 : 0.5,
  };

  await sb.from('confirmation_evidence').insert({
    run_id: runId,
    source: 'email',
    raw_hash: rawHash,
    extracted,
  });

  await sb.from('email_expectations').update({ status: 'matched' }).eq('id', exp.id);

  await sb
    .from('playbook_runs')
    .update({ status: 'running', updated_at: new Date().toISOString() })
    .eq('id', runId);

  const { data: defRef } = await sb.from('playbook_runs').select('playbook_id,current_step_id').eq('id', runId).maybeSingle();

  const playbookId = defRef?.playbook_id ? String(defRef.playbook_id) : '';
  const { data: defRow } = playbookId
    ? await sb.from('playbook_definitions').select('definition,max_tier').eq('id', playbookId).maybeSingle()
    : { data: null };

  const parsed = parseDefinition(defRow?.definition);
  const stepId = String(defRef?.current_step_id || '');
  if (parsed && stepId) {
    await upsertStepDone(sb, runId, stepId);
    await advanceRun(sb, runId, { ...parsed, max_tier: Number(defRow?.max_tier ?? 0) }, stepId, userId);
  }

  await audit(sb, 'inbound_email', 'email_matched', 'playbook_run', runId, { user_id: userId });

  return { matched: true, run_id: runId };
}

export async function completeThirdPartyCallFromTwilio(tpCallId: string, callSid: string, callStatus: string): Promise<void> {
  const sb = serviceSupabase();
  if (!sb || !tpCallId) return;

  const { data: tp } = await sb
    .from('third_party_calls')
    .select('id,run_id,step_id,twilio_call_sid')
    .eq('id', tpCallId)
    .maybeSingle();

  if (!tp) return;

  const terminal =
    callStatus === 'completed' ||
    callStatus === 'canceled' ||
    callStatus === 'failed' ||
    callStatus === 'busy' ||
    callStatus === 'no-answer';
  if (!terminal) {
    return;
  }

  const ok = callStatus === 'completed';
  await sb
    .from('third_party_calls')
    .update({
      status: ok ? 'completed' : 'failed',
      twilio_call_sid: callSid || (tp.twilio_call_sid as string | undefined),
      updated_at: new Date().toISOString(),
    })
    .eq('id', tpCallId);

  const runId = String(tp.run_id);
  const stepId = String(tp.step_id || '');

  const { data: run } = await sb.from('playbook_runs').select('user_id,playbook_id').eq('id', runId).maybeSingle();
  const userId = run?.user_id ? String(run.user_id) : '';
  const playbookId = run?.playbook_id ? String(run.playbook_id) : '';

  if (!stepId || !userId || !playbookId) return;

  const { data: defRow } = await sb.from('playbook_definitions').select('definition,max_tier').eq('id', playbookId).maybeSingle();

  const parsed = parseDefinition(defRow?.definition);
  if (!parsed) return;

  const defWithTier: DefWithTier = { ...parsed, max_tier: Number(defRow?.max_tier ?? 0) };

  if (!ok) {
    await failRun(sb, runId, `call_status:${callStatus}`, userId);
    await audit(sb, 'twilio', 'tp_call_terminal', 'playbook_run', runId, {
      tp_id: tpCallId,
      call_sid: callSid,
      call_status: callStatus,
    });
    return;
  }

  await upsertStepDone(sb, runId, stepId);
  await advanceRun(sb, runId, defWithTier, stepId, userId);

  await audit(sb, 'twilio', 'tp_call_terminal', 'playbook_run', runId, {
    tp_id: tpCallId,
    call_sid: callSid,
    call_status: callStatus,
  });
}

/** HTTP handler for cron / manual tick */
export async function handleConciergePlaybookTickHttp(_req: VercelRequest, res: VercelResponse): Promise<void> {
  const out = await runConciergePlaybookTick();
  res.status(200).json({ ok: true, ...out });
}
