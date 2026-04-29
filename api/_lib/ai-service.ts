/**
 * SyncScript AI Service — Universal Provider Abstraction
 *
 * Decouples all AI calls from any single provider. Supports automatic
 * failover: if the primary provider fails, the next one in the chain
 * is tried transparently.
 *
 * Supported providers (all expose an OpenAI-compatible chat/completions API):
 *   nvidia     — NVIDIA NIM (default, FREE, many models via build.nvidia.com)
 *   groq       — Groq (fast; second in volume failover after NVIDIA when keyed)
 *   anthropic  — Claude Haiku via Anthropic OpenAI-compat `/v1/chat/completions`
 *                (optional `ANTHROPIC_API_KEY`; model `ANTHROPIC_HAIKU_MODEL` or `claude-haiku-4-5`)
 *   moonshot   — Moonshot AI / Kimi K2 Turbo (fast, no queue)
 *   deepseek   — DeepSeek API (cheap fallback)
 *   openrouter — OpenRouter multi-model gateway
 *   openai     — OpenAI GPT-4o / GPT-4o-mini
 *
 * Failover order (when keys exist): primary (`AI_PROVIDER`) → **nvidia → groq → anthropic**
 * → remaining providers — so free/cheap volume paths run before paid Haiku.
 *
 * Usage:
 *   import { callAI } from '../_lib/ai-service';
 *   const result = await callAI(messages, { maxTokens: 1024 });
 *
 * Model compatibility (Kimi tool `is_error`, o-series sampling, GPT-5 token fields)
 * is centralized in `openai-compat-model-policy.ts` and applied on every request.
 */

import {
  finalizeChatCompletionRequestBody,
  sanitizeChatMessagesForModel,
} from './openai-compat-model-policy';

// ---------------------------------------------------------------------------
// Provider configuration
// ---------------------------------------------------------------------------

interface ProviderConfig {
  url: string;
  model: string;
  keyEnv: string; // name of the env var holding the API key
  headerPrefix?: string; // defaults to "Bearer" when authStyle is bearer
  /** Anthropic OpenAI-compat uses `x-api-key` + `anthropic-version`, not Bearer */
  authStyle?: 'bearer' | 'x-api-key';
  extraHeaders?: Record<string, string>;
}

const PROVIDERS: Record<string, ProviderConfig> = {
  nvidia: {
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    model: 'meta/llama-3.1-70b-instruct',
    keyEnv: 'NVIDIA_API_KEY',
  },
  moonshot: {
    url: 'https://api.moonshot.ai/v1/chat/completions',
    model: 'kimi-k2-turbo-preview',
    keyEnv: 'MOONSHOT_API_KEY',
  },
  deepseek: {
    url: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    keyEnv: 'DEEPSEEK_API_KEY',
  },
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'moonshotai/kimi-k2',
    keyEnv: 'OPENROUTER_API_KEY',
  },
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    keyEnv: 'OPENAI_API_KEY',
  },
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    keyEnv: 'GROQ_API_KEY',
  },
  anthropic: {
    url: 'https://api.anthropic.com/v1/chat/completions',
    model: 'claude-haiku-4-5',
    keyEnv: 'ANTHROPIC_API_KEY',
    authStyle: 'x-api-key',
    extraHeaders: { 'anthropic-version': '2023-06-01' },
  },
};

/** Volume-tier failover: free NVIDIA → fast Groq → optional platform Haiku, then other keys. */
const PROVIDER_FAILOVER_ORDER = [
  'nvidia',
  'groq',
  'anthropic',
  'moonshot',
  'deepseek',
  'openrouter',
  'openai',
] as const;

function authHeaders(providerName: string, apiKey: string): Record<string, string> {
  const cfg = PROVIDERS[providerName];
  const key = apiKey.trim();
  const base: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (cfg?.authStyle === 'x-api-key') {
    base['x-api-key'] = key;
    if (cfg.extraHeaders) Object.assign(base, cfg.extraHeaders);
    return base;
  }
  base.Authorization = `${cfg?.headerPrefix || 'Bearer'} ${key}`;
  if (cfg?.extraHeaders) Object.assign(base, cfg.extraHeaders);
  return base;
}

