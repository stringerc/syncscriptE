/**
 * Concierge playbook API — single Vercel function for /api/concierge/*
 * Routes: playbook (enqueue + status) | inbound-email | worker-tick
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedSupabaseUser } from '../_lib/auth';
import { handleConciergePlaybookTickHttp, processInboundConciergeEmail } from '../_lib/concierge-playbook-worker';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';
const ANON = process.env.SUPABASE_ANON_KEY || '';

function actionSegment(req: VercelRequest): string {
  const a = req.query.action;
  if (typeof a === 'string') return a;
  if (Array.isArray(a)) return a[0] || '';
  return '';
}

function requireCronOrWorkerSecret(req: VercelRequest, res: VercelResponse): boolean {
  const cron = process.env.CRON_SECRET;
  const alt = process.env.CONCIERGE_WORKER_SECRET;
  const auth = req.headers.authorization;
  const h = req.headers['x-concierge-worker-secret'];
  if (cron && auth === `Bearer ${cron}`) return true;
  if (alt && (auth === `Bearer ${alt}` || h === alt)) return true;
  res.status(401).json({ error: 'Unauthorized' });
  return false;
}

function requireInboundSecret(req: VercelRequest, res: VercelResponse): boolean {
  const expected = process.env.CONCIERGE_INBOUND_SECRET;
  if (!expected) {
    res.status(503).json({ error: 'inbound_not_configured' });
    return false;
  }
  const h = req.headers['x-concierge-inbound-secret'];
  if (h === expected) return true;
  res.status(401).json({ error: 'Unauthorized' });
  return false;
}

async function handlePlaybook(req: VercelRequest, res: VercelResponse): Promise<void> {
  const user = await getAuthenticatedSupabaseUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!SUPABASE_URL || !ANON) {
    res.status(503).json({ error: 'supabase_not_configured' });
    return;
  }

  const sb = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: `Bearer ${user.accessToken}` } },
  });

  if (req.method === 'GET') {
    const runId = typeof req.query.run_id === 'string' ? req.query.run_id : '';
    if (!runId) {
      res.status(400).json({ error: 'run_id required' });
      return;
    }
    const { data, error } = await sb.from('playbook_runs').select('*').eq('id', runId).maybeSingle();
    if (error || !data) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.status(200).json({ ok: true, run: data });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = (typeof req.body === 'object' && req.body ? req.body : {}) as Record<string, unknown>;
  const slug = String(body.slug || '').trim();
  const context = (body.context && typeof body.context === 'object' ? body.context : {}) as Record<string, unknown>;

  if (!slug) {
    res.status(400).json({ error: 'slug required' });
    return;
  }

  const { data: defn, error: e1 } = await sb.from('playbook_definitions').select('id').eq('slug', slug).maybeSingle();
  if (e1 || !defn?.id) {
    res.status(404).json({ error: 'unknown_playbook_slug' });
    return;
  }

  const correlationId = `pb_${randomUUID().replace(/-/g, '')}`;
  const { data: defFull } = await sb.from('playbook_definitions').select('definition').eq('id', defn.id).single();
  const rawDef = defFull?.definition as { steps?: Array<{ id: string }> } | undefined;
  const firstStepId = rawDef?.steps?.[0]?.id || null;

  const { data: run, error: e2 } = await sb
    .from('playbook_runs')
    .insert({
      playbook_id: defn.id,
      user_id: user.userId,
      status: 'running',
      correlation_id: correlationId,
      current_step_id: firstStepId,
      context,
    })
    .select('id,status,correlation_id,current_step_id')
    .single();

  if (e2 || !run) {
    res.status(500).json({ error: 'enqueue_failed', detail: e2?.message });
    return;
  }

  res.status(200).json({
    ok: true,
    run_id: run.id,
    correlation_id: correlationId,
    status: run.status,
    current_step_id: run.current_step_id,
  });
}

async function handleInboundEmail(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!requireInboundSecret(req, res)) return;

  const body = (typeof req.body === 'object' && req.body ? req.body : {}) as Record<string, unknown>;
  const correlation_id = String(body.correlation_id || '').trim();
  const raw_body = String(body.raw_body ?? body.body ?? '');
  const subject = String(body.subject ?? '');

  if (!correlation_id || !raw_body) {
    res.status(400).json({ error: 'correlation_id and raw_body required' });
    return;
  }

  const out = await processInboundConciergeEmail({ correlation_id, subject, raw_body });
  res.status(200).json({ ok: true, ...out });
}

async function handleWorkerTick(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!requireCronOrWorkerSecret(req, res)) return;
  await handleConciergePlaybookTickHttp(req, res);
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const action = actionSegment(req);
  switch (action) {
    case 'playbook':
      return handlePlaybook(req, res);
    case 'inbound-email':
      return handleInboundEmail(req, res);
    case 'worker-tick':
      return handleWorkerTick(req, res);
    default:
      res.status(404).json({ error: 'Unknown concierge route' });
  }
}

export { runConciergePlaybookTick } from '../_lib/concierge-playbook-worker';
