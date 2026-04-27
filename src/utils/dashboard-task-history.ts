/**
 * Per-user, per-device signal: this account has had real task rows from the API at least once.
 *
 * Why: `GET /tasks` returns the full list including completed, so "all done" is usually still
 * non-empty. If the list is ever truly empty (deleted everything, or fresh tab), we still need
 * to avoid showing sample "Review Q4" / "Client presentation" for users who are clearly not
 * new — without requiring a new server column (see NN/g empty state patterns: distinguish
 * first-use from zero-state for established users).
 *
 * Not cross-device: cleared storage may briefly show samples again; acceptable tradeoff.
 */

const KEY_PREFIX = 'syncscript_dash_saw_real_tasks_v1:';

function keyForUser(userId: string): string {
  return `${KEY_PREFIX}${userId}`;
}

export function markDashboardSawRealTasksForUser(userId: string | null | undefined): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    window.localStorage.setItem(keyForUser(userId), '1');
  } catch {
    // ignore quota / private mode
  }
}

/**
 * True if this browser has seen at least one non-empty /tasks response for this user, or
 * the flag was set after any successful task list with rows.
 */
export function userHasDashboardTaskHistory(userId: string | null | undefined): boolean {
  if (typeof window === 'undefined' || !userId) return false;
  try {
    return window.localStorage.getItem(keyForUser(userId)) === '1';
  } catch {
    return false;
  }
}
