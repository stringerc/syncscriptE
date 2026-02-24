import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
  level: number;
  xp: number;
  dailyStreak: number;
  // Energy readiness override (0-100) - if null, calculate from circadian rhythm
  energyReadinessOverride: number | null;
}

interface UserProfileContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setEnergyReadiness: (readiness: number | null) => void;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);
const USER_PROFILE_STORAGE_KEY = 'userProfile';
const PROFILE_MIGRATION_FLAG_KEY = 'syncscript_profile_seed_migration_v1';

const DEFAULT_PROFILE: UserProfile = {
  id: 'user_001',
  name: 'Jordan Smith',
  email: 'jordan.smith@syncscript.com',
  avatar: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100',
  status: 'online',
  level: 1,
  xp: 0,
  dailyStreak: 0,
  energyReadinessOverride: 0, // Start at 0% (RED) for new users
};

function migrateLegacySeedProfile(storedProfile: Partial<UserProfile>): UserProfile {
  const merged: UserProfile = { ...DEFAULT_PROFILE, ...storedProfile };
  const alreadyMigrated = localStorage.getItem(PROFILE_MIGRATION_FLAG_KEY) === 'true';
  if (alreadyMigrated) return merged;

  const isLegacySeedProfile =
    merged.id === 'user_001' &&
    merged.email === 'jordan.smith@syncscript.com' &&
    merged.name === 'Jordan Smith' &&
    merged.level === 24 &&
    merged.dailyStreak === 12 &&
    merged.xp === 3450;

  if (!isLegacySeedProfile) {
    localStorage.setItem(PROFILE_MIGRATION_FLAG_KEY, 'true');
    return merged;
  }

  const resetProfile: UserProfile = {
    ...merged,
    level: 1,
    xp: 0,
    dailyStreak: 0,
  };

  localStorage.setItem(PROFILE_MIGRATION_FLAG_KEY, 'true');
  localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(resetProfile));
  return resetProfile;
}

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(() => {
    // Try to load from localStorage
    const stored = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (stored) {
      try {
        return migrateLegacySeedProfile(JSON.parse(stored));
      } catch {
        return DEFAULT_PROFILE;
      }
    }
    localStorage.setItem(PROFILE_MIGRATION_FLAG_KEY, 'true');
    return DEFAULT_PROFILE;
  });

  // Save to localStorage whenever profile changes
  useEffect(() => {
    localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const setEnergyReadiness = (readiness: number | null) => {
    setProfile(prev => ({ ...prev, energyReadinessOverride: readiness }));
  };

  return (
    <UserProfileContext.Provider value={{ profile, updateProfile, setEnergyReadiness }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within UserProfileProvider');
  }
  return context;
}

// ══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

export type UserStatus = 'online' | 'away' | 'offline' | 'busy' | 'dnd';

/**
 * Get user initials from name
 * Examples: "Jordan Smith" → "JS", "John" → "J"
 */
export function getUserInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Get status indicator color classes
 * Research: Slack's status colors (2024)
 */
export function getStatusColor(status: UserStatus): string {
  const statusColors: Record<UserStatus, string> = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-500',
    busy: 'bg-red-500',
    dnd: 'bg-red-600',
  };
  return statusColors[status] || statusColors.offline;
}
