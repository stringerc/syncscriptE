/**
 * BACKEND-READY DATA MODEL
 * 
 * Canonical schema to prevent cross-tab drift.
 * This matches the exact backend structure and should be used
 * throughout the application for consistency.
 * 
 * Last Updated: December 24, 2024
 */

// ============================================================================
// CORE
// ============================================================================

export type UserStatus = 'online' | 'away' | 'busy' | 'offline';

export type ThemeMode = 'dark' | 'light' | 'auto';
export type ThemeColor = 'teal' | 'blue' | 'purple' | 'orange' | 'green';
export type FontScale = 'small' | 'medium' | 'large';
export type EnergyDisplayMode = 'points' | 'aura';

export interface UserPreferences {
  themeMode: ThemeMode;
  themeColor: ThemeColor;
  fontScale: FontScale;
  energyDisplayMode: EnergyDisplayMode;
  notificationsEnabled: boolean;
}

export interface TutorialState {
  dashboardSeen: boolean;
  tasksSeen: boolean;
  calendarSeen: boolean;
  energySeen: boolean;
  teamSeen: boolean;
  analyticsSeen: boolean;
  gamingSeen: boolean;
  integrationsSeen: boolean;
  completedAt?: Date;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  handle: string;
  avatarUrl: string;
  status: UserStatus;
  customStatusText?: string;
  preferences: UserPreferences;
  tutorialState: TutorialState;
}

export type PlanName = 'free' | 'pro' | 'team' | 'enterprise';

export interface PlanLimits {
  teams: number;
  integrations: number;
  tasks: number;
  goals: number;
  attachmentsPerItemFiles: number;
  attachmentsPerItemLinks: number;
}

export interface Plan {
  id: string;
  name: PlanName;
  limits: PlanLimits;
}

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trial';

export interface Subscription {
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  renewalAt: Date;
}

// ============================================================================
// TASKS/GOALS
// ============================================================================

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high';
export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'on_hold';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt?: Date;
  locationText?: string;
  energyTag?: string; // Optional energy impact indicator
  isSmart: boolean; // Created via Smart Task wizard
  resourcesCountFiles: number; // Denormalized for badges
  resourcesCountLinks: number; // Denormalized for badges
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: GoalStatus;
  isSmart: boolean; // Created via Smart Goal wizard
  resourcesCountFiles: number; // Denormalized for badges
  resourcesCountLinks: number; // Denormalized for badges
}

export type MilestoneStatus = 'pending' | 'completed';
export type ParentType = 'task' | 'goal';

export interface Milestone {
  id: string;
  parentType: ParentType;
  parentId: string;
  title: string;
  status: MilestoneStatus;
  order: number; // For sorting
}

export type ResourceOwnerType = 'task' | 'goal';
export type ResourceKind = 'file' | 'link';

export interface FileMeta {
  name: string;
  size: number; // bytes
  type: string; // MIME type
}

export interface Resource {
  id: string;
  ownerType: ResourceOwnerType;
  ownerId: string;
  kind: ResourceKind;
  label: string;
  
  // For links
  url?: string;
  
  // For files
  fileMeta?: FileMeta;
}

// ============================================================================
// CALENDAR/TEAM
// ============================================================================

export type EventRole = 'admin' | 'editor' | 'viewer';

export interface Event {
  id: string;
  calendarId: string;
  title: string;
  startAt: Date;
  endAt: Date;
  location?: string;
  description?: string;
  adminUserId: string; // Event creator/admin
  tags: string[];
}

export interface EventAttendee {
  eventId: string;
  userId: string;
  role: EventRole;
}

export type TeamMemberRole = 'lead' | 'admin' | 'member';

export interface Team {
  id: string;
  name: string;
  leadUserId: string; // Team lead (single user)
}

export interface TeamMember {
  teamId: string;
  userId: string;
  role: TeamMemberRole;
  permissionsBitset: number; // Bitwise permissions for future extensibility
}

export type ChatThreadType = 'dm' | 'team';

