/**
 * TEAM-EVENT INTEGRATION UTILITIES
 * 
 * Comprehensive utilities for integrating teams with the hierarchical event/task system.
 * Supports primary events, child events, task associations, permissions, and lifecycle management.
 * 
 * Integration with:
 * - Hierarchical Event Architecture (Phase 5)
 * - Event-Task Associations (Phase 5E)
 * - Team Collaboration System
 * - Scripts & Templates (Phase 6B - upcoming)
 */

import { Event, Task, TeamMember } from './event-task-types';
import { Team } from './team-helpers';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TeamEventStats {
  totalEvents: number;
  primaryEvents: number;
  childEvents: number;
  activeTasks: number;
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
}

export interface TeamEventHierarchy {
  primaryEvent: Event;
  childEvents: Event[];
  allTasks: Task[];
  depth: number;
  memberCount: number;
  completionRate: number;
}

export interface TeamMemberEventContribution {
  memberId: string;
  memberName: string;
  eventsCreated: number;
  eventsParticipating: number;
  tasksAssigned: number;
  tasksCompleted: number;
  role: 'admin' | 'editor' | 'viewer';
}

export interface TeamEventPermission {
  eventId: string;
  teamId: string;
  memberPermissions: {
    userId: string;
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canManageTeam: boolean;
  }[];
  inheritFromParent: boolean;
  primaryEventCreatorId: string;
}

// ============================================================================
// TEAM EVENT FILTERING
// ============================================================================

/**
 * Get all events that belong to a team
 * An event belongs to a team if any team member is in teamMembers array
 */
export function getTeamEvents(team: Team, allEvents: Event[]): Event[] {
  const teamMemberIds = new Set([
    team.admin.id,
    ...team.members.map(m => m.id)
  ]);

  return allEvents.filter(event => {
    // Check if any team member is in the event
    return event.teamMembers?.some(member => 
      teamMemberIds.has(member.id)
    );
  });
}

/**
 * Get only primary events for a team (root-level events)
 */
export function getTeamPrimaryEvents(team: Team, allEvents: Event[]): Event[] {
  return getTeamEvents(team, allEvents).filter(event => 
    event.isPrimaryEvent === true && event.depth === 0
  );
}

/**
 * Get child events for a team
 */
export function getTeamChildEvents(team: Team, allEvents: Event[]): Event[] {
  return getTeamEvents(team, allEvents).filter(event => 
    !event.isPrimaryEvent || event.depth > 0
  );
}

/**
 * Get active (non-archived, incomplete) team events
 */
export function getActiveTeamEvents(team: Team, allEvents: Event[]): Event[] {
  return getTeamEvents(team, allEvents).filter(event => 
    !event.archived && !event.completed
  );
}

/**
 * Get completed team events
 */
export function getCompletedTeamEvents(team: Team, allEvents: Event[]): Event[] {
  return getTeamEvents(team, allEvents).filter(event => 
    event.completed && !event.archived
  );
}

/**
 * Get archived team events
 */
export function getArchivedTeamEvents(team: Team, allEvents: Event[]): Event[] {
  return getTeamEvents(team, allEvents).filter(event => 
    event.archived
  );
}

// ============================================================================
// TEAM EVENT HIERARCHY
// ============================================================================

/**
 * Get complete event hierarchy for a team's primary event
 * Includes the primary event, all child events, and all associated tasks
 */
export function getTeamEventHierarchy(
  primaryEventId: string,
  team: Team,
  allEvents: Event[],
  allTasks: Task[]
): TeamEventHierarchy | null {
  const primaryEvent = allEvents.find(e => e.id === primaryEventId);
  if (!primaryEvent || !primaryEvent.isPrimaryEvent) return null;

  // Get all child events
  const childEvents = allEvents.filter(e => 
    e.primaryEventId === primaryEventId && e.id !== primaryEventId
  );

  // Get all tasks for this hierarchy
  const hierarchyTasks = allTasks.filter(t => 
    t.primaryEventId === primaryEventId || 
    t.parentEventId === primaryEventId ||
    childEvents.some(child => t.parentEventId === child.id)
  );

  // Calculate stats
  const completedTasks = hierarchyTasks.filter(t => t.completed).length;
  const completionRate = hierarchyTasks.length > 0
    ? Math.round((completedTasks / hierarchyTasks.length) * 100)
    : 0;

  // Get max depth
  const maxDepth = childEvents.length > 0
    ? Math.max(...childEvents.map(e => e.depth))
    : 0;

  // Get unique team members across hierarchy
  const allMemberIds = new Set<string>();
  [primaryEvent, ...childEvents].forEach(event => {
    event.teamMembers.forEach(member => allMemberIds.add(member.id));
  });

  return {
    primaryEvent,
    childEvents,
    allTasks: hierarchyTasks,
    depth: maxDepth,
    memberCount: allMemberIds.size,
    completionRate,
  };
}

