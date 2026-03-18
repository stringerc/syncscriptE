import type { ContractCommandResult } from '../core/command-contract';
import { supabase } from '../../utils/supabase/client';
import { publicAnonKey } from '../../utils/supabase/info';
type AuthorityDomain = 'task' | 'schedule' | 'goal' | 'project';
type ContractDomain = 'task' | 'goal' | 'schedule' | 'project';

interface BackendAuthorityCommandInput {
  domain: ContractDomain;
  commandType: string;
  payload: Record<string, unknown>;
  workspaceId?: string;
  actorId?: string;
  actorType?: 'human' | 'agent' | 'system';
}

const TASK_AUTHORITY_FLAG_KEY = 'syncscript:phase2b:authority:task:backend';
const SCHEDULE_AUTHORITY_FLAG_KEY = 'syncscript:phase2b:authority:schedule:backend';
const GOAL_AUTHORITY_FLAG_KEY = 'syncscript:phase2b:authority:goal:backend';
const PROJECT_AUTHORITY_FLAG_KEY = 'syncscript:phase2b:authority:project:backend';
const STRICT_MODE_FLAG_KEY = 'syncscript:phase2b:authority:strict';
const TASK_STRICT_FLAG_KEY = 'syncscript:phase2b:authority:task:strict';
const SCHEDULE_STRICT_FLAG_KEY = 'syncscript:phase2b:authority:schedule:strict';
const GOAL_STRICT_FLAG_KEY = 'syncscript:phase2b:authority:goal:strict';
const PROJECT_STRICT_FLAG_KEY = 'syncscript:phase2b:authority:project:strict';

export const AUTHORITY_ROUTING_FLAG_KEYS = {
  taskBackend: TASK_AUTHORITY_FLAG_KEY,
  scheduleBackend: SCHEDULE_AUTHORITY_FLAG_KEY,
  goalBackend: GOAL_AUTHORITY_FLAG_KEY,
  projectBackend: PROJECT_AUTHORITY_FLAG_KEY,
  strictGlobal: STRICT_MODE_FLAG_KEY,
  taskStrict: TASK_STRICT_FLAG_KEY,
  scheduleStrict: SCHEDULE_STRICT_FLAG_KEY,
  goalStrict: GOAL_STRICT_FLAG_KEY,
  projectStrict: PROJECT_STRICT_FLAG_KEY,
} as const;

function readFlagFromStorage(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = String(window.localStorage.getItem(key) || '').trim().toLowerCase();
    return stored === '1' || stored === 'true' || stored === 'on';
  } catch {
    return false;
  }
}

function readFlagFromEnv(key: string): boolean {
  const raw = String((import.meta as any)?.env?.[key] || '').trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'on';
}

