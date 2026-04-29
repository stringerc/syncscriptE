/**
 * OpenAI Chat Completions compatibility — model-specific request shaping.
 *
 * Different vendors accept slightly different JSON for the same "OpenAI-compatible"
 * surface (tool `is_error`, `max_tokens` vs `max_completion_tokens`, sampling on
 * reasoning models). Centralize rules here so Nexus (`ai-service`, agent BYOK) stay
 * aligned. Inspired by operational lessons from multi-provider agents (e.g. public
 * claw-code `docs/MODEL_COMPATIBILITY.md`); this module is SyncScript-native TS only.
 */

/** Last path segment so OpenRouter ids like `moonshotai/kimi-k2` match Kimi rules. */
export function canonicalModelId(model: string): string {
  const m = String(model || '').trim().toLowerCase();
  if (!m) return '';
  const slash = m.lastIndexOf('/');
  return slash >= 0 ? m.slice(slash + 1) : m;
}

/** Kimi / Moonshot tool results reject unknown `is_error` on tool messages (400). */
export function modelRejectsToolResultIsErrorField(model: string): boolean {
  const c = canonicalModelId(model);
  if (c.startsWith('kimi-')) return true;
  if (c.startsWith('kimi_')) return true;
  return false;
}

/**
 * Models that expect `max_completion_tokens` instead of `max_tokens` on the
 * chat/completions wire (OpenAI o-series, GPT-5 family).
 */
export function modelUsesMaxCompletionTokens(model: string): boolean {
  const c = canonicalModelId(model);
  if (c.startsWith('gpt-5')) return true;
  if (c.startsWith('o1')) return true;
  if (c.startsWith('o3')) return true;
  if (c.startsWith('o4')) return true;
  return false;
}

/** Reasoning-style models that reject or ignore classic sampling params — omit them. */
export function modelOmitsSamplingParams(model: string): boolean {
  const c = canonicalModelId(model);
  if (c.startsWith('o1')) return true;
  if (c.startsWith('o3')) return true;
  if (c.startsWith('o4')) return true;
  return false;
}

function cloneMessage(msg: Record<string, unknown>): Record<string, unknown> {
  try {
    return JSON.parse(JSON.stringify(msg)) as Record<string, unknown>;
  } catch {
    return { ...msg };
  }
}

/**
 * Returns a deep-cloned message list safe for the given model id (e.g. strips
 * `is_error` from tool role messages when the upstream rejects that field).
 */
export function sanitizeChatMessagesForModel(
  model: string,
  messages: ReadonlyArray<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  if (!modelRejectsToolResultIsErrorField(model)) {
    return messages.map((m) => cloneMessage(m));
  }
  return messages.map((m) => {
    const copy = cloneMessage(m);
    if (copy.role === 'tool' && 'is_error' in copy) {
      delete copy.is_error;
    }
    return copy;
  });
}

function numOrUndef(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

/**
 * Apply token-field and sampling rules to a draft chat/completions JSON body.
 * Caller should already set `model` and `messages`; pass through `tools` / `stream`
 * in `draft` and they are preserved.
 */
export function finalizeChatCompletionRequestBody(
  model: string,
  draft: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...draft };
  const maxT = numOrUndef(out.max_tokens);
  const maxCT = numOrUndef(out.max_completion_tokens);

  if (modelUsesMaxCompletionTokens(model)) {
    const val = maxCT ?? maxT ?? 1024;
    delete out.max_tokens;
    out.max_completion_tokens = val;
  } else {
    if (maxT !== undefined) out.max_tokens = maxT;
    else if (maxCT !== undefined) {
      out.max_tokens = maxCT;
      delete out.max_completion_tokens;
    }
    if ('max_completion_tokens' in out && !modelUsesMaxCompletionTokens(model)) {
      delete out.max_completion_tokens;
    }
  }

  if (modelOmitsSamplingParams(model)) {
    delete out.temperature;
    delete out.top_p;
    delete out.frequency_penalty;
    delete out.presence_penalty;
  }

  return out;
}
