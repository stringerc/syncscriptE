/**
 * Discord Bot Integration Routes
 * 
 * Manages the SyncScript Discord community:
 * - Post welcome messages to channels
 * - Automated engagement via cron jobs
 * - Send Discord invite to beta testers
 * - Channel management (clear, post)
 * 
 * Requires DISCORD_BOT_TOKEN environment variable.
 * Uses Discord REST API v10.
 */

import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';
import nacl from 'npm:tweetnacl';
import { createClient } from 'npm:@supabase/supabase-js';

const discordRoutes = new Hono();

const DISCORD_API = 'https://discord.com/api/v10';
const DISCORD_INVITE = Deno.env.get('DISCORD_INVITE_URL') || 'https://discord.gg/2rq38UJrDJ';
const OPENCLAW_BASE_URL = Deno.env.get('OPENCLAW_BASE_URL') || 'http://3.148.233.23:18789';
const OPENCLAW_TOKEN = Deno.env.get('OPENCLAW_TOKEN') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const AGENT_AVATAR_BUCKET = 'make-57781ad9-agent-avatars';

const authClient = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
const storageAdminClient = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    out[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return out;
}

function utf8ToBytes(input: string): Uint8Array {
  return new TextEncoder().encode(input);
}

let cachedDiscordVerifyKey: string | null = null;
let cachedDiscordVerifyKeyAt = 0;
const DISCORD_VERIFY_KEY_CACHE_MS = 5 * 60 * 1000;

async function resolveDiscordVerifyKey(): Promise<string | null> {
  const configuredKey = Deno.env.get('DISCORD_PUBLIC_KEY');
  if (configuredKey) return configuredKey;

  const now = Date.now();
  if (cachedDiscordVerifyKey && (now - cachedDiscordVerifyKeyAt) < DISCORD_VERIFY_KEY_CACHE_MS) {
    return cachedDiscordVerifyKey;
  }

  try {
    const appProfile = await discordFetch('/oauth2/applications/@me');
    const discovered = String(appProfile?.verify_key || appProfile?.public_key || '').trim();
    if (discovered) {
      cachedDiscordVerifyKey = discovered;
      cachedDiscordVerifyKeyAt = now;
      return discovered;
    }
  } catch (error) {
    console.error('[Discord] Unable to resolve verify key from Discord API:', error);
  }

  return null;
}

async function verifyDiscordSignature(
  body: string,
  signature: string | null,
  timestamp: string | null
): Promise<boolean> {
  const publicKey = await resolveDiscordVerifyKey();
  if (!publicKey) {
    console.error('[Discord] No verify key available (DISCORD_PUBLIC_KEY missing and API fallback unavailable).');
    return false;
  }
  if (!signature || !timestamp) return false;
  try {
    const isValid = nacl.sign.detached.verify(
      utf8ToBytes(`${timestamp}${body}`),
      hexToBytes(signature),
      hexToBytes(publicKey)
    );
    return isValid;
  } catch (error) {
    console.error('[Discord] Signature verification failed:', error);
    return false;
  }
}

function toDiscordContextKey(discordUserId: string): string {
  return `discord_virtual_context:${discordUserId}`;
}

function toDiscordHistoryKey(discordUserId: string, workspaceId: string, agentId: string): string {
  return `discord_virtual_history:${discordUserId}:${workspaceId}:${agentId}`;
}

function toDiscordThreadRouteKey(discordUserId: string, workspaceId: string, agentId: string): string {
  return `discord_thread_route:${discordUserId}:${workspaceId}:${agentId}`;
}

function toDiscordThreadLookupKey(threadId: string): string {
  return `discord_thread_lookup:${threadId}`;
}

function toDiscordInteractionKey(interactionId: string): string {
  return `discord_interaction_seen:${interactionId}`;
}

function toDiscordActivationKey(discordUserId: string): string {
  return `discord_agent_activation:${discordUserId}`;
}

function toDiscordProvisioningKey(discordUserId: string): string {
  return `discord_provisioning:${discordUserId}`;
}

function toDiscordAgentRegistryKey(workspaceId: string): string {
  return `discord_agent_registry:${sanitizeThreadSuffix(workspaceId || 'default')}`;
}

function toDiscordAgentIdentityKey(workspaceId: string, userId: string): string {
  return `discord_agent_identities:${sanitizeThreadSuffix(workspaceId || 'default')}:${sanitizeThreadSuffix(userId || 'user')}`;
}

function toDiscordAgentIdentityLegacyKey(workspaceId: string): string {
  return `discord_agent_identities:${sanitizeThreadSuffix(workspaceId || 'default')}`;
}

function toDiscordAgentAvatarIndexKey(workspaceId: string, userId: string): string {
  return `discord_agent_avatar_index:${sanitizeThreadSuffix(workspaceId || 'default')}:${sanitizeThreadSuffix(userId || 'user')}`;
}

function sanitizeStoragePathSegment(raw: string, maxLen = 80): string {
  return String(raw || 'item')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, maxLen) || 'item';
}

async function resolveAuthenticatedUserId(c: any): Promise<string | null> {
  const authHeader = String(c.req.header('Authorization') || '');
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token || !authClient) return null;
  try {
    const { data, error } = await authClient.auth.getUser(token);
    if (error || !data?.user?.id) return null;
    return String(data.user.id);
  } catch {
    return null;
  }
}

async function ensureAgentAvatarBucket(): Promise<void> {
  if (!storageAdminClient) throw new Error('Storage client unavailable');
  const { data: buckets } = await storageAdminClient.storage.listBuckets();
  const exists = buckets?.some((bucket) => bucket.name === AGENT_AVATAR_BUCKET);
  if (exists) return;
  const { error } = await storageAdminClient.storage.createBucket(AGENT_AVATAR_BUCKET, {
    public: false,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  });
  if (error) throw new Error(`Failed to create avatar bucket: ${error.message}`);
}

async function createAgentAvatarSignedUrl(path: string): Promise<string | undefined> {
  if (!storageAdminClient || !path) return undefined;
  const { data, error } = await storageAdminClient.storage.from(AGENT_AVATAR_BUCKET).createSignedUrl(path, 60 * 60 * 24 * 30);
  if (error || !data?.signedUrl) return undefined;
  return data.signedUrl;
}

function normalizeAvatarPathIndex(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const path = String(item || '').trim().slice(0, 220);
    if (!path || seen.has(path)) continue;
    seen.add(path);
    out.push(path);
    if (out.length >= 5000) break;
  }
  return out;
}

async function cleanupOrphanedAgentAvatars(args: {
  workspaceId: string;
  userId: string;
  profiles: Record<string, DiscordAgentIdentityProfile>;
}): Promise<void> {
  if (!storageAdminClient) return;
  const userSegment = sanitizeStoragePathSegment(args.userId, 48);
  const workspaceSegment = sanitizeStoragePathSegment(args.workspaceId, 40);
  const ownedPrefix = `${userSegment}/${workspaceSegment}/`;

  const activePaths = new Set(
    Object.values(args.profiles)
      .map((profile) => String(profile?.avatarPath || '').trim())
      .filter((path) => path && path.startsWith(ownedPrefix))
  );

  const indexKey = toDiscordAgentAvatarIndexKey(args.workspaceId, args.userId);
  const existingIndex = await kv.get(indexKey);
  const indexedPaths = normalizeAvatarPathIndex(existingIndex?.paths);
  const stalePaths = indexedPaths.filter((path) => !activePaths.has(path) && path.startsWith(ownedPrefix));

  if (stalePaths.length > 0) {
    await storageAdminClient.storage.from(AGENT_AVATAR_BUCKET).remove(stalePaths);
  }

  const nextIndex = Array.from(new Set([...indexedPaths.filter((path) => activePaths.has(path)), ...Array.from(activePaths)]));
  await kv.set(indexKey, {
    paths: nextIndex,
    updatedAt: new Date().toISOString(),
  });
}

type DiscordAgentIdentityProfile = {
  avatarDataUrl?: string; // legacy fallback
  avatarPath?: string;
  avatarUrl?: string;
  voiceBadge?: string;
};

function normalizeDiscordAgentIdentityProfiles(raw: unknown): Record<string, DiscordAgentIdentityProfile> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, DiscordAgentIdentityProfile> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const normalizedKey = String(key || '').trim().slice(0, 120);
    if (!normalizedKey) continue;
    const profile = value as Record<string, unknown>;
    const avatarDataUrl = typeof profile?.avatarDataUrl === 'string' ? profile.avatarDataUrl.slice(0, 500_000) : '';
    const avatarPath = typeof profile?.avatarPath === 'string' ? profile.avatarPath.slice(0, 220) : '';
    const avatarUrl = typeof profile?.avatarUrl === 'string' ? profile.avatarUrl.slice(0, 1000) : '';
    const voiceBadge = typeof profile?.voiceBadge === 'string' ? profile.voiceBadge.slice(0, 40) : '';
    out[normalizedKey] = {
      avatarDataUrl: avatarDataUrl || undefined,
      avatarPath: avatarPath || undefined,
      avatarUrl: avatarUrl || undefined,
      voiceBadge: voiceBadge || undefined,
    };
    if (Object.keys(out).length >= 500) break;
  }
  return out;
}

const TAB_AGENT_CATALOG: Array<{ tab: string; id: string; name: string }> = [
  { tab: 'dashboard', id: 'nexus', name: 'Nexus' },
  { tab: 'tasks', id: 'tasks-agent', name: 'Tasks Agent' },
  { tab: 'goals', id: 'goals-agent', name: 'Goals Agent' },
  { tab: 'calendar', id: 'calendar-agent', name: 'Calendar Agent' },
  { tab: 'financials', id: 'financials-agent', name: 'Financials Agent' },
  { tab: 'email', id: 'email-agent', name: 'Email Agent' },
  { tab: 'enterprise', id: 'mission', name: 'Mission Control' },
];

const ENTERPRISE_AGENT_CATALOG: Array<{ id: string; name: string }> = [
  { id: 'mission', name: 'Mission Control' },
  { id: 'atlas', name: 'Atlas' },
  { id: 'trendy', name: 'Trendy' },
  { id: 'pixel', name: 'Pixel' },
  { id: 'nova', name: 'Nova' },
  { id: 'clawd', name: 'Clawd' },
  { id: 'sentinel', name: 'Sentinel' },
  { id: 'scribe', name: 'Scribe' },
  { id: 'sage', name: 'Sage' },
  { id: 'closer', name: 'Closer' },
];

