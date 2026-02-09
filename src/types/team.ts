/**
 * Team Type Definitions
 * 
 * Comprehensive type system for team collaboration features.
 * Supports:
 * - Role-based permissions
 * - Team energy pooling
 * - Member statistics
 * - Integration with hierarchical events
 * - Preparation for Scripts & Templates marketplace
 */

export type TeamRole = 'owner' | 'admin' | 'member';
export type TeamInviteStatus = 'pending' | 'accepted' | 'declined';

/**
 * Team Permissions
 * Granular control over what team members can do
 */
export interface TeamPermissions {
  canEditEvents: boolean;
  canDeleteEvents: boolean;
  canInviteMembers: boolean;
  canManageRoles: boolean;
  canCreateTemplates: boolean;
  canEditSettings: boolean;
  canRemoveMembers: boolean;
}

/**
 * Team Member
 * Represents a user's membership in a team
 */
export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  image: string;
  fallback: string;
  role: TeamRole;
  permissions: TeamPermissions;
  joinedAt: string; // ISO datetime
  
  // Statistics for analytics and gamification
  stats: {
    tasksCompleted: number;
    milestonesCompleted: number;
    stepsCompleted: number;
    goalsCompleted: number;
    energyContributed: number;
    lastActive: string; // ISO datetime
  };
  
  // Status
  status: 'online' | 'away' | 'offline';
}

/**
 * Team Settings
 * Configuration for team behavior
 */
export interface TeamSettings {
  // Energy pooling
  sharedEnergyPool: boolean;
  energyMultiplier: number; // Team bonus (1.0 = no bonus, 1.5 = 50% bonus)
  
  // Membership
  requireApprovalForJoin: boolean;
  allowMemberInvites: boolean;
  
  // Templates & Marketplace
  enableTemplateSharing: boolean;
  defaultTemplateVisibility: 'private' | 'team' | 'public';
  
  // Permissions
  defaultMemberPermissions: TeamPermissions;
  
  // Notifications
  notifyOnMemberJoin: boolean;
  notifyOnEnergyMilestone: boolean;
  notifyOnTemplatePublish: boolean;
}

/**
 * Team Energy Stats
 * Track team energy contributions and performance
 */
export interface TeamEnergyStats {
  totalEnergyEarned: number;
  currentDayEnergy: number;
  averageDailyEnergy: number;
  topContributorId: string;
  energyTrend: 'up' | 'down' | 'stable';
  
  // Breakdown by source
  energyFromTasks: number;
  energyFromMilestones: number;
  energyFromSteps: number;
  energyFromGoals: number;
  
  // Team multiplier effects
  bonusEnergyFromMultiplier: number;
}

/**
 * Team
 * Main team data structure
 */
export interface Team {
  id: string;
  name: string;
  description?: string;
  color: string; // Hex color for team branding
  icon?: string; // Optional team icon/emoji
  
  // Ownership
  createdBy: string; // userId of creator
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
  
  // Members
  members: TeamMember[];
  memberCount: number; // Cached for performance
  
  // Settings
  settings: TeamSettings;
  
  // Stats (for dashboard display)
  stats: {
    activeEvents: number;
    completedEvents: number;
    templatesCreated: number;
    templatesShared: number;
  };
  
  // Energy
  energyStats: TeamEnergyStats;
  
  // Tags for organization
  tags?: string[];
}

/**
 * Team Invite
 * Invitation to join a team
 */
export interface TeamInvite {
  id: string;
  teamId: string;
  teamName: string;
  invitedBy: string; // userId
  invitedByName: string;
  invitedEmail: string;
  invitedUserId?: string; // If user exists in system
  status: TeamInviteStatus;
  role: TeamRole;
  permissions: TeamPermissions;
  createdAt: string; // ISO datetime
  expiresAt: string; // ISO datetime
  respondedAt?: string; // ISO datetime
}

