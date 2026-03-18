import { projectId, publicAnonKey } from './supabase/info';

export type CanonicalChatDescriptor = {
  workspaceId: string;
  routeKey: string;
  tab: string;
  agentId: string;
};

export type CanonicalChatMessage = {
  id: string;
  seq: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  source: string;
};

const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/discord`;

function authHeaders(accessToken?: string | null): Record<string, string> {
  const token = String(accessToken || publicAnonKey || '').trim();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchCanonicalHistory(
  descriptor: CanonicalChatDescriptor,
  accessToken?: string | null,
  limit = 120,
): Promise<CanonicalChatMessage[]> {
  const params = new URLSearchParams({
    workspaceId: descriptor.workspaceId,
    routeKey: descriptor.routeKey,
    limit: String(limit),
  });
  const response = await fetch(`${baseUrl}/chat/history?${params.toString()}`, {
    method: 'GET',
    headers: authHeaders(accessToken),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(String(data?.error || `History failed (${response.status})`));
  }
  return Array.isArray(data?.messages) ? data.messages : [];
}

export async function appendCanonicalMessage(
  descriptor: CanonicalChatDescriptor,
  role: 'user' | 'assistant' | 'system',
  content: string,
  accessToken?: string | null,
  options?: { source?: string; idempotencyKey?: string },
): Promise<{ id: string; seq: number }> {
  const response = await fetch(`${baseUrl}/chat/message`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify({
      workspaceId: descriptor.workspaceId,
      routeKey: descriptor.routeKey,
      tab: descriptor.tab,
      agentId: descriptor.agentId,
      role,
      content,
      source: options?.source || 'syncscript-app',
      idempotencyKey: options?.idempotencyKey,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(String(data?.error || `Message append failed (${response.status})`));
  }
  return {
    id: String(data?.message?.id || ''),
    seq: Number(data?.message?.seq || 0),
  };
}
