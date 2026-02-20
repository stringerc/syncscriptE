/**
 * Session Cleanup Utility
 *
 * Clears all app-related localStorage data to ensure a fresh workspace
 * when a guest logs in or any user logs out. All keys are global (not
 * user-scoped), so clearing them prevents stale data from bleeding
 * across sessions.
 */

const SYNCSCRIPT_PREFIXES = ['syncscript_', 'syncscript-'];
const OTHER_APP_KEYS = ['ai-conversations'];

/**
 * Remove every localStorage key that belongs to SyncScript.
 * Call this before setting up a new guest session or on logout.
 */
export function clearAllAppData(): void {
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    const isSyncScriptKey = SYNCSCRIPT_PREFIXES.some(prefix => key.startsWith(prefix));
    const isOtherAppKey = OTHER_APP_KEYS.includes(key);

    if (isSyncScriptKey || isOtherAppKey) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key));
}
