/** Reads Nexus persona mode from the same `syncscript_settings` blob as Settings → General. */

const SETTINGS_KEY = 'syncscript_settings';

export type StoredNexusPersonaMode = 'standard' | 'halo_inspired';

export function getStoredNexusPersonaMode(): StoredNexusPersonaMode {
  if (typeof window === 'undefined') return 'halo_inspired';
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return 'halo_inspired';
    const s = JSON.parse(raw) as { nexusPersonaMode?: string };
    return s.nexusPersonaMode === 'standard' ? 'standard' : 'halo_inspired';
  } catch {
    return 'halo_inspired';
  }
}
