/**
 * Centralized User Constants
 * 
 * This file contains the user profile information used throughout the application.
 * By centralizing these constants, we ensure consistency across all components.
 * 
 * ⚠️ IMPORTANT: This data MUST match the DEFAULT_PROFILE in /utils/user-profile.tsx
 * The single source of truth is UserProfileContext. Use useUserProfile() hook instead
 * of CURRENT_USER wherever possible for real-time updates.
 * 
 * Usage:
 * import { CURRENT_USER } from '../utils/user-constants';
 * 
 * Better usage (recommended):
 * import { useUserProfile } from '../utils/user-profile';
 * const { profile } = useUserProfile();
 */

export const CURRENT_USER = {
  // Profile Information - MUST MATCH UserProfileContext
  id: 'user_001',
  name: 'Jordan Smith',
  email: 'jordan.smith@syncscript.com',
  initials: 'JS',
  
  // Avatar - MUST MATCH UserProfileContext
  // This is the SINGLE avatar URL used across the entire application
  avatar: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=400&h=400&fit=crop&crop=face',
  image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=400&h=400&fit=crop&crop=face', // Alias for compatibility
  
  // Gamification Stats
  level: 1,
  xp: 0,
  nextLevelXP: 100,
  
  // Energy & Productivity
  energyLevel: 85, // 0-100
  todayScore: 85,  // 0-100
  
  // Streaks & Engagement
  dailyStreak: 0,
  currentStreak: 0,
  longestStreak: 0,
  
  // Analytics
  weeklyAverage: 78,
  
  // User Status
  status: 'available' as const,
} as const;

/**
 * Helper function to get user's initials from full name
 */
export function getUserInitials(name: string = CURRENT_USER.name): string {
  return name.split(' ').map(n => n[0]).join('');
}

/**
 * Helper function to calculate XP progress percentage
 */
export function getXPProgress(currentXP: number = CURRENT_USER.xp, nextLevel: number = CURRENT_USER.nextLevelXP): number {
  return Math.round((currentXP / nextLevel) * 100);
}
