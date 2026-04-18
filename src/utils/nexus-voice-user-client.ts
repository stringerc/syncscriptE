/**
 * Signed-in Nexus voice turns — same API as App AI chat (tools, toolTrace, canvas).
 */

import { NEXUS_USER_CHAT_PATH } from '../config/nexus-vercel-ai-routes';

export interface NexusVoiceTurnMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function postNexusUserVoiceTurn(params: {
  accessToken: string;
  messages: NexusVoiceTurnMessage[];
  privateContext: Record<string, unknown>;
  personaMode?: string;
}): Promise<{
  content: string;
  toolTrace: Array<Record<string, unknown>>;
  error?: string;
  httpStatus: number;
  /** From response header — correlate with Vercel / `emitNexusTrace` when debugging latency. */
  nexusRequestId?: string;
  nexusBrainVersion?: string;
}> {
  const res = await fetch(NEXUS_USER_CHAT_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      messages: params.messages,
      privateContext: params.privateContext,
      enableTools: true,
      voiceMode: true,
      personaMode: params.personaMode,
    }),
  });

  const nexusRequestId = res.headers.get('x-nexus-request-id')?.trim() || undefined;
  const nexusBrainVersion = res.headers.get('x-nexus-brain-version')?.trim() || undefined;

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    return {
      content: '',
      toolTrace: [],
      error: typeof data.error === 'string' ? data.error : `Request failed (${res.status})`,
      httpStatus: res.status,
      nexusRequestId,
      nexusBrainVersion,
    };
  }

  const content = typeof data.content === 'string' ? data.content : '';
  const toolTrace = Array.isArray(data.toolTrace) ? (data.toolTrace as Array<Record<string, unknown>>) : [];

  return { content, toolTrace, httpStatus: res.status, nexusRequestId, nexusBrainVersion };
}
