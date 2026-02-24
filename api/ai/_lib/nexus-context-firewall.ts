const PUBLIC_ALLOWED_KEYS = new Set([
  'surface',
  'page',
  'pricing',
  'features',
  'faq',
  'claims',
]);

const PRIVATE_ALLOWED_KEYS = new Set([
  'surface',
  'user',
  'dashboard',
  'resonance',
  'energy',
  'preferences',
  'timestamp',
]);

const PUBLIC_FORBIDDEN_KEY_RE = /(user|auth|token|session|email|task|streak|level|energy|resonance|homeostasis|calendar|private|id)/i;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function pickAllowedKeys(source: Record<string, unknown>, allowlist: Set<string>) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    if (!allowlist.has(key)) continue;
    out[key] = value;
  }
  return out;
}

export function sanitizePublicContext(input: unknown): { valid: boolean; context: Record<string, unknown>; reason?: string } {
  if (input == null) {
    return { valid: true, context: {} };
  }

  if (!isPlainObject(input)) {
    return { valid: false, context: {}, reason: 'Public context must be an object.' };
  }

  for (const key of Object.keys(input)) {
    if (PUBLIC_FORBIDDEN_KEY_RE.test(key)) {
      return { valid: false, context: {}, reason: `Forbidden public context key: ${key}` };
    }
  }

  return {
    valid: true,
    context: pickAllowedKeys(input, PUBLIC_ALLOWED_KEYS),
  };
}

export function sanitizePrivateContext(input: unknown): { valid: boolean; context: Record<string, unknown>; reason?: string } {
  if (input == null) {
    return { valid: true, context: {} };
  }

  if (!isPlainObject(input)) {
    return { valid: false, context: {}, reason: 'Private context must be an object.' };
  }

  return {
    valid: true,
    context: pickAllowedKeys(input, PRIVATE_ALLOWED_KEYS),
  };
}

export function serializePromptContext(context: unknown): string {
  if (!isPlainObject(context) || Object.keys(context).length === 0) return '';
  try {
    return JSON.stringify(context, null, 2);
  } catch {
    return '';
  }
}
const PUBLIC_ALLOWED_KEYS = new Set([
  'surface',
  'page',
  'pricing',
  'features',
  'faq',
  'claims',
]);

const PRIVATE_ALLOWED_KEYS = new Set([
  'surface',
  'user',
  'dashboard',
  'resonance',
  'energy',
  'preferences',
  'timestamp',
]);

const PUBLIC_FORBIDDEN_KEY_RE = /(user|auth|token|session|email|task|streak|level|energy|resonance|homeostasis|calendar|private|id)/i;

type ContextResult = {
  valid: boolean;
  context: Record<string, unknown>;
  reason?: string;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function pickAllowedKeys(source: Record<string, unknown>, allowlist: Set<string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    if (!allowlist.has(key)) continue;
    out[key] = value;
  }
  return out;
}

export function sanitizePublicContext(input: unknown): ContextResult {
  if (input == null) {
    return { valid: true, context: {} };
  }

  if (!isPlainObject(input)) {
    return { valid: false, context: {}, reason: 'Public context must be an object.' };
  }

  for (const key of Object.keys(input)) {
    if (PUBLIC_FORBIDDEN_KEY_RE.test(key)) {
      return { valid: false, context: {}, reason: `Forbidden public context key: ${key}` };
    }
  }

  return {
    valid: true,
    context: pickAllowedKeys(input, PUBLIC_ALLOWED_KEYS),
  };
}

export function sanitizePrivateContext(input: unknown): ContextResult {
  if (input == null) {
    return { valid: true, context: {} };
  }

  if (!isPlainObject(input)) {
    return { valid: false, context: {}, reason: 'Private context must be an object.' };
  }

  return {
    valid: true,
    context: pickAllowedKeys(input, PRIVATE_ALLOWED_KEYS),
  };
}

export function serializePromptContext(context: unknown): string {
  if (!isPlainObject(context) || Object.keys(context).length === 0) return '';
  try {
    return JSON.stringify(context, null, 2);
  } catch {
    return '';
  }
}
