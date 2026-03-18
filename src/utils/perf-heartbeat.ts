/**
 * PERF-004: Continuity heartbeat gating.
 *
 * Keep heartbeat work on visible, online runtimes and avoid churn in
 * hidden tabs/background contexts.
 */

export function isForegroundRuntime(): boolean {
  if (typeof document === 'undefined') return true;
  return document.visibilityState !== 'hidden';
}

export function shouldRunHeartbeatTick(options?: { requireOnline?: boolean }): boolean {
  if (!isForegroundRuntime()) return false;
  if (options?.requireOnline && typeof navigator !== 'undefined' && !navigator.onLine) return false;
  return true;
}

export function getHeartbeatIntervalMs(kind: 'presence' | 'local'): number {
  const foreground = isForegroundRuntime();
  if (kind === 'presence') {
    return foreground ? 20_000 : 90_000;
  }
  return foreground ? 15_000 : 60_000;
}
