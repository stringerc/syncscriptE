/**
 * When /api/ai/tts returns 503 + code NO_TTS_URL (KOKORO_TTS_URL unset on the server),
 * skip further proxy calls for this page load so multiple TTS entry points do not spam 503s.
 * Call `resetTtsProxySession()` when starting a new Nexus voice session so the proxy is retried
 * after env fixes or transient failures.
 */
let disabled = false;

export function isTtsProxyDisabled(): boolean {
  return disabled;
}

export function disableTtsProxyForSession(): void {
  disabled = true;
}

export function resetTtsProxySession(): void {
  disabled = false;
}