/**
 * Get all event hierarchies for a team
 */
export function getAllTeamEventHierarchies(
  team: Team,
  allEvents: Event[],
  allTasks: Task[]
): TeamEventHierarchy[] {
  const primaryEvents = getTeamPrimaryEvents(team, allEvents);
  
  return primaryEvents
    .map(pe => getTeamEventHierarchy(pe.id, team, allEvents, allTasks))
    .filter((h): h is TeamEventHierarchy => h !== null);
}

// ============================================================================
// TEAM EVENT TASKS
// ============================================================================

/**
 * Get all tasks associated with team events
 * Includes tasks from primary events and all child events
 */
export function getTeamEventTasks(
  team: Team,
  allEvents: Event[],
  allTasks: Task[]
): Task[] {
  const teamEvents = getTeamEvents(team, allEvents);
  const teamEventIds = new Set(teamEvents.map(e => e.id));

  return allTasks.filter(task => 
    task.parentEventId && teamEventIds.has(task.parentEventId)
  );
}

/**
 * Get standalone team tasks (not associated with any event)
 */
export function getTeamStandaloneTasks(
  team: Team,
  allEvents: Event[],
  allTasks: Task[]
): Task[] {
  const teamMemberIds = new Set([
    team.admin.id,
    ...team.members.map(m => m.id)
  ]);

  return allTasks.filter(task => {
    // No event association
    if (task.parentEventId || task.primaryEventId) return false;
    
    // Has team member assigned
    return task.assignedTo?.some(member => 
      teamMemberIds.has(member.id)
    );
  });
}

// ============================================================================
// TEAM EVENT STATISTICS
// ============================================================================

/**
 * Calculate comprehensive team event statistics
 */
export function getTeamEventStats(
  team: Team,
  allEvents: Event[],
  allTasks: Task[]
): TeamEventStats {
  const teamEvents = getTeamEvents(team, allEvents);
  const primaryEvents = teamEvents.filter(e => e.isPrimaryEvent);
  const childEvents = teamEvents.filter(e => !e.isPrimaryEvent || e.depth > 0);
  
  const teamEventTasks = getTeamEventTasks(team, allEvents, allTasks);
  const activeTasks = teamEventTasks.filter(t => !t.completed && !t.archived).length;
  const completedTasks = teamEventTasks.filter(t => t.completed).length;
  const totalTasks = teamEventTasks.length;
  
  const completionRate = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  return {
    totalEvents: teamEvents.length,
    primaryEvents: primaryEvents.length,
    childEvents: childEvents.length,
    activeTasks,
    completedTasks,
    totalTasks,
    completionRate,
  };
}

/**
 * Get team member's contribution to team events
 */
export function getTeamMemberEventContribution(
  memberId: string,
  team: Team,
  allEvents: Event[],
  allTasks: Task[]
): TeamMemberEventContribution {
  const teamEvents = getTeamEvents(team, allEvents);
  
  // Events created by member
  const eventsCreated = teamEvents.filter(e => 
    e.createdBy === memberId || e.primaryEventCreator === memberId
  ).length;
  
  // Events member is participating in
  const eventsParticipating = teamEvents.filter(e => 
    e.teamMembers.some(m => m.id === memberId)
  ).length;
  
  // Tasks assigned to member in team events
  const memberTasks = getTeamEventTasks(team, allEvents, allTasks).filter(t =>
    t.assignedTo?.some(m => m.id === memberId)
  );
  
  const tasksCompleted = memberTasks.filter(t => t.completed).length;
  
  // Get member's role in team
  const member = team.members.find(m => m.id === memberId);
  const role = team.admin.id === memberId ? 'admin' : (member?.role || 'viewer');

  return {
    memberId,
    memberName: member?.name || team.admin.name,
    eventsCreated,
    eventsParticipating,
    tasksAssigned: memberTasks.length,
    tasksCompleted,
    role,
  };
}

/**
 * Get contributions for all team members
 */
