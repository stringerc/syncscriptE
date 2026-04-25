/**
 * Agent Mode dispatcher — single Vercel function for all /api/agent/* endpoints
 * (Hobby plan caps at 12 functions, so we consolidate by [action] segment).
 *
 * Endpoints (POST unless noted):
 *   GET  /api/agent/list              — recent runs for current user (Tasks panel)
 *   POST /api/agent/start             — begin a new agent run
 *   POST /api/agent/cancel            — request cancellation of a running run
 *   POST /api/agent/interject         — user mid-run message (text, no voice)
 *   POST /api/agent/approve           — approve a paused destructive action
 *   GET  /api/agent/run               — single run detail (steps + messages)
 *   POST /api/agent/byok-set          — create/rotate BYOK key
 *   GET  /api/agent/byok-list         — list metadata (no values) of user's BYOK keys
 *   POST /api/agent/byok-delete       — delete a BYOK row + vault entry
 *   GET  /api/agent/policy            — get current automation_policies row
 *   POST /api/agent/policy            — update tier / caps / lists
 *
 * All endpoints require an authenticated Supabase user; service-role lifts the
 * heavy work (vault writes, RPCs).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedSupabaseUser, validateAuth } from '../_lib/auth';
import {
  resolveAgentLLMConfig,
  type AgentLLMProvider,
} from '../_lib/agent-llm-adapter';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const AGENT_RUNNER_BASE_URL = process.env.AGENT_RUNNER_BASE_URL || '';
const AGENT_RUNNER_TOKEN = process.env.AGENT_RUNNER_TOKEN || process.env.NEXUS_PHONE_EDGE_SECRET || '';

const VALID_PROVIDERS: AgentLLMProvider[] = [
  'openrouter', 'gemini', 'openai', 'anthropic', 'groq', 'xai', 'mistral', 'ollama', 'custom_openai_compat',
];

function svc() {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
}

async function readJsonBody(req: VercelRequest): Promise<Record<string, unknown>> {
  if (req.body == null) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body) as Record<string, unknown>; } catch { return {}; }
  }
  if (typeof req.body === 'object') return req.body as Record<string, unknown>;
  return {};
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const raw = req.query.action;
  const action = (typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '').toLowerCase();
  if (!action) return res.status(400).json({ error: 'missing_action' });

  const isAuthed = await validateAuth(req, res);
  if (!isAuthed) return;
  const user = await getAuthenticatedSupabaseUser(req);
  if (!user) return res.status(401).json({ error: 'auth_required' });
  const userId = user.userId;

  const sb = svc();
  if (!sb) return res.status(500).json({ error: 'service_role_not_configured' });

  switch (action) {
    case 'list':            return handleList(sb, userId, req, res);
    case 'run':             return handleRunDetail(sb, userId, req, res);
    case 'start':           return handleStart(sb, userId, req, res);
    case 'cancel':          return handleCancel(sb, userId, req, res);
    case 'interject':       return handleInterject(sb, userId, req, res);
    case 'approve':         return handleApprove(sb, userId, req, res);
    case 'byok-list':       return handleByokList(sb, userId, req, res);
    case 'byok-set':        return handleByokSet(sb, userId, req, res);
    case 'byok-delete':     return handleByokDelete(sb, userId, req, res);
    case 'policy':          return handlePolicy(sb, userId, req, res);
    default:
      return res.status(404).json({ error: `unknown_action: ${action}` });
  }
}

// ─────────────────────────────────────────────────────────────────────
// LIST + RUN DETAIL
// ─────────────────────────────────────────────────────────────────────

async function handleList(sb: any, userId: string, req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  const projectId = typeof req.query.project_id === 'string' ? req.query.project_id : null;
  let query = sb
    .from('agent_runs')
    .select('id, goal_text, status, project_id, provider, model, steps_executed, total_cost_cents, started_at, completed_at, error_text, summary, created_at, pause_reason')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (projectId) query = query.eq('project_id', projectId);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ runs: data ?? [] });
}

async function handleRunDetail(sb: any, userId: string, req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  const runId = typeof req.query.run_id === 'string' ? req.query.run_id : '';
  if (!runId) return res.status(400).json({ error: 'run_id_required' });

  const [run, steps, messages] = await Promise.all([
    sb.from('agent_runs').select('*').eq('id', runId).eq('user_id', userId).maybeSingle(),
    sb.from('agent_run_steps').select('id, step_index, kind, payload, screenshot_b64, cost_cents, created_at')
      .eq('run_id', runId).order('step_index', { ascending: true }).limit(500),
    sb.from('agent_run_messages').select('id, role, content, applied_at, created_at')
      .eq('run_id', runId).order('created_at', { ascending: true }).limit(200),
  ]);
  if (run.error || !run.data) return res.status(404).json({ error: 'run_not_found' });
  return res.status(200).json({ run: run.data, steps: steps.data ?? [], messages: messages.data ?? [] });
}

// ─────────────────────────────────────────────────────────────────────
// START / CANCEL / INTERJECT / APPROVE
// ─────────────────────────────────────────────────────────────────────

async function handleStart(sb: any, userId: string, req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const body = await readJsonBody(req);

  const goalText = String(body.goal || body.goal_text || '').trim();
  if (!goalText || goalText.length < 4) return res.status(400).json({ error: 'goal_required' });
  if (goalText.length > 2000) return res.status(400).json({ error: 'goal_too_long' });

  const projectId = typeof body.project_id === 'string' && body.project_id.length === 36 ? body.project_id : null;
  const preferProvider = typeof body.provider === 'string' ? (body.provider as AgentLLMProvider) : null;

  const { data: quota, error: quotaErr } = await sb.rpc('check_agent_run_quota', { p_user_id: userId });
  if (quotaErr) return res.status(500).json({ error: 'quota_check_failed', detail: quotaErr.message });
  if (quota && (quota as Record<string, unknown>).allowed === false) {
    return res.status(429).json({ error: 'quota_exceeded', reason: (quota as Record<string, unknown>).reason, detail: quota });
  }

  const cfgOrErr = await resolveAgentLLMConfig(userId, preferProvider);
  if ('error' in cfgOrErr) return res.status(503).json({ error: 'llm_config_unavailable', detail: cfgOrErr.error });

  const { data: inserted, error: insErr } = await sb
    .from('agent_runs')
    .insert({
      user_id: userId,
      project_id: projectId,
      goal_text: goalText,
      status: 'queued',
      provider: cfgOrErr.provider,
      model: cfgOrErr.model,
      uses_specialized_cu: cfgOrErr.provider === 'anthropic',
      tier_at_start: (quota as Record<string, unknown>)?.tier ?? 'A',
    })
    .select('id')
    .single();
  if (insErr) return res.status(500).json({ error: 'insert_failed', detail: insErr.message });
  const runId = (inserted as { id: string }).id;

  let runnerHandoff: 'started' | 'queued' | 'unreachable' = 'queued';
  if (AGENT_RUNNER_BASE_URL && AGENT_RUNNER_TOKEN) {
    try {
      const resp = await fetch(`${AGENT_RUNNER_BASE_URL.replace(/\/$/, '')}/v1/runs/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AGENT_RUNNER_TOKEN}` },
        body: JSON.stringify({ run_id: runId }),
        signal: AbortSignal.timeout(8000),
      });
      runnerHandoff = resp.ok ? 'started' : 'queued';
    } catch (e) {
      console.warn('[agent.start] runner unreachable:', e instanceof Error ? e.message : e);
      runnerHandoff = 'unreachable';
    }
  }

  return res.status(200).json({
    runId,
    channelName: `agent-run:${runId}`,
    provider: cfgOrErr.label,
    isByok: cfgOrErr.isByok,
    runnerHandoff,
  });
}

async function handleCancel(sb: any, userId: string, req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const body = await readJsonBody(req);
  const runId = String(body.run_id || '');
  if (!runId) return res.status(400).json({ error: 'run_id_required' });
  const { error } = await sb
    .from('agent_runs')
    .update({ cancel_requested: true })
    .eq('id', runId)
    .eq('user_id', userId);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
}

async function handleInterject(sb: any, userId: string, req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const body = await readJsonBody(req);
  const runId = String(body.run_id || '');
  const content = String(body.content || '').trim();
  if (!runId) return res.status(400).json({ error: 'run_id_required' });
  if (!content || content.length > 1000) return res.status(400).json({ error: 'content_required_or_too_long' });

  const { data: run } = await sb.from('agent_runs').select('id').eq('id', runId).eq('user_id', userId).maybeSingle();
  if (!run) return res.status(404).json({ error: 'run_not_found' });

  const { error } = await sb.from('agent_run_messages').insert({ run_id: runId, role: 'user', content });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
}

async function handleApprove(sb: any, userId: string, req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const body = await readJsonBody(req);
  const runId = String(body.run_id || '');
  const decision = body.decision === 'approve' ? 'approve' : 'decline';
  if (!runId) return res.status(400).json({ error: 'run_id_required' });

  const { error } = await sb.from('agent_run_messages').insert({
    run_id: runId,
    role: 'user',
    content: decision === 'approve' ? '__APPROVED__' : '__DECLINED__',
  });
  if (error) return res.status(500).json({ error: error.message });

  if (decision === 'decline') {
    await sb.from('agent_runs').update({ cancel_requested: true }).eq('id', runId).eq('user_id', userId);
  }
  return res.status(200).json({ ok: true });
}

// ─────────────────────────────────────────────────────────────────────
// BYOK
// ─────────────────────────────────────────────────────────────────────

async function handleByokList(sb: any, userId: string, req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  const { data, error } = await sb
    .from('byok_keys')
    .select('id, provider, default_model, label, last4, active, created_at, rotated_at, endpoint_url, daily_cents_cap, daily_cents_spent')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ keys: data ?? [] });
}

async function handleByokSet(sb: any, userId: string, req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const body = await readJsonBody(req);
  const provider = String(body.provider || '');
  const value = String(body.value || '');
  const label = body.label ? String(body.label).slice(0, 80) : null;
  const defaultModel = body.default_model ? String(body.default_model).slice(0, 200) : null;
  const endpointUrl = body.endpoint_url ? String(body.endpoint_url).slice(0, 400) : null;
  const dailyCentsCap = typeof body.daily_cents_cap === 'number' ? Math.max(0, Math.min(10_000, body.daily_cents_cap)) : null;

  if (!VALID_PROVIDERS.includes(provider as AgentLLMProvider)) {
    return res.status(400).json({ error: 'invalid_provider' });
  }
  if (!value || value.length < 8 || value.length > 4096) {
    return res.status(400).json({ error: 'invalid_key' });
  }
  if (provider === 'custom_openai_compat' && !endpointUrl) {
    return res.status(400).json({ error: 'endpoint_url_required_for_custom' });
  }

  const { data, error } = await sb.rpc('admin_seed_byok_key', {
    p_user_id: userId,
    p_provider: provider,
    p_value: value,
    p_label: label,
    p_default_model: defaultModel,
    p_endpoint_url: endpointUrl,
    p_daily_cents_cap: dailyCentsCap,
  });
  if (error) return res.status(500).json({ error: 'byok_seed_failed', detail: error.message });
  return res.status(200).json({ ok: true, id: data });
}

async function handleByokDelete(sb: any, userId: string, req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const body = await readJsonBody(req);
  const provider = String(body.provider || '');
  if (!VALID_PROVIDERS.includes(provider as AgentLLMProvider)) {
    return res.status(400).json({ error: 'invalid_provider' });
  }
  // Drop the metadata row; vault entry lingers but is unreachable without metadata. We could also
  // explicitly delete the vault row, but that requires another SECURITY DEFINER helper; metadata
  // delete is enough for adapter resolution to skip it.
  const { error } = await sb.from('byok_keys').delete().eq('user_id', userId).eq('provider', provider);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
}

// ─────────────────────────────────────────────────────────────────────
// POLICY (tier + caps + lists)
// ─────────────────────────────────────────────────────────────────────

async function handlePolicy(sb: any, userId: string, req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const { data, error } = await sb.from('automation_policies').select('*').eq('user_id', userId).maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) {
      // Lazy-create with defaults
      const { data: inserted } = await sb.from('automation_policies').insert({ user_id: userId }).select('*').single();
      return res.status(200).json({ policy: inserted });
    }
    return res.status(200).json({ policy: data });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const body = await readJsonBody(req);
  const updates: Record<string, unknown> = {};
  if (body.tier && ['A', 'B', 'C', 'D'].includes(body.tier as string)) updates.tier = body.tier;
  if (typeof body.daily_run_cap === 'number') updates.daily_run_cap = Math.max(0, Math.min(100, body.daily_run_cap));
  if (typeof body.daily_step_cap === 'number') updates.daily_step_cap = Math.max(0, Math.min(5000, body.daily_step_cap));
  if (typeof body.daily_cost_cents_cap === 'number') updates.daily_cost_cents_cap = Math.max(0, Math.min(50000, body.daily_cost_cents_cap));
  if (typeof body.per_run_step_cap === 'number') updates.per_run_step_cap = Math.max(0, Math.min(500, body.per_run_step_cap));
  if (typeof body.per_run_cost_cents_cap === 'number') updates.per_run_cost_cents_cap = Math.max(0, Math.min(5000, body.per_run_cost_cents_cap));
  if (Array.isArray(body.trusted_sites)) updates.trusted_sites = (body.trusted_sites as unknown[]).map(String).slice(0, 100);
  if (Array.isArray(body.blocked_sites)) updates.blocked_sites = (body.blocked_sites as unknown[]).map(String).slice(0, 100);
  if (typeof body.agent_paused === 'boolean') updates.agent_paused = body.agent_paused;
  if (body.paused_reason !== undefined) updates.paused_reason = body.paused_reason ? String(body.paused_reason).slice(0, 200) : null;

  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'nothing_to_update' });

  // Upsert (auto-create row if missing)
  const { data: existing } = await sb.from('automation_policies').select('user_id').eq('user_id', userId).maybeSingle();
  if (!existing) {
    await sb.from('automation_policies').insert({ user_id: userId, ...updates });
  } else {
    await sb.from('automation_policies').update(updates).eq('user_id', userId);
  }
  const { data: row } = await sb.from('automation_policies').select('*').eq('user_id', userId).maybeSingle();
  return res.status(200).json({ policy: row });
}
