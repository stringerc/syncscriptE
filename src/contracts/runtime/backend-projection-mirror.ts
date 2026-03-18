import { supabase } from '../../utils/supabase/client';
import { publicAnonKey } from '../../utils/supabase/info';

export type ContractDomain = 'task' | 'goal' | 'schedule' | 'project';

export interface BackendProjectionEnvelope<TData = Record<string, unknown>> {
  projectionVersion: number;
  sourceEventCursor: number;
  generatedAt: string;
  data: TData;
}

const SHADOW_FLAG_KEY = 'syncscript:phase2b:shadow-projections';
const TASK_AUTHORITY_FLAG_KEY = 'syncscript:phase2b:authority:task:backend';
const SCHEDULE_AUTHORITY_FLAG_KEY = 'syncscript:phase2b:authority:schedule:backend';
const GOAL_AUTHORITY_FLAG_KEY = 'syncscript:phase2b:authority:goal:backend';
const PROJECT_AUTHORITY_FLAG_KEY = 'syncscript:phase2b:authority:project:backend';

function readShadowFlagFromStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = String(window.localStorage.getItem(SHADOW_FLAG_KEY) || '').trim().toLowerCase();
    return stored === '1' || stored === 'true' || stored === 'on';
  } catch {
    return false;
  }
}

function readAuthorityFallbackFlagFromStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const task = String(window.localStorage.getItem(TASK_AUTHORITY_FLAG_KEY) || '').trim().toLowerCase();
    const schedule = String(window.localStorage.getItem(SCHEDULE_AUTHORITY_FLAG_KEY) || '').trim().toLowerCase();
    const goal = String(window.localStorage.getItem(GOAL_AUTHORITY_FLAG_KEY) || '').trim().toLowerCase();
    const project = String(window.localStorage.getItem(PROJECT_AUTHORITY_FLAG_KEY) || '').trim().toLowerCase();
    const truthy = new Set(['1', 'true', 'on']);
    return truthy.has(task) || truthy.has(schedule) || truthy.has(goal) || truthy.has(project);
  } catch {
    return false;
  }
}

export function isBackendProjectionShadowEnabled(): boolean {
  const envEnabled = String((import.meta as any)?.env?.VITE_PHASE2B_SHADOW_PROJECTIONS || '')
    .trim()
    .toLowerCase();
  if (envEnabled === '1' || envEnabled === 'true' || envEnabled === 'on') return true;
  const taskAuthorityEnv = String((import.meta as any)?.env?.VITE_PHASE2B_AUTHORITY_TASK_BACKEND || '')
    .trim()
    .toLowerCase();
  const scheduleAuthorityEnv = String((import.meta as any)?.env?.VITE_PHASE2B_AUTHORITY_SCHEDULE_BACKEND || '')
    .trim()
    .toLowerCase();
  const goalAuthorityEnv = String((import.meta as any)?.env?.VITE_PHASE2B_AUTHORITY_GOAL_BACKEND || '')
    .trim()
    .toLowerCase();
  const projectAuthorityEnv = String((import.meta as any)?.env?.VITE_PHASE2B_AUTHORITY_PROJECT_BACKEND || '')
    .trim()
    .toLowerCase();
  if (taskAuthorityEnv === '1' || taskAuthorityEnv === 'true' || taskAuthorityEnv === 'on') return true;
  if (scheduleAuthorityEnv === '1' || scheduleAuthorityEnv === 'true' || scheduleAuthorityEnv === 'on') return true;
  if (goalAuthorityEnv === '1' || goalAuthorityEnv === 'true' || goalAuthorityEnv === 'on') return true;
  if (projectAuthorityEnv === '1' || projectAuthorityEnv === 'true' || projectAuthorityEnv === 'on') return true;
  if (readAuthorityFallbackFlagFromStorage()) return true;
  return readShadowFlagFromStorage();
}

async function buildRuntimeAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token || publicAnonKey;
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    if (publicAnonKey) headers.Authorization = `Bearer ${publicAnonKey}`;
  }
  return headers;
}