function resolvedModel(providerName: string, provider: ProviderConfig, optsModel?: string): string {
  if (optsModel) return optsModel;
  if (providerName === 'anthropic' && process.env.ANTHROPIC_HAIKU_MODEL?.trim()) {
    return process.env.ANTHROPIC_HAIKU_MODEL.trim();
  }
  return provider.model;
}

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICallOptions {
  maxTokens?: number;
  temperature?: number;
  /** Override model name (e.g. "gpt-4o" when provider is openai) */
  model?: string;
  /** Skip failover and use only the primary provider */
  noFallback?: boolean;
}

export interface AICallResult {
  content: string;
  model: string;
  provider: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  raw?: any;
}

// ---------------------------------------------------------------------------
// Resolve which providers to try, in order
// ---------------------------------------------------------------------------

function providerHasKey(name: string): boolean {
  const cfg = PROVIDERS[name];
  if (!cfg) return false;
  const key = process.env[cfg.keyEnv];
  return Boolean(key && String(key).trim());
}

function getProviderChain(): string[] {
  // Primary provider from env, default to nvidia (FREE via build.nvidia.com).
  // Only include the preferred provider when its key exists — otherwise the first API call
  // always throws (e.g. CI with GROQ only), and scripts like verify-nexus-tools-live look flaky.
  const requested = (process.env.AI_PROVIDER || 'nvidia').toLowerCase().trim();
  const preferred = PROVIDERS[requested] ? requested : 'nvidia';

  const chain: string[] = [];
  const seen = new Set<string>();

  if (providerHasKey(preferred)) {
    chain.push(preferred);
    seen.add(preferred);
  }

  // Volume-aware order for fallbacks (keys required), then any remaining keyed providers.
  for (const name of PROVIDER_FAILOVER_ORDER) {
    if (seen.has(name)) continue;
    if (providerHasKey(name)) {
      chain.push(name);
      seen.add(name);
    }
  }
  for (const name of Object.keys(PROVIDERS)) {
    if (seen.has(name)) continue;
    if (providerHasKey(name)) chain.push(name);
  }

  return chain;
}

/** Operator / diagnostics: no secret values, safe for authenticated Settings probes. */
export function getLlmStackDiagnostic(): {
  ai_provider_env: string;
  primary: string;
  chain: string[];
  keys_present: Record<string, boolean>;
} {
  const chain = getProviderChain();
  const keys_present: Record<string, boolean> = {};
  for (const name of Object.keys(PROVIDERS)) {
    keys_present[name] = providerHasKey(name);
  }
  return {
    ai_provider_env: (process.env.AI_PROVIDER || 'nvidia').toLowerCase().trim(),
    primary: chain[0] || 'nvidia',
    chain,
    keys_present,
  };
}

// ---------------------------------------------------------------------------
// Core call function
// ---------------------------------------------------------------------------

