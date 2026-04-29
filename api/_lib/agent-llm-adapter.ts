/**
 * Provider-agnostic agent LLM adapter.
 *
 * Lookup order per agent step:
 *   1. If user has an active byok_keys row for the provider they selected:
 *      a. Read decrypted key from vault via admin_read_byok_key.
 *      b. Call that provider's OpenAI-compatible endpoint with the key.
 *   2. Otherwise: first **platform** env key in the same volume order as `ai-service`
 *      (NVIDIA → Groq → Anthropic → …). No single-provider hard requirement if
 *      another platform key is set on Vercel / the runner.
 *
 * All providers are accessed via the OpenAI Chat Completions wire format —
 * Anthropic and Gemini ship OpenAI-compatible shim endpoints; OpenRouter is
 * native OpenAI shape; Groq, xAI, Mistral, Ollama, and "custom_openai_compat"
 * all already implement the same surface. **One HTTP shape, nine providers.**
 * Request bodies pass through `openai-compat-model-policy.ts` (Kimi tool fields,
 * o/GPT-5 token + sampling quirks) before every `fetch`.
 *
 * Vision input: every provider that supports vision accepts `image_url` content
 * parts in the same OpenAI shape (`{ type: 'image_url', image_url: { url: 'data:image/png;base64,...' } }`).
 * This is the format we use for browser screenshots from the agent runner.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  finalizeChatCompletionRequestBody,
  sanitizeChatMessagesForModel,
} from './openai-compat-model-policy';

export type AgentLLMProvider =
  | 'nvidia'
  | 'openrouter'
  | 'gemini'
  | 'openai'
  | 'anthropic'
  | 'groq'
  | 'xai'
  | 'mistral'
  | 'ollama'
  | 'custom_openai_compat';

export interface AgentLLMConfig {
  provider: AgentLLMProvider;
  /** Concrete model id passed to the provider. */
  model: string;
  /** Endpoint base URL (no trailing slash). */
  baseUrl: string;
  /** Authorization header value, or null for ollama-local. */
  authHeader: string | null;
  /** Custom header name when not "Authorization" (e.g. anthropic uses x-api-key). */
  authHeaderName: string;
  /** Set when the call is using the user's BYOK key (cost goes to them, not us). */
  isByok: boolean;
  /** Reasoning trace label for `agent_runs.provider`. */
  label: string;
}

/** Default models chosen per provider — vision-capable + tool-calling. Tunable later via byok_keys.default_model. */
export const DEFAULT_MODELS: Record<AgentLLMProvider, string> = {
  nvidia: 'meta/llama-3.2-90b-vision-instruct',
  openrouter: 'google/gemini-2.5-pro',
  gemini: 'gemini-2.5-pro',
  openai: 'gpt-4o',
  /** Default BYOK Anthropic = Haiku for cost; set `byok_keys.default_model` to e.g. `claude-sonnet-4-5` for frontier quality. */
  anthropic: 'claude-haiku-4-5',
  groq: 'llama-3.2-90b-vision-preview',
  xai: 'grok-2-vision-1212',
  mistral: 'pixtral-large-latest',
  ollama: 'llama3.2-vision:11b',
  custom_openai_compat: 'gpt-4o',
};

const PROVIDER_BASE_URLS: Record<Exclude<AgentLLMProvider, 'ollama' | 'custom_openai_compat'>, string> = {
  nvidia: 'https://integrate.api.nvidia.com/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  // Google's OpenAI-compatible endpoint (GA 2025).
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  groq: 'https://api.groq.com/openai/v1',
  xai: 'https://api.x.ai/v1',
  mistral: 'https://api.mistral.ai/v1',
};

/** Vercel / runner process.env names for platform (non-BYOK) keys — aligned with `ai-service` providers. */
const PLATFORM_LLM_ENV_KEYS: Record<Exclude<AgentLLMProvider, 'ollama' | 'custom_openai_compat'>, string> = {
  nvidia: 'NVIDIA_API_KEY',
  groq: 'GROQ_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  gemini: 'GEMINI_API_KEY',
  openai: 'OPENAI_API_KEY',
  xai: 'XAI_API_KEY',
  mistral: 'MISTRAL_API_KEY',
};

/** Same relative priority as `api/_lib/ai-service.ts` `PROVIDER_FAILOVER_ORDER` (minus non-agent providers). */
const PLATFORM_LLM_FALLBACK_ORDER: Exclude<AgentLLMProvider, 'ollama' | 'custom_openai_compat'>[] = [
  'nvidia',
  'groq',
  'anthropic',
  'openrouter',
  'gemini',
  'openai',
  'xai',
  'mistral',
];

