/**
 * Voice pipeline timing (Performance marks + console `[voice-latency]` lines).
 * - **DEV:** on by default (disable with `localStorage.setItem('SYNCSCRIPT_VOICE_LATENCY','0')`).
 * - **Production:** opt-in with `localStorage.setItem('SYNCSCRIPT_VOICE_LATENCY','1')` then reload.
 */

export function isVoiceLatencyDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const v = window.localStorage?.getItem('SYNCSCRIPT_VOICE_LATENCY');
    if (v === '0') return false;
    if (v === '1') return true;
  } catch {
    /* empty */
  }
  return import.meta.env.DEV;
}

/** Performance.mark name must be `voice:${name}`. */
export function voiceLatencyMark(name: string): void {
  if (!isVoiceLatencyDebugEnabled()) return;
  try {
    performance.mark(`voice:${name}`);
  } catch {
    /* empty */
  }
}

/**
 * Measure duration between two marks. Clears the measure after logging once.
 * Both marks must exist (call `voiceLatencyMark` for start and end in order).
 */
export function voiceLatencyMeasure(label: string, startName: string, endName: string): void {
  if (!isVoiceLatencyDebugEnabled()) return;
  try {
    const measureName = `voice:measure:${label}`;
    performance.measure(measureName, `voice:${startName}`, `voice:${endName}`);
    const entries = performance.getEntriesByName(measureName, 'measure');
    const last = entries[entries.length - 1];
    if (last) {
      console.info(`[voice-latency] ${label}: ${last.duration.toFixed(0)}ms`);
    }
    performance.clearMeasures(measureName);
  } catch {
    /* marks missing or order wrong */
  }
}

/**
 * Logs **`X-Nexus-Request-Id`** (and brain version) so you can match a browser turn to **`emitNexusTrace`**
 * / Vercel function logs. No-op unless **`SYNCSCRIPT_VOICE_LATENCY`** is enabled (same as other voice-latency helpers).
 */
export function voiceLatencyLogNexusCorrelation(meta: {
  requestId?: string | null;
  brainVersion?: string | null;
  httpStatus: number;
}): void {
  if (!isVoiceLatencyDebugEnabled()) return;
  const bits: string[] = [`http=${meta.httpStatus}`];
  if (meta.requestId) bits.push(`X-Nexus-Request-Id=${meta.requestId}`);
  if (meta.brainVersion) bits.push(`X-Nexus-Brain-Version=${meta.brainVersion}`);
  console.info(`[voice-latency] ${bits.join(' | ')} — match in Vercel logs / emitNexusTrace`);
}
