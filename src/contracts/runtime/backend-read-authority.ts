import {
  readBackendProjection,
  type BackendProjectionEnvelope,
  type ContractDomain,
} from './backend-projection-mirror';

export type ReadAuthoritySurface = 'ai' | 'resonance';

const AI_READ_BACKEND_FLAG_KEY = 'syncscript:phase2b:authority:ai:read:backend';
const RESONANCE_READ_BACKEND_FLAG_KEY = 'syncscript:phase2b:authority:resonance:read:backend';
const AI_READ_STRICT_FLAG_KEY = 'syncscript:phase2b:authority:ai:read:strict';
const RESONANCE_READ_STRICT_FLAG_KEY = 'syncscript:phase2b:authority:resonance:read:strict';

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

export function isBackendReadAuthorityEnabled(surface: ReadAuthoritySurface): boolean {
  if (surface === 'ai') {
    return (
      readFlagFromEnv('VITE_PHASE2B_AUTHORITY_AI_READ_BACKEND') ||
      readFlagFromStorage(AI_READ_BACKEND_FLAG_KEY)
    );
  }
  return (
    readFlagFromEnv('VITE_PHASE2B_AUTHORITY_RESONANCE_READ_BACKEND') ||
    readFlagFromStorage(RESONANCE_READ_BACKEND_FLAG_KEY)
  );
}

export function isBackendReadAuthorityStrictModeEnabled(surface: ReadAuthoritySurface): boolean {
  if (surface === 'ai') {
    return (
      readFlagFromEnv('VITE_PHASE2B_AUTHORITY_AI_READ_STRICT') ||
      readFlagFromStorage(AI_READ_STRICT_FLAG_KEY)
    );
  }
  return (
    readFlagFromEnv('VITE_PHASE2B_AUTHORITY_RESONANCE_READ_STRICT') ||
    readFlagFromStorage(RESONANCE_READ_STRICT_FLAG_KEY)
  );
}

export interface ReadAuthorityRoutingSnapshot {
  aiReadBackendEnabled: boolean;
  resonanceReadBackendEnabled: boolean;
  aiReadStrictEnabled: boolean;
  resonanceReadStrictEnabled: boolean;
  aiReadBackendLocalKey: string;
  resonanceReadBackendLocalKey: string;
  aiReadStrictLocalKey: string;
  resonanceReadStrictLocalKey: string;
}

export function getReadAuthorityRoutingSnapshot(): ReadAuthorityRoutingSnapshot {
  return {
    aiReadBackendEnabled: isBackendReadAuthorityEnabled('ai'),
    resonanceReadBackendEnabled: isBackendReadAuthorityEnabled('resonance'),
    aiReadStrictEnabled: isBackendReadAuthorityStrictModeEnabled('ai'),
    resonanceReadStrictEnabled: isBackendReadAuthorityStrictModeEnabled('resonance'),
    aiReadBackendLocalKey: AI_READ_BACKEND_FLAG_KEY,
    resonanceReadBackendLocalKey: RESONANCE_READ_BACKEND_FLAG_KEY,
    aiReadStrictLocalKey: AI_READ_STRICT_FLAG_KEY,
    resonanceReadStrictLocalKey: RESONANCE_READ_STRICT_FLAG_KEY,
  };
}

export interface ReadAuthorityProvenance {
  surface: ReadAuthoritySurface;
  domain: ContractDomain;
  source: 'backend' | 'local';
  strictMode: boolean;
  backendEnabled: boolean;
  reason: string;
  checkedAt: string;
  projectionVersion: number | null;
  sourceEventCursor: number | null;
  generatedAt: string | null;
  guardLevel: 'none' | 'watch' | 'critical';
}

interface ExecuteReadAuthorityInput<TLocal, TResult> {
  surface: ReadAuthoritySurface;
  domain: ContractDomain;
  workspaceId?: string;
  readLocal: () => TLocal;
  mapLocal: (local: TLocal) => TResult;
  mapBackend?: (envelope: BackendProjectionEnvelope<Record<string, unknown>>) => TResult;
}

export interface ExecuteReadAuthorityResult<TResult> {
  data: TResult;
  provenance: ReadAuthorityProvenance;
}

function resolveGuardLevel(
  strictMode: boolean,
  backendEnabled: boolean,
  source: 'backend' | 'local',
): 'none' | 'watch' | 'critical' {
  if (!backendEnabled) return 'none';
  if (source === 'backend') return 'none';
  if (strictMode) return 'critical';
  return 'watch';
}

export async function executeReadAuthority<TLocal, TResult>(
  input: ExecuteReadAuthorityInput<TLocal, TResult>,
): Promise<ExecuteReadAuthorityResult<TResult>> {
  const workspaceId = input.workspaceId || 'workspace-main';
  const checkedAt = new Date().toISOString();
  const localValue = input.readLocal();
  const localData = input.mapLocal(localValue);
  const backendEnabled = isBackendReadAuthorityEnabled(input.surface);
  const strictMode = isBackendReadAuthorityStrictModeEnabled(input.surface);

  if (!backendEnabled) {
    return {
      data: localData,
      provenance: {
        surface: input.surface,
        domain: input.domain,
        source: 'local',
        strictMode,
        backendEnabled,
        reason: 'backend_read_authority_disabled',
        checkedAt,
        projectionVersion: null,
        sourceEventCursor: null,
        generatedAt: null,
        guardLevel: 'none',
      },
    };
  }

  const envelope = await readBackendProjection<Record<string, unknown>>(input.domain, workspaceId).catch(
    () => null,
  );
  const backendData = envelope
    ? input.mapBackend
      ? input.mapBackend(envelope)
      : ((Array.isArray((envelope.data as any)?.entities)
          ? (envelope.data as any).entities
          : []) as unknown as TResult)
    : null;

  if (backendData !== null) {
    return {
      data: backendData,
      provenance: {
        surface: input.surface,
        domain: input.domain,
        source: 'backend',
        strictMode,
        backendEnabled,
        reason: strictMode
          ? 'backend_read_authority_strict'
          : 'backend_read_authority_preferred',
        checkedAt,
        projectionVersion: envelope?.projectionVersion ?? null,
        sourceEventCursor: envelope?.sourceEventCursor ?? null,
        generatedAt: envelope?.generatedAt ?? null,
        guardLevel: resolveGuardLevel(strictMode, backendEnabled, 'backend'),
      },
    };
  }

  return {
    data: localData,
    provenance: {
      surface: input.surface,
      domain: input.domain,
      source: 'local',
      strictMode,
      backendEnabled,
      reason: strictMode
        ? 'backend_read_authority_strict_fallback_local'
        : 'backend_read_authority_fallback_local',
      checkedAt,
      projectionVersion: null,
      sourceEventCursor: null,
      generatedAt: null,
      guardLevel: resolveGuardLevel(strictMode, backendEnabled, 'local'),
    },
  };
}

export const READ_AUTHORITY_FLAG_KEYS = {
  aiReadBackend: AI_READ_BACKEND_FLAG_KEY,
  resonanceReadBackend: RESONANCE_READ_BACKEND_FLAG_KEY,
  aiReadStrict: AI_READ_STRICT_FLAG_KEY,
  resonanceReadStrict: RESONANCE_READ_STRICT_FLAG_KEY,
} as const;