type DiscordRegistryAgent = {
  id: string;
  name: string;
  parentType: 'enterprise' | 'tab';
  parentId: string;
};

function normalizeRegistryAgents(raw: unknown): DiscordRegistryAgent[] {
  if (!Array.isArray(raw)) return [];
  const normalized: DiscordRegistryAgent[] = [];
  const seen = new Set<string>();
  for (const entry of raw) {
    const id = sanitizeThreadSuffix((entry as any)?.id || '');
    const name = String((entry as any)?.name || id || 'Agent').slice(0, 80);
    const parentType = String((entry as any)?.parentType || '').toLowerCase() === 'tab' ? 'tab' : 'enterprise';
    const parentId = sanitizeThreadSuffix((entry as any)?.parentId || (parentType === 'tab' ? 'dashboard' : 'enterprise'));
    if (!id) continue;
    const key = `${parentType}:${parentId}:${id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({ id, name, parentType, parentId });
  }
  return normalized.slice(0, 200);
}

async function getDiscordAgentRegistry(workspaceId: string): Promise<DiscordRegistryAgent[]> {
  const data = await kv.get(toDiscordAgentRegistryKey(workspaceId));
  return normalizeRegistryAgents(data?.agents);
}

async function setDiscordAgentRegistry(workspaceId: string, agents: DiscordRegistryAgent[]): Promise<void> {
  await kv.set(toDiscordAgentRegistryKey(workspaceId), {
    agents: normalizeRegistryAgents(agents),
    updatedAt: new Date().toISOString(),
  });
}

async function resolveEnterpriseAgentsForWorkspace(workspaceId: string): Promise<Array<{ id: string; name: string }>> {
  const registry = await getDiscordAgentRegistry(workspaceId);
  const enterprise = registry
    .filter((agent) => agent.parentType === 'enterprise')
    .map((agent) => ({ id: agent.id, name: agent.name }));
  return enterprise.length > 0 ? enterprise : ENTERPRISE_AGENT_CATALOG;
}

async function resolveTabSubagentsForWorkspace(workspaceId: string): Promise<Array<{ tab: string; id: string; name: string }>> {
  const registry = await getDiscordAgentRegistry(workspaceId);
  const supportedTabs = new Set(TAB_AGENT_CATALOG.map((item) => item.tab));
  return registry
    .filter((agent) => agent.parentType === 'tab' && supportedTabs.has(agent.parentId))
    .map((agent) => ({ tab: agent.parentId, id: agent.id, name: agent.name }));
}

function sanitizeThreadSuffix(raw: string): string {
  return String(raw || 'default')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 32) || 'default';
}

function normalizeDiscordUserIds(raw: unknown, fallback?: string): string[] {
  const input = Array.isArray(raw) ? raw : [];
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (value: unknown) => {
    const id = String(value || '').trim();
    if (!id) return;
    if (seen.has(id)) return;
    seen.add(id);
    out.push(id);
  };
  if (fallback) push(fallback);
  for (const item of input) push(item);
  return out.slice(0, 50);
}

const DISCORD_CHANNEL_TYPES = {
  GUILD_TEXT: 0,
  GUILD_CATEGORY: 4,
} as const;

const DISCORD_PERMISSION_BITS = {
  VIEW_CHANNEL: 1n << 10n,
  SEND_MESSAGES: 1n << 11n,
  MANAGE_CHANNELS: 1n << 4n,
  MANAGE_THREADS: 1n << 34n,
  CREATE_PUBLIC_THREADS: 1n << 35n,
  CREATE_PRIVATE_THREADS: 1n << 36n,
  READ_MESSAGE_HISTORY: 1n << 16n,
} as const;

const REQUIRED_CHANNEL_MODE_PERMISSIONS: Array<{ key: keyof typeof DISCORD_PERMISSION_BITS; label: string }> = [
  { key: 'VIEW_CHANNEL', label: 'View Channels' },
  { key: 'SEND_MESSAGES', label: 'Send Messages' },
  { key: 'READ_MESSAGE_HISTORY', label: 'Read Message History' },
  { key: 'MANAGE_CHANNELS', label: 'Manage Channels' },
  { key: 'MANAGE_THREADS', label: 'Manage Threads' },
  { key: 'CREATE_PUBLIC_THREADS', label: 'Create Public Threads' },
  { key: 'CREATE_PRIVATE_THREADS', label: 'Create Private Threads' },
];

const USER_AGENT_CHANNELS: Array<{ routeKey: string; channelName: string }> = [
  { routeKey: 'nexus', channelName: 'nexus' },
  { routeKey: 'tab:dashboard:nexus', channelName: 'dashboard' },
  { routeKey: 'tab:calendar:calendar-agent', channelName: 'calendar-agent' },
  { routeKey: 'tab:tasks:tasks-agent', channelName: 'tasks-agent' },
  { routeKey: 'tab:goals:goals-agent', channelName: 'goals-agent' },
  { routeKey: 'tab:financials:financials-agent', channelName: 'financials-agent' },
  { routeKey: 'tab:email:email-agent', channelName: 'email-agent' },
];

function privatePermissionOverwrites(guildId: string, userIds: string[], botUserId: string) {
  const allow = (
    DISCORD_PERMISSION_BITS.VIEW_CHANNEL |
    DISCORD_PERMISSION_BITS.SEND_MESSAGES |
    DISCORD_PERMISSION_BITS.READ_MESSAGE_HISTORY
  ).toString();
  const members = normalizeDiscordUserIds(userIds);
  return [
    { id: guildId, type: 0, deny: DISCORD_PERMISSION_BITS.VIEW_CHANNEL.toString() },
    ...members.map((id) => ({ id, type: 1, allow })),
    { id: botUserId, type: 1, allow },
  ];
}

async function getGuildIdFromChannel(channelId: string): Promise<string | null> {
  const channel = await discordFetch(`/channels/${channelId}`);
  const guildId = String(channel?.guild_id || '');
  return guildId || null;
}

let cachedBotUserId: string | null = null;
async function getBotUserId(): Promise<string> {
  if (cachedBotUserId) return cachedBotUserId;
  const me = await discordFetch('/users/@me');
  cachedBotUserId = String(me?.id || '');
  if (!cachedBotUserId) throw new Error('Unable to resolve Discord bot user id.');
  return cachedBotUserId;
}

async function ensurePrivateCategory(args: {
  guildId: string;
  userIds: string[];
  botUserId: string;
  name: string;
  channels: any[];
}): Promise<string> {
  const existing = args.channels.find((ch: any) => ch.type === DISCORD_CHANNEL_TYPES.GUILD_CATEGORY && ch.name === args.name);
  if (existing?.id) return String(existing.id);
  const created = await discordFetch(`/guilds/${args.guildId}/channels`, {
    method: 'POST',
    body: JSON.stringify({
      name: args.name.slice(0, 100),
      type: DISCORD_CHANNEL_TYPES.GUILD_CATEGORY,
      permission_overwrites: privatePermissionOverwrites(args.guildId, args.userIds, args.botUserId),
    }),
  });
  return String(created?.id || '');
}

async function ensurePrivateTextChannel(args: {
  guildId: string;
  userIds: string[];
  botUserId: string;
  parentId: string;
  channelName: string;
  channels: any[];
}): Promise<string> {
  const existing = args.channels.find((ch: any) =>
    ch.type === DISCORD_CHANNEL_TYPES.GUILD_TEXT &&
    ch.parent_id === args.parentId &&
    ch.name === args.channelName
  );
  if (existing?.id) return String(existing.id);
  const created = await discordFetch(`/guilds/${args.guildId}/channels`, {
    method: 'POST',
    body: JSON.stringify({
      name: args.channelName.slice(0, 100),
      type: DISCORD_CHANNEL_TYPES.GUILD_TEXT,
      parent_id: args.parentId,
      permission_overwrites: privatePermissionOverwrites(args.guildId, args.userIds, args.botUserId),
    }),
  });
  return String(created?.id || '');
}

async function getMissingBotGuildPermissions(guildId: string): Promise<string[]> {
  try {
    const botUserId = await getBotUserId();
    const member = await discordFetch(`/guilds/${guildId}/members/${botUserId}`);
    const roles = await discordFetch(`/guilds/${guildId}/roles`);
    const roleMap = new Map<string, string>();
    for (const role of roles || []) {
      roleMap.set(String(role?.id || ''), String(role?.permissions || '0'));
    }
    const roleIds: string[] = Array.isArray(member?.roles) ? member.roles.map((r: unknown) => String(r)) : [];
    let permissions = 0n;
    // Everyone role is guild id in Discord.
    const everyonePerms = roleMap.get(guildId);
    if (everyonePerms) permissions |= BigInt(everyonePerms);
    for (const roleId of roleIds) {
      const p = roleMap.get(roleId);
      if (p) permissions |= BigInt(p);
    }
    // Administrator implies all permissions.
    const ADMINISTRATOR = 1n << 3n;
    if ((permissions & ADMINISTRATOR) === ADMINISTRATOR) return [];

    const missing: string[] = [];
    for (const perm of REQUIRED_CHANNEL_MODE_PERMISSIONS) {
      const bit = DISCORD_PERMISSION_BITS[perm.key];
      if ((permissions & bit) !== bit) missing.push(perm.label);
    }
    return missing;
  } catch {
    return [];
  }
}

function isDiscordMissingPermissionsError(error: unknown): boolean {
  const message = String((error as any)?.message || error || '');
  return (
    message.includes('Discord API 403') &&
    (message.includes('Missing Permissions') || message.includes('"code": 50013'))
  );
}

async function provisionThreadOnlyRoutes(args: {
  discordUserId: string;
  channelId: string;
  workspaceId: string;
  enterpriseAgents: Array<{ id: string; name: string }>;
  tabSubagents: Array<{ tab: string; id: string; name: string }>;
}): Promise<{ provisioned: string[]; routeDefs: Array<{ routeKey: string }> }> {
  const slug = sanitizeThreadSuffix(args.discordUserId);
  const workspaceSlug = sanitizeThreadSuffix(args.workspaceId);
  const guildId = await getGuildIdFromChannel(args.channelId);
  const provisioned: string[] = [];
  const routeDefs: Array<{ routeKey: string }> = [];

  const threadDefs: Array<{ routeKey: string; threadName: string }> = [
    { routeKey: 'nexus', threadName: `nexus-${slug}` },
    { routeKey: 'enterprise', threadName: `enterprise-${slug}` },
    { routeKey: `enterprise:${workspaceSlug}`, threadName: `enterprise-${workspaceSlug}-${slug}` },
  ];

  for (const tabAgent of TAB_AGENT_CATALOG) {
    const tabSlug = sanitizeThreadSuffix(tabAgent.tab);
    threadDefs.push({
      routeKey: `tab:${tabAgent.tab}:${tabAgent.id}`,
      threadName: `nexus-${tabSlug}-${slug}`,
    });
  }

  for (const agent of args.enterpriseAgents) {
    threadDefs.push({
      routeKey: `enterprise:${workspaceSlug}:${agent.id}`,
      threadName: `ent-${workspaceSlug}-${sanitizeThreadSuffix(agent.id)}-${slug}`,
    });
  }

  for (const subagent of args.tabSubagents) {
    threadDefs.push({
      routeKey: `tab:${subagent.tab}:${subagent.id}`,
      threadName: `nexus-${sanitizeThreadSuffix(subagent.tab)}-${sanitizeThreadSuffix(subagent.id)}-${slug}`,
    });
  }

  for (const threadDef of threadDefs) {
    const threadId = await provisionThreadRoute({
      discordUserId: args.discordUserId,
      channelId: args.channelId,
      routeKey: threadDef.routeKey,
      threadName: threadDef.threadName,
      guildId: guildId || undefined,
    });
    if (threadId) {
      provisioned.push(`<#${threadId}>`);
      routeDefs.push({ routeKey: threadDef.routeKey });
    }
  }

  return { provisioned, routeDefs };
}

