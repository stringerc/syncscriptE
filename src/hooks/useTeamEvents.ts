/**
 * TEAM EVENTS HOOK
 * 
 * React hook for managing team events with hierarchical structure,
 * permissions, and task associations.
 * 
 * Provides all operations needed for team event management in a single hook.
 */

import { useState, useMemo, useCallback } from 'react';
import { Event, Task } from '../utils/event-task-types';
import { Team } from '../utils/team-helpers';
import {
  TeamEventStats,
  TeamEventHierarchy,
  TeamMemberEventContribution,
  TeamEventFilter,
  getTeamEvents,
  getTeamPrimaryEvents,
  getActiveTeamEvents,
  getTeamEventHierarchy,
  getAllTeamEventHierarchies,
  getTeamEventTasks,
  getTeamStandaloneTasks,
  getTeamEventStats,
  getTeamMemberEventContribution,
  getAllTeamMemberEventContributions,
  canTeamMemberViewEvent,
  canTeamMemberEditEvent,
  canTeamMemberDeleteEvent,
  filterTeamEvents,
  searchTeamEvents,
  createTeamPrimaryEvent,
  addTeamMemberToEvent,
  removeTeamMemberFromEvent,
} from '../utils/team-event-integration';

export interface UseTeamEventsOptions {
  team: Team;
  allEvents: Event[];
  allTasks: Task[];
  currentUserId?: string;
  onEventsChange?: (events: Event[]) => void;
  onTasksChange?: (tasks: Task[]) => void;
}