export interface ChatThread {
  id: string;
  type: ChatThreadType;
  participantIds: string[];
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  createdAt: Date;
}

// ============================================================================
// INTEGRATIONS
// ============================================================================

export type IntegrationProvider = 
  | 'google_calendar'
  | 'gmail'
  | 'notion'
  | 'trello'
  | 'github'
  | 'slack'
  | 'zoom'
  | 'todoist'
  | 'asana'
  | 'jira'
  | 'linear'
  | 'apple_calendar'
  | 'outlook';

export type IntegrationAuthState = 'connected' | 'expired' | 'disconnected';
export type IntegrationSyncMode = 'push' | 'pull' | 'hybrid';

export interface IntegrationConnection {
  id: string;
  userId: string;
  provider: IntegrationProvider;
  authState: IntegrationAuthState;
  syncMode: IntegrationSyncMode;
  lastSyncAt?: Date;
}

export type ImportKind = 'task' | 'event' | 'message' | 'health';

export interface ImportCandidate {
  id: string;
  userId: string;
  provider: IntegrationProvider;
  kind: ImportKind;
  externalId: string; // External ID from the source system
  title: string;
  previewJson: Record<string, any>; // Flexible JSON for preview data
  detectedAt: Date;
  requiresUserAction: boolean; // Red dot indicator for push/hybrid
}

// ============================================================================
// ENERGY (THE MISSING "BLOCKER" FROM AUDIT)
// ============================================================================

export interface EnergyDay {
  userId: string;
  date: string; // YYYY-MM-DD format
  totalPoints: number;
  displayMode: EnergyDisplayMode;
  auraLoops: number; // Number of complete ROYGBIV loops (for Aura mode)
}

export type EnergySourceType = 'task' | 'goal' | 'milestone' | 'achievement' | 'health' | 'decay';
export type EnergyColorCategory = 'tasks' | 'goals' | 'milestones' | 'achievements' | 'health';

export interface EnergyLedgerEntry {
  id: string;
  userId: string;
  dateTime: Date;
  sourceType: EnergySourceType;
  sourceId?: string; // Optional - null for decay
  pointsDelta: number; // Can be negative for decay
  colorCategory?: EnergyColorCategory; // Not set for decay
}

export type AchievementType = 
  | 'first_task'
  | 'task_streak_3'
  | 'task_streak_7'
  | 'task_streak_30'
  | 'first_goal'
  | 'goal_completed'
  | 'energy_100'
  | 'energy_500'
  | 'energy_1000'
  | 'team_collaboration'
  | 'integration_connected'
  | 'perfect_week';

export interface Achievement {
  id: string;
  userId: string;
  type: AchievementType;
  unlockedAt: Date;
}

// ============================================================================
// HELPER TYPES & CONSTANTS
// ============================================================================

/**
 * Plan limits by plan name
 */
export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  free: {
    teams: 1,
    integrations: 3,
    tasks: 50,
    goals: 10,
    attachmentsPerItemFiles: 3,
    attachmentsPerItemLinks: 10,
  },
  pro: {
    teams: 5,
    integrations: 10,
    tasks: 500,
    goals: 50,
    attachmentsPerItemFiles: 20,
    attachmentsPerItemLinks: 50,
  },
  team: {
    teams: 20,
    integrations: 20,
    tasks: 2000,
    goals: 200,
    attachmentsPerItemFiles: 50,
    attachmentsPerItemLinks: 100,
  },
  enterprise: {
    teams: Infinity,
    integrations: Infinity,
    tasks: Infinity,
    goals: Infinity,
    attachmentsPerItemFiles: Infinity,
    attachmentsPerItemLinks: Infinity,
  },
};

/**
 * Energy points by source
 */
