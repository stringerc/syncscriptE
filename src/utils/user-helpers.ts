/**
 * User Helper Utilities
 * 
 * Helper functions to work with user data consistently across the application.
 */

import { UserProfile } from './user-profile';

/**
 * Check if a user is the current logged-in user
 * 
 * @param userName - The name of the user to check
 * @param currentProfile - The current user's profile from UserProfileContext
 * @returns true if the user is the current user
 */
export function isCurrentUser(userName: string, currentProfile: UserProfile): boolean {
  return userName === currentProfile.name;
}

/**
 * Check if a user is the current logged-in user (by email)
 * 
 * @param userEmail - The email of the user to check
 * @param currentProfile - The current user's profile from UserProfileContext
 * @returns true if the user is the current user
 */
export function isCurrentUserByEmail(userEmail: string, currentProfile: UserProfile): boolean {
  return userEmail === currentProfile.email;
}

/**
 * Get display name for a user (shows "You" for current user)
 * 
 * @param userName - The name of the user
 * @param currentProfile - The current user's profile from UserProfileContext
 * @param showYou - Whether to show "You" for current user (default: true)
 * @returns The display name
 */
export function getDisplayName(
  userName: string, 
  currentProfile: UserProfile,
  showYou: boolean = true
): string {
  if (showYou && isCurrentUser(userName, currentProfile)) {
    return 'You';
  }
  return userName;
}

/**
 * Sort collaborators/team members to put current user first
 * 
 * @param users - Array of users with name property
 * @param currentProfile - The current user's profile from UserProfileContext
 * @returns Sorted array with current user first
 */
export function sortWithCurrentUserFirst<T extends { name: string }>(
  users: T[],
  currentProfile: UserProfile
): T[] {
  return [...users].sort((a, b) => {
    const aIsCurrent = isCurrentUser(a.name, currentProfile);
    const bIsCurrent = isCurrentUser(b.name, currentProfile);
    
    if (aIsCurrent && !bIsCurrent) return -1;
    if (!aIsCurrent && bIsCurrent) return 1;
    return 0;
  });
}
