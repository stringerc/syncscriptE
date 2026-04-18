import { projectId } from './supabase/info';

const base = () =>
  `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/resources`;

export interface LibraryFileRow {
  id: string;
  storage_path: string;
  size_bytes: number | null;
  mime_type: string | null;
  original_filename: string | null;
  created_at: string;
  sha256: string | null;
}

export interface LibrarySearchResponse {
  ok: boolean;
  query: string;
  files: LibraryFileRow[];
  count: number;
}

/**
 * Authenticated search across library filenames and extracted_text (same API for web, iOS, Watch).
 */
export async function searchLibraryResources(
  accessToken: string,
  query: string,
  limit = 20,
): Promise<LibrarySearchResponse> {
  const q = encodeURIComponent(query.trim());
  const url = `${base()}/search?q=${q}&limit=${Math.min(50, Math.max(1, limit))}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Library search failed (${res.status})`);
  }
  return res.json() as Promise<LibrarySearchResponse>;
}

/** Email a signed download link to the signed-in user's account email. */
export async function emailLibraryFileToSelf(accessToken: string, fileId: string): Promise<{ ok: boolean; email_id?: string }> {
  const url = `${base()}/file/${encodeURIComponent(fileId)}/email-self`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Email link failed (${res.status})`);
  }
  return res.json() as Promise<{ ok: boolean; email_id?: string }>;
}

/** Pin a file to the library entity collection (server-side link row). */
export async function pinLibraryFileToCollection(
  accessToken: string,
  fileId: string,
  entityId = 'default',
): Promise<{ ok: boolean; duplicate?: boolean; link_id?: string }> {
  const url = `${base()}/file/${encodeURIComponent(fileId)}/pin-to-library`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ entity_id: entityId }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Pin failed (${res.status})`);
  }
  return res.json() as Promise<{ ok: boolean; duplicate?: boolean; link_id?: string }>;
}