export const ENERGY_POINTS = {
  task: {
    low: 10,
    medium: 20,
    high: 30,
  },
  goal: {
    small: 50,
    medium: 100,
    large: 200,
  },
  milestone: 75,
  achievement: {
    bronze: 25,
    silver: 50,
    gold: 100,
    platinum: 150,
  },
  health: {
    hydration: 5,
    steps: 15,
    workout: 25,
    sleep: 20,
  },
  decay: {
    inactivity: -2, // Per hour
  },
};

/**
 * Team permissions bitset values
 */
export enum TeamPermissions {
  VIEW = 1 << 0,          // 1
  COMMENT = 1 << 1,       // 2
  EDIT_TASKS = 1 << 2,    // 4
  CREATE_TASKS = 1 << 3,  // 8
  DELETE_TASKS = 1 << 4,  // 16
  MANAGE_MEMBERS = 1 << 5,// 32
  MANAGE_SETTINGS = 1 << 6,// 64
  FULL_ADMIN = 1 << 7,    // 128
}

/**
 * Default permissions by role
 */
export const DEFAULT_TEAM_PERMISSIONS: Record<TeamMemberRole, number> = {
  lead: TeamPermissions.FULL_ADMIN,
  admin: TeamPermissions.VIEW | TeamPermissions.COMMENT | TeamPermissions.EDIT_TASKS | 
         TeamPermissions.CREATE_TASKS | TeamPermissions.DELETE_TASKS | TeamPermissions.MANAGE_MEMBERS,
  member: TeamPermissions.VIEW | TeamPermissions.COMMENT | TeamPermissions.EDIT_TASKS | 
          TeamPermissions.CREATE_TASKS,
};

/**
 * Integration sync mode mapping
 */
export const INTEGRATION_SYNC_MODES: Record<IntegrationProvider, IntegrationSyncMode> = {
  google_calendar: 'hybrid',
  gmail: 'hybrid',
  notion: 'hybrid',
  trello: 'push',
  github: 'hybrid',
  slack: 'hybrid',
  zoom: 'hybrid',
  todoist: 'pull',
  asana: 'hybrid',
  jira: 'hybrid',
  linear: 'hybrid',
  apple_calendar: 'pull',
  outlook: 'hybrid',
};

/**
 * Check if integration supports auto red-dot notifications
 */
export function supportsAutoNotifications(syncMode: IntegrationSyncMode): boolean {
  return syncMode === 'push' || syncMode === 'hybrid';
}

/**
 * Get energy points for a task based on priority
 */
export function getTaskEnergyPoints(priority: TaskPriority): number {
  switch (priority) {
    case 'low': return ENERGY_POINTS.task.low;
    case 'medium': return ENERGY_POINTS.task.medium;
    case 'high': return ENERGY_POINTS.task.high;
  }
}

/**
 * Calculate aura loops from total points
 * Each loop = 100 points (ROYGBIV cycle)
 */
export function calculateAuraLoops(totalPoints: number): number {
  return Math.floor(totalPoints / 100);
}

/**
 * Get color for current aura position
 */
export function getAuraColor(totalPoints: number): string {
  const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
  const position = Math.floor((totalPoints % 100) / (100 / 7));
  return colors[Math.min(position, 6)];
}

/**
 * Check if user can perform action based on permissions
 */
export function hasPermission(userPermissions: number, permission: TeamPermissions): boolean {
  return (userPermissions & permission) !== 0;
}

/**
 * Check if resource limits are exceeded for plan
 */
export function isResourceLimitExceeded(
  currentCount: number,
  limit: number
): boolean {
  return currentCount >= limit && limit !== Infinity;
}

/**
 * Default user preferences
 */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  themeMode: 'dark',
  themeColor: 'teal',
  fontScale: 'medium',
  energyDisplayMode: 'points',
  notificationsEnabled: true,
};

/**
 * Default tutorial state
 */
export const DEFAULT_TUTORIAL_STATE: TutorialState = {
  dashboardSeen: false,
  tasksSeen: false,
  calendarSeen: false,
  energySeen: false,
  teamSeen: false,
  analyticsSeen: false,
  gamingSeen: false,
  integrationsSeen: false,
};
