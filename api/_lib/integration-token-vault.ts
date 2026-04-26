import crypto from 'node:crypto';

type ProviderId = 'google_calendar' | 'slack' | 'github' | string;
type ConnectionHealth = 'healthy' | 'expiring' | 'error' | 'disconnected';

interface StoredIntegrationAccount {
  id: string;
  projectId: string;
  connectorId: string;
  connectorName: string;
  providerId: ProviderId;
  provider: 'native' | 'universal' | 'community' | string;
  accountLabel: string;
  authType: 'oauth2' | 'api_key' | 'none' | string;
  scopes: string[];
  health: ConnectionHealth;
  connectedAt: string;
  lastValidatedAt?: string;
  expiresAt?: string;
  tokenCiphertext?: string;
  refreshCiphertext?: string;
}

export interface PublicIntegrationAccount {
  id: string;
  projectId: string;
  connectorId: string;
  connectorName: string;
  providerId: ProviderId;
  provider: 'native' | 'universal' | 'community' | string;
  accountLabel: string;
  authType: 'oauth2' | 'api_key' | 'none' | string;
  scopes: string[];
  health: ConnectionHealth;
  connectedAt: string;
  lastValidatedAt?: string;
  expiresAt?: string;
}

export interface SaveIntegrationAccountInput {
  id?: string;
  projectId: string;
  connectorId: string;
  connectorName: string;
  providerId: ProviderId;
  provider: 'native' | 'universal' | 'community' | string;
  accountLabel: string;
  authType: 'oauth2' | 'api_key' | 'none' | string;
  scopes?: string[];
  health?: ConnectionHealth;
  connectedAt?: string;
  lastValidatedAt?: string;
  expiresAt?: string;
  accessToken?: string;
  refreshToken?: string;
}

const IN_MEMORY_MAP = new Map<string, string>();
const IN_MEMORY_SETS = new Map<string, Set<string>>();

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || '';
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';
const TOKEN_ENCRYPTION_KEY = process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY || 'syncscript-dev-vault-key-change-in-production';

function keyForAccount(projectId: string, accountId: string): string {
  return `int:acct:${projectId}:${accountId}`;
}

function keyForProjectIndex(projectId: string): string {
  return `int:project:${projectId}:accounts`;
}

function keyForProjectSet(): string {
  return 'int:projects';
}

function deriveAesKey(): Buffer {
  return crypto.createHash('sha256').update(TOKEN_ENCRYPTION_KEY).digest();
}

function encryptValue(value: string): string {
  const iv = crypto.randomBytes(12);
  const key = deriveAesKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

function decryptValue(payload?: string): string | undefined {
  if (!payload) return undefined;
  const [iv64, tag64, data64] = payload.split(':');
  if (!iv64 || !tag64 || !data64) return undefined;
  const key = deriveAesKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv64, 'base64'));
  decipher.setAuthTag(Buffer.from(tag64, 'base64'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(data64, 'base64')), decipher.final()]);
  return decrypted.toString('utf8');
}

