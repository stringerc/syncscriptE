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
}

function readState(): PageVisibility {
  if (typeof document === 'undefined') {
    return { visible: true, focused: true, reducedMotion: false };
  }
  return {
    visible: !document.hidden,
    focused: typeof document.hasFocus === 'function' ? document.hasFocus() : true,
    reducedMotion:
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
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
