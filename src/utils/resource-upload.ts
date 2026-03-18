import { projectId, publicAnonKey } from './supabase/info';

export interface UploadedResourceResult {
  provider: 'r2' | 'supabase';
  objectKey: string;
  url: string;
  contentType: string;
  size: number;
}

function getResourcesUploadUrl(): string {
  return `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/resources/upload`;
}

export async function uploadResourceFile(
  file: File,
  context: { type: 'task' | 'milestone' | 'step'; id?: string; milestoneId?: string },
): Promise<UploadedResourceResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('contextType', context.type);
  formData.append('contextId', context.id || context.milestoneId || 'unknown');

  const response = await fetch(getResourcesUploadUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${publicAnonKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || `Upload failed with status ${response.status}`);
  }

  const data = (await response.json()) as UploadedResourceResult & { ok?: boolean };
  return {
    provider: data.provider,
    objectKey: data.objectKey,
    url: data.url,
    contentType: data.contentType,
    size: data.size,
  };
}
