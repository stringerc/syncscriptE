import { useCallback, useState } from 'react';
import { projectId } from '../utils/supabase/info';
import { useAuth } from '../contexts/AuthContext';

const EDGE_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9`;

export type UserFileRow = {
  id: string;
  storage_path: string;
  size_bytes: number;
  mime_type: string | null;
  original_filename: string | null;
  created_at: string;
  sha256: string | null;
};

export function useUserFiles() {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const listFiles = useCallback(
    async (offset = 0, limit = 30) => {
      if (!accessToken) return { ok: false as const, error: 'no_session' };
      setLoading(true);
      try {
        const r = await fetch(`${EDGE_BASE}/resources/files?offset=${offset}&limit=${limit}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) return { ok: false as const, error: data?.error || 'list_failed' };
        return {
          ok: true as const,
          files: (data.files || []) as UserFileRow[],
          total: typeof data.total === 'number' ? data.total : 0,
          limit: typeof data.limit === 'number' ? data.limit : limit,
          offset: typeof data.offset === 'number' ? data.offset : offset,
        };
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  const getSignedUrl = useCallback(
    async (fileId: string) => {
      if (!accessToken) return null;
      const r = await fetch(`${EDGE_BASE}/resources/file/${fileId}/signed-url`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data?.url) return null;
      return data.url as string;
    },
    [accessToken],
  );

  const deleteFile = useCallback(
    async (fileId: string) => {
      if (!accessToken) return false;
      const r = await fetch(`${EDGE_BASE}/resources/file/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return r.ok;
    },
    [accessToken],
  );

  return { listFiles, getSignedUrl, deleteFile, loading, accessToken };
}
