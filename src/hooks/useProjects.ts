/**
 * Projects CRUD + selected-project state (sticky in localStorage so the user's
 * project filter persists across reloads of the dashboard).
 */
import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';
import { projectId as supaProjectRef, publicAnonKey } from '../utils/supabase/info';

const SELECTED_PROJECT_KEY = 'syncscript-selected-project';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  archived: boolean;
  created_at: string;
}

const supa = createClient(`https://${supaProjectRef}.supabase.co`, publicAnonKey, { auth: { persistSession: false } });

export function useProjects() {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ['projects'],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      const res = await fetch(`https://${supaProjectRef}.supabase.co/rest/v1/projects?select=id,name,description,color,archived,created_at&order=created_at.desc&limit=200`, {
        headers: {
          apikey: publicAnonKey,
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) throw new Error(`projects ${res.status}`);
      return ((await res.json()) as Project[]).filter((p) => !p.archived);
    },
  });
}

export function useCreateProject() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string; color?: string }) => {
      // PostgREST insert (RLS enforces user_id == auth.uid())
      const res = await fetch(`https://${supaProjectRef}.supabase.co/rest/v1/projects`, {
        method: 'POST',
        headers: {
          apikey: publicAnonKey,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          // user_id auto-filled by trigger or RLS check_user_id_default; we explicitly pass it via auth.uid() default if column allows
          name: input.name.slice(0, 200),
          description: input.description?.slice(0, 500) || null,
          color: input.color || null,
        }),
      });
      if (!res.ok) throw new Error(`projects.create ${res.status}`);
      return ((await res.json()) as Project[])[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useSelectedProject() {
  const [selected, setSelected] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try { return localStorage.getItem(SELECTED_PROJECT_KEY); } catch { return null; }
  });
  const select = useCallback((id: string | null) => {
    setSelected(id);
    try {
      if (id) localStorage.setItem(SELECTED_PROJECT_KEY, id);
      else localStorage.removeItem(SELECTED_PROJECT_KEY);
    } catch { /* */ }
  }, []);
  return { selected, select };
}
