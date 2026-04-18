import { projectId } from '@/utils/supabase/info';
import { supabase } from '@/utils/supabase/client';

const EDGE_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9`;

export type CalendarSyncGroupRow = {
  id: string;
  created_at: string;
  title: string;
  start_time: string;
  end_time: string;
  instances: { provider: string; event_id?: string; link?: string | null }[];
};

export async function fetchCalendarSyncGroups(): Promise<{ groups: CalendarSyncGroupRow[] }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { groups: [] };
  }
  const res = await fetch(`${EDGE_BASE}/calendar/sync-groups`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `sync-groups ${res.status}`);
  }
  return res.json() as Promise<{ groups: CalendarSyncGroupRow[] }>;
}

export type PatchCalendarSyncGroupResponse = {
  ok?: boolean;
  removed?: boolean;
  group?: CalendarSyncGroupRow;
  results?: unknown[];
  error?: string;
};

export type PostCalendarHoldResultRow = {
  provider: string;
  success: boolean;
  error?: string | null;
  data?: {
    eventId?: string;
    htmlLink?: string | null;
    webLink?: string | null;
    summary?: string;
    subject?: string;
  } | null;
};

export type PostCalendarHoldResponse = {
  success?: boolean;
  sync_group_id?: string;
  provider_mode?: string;
  results?: PostCalendarHoldResultRow[];
  error?: string;
  code?: string;
};

/** POST /calendar/hold — creates provider event(s) and optional sync group (same as Calendar quick hold). */
export async function postCalendarHold(body: {
  title: string;
  start_iso: string;
  end_iso: string;
  time_zone?: string;
  provider?: 'auto' | 'google' | 'outlook';
  targets?: ('google' | 'outlook')[];
}): Promise<PostCalendarHoldResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Sign in required');
  }
  const res = await fetch(`${EDGE_BASE}/calendar/hold`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const payload = (await res.json().catch(() => ({}))) as PostCalendarHoldResponse;
  if (!res.ok) {
    const err = new Error(payload?.error || `calendar/hold ${res.status}`);
    (err as Error & { code?: string }).code = payload?.code;
    throw err;
  }
  return payload;
}

export async function patchCalendarSyncGroup(
  id: string,
  body: {
    targets: ('google' | 'outlook')[];
    title?: string;
    start_time?: string;
    end_time?: string;
    time_zone?: string;
  },
): Promise<PatchCalendarSyncGroupResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Sign in required');
  }
  const res = await fetch(`${EDGE_BASE}/calendar/sync-group/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const payload = (await res.json().catch(() => ({}))) as PatchCalendarSyncGroupResponse;
  if (!res.ok) {
    throw new Error(payload?.error || `PATCH sync-group ${res.status}`);
  }
  return payload;
}
