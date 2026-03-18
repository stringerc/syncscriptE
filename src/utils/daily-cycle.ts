type PeakEnergyTime = 'morning' | 'afternoon' | 'evening' | 'night';

interface StoredUserPreferences {
  peakEnergyTime?: PeakEnergyTime;
  preferredStartTime?: string;
}

const USER_PREFERENCES_KEY = 'syncscript_user_preferences';

function parseTimeTo24Hour(value?: string): number | null {
  if (!value) return null;
  const raw = value.trim().toUpperCase();
  const match = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);
  if (!match) return null;

  let hour = Number(match[1]);
  const suffix = match[3];
  if (Number.isNaN(hour) || hour < 0 || hour > 23) return null;

  if (suffix === 'AM') {
    if (hour === 12) hour = 0;
  } else if (suffix === 'PM') {
    if (hour !== 12) hour += 12;
  }

  return Math.max(0, Math.min(23, hour));
}

function loadStoredPreferences(): StoredUserPreferences | null {
  try {
    const raw = localStorage.getItem(USER_PREFERENCES_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredUserPreferences;
  } catch {
    return null;
  }
}

/**
 * Picks a humane reset hour:
 * - Default 3 AM (safe for most 9-5 users + post-midnight workers)
 * - Night/evening chronotypes shift later (4 AM)
 * - Very early starters shift earlier (2 AM)
 */
export function getAdaptiveResetHour(preferences?: StoredUserPreferences): number {
  const prefs = preferences ?? loadStoredPreferences() ?? {};
  const startHour = parseTimeTo24Hour(prefs.preferredStartTime);
  const peak = prefs.peakEnergyTime;

  if (peak === 'night' || peak === 'evening') return 4;
  if (startHour !== null && startHour <= 6) return 2;
  if (startHour !== null && startHour >= 10) return 4;
  return 3;
}

export function getCycleDayKey(date: Date, resetHour: number): string {
  const shifted = new Date(date);
  shifted.setHours(shifted.getHours() - resetHour, shifted.getMinutes(), shifted.getSeconds(), shifted.getMilliseconds());
  const y = shifted.getFullYear();
  const m = String(shifted.getMonth() + 1).padStart(2, '0');
  const d = String(shifted.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
