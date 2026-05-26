import type { NavigateFunction } from 'react-router';

/**
 * Navigate with a timeout fallback to hard load if SPA navigation stalls.
 *
 * Previously had a special case for /tasks that forced a full page reload
 * on every exit. This was removed — SPA navigation is now always attempted
 * first, with a 320ms fallback to `window.location.assign` if the URL
 * hasn't changed (indicating the router failed to navigate).
 */
export function navigateWithHardFallback(navigate: NavigateFunction, to: string): void {
  let want: URL;
  try {
    want = new URL(to, window.location.href);
  } catch {
    navigate(to);
    return;
  }

  const desired = `${want.pathname}${want.search}`;
  const before = `${window.location.pathname}${window.location.search}`;

  if (before === desired) {
    return;
  }

  navigate(to);

  window.setTimeout(() => {
    const after = `${window.location.pathname}${window.location.search}`;
    if (after !== desired) {
      window.location.assign(desired);
    }
  }, 320);
}