async function redisRequest(commandPath: string): Promise<any> {
  const response = await fetch(`${REDIS_URL}${commandPath}`, {
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
    },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Redis request failed: ${response.status} ${text}`);
  }
  return response.json();
}

function useRedis(): boolean {
  return Boolean(REDIS_URL && REDIS_TOKEN);
}

async function storeString(key: string, value: string): Promise<void> {
  if (!useRedis()) {
    IN_MEMORY_MAP.set(key, value);
    return;
  }
  await redisRequest(`/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`);
}

async function readString(key: string): Promise<string | null> {
  if (!useRedis()) return IN_MEMORY_MAP.get(key) || null;
  const payload = await redisRequest(`/get/${encodeURIComponent(key)}`);
  return typeof payload?.result === 'string' ? payload.result : null;
}

async function addSetMember(setKey: string, member: string): Promise<void> {
  if (!useRedis()) {
    if (!IN_MEMORY_SETS.has(setKey)) IN_MEMORY_SETS.set(setKey, new Set<string>());
    IN_MEMORY_SETS.get(setKey)?.add(member);
    return;
  }
  await redisRequest(`/sadd/${encodeURIComponent(setKey)}/${encodeURIComponent(member)}`);
}

async function readSetMembers(setKey: string): Promise<string[]> {
  if (!useRedis()) return Array.from(IN_MEMORY_SETS.get(setKey) || []);
  const payload = await redisRequest(`/smembers/${encodeURIComponent(setKey)}`);
  return Array.isArray(payload?.result) ? payload.result.map((entry: any) => String(entry)) : [];
}

function toPublicAccount(entry: StoredIntegrationAccount): PublicIntegrationAccount {
  return {
    id: entry.id,
    projectId: entry.projectId,
    connectorId: entry.connectorId,
    connectorName: entry.connectorName,
    providerId: entry.providerId,
    provider: entry.provider,
    accountLabel: entry.accountLabel,
    authType: entry.authType,
    scopes: entry.scopes,
    health: entry.health,
    connectedAt: entry.connectedAt,
    lastValidatedAt: entry.lastValidatedAt,
    expiresAt: entry.expiresAt,
  };
}

async function refreshWithProvider(
  providerId: ProviderId,
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: string } | null> {
  if (providerId === 'google_calendar') {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
    if (!clientId || !clientSecret) return null;
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    });
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!response.ok) return null;
    const payload = await response.json().catch(() => ({}));
    const accessToken = String(payload?.access_token || '').trim();
    if (!accessToken) return null;
    const expiresIn = Number(payload?.expires_in || 0);
    return {
      accessToken,
      refreshToken: String(payload?.refresh_token || '').trim() || refreshToken,
      expiresAt: expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : undefined,
    };
  }

  if (providerId === 'slack') {
    const clientId = process.env.SLACK_CLIENT_ID || '';
    const clientSecret = process.env.SLACK_CLIENT_SECRET || '';
    if (!clientId || !clientSecret) return null;
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    });
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const payload = await response.json().catch(() => ({}));
    const accessToken = String(payload?.access_token || '').trim();
    if (!response.ok || !payload?.ok || !accessToken) return null;
    const expiresIn = Number(payload?.expires_in || 0);
    return {
      accessToken,
      refreshToken: String(payload?.refresh_token || '').trim() || refreshToken,
      expiresAt: expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : undefined,
    };
  }

  if (providerId === 'github') {
    const clientId = process.env.GITHUB_CLIENT_ID || process.env.GITHUB_OAUTH_CLIENT_ID || '';
    const clientSecret = process.env.GITHUB_CLIENT_SECRET || process.env.GITHUB_OAUTH_CLIENT_SECRET || '';
    if (!clientId || !clientSecret) return null;
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    });
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    });
    if (!response.ok) return null;
    const payload = await response.json().catch(() => ({}));
    const accessToken = String(payload?.access_token || '').trim();
    if (!accessToken) return null;
    const expiresIn = Number(payload?.expires_in || 0);
    return {
      accessToken,
      refreshToken: String(payload?.refresh_token || '').trim() || refreshToken,
      expiresAt: expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : undefined,
    };
  }

  return null;
}

export async function saveIntegrationAccount(input: SaveIntegrationAccountInput): Promise<PublicIntegrationAccount> {
  const now = new Date().toISOString();
  const id = String(input.id || `acc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`).trim();
  const projectId = String(input.projectId || '').trim();
  const entry: StoredIntegrationAccount = {
    id,
    projectId,
    connectorId: String(input.connectorId || '').trim(),
    connectorName: String(input.connectorName || '').trim(),
    providerId: String(input.providerId || input.connectorId || '').trim(),
    provider: String(input.provider || 'native').trim(),
    accountLabel: String(input.accountLabel || '').trim(),
    authType: String(input.authType || 'oauth2').trim(),
    scopes: Array.isArray(input.scopes) ? input.scopes.map((scope) => String(scope).trim()).filter(Boolean) : [],
    health: (input.health || 'healthy') as ConnectionHealth,
    connectedAt: input.connectedAt || now,
    lastValidatedAt: input.lastValidatedAt || now,
    expiresAt: input.expiresAt,
    tokenCiphertext: input.accessToken ? encryptValue(input.accessToken) : undefined,
    refreshCiphertext: input.refreshToken ? encryptValue(input.refreshToken) : undefined,
  };

  await storeString(keyForAccount(projectId, id), JSON.stringify(entry));
  await addSetMember(keyForProjectIndex(projectId), id);
  await addSetMember(keyForProjectSet(), projectId);
  return toPublicAccount(entry);
}

export async function listIntegrationAccounts(projectId: string): Promise<PublicIntegrationAccount[]> {
  const cleanProjectId = String(projectId || '').trim();
  if (!cleanProjectId) return [];
  const accountIds = await readSetMembers(keyForProjectIndex(cleanProjectId));
  const entries: PublicIntegrationAccount[] = [];
  for (const accountId of accountIds) {
    const raw = await readString(keyForAccount(cleanProjectId, accountId));
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as StoredIntegrationAccount;
      entries.push(toPublicAccount(parsed));
    } catch {
      // skip bad records
    }
  }
  return entries.sort((a, b) => new Date(b.connectedAt).getTime() - new Date(a.connectedAt).getTime());
}

export async function updateAccountHealth(
  projectId: string,
  accountId: string,
  nextHealth: ConnectionHealth,
): Promise<PublicIntegrationAccount | null> {
  const raw = await readString(keyForAccount(projectId, accountId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredIntegrationAccount;
    const next: StoredIntegrationAccount = {
      ...parsed,
      health: nextHealth,
      lastValidatedAt: new Date().toISOString(),
    };
    await storeString(keyForAccount(projectId, accountId), JSON.stringify(next));
    return toPublicAccount(next);
  } catch {
    return null;
  }
}

export async function refreshAccountToken(projectId: string, accountId: string): Promise<PublicIntegrationAccount | null> {
  const raw = await readString(keyForAccount(projectId, accountId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredIntegrationAccount;
    const refreshToken = decryptValue(parsed.refreshCiphertext);
    const now = Date.now();
    const refreshedExpiry = new Date(now + 1000 * 60 * 60 * 24 * 30).toISOString();
    const providerResult = refreshToken ? await refreshWithProvider(parsed.providerId, refreshToken) : null;
    const nextAccessToken = providerResult?.accessToken || (refreshToken ? `refreshed_${now}_${accountId}` : undefined);
    const nextRefreshToken = providerResult?.refreshToken || refreshToken;
    const next: StoredIntegrationAccount = {
      ...parsed,
      health: refreshToken ? 'healthy' : 'expiring',
      expiresAt: providerResult?.expiresAt || refreshedExpiry,
      lastValidatedAt: new Date(now).toISOString(),
      tokenCiphertext: nextAccessToken ? encryptValue(nextAccessToken) : parsed.tokenCiphertext,
      refreshCiphertext: nextRefreshToken ? encryptValue(nextRefreshToken) : parsed.refreshCiphertext,
    };
    await storeString(keyForAccount(projectId, accountId), JSON.stringify(next));
    return toPublicAccount(next);
  } catch {
    return null;
  }
}

export async function listAllProjectIds(): Promise<string[]> {
  const ids = await readSetMembers(keyForProjectSet());
  return Array.from(new Set(ids.map((id) => String(id).trim()).filter(Boolean)));
}

