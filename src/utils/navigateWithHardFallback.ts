import type { NavigateFunction } from 'react-router';

/**
 * Navigate with a timeout fallback to hard load if SPA navigation stalls.
 *
 * React Router's navigate() updates the browser URL immediately via
 * history.pushState, but the React component tree can fail to transition
 * when the Sidebar (which triggers navigation) is a child of the current
 * page component — it unmounts during the same render cycle.
 *
 * Fix: In navigations away from /tasks, try SPA first, then verify after
 * 350ms that the page content actually changed. If it didn't, force a
 * hard page reload as a safety net.
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

  // Safety net: if the SPA navigation didn't actually change the visible
  // page content after 350ms, force a hard reload. We detect this by
  // checking if the URL is still different from what we wanted (navigate
  // itself failed) OR by detecting the old page's signature element.
  // For the /tasks page specifically, we check if tasks-related DOM
  // elements are still present after the URL changed.
  if (before.startsWith('/tasks')) {
    const preNavTaskElements = document.querySelectorAll('[data-layout="tasks-surface"]').length;

    window.setTimeout(() => {
      const urlNow = `${window.location.pathname}${window.location.search}`;
      if (urlNow !== desired) {
        // navigate() didn't even update the URL
        window.location.assign(desired);
        return;
      }

      // URL updated but check if React actually transitioned
      const postNavTaskElements = document.querySelectorAll('[data-layout="tasks-surface"]').length;
      if (postNavTaskElements >= preNavTaskElements && preNavTaskElements > 0) {
        // Tasks page DOM elements still exist — React didn't transition
        window.location.assign(desired);
      }
    }, 350);
  }
}
