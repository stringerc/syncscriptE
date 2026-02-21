/**
 * SyncScript AI Service — Universal Provider Abstraction
 *
 * Decouples all AI calls from any single provider. Supports automatic
 * failover: if the primary provider fails, the next one in the chain
 * is tried transparently.
 *
 * Supported providers (all expose an OpenAI-compatible chat/completions API):
 *   nvidia     — NVIDIA NIM (default, FREE, many models via build.nvidia.com)
 *   moonshot   — Moonshot AI / Kimi K2 Turbo (fast, no queue)
 *   deepseek   — DeepSeek API (cheap fallback)
 *   openrouter — OpenRouter multi-model gateway
 *   openai     — OpenAI GPT-4o / GPT-4o-mini
 *   groq       — Groq (Llama 3, ultra-fast)
 *
 * Usage:
 *   import { callAI } from '../_lib/ai-service';
 *   const result = await callAI(messages, { maxTokens: 1024 });
 */

// ---------------------------------------------------------------------------
// Provider configuration
// ---------------------------------------------------------------------------

interface ProviderConfig {
  url: string;
  model: string;
  keyEnv: string;            // name of the env var holding the API key
  headerPrefix?: string;     // defaults to "Bearer"
}

const PROVIDERS: Record<string, ProviderConfig> = {
  nvidia: {
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    model: 'moonshotai/kimi-k2-instruct',
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
};

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

function getProviderChain(): string[] {
  // Primary provider from env, default to nvidia (FREE via build.nvidia.com)
  const primary = (process.env.AI_PROVIDER || 'nvidia').toLowerCase();

  // Fallback chain — every configured provider after the primary
  const chain: string[] = [primary];

  // Add other providers that have a key configured
  for (const [name] of Object.entries(PROVIDERS)) {
    if (name === primary) continue;
    const key = process.env[PROVIDERS[name].keyEnv];
    if (key && key.trim()) {
      chain.push(name);
    }
  }

  return chain;
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

  const model = opts.model || provider.model;

  const response = await fetch(provider.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `${provider.headerPrefix || 'Bearer'} ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.7,
    }),
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

/**
 * Quick check: is at least one AI provider configured?
 */
export function isAIConfigured(): boolean {
  return getProviderChain().some((name) => {
    const key = process.env[PROVIDERS[name].keyEnv];
    return key && key.trim();
  });
}
