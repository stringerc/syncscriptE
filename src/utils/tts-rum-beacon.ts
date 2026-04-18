/**
 * Coarse TTS reliability telemetry (RUM): outcome, path, latency — no transcript, no voice audio.
 * POSTs to /api/ai/tts with kind=tts_rum (same route as synthesis; server logs JSON + optional webhook).
 * When cookie analytics is enabled, also forwards a Plausible/GA-friendly event.
 */

import { analytics } from './analytics';

export type TtsRumPath =
  | 'landing'
  | 'proxy'
  | 'direct_0'
  | 'direct_1'
  | 'browser'
  | 'fail'
  | 'unknown';

export type TtsRumPayload = {
  outcome: 'ok' | 'fail';
  path: TtsRumPath;
  voicePreset: string;
  durationMs: number;
  err?: string;
};

function clampStr(s: string, max: number): string {
  return s.slice(0, max);
}

/**
 * Report one TTS attempt for SLO dashboards (server logs + optional TTS_RUM_WEBHOOK_URL).
 * Product analytics (Plausible/GA) only when the user accepted cookies.
 */
export function reportTtsRum(payload: TtsRumPayload): void {
  if (typeof window === 'undefined') return;

  const bodyObj = {
    kind: 'tts_rum' as const,
    v: 1 as const,
    outcome: payload.outcome,
    path: payload.path,
    voicePreset: clampStr(payload.voicePreset || 'unknown', 48),
    durationMs: Math.min(120_000, Math.max(0, Math.round(payload.durationMs))),
    ...(payload.err ? { err: clampStr(payload.err, 200) } : {}),
    origin: clampStr(window.location?.pathname || '', 160),
  };

  try {
    const body = JSON.stringify(bodyObj);
    const url = '/api/ai/tts';
    const blob = new Blob([body], { type: 'application/json' });
    if (typeof navigator !== 'undefined' && navigator.sendBeacon?.(url, blob)) {
      // sent
    } else {
      void fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* ignore */
  }

  if (analytics.isEnabled()) {
    analytics.trackEvent({
      category: 'Reliability',
      action: 'tts_outcome',
      label: `${payload.outcome}:${payload.path}`,
      value: payload.outcome === 'ok' ? 1 : 0,
      duration_ms: bodyObj.durationMs,
      voice: bodyObj.voicePreset,
    });
  }
}
