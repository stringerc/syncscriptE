/**
 * Page Visibility / focus / reduced-motion source of truth.
 *
 * Top-tier products (Linear, Figma, Browserbase, Anthropic Operator) all
 * aggressively pause expensive work when the tab isn't visible to the user.
 * The browser already auto-throttles `requestAnimationFrame` and stops
 * `refetchInterval` (when `refetchIntervalInBackground: false`, which is
 * React Query's default), but it does NOT pause:
 *   - WebSocket message handlers / message decode
 *   - Canvas painting on `<canvas>` that we do imperatively
 *   - Realtime channel listeners (Supabase keeps the socket open and routes
 *     postgres_changes messages even when tab is hidden)
 *
 * This hook returns a stable, debounced state object that consumers can use
 * to wire pause/resume behaviour.
 *
 * Reduce-motion is also bundled because it's another universal "be a good
 * citizen" toggle — operating systems expose this and we should honor it.
 */
import { useEffect, useState } from 'react';

interface PageVisibility {
  /** `false` while the document is hidden (tab in background, minimised, etc.). */
  visible: boolean;
  /** `false` when the window doesn't have OS-level focus (user switched apps). */
  focused: boolean;
  /** `true` when the OS prefers reduced motion. */
  reducedMotion: boolean;
  /** `true` when the device is on battery AND <20% — caller should throttle FPS. */
  batteryLow: boolean;
  /** `true` when the user has enabled Data Saver mode on their device. */
  saveData: boolean;
  /** Effective connection profile from the Network Information API. */
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
}

let batteryRef: { level: number; charging: boolean } = { level: 1, charging: true };

function readState(): PageVisibility {
  if (typeof document === 'undefined') {
    return {
      visible: true, focused: true, reducedMotion: false,
      batteryLow: false, saveData: false, effectiveType: 'unknown',
    };
  }
  // Network Information API — Chrome / Edge / Android. Returns undefined on Firefox / Safari.
  const conn = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  return {
    visible: !document.hidden,
    focused: typeof document.hasFocus === 'function' ? document.hasFocus() : true,
    reducedMotion:
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    batteryLow: !batteryRef.charging && batteryRef.level < 0.2,
    saveData: conn?.saveData === true,
    effectiveType: ((conn?.effectiveType as PageVisibility['effectiveType']) || 'unknown'),
  };
}

let listeners = new Set<(state: PageVisibility) => void>();
let cached: PageVisibility | null = null;
let installed = false;

function notify() {
  cached = readState();
  for (const fn of listeners) fn(cached);
  // Side effect: data-page-visible attr on <html> so CSS can pause animations
  // marked with `[data-pause-when-hidden]` (see src/index.css additions).
  if (typeof document !== 'undefined' && document.documentElement) {
    if (cached.visible) {
      document.documentElement.removeAttribute('data-page-hidden');
    } else {
      document.documentElement.setAttribute('data-page-hidden', 'true');
    }
  }
}

function install() {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  document.addEventListener('visibilitychange', notify, { passive: true });
  window.addEventListener('focus', notify, { passive: true });
  window.addEventListener('blur', notify, { passive: true });
  if (typeof window.matchMedia === 'function') {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', notify);
    }
  }
  // Battery Status API — Chrome / Edge / Android. Promise resolves once;
  // event listeners keep batteryRef live for `levelchange` + `chargingchange`.
  // Permanently no-ops on Firefox / Safari (no getBattery), which is fine —
  // those browsers fall through to the default "battery healthy" assumption.
  const nav = navigator as Navigator & { getBattery?: () => Promise<unknown> };
  if (typeof nav.getBattery === 'function') {
    nav.getBattery().then((battery) => {
      const b = battery as { level: number; charging: boolean; addEventListener: (k: string, fn: () => void) => void };
      batteryRef = { level: b.level, charging: b.charging };
      const refresh = () => { batteryRef = { level: b.level, charging: b.charging }; notify(); };
      try { b.addEventListener('levelchange', refresh); } catch { /* ignore */ }
      try { b.addEventListener('chargingchange', refresh); } catch { /* ignore */ }
      notify();
    }).catch(() => { /* permissions denied / unsupported — leave defaults */ });
  }
  // Network Information API — listen for type changes.
  const conn = (navigator as Navigator & {
    connection?: { addEventListener?: (k: string, fn: () => void) => void };
  }).connection;
  if (conn && typeof conn.addEventListener === 'function') {
    try { conn.addEventListener('change', notify); } catch { /* ignore */ }
  }
  notify();
}

export function usePageVisibility(): PageVisibility {
  install();
  const [state, setState] = useState<PageVisibility>(() => cached || readState());
  useEffect(() => {
    listeners.add(setState);
    setState(cached || readState());
    return () => {
      listeners.delete(setState);
    };
  }, []);
  return state;
}

/**
 * Imperative read for code paths outside React (e.g. one-off setup logic).
 */
export function getPageVisibility(): PageVisibility {
  install();
  return cached || readState();
}