async function provisionDiscordRoutesForUser(args: {
  discordUserId: string;
  channelId: string;
  workspaceId: string;
  enterpriseMemberDiscordUserIds?: string[];
}): Promise<{
  provisioned: string[];
  routeDefs: Array<{ routeKey: string }>;
  channelsByName: Record<string, string>;
  categoryId: string;
  provisionMode: 'channels' | 'threads-fallback';
  missingPermissions: string[];
}> {
  const userId = args.discordUserId;
  const channelId = args.channelId;
  const workspaceId = args.workspaceId;
  const enterpriseMemberIds = normalizeDiscordUserIds(args.enterpriseMemberDiscordUserIds, userId);
  const slug = sanitizeThreadSuffix(userId);
  const workspaceSlug = sanitizeThreadSuffix(workspaceId);
  const enterpriseAgents = await resolveEnterpriseAgentsForWorkspace(workspaceId);
  const tabSubagents = await resolveTabSubagentsForWorkspace(workspaceId);

  let provisioned: Array<string> = [];
  let routeDefs: Array<{ routeKey: string }> = [];
  let channelsByName: Record<string, string> = {};
  let categoryId = '';
  let provisionMode: 'channels' | 'threads-fallback' = 'channels';
  let missingPermissions: string[] = [];

  try {
    const guildId = await getGuildIdFromChannel(channelId);
    if (!guildId) throw new Error('Provisioning failed: unable to resolve guild.');

    missingPermissions = await getMissingBotGuildPermissions(guildId);
    if (missingPermissions.length > 0) {
      provisionMode = 'threads-fallback';
      const fallback = await provisionThreadOnlyRoutes({
        discordUserId: userId,
        channelId,
        workspaceId,
        enterpriseAgents,
        tabSubagents,
      });
      provisioned = fallback.provisioned;
      routeDefs = fallback.routeDefs;
      return { provisioned, routeDefs, channelsByName, categoryId, provisionMode, missingPermissions };
    }

    const botUserId = await getBotUserId();
    const guildChannels = await discordFetch(`/guilds/${guildId}/channels`);

    const categoryName = `syncscript-${slug}`.slice(0, 100);
    categoryId = await ensurePrivateCategory({
      guildId,
      userIds: [userId],
      botUserId,
      name: categoryName,
      channels: guildChannels,
    });

    for (const item of USER_AGENT_CHANNELS) {
      const chId = await ensurePrivateTextChannel({
        guildId,
        userIds: [userId],
        botUserId,
        parentId: categoryId,
        channelName: item.channelName,
        channels: guildChannels,
      });
      if (chId) {
        channelsByName[item.channelName] = chId;
        await upsertProvisionedChannelRoute(userId, item.routeKey, chId, item.channelName, categoryId, guildId);
        provisioned.push(`<#${chId}>`);
        routeDefs.push({ routeKey: item.routeKey });
      }
    }

    const tabChannelMap: Record<string, string> = {
      dashboard: channelsByName['dashboard'] || '',
      tasks: channelsByName['tasks-agent'] || '',
      goals: channelsByName['goals-agent'] || '',
      calendar: channelsByName['calendar-agent'] || '',
      financials: channelsByName['financials-agent'] || '',
      email: channelsByName['email-agent'] || '',
      enterprise: channelsByName['enterprise'] || '',
    };

    const enterpriseCategoryName = `enterprise-${workspaceSlug}`.slice(0, 100);
    const enterpriseCategoryId = await ensurePrivateCategory({
      guildId,
      userIds: enterpriseMemberIds,
      botUserId,
      name: enterpriseCategoryName,
      channels: guildChannels,
    });

    const workspaceChannelName = `hq-${workspaceSlug}`.slice(0, 100);
    const workspaceChannelId = await ensurePrivateTextChannel({
      guildId,
      userIds: enterpriseMemberIds,
      botUserId,
      parentId: enterpriseCategoryId,
      channelName: workspaceChannelName,
      channels: guildChannels,
    });
    if (workspaceChannelId) {
      await upsertProvisionedChannelRoute(
        userId,
        `enterprise:${workspaceSlug}`,
        workspaceChannelId,
        workspaceChannelName,
        enterpriseCategoryId,
        guildId
      );
      provisioned.push(`<#${workspaceChannelId}>`);
      routeDefs.push({ routeKey: `enterprise:${workspaceSlug}` });
    }

    if (workspaceChannelId) {
      await upsertProvisionedChannelRoute(
        userId,
        'enterprise',
        workspaceChannelId,
        workspaceChannelName,
        enterpriseCategoryId,
        guildId
      );
      routeDefs.push({ routeKey: 'enterprise' });
      for (const agent of enterpriseAgents) {
        const routeKey = `enterprise:${workspaceSlug}:${agent.id}`;
        const threadId = await provisionThreadRoute({
          discordUserId: userId,
          channelId: workspaceChannelId,
          routeKey,
          threadName: `${sanitizeThreadSuffix(agent.id)}-${workspaceSlug}`,
          guildId,
        });
        if (threadId) {
          provisioned.push(`<#${threadId}>`);
          routeDefs.push({ routeKey });
        }
      }
    }

    for (const subagent of tabSubagents) {
      const parentChannelId = tabChannelMap[subagent.tab];
      if (!parentChannelId) continue;
      const routeKey = `tab:${subagent.tab}:${subagent.id}`;
      const threadId = await provisionThreadRoute({
        discordUserId: userId,
        channelId: parentChannelId,
        routeKey,
        threadName: `${sanitizeThreadSuffix(subagent.tab)}-${sanitizeThreadSuffix(subagent.id)}-${slug}`,
        guildId,
      });
      if (threadId) {
        provisioned.push(`<#${threadId}>`);
        routeDefs.push({ routeKey });
      }
    }
  } catch (error) {
    if (!isDiscordMissingPermissionsError(error)) {
      throw error;
    }
    provisionMode = 'threads-fallback';
    const fallback = await provisionThreadOnlyRoutes({
      discordUserId: userId,
      channelId,
      workspaceId,
      enterpriseAgents,
      tabSubagents,
    });
    provisioned = fallback.provisioned;
    routeDefs = fallback.routeDefs;
  }

  return { provisioned, routeDefs, channelsByName, categoryId, provisionMode, missingPermissions };
}

async function getActivationState(discordUserId: string): Promise<{ enabledRoutes: string[] }> {
  const data = await kv.get(toDiscordActivationKey(discordUserId));
  return {
    enabledRoutes: Array.isArray(data?.enabledRoutes)
      ? data.enabledRoutes.map((route: unknown) => String(route))
      : [],
  };
}

async function setActivationState(discordUserId: string, next: { enabledRoutes: string[] }): Promise<void> {
  await kv.set(toDiscordActivationKey(discordUserId), {
    enabledRoutes: next.enabledRoutes.slice(0, 300),
    updatedAt: new Date().toISOString(),
  });
}

async function upsertProvisionedRoute(
  discordUserId: string,
  routeKey: string,
  threadId: string,
  threadName: string,
  parentChannelId: string,
  resourceType: 'thread' | 'channel' = 'thread',
  guildId?: string
): Promise<void> {
  const existing = await kv.get(toDiscordProvisioningKey(discordUserId));
  const routes = typeof existing?.routes === 'object' && existing?.routes ? existing.routes : {};
  routes[routeKey] = {
    threadId,
    threadName,
    parentChannelId,
    resourceType,
    guildId: guildId || '',
    updatedAt: new Date().toISOString(),
  };
  await kv.set(toDiscordProvisioningKey(discordUserId), {
    routes,
    updatedAt: new Date().toISOString(),
  });
}

async function upsertProvisionedChannelRoute(
  discordUserId: string,
  routeKey: string,
  channelId: string,
  channelName: string,
  parentCategoryId: string,
  guildId: string
): Promise<void> {
  await upsertProvisionedRoute(
    discordUserId,
    routeKey,
    channelId,
    channelName,
    parentCategoryId,
    'channel',
    guildId
  );
  await kv.set(toDiscordThreadLookupKey(channelId), {
    discordUserId,
    routeKey,
    resourceType: 'channel',
    updatedAt: new Date().toISOString(),
  });
}