/**
 * Team Activity
 * Activity log entry for team feed
 */
export interface TeamActivity {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  userImage: string;
  type: 'member_joined' | 'member_left' | 'event_created' | 'event_completed' | 
        'milestone_completed' | 'goal_completed' | 'template_created' | 
        'template_shared' | 'energy_milestone' | 'role_changed';
  description: string;
  metadata?: Record<string, any>; // Additional context
  createdAt: string; // ISO datetime
}

// ==================== CREATE/UPDATE INPUTS ====================

/**
 * Input for creating a new team
 */
export interface CreateTeamInput {
  name: string;
  description?: string;
  color: string;
  icon?: string;
  settings?: Partial<TeamSettings>;
  tags?: string[];
}

/**
 * Input for updating a team
 */
export interface UpdateTeamInput {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  settings?: Partial<TeamSettings>;
  tags?: string[];
}

/**
 * Input for inviting a member
 */
export interface InviteMemberInput {
  teamId: string;
  email: string;
  role: TeamRole;
  permissions?: Partial<TeamPermissions>;
  message?: string; // Optional invitation message
}

/**
 * Input for updating member permissions
 */
export interface UpdateMemberInput {
  teamId: string;
  userId: string;
  role?: TeamRole;
  permissions?: Partial<TeamPermissions>;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Default permissions by role
 */
export const DEFAULT_PERMISSIONS: Record<TeamRole, TeamPermissions> = {
  owner: {
    canEditEvents: true,
    canDeleteEvents: true,
    canInviteMembers: true,
    canManageRoles: true,
    canCreateTemplates: true,
    canEditSettings: true,
    canRemoveMembers: true,
  },
  admin: {
    canEditEvents: true,
    canDeleteEvents: true,
    canInviteMembers: true,
    canManageRoles: true,
    canCreateTemplates: true,
    canEditSettings: false,
    canRemoveMembers: true,
  },
  member: {
    canEditEvents: false,
    canDeleteEvents: false,
    canInviteMembers: false,
    canManageRoles: false,
    canCreateTemplates: true,
    canEditSettings: false,
    canRemoveMembers: false,
  },
};

/**
 * Default team settings
 */
export const DEFAULT_TEAM_SETTINGS: TeamSettings = {
  sharedEnergyPool: true,
  energyMultiplier: 1.0,
  requireApprovalForJoin: false,
  allowMemberInvites: true,
  enableTemplateSharing: true,
  defaultTemplateVisibility: 'team',
  defaultMemberPermissions: DEFAULT_PERMISSIONS.member,
  notifyOnMemberJoin: true,
  notifyOnEnergyMilestone: true,
  notifyOnTemplatePublish: true,
};

/**
 * Helper: Check if user has permission
 */
export function hasPermission(
  member: TeamMember | undefined,
  permission: keyof TeamPermissions
): boolean {
  if (!member) return false;
  return member.permissions[permission];
}

/**
 * Helper: Check if user is owner or admin
 */
export function isTeamAdmin(member: TeamMember | undefined): boolean {
  if (!member) return false;
  return member.role === 'owner' || member.role === 'admin';
}

/**
 * Helper: Get member by userId
 */
export function getTeamMember(team: Team, userId: string): TeamMember | undefined {
  return team.members.find(m => m.userId === userId);
}

/**
 * Helper: Calculate team health score (0-100)
 */
export function calculateTeamHealth(team: Team): number {
  const activeRatio = team.stats.activeEvents / (team.stats.completedEvents + team.stats.activeEvents || 1);
  const energyTrendScore = team.energyStats.energyTrend === 'up' ? 100 : 
                           team.energyStats.energyTrend === 'stable' ? 70 : 40;
  const memberActivityScore = (team.members.filter(m => m.status === 'online').length / team.memberCount) * 100;
  
  return Math.round((activeRatio * 30 + energyTrendScore * 0.4 + memberActivityScore * 0.3));
}
