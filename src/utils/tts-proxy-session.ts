/**
 * When /api/ai/tts returns 503 + code NO_TTS_URL (KOKORO_TTS_URL unset on the server),
 * skip further proxy calls for this page load so multiple TTS entry points do not spam 503s.
 */
let disabled = false;

export function isTtsProxyDisabled(): boolean {
  return disabled;
}

export function disableTtsProxyForSession(): void {
  disabled = true;
}