async function provisionThreadRoute(args: {
  discordUserId: string;
  channelId: string;
  routeKey: string;
  threadName: string;
  guildId?: string;
}): Promise<string | null> {
  const existing = await kv.get(toDiscordProvisioningKey(args.discordUserId));
  const routes = typeof existing?.routes === 'object' && existing?.routes ? existing.routes : {};
  const known = routes?.[args.routeKey];
  if (known?.threadId) return String(known.threadId);

  let thread: any;
  try {
    // Preferred path: create a private thread directly under the channel
    // to avoid posting visible seed messages in #general.
    thread = await discordFetch(`/channels/${args.channelId}/threads`, {
      method: 'POST',
      body: JSON.stringify({
        name: args.threadName.slice(0, 90),
        auto_archive_duration: 1440,
        type: 12,
        invitable: false,
      }),
    });
  } catch {
    // Fallback for servers/channels that do not permit private-thread creation.
    const seed = await discordFetch(`/channels/${args.channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content: `Provisioning private route **${args.threadName}**`,
      }),
    });
    thread = await discordFetch(`/channels/${args.channelId}/messages/${seed.id}/threads`, {
      method: 'POST',
      body: JSON.stringify({
        name: args.threadName.slice(0, 90),
        auto_archive_duration: 1440,
      }),
    });
  }
  const threadId = String(thread?.id || '');
  if (!threadId) return null;

  await upsertProvisionedRoute(
    args.discordUserId,
    args.routeKey,
    threadId,
    args.threadName,
    args.channelId,
    'thread',
    args.guildId
  );
  await kv.set(toDiscordThreadLookupKey(threadId), {
    discordUserId: args.discordUserId,
    routeKey: args.routeKey,
    updatedAt: new Date().toISOString(),
  });
  return threadId;
}

async function getDiscordContext(discordUserId: string): Promise<{ workspaceId: string; agentId: string; tab: string }> {
  const existing = await kv.get(toDiscordContextKey(discordUserId));
  return {
    workspaceId: String(existing?.workspaceId || 'default'),
    agentId: String(existing?.agentId || 'mission'),
    tab: String(existing?.tab || 'dashboard'),
  };
}

async function setDiscordContext(
  discordUserId: string,
  next: { workspaceId?: string; agentId?: string; tab?: string }
): Promise<{ workspaceId: string; agentId: string; tab: string }> {
  const current = await getDiscordContext(discordUserId);
  const merged = {
    workspaceId: next.workspaceId || current.workspaceId,
    agentId: next.agentId || current.agentId,
    tab: next.tab || current.tab,
  };
  await kv.set(toDiscordContextKey(discordUserId), merged);
  return merged;
}

async function appendDiscordHistory(
  discordUserId: string,
  workspaceId: string,
  agentId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<void> {
  const key = toDiscordHistoryKey(discordUserId, workspaceId, agentId);
  const existing = await kv.get(key);
  const history = Array.isArray(existing?.messages) ? existing.messages : [];
  history.push({
    id: crypto.randomUUID(),
    role,
    content: String(content),
    timestamp: new Date().toISOString(),
  });
  await kv.set(key, {
    messages: history.slice(-200),
    updatedAt: new Date().toISOString(),
  });
}

async function getDiscordHistory(discordUserId: string, workspaceId: string, agentId: string): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const data = await kv.get(toDiscordHistoryKey(discordUserId, workspaceId, agentId));
  const messages = Array.isArray(data?.messages) ? data.messages : [];
  return messages.slice(-16).map((m: any) => ({
    role: m?.role === 'assistant' ? 'assistant' : 'user',
    content: String(m?.content || ''),
  }));
}

function inferAgentForTab(tab: string): { id: string; name: string } {
  const t = String(tab || 'dashboard').toLowerCase();
  if (t === 'tasks') return { id: 'tasks-agent', name: 'Tasks Agent' };
  if (t === 'goals') return { id: 'goals-agent', name: 'Goals Agent' };
  if (t === 'calendar') return { id: 'calendar-agent', name: 'Calendar Agent' };
  if (t === 'financials') return { id: 'financials-agent', name: 'Financials Agent' };
  if (t === 'email') return { id: 'email-agent', name: 'Email Agent' };
  if (t === 'enterprise') return { id: 'mission', name: 'Mission Control' };
  return { id: 'nexus', name: 'Nexus' };
}

function routePrefix(route: { workspaceId: string; tab: string; agentId: string; source?: string }): string {
  return [
    'Route this request in SyncScript context:',
    `tab="${route.tab}"`,
    `agentId="${route.agentId}"`,
    `workspaceId="${route.workspaceId}"`,
    `source="${route.source || 'discord'}"`,
  ].join(' ');
}

async function logDiscordTelemetry(event: string, payload: Record<string, any>): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  const key = `discord_telemetry:${day}`;
  const existing = await kv.get(key);
  const rows = Array.isArray(existing?.events) ? existing.events : [];
  rows.push({
    id: crypto.randomUUID(),
    event,
    timestamp: new Date().toISOString(),
    payload,
  });
  await kv.set(key, { events: rows.slice(-500) });
}

async function generateDiscordAgentReply(args: {
  discordUserId: string;
  prompt: string;
  workspaceId: string;
  tab: string;
  agentId: string;
}): Promise<string> {
  const history = await getDiscordHistory(args.discordUserId, args.workspaceId, args.agentId);
  const timeoutMs = 2200;
  const controller = new AbortController();
  try {
    const requestPayload = {
      message: `${routePrefix({ workspaceId: args.workspaceId, tab: args.tab, agentId: args.agentId })}\nUser request: ${args.prompt}`,
      userId: `discord:${args.discordUserId}`,
      context: {
        source: 'discord',
        currentPage: args.tab,
        workspaceId: args.workspaceId,
        agentId: args.agentId,
        conversationHistory: history,
      },
    };

    const bridgeKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
    const bridgeUrl = SUPABASE_URL
      ? `${SUPABASE_URL}/functions/v1/make-server-57781ad9/openclaw/chat`
      : '';

    const fetchPromise = fetch(bridgeUrl || `${OPENCLAW_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(bridgeUrl && bridgeKey
          ? {
              apikey: bridgeKey,
              Authorization: `Bearer ${bridgeKey}`,
            }
          : (OPENCLAW_TOKEN ? { Authorization: `Bearer ${OPENCLAW_TOKEN}` } : {})),
      },
      signal: controller.signal,
      body: JSON.stringify(requestPayload),
    });
    const timeoutPromise = new Promise<never>((_, reject) => {
      const id = setTimeout(() => {
        controller.abort();
        clearTimeout(id);
        reject(new Error('AI upstream timeout'));
      }, timeoutMs);
    });
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AI upstream failed: ${response.status} ${text}`);
    }
    const json = await response.json();
    const message =
      json?.data?.message?.content ||
      json?.message?.content ||
      json?.data?.response ||
      json?.response ||
      json?.text ||
      'Nexus completed your request. Ask for details and I will expand.';
    return String(message);
  } catch (error: any) {
    const message = String(error?.message || '');
    if (
      error?.name === 'AbortError' ||
      message.includes('aborted') ||
      message.toLowerCase().includes('timeout')
    ) {
      return 'Agent acknowledged. The AI backend took too long for Discord`s response window - try the same prompt again (shorter), or use `/tab` then `/nexus` for a faster routed reply.';
    }
    throw error;
  }
}