function resolveActorId(): string {
  if (typeof window === 'undefined') return 'system';
  return (
    window.localStorage.getItem('syncscript_auth_user_id') ||
    window.localStorage.getItem('auth_user_id') ||
    'system'
  );
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

export function isBackendAuthorityEnabled(domain: AuthorityDomain): boolean {
  if (domain === 'task') {
    return readFlagFromEnv('VITE_PHASE2B_AUTHORITY_TASK_BACKEND') || readFlagFromStorage(TASK_AUTHORITY_FLAG_KEY);
  }
  if (domain === 'schedule') {
    return (
      readFlagFromEnv('VITE_PHASE2B_AUTHORITY_SCHEDULE_BACKEND') ||
      readFlagFromStorage(SCHEDULE_AUTHORITY_FLAG_KEY)
    );
  }
  if (domain === 'goal') {
    return (
      readFlagFromEnv('VITE_PHASE2B_AUTHORITY_GOAL_BACKEND') ||
      readFlagFromStorage(GOAL_AUTHORITY_FLAG_KEY)
    );
  }
  return (
    readFlagFromEnv('VITE_PHASE2B_AUTHORITY_PROJECT_BACKEND') ||
    readFlagFromStorage(PROJECT_AUTHORITY_FLAG_KEY)
  );
}

export function isBackendAuthorityStrictModeEnabled(domain?: AuthorityDomain): boolean {
  const globalStrict =
    readFlagFromEnv('VITE_PHASE2B_AUTHORITY_STRICT_MODE') || readFlagFromStorage(STRICT_MODE_FLAG_KEY);
  if (!domain) return globalStrict;
  if (domain === 'schedule') {
    return (
      globalStrict ||
      readFlagFromEnv('VITE_PHASE2B_AUTHORITY_SCHEDULE_STRICT') ||
      readFlagFromStorage(SCHEDULE_STRICT_FLAG_KEY)
    );
  }
  if (domain === 'goal') {
    return (
      globalStrict ||
      readFlagFromEnv('VITE_PHASE2B_AUTHORITY_GOAL_STRICT') ||
      readFlagFromStorage(GOAL_STRICT_FLAG_KEY)
    );
  }
  if (domain === 'project') {
    return (
      globalStrict ||
      readFlagFromEnv('VITE_PHASE2B_AUTHORITY_PROJECT_STRICT') ||
      readFlagFromStorage(PROJECT_STRICT_FLAG_KEY)
    );
  }
  return (
    globalStrict ||
    readFlagFromEnv('VITE_PHASE2B_AUTHORITY_TASK_STRICT') ||
    readFlagFromStorage(TASK_STRICT_FLAG_KEY)
  );
}

export interface AuthorityRoutingSnapshot {
  taskBackendEnabled: boolean;
  scheduleBackendEnabled: boolean;
  goalBackendEnabled: boolean;
  projectBackendEnabled: boolean;
  strictGlobalEnabled: boolean;
  strictTaskEnabled: boolean;
  strictScheduleEnabled: boolean;
  strictGoalEnabled: boolean;
  strictProjectEnabled: boolean;
  strictTaskLocalKey: string;
  strictScheduleLocalKey: string;
  strictGoalLocalKey: string;
  strictProjectLocalKey: string;
}

export function getAuthorityRoutingSnapshot(): AuthorityRoutingSnapshot {
  const strictGlobal =
    readFlagFromEnv('VITE_PHASE2B_AUTHORITY_STRICT_MODE') || readFlagFromStorage(STRICT_MODE_FLAG_KEY);
  return {
    taskBackendEnabled: isBackendAuthorityEnabled('task'),
    scheduleBackendEnabled: isBackendAuthorityEnabled('schedule'),
    goalBackendEnabled: isBackendAuthorityEnabled('goal'),
    projectBackendEnabled: isBackendAuthorityEnabled('project'),
    strictGlobalEnabled: strictGlobal,
    strictTaskEnabled: isBackendAuthorityStrictModeEnabled('task'),
    strictScheduleEnabled: isBackendAuthorityStrictModeEnabled('schedule'),
    strictGoalEnabled: isBackendAuthorityStrictModeEnabled('goal'),
    strictProjectEnabled: isBackendAuthorityStrictModeEnabled('project'),
    strictTaskLocalKey: TASK_STRICT_FLAG_KEY,
    strictScheduleLocalKey: SCHEDULE_STRICT_FLAG_KEY,
    strictGoalLocalKey: GOAL_STRICT_FLAG_KEY,
    strictProjectLocalKey: PROJECT_STRICT_FLAG_KEY,
  };
}

export async function sendBackendAuthorityCommand(
  input: BackendAuthorityCommandInput,
): Promise<{ ok: boolean; commandId?: string; error?: string }> {
  if (typeof window === 'undefined') return { ok: false, error: 'Window unavailable' };
  const body = {
    workspaceId: input.workspaceId || 'workspace-main',
    domain: input.domain,
    commandType: input.commandType,
    idempotencyKey: `phase2b:${input.domain}:${input.commandType}:${Date.now()}:${Math.random().toString(36).slice(2, 9)}`,
    actorId: input.actorId || resolveActorId(),
    actorType: input.actorType || 'human',
    payload: input.payload || {},
  };
  const response = await fetch('/api/ai/insights?resource=contract-runtime-command', {
    method: 'POST',
    headers: await buildRuntimeAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    return { ok: false, error: `Command failed (${response.status})` };
  }
  const data = (await response.json()) as Record<string, unknown>;
  return {
    ok: Boolean(data?.ok),
    commandId: typeof data?.commandId === 'string' ? data.commandId : undefined,
    error: typeof data?.error === 'string' ? data.error : undefined,
  };
}

interface ExecuteAuthorityRoutedCommandInput<TData = Record<string, unknown>> {
  domain: AuthorityDomain;
  commandType: string;
  workspaceId?: string;
  payload: Record<string, unknown>;
  runLocal: () => Promise<ContractCommandResult<TData>>;
  applyLocalOnBackendAccept?: boolean;
}

export async function executeAuthorityRoutedCommand<TData = Record<string, unknown>>(
  input: ExecuteAuthorityRoutedCommandInput<TData>,
): Promise<ContractCommandResult<TData>> {
  const backendEnabled = isBackendAuthorityEnabled(input.domain);
  if (!backendEnabled) return input.runLocal();

  const strictMode = isBackendAuthorityStrictModeEnabled(input.domain);
  const applyLocalOnBackendAccept = input.applyLocalOnBackendAccept !== false;

  if (strictMode) {
    const backend = await sendBackendAuthorityCommand({
      domain: input.domain,
      commandType: input.commandType,
      workspaceId: input.workspaceId,
      payload: input.payload,
    }).catch((error) => ({
      ok: false,
      error: error instanceof Error ? error.message : 'Backend command failed',
    }));

    if (backend.ok) {
      if (!applyLocalOnBackendAccept) {
        return {
          ok: true,
          commandId: backend.commandId || `backend-${input.commandType}-${Date.now()}`,
          errors: [],
          warnings: ['backend_authority_strict_accepted'],
        };
      }
      const localResult = await input.runLocal();
      return {
        ...localResult,
        warnings: [
          ...(localResult.warnings || []),
          `backend_authority_strict_accepted:${backend.commandId || 'no-command-id'}`,
        ],
      };
    }

    const fallback = await input.runLocal();
    return {
      ...fallback,
      warnings: [
        ...(fallback.warnings || []),
        `backend_authority_fallback_applied:${backend.error || 'unknown'}`,
      ],
    };
  }

  const localResult = await input.runLocal();
  if (!localResult.ok) return localResult;

  const backend = await sendBackendAuthorityCommand({
    domain: input.domain,
    commandType: input.commandType,
    workspaceId: input.workspaceId,
    payload: input.payload,
  }).catch((error) => ({
    ok: false,
    error: error instanceof Error ? error.message : 'Backend command failed',
  }));

  if (backend.ok) {
    return {
      ...localResult,
      warnings: [
        ...(localResult.warnings || []),
        `backend_authority_shadow_accepted:${backend.commandId || 'no-command-id'}`,
      ],
    };
  }

  return {
    ...localResult,
    warnings: [
      ...(localResult.warnings || []),
      `backend_authority_shadow_write_failed:${backend.error || 'unknown'}`,
    ],
  };
}
