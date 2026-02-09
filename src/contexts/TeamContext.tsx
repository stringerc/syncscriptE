import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Team,
  TeamMember,
  CreateTeamInput,
  UpdateTeamInput,
  InviteMemberInput,
  UpdateMemberInput,
  TeamActivity,
  DEFAULT_TEAM_SETTINGS,
  DEFAULT_PERMISSIONS,
} from '../types/team';
import { Event } from '../utils/event-task-types';
import { toast } from 'sonner@2.0.3';

/**
 * TeamContext
 * 
 * Manages team state, CRUD operations, and team-based features.
 * Integrates with energy system and hierarchical events.
 * Prepares for Scripts & Templates marketplace.
 * 
 * Features:
 * - Team creation and management
 * - Member invitations and permissions
 * - Team energy tracking
 * - Activity feed
 * - LocalStorage persistence
 * - PHASE 2.2: Event assignment and team collaboration
 */

interface TeamContextValue {
  // State
  teams: Team[];
  activeTeamId: string | null;
  activeTeam: Team | null;
  
  // Team CRUD
  createTeam: (input: CreateTeamInput) => Promise<Team>;
  updateTeam: (teamId: string, input: UpdateTeamInput) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  setActiveTeam: (teamId: string | null) => void;
  
  // Member Management
  inviteMember: (input: InviteMemberInput) => Promise<void>;
  removeMember: (teamId: string, userId: string) => Promise<void>;
  updateMember: (input: UpdateMemberInput) => Promise<void>;
  
  // Team Energy
  addTeamEnergy: (teamId: string, userId: string, amount: number, source: string) => void;
  getTeamEnergyStats: (teamId: string) => Team['energyStats'] | null;
  
  // Activity
  getTeamActivity: (teamId: string, limit?: number) => TeamActivity[];
  addTeamActivity: (activity: Omit<TeamActivity, 'id' | 'createdAt'>) => void;
  
  // PHASE 2.2: Event Integration
  assignTeamToEvent: (teamId: string, eventId: string, allEvents: Event[]) => Event[];
  unassignTeamFromEvent: (eventId: string, allEvents: Event[]) => Event[];
  getTeamEvents: (teamId: string, allEvents: Event[]) => Event[];
  trackEventActivity: (teamId: string, eventId: string, activityType: TeamActivity['type'], description: string) => void;
  incrementTeamEventStats: (teamId: string, statType: 'activeEvents' | 'completedEvents') => void;
  
  // PHASE 1.1: Task Integration
  getAvailableTeamMembers: (teamId: string) => TeamMember[];
  notifyTaskAssignment: (teamId: string, taskId: string, taskTitle: string, assignedUserIds: string[]) => void;
  
  // Helpers
  getUserTeams: (userId: string) => Team[];
  getTeamMember: (teamId: string, userId: string) => TeamMember | undefined;
  canUserEdit: (teamId: string, userId: string) => boolean;
}

const TeamContext = createContext<TeamContextValue | undefined>(undefined);