async function ensureThreadForRoute(args: {
  discordUserId: string;
  workspaceId: string;
  agentId: string;
  channelId: string;
  threadName: string;
}): Promise<string | null> {
  const key = toDiscordThreadRouteKey(args.discordUserId, args.workspaceId, args.agentId);
  const existing = await kv.get(key);
  if (existing?.threadId) return String(existing.threadId);

  let thread: any;
  try {
    thread = await discordFetch(`/channels/${args.channelId}/threads`, {
      method: 'POST',
      body: JSON.stringify({
        name: args.threadName.slice(0, 90),
        auto_archive_duration: 1440,
        type: 12,
        invitable: false,
      }),
    });
  } catch {
    const seed = await discordFetch(`/channels/${args.channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content: `Starting agent thread: **${args.threadName}**`,
      }),
    });
    thread = await discordFetch(`/channels/${args.channelId}/messages/${seed.id}/threads`, {
      method: 'POST',
      body: JSON.stringify({
        name: args.threadName.slice(0, 90),
        auto_archive_duration: 1440,
      }),
    });
  }
  await kv.set(key, { threadId: thread.id, updatedAt: new Date().toISOString() });
  await kv.set(toDiscordThreadLookupKey(String(thread.id)), {
    discordUserId: args.discordUserId,
    workspaceId: args.workspaceId,
    agentId: args.agentId,
    tab: 'enterprise',
    updatedAt: new Date().toISOString(),
  });
  return String(thread.id);
}

function botHeaders(): Record<string, string> {
  const token = Deno.env.get('DISCORD_BOT_TOKEN');
  if (!token) throw new Error('DISCORD_BOT_TOKEN not set');
  return {
    'Authorization': `Bot ${token}`,
    'Content-Type': 'application/json',
  };
}

async function discordFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(`${DISCORD_API}${path}`, {
    ...options,
    headers: { ...botHeaders(), ...(options.headers || {}) },
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`Discord API error ${response.status}: ${err}`);
    throw new Error(`Discord API ${response.status}: ${err}`);
  }

  return response.json();
}

// ============================================================================
// GUILD & CHANNEL DISCOVERY
// ============================================================================

/**
 * GET /discord/guild-info
 * List bot's guilds and channels — used to find channel IDs
 */
discordRoutes.get('/guild-info', async (c) => {
  try {
    const guilds = await discordFetch('/users/@me/guilds');

    const result: any[] = [];
    for (const guild of guilds) {
      const channels = await discordFetch(`/guilds/${guild.id}/channels`);
      result.push({
        guild: { id: guild.id, name: guild.name },
        channels: channels.map((ch: any) => ({
          id: ch.id,
          name: ch.name,
          type: ch.type,
          position: ch.position,
        })),
      });
    }

    return c.json({ guilds: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// WELCOME MESSAGE
// ============================================================================

const WELCOME_MESSAGE = {
  content: '',
  embeds: [
    {
      title: '🎉 Welcome to the SyncScript Community!',
      description: 
        'We\'re thrilled to have you here! This is the official home for SyncScript beta testers, ' +
        'early adopters, and productivity enthusiasts.\n\n' +
        '**SyncScript** is an AI-powered productivity platform that helps you work with your natural ' +
        'energy rhythms — not against them.',
      color: 0x06b6d4, // cyan-500
      fields: [
        {
          name: '📋 What This Server Is For',
          value: 
            '• **Share feedback** — Your input directly shapes the product\n' +
            '• **Report bugs** — Help us squash issues fast\n' +
            '• **Feature requests** — Tell us what you want built\n' +
            '• **Productivity tips** — Share and learn from the community\n' +
            '• **Early access** — Be first to test new features',
          inline: false,
        },
        {
          name: '🏷️ Channel Guide',
          value: 
            '**#general** — Introduce yourself & chat\n' +
            '**#feedback** — Product feedback & suggestions\n' +
            '**#bugs** — Bug reports\n' +
            '**#feature-requests** — What should we build next?\n' +
            '**#tips-and-tricks** — Share productivity hacks\n' +
            '**#announcements** — Product updates & news',
          inline: false,
        },
        {
          name: '🎁 Beta Tester Perks',
          value: 
            '• **Free full access** during beta\n' +
            '• **Lifetime 50% off** all paid plans\n' +
            '• **Direct founder access** right here in Discord\n' +
            '• **Exclusive beta tester badge** in the app\n' +
            '• **Priority support** — we respond fast',
          inline: false,
        },
        {
          name: '🚀 Getting Started',
          value: 
            '1. Drop a quick intro in **#general**\n' +
            '2. Check your email for your unique beta code\n' +
            '3. Sign up at [syncscript.app](https://www.syncscript.app)\n' +
            '4. Start tracking your energy & productivity!',
          inline: false,
        },
      ],
      footer: {
        text: 'SyncScript Beta • Built for people who want to get more done',
      },
      timestamp: new Date().toISOString(),
    },
  ],
};

/**
 * POST /discord/welcome
 * Clear channel messages and post the welcome message.
 * Body: { channel_id: string } 
 * If no channel_id, discovers guild and uses the first text channel (general).
 */
discordRoutes.post('/welcome', async (c) => {
  try {
    let { channel_id } = await c.req.json().catch(() => ({}));

    // Auto-discover channel if not provided
    if (!channel_id) {
      const guilds = await discordFetch('/users/@me/guilds');
      if (!guilds.length) return c.json({ error: 'Bot is not in any guild' }, 400);

      const syncScriptGuild = guilds.find((g: any) => g.name.toLowerCase().includes('syncscript')) || guilds[0];
      const channels = await discordFetch(`/guilds/${syncScriptGuild.id}/channels`);
      // Find #general or first text channel (type 0 = text)
      const general = channels.find((ch: any) => ch.type === 0 && ch.name === 'general');
      const firstText = channels.find((ch: any) => ch.type === 0);
      channel_id = (general || firstText)?.id;

      if (!channel_id) return c.json({ error: 'No text channel found' }, 404);
    }

    // Try to clear existing messages (requires Manage Messages permission)
    let messagesCleared = 0;
    try {
      const existingMessages = await discordFetch(`/channels/${channel_id}/messages?limit=100`);

      if (existingMessages.length > 0) {
        const messageIds = existingMessages.map((m: any) => m.id);
        const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
        const recentIds = messageIds.filter((id: string) => {
          const timestamp = Number(BigInt(id) >> BigInt(22)) + 1420070400000;
          return timestamp > twoWeeksAgo;
        });

        if (recentIds.length >= 2) {
          await discordFetch(`/channels/${channel_id}/messages/bulk-delete`, {
            method: 'POST',
            body: JSON.stringify({ messages: recentIds }),
          });
          messagesCleared = recentIds.length;
        } else if (recentIds.length === 1) {
          await fetch(`${DISCORD_API}/channels/${channel_id}/messages/${recentIds[0]}`, {
            method: 'DELETE',
            headers: botHeaders(),
          });
          messagesCleared = 1;
        }
      }
    } catch (clearErr: any) {
      console.log(`[Discord] Could not clear messages (permission issue): ${clearErr.message}`);
      // Continue — posting the welcome message is more important
    }

    // Post welcome message
    const posted = await discordFetch(`/channels/${channel_id}/messages`, {
      method: 'POST',
      body: JSON.stringify(WELCOME_MESSAGE),
    });

    // Store the channel ID for future automated posts
    await kv.set('discord_general_channel', channel_id);

    return c.json({
      success: true,
      messagesCleared,
      welcomeMessageId: posted.id,
      channelId: channel_id,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// AUTOMATED ENGAGEMENT MESSAGES (for cron jobs)
// ============================================================================

const ENGAGEMENT_MESSAGES = [
  // Monday - Weekly motivation
  {
    embeds: [{
      title: '🌅 Monday Momentum',
      description: 
        'New week, fresh energy! Here\'s your Monday power-up:\n\n' +
        '**Tip:** Start your week by logging your energy levels in SyncScript. ' +
        'Studies show that scheduling high-focus tasks during your peak energy hours ' +
        'can boost productivity by up to **40%**.\n\n' +
        'What\'s your #1 goal this week? Drop it below!',
      color: 0x06b6d4,
      footer: { text: 'SyncScript Weekly Tips' },
    }],
  },
  // Tuesday - Feature spotlight
  {
    embeds: [{
      title: '✨ Feature Spotlight',
      description: 
        'Did you know SyncScript can **automatically schedule tasks** based on your circadian rhythm?\n\n' +
        'Here\'s how:\n' +
        '1. Log your energy levels for 3+ days\n' +
        '2. Go to Settings > AI Scheduling\n' +
        '3. Enable "Smart Scheduling"\n\n' +
        'The AI learns your energy patterns and places tasks at optimal times. ' +
        'Give it a try and share your results!',
      color: 0x8b5cf6,
      footer: { text: 'SyncScript Feature Tips' },
    }],
  },
  // Wednesday - Community challenge
  {
    embeds: [{
      title: '🏆 Midweek Challenge',
      description: 
        'Let\'s hear it! What\'s one productivity hack that changed your life?\n\n' +
        'Share your best tip and we\'ll feature the top ones in our next product update.\n\n' +
        '💡 **React with 👍 on tips you love!**',
      color: 0x10b981,
      footer: { text: 'SyncScript Community Challenge' },
    }],
  },
  // Thursday - Behind the scenes
  {
    embeds: [{
      title: '🔨 Building in Public',
      description: 
        'Here\'s what the team has been working on this week:\n\n' +
        '• Performance improvements across the dashboard\n' +
        '• New energy tracking visualizations\n' +
        '• Bug fixes from community reports (thank you!)\n' +
        '• Upcoming: Calendar sync improvements\n\n' +
        'Got a feature you\'re waiting for? Let us know in **#feature-requests**!',
      color: 0xf59e0b,
      footer: { text: 'SyncScript Dev Updates' },
    }],
  },
  // Friday - Weekend prep
  {
    embeds: [{
      title: '🎯 Friday Focus',
      description: 
        'Before you wrap up for the week:\n\n' +
        '✅ Review what you accomplished this week\n' +
        '📊 Check your energy trends in the dashboard\n' +
        '📝 Set 1-3 priorities for next Monday\n\n' +
        '**Pro tip:** Your Friday afternoon is perfect for planning, not deep work. ' +
        'Use those last energy reserves for organization!\n\n' +
        'Have a great weekend! 🚀',
      color: 0xec4899,
      footer: { text: 'SyncScript Friday Wrap-up' },
    }],
  },
  // Saturday - Casual/fun
  {
    embeds: [{
      title: '🧠 Science Saturday',
      description: 
        '**Fun fact:** Your brain uses about 20% of your body\'s total energy, ' +
        'even though it\'s only 2% of your body weight.\n\n' +
        'This is why energy management matters more than time management. ' +
        'When your brain is fueled, you can accomplish in 1 hour what might take 3 hours when depleted.\n\n' +
        'That\'s exactly why we built SyncScript! 🧪',
      color: 0x6366f1,
      footer: { text: 'SyncScript Science Corner' },
    }],
  },
  // Sunday - Week preview
  {
    embeds: [{
      title: '📅 Week Preview',
      description: 
        'Tomorrow starts a new week! Here\'s how to set yourself up for success:\n\n' +
        '1. **Open SyncScript** and check your energy patterns from last week\n' +
        '2. **Plan your top 3** most important tasks\n' +
        '3. **Block time** for deep work during your peak hours\n\n' +
        'Remember: You don\'t need to do everything. You need to do the right things ' +
        'at the right time. That\'s the SyncScript way. ⚡',
      color: 0x14b8a6,
      footer: { text: 'SyncScript Weekly Prep' },
    }],
  },
];

/**
 * POST /discord/cron-engagement
 * Called by a cron job to post the day's engagement message.
 * Posts to the stored general channel. Different message for each day of the week.
 */
discordRoutes.post('/cron-engagement', async (c) => {
  try {
    const { force } = await c.req.json().catch(() => ({ force: false }));

    // Get stored channel ID (set during welcome message)
    let channelId = await kv.get('discord_general_channel') as string;

    if (!channelId) {
      // Auto-discover — prefer SyncScript Server over personal server
      const guilds = await discordFetch('/users/@me/guilds');
      if (!guilds.length) return c.json({ error: 'No guilds found' }, 400);

      const syncScriptGuild = guilds.find((g: any) => g.name.toLowerCase().includes('syncscript')) || guilds[0];
      const channels = await discordFetch(`/guilds/${syncScriptGuild.id}/channels`);
      const general = channels.find((ch: any) => ch.type === 0 && ch.name === 'general');
      const firstText = channels.find((ch: any) => ch.type === 0);
      channelId = (general || firstText)?.id;

      if (channelId) await kv.set('discord_general_channel', channelId);
    }

    if (!channelId) return c.json({ error: 'No channel configured' }, 400);

    // Pick message based on day of week (0 = Sunday)
    const dayIndex = new Date().getDay();
    const message = ENGAGEMENT_MESSAGES[dayIndex];

    // Check if we already posted today (avoid duplicates) — skip check if force=true
    const today = new Date().toISOString().slice(0, 10);
    const lastPost = await kv.get('discord_last_cron_post') as string;
    if (lastPost === today && !force) {
      return c.json({ success: true, skipped: true, reason: 'Already posted today' });
    }

    // Post the message
    const posted = await discordFetch(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify(message),
    });

    await kv.set('discord_last_cron_post', today);

    return c.json({
      success: true,
      day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex],
      messageId: posted.id,
      channelId,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /discord/post-announcement
 * Post a custom announcement to the guild's announcements channel (or general).
 * Body: { title: string, message: string, channel_name?: string }
 */
discordRoutes.post('/post-announcement', async (c) => {
  try {
    const { title, message, channel_name } = await c.req.json();

    if (!title || !message) {
      return c.json({ error: 'title and message are required' }, 400);
    }

    // Find the target channel
    const guilds = await discordFetch('/users/@me/guilds');
    if (!guilds.length) return c.json({ error: 'No guilds found' }, 400);

    const channels = await discordFetch(`/guilds/${guilds[0].id}/channels`);
    const target = channel_name
      ? channels.find((ch: any) => ch.type === 0 && ch.name === channel_name)
      : channels.find((ch: any) => ch.type === 0 && ch.name === 'announcements')
        || channels.find((ch: any) => ch.type === 0 && ch.name === 'general');

    if (!target) return c.json({ error: 'Target channel not found' }, 404);

    const posted = await discordFetch(`/channels/${target.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        embeds: [{
          title,
          description: message,
          color: 0x06b6d4,
          footer: { text: 'SyncScript Team' },
          timestamp: new Date().toISOString(),
        }],
      }),
    });

    return c.json({ success: true, messageId: posted.id, channel: target.name });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// CREATE PERMANENT INVITE LINK
