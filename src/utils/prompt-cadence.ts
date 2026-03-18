const PROMPT_CADENCE_KEY = 'syncscript:prompt-cadence:v1';

type CadenceStore = Record<string, number>;

function readStore(): CadenceStore {
  try {
    const raw = localStorage.getItem(PROMPT_CADENCE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: CadenceStore) {
  try {
    localStorage.setItem(PROMPT_CADENCE_KEY, JSON.stringify(store));
  } catch {
    // non-blocking
  }
}

export function shouldShowPromptWithCadence(key: string, cooldownMs: number): boolean {
  const store = readStore();
  const now = Date.now();
  const last = Number(store[key] || 0);
  return !last || now - last >= cooldownMs;
}

export function markPromptShown(key: string) {
  const store = readStore();
  store[key] = Date.now();
  writeStore(store);
}
