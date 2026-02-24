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

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function pickAllowedKeys(source, allowlist) {
  const out = {};
  for (const [key, value] of Object.entries(source)) {
    if (!allowlist.has(key)) continue;
    out[key] = value;
  }
  return out;
}

export function sanitizePublicContext(input) {
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

export function sanitizePrivateContext(input) {
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

export function serializePromptContext(context) {
  if (!isPlainObject(context) || Object.keys(context).length === 0) return '';
  try {
    return JSON.stringify(context, null, 2);
  } catch {
    return '';
  }
}