// ============================================================================

/**
 * POST /discord/create-invite
 * Uses the bot to create a permanent (never-expiring) invite on the first
 * text channel of the bot's guild. Returns the invite URL.
 */
discordRoutes.post('/create-invite', async (c) => {
  try {
    const guilds = await discordFetch('/users/@me/guilds');
    if (!guilds.length) return c.json({ error: 'Bot is not in any guild' }, 404);

    const guildId = guilds[0].id;
    const channels = await discordFetch(`/guilds/${guildId}/channels`);
    const textChannel = channels.find((ch: any) => ch.type === 0);
    if (!textChannel) return c.json({ error: 'No text channel found' }, 404);

    const invite = await discordFetch(`/channels/${textChannel.id}/invites`, {
      method: 'POST',
      body: JSON.stringify({ max_age: 0, max_uses: 0, unique: false }),
    });

    const url = `https://discord.gg/${invite.code}`;
    return c.json({ success: true, inviteUrl: url, code: invite.code, channel: textChannel.name });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// SEND DISCORD INVITE TO BETA TESTERS
// ============================================================================

/**
 * POST /discord/send-invite-to-beta
 * Email all beta testers the Discord invite link
 */
discordRoutes.post('/send-invite-to-beta', async (c) => {
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) return c.json({ error: 'RESEND_API_KEY not set' }, 500);

    const signups = await kv.getByPrefix('beta:signup:');
    const sent: any[] = [];

    for (const item of signups) {
      const data = item as any;
      if (!data?.email || data.email.includes('@example.com')) continue;

      // Check if we already sent Discord invite to this person
      const alreadySent = await kv.get(`discord_invite_sent:${data.email}`);
      if (alreadySent) {
        sent.push({ email: data.email, status: 'already_sent' });
        continue;
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'SyncScript <noreply@syncscript.app>',
          to: [data.email],
          subject: `🎮 You're Invited — Join the SyncScript Discord Community`,
          reply_to: 'support@syncscript.app',
          html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0f1117;color:#e2e8f0;border-radius:16px;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="display:inline-block;width:64px;height:64px;background:#5865F2;border-radius:16px;line-height:64px;font-size:32px;margin-bottom:12px;">🎮</div>
    <h1 style="font-size:24px;color:#fff;margin:0;">You're Invited to Discord!</h1>
    <p style="color:#94a3b8;font-size:14px;margin-top:8px;">Beta Tester #${data.memberNumber}</p>
  </div>
  
  <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:24px;margin-bottom:24px;">
    <p style="margin:0 0 16px;color:#e2e8f0;font-size:16px;line-height:1.6;">
      Hey there! 👋
    </p>
    <p style="margin:0 0 16px;color:#cbd5e1;font-size:15px;line-height:1.6;">
      As one of our valued beta testers, you're invited to join the <strong style="color:#5865F2;">SyncScript Discord community</strong> — 
      the hub where we share updates, discuss features, and build the future of productivity together.
    </p>
    <p style="margin:0;color:#cbd5e1;font-size:15px;line-height:1.6;">
      This is where you'll get:
    </p>
  </div>

  <div style="background:linear-gradient(135deg,#5865F220,#7c3aed20);border:1px solid #5865F240;border-radius:12px;padding:20px;margin-bottom:24px;">
    <ul style="color:#cbd5e1;padding-left:20px;margin:0;">
      <li style="margin-bottom:10px;"><strong style="color:#5865F2;">Early feature previews</strong> before anyone else</li>
      <li style="margin-bottom:10px;"><strong style="color:#06b6d4;">Direct access to the founder</strong> for questions & ideas</li>
      <li style="margin-bottom:10px;"><strong style="color:#10b981;">Weekly productivity tips</strong> and science-backed insights</li>
      <li style="margin-bottom:10px;"><strong style="color:#f59e0b;">Community challenges</strong> to boost your workflow</li>
      <li style="margin-bottom:0;"><strong style="color:#ec4899;">Priority bug fixes</strong> reported here get fast-tracked</li>
    </ul>
  </div>
  
  <div style="text-align:center;margin-bottom:24px;">
    <a href="${DISCORD_INVITE}" style="display:inline-block;padding:16px 40px;background:#5865F2;color:white;text-decoration:none;border-radius:8px;font-weight:700;font-size:18px;letter-spacing:0.5px;">Join the Discord →</a>
    <p style="color:#64748b;font-size:12px;margin-top:12px;">or paste this link: ${DISCORD_INVITE}</p>
  </div>

  <p style="color:#64748b;font-size:12px;text-align:center;margin:0;">SyncScript • Your energy-first productivity platform</p>
</div>`,
        }),
      });

      if (response.ok) {
        await kv.set(`discord_invite_sent:${data.email}`, new Date().toISOString());
        sent.push({ email: data.email, memberNumber: data.memberNumber, status: 'sent' });
      } else {
        const err = await response.text();
        console.error(`Failed to send Discord invite to ${data.email}: ${err}`);
        sent.push({ email: data.email, status: 'failed', error: err });
      }
    }

    return c.json({ success: true, results: sent, totalSent: sent.filter(s => s.status === 'sent').length });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /discord/post-changelog
 * Post a changelog/update to the announcements channel.
 * Body: { version: string, changes: string[] }
 */
discordRoutes.post('/post-changelog', async (c) => {
  try {
    const { version, changes } = await c.req.json();

    if (!version || !changes?.length) {
      return c.json({ error: 'version and changes[] are required' }, 400);
    }

    const guilds = await discordFetch('/users/@me/guilds');
    if (!guilds.length) return c.json({ error: 'No guilds found' }, 400);

    const channels = await discordFetch(`/guilds/${guilds[0].id}/channels`);
    const announcements = channels.find((ch: any) => ch.type === 0 && ch.name === 'announcements')
      || channels.find((ch: any) => ch.type === 0 && ch.name === 'general');

    if (!announcements) return c.json({ error: 'No announcements channel' }, 404);

    const changeList = changes.map((ch: string) => `• ${ch}`).join('\n');

    const posted = await discordFetch(`/channels/${announcements.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content: '@everyone',
        embeds: [{
          title: `🚀 SyncScript ${version} — What's New`,
          description: `We've been hard at work! Here's what's changed:\n\n${changeList}`,
          color: 0x06b6d4,
          fields: [{
            name: '📝 Your Feedback Matters',
            value: 'Spotted a bug? Have a suggestion? Drop it in **#feedback** or **#bugs**!',
            inline: false,
          }],
          footer: { text: `SyncScript ${version}` },
          timestamp: new Date().toISOString(),
        }],
      }),
    });

    return c.json({ success: true, messageId: posted.id, channel: announcements.name });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /discord/interactions
 * Discord application command endpoint for virtual bot mesh.
 */
discordRoutes.post('/interactions', async (c) => {
  try {
    const signature = c.req.header('x-signature-ed25519');
    const timestamp = c.req.header('x-signature-timestamp');
    const body = await c.req.raw.text();

    if (!(await verifyDiscordSignature(body, signature, timestamp))) {
      return c.json({ error: 'Invalid request signature' }, 401);
    }

    const interaction = JSON.parse(body);
    const interactionType = Number(interaction?.type || 0);

    // PING
    if (interactionType === 1) {
      return c.json({ type: 1 });
    }

    // APPLICATION_COMMAND
    if (interactionType !== 2) {
      return c.json({
        type: 4,
        data: { content: 'Unsupported interaction type.' },
      });
    }

    const interactionId = String(interaction?.id || '');
    if (!interactionId) {
      return c.json({ type: 4, data: { content: 'Missing interaction id.' } });
    }
    const seen = await kv.get(toDiscordInteractionKey(interactionId));
    if (seen?.processed) {
      return c.json({ type: 4, data: { content: 'Duplicate interaction ignored.' } });
    }
    await kv.set(toDiscordInteractionKey(interactionId), { processed: true, at: new Date().toISOString() });

    const commandName = String(interaction?.data?.name || '').toLowerCase();
    const options = Array.isArray(interaction?.data?.options) ? interaction.data.options : [];
    const userId = String(interaction?.member?.user?.id || interaction?.user?.id || 'unknown-discord-user');
    const channelId = String(interaction?.channel_id || '');

    const readOption = (name: string): any => {
      const option = options.find((item: any) => item?.name === name);
      return option?.value;
    };
    const readString = (name: string): string => String(readOption(name) || '');
    const readBool = (name: string): boolean => Boolean(readOption(name));

    if (commandName === 'provision') {
      if (!channelId) {
        return c.json({ type: 4, data: { content: 'Provisioning failed: missing channel context.' } });
      }
      const workspaceId = readString('workspace') || 'default';
      const { provisioned, routeDefs, channelsByName, categoryId, provisionMode, missingPermissions } =
        await provisionDiscordRoutesForUser({
          discordUserId: userId,
          channelId,
          workspaceId,
          enterpriseMemberDiscordUserIds: [userId],
        });

      const activation = await getActivationState(userId);
      const updatedRoutes = new Set(activation.enabledRoutes);
      for (const routeDef of routeDefs) updatedRoutes.add(routeDef.routeKey);
      await setActivationState(userId, { enabledRoutes: Array.from(updatedRoutes) });
      await logDiscordTelemetry('discord.provision', {
        userId,
        workspaceId,
        categoryId,
        channelsByName,
        provisionMode,
        missingPermissions,
        provisionedCount: provisioned.length,
      });

      const modeMessage = provisionMode === 'channels'
        ? `Provisioned private SyncScript workspace for **${workspaceId}**.`
        : `Missing Discord permissions for channel creation, so I provisioned **thread mode** routes in the current channel for **${workspaceId}**.`;
      const permissionHint = missingPermissions.length
        ? `\nMissing permissions detected for bot: ${missingPermissions.join(', ')}.`
        : '';

      return c.json({
        type: 4,
        data: {
          content: `${modeMessage}${permissionHint}\n${provisioned.slice(0, 30).join(' ')}\nUse \`/activate\` to toggle individual routes.`,
        },
      });
    }

    if (commandName === 'activate') {
      const scope = (readString('scope') || 'tab').toLowerCase();
      const value = readString('value') || '';
      const workspaceId = readString('workspace') || 'default';
      const enabled = readBool('enabled');
      const state = await getActivationState(userId);
      const routes = new Set(state.enabledRoutes);
      let routeKey = '';
      if (scope === 'tab') {
        const inferred = inferAgentForTab(value || 'dashboard');
        routeKey = `tab:${String(value || 'dashboard').toLowerCase()}:${inferred.id}`;
      } else if (scope === 'enterprise') {
        routeKey = `enterprise:${sanitizeThreadSuffix(workspaceId)}:${String(value || 'mission').toLowerCase()}`;
      } else if (scope === 'nexus') {
        routeKey = 'nexus';
      } else {
        return c.json({ type: 4, data: { content: 'Unsupported scope. Use nexus|tab|enterprise.' } });
      }
      if (enabled) {
        routes.add(routeKey);
      } else {
        routes.delete(routeKey);
      }
      await setActivationState(userId, { enabledRoutes: Array.from(routes) });
      await logDiscordTelemetry('discord.activate', { userId, scope, value, workspaceId, enabled, routeKey });
      return c.json({
        type: 4,
        data: {
          content: `${enabled ? 'Activated' : 'Deactivated'} route \`${routeKey}\`.`,
        },
      });
    }

    if (commandName === 'agents') {
      const scope = readString('scope') || 'tab';
      const tab = readString('tab') || 'dashboard';
      const activationState = await getActivationState(userId);
      const active = new Set(activationState.enabledRoutes);
      if (scope === 'enterprise') {
        const workspaceId = readString('workspace') || 'default';
        const enterpriseCatalog = await resolveEnterpriseAgentsForWorkspace(workspaceId);
        const enterpriseAgents = enterpriseCatalog.map((item) => [item.id, `${item.name}${active.has(`enterprise:${sanitizeThreadSuffix(workspaceId)}:${item.id}`) ? ' (active)' : ''}`]);
        return c.json({
          type: 4,
          data: {
            content: `Enterprise agents:\n${enterpriseAgents.map((a) => `- \`${a[0]}\`: ${a[1]}`).join('\n')}\n\nUse \`/agent id:<agent-id> workspace:<workspace>\` to start.`,
          },
        });
      }
      const defaultAgent = inferAgentForTab(tab);
      const tabSubagents = (await resolveTabSubagentsForWorkspace('default')).filter((agent) => agent.tab === tab);
      return c.json({
        type: 4,
        data: {
          content: `Tab route for **${tab}** maps to **${defaultAgent.name}** (\`${defaultAgent.id}\`)${active.has(`tab:${tab}:${defaultAgent.id}`) ? ' and is active' : ''}.${tabSubagents.length ? `\nSubagents:\n${tabSubagents.map((item) => `- \`${item.id}\`: ${item.name}`).join('\n')}` : ''}\nUse \`/tab name:${tab} prompt:\"...\"\``,
        },
      });
    }

    if (commandName === 'tab') {
      const tab = readString('name') || 'dashboard';
      const defaultAgent = inferAgentForTab(tab);
      const prompt = readString('prompt');
      const context = await setDiscordContext(userId, { tab, agentId: defaultAgent.id, workspaceId: 'default' });
      let responseText = `Switched to **${tab}** context via **${defaultAgent.name}**.`;
      if (prompt) {
        await appendDiscordHistory(userId, context.workspaceId, context.agentId, 'user', prompt);
        const reply = await generateDiscordAgentReply({
          discordUserId: userId,
          prompt,
          workspaceId: context.workspaceId,
          tab: context.tab,
          agentId: context.agentId,
        });
        await appendDiscordHistory(userId, context.workspaceId, context.agentId, 'assistant', reply);
        responseText = reply;
      }
      await logDiscordTelemetry('discord.tab', { userId, tab, agentId: context.agentId });
      return c.json({ type: 4, data: { content: responseText } });
    }

    if (commandName === 'enterprise') {
      const workspaceId = readString('workspace') || 'default';
      const prompt = readString('prompt');
      const useThread = readBool('thread');
      const context = await setDiscordContext(userId, { workspaceId, tab: 'enterprise', agentId: 'mission' });
      let intro = `Enterprise route set to workspace **${workspaceId}** via **mission** agent.`;

      if (useThread && channelId) {
        const threadId = await ensureThreadForRoute({
          discordUserId: userId,
          workspaceId,
          agentId: 'mission',
          channelId,
          threadName: `mission-${workspaceId}`,
        });
        if (threadId) intro += ` Thread ready: <#${threadId}>`;
      }

      if (prompt) {
        await appendDiscordHistory(userId, context.workspaceId, context.agentId, 'user', prompt);
        const reply = await generateDiscordAgentReply({
          discordUserId: userId,
          prompt,
          workspaceId: context.workspaceId,
          tab: context.tab,
          agentId: context.agentId,
        });
        await appendDiscordHistory(userId, context.workspaceId, context.agentId, 'assistant', reply);
        intro = `${intro}\n\n${reply}`;
      }
      await logDiscordTelemetry('discord.enterprise', { userId, workspaceId, useThread, agentId: 'mission' });
      return c.json({ type: 4, data: { content: intro } });
    }

    if (commandName === 'agent') {
      const workspaceId = readString('workspace') || 'default';
      const agentId = readString('id') || 'mission';
      const prompt = readString('prompt');
      const useThread = readBool('thread');
      const context = await setDiscordContext(userId, { workspaceId, tab: 'enterprise', agentId });
      let responseText = `Connected to agent **${agentId}** in workspace **${workspaceId}**.`;

      if (useThread && channelId) {
        const threadId = await ensureThreadForRoute({
          discordUserId: userId,
          workspaceId,
          agentId,
          channelId,
          threadName: `${agentId}-${workspaceId}`,
        });
        if (threadId) responseText += ` Thread ready: <#${threadId}>`;
      }

      if (prompt) {
        await appendDiscordHistory(userId, context.workspaceId, context.agentId, 'user', prompt);
        const reply = await generateDiscordAgentReply({
          discordUserId: userId,
          prompt,
          workspaceId: context.workspaceId,
          tab: context.tab,
          agentId: context.agentId,
        });
        await appendDiscordHistory(userId, context.workspaceId, context.agentId, 'assistant', reply);
        responseText = `${responseText}\n\n${reply}`;
      }
      await logDiscordTelemetry('discord.agent', { userId, workspaceId, agentId, useThread });
      return c.json({ type: 4, data: { content: responseText } });
    }

    if (commandName === 'nexus') {
      const prompt = readString('prompt');
      const context = await getDiscordContext(userId);
      let responseText = `Nexus route: **${context.tab}** / **${context.agentId}** / **${context.workspaceId}**.`;
      if (prompt) {
        await appendDiscordHistory(userId, context.workspaceId, context.agentId, 'user', prompt);
        const reply = await generateDiscordAgentReply({
          discordUserId: userId,
          prompt,
          workspaceId: context.workspaceId,
          tab: context.tab,
          agentId: context.agentId,
        });
        await appendDiscordHistory(userId, context.workspaceId, context.agentId, 'assistant', reply);
        responseText = reply;
      }
      await logDiscordTelemetry('discord.nexus', { userId, tab: context.tab, agentId: context.agentId, workspaceId: context.workspaceId });
      return c.json({ type: 4, data: { content: responseText } });
    }

    return c.json({
      type: 4,
      data: {
        content: 'Unknown command. Use /nexus, /tab, /enterprise, /agent, /agents, /provision, or /activate.',
      },
    });
  } catch (error: any) {
    console.error('[Discord] Interaction error:', error);
    return c.json({
      type: 4,
      data: {
        content: `Interaction error: ${error?.message || 'unknown error'}`,
      },
    });
  }
});

discordRoutes.get('/virtual/history', async (c) => {
  try {
    const discordUserId = String(c.req.query('discordUserId') || '');
    const workspaceId = String(c.req.query('workspaceId') || 'default');
    const agentId = String(c.req.query('agentId') || 'mission');
    if (!discordUserId) {
      return c.json({ error: 'discordUserId is required' }, 400);
    }
    const data = await kv.get(toDiscordHistoryKey(discordUserId, workspaceId, agentId));
    return c.json({
      success: true,
      data: {
        messages: Array.isArray(data?.messages) ? data.messages : [],
      },
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /discord/sync-agent-registry
 * Sync app-defined parent/subagent registry so provisioning mirrors SyncScript.app.
 * Body: { workspaceId: string, agents: Array<{ id, name, parentType, parentId }> }
 */
discordRoutes.post('/sync-agent-registry', async (c) => {
  try {
    const body = await c.req.json();
    const workspaceId = String(body?.workspaceId || 'default').trim() || 'default';
    const agents = normalizeRegistryAgents(body?.agents);
    await setDiscordAgentRegistry(workspaceId, agents);
    return c.json({
      success: true,
      workspaceId,
      count: agents.length,
      enterpriseAgents: agents.filter((agent) => agent.parentType === 'enterprise').length,
      tabSubagents: agents.filter((agent) => agent.parentType === 'tab').length,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * GET /discord/agent-identities
 * Returns workspace-scoped visual identity profiles for agents.
 * Auth required.
 */
discordRoutes.get('/agent-identities', async (c) => {
  try {
    const userId = await resolveAuthenticatedUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const workspaceId = String(c.req.query('workspaceId') || 'default').trim() || 'default';
    const key = toDiscordAgentIdentityKey(workspaceId, userId);
    const legacyKey = toDiscordAgentIdentityLegacyKey(workspaceId);
    const stored = await kv.get(key) || await kv.get(legacyKey);
    const normalized = normalizeDiscordAgentIdentityProfiles(stored?.profiles);
    const entries = await Promise.all(
      Object.entries(normalized).map(async ([profileKey, profile]) => {
        if (!profile.avatarPath) return [profileKey, profile] as const;
        const signedUrl = await createAgentAvatarSignedUrl(profile.avatarPath);
        return [profileKey, { ...profile, avatarUrl: signedUrl || profile.avatarUrl }] as const;
      })
    );
    const profiles = Object.fromEntries(entries);
    return c.json({
      success: true,
      workspaceId,
      profiles,
      updatedAt: stored?.updatedAt || null,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /discord/agent-identities
 * Persists workspace-scoped visual identity profiles for agents.
 * Auth required.
 * Body: { workspaceId: string, profiles: Record<string, { avatarDataUrl?: string, voiceBadge?: string }> }
 */
discordRoutes.post('/agent-identities', async (c) => {
  try {
    const userId = await resolveAuthenticatedUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const body = await c.req.json();
    const workspaceId = String(body?.workspaceId || 'default').trim() || 'default';
    const profiles = normalizeDiscordAgentIdentityProfiles(body?.profiles);
    await kv.set(toDiscordAgentIdentityKey(workspaceId, userId), {
      profiles,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    });
    await cleanupOrphanedAgentAvatars({
      workspaceId,
      userId,
      profiles,
    });
    return c.json({
      success: true,
      workspaceId,
      count: Object.keys(profiles).length,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /discord/agent-avatar/upload
 * Uploads an agent avatar image to Supabase Storage and returns a signed URL + storage path.
 * Auth required.
 */
discordRoutes.post('/agent-avatar/upload', async (c) => {
  try {
    const userId = await resolveAuthenticatedUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    if (!storageAdminClient) {
      return c.json({ error: 'Storage unavailable' }, 500);
    }
    const form = await c.req.formData();
    const file = form.get('file') as File | null;
    const workspaceId = String(form.get('workspaceId') || 'default').trim() || 'default';
    const cardKey = String(form.get('cardKey') || 'agent').trim() || 'agent';
    const previousPath = String(form.get('previousPath') || '').trim();

    if (!file) return c.json({ error: 'Missing file' }, 400);
    if (!String(file.type || '').startsWith('image/')) {
      return c.json({ error: 'Only image files are supported' }, 400);
    }
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: 'Avatar exceeds 5MB limit' }, 400);
    }

    await ensureAgentAvatarBucket();
    const segmentWorkspace = sanitizeStoragePathSegment(workspaceId, 40);
    const segmentCard = sanitizeStoragePathSegment(cardKey, 80);
    const path = `${sanitizeStoragePathSegment(userId, 48)}/${segmentWorkspace}/${segmentCard}/${Date.now()}.webp`;
    const buffer = await file.arrayBuffer();
    const { error: uploadError } = await storageAdminClient.storage
      .from(AGENT_AVATAR_BUCKET)
      .upload(path, buffer, {
        contentType: file.type || 'image/webp',
        upsert: true,
      });
    if (uploadError) {
      return c.json({ error: `Upload failed: ${uploadError.message}` }, 500);
    }

    if (previousPath && previousPath.startsWith(`${sanitizeStoragePathSegment(userId, 48)}/`)) {
      await storageAdminClient.storage.from(AGENT_AVATAR_BUCKET).remove([previousPath]);
    }

    const indexKey = toDiscordAgentAvatarIndexKey(workspaceId, userId);
    const existingIndex = await kv.get(indexKey);
    const indexed = normalizeAvatarPathIndex(existingIndex?.paths);
    const nextIndexed = Array.from(new Set([...indexed, path]));
    await kv.set(indexKey, {
      paths: nextIndexed,
      updatedAt: new Date().toISOString(),
    });

    const avatarUrl = await createAgentAvatarSignedUrl(path);
    return c.json({
      success: true,
      workspaceId,
      cardKey,
      avatarPath: path,
      avatarUrl: avatarUrl || null,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /discord/sync-commands
 * Registers slash commands for hybrid Nexus + agent routing.
 */
discordRoutes.post('/sync-commands', async (c) => {
  try {
    let appId = Deno.env.get('DISCORD_APPLICATION_ID');
    if (!appId) {
      // Fallback: derive application id from the bot OAuth app profile.
      const appProfile = await discordFetch('/oauth2/applications/@me');
      appId = String(appProfile?.id || '');
    }
    if (!appId) return c.json({ error: 'DISCORD_APPLICATION_ID not configured' }, 400);
    const body = [
      {
        name: 'nexus',
        description: 'Talk with Nexus using current route context',
        options: [{ type: 3, name: 'prompt', description: 'Message for Nexus', required: false }],
      },
      {
        name: 'tab',
        description: 'Route to a tab-specific SyncScript agent',
        options: [
          { type: 3, name: 'name', description: 'dashboard|tasks|goals|calendar|financials|email|enterprise', required: true },
          { type: 3, name: 'prompt', description: 'Optional prompt to execute immediately', required: false },
        ],
      },
      {
        name: 'enterprise',
        description: 'Route to enterprise mission control workspace',
        options: [
          { type: 3, name: 'workspace', description: 'Workspace id', required: true },
          { type: 3, name: 'prompt', description: 'Optional prompt', required: false },
          { type: 5, name: 'thread', description: 'Create/reuse thread for this route', required: false },
        ],
      },
      {
        name: 'agent',
        description: 'Route to a specific enterprise subagent',
        options: [
          { type: 3, name: 'id', description: 'Agent id', required: true },
          { type: 3, name: 'workspace', description: 'Workspace id', required: true },
          { type: 3, name: 'prompt', description: 'Optional prompt', required: false },
          { type: 5, name: 'thread', description: 'Create/reuse thread for this agent', required: false },
        ],
      },
      {
        name: 'agents',
        description: 'List available tab or enterprise agents',
        options: [
          { type: 3, name: 'scope', description: 'tab|enterprise', required: true },
          { type: 3, name: 'tab', description: 'Tab name when scope=tab', required: false },
        ],
      },
      {
        name: 'provision',
        description: 'Provision private Discord threads for Nexus, tab agents, and enterprise routes',
        options: [
          { type: 3, name: 'workspace', description: 'Enterprise workspace id for scoped routes', required: false },
        ],
      },
      {
        name: 'activate',
        description: 'Activate or deactivate specific virtual agent routes',
        options: [
          { type: 3, name: 'scope', description: 'nexus|tab|enterprise', required: true },
          { type: 5, name: 'enabled', description: 'True to activate route, false to deactivate', required: true },
          { type: 3, name: 'value', description: 'Tab name or enterprise agent id', required: false },
          { type: 3, name: 'workspace', description: 'Workspace id when scope=enterprise', required: false },
        ],
      },
    ];
    const result = await discordFetch(`/applications/${appId}/commands`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return c.json({ success: true, commands: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /discord/provision-direct
 * Direct provisioning endpoint (non-interaction) to avoid Discord interaction timeouts.
 * Body: {
 *   discordUserId: string,
 *   channelId: string,
 *   workspaceId?: string,
 *   enterpriseMemberDiscordUserIds?: string[]
 * }
 */
discordRoutes.post('/provision-direct', async (c) => {
  try {
    const body = await c.req.json();
    const discordUserId = String(body?.discordUserId || '').trim();
    const channelId = String(body?.channelId || '').trim();
    const workspaceId = String(body?.workspaceId || 'default').trim() || 'default';
    const enterpriseMemberDiscordUserIds = normalizeDiscordUserIds(body?.enterpriseMemberDiscordUserIds, discordUserId);

    if (!discordUserId || !channelId) {
      return c.json({ error: 'discordUserId and channelId are required' }, 400);
    }

    const { provisioned, routeDefs, channelsByName, categoryId, provisionMode, missingPermissions } =
      await provisionDiscordRoutesForUser({
        discordUserId,
        channelId,
        workspaceId,
        enterpriseMemberDiscordUserIds,
      });

    const activation = await getActivationState(discordUserId);
    const updatedRoutes = new Set(activation.enabledRoutes);
    for (const routeDef of routeDefs) updatedRoutes.add(routeDef.routeKey);
    await setActivationState(discordUserId, { enabledRoutes: Array.from(updatedRoutes) });

    await logDiscordTelemetry('discord.provision.direct', {
      userId: discordUserId,
      workspaceId,
      enterpriseMemberCount: enterpriseMemberDiscordUserIds.length,
      categoryId,
      channelsByName,
      provisionMode,
      missingPermissions,
      provisionedCount: provisioned.length,
    });

    return c.json({
      success: true,
      provisionMode,
      missingPermissions,
      workspaceId,
      categoryId,
      channelsByName,
      resources: provisioned,
      routeCount: routeDefs.length,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * GET /discord/provisioning-state
 * Returns provisioned Discord route resources for a user/workspace.
 * Query: discordUserId, workspaceId?
 */
discordRoutes.get('/provisioning-state', async (c) => {
  try {
    const discordUserId = String(c.req.query('discordUserId') || '').trim();
    const workspaceId = String(c.req.query('workspaceId') || 'default').trim() || 'default';
    if (!discordUserId) {
      return c.json({ error: 'discordUserId is required' }, 400);
    }

    const provisioning = await kv.get(toDiscordProvisioningKey(discordUserId));
    const routes = typeof provisioning?.routes === 'object' && provisioning?.routes ? provisioning.routes : {};
    const activation = await getActivationState(discordUserId);
    const workspaceSlug = sanitizeThreadSuffix(workspaceId);

    const scopedRoutes = Object.entries(routes).reduce((acc, [routeKey, value]) => {
      const key = String(routeKey || '');
      if (
        key === 'nexus' ||
        key === 'enterprise' ||
        key.startsWith('tab:') ||
        key.startsWith(`enterprise:${workspaceSlug}`)
      ) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);

    return c.json({
      success: true,
      workspaceId,
      routes: scopedRoutes,
      enabledRoutes: activation.enabledRoutes,
      updatedAt: provisioning?.updatedAt || null,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default discordRoutes;
