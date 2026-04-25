/**
 * Agent runs + run-detail data hooks.
 *
 * - `useAgentRuns()` — list of recent runs for the current user (Tasks panel).
 * - `useAgentRunDetail(runId)` — single run with steps + messages, live via Realtime.
 * - `useStartAgentRun()` — POST /api/agent/start mutation.
 * - `useAgentRunControls(runId)` — cancel / interject / approve.
 *
 * Realtime: subscribes to inserts on `agent_run_steps` filtered by run_id.
 * Falls back to polling every 4s if the channel isn't established within 8s.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const supa = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  { auth: { persistSession: false } },
);

export type AgentRunStatus = 'queued' | 'running' | 'waiting_user' | 'paused' | 'done' | 'failed' | 'cancelled';

export interface AgentRun {
  id: string;
  goal_text: string;
  status: AgentRunStatus;
  project_id: string | null;
  provider: string | null;
  model: string | null;
  steps_executed: number;
  total_cost_cents: number;
  started_at: string | null;
  completed_at: string | null;
  error_text: string | null;
  summary: string | null;
  pause_reason: string | null;
  created_at: string;
}

export interface AgentRunStep {
  id: string;
  step_index: number;
  kind: 'thought' | 'browser_action' | 'tool_call' | 'screenshot' | 'user_interjection' | 'agent_message' | 'approval_request' | 'error';
  payload: Record<string, unknown>;
  screenshot_b64: string | null;
  cost_cents: number;
  created_at: string;
}

export interface AgentRunMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  applied_at: string | null;
  created_at: string;
}

function authFetch(accessToken: string | null, url: string, init?: RequestInit) {
  return fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init?.headers || {}),
    },
  });
}

export function useAgentRuns(filter?: { projectId?: string | null }) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ['agent-runs', filter?.projectId ?? null],
    enabled: Boolean(accessToken),
    refetchInterval: 12_000,
    queryFn: async () => {
      const qs = filter?.projectId ? `?project_id=${encodeURIComponent(filter.projectId)}` : '';
      const res = await authFetch(accessToken!, `/api/agent/list${qs}`);
      if (!res.ok) throw new Error(`agent.list ${res.status}`);
      const json = (await res.json()) as { runs: AgentRun[] };
      return json.runs ?? [];
    },
  });
}

export function useAgentRunDetail(runId: string | null) {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supa.channel> | null>(null);

  const query = useQuery({
    queryKey: ['agent-run', runId],
    enabled: Boolean(runId && accessToken),
    refetchInterval: 5_000,
    queryFn: async () => {
      const res = await authFetch(accessToken!, `/api/agent/run?run_id=${encodeURIComponent(runId!)}`);
      if (!res.ok) throw new Error(`agent.run ${res.status}`);
      return (await res.json()) as { run: AgentRun; steps: AgentRunStep[]; messages: AgentRunMessage[] };
    },
  });

  useEffect(() => {
    if (!runId) return;
    if (channelRef.current) channelRef.current.unsubscribe();
    const ch = supa
      .channel(`agent-run:${runId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'agent_run_steps',
        filter: `run_id=eq.${runId}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ['agent-run', runId] });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'agent_runs',
        filter: `id=eq.${runId}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ['agent-run', runId] });
        qc.invalidateQueries({ queryKey: ['agent-runs'] });
      })
      .subscribe();
    channelRef.current = ch;
    return () => { ch.unsubscribe(); channelRef.current = null; };
  }, [runId, qc]);

  return query;
}

export function useStartAgentRun() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { goal: string; projectId?: string | null; provider?: string | null }) => {
      const res = await authFetch(accessToken!, '/api/agent/start', {
        method: 'POST',
        body: JSON.stringify({
          goal: input.goal,
          project_id: input.projectId ?? null,
          provider: input.provider ?? null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: string }).error || `agent.start ${res.status}`);
      return json as { runId: string; channelName: string; provider: string; isByok: boolean; runnerHandoff: 'started' | 'queued' | 'unreachable' };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-runs'] });
    },
  });
}

export function useAgentRunControls() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  const post = useCallback(async (action: 'cancel' | 'interject' | 'approve', body: Record<string, unknown>) => {
    const res = await authFetch(accessToken!, `/api/agent/${action}`, { method: 'POST', body: JSON.stringify(body) });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error((j as { error?: string }).error || `agent.${action} ${res.status}`);
    }
    qc.invalidateQueries({ queryKey: ['agent-runs'] });
    qc.invalidateQueries({ queryKey: ['agent-run', body.run_id] });
    return res.json();
  }, [accessToken, qc]);

  return useMemo(() => ({
    cancel: (runId: string) => post('cancel', { run_id: runId }),
    interject: (runId: string, content: string) => post('interject', { run_id: runId, content }),
    approve: (runId: string) => post('approve', { run_id: runId, decision: 'approve' }),
    decline: (runId: string) => post('approve', { run_id: runId, decision: 'decline' }),
  }), [post]);
}

export function useByokKeys() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ['byok-keys'],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      const res = await authFetch(accessToken!, '/api/agent/byok-list');
      if (!res.ok) throw new Error(`byok-list ${res.status}`);
      return ((await res.json()) as { keys: Array<Record<string, unknown>> }).keys ?? [];
    },
  });
  const set = useMutation({
    mutationFn: async (input: { provider: string; value: string; label?: string; default_model?: string; endpoint_url?: string; daily_cents_cap?: number }) => {
      const res = await authFetch(accessToken!, '/api/agent/byok-set', { method: 'POST', body: JSON.stringify(input) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error || `byok-set ${res.status}`);
      return j;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['byok-keys'] }),
  });
  const del = useMutation({
    mutationFn: async (provider: string) => {
      const res = await authFetch(accessToken!, '/api/agent/byok-delete', { method: 'POST', body: JSON.stringify({ provider }) });
      if (!res.ok) throw new Error(`byok-delete ${res.status}`);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['byok-keys'] }),
  });
  return { list, set, del };
}

export function useAutomationPolicy() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  const get = useQuery({
    queryKey: ['automation-policy'],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      const res = await authFetch(accessToken!, '/api/agent/policy');
      if (!res.ok) throw new Error(`policy ${res.status}`);
      return ((await res.json()) as { policy: Record<string, unknown> }).policy;
    },
  });
  const update = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const res = await authFetch(accessToken!, '/api/agent/policy', { method: 'POST', body: JSON.stringify(patch) });
      if (!res.ok) throw new Error(`policy.update ${res.status}`);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation-policy'] }),
  });
  return { get, update };
}
