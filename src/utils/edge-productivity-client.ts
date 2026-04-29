/**
 * Edge make-server productivity API (business plan, activity, social prefs, PATs).
 * Same base URL + auth pattern as SupabaseTaskRepository.
 */
import { projectId, publicAnonKey } from './supabase/info';
import { supabase } from './supabase/client';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9`;

async function edgeFetch(path: string, init?: RequestInit, didRefresh = false): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || '';
  const mergedHeaders: Record<string, string> = {
    apikey: publicAnonKey,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers: mergedHeaders });

  if (response.status === 401 && !didRefresh) {
    const { data } = await supabase.auth.refreshSession();
    if (data.session?.access_token) {
      return edgeFetch(path, init, true);
    }
  }
  return response;
}

export type BusinessPlanSections = Record<string, string>;

export async function fetchBusinessPlan(): Promise<{ sections: BusinessPlanSections; updatedAt: string | null }> {
  const res = await edgeFetch('/business-plan');
  if (!res.ok) throw new Error(`business-plan ${res.status}`);
  return res.json();
}

export async function saveBusinessPlan(sections: BusinessPlanSections): Promise<void> {
  const res = await edgeFetch('/business-plan', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sections }),
  });
  if (!res.ok) throw new Error(`business-plan save ${res.status}`);
}

export async function exportBusinessPlanMarkdown(): Promise<string> {
  const res = await edgeFetch('/business-plan/export.md');
  if (!res.ok) throw new Error(`business-plan export ${res.status}`);
  return res.text();
}

export type ActivityCell = { date: string; count: number };

export async function fetchActivitySummary(days = 371): Promise<ActivityCell[]> {
  const res = await edgeFetch(`/activity/summary?days=${days}`);
  if (!res.ok) return [];
  const j = await res.json().catch(() => ({}));
  return Array.isArray(j.cells) ? j.cells : [];
}

export type SocialPrefs = {
  heatmapVisibility: 'private' | 'friends' | 'public_summary';
  friendFeedOptIn: boolean;
  updatedAt: string | null;
};

export async function fetchSocialPrefs(): Promise<SocialPrefs | null> {
  const res = await edgeFetch('/social/prefs');
  if (!res.ok) return null;
  return res.json();
}

export async function saveSocialPrefs(prefs: Partial<{ heatmapVisibility: SocialPrefs['heatmapVisibility']; friendFeedOptIn: boolean }>): Promise<SocialPrefs | null> {
  const res = await edgeFetch('/social/prefs', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      heatmapVisibility: prefs.heatmapVisibility,
      friendFeedOptIn: prefs.friendFeedOptIn,
    }),
  });
  if (!res.ok) return null;
  return res.json();
}

export type ApiTokenMeta = {
  id: string;
  scopes: string[];
  label: string;
  created_at: string;
  last_used_at: string | null;
};

export async function listApiTokens(): Promise<ApiTokenMeta[]> {
  const res = await edgeFetch('/api-tokens');
  if (!res.ok) return [];
  const j = await res.json().catch(() => ({}));
  return Array.isArray(j.tokens) ? j.tokens : [];
}

export async function createApiToken(label?: string): Promise<{ token: string } | null> {
  const res = await edgeFetch('/api-tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label: label || 'Cursor / MCP' }),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function revokeApiToken(id: string): Promise<boolean> {
  const res = await edgeFetch(`/api-tokens/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return res.ok;
}

export type FriendActivityEvent = {
  event_id: string;
  actor_user_id: string;
  event_type: string;
  intensity: number;
  metadata: Record<string, unknown>;
  occurred_at: string;
  visibility: string;
};

export async function fetchFriendActivityFeed(limit = 40): Promise<FriendActivityEvent[]> {
  const res = await edgeFetch(`/friends/activity-feed?limit=${limit}`);
  if (!res.ok) return [];
  const j = await res.json().catch(() => ({}));
  return Array.isArray(j.events) ? j.events : [];
}