export function getAllTeamMemberEventContributions(
  team: Team,
  allEvents: Event[],
  allTasks: Task[]
): TeamMemberEventContribution[] {
  const allMembers = [team.admin, ...team.members];
  
  return allMembers
    .map(member => getTeamMemberEventContribution(member.id, team, allEvents, allTasks))
    .sort((a, b) => b.eventsCreated - a.eventsCreated);
}

// ============================================================================
// TEAM EVENT PERMISSIONS
// ============================================================================

/**
 * Check if a team member can view an event
 */
export function canTeamMemberViewEvent(
  memberId: string,
  eventId: string,
  team: Team,
  allEvents: Event[]
): boolean {
  const event = allEvents.find(e => e.id === eventId);
  if (!event) return false;
  
  // Check if user is in the team
  const teamMemberIds = new Set([team.admin.id, ...team.members.map(m => m.id)]);
  if (!teamMemberIds.has(memberId)) return false;
  
  // Check if user is in event team
  return event.teamMembers.some(m => m.id === memberId);
}

/**
 * Check if a team member can edit an event
 */
export function canTeamMemberEditEvent(
  memberId: string,
  eventId: string,
  team: Team,
  allEvents: Event[]
): boolean {
  const event = allEvents.find(e => e.id === eventId);
  if (!event) return false;
  
  // Team admin can always edit
  if (team.admin.id === memberId) return true;
  
  // Event creator can edit
  if (event.createdBy === memberId) return true;
  
  // Primary event creator controls hierarchy
  if (event.primaryEventCreator === memberId) return true;
  
  // Check permission overrides
  const override = event.permissionOverrides?.find(p => p.userId === memberId);
  if (override) {
    return override.role === 'admin' || override.role === 'editor';
  }
  
  // Check event team member role
  const eventMember = event.teamMembers.find(m => m.id === memberId);
  if (!eventMember) return false;
  
  return eventMember.role === 'admin' || 
         (eventMember.role === 'member' && event.allowTeamEdits);
}

/**
 * Check if a team member can delete an event
 */
export function canTeamMemberDeleteEvent(
  memberId: string,
  eventId: string,
  team: Team,
  allEvents: Event[]
): boolean {
  const event = allEvents.find(e => e.id === eventId);
  if (!event) return false;
  
  // Only team admin or event creator can delete
  if (team.admin.id === memberId) return true;
  if (event.createdBy === memberId) return true;
  if (event.primaryEventCreator === memberId) return true;
  
  return false;
}

/**
 * Get team member's permissions for an event
 */
export function getTeamMemberEventPermissions(
  memberId: string,
  eventId: string,
  team: Team,
  allEvents: Event[]
): TeamEventPermission['memberPermissions'][0] {
  return {
    userId: memberId,
    canView: canTeamMemberViewEvent(memberId, eventId, team, allEvents),
    canEdit: canTeamMemberEditEvent(memberId, eventId, team, allEvents),
    canDelete: canTeamMemberDeleteEvent(memberId, eventId, team, allEvents),
    canManageTeam: team.admin.id === memberId,
  };
}

// ============================================================================
// TEAM EVENT CREATION & MANAGEMENT
// ============================================================================

/**
 * Create a new primary event for a team
 */