export function useTeamEvents({
  team,
  allEvents,
  allTasks,
  currentUserId,
  onEventsChange,
  onTasksChange,
}: UseTeamEventsOptions) {
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState<TeamEventFilter>('all');

  // ============================================================================
  // MEMOIZED DATA
  // ============================================================================

  /**
   * Get all team events
   */
  const teamEvents = useMemo(() => 
    getTeamEvents(team, allEvents),
    [team, allEvents]
  );

  /**
   * Get primary events for team
   */
  const primaryEvents = useMemo(() => 
    getTeamPrimaryEvents(team, allEvents),
    [team, allEvents]
  );

  /**
   * Get active events
   */
  const activeEvents = useMemo(() => 
    getActiveTeamEvents(team, allEvents),
    [team, allEvents]
  );

  /**
   * Get team event statistics
   */
  const stats = useMemo(() => 
    getTeamEventStats(team, allEvents, allTasks),
    [team, allEvents, allTasks]
  );

  /**
   * Get all event hierarchies
   */
  const eventHierarchies = useMemo(() => 
    getAllTeamEventHierarchies(team, allEvents, allTasks),
    [team, allEvents, allTasks]
  );

  /**
   * Get team member contributions
   */
  const memberContributions = useMemo(() => 
    getAllTeamMemberEventContributions(team, allEvents, allTasks),
    [team, allEvents, allTasks]
  );

  /**
   * Get filtered events
   */
  const filteredEvents = useMemo(() => {
    let events = filterTeamEvents(team, allEvents, eventFilter);
    
    if (searchQuery.trim()) {
      events = searchTeamEvents(team, events, searchQuery);
    }
    
    return events;
  }, [team, allEvents, eventFilter, searchQuery]);

  /**
   * Get team event tasks
   */
  const eventTasks = useMemo(() => 
    getTeamEventTasks(team, allEvents, allTasks),
    [team, allEvents, allTasks]
  );

  /**
   * Get standalone tasks (not in events)
   */
  const standaloneTasks = useMemo(() => 
    getTeamStandaloneTasks(team, allEvents, allTasks),
    [team, allEvents, allTasks]
  );

  // ============================================================================
  // EVENT HIERARCHY OPERATIONS
  // ============================================================================

  /**
   * Get hierarchy for a specific primary event
   */
  const getHierarchy = useCallback((primaryEventId: string): TeamEventHierarchy | null => {
    return getTeamEventHierarchy(primaryEventId, team, allEvents, allTasks);
  }, [team, allEvents, allTasks]);

  // ============================================================================
  // PERMISSION CHECKS
  // ============================================================================

  /**
   * Check if current user can view an event
   */
  const canViewEvent = useCallback((eventId: string): boolean => {
    if (!currentUserId) return false;
    return canTeamMemberViewEvent(currentUserId, eventId, team, allEvents);
  }, [currentUserId, team, allEvents]);

  /**
   * Check if current user can edit an event
   */
  const canEditEvent = useCallback((eventId: string): boolean => {
    if (!currentUserId) return false;
    return canTeamMemberEditEvent(currentUserId, eventId, team, allEvents);
  }, [currentUserId, team, allEvents]);

  /**
   * Check if current user can delete an event
   */
  const canDeleteEvent = useCallback((eventId: string): boolean => {
    if (!currentUserId) return false;
    return canTeamMemberDeleteEvent(currentUserId, eventId, team, allEvents);
  }, [currentUserId, team, allEvents]);

  // ============================================================================
  // EVENT CREATION & MANAGEMENT
  // ============================================================================

  /**
   * Create a new primary event for the team
   */
  const createPrimaryEvent = useCallback((eventData: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    color?: string;
    category?: string;
  }): Event | null => {
    if (!currentUserId) return null;
    
    const newEvent = createTeamPrimaryEvent(team, currentUserId, eventData);
    
    if (onEventsChange) {
      onEventsChange([...allEvents, newEvent]);
    }
    
    return newEvent;
  }, [team, currentUserId, allEvents, onEventsChange]);

  /**
   * Add a member to an event
   */
  const addMemberToEvent = useCallback((
    eventId: string,
    memberId: string
  ): boolean => {
    const event = allEvents.find(e => e.id === eventId);
    if (!event) return false;
    
    const member = [...team.members, team.admin].find(m => m.id === memberId);
    if (!member) return false;
    
    if (!canEditEvent(eventId)) return false;
    
    const updatedEvent = addTeamMemberToEvent(event, member);
    
    if (onEventsChange) {
      const updatedEvents = allEvents.map(e => 
        e.id === eventId ? updatedEvent : e
      );
      onEventsChange(updatedEvents);
    }
    
    return true;
  }, [allEvents, team, canEditEvent, onEventsChange]);

  /**
   * Remove a member from an event
   */
  const removeMemberFromEvent = useCallback((
    eventId: string,
    memberId: string
  ): boolean => {
    const event = allEvents.find(e => e.id === eventId);
    if (!event) return false;
    
    if (!canEditEvent(eventId)) return false;
    
    const updatedEvent = removeTeamMemberFromEvent(event, memberId);
    
    if (onEventsChange) {
      const updatedEvents = allEvents.map(e => 
        e.id === eventId ? updatedEvent : e
      );
      onEventsChange(updatedEvents);
    }
    
    return true;
  }, [allEvents, canEditEvent, onEventsChange]);

  /**
   * Delete an event (archive it)
   */
  const deleteEvent = useCallback((eventId: string): boolean => {
    if (!canDeleteEvent(eventId)) return false;
    
    const event = allEvents.find(e => e.id === eventId);
    if (!event) return false;
    
    // Archive the event instead of hard delete
    const archivedEvent: Event = {
      ...event,
      archived: true,
      archivedAt: new Date(),
    };
    
    if (onEventsChange) {
      const updatedEvents = allEvents.map(e => 
        e.id === eventId ? archivedEvent : e
      );
      onEventsChange(updatedEvents);
    }
    
    return true;
  }, [allEvents, canDeleteEvent, onEventsChange]);

  // ============================================================================
  // MEMBER CONTRIBUTIONS
  // ============================================================================

  /**
   * Get a specific member's contribution
   */
  const getMemberContribution = useCallback((
    memberId: string
  ): TeamMemberEventContribution | undefined => {
    return memberContributions.find(c => c.memberId === memberId);
  }, [memberContributions]);

  /**
   * Get current user's contribution
   */
  const myContribution = useMemo(() => {
    if (!currentUserId) return null;
    return getTeamMemberEventContribution(currentUserId, team, allEvents, allTasks);
  }, [currentUserId, team, allEvents, allTasks]);

  // ============================================================================
  // FILTER & SEARCH
  // ============================================================================

  /**
   * Update event filter
   */
  const setFilter = useCallback((filter: TeamEventFilter) => {
    setEventFilter(filter);
  }, []);

  /**
   * Update search query
   */
  const setSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  /**
   * Clear filters
   */
  const clearFilters = useCallback(() => {
    setEventFilter('all');
    setSearchQuery('');
  }, []);

  /**
   * Get filter counts
   */
  const filterCounts = useMemo(() => ({
    all: teamEvents.length,
    primary: primaryEvents.length,
    child: teamEvents.length - primaryEvents.length,
    active: activeEvents.length,
    completed: teamEvents.filter(e => e.completed && !e.archived).length,
    archived: teamEvents.filter(e => e.archived).length,
  }), [teamEvents, primaryEvents, activeEvents]);

  // ============================================================================
  // RETURN API
  // ============================================================================

  return {
    // Data
    teamEvents,
    primaryEvents,
    activeEvents,
    filteredEvents,
    eventHierarchies,
    stats,
    
    // Tasks
    eventTasks,
    standaloneTasks,
    
    // Contributions
    memberContributions,
    myContribution,
    getMemberContribution,
    
    // Hierarchy
    getHierarchy,
    
    // Permissions
    canViewEvent,
    canEditEvent,
    canDeleteEvent,
    
    // Management
    createPrimaryEvent,
    addMemberToEvent,
    removeMemberFromEvent,
    deleteEvent,
    
    // Filtering
    eventFilter,
    searchQuery,
    setFilter,
    setSearch,
    clearFilters,
    filterCounts,
  };
}