async function callProvider(
  providerName: string,
  messages: AIMessage[],
  opts: AICallOptions,
): Promise<AICallResult> {
  const provider = PROVIDERS[providerName];
  if (!provider) throw new Error(`Unknown AI provider: ${providerName}`);

  const apiKey = process.env[provider.keyEnv];
  if (!apiKey || !apiKey.trim()) {
    throw new Error(`${provider.keyEnv} not configured for provider ${providerName}`);
  }

  const model = resolvedModel(providerName, provider, opts.model);

  const body = finalizeChatCompletionRequestBody(model, {
    model,
    messages,
    max_tokens: opts.maxTokens ?? 1024,
    temperature: opts.temperature ?? 0.7,
  });

  const response = await fetch(provider.url, {
    method: 'POST',
    headers: authHeaders(providerName, apiKey),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`${providerName} API ${response.status}: ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  return {
    content,
    model: data.model || model,
    provider: providerName,
    usage: data.usage,
    raw: data,
  };
}

// ---------------------------------------------------------------------------
// Public entry point — call with automatic failover
// ---------------------------------------------------------------------------

export async function callAI(
  messages: AIMessage[],
  opts: AICallOptions = {},
): Promise<AICallResult> {
  const chain = getProviderChain();

  if (opts.noFallback) {
    return callProvider(chain[0], messages, opts);
  }

  let lastError: Error | null = null;

  for (const providerName of chain) {
    try {
      const result = await callProvider(providerName, messages, opts);
      return result;
    } catch (err: any) {
      console.warn(`[AI Service] ${providerName} failed: ${err.message}`);
      lastError = err;
    }
  }

  throw lastError || new Error('No AI providers available');
}

// ---------------------------------------------------------------------------
// Chat completions with tools (OpenAI-compatible messages + optional tools)
// ---------------------------------------------------------------------------

export type ChatCompletionMessage = Record<string, unknown>;

export interface ChatCompletionsOptions extends AICallOptions {
  tools?: unknown[];
  tool_choice?: 'auto' | 'none' | Record<string, unknown>;
}

export interface ChatCompletionResult {
  message: Record<string, unknown>;
  model: string;
  provider: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  raw: unknown;
}

async function callProviderChat(
  providerName: string,
  messages: ChatCompletionMessage[],
  opts: ChatCompletionsOptions,
): Promise<ChatCompletionResult> {
  const provider = PROVIDERS[providerName];
  if (!provider) throw new Error(`Unknown AI provider: ${providerName}`);

  const apiKey = process.env[provider.keyEnv];
  if (!apiKey || !apiKey.trim()) {
    throw new Error(`${provider.keyEnv} not configured for provider ${providerName}`);
  }

  const model = resolvedModel(providerName, provider, opts.model);

  const messagesSanitized = sanitizeChatMessagesForModel(
    model,
    messages as ReadonlyArray<Record<string, unknown>>,
  );

  const draft: Record<string, unknown> = {
    model,
    messages: messagesSanitized,
    max_tokens: opts.maxTokens ?? 1024,
    temperature: opts.temperature ?? 0.7,
  };

  if (opts.tools && opts.tools.length > 0) {
    draft.tools = opts.tools;
    draft.tool_choice = opts.tool_choice ?? 'auto';
  }

  const body = finalizeChatCompletionRequestBody(model, draft);

  const response = await fetch(provider.url, {
    method: 'POST',
    headers: authHeaders(providerName, apiKey),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`${providerName} API ${response.status}: ${errorText.slice(0, 400)}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  const choice = (data.choices as any[])?.[0];
  const message = (choice?.message || {}) as Record<string, unknown>;

  return {
    message,
    model: (data.model as string) || model,
    provider: providerName,
    usage: data.usage as ChatCompletionResult['usage'],
    raw: data,
  };
}

/**
 * Single chat completion with optional tools; supports failover like callAI.
 */
export async function callChatCompletion(
  messages: ChatCompletionMessage[],
  opts: ChatCompletionsOptions = {},
): Promise<ChatCompletionResult> {
  const chain = getProviderChain();

  if (opts.noFallback) {
    return callProviderChat(chain[0], messages, opts);
  }

  let lastError: Error | null = null;

  for (const providerName of chain) {
    try {
      return await callProviderChat(providerName, messages, opts);
    } catch (err: any) {
      console.warn(`[AI Service] chat completion ${providerName} failed: ${err.message}`);
      lastError = err;
    }
  }

  throw lastError || new Error('No AI providers available');
}

// ---------------------------------------------------------------------------
// Streaming entry point — returns a ReadableStream of SSE data
// ---------------------------------------------------------------------------

export async function callAIStream(
  messages: AIMessage[],
  opts: AICallOptions = {},
): Promise<{ stream: ReadableStream<Uint8Array>; provider: string; model: string }> {
  const chain = getProviderChain();

  for (const providerName of chain) {
    const provider = PROVIDERS[providerName];
    if (!provider) continue;

    const apiKey = process.env[provider.keyEnv];
    if (!apiKey?.trim()) continue;

    const model = resolvedModel(providerName, provider, opts.model);

    try {
      const body = finalizeChatCompletionRequestBody(model, {
        model,
        messages,
        max_tokens: opts.maxTokens ?? 1024,
        temperature: opts.temperature ?? 0.7,
        stream: true,
      });

      const response = await fetch(provider.url, {
        method: 'POST',
        headers: authHeaders(providerName, apiKey),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.warn(`[AI Stream] ${providerName} ${response.status}: ${errText.slice(0, 200)}`);
        continue;
      }

      if (!response.body) throw new Error('No response body');

      return { stream: response.body as unknown as ReadableStream<Uint8Array>, provider: providerName, model };
    } catch (err: any) {
      console.warn(`[AI Stream] ${providerName} failed: ${err.message}`);
      if (opts.noFallback) throw err;
    }
  }

  throw new Error('No AI providers available for streaming');
}

/**
 * Quick check: is at least one AI provider configured?
 */
export function isAIConfigured(): boolean {
  return getProviderChain().some((name) => {
    const cfg = PROVIDERS[name];
    if (!cfg) return false;
    const key = process.env[cfg.keyEnv];
    return Boolean(key && String(key).trim());
  });
}
