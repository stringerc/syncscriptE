import { projectId } from './supabase/info';

export interface UploadedResourceResult {
  provider: 'r2' | 'supabase';
  objectKey: string;
  url: string;
  contentType: string;
  size: number;
  file_id?: string;
  sha256?: string;
  link_id?: string | null;
}

function getResourcesUploadUrl(): string {
  return `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/resources/upload`;
}

/**
 * Upload a file to the Edge user-library pipeline. Requires a real user JWT (not anon).
 */
export async function uploadResourceFile(
  file: File,
  context: { type: 'task' | 'milestone' | 'step'; id?: string; milestoneId?: string },
  accessToken: string | null,
): Promise<UploadedResourceResult> {
  if (!accessToken) {
    throw new Error('Sign in required to upload files');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('contextType', context.type);
  formData.append('contextId', context.id || context.milestoneId || 'unknown');

  const response = await fetch(getResourcesUploadUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || `Upload failed with status ${response.status}`);
  }

  const data = (await response.json()) as UploadedResourceResult & { ok?: boolean; file_id?: string };
  return {
    provider: data.provider,
    objectKey: data.objectKey,
    url: data.url,
    contentType: data.contentType,
    size: data.size,
    file_id: data.file_id,
    sha256: data.sha256,
    link_id: data.link_id ?? null,
  };
}
