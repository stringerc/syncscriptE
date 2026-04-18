import type { NavigateFunction } from 'react-router';

/**
 * Projects OS (`/tasks`) loads a very large chunk graph. Client-side navigation away from it can fail
 * in production (stale PWA precache, router edge cases) with no console error — users stay on /tasks.
 *
 * When leaving the tasks surface for another top-level route, use a full page load so navigation
 * cannot silently no-op. Other routes keep SPA navigation + timeout fallback.
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

  const fromTasksSurface = window.location.pathname === '/tasks' || window.location.pathname.startsWith('/tasks/');
  const stillOnTasksSurface =
    want.pathname === '/tasks' || want.pathname.startsWith('/tasks/');

  if (fromTasksSurface && !stillOnTasksSurface) {
    window.location.assign(desired);
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
