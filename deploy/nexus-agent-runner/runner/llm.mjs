/**
 * Provider-agnostic LLM caller (parity with api/_lib/agent-llm-adapter.ts).
 * One OpenAI-compatible Chat Completions wire shape, nine providers.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PLATFORM_LLM_ENV_KEYS = {
  nvidia: 'NVIDIA_API_KEY',
  groq: 'GROQ_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  gemini: 'GEMINI_API_KEY',
  openai: 'OPENAI_API_KEY',
  xai: 'XAI_API_KEY',
  mistral: 'MISTRAL_API_KEY',
};

const PLATFORM_LLM_FALLBACK_ORDER = [
  'nvidia',
  'groq',
  'anthropic',
  'openrouter',
  'gemini',
  'openai',
  'xai',
  'mistral',
];

const PROVIDER_BASE_URLS = {
  nvidia: 'https://integrate.api.nvidia.com/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  groq: 'https://api.groq.com/openai/v1',
  xai: 'https://api.x.ai/v1',
  mistral: 'https://api.mistral.ai/v1',
};

// Default to text-only models with reliable function-calling. Vision is enabled
// only when the model name explicitly indicates vision/multimodal — see
// supportsVision() below. NVIDIA NIM Llama-3.2-vision had unreliable FC in
// production smoke tests (April 2026), so we use Llama-3.3-70B as the safe
// free-tier default. Users can override via BYOK with any vision model.
const DEFAULT_MODELS = {
  nvidia: 'meta/llama-3.3-70b-instruct',
  openrouter: 'google/gemini-2.5-pro',
  gemini: 'gemini-2.5-pro',
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-5',
  groq: 'llama-3.3-70b-versatile',
  xai: 'grok-2-vision-1212',
  mistral: 'pixtral-large-latest',
  ollama: 'llama3.2:3b',
  custom_openai_compat: 'gpt-4o',
};

// Heuristic: model supports image inputs in the OpenAI-compatible
// content-array message format. False → caller should drop image_url parts.
export function supportsVision(provider, model) {
  const m = String(model || '').toLowerCase();
  if (provider === 'anthropic') return true; // claude-3.5+ all support images
  if (provider === 'openai') return /4o|4\.1|o1|gpt-5/.test(m);
  if (provider === 'gemini' || provider === 'openrouter') return /vision|gemini|gpt-4o|claude/.test(m);
  if (provider === 'xai' || provider === 'mistral') return /vision|pixtral/.test(m);
  return /vision|pixtral|gpt-4o|claude|gemini-(1\.5|2|2\.5)/.test(m);
}

const COST_RATES_CENTS_PER_1K = {
  nvidia: { in: 0.05, out: 0.05 },
  openrouter: { in: 0.5, out: 1.5 },
  gemini: { in: 0.125, out: 0.5 },
  openai: { in: 0.25, out: 1 },
  anthropic: { in: 0.3, out: 1.5 },
  groq: { in: 0.09, out: 0.09 },
  xai: { in: 0.2, out: 1 },
  mistral: { in: 0.2, out: 0.6 },
  ollama: { in: 0, out: 0 },
  custom_openai_compat: { in: 0, out: 0 },
};

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

export async function resolveLLMConfig(userId) {
  const { data: rows } = await sb
    .from('byok_keys')
    .select('provider, default_model, endpoint_url, active')
    .eq('user_id', userId)
    .eq('active', true);

  const priority = ['groq', 'openrouter', 'anthropic', 'openai', 'gemini', 'xai', 'mistral', 'ollama', 'custom_openai_compat'];
  for (const p of priority) {
    const row = rows?.find((r) => r.provider === p);
    if (!row) continue;
    const { data: secret } = await sb.rpc('admin_read_byok_key', { p_user_id: userId, p_provider: p });
    if (!secret) continue;
    return makeConfig(p, row.default_model || DEFAULT_MODELS[p], secret, row.endpoint_url, true);
  }

  for (const p of PLATFORM_LLM_FALLBACK_ORDER) {
    const envName = PLATFORM_LLM_ENV_KEYS[p];
    const k = String(process.env[envName] || '').trim();
    if (!k) continue;
    return makeConfig(p, DEFAULT_MODELS[p], k, null, false);
  }
  throw new Error('No BYOK and no platform LLM env key (set one of NVIDIA_API_KEY, GROQ_API_KEY, …)');
}

function makeConfig(provider, model, apiKey, endpointUrl, isByok) {
  const authHeaderName = provider === 'anthropic' ? 'x-api-key' : 'Authorization';
  const authHeader = provider === 'anthropic' ? apiKey : `Bearer ${apiKey}`;
  let baseUrl;
  if (provider === 'ollama') baseUrl = (endpointUrl || 'http://127.0.0.1:11434').replace(/\/$/, '') + '/v1';
  else if (provider === 'custom_openai_compat') baseUrl = (endpointUrl || '').replace(/\/$/, '');
  else baseUrl = PROVIDER_BASE_URLS[provider];
  return {
    provider,
    model,
    baseUrl,
    authHeader: provider === 'ollama' ? null : authHeader,
    authHeaderName,
    isByok,
    label: `${isByok ? 'byok:' : ''}${provider}/${model}`,
  };
}

export async function chatCompletion(cfg, { messages, tools, toolChoice = 'auto', temperature = 0.2, maxTokens = 1024, timeoutMs = 120_000 }) {
  const url = `${cfg.baseUrl}/chat/completions`;
  const headers = { 'Content-Type': 'application/json' };
  if (cfg.authHeader) headers[cfg.authHeaderName] = cfg.authHeader;
  if (cfg.provider === 'anthropic') headers['anthropic-version'] = '2023-06-01';
  if (cfg.provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://www.syncscript.app';
    headers['X-Title'] = 'SyncScript Nexus Agent';
  }

  const body = { model: cfg.model, messages, temperature, max_tokens: maxTokens };
  if (tools && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = toolChoice;
  }

  // Retry policy: 429 (rate limit) and 5xx (upstream blip) → exponential
  // backoff with jitter. NVIDIA NIM free tier has tight RPM limits;
  // a couple-second pause is usually enough.
  const MAX_RETRIES = 3;
  const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);

  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: ctrl.signal });
      const text = await res.text();
      if (!res.ok) {
        if (RETRY_STATUSES.has(res.status) && attempt < MAX_RETRIES) {
          const retryAfterHeader = Number(res.headers.get('retry-after'));
          const baseMs = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
            ? Math.min(30_000, retryAfterHeader * 1000)
            : Math.min(20_000, 1500 * Math.pow(2, attempt));
          const jitter = Math.floor(Math.random() * 400);
          await new Promise((r) => setTimeout(r, baseMs + jitter));
          continue;
        }
        lastErr = new Error(`[${cfg.label}] HTTP ${res.status}: ${text.slice(0, 400)}`);
        throw lastErr;
      }
      const json = JSON.parse(text);
      const choice = json?.choices?.[0] ?? {};
      const message = choice.message ?? {};
      const content = typeof message.content === 'string' ? message.content : '';
      const toolCallsRaw = Array.isArray(message.tool_calls) ? message.tool_calls : [];
      const toolCalls = toolCallsRaw.map((tc) => ({
        id: String(tc.id || ''),
        name: String(tc.function?.name || ''),
        argumentsJson: String(tc.function?.arguments || '{}'),
      }));
      return { content, toolCalls, finishReason: String(choice.finish_reason || 'unknown'), usage: json.usage };
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr || new Error(`[${cfg.label}] retries exhausted`);
}

export function estimateCostCents(provider, usage) {
  if (!usage) return 1;
  const r = COST_RATES_CENTS_PER_1K[provider] || { in: 0.1, out: 0.5 };
  const cents = (usage.prompt_tokens || 0) / 1000 * r.in + (usage.completion_tokens || 0) / 1000 * r.out;
  return Math.max(0, Math.ceil(cents));
}
