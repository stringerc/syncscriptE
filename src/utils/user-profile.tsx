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

const DEFAULT_PROFILE: UserProfile = {
  id: 'user_001',
  name: 'Jordan Smith',
  email: 'jordan.smith@syncscript.com',
  avatar: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100',
  status: 'online',
  level: 24,
  xp: 3450,
  dailyStreak: 12,
  energyReadinessOverride: 0, // Start at 0% (RED) for new users
};

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(() => {
    // Try to load from localStorage
    const stored = localStorage.getItem('userProfile');
    if (stored) {
      try {
        return { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_PROFILE;
      }
    }
    return DEFAULT_PROFILE;
  });

  // Save to localStorage whenever profile changes
  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(profile));
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