export async function readBackendProjection<TData = Record<string, unknown>>(
  domain: ContractDomain,
  workspaceId = 'workspace-main',
): Promise<BackendProjectionEnvelope<TData> | null> {
  if (typeof window === 'undefined') return null;
  if (!isBackendProjectionShadowEnabled()) return null;
  const query = new URLSearchParams({
    resource: 'contract-runtime-projection',
    domain,
    workspaceId,
  });
  const response = await fetch(`/api/ai/insights?${query.toString()}`, {
    method: 'GET',
    headers: await buildRuntimeAuthHeaders(),
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as Record<string, unknown>;
  if (!payload || typeof payload !== 'object') return null;
  if (!('projectionVersion' in payload) || !('sourceEventCursor' in payload) || !('generatedAt' in payload)) {
    return null;
  }
  return payload as BackendProjectionEnvelope<TData>;
}

export async function writeBackendProjection(
  domain: ContractDomain,
  entities: Array<Record<string, unknown>>,
  workspaceId = 'workspace-main',
): Promise<BackendProjectionEnvelope<{ domain: ContractDomain; entities: Array<Record<string, unknown>> }> | null> {
  if (typeof window === 'undefined') return null;
  if (!isBackendProjectionShadowEnabled()) return null;
  const query = new URLSearchParams({
    resource: 'contract-runtime-projection',
  });
  const response = await fetch(`/api/ai/insights?${query.toString()}`, {
    method: 'PATCH',
    headers: await buildRuntimeAuthHeaders(),
    body: JSON.stringify({
      workspaceId,
      domain,
      entities: Array.isArray(entities) ? entities : [],
    }),
  });
  if (!response.ok) return null;
  return (await response.json()) as BackendProjectionEnvelope<{
    domain: ContractDomain;
    entities: Array<Record<string, unknown>>;
  }>;
}

export async function syncShadowTaskProjection(
  tasks: Array<Record<string, unknown>>,
  workspaceId = 'workspace-main',
): Promise<BackendProjectionEnvelope<{ domain: ContractDomain; entities: Array<Record<string, unknown>> }> | null> {
  if (!isBackendProjectionShadowEnabled()) return null;
  await writeBackendProjection('task', tasks, workspaceId);
  return readBackendProjection<{ domain: ContractDomain; entities: Array<Record<string, unknown>> }>(
    'task',
    workspaceId,
  );
}

export async function syncShadowGoalProjection(
  goals: Array<Record<string, unknown>>,
  workspaceId = 'workspace-main',
): Promise<BackendProjectionEnvelope<{ domain: ContractDomain; entities: Array<Record<string, unknown>> }> | null> {
  if (!isBackendProjectionShadowEnabled()) return null;
  await writeBackendProjection('goal', goals, workspaceId);
  return readBackendProjection<{ domain: ContractDomain; entities: Array<Record<string, unknown>> }>(
    'goal',
    workspaceId,
  );
}

export async function syncShadowScheduleProjection(
  events: Array<Record<string, unknown>>,
  workspaceId = 'workspace-main',
): Promise<BackendProjectionEnvelope<{ domain: ContractDomain; entities: Array<Record<string, unknown>> }> | null> {
  if (!isBackendProjectionShadowEnabled()) return null;
  await writeBackendProjection('schedule', events, workspaceId);
  return readBackendProjection<{ domain: ContractDomain; entities: Array<Record<string, unknown>> }>(
    'schedule',
    workspaceId,
  );
}

export async function syncShadowProjectProjection(
  projects: Array<Record<string, unknown>>,
  workspaceId = 'workspace-main',
): Promise<BackendProjectionEnvelope<{ domain: ContractDomain; entities: Array<Record<string, unknown>> }> | null> {
  if (!isBackendProjectionShadowEnabled()) return null;
  await writeBackendProjection('project', projects, workspaceId);
  return readBackendProjection<{ domain: ContractDomain; entities: Array<Record<string, unknown>> }>(
    'project',
    workspaceId,
  );
}
