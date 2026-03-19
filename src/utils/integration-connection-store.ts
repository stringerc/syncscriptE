import type { IntegrationConnector } from './integration-catalog';

const INTEGRATION_CONNECTIONS_KEY = 'syncscript:integration-connections:v1';

export type ConnectionHealth = 'healthy' | 'expiring' | 'error' | 'disconnected';

export interface IntegrationConnectionAccount {
  id: string;
  connectorId: string;
  connectorName: string;
  projectId: string;
  accountLabel: string;
  authType: 'oauth2' | 'api_key' | 'none';
  scopes: string[];
  health: ConnectionHealth;
  connectedAt: string;
  lastValidatedAt?: string;
  expiresAt?: string;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readAll(): IntegrationConnectionAccount[] {
  if (typeof window === 'undefined') return [];
  return safeParse<IntegrationConnectionAccount[]>(window.localStorage.getItem(INTEGRATION_CONNECTIONS_KEY), []);
}

function writeAll(next: IntegrationConnectionAccount[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(INTEGRATION_CONNECTIONS_KEY, JSON.stringify(next.slice(0, 500)));
  } catch {
    // non-blocking
  }
}

async function requestApi<T>(path: string, init: RequestInit = {}, accessToken?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (accessToken?.trim()) headers.Authorization = `Bearer ${accessToken.trim()}`;
  const response = await fetch(path, { ...init, headers });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function listIntegrationConnections(projectId: string): IntegrationConnectionAccount[] {
  const clean = String(projectId || '').trim();
  return readAll().filter((entry) => entry.projectId === clean);
}

export function connectIntegrationAccount(
  projectId: string,
  connector: IntegrationConnector,
  accountLabel?: string,
): IntegrationConnectionAccount {
  const now = new Date().toISOString();
  const next: IntegrationConnectionAccount = {
    id: `acc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    connectorId: connector.id,
    connectorName: connector.name,
    projectId: String(projectId || '').trim(),
    accountLabel: String(accountLabel || `${connector.name} Workspace Account`).trim(),
    authType: connector.authType || 'oauth2',
    scopes: Array.isArray(connector.defaultScopes) ? connector.defaultScopes : [],
    health: 'healthy',
    connectedAt: now,
    lastValidatedAt: now,
    expiresAt: connector.authType === 'oauth2' ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString() : undefined,
  };
  const current = readAll();
  writeAll([next, ...current]);
  return next;
}

export function updateIntegrationConnection(
  accountId: string,
  updates: Partial<IntegrationConnectionAccount>,
): IntegrationConnectionAccount | null {
  const clean = String(accountId || '').trim();
  if (!clean) return null;
  let updated: IntegrationConnectionAccount | null = null;
  const next = readAll().map((entry) => {
    if (entry.id !== clean) return entry;
    updated = { ...entry, ...updates };
    return updated;
  });
  writeAll(next);
  return updated;
}

export function disconnectIntegrationConnection(accountId: string): IntegrationConnectionAccount | null {
  return updateIntegrationConnection(accountId, { health: 'disconnected' });
}

export function reconnectIntegrationConnection(accountId: string): IntegrationConnectionAccount | null {
  const now = new Date().toISOString();
  return updateIntegrationConnection(accountId, {
    health: 'healthy',
    lastValidatedAt: now,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  });
}

export function validateIntegrationConnection(accountId: string): IntegrationConnectionAccount | null {
  const chance = Math.random();
  const now = new Date().toISOString();
  if (chance < 0.1) return updateIntegrationConnection(accountId, { health: 'error', lastValidatedAt: now });
  if (chance < 0.35) return updateIntegrationConnection(accountId, { health: 'expiring', lastValidatedAt: now });
  return updateIntegrationConnection(accountId, { health: 'healthy', lastValidatedAt: now });
}

export async function listIntegrationConnectionsRemote(
  projectId: string,
  accessToken?: string,
): Promise<IntegrationConnectionAccount[]> {
  try {
    const clean = String(projectId || '').trim();
    if (!clean) return [];
    const payload = await requestApi<{ accounts: IntegrationConnectionAccount[] }>(
      `/api/ai/insights?resource=integration-accounts&projectId=${encodeURIComponent(clean)}`,
      { method: 'GET' },
      accessToken,
    );
    const accounts = Array.isArray(payload?.accounts) ? payload.accounts : [];
    const local = readAll().filter((entry) => entry.projectId !== clean);
    writeAll([...accounts, ...local]);
    return accounts;
  } catch {
    return listIntegrationConnections(projectId);
  }
}

export async function connectIntegrationAccountRemote(
  projectId: string,
  connector: IntegrationConnector,
  accountLabel?: string,
  accessToken?: string,
): Promise<IntegrationConnectionAccount> {
  try {
    const payload = await requestApi<{ account: IntegrationConnectionAccount }>(
      '/api/ai/insights?resource=integration-accounts',
      {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          connectorId: connector.id,
          connectorName: connector.name,
          providerId: connector.id,
          provider: connector.provider,
          accountLabel: accountLabel || `${connector.name} Workspace Account`,
          authType: connector.authType || 'oauth2',
          scopes: connector.defaultScopes || [],
        }),
      },
      accessToken,
    );
    const account = payload.account;
    const current = readAll().filter((entry) => entry.id !== account.id);
    writeAll([account, ...current]);
    return account;
  } catch {
    return connectIntegrationAccount(projectId, connector, accountLabel);
  }
}

export async function validateIntegrationConnectionRemote(
  projectId: string,
  accountId: string,
  accessToken?: string,
): Promise<IntegrationConnectionAccount | null> {
  try {
    const payload = await requestApi<{ account: IntegrationConnectionAccount }>(
      '/api/ai/insights?resource=integration-accounts',
      {
        method: 'PATCH',
        body: JSON.stringify({ projectId, accountId, health: 'healthy' }),
      },
      accessToken,
    );
    const account = payload.account;
    const current = readAll().map((entry) => (entry.id === account.id ? account : entry));
    writeAll(current);
    return account;
  } catch {
    return validateIntegrationConnection(accountId);
  }
}

export async function reconnectIntegrationConnectionRemote(
  projectId: string,
  accountId: string,
  accessToken?: string,
): Promise<IntegrationConnectionAccount | null> {
  try {
    const payload = await requestApi<{ account: IntegrationConnectionAccount }>(
      '/api/ai/insights?resource=integration-accounts',
      {
        method: 'PATCH',
        body: JSON.stringify({ projectId, accountId, health: 'healthy' }),
      },
      accessToken,
    );
    const account = payload.account;
    const current = readAll().map((entry) => (entry.id === account.id ? account : entry));
    writeAll(current);
    return account;
  } catch {
    return reconnectIntegrationConnection(accountId);
  }
}

export async function disconnectIntegrationConnectionRemote(
  projectId: string,
  accountId: string,
  accessToken?: string,
): Promise<IntegrationConnectionAccount | null> {
  try {
    const payload = await requestApi<{ account: IntegrationConnectionAccount }>(
      '/api/ai/insights?resource=integration-accounts',
      {
        method: 'PATCH',
        body: JSON.stringify({ projectId, accountId, health: 'disconnected' }),
      },
      accessToken,
    );
    const account = payload.account;
    const current = readAll().map((entry) => (entry.id === account.id ? account : entry));
    writeAll(current);
    return account;
  } catch {
    return disconnectIntegrationConnection(accountId);
  }
}

export async function triggerIntegrationRefreshRemote(
  projectId: string,
  accessToken?: string,
): Promise<{ checked: number; refreshed: number }> {
  try {
    const payload = await requestApi<{ checked: number; refreshed: number }>(
      '/api/ai/insights?resource=integration-refresh',
      {
        method: 'POST',
        body: JSON.stringify({ projectId, force: true }),
      },
      accessToken,
    );
    return payload;
  } catch {
    return { checked: 0, refreshed: 0 };
  }
}

