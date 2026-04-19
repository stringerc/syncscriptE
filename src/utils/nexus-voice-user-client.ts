/**
 * Signed-in Nexus voice turns — same API as App AI chat (tools, toolTrace, canvas).
 *
 * Bearer token:
 * - `supabase.auth.getUser()` validates the JWT with Supabase and refreshes when expired
 *   (unlike `getSession()` alone, which can return a stale access_token from storage).
 * - On HTTP 401, `refreshSession()` then resolve again and retry once (always retry — do not
 *   skip when the token string matches; refresh may fix server-side rejection).
 * - Calls are serialized so overlapping STT turns cannot race on refresh/session state.
 */

import { NEXUS_USER_CHAT_PATH } from '../config/nexus-vercel-ai-routes';
import { supabase } from './supabase/client';

export interface NexusVoiceTurnMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Guest Edge tokens are not Supabase user JWTs — nexus-user will 401; avoid piling requests. */
function isGuestStyleToken(t: string): boolean {
  return t.startsWith('gst_');
}

let voiceTurnChain: Promise<void> = Promise.resolve();

function enqueueVoiceTurn<T>(fn: () => Promise<T>): Promise<T> {
  const run = voiceTurnChain.then(() => fn());
  voiceTurnChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function resolveBearerForNexus(fallbackFromProps: string): Promise<string | null> {
  /** Validates JWT with Supabase and refreshes when needed (stronger than getSession alone). */
  await supabase.auth.getUser();
  const { data: sessionData } = await supabase.auth.getSession();
  const t = sessionData.session?.access_token ?? fallbackFromProps;
  return t && t.length > 0 ? t : null;
}

async function postNexusUserVoiceTurnInner(params: {
  accessToken: string;
  messages: NexusVoiceTurnMessage[];
  privateContext: Record<string, unknown>;
  personaMode?: string;
}): Promise<{
  content: string;
  toolTrace: Array<Record<string, unknown>>;
  error?: string;
  errorCode?: string;
  errorDetail?: string;
  httpStatus: number;
  nexusRequestId?: string;
  nexusBrainVersion?: string;
}> {
  const body = JSON.stringify({
    messages: params.messages,
    privateContext: params.privateContext,
    enableTools: true,
    voiceMode: true,
    personaMode: params.personaMode,
  });

  if (isGuestStyleToken(params.accessToken)) {
    const { data: s0 } = await supabase.auth.getSession();
    if (!s0.session?.access_token) {
      return {
        content: '',
        toolTrace: [],
        error: 'Sign in with a full account for Nexus tools in voice (guest tokens are not supported here).',
        httpStatus: 401,
      };
    }
  }

  let bearer = await resolveBearerForNexus(params.accessToken);
  if (!bearer) {
    return {
      content: '',
      toolTrace: [],
      error: 'Not authenticated',
      httpStatus: 401,
    };
  }

  const post = (token: string) =>
    fetch(NEXUS_USER_CHAT_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body,
    });

  let res = await post(bearer);

  if (res.status === 401) {
    await supabase.auth.refreshSession();
    const next = await resolveBearerForNexus(params.accessToken);
    if (next) {
      bearer = next;
      res = await post(bearer);
    }
  }

  const nexusRequestId = res.headers.get('x-nexus-request-id')?.trim() || undefined;
  const nexusBrainVersion = res.headers.get('x-nexus-brain-version')?.trim() || undefined;

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const baseErr = typeof data.error === 'string' ? data.error : `Request failed (${res.status})`;
    const detail = typeof data.detail === 'string' ? data.detail : undefined;
    const errorCode = typeof data.errorCode === 'string' ? data.errorCode : undefined;
    const combined =
      detail && !baseErr.includes(detail) ? `${baseErr} — ${detail}` : baseErr;
    return {
      content: '',
      toolTrace: [],
      error: combined,
      errorCode,
      errorDetail: detail,
      httpStatus: res.status,
      nexusRequestId,
      nexusBrainVersion,
    };
  }

  const content = typeof data.content === 'string' ? data.content : '';
  const toolTrace = Array.isArray(data.toolTrace) ? (data.toolTrace as Array<Record<string, unknown>>) : [];

  return { content, toolTrace, httpStatus: res.status, nexusRequestId, nexusBrainVersion };
}

export async function postNexusUserVoiceTurn(
  params: {
    accessToken: string;
    messages: NexusVoiceTurnMessage[];
    privateContext: Record<string, unknown>;
    personaMode?: string;
  },
): Promise<{
  content: string;
  toolTrace: Array<Record<string, unknown>>;
  error?: string;
  errorCode?: string;
  errorDetail?: string;
  httpStatus: number;
  nexusRequestId?: string;
  nexusBrainVersion?: string;
}> {
  return enqueueVoiceTurn(() => postNexusUserVoiceTurnInner(params));
}