export function createTeamPrimaryEvent(
  team: Team,
  creatorId: string,
  eventData: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    color?: string;
    category?: string;
  }
): Event {
  const eventId = `event-team-${team.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: eventId,
    title: eventData.title,
    description: eventData.description,
    startTime: eventData.startTime,
    endTime: eventData.endTime,
    completed: false,
    
    // Primary event properties
    isPrimaryEvent: true,
    primaryEventId: eventId,
    depth: 0,
    childEventIds: [],
    
    // Lifecycle
    archived: false,
    autoArchiveChildren: true,
    
    // Team
    teamMembers: [team.admin, ...team.members],
    createdBy: creatorId,
    primaryEventCreator: creatorId,
    createdAt: new Date(),
    updatedAt: new Date(),
    
    // Permissions
    allowTeamEdits: true,
    inheritPermissions: false,
    
    // Tasks & Resources
    tasks: [],
    resources: [],
    linksNotes: [],
    hasScript: false,
    
    // Metadata
    color: eventData.color,
    category: eventData.category,
  };
}

/**
 * Add team member to an event
 */
export function addTeamMemberToEvent(
  event: Event,
  member: TeamMember,
  role: 'admin' | 'member' | 'viewer' = 'member'
): Event {
  // Check if member already exists
  if (event.teamMembers.some(m => m.id === member.id)) {
    return event;
  }
  
  return {
    ...event,
    teamMembers: [...event.teamMembers, { ...member, role }],
    updatedAt: new Date(),
  };
}

/**
 * Remove team member from an event
 */
export function removeTeamMemberFromEvent(
  event: Event,
  memberId: string
): Event {
  // Don't remove if they're the creator
  if (event.createdBy === memberId || event.primaryEventCreator === memberId) {
    return event;
  }
  
  return {
    ...event,
    teamMembers: event.teamMembers.filter(m => m.id !== memberId),
    updatedAt: new Date(),
  };
}

// ============================================================================
// TEAM EVENT FILTERING & SEARCH
// ============================================================================

export type TeamEventFilter = 'all' | 'primary' | 'child' | 'active' | 'completed' | 'archived';

/**
 * Filter team events based on filter type
 */
export function filterTeamEvents(
  team: Team,
  allEvents: Event[],
  filter: TeamEventFilter
): Event[] {
  const teamEvents = getTeamEvents(team, allEvents);
  
  switch (filter) {
    case 'primary':
      return teamEvents.filter(e => e.isPrimaryEvent);
    case 'child':
      return teamEvents.filter(e => !e.isPrimaryEvent || e.depth > 0);
    case 'active':
      return teamEvents.filter(e => !e.completed && !e.archived);
    case 'completed':
      return teamEvents.filter(e => e.completed && !e.archived);
    case 'archived':
      return teamEvents.filter(e => e.archived);
    case 'all':
    default:
      return teamEvents;
  }
}

/**
 * Search team events by title, description, or category
 */
export function searchTeamEvents(
  team: Team,
  allEvents: Event[],
  query: string
): Event[] {
  const teamEvents = getTeamEvents(team, allEvents);
  const lowerQuery = query.toLowerCase().trim();
  
  if (!lowerQuery) return teamEvents;
  
  return teamEvents.filter(event => 
    event.title.toLowerCase().includes(lowerQuery) ||
    event.description?.toLowerCase().includes(lowerQuery) ||
    event.category?.toLowerCase().includes(lowerQuery)
  );
}

// ============================================================================
// TEAM EVENT ANALYTICS
// ============================================================================

/**
 * Get event completion rate by time period
 */
export function getTeamEventCompletionByPeriod(
  team: Team,
  allEvents: Event[],
  periodDays: number = 7
): { completed: number; total: number; rate: number } {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - periodDays);
  
  const recentEvents = getTeamEvents(team, allEvents).filter(e => 
    new Date(e.createdAt) >= cutoffDate
  );
  
  const completed = recentEvents.filter(e => e.completed).length;
  const total = recentEvents.length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, rate };
}

/**
 * Get team's most active event creators
 */
export function getTopTeamEventCreators(
  team: Team,
  allEvents: Event[],
  limit: number = 5
): { memberId: string; memberName: string; eventCount: number }[] {
  const teamEvents = getTeamEvents(team, allEvents);
  const allMembers = [team.admin, ...team.members];
  
  const creatorCounts = allMembers.map(member => {
    const eventCount = teamEvents.filter(e => 
      e.createdBy === member.id || e.primaryEventCreator === member.id
    ).length;
    
    return {
      memberId: member.id,
      memberName: member.name,
      eventCount,
    };
  });
  
  return creatorCounts
    .sort((a, b) => b.eventCount - a.eventCount)
    .slice(0, limit);
}

// ============================================================================
// EXPORT ALL UTILITIES
// ============================================================================

export const teamEventUtils = {
  // Filtering
  getTeamEvents,
  getTeamPrimaryEvents,
  getTeamChildEvents,
  getActiveTeamEvents,
  getCompletedTeamEvents,
  getArchivedTeamEvents,
  
  // Hierarchy
  getTeamEventHierarchy,
  getAllTeamEventHierarchies,
  
  // Tasks
  getTeamEventTasks,
  getTeamStandaloneTasks,
  
  // Statistics
  getTeamEventStats,
  getTeamMemberEventContribution,
  getAllTeamMemberEventContributions,
  
  // Permissions
  canTeamMemberViewEvent,
  canTeamMemberEditEvent,
  canTeamMemberDeleteEvent,
  getTeamMemberEventPermissions,
  
  // Management
  createTeamPrimaryEvent,
  addTeamMemberToEvent,
  removeTeamMemberFromEvent,
  
  // Filtering & Search
  filterTeamEvents,
  searchTeamEvents,
  
  // Analytics
  getTeamEventCompletionByPeriod,
  getTopTeamEventCreators,
};