const STORAGE_KEY = 'syncscript_teams_v1';
const ACTIVITY_STORAGE_KEY = 'syncscript_team_activity_v1';
const CURRENT_USER_ID = 'user-1'; // Mock current user

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [teamActivities, setTeamActivities] = useState<TeamActivity[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedActivity = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    
    if (stored) {
      try {
        setTeams(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse teams from localStorage:', e);
      }
    }
    
    if (storedActivity) {
      try {
        setTeamActivities(JSON.parse(storedActivity));
      } catch (e) {
        console.error('Failed to parse team activity from localStorage:', e);
      }
    }
  }, []);

  // Save to localStorage whenever teams change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
  }, [teams]);

  // Save activity to localStorage
  useEffect(() => {
    localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(teamActivities));
  }, [teamActivities]);

  // Get active team
  const activeTeam = teams.find(t => t.id === activeTeamId) || null;

  // ==================== TEAM CRUD ====================

  const createTeam = async (input: CreateTeamInput): Promise<Team> => {
    const now = new Date().toISOString();
    const teamId = `team-${Date.now()}`;

    const newTeam: Team = {
      id: teamId,
      name: input.name,
      description: input.description,
      color: input.color,
      icon: input.icon,
      createdBy: CURRENT_USER_ID,
      createdAt: now,
      updatedAt: now,
      members: [
        {
          userId: CURRENT_USER_ID,
          name: 'You',
          email: 'you@syncscript.com',
          image: '/avatars/default-user.png',
          fallback: 'YO',
          role: 'owner',
          permissions: DEFAULT_PERMISSIONS.owner,
          joinedAt: now,
          stats: {
            tasksCompleted: 0,
            milestonesCompleted: 0,
            stepsCompleted: 0,
            goalsCompleted: 0,
            energyContributed: 0,
            lastActive: now,
          },
          status: 'online',
        },
      ],
      memberCount: 1,
      settings: {
        ...DEFAULT_TEAM_SETTINGS,
        ...input.settings,
      },
      stats: {
        activeEvents: 0,
        completedEvents: 0,
        templatesCreated: 0,
        templatesShared: 0,
      },
      energyStats: {
        totalEnergyEarned: 0,
        currentDayEnergy: 0,
        averageDailyEnergy: 0,
        topContributorId: CURRENT_USER_ID,
        energyTrend: 'stable',
        energyFromTasks: 0,
        energyFromMilestones: 0,
        energyFromSteps: 0,
        energyFromGoals: 0,
        bonusEnergyFromMultiplier: 0,
      },
      tags: input.tags || [],
    };

    setTeams(prev => [...prev, newTeam]);
    
    // Add activity
    addTeamActivity({
      teamId: teamId,
      userId: CURRENT_USER_ID,
      userName: 'You',
      userImage: '/avatars/default-user.png',
      type: 'member_joined',
      description: `created the team "${input.name}"`,
    });

    toast.success(`Team "${input.name}" created!`, {
      description: 'You can now invite members and start collaborating.',
    });

    return newTeam;
  };

  const updateTeam = async (teamId: string, input: UpdateTeamInput): Promise<void> => {
    setTeams(prev => prev.map(team => {
      if (team.id !== teamId) return team;

      return {
        ...team,
        ...input,
        settings: input.settings ? { ...team.settings, ...input.settings } : team.settings,
        updatedAt: new Date().toISOString(),
      };
    }));

    toast.success('Team updated successfully!');
  };

  const deleteTeam = async (teamId: string): Promise<void> => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    setTeams(prev => prev.filter(t => t.id !== teamId));
    
    if (activeTeamId === teamId) {
      setActiveTeamId(null);
    }

    toast.success(`Team "${team.name}" deleted`);
  };

  // ==================== MEMBER MANAGEMENT ====================

  const inviteMember = async (input: InviteMemberInput): Promise<void> => {
    const team = teams.find(t => t.id === input.teamId);
    if (!team) {
      toast.error('Team not found');
      return;
    }

    // Check if email already in team
    if (team.members.some(m => m.email === input.email)) {
      toast.error('User is already a member of this team');
      return;
    }

    // Mock: Create a new member (in real app, would send invitation email)
    const now = new Date().toISOString();
    const newMember: TeamMember = {
      userId: `user-${Date.now()}`,
      name: input.email.split('@')[0],
      email: input.email,
      image: '/avatars/default-user.png',
      fallback: input.email.substring(0, 2).toUpperCase(),
      role: input.role,
      permissions: input.permissions 
        ? { ...DEFAULT_PERMISSIONS[input.role], ...input.permissions }
        : DEFAULT_PERMISSIONS[input.role],
      joinedAt: now,
      stats: {
        tasksCompleted: 0,
        milestonesCompleted: 0,
        stepsCompleted: 0,
        goalsCompleted: 0,
        energyContributed: 0,
        lastActive: now,
      },
      status: 'offline',
    };

    setTeams(prev => prev.map(t => {
      if (t.id !== input.teamId) return t;
      
      return {
        ...t,
        members: [...t.members, newMember],
        memberCount: t.memberCount + 1,
        updatedAt: now,
      };
    }));

    addTeamActivity({
      teamId: input.teamId,
      userId: newMember.userId,
      userName: newMember.name,
      userImage: newMember.image,
      type: 'member_joined',
      description: `joined the team as ${input.role}`,
    });

    toast.success(`Invitation sent to ${input.email}!`);
  };

  const removeMember = async (teamId: string, userId: string): Promise<void> => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    const member = team.members.find(m => m.userId === userId);
    if (!member) return;

    // Can't remove owner
    if (member.role === 'owner') {
      toast.error('Cannot remove team owner');
      return;
    }

    setTeams(prev => prev.map(t => {
      if (t.id !== teamId) return t;
      
      return {
        ...t,
        members: t.members.filter(m => m.userId !== userId),
        memberCount: t.memberCount - 1,
        updatedAt: new Date().toISOString(),
      };
    }));

    addTeamActivity({
      teamId: teamId,
      userId: CURRENT_USER_ID,
      userName: 'You',
      userImage: '/avatars/default-user.png',
      type: 'member_left',
      description: `removed ${member.name} from the team`,
    });

    toast.success(`${member.name} removed from team`);
  };

  const updateMember = async (input: UpdateMemberInput): Promise<void> => {
    setTeams(prev => prev.map(team => {
      if (team.id !== input.teamId) return team;

      return {
        ...team,
        members: team.members.map(member => {
          if (member.userId !== input.userId) return member;

          return {
            ...member,
            role: input.role || member.role,
            permissions: input.permissions 
              ? { ...member.permissions, ...input.permissions }
              : member.permissions,
          };
        }),
        updatedAt: new Date().toISOString(),
      };
    }));

    if (input.role) {
      const team = teams.find(t => t.id === input.teamId);
      const member = team?.members.find(m => m.userId === input.userId);
      
      if (team && member) {
        addTeamActivity({
          teamId: input.teamId,
          userId: CURRENT_USER_ID,
          userName: 'You',
          userImage: '/avatars/default-user.png',
          type: 'role_changed',
          description: `changed ${member.name}'s role to ${input.role}`,
        });
      }
    }

    toast.success('Member permissions updated');
  };

  // ==================== TEAM ENERGY ====================

  const addTeamEnergy = (teamId: string, userId: string, amount: number, source: string) => {
    setTeams(prev => prev.map(team => {
      if (team.id !== teamId) return team;

      const member = team.members.find(m => m.userId === userId);
      if (!member) return team;

      // Calculate bonus from team multiplier
      const bonusAmount = Math.floor(amount * (team.settings.energyMultiplier - 1));
      const totalAmount = amount + bonusAmount;

      // Update team energy stats
      const updatedEnergyStats = {
        ...team.energyStats,
        totalEnergyEarned: team.energyStats.totalEnergyEarned + totalAmount,
        currentDayEnergy: team.energyStats.currentDayEnergy + totalAmount,
        bonusEnergyFromMultiplier: team.energyStats.bonusEnergyFromMultiplier + bonusAmount,
      };

      // Update energy by source
      if (source.includes('task')) {
        updatedEnergyStats.energyFromTasks += totalAmount;
      } else if (source.includes('milestone')) {
        updatedEnergyStats.energyFromMilestones += totalAmount;
      } else if (source.includes('step')) {
        updatedEnergyStats.energyFromSteps += totalAmount;
      } else if (source.includes('goal')) {
        updatedEnergyStats.energyFromGoals += totalAmount;
      }

      // Update member stats
      const updatedMembers = team.members.map(m => {
        if (m.userId !== userId) return m;
        
        return {
          ...m,
          stats: {
            ...m.stats,
            energyContributed: m.stats.energyContributed + totalAmount,
            lastActive: new Date().toISOString(),
          },
        };
      });

      // Determine top contributor
      const topContributor = updatedMembers.reduce((top, m) => 
        m.stats.energyContributed > top.stats.energyContributed ? m : top
      );

      return {
        ...team,
        members: updatedMembers,
        energyStats: {
          ...updatedEnergyStats,
          topContributorId: topContributor.userId,
        },
        updatedAt: new Date().toISOString(),
      };
    }));

    // Show bonus notification if multiplier active
    const team = teams.find(t => t.id === teamId);
    if (team && team.settings.energyMultiplier > 1) {
      const bonusAmount = Math.floor(amount * (team.settings.energyMultiplier - 1));
      if (bonusAmount > 0) {
        toast.success(`Team Bonus: +${bonusAmount} energy!`, {
          description: `${team.settings.energyMultiplier}x multiplier active`,
        });
      }
    }
  };

  const getTeamEnergyStats = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team?.energyStats || null;
  };

  // ==================== ACTIVITY ====================

  const addTeamActivity = (activity: Omit<TeamActivity, 'id' | 'createdAt'>) => {
    const newActivity: TeamActivity = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString(),
    };

    setTeamActivities(prev => [newActivity, ...prev].slice(0, 1000)); // Keep last 1000 activities
  };

  const getTeamActivity = (teamId: string, limit = 50): TeamActivity[] => {
    return teamActivities
      .filter(a => a.teamId === teamId)
      .slice(0, limit);
  };

  // ==================== PHASE 2.2: EVENT INTEGRATION ====================

  /**
   * Assign a team to an event
   * Updates the event's teamId and adds all team members to the event
   */
  const assignTeamToEvent = (teamId: string, eventId: string, allEvents: Event[]): Event[] => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return allEvents;

    return allEvents.map(event => {
      if (event.id !== eventId) return event;

      // Convert team members to event team members format
      const teamMembersForEvent = team.members.map(member => ({
        id: member.userId,
        name: member.name,
        email: member.email,
        avatar: member.image,
        role: member.role === 'owner' || member.role === 'admin' ? 'admin' : 'member' as 'admin' | 'member' | 'viewer',
      }));

      return {
        ...event,
        teamId: teamId,
        teamMembers: teamMembersForEvent,
        updatedAt: new Date(),
      };
    });
  };

  /**
   * Unassign team from an event
   * Removes the teamId but keeps team members in the event
   */
  const unassignTeamFromEvent = (eventId: string, allEvents: Event[]): Event[] => {
    return allEvents.map(event => {
      if (event.id !== eventId) return event;

      return {
        ...event,
        teamId: undefined,
        updatedAt: new Date(),
      };
    });
  };

  /**
   * Get all events for a specific team
   * Returns events where teamId matches
   */
  const getTeamEvents = (teamId: string, allEvents: Event[]): Event[] => {
    return allEvents.filter(event => event.teamId === teamId);
  };

  const trackEventActivity = (teamId: string, eventId: string, activityType: TeamActivity['type'], description: string) => {
    addTeamActivity({
      teamId: teamId,
      userId: CURRENT_USER_ID,
      userName: 'You',
      userImage: '/avatars/default-user.png',
      type: activityType,
      description: description,
    });
  };

  const incrementTeamEventStats = (teamId: string, statType: 'activeEvents' | 'completedEvents') => {
    setTeams(prev => prev.map(team => {
      if (team.id !== teamId) return team;

      return {
        ...team,
        stats: {
          ...team.stats,
          [statType]: team.stats[statType] + 1,
        },
        updatedAt: new Date().toISOString(),
      };
    }));
  };

  // ==================== PHASE 1.1: TASK INTEGRATION ====================

  const getAvailableTeamMembers = (teamId: string): TeamMember[] => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return [];
    return team.members;
  };

  const notifyTaskAssignment = (teamId: string, taskId: string, taskTitle: string, assignedUserIds: string[]): void => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    
    assignedUserIds.forEach(userId => {
      const member = team.members.find(m => m.userId === userId);
      if (member) {
        // Add activity for each assignment
        addTeamActivity({
          teamId,
          userId: CURRENT_USER_ID,
          userName: 'You',
          userImage: '',
          type: 'task_updated',
          description: `assigned task "${taskTitle}" to ${member.name}`,
        });
        
        // In a real implementation, this would trigger a notification
        console.log(`📬 Notified ${member.name} about task assignment: ${taskTitle}`);
      }
    });
  };

  // ==================== HELPERS ====================

  const getUserTeams = (userId: string): Team[] => {
    return teams.filter(team => team.members.some(m => m.userId === userId));
  };

  const getTeamMember = (teamId: string, userId: string): TeamMember | undefined => {
    const team = teams.find(t => t.id === teamId);
    return team?.members.find(m => m.userId === userId);
  };

  const canUserEdit = (teamId: string, userId: string): boolean => {
    const member = getTeamMember(teamId, userId);
    if (!member) return false;
    return member.permissions.canEditEvents || member.role === 'owner' || member.role === 'admin';
  };

  const value: TeamContextValue = {
    teams,
    activeTeamId,
    activeTeam,
    createTeam,
    updateTeam,
    deleteTeam,
    setActiveTeam: setActiveTeamId,
    inviteMember,
    removeMember,
    updateMember,
    addTeamEnergy,
    getTeamEnergyStats,
    getTeamActivity,
    addTeamActivity,
    assignTeamToEvent,
    unassignTeamFromEvent,
    getTeamEvents,
    trackEventActivity,
    incrementTeamEventStats,
    getAvailableTeamMembers,
    notifyTaskAssignment,
    getUserTeams,
    getTeamMember,
    canUserEdit,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}