function resolvePlatformSharedLlmConfig(): AgentLLMConfig | { error: string } {
  for (const provider of PLATFORM_LLM_FALLBACK_ORDER) {
    const envName = PLATFORM_LLM_ENV_KEYS[provider];
    const raw = process.env[envName];
    const apiKey = typeof raw === 'string' ? raw.trim() : '';
    if (!apiKey) continue;

    const authHeaderName = provider === 'anthropic' ? 'x-api-key' : 'Authorization';
    const authHeader = provider === 'anthropic' ? apiKey : `Bearer ${apiKey}`;
    const model = DEFAULT_MODELS[provider];
    return {
      provider,
      model,
      baseUrl: PROVIDER_BASE_URLS[provider],
      authHeader,
      authHeaderName,
      isByok: false,
      label: `platform:${provider}/${model}`,
    };
  }
  return { error: 'no_byok_and_no_platform_llm_key' };
}

function svc(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Resolve the LLM config for a given user. If the user has a `byok_keys` row,
 * use it. Otherwise fall back to the first configured platform LLM env key.
 *
 * Caller can pin a provider via `preferProvider` (e.g. user explicitly chose
 * a provider for this run); we'll use it only if the user actually has a key
 * for it, otherwise fall back to the platform chain.
 */
export async function resolveAgentLLMConfig(
  userId: string,
  preferProvider?: AgentLLMProvider | null,
): Promise<AgentLLMConfig | { error: string }> {
  const sb = svc();
  if (!sb) return { error: 'service_role_not_configured' };

  // Look up active BYOK keys for this user.
  const { data: byokRows } = await sb
    .from('byok_keys')
    .select('provider, default_model, endpoint_url, active')
    .eq('user_id', userId)
    .eq('active', true);

  const byokMap: Record<string, { default_model?: string; endpoint_url?: string }> = {};
  for (const row of byokRows || []) {
    byokMap[row.provider] = {
      default_model: row.default_model || undefined,
      endpoint_url: row.endpoint_url || undefined,
    };
  }

  // If user pinned a provider AND they have a key for it → use it.
  if (preferProvider && byokMap[preferProvider]) {
    return byokConfig(sb, userId, preferProvider, byokMap[preferProvider]);
  }

  // Otherwise prefer any active BYOK key: fast/cheap Groq before OpenRouter / Anthropic Haiku default.
  const byokPriority: AgentLLMProvider[] = [
    'groq',
    'openrouter',
    'anthropic',
    'openai',
    'gemini',
    'xai',
    'mistral',
    'ollama',
    'custom_openai_compat',
  ];
  for (const p of byokPriority) {
    if (byokMap[p]) {
      const cfg = await byokConfig(sb, userId, p, byokMap[p]);
      if (!('error' in cfg)) return cfg;
    }
  }

  return resolvePlatformSharedLlmConfig();
}

async function byokConfig(
  sb: SupabaseClient,
  userId: string,
  provider: AgentLLMProvider,
  meta: { default_model?: string; endpoint_url?: string },
): Promise<AgentLLMConfig | { error: string }> {
  const { data, error } = await sb.rpc('admin_read_byok_key', {
    p_user_id: userId,
    p_provider: provider,
  });
  if (error) return { error: `byok_read_${provider}_${error.code || error.message}` };
  const apiKey = typeof data === 'string' ? data : '';
  if (!apiKey) return { error: `byok_${provider}_empty` };

  const model = meta.default_model || DEFAULT_MODELS[provider];

  // Authorization header shape varies a tiny bit:
  //   anthropic: x-api-key + anthropic-version header (set in callOpenAIChat)
  //   ollama: no auth (local)
  //   everything else: Authorization: Bearer <key>
  const authHeaderName = provider === 'anthropic' ? 'x-api-key' : 'Authorization';
  const authHeader = provider === 'anthropic' ? apiKey : `Bearer ${apiKey}`;

  let baseUrl: string;
  if (provider === 'ollama') {
    baseUrl = (meta.endpoint_url || 'http://127.0.0.1:11434').replace(/\/$/, '') + '/v1';
  } else if (provider === 'custom_openai_compat') {
    if (!meta.endpoint_url) return { error: 'custom_endpoint_url_missing' };
    baseUrl = meta.endpoint_url.replace(/\/$/, '');
  } else {
    baseUrl = PROVIDER_BASE_URLS[provider as Exclude<AgentLLMProvider, 'ollama' | 'custom_openai_compat'>];
  }

  return {
    provider,
    model,
    baseUrl,
    authHeader: provider === 'ollama' ? null : authHeader,
    authHeaderName,
    isByok: true,
    label: `byok:${provider}/${model}`,
  };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content:
    | string
    | Array<
        | { type: 'text'; text: string }
        | { type: 'image_url'; image_url: { url: string } }
      >;
  tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }>;
  tool_call_id?: string;
  name?: string;
}

