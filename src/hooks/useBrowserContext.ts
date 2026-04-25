/**
 * Browser context hooks — reads `browser_contexts` metadata via PostgREST RLS,
 * and calls the user-callable RPCs (`clear_browser_context`,
 * `disconnect_browser_site`) for the Settings → Agent → Connected sites UI.
 *
 * The actual cookies live in vault and are only accessed by the runner's
 * service-role client. We never decrypt them on the user-facing surface.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';
import { projectId as supaRef, publicAnonKey } from '../utils/supabase/info';

const supa = createClient(`https://${supaRef}.supabase.co`, publicAnonKey, { auth: { persistSession: false } });

export interface BrowserContextRow {
  user_id: string;
  hostnames: string[];
  bytes: number;
  cookie_count: number;
  last_used_at: string | null;
  created_at: string;
}

export function useBrowserContext() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();

  const get = useQuery({
    queryKey: ['browser-context'],
    enabled: Boolean(accessToken),
    refetchInterval: 30_000,
    queryFn: async () => {
      const res = await fetch(
        `https://${supaRef}.supabase.co/rest/v1/browser_contexts?select=*&limit=1`,
        { headers: { apikey: publicAnonKey, Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) throw new Error(`browser_contexts ${res.status}`);
      const rows = (await res.json()) as BrowserContextRow[];
      return rows[0] ?? null;
    },
  });

  const clearAll = useMutation({
    mutationFn: async () => {
      const c = supa.auth.setSession({ access_token: accessToken!, refresh_token: '' }).then(() =>
        supa.rpc('clear_browser_context'),
      );
      const result = await c;
      if (result?.error) throw new Error(result.error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['browser-context'] }),
  });

  const disconnectSite = useMutation({
    mutationFn: async (hostname: string) => {
      await supa.auth.setSession({ access_token: accessToken!, refresh_token: '' });
      const result = await supa.rpc('disconnect_browser_site', { p_hostname: hostname });
      if (result?.error) throw new Error(result.error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['browser-context'] }),
  });

  return { get, clearAll, disconnectSite };
}