export interface ChatToolDef {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters: Record<string, unknown>;
  };
}

export interface ChatCompletionResponse {
  content: string;
  toolCalls: Array<{ id: string; name: string; argumentsJson: string }>;
  finishReason: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  raw: unknown;
}

/**
 * Single OpenAI-compatible Chat Completion call. Handles vision content parts,
 * tool definitions, tool-call response shape uniformly across all 9 providers.
 *
 * Notes per provider:
 *   - Anthropic's OpenAI-compat endpoint is at /v1/chat/completions; it requires
 *     `anthropic-version` header. We add it when provider==='anthropic'.
 *   - Gemini at /v1beta/openai requires the model id without "models/" prefix.
 *   - Ollama doesn't need auth headers; localhost only.
 */
export async function callAgentChat(
  cfg: AgentLLMConfig,
  args: {
    messages: ChatMessage[];
    tools?: ChatToolDef[];
    toolChoice?: 'auto' | 'required' | 'none';
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
  },
): Promise<ChatCompletionResponse> {
  const url = `${cfg.baseUrl}/chat/completions`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (cfg.authHeader) headers[cfg.authHeaderName] = cfg.authHeader;
  if (cfg.provider === 'anthropic') {
    headers['anthropic-version'] = '2023-06-01';
  }
  // OpenRouter likes a referer + title for analytics
  if (cfg.provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://www.syncscript.app';
    headers['X-Title'] = 'SyncScript Nexus Agent';
  }

  const messagesSanitized = sanitizeChatMessagesForModel(
    cfg.model,
    args.messages as ReadonlyArray<Record<string, unknown>>,
  );

  const draft: Record<string, unknown> = {
    model: cfg.model,
    messages: messagesSanitized,
    temperature: args.temperature ?? 0.2,
    max_tokens: args.maxTokens ?? 1024,
  };
  if (args.tools && args.tools.length > 0) {
    draft.tools = args.tools;
    draft.tool_choice = args.toolChoice ?? 'auto';
  }

  const body = finalizeChatCompletionRequestBody(cfg.model, draft);

  const ctrl = new AbortController();
  const timeoutMs = args.timeoutMs ?? 120_000;
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`[${cfg.label}] HTTP ${res.status}: ${text.slice(0, 400)}`);
    }
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`[${cfg.label}] non-JSON response: ${text.slice(0, 200)}`);
    }
    const choice = json?.choices?.[0] ?? {};
    const message = choice.message ?? {};
    const content = typeof message.content === 'string' ? message.content : '';
    const toolCallsRaw = Array.isArray(message.tool_calls) ? message.tool_calls : [];
    const toolCalls = toolCallsRaw.map((tc: any) => ({
      id: String(tc.id || ''),
      name: String(tc.function?.name || ''),
      argumentsJson: String(tc.function?.arguments || '{}'),
    }));

    return {
      content,
      toolCalls,
      finishReason: String(choice.finish_reason || 'unknown'),
      usage: json.usage,
      raw: json,
    };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Approximate USD-cents cost for a single completion. Numbers are intentionally
 * conservative — we'd rather over-charge our spend cap than let a runaway loop
 * blow the daily budget.
 */
export function estimateCostCents(cfg: AgentLLMConfig, usage?: { prompt_tokens?: number; completion_tokens?: number }): number {
  if (!usage) return 1; // unknown — assume 1 cent
  const inTok = usage.prompt_tokens ?? 0;
  const outTok = usage.completion_tokens ?? 0;
  const inK = inTok / 1000;
  const outK = outTok / 1000;
  const rates: Record<AgentLLMProvider, { in: number; out: number }> = {
    // cents per 1k tokens (rounded up)
    nvidia: { in: 0.05, out: 0.05 },          // free tier; treat as nominal cost so caps still apply
    openrouter: { in: 0.5, out: 1.5 },
    gemini: { in: 0.125, out: 0.5 },
    openai: { in: 0.25, out: 1 },
    anthropic: { in: 0.15, out: 0.75 }, // Haiku-default BYOK; conservative vs Sonnet
    groq: { in: 0.09, out: 0.09 },
    xai: { in: 0.2, out: 1 },
    mistral: { in: 0.2, out: 0.6 },
    ollama: { in: 0, out: 0 },
    custom_openai_compat: { in: 0, out: 0 },
  };
  const r = rates[cfg.provider];
  const cents = inK * r.in + outK * r.out;
  return Math.max(0, Math.ceil(cents));
}
