/**
 * TEAM HELPERS
 * Utility functions for filtering and aggregating team-related data
 * Connects teams to tasks, goals, events, energy, and resonance data
 */

import { Task } from '../types/task';
import { Goal } from './enhanced-goals-data';

// Team member interface (used in TeamCollaborationPage)
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'editor' | 'viewer';
  energy: number;
  animation: 'glow' | 'heartbeat' | 'pulse' | 'bounce';
  status?: 'online' | 'away' | 'offline';
  muted?: boolean;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  admin: TeamMember;
  members: TeamMember[];
  projectCount: number;
  tasksCompleted: number;
  totalTasks: number;
}

// ============================================================================
// TASK FILTERING
// ============================================================================

/**
 * Get all tasks that involve any team member
 * A task belongs to a team if ANY team member is a collaborator
 */
export function getTeamTasks(team: Team, allTasks: Task[]): Task[] {
  const teamMemberIds = new Set([
    team.admin.id,
    ...team.members.map(m => m.id)
  ]);

  return allTasks.filter(task => {
    // Check if any collaborator is a team member
    return task.collaborators?.some(collab => 
      teamMemberIds.has(collab.id || collab.name) // Handle both id and name fallback
    );
  });
}

/**
 * Get active (incomplete) tasks for a team
 */
export function getActiveTeamTasks(team: Team, allTasks: Task[]): Task[] {
  return getTeamTasks(team, allTasks).filter(task => !task.completed);
}

/**
 * Get completed tasks for a team
 */
export function getCompletedTeamTasks(team: Team, allTasks: Task[]): Task[] {
  return getTeamTasks(team, allTasks).filter(task => task.completed);
}

/**
 * Get tasks due today for a team
 */
export function getTeamTasksDueToday(team: Team, allTasks: Task[]): Task[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getActiveTeamTasks(team, allTasks).filter(task => {
    if (!task.dueDate) return false;
    
    // Handle string dates like "Today" or actual date strings
    if (task.dueDate.toLowerCase().includes('today')) return true;
    
    try {
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    } catch {
      return false;
    }
  });
}

// ============================================================================
// GOAL FILTERING
// ============================================================================

/**
 * Get all goals that involve any team member
 */
export function getTeamGoals(team: Team, allGoals: any[]): any[] {
  const teamMemberIds = new Set([
    team.admin.id,
    ...team.members.map(m => m.id)
  ]);

  return allGoals.filter(goal => {
    // Check if any collaborator is a team member
    if (goal.collaborators) {
      return goal.collaborators.some((collab: any) => 
        teamMemberIds.has(collab.id || collab.name)
      );
    }
    
    // If no collaborators, check owner
    if (goal.owner) {
      return teamMemberIds.has(goal.owner.id || goal.owner);
    }
    
    return false;
  });
}

/**
 * Get active goals for a team
 */
export function getActiveTeamGoals(team: Team, allGoals: any[]): any[] {
  return getTeamGoals(team, allGoals).filter(goal => 
    goal.status !== 'completed' && goal.status !== 'archived'
  );
}

/**
 * Calculate team goal completion rate
 */
export function getTeamGoalCompletionRate(team: Team, allGoals: any[]): number {
  const teamGoals = getTeamGoals(team, allGoals);
  if (teamGoals.length === 0) return 0;
  
  const completedGoals = teamGoals.filter(goal => goal.status === 'completed');
  return Math.round((completedGoals.length / teamGoals.length) * 100);
}

// ============================================================================
// INDIVIDUAL STATS
// ============================================================================

/**
 * Get user's contribution to a specific team
 */
export function getUserTeamContribution(
  userId: string,
  team: Team,
  allTasks: Task[],
  allGoals: any[]
) {
  const teamTasks = getTeamTasks(team, allTasks);
  const teamGoals = getTeamGoals(team, allGoals);

  // Tasks where user is involved
  const userTasks = teamTasks.filter(task =>
    task.collaborators?.some(c => (c.id || c.name) === userId)
  );

  // Completed tasks by user
  const completedTasks = userTasks.filter(task => task.completed);

  // Goals where user is involved
  const userGoals = teamGoals.filter(goal =>
    goal.collaborators?.some((c: any) => (c.id || c.name) === userId) ||
    goal.owner?.id === userId ||
    goal.owner === userId
  );

  // Completed goals by user
  const completedGoals = userGoals.filter(goal => goal.status === 'completed');

  // User's role in team
  const userMember = team.members.find(m => m.id === userId);
  const role = team.admin.id === userId ? 'admin' : (userMember?.role || 'viewer');

  // Contribution percentage (tasks completed by user / team total)
  const contributionPercentage = team.tasksCompleted > 0
    ? Math.round((completedTasks.length / team.tasksCompleted) * 100)
    : 0;

  return {
    team,
    role,
    tasksActive: userTasks.filter(t => !t.completed).length,
    tasksCompleted: completedTasks.length,
    goalsActive: userGoals.filter((g: any) => g.status !== 'completed').length,
    goalsCompleted: completedGoals.length,
    contributionPercentage,
  };
}

/**
 * Get user's contributions across all teams
 */
export function getUserAllTeamsContributions(
  userId: string,
  teams: Team[],
  allTasks: Task[],
  allGoals: any[]
) {
  return teams
    .filter(team => 
      team.admin.id === userId || 
      team.members.some(m => m.id === userId)
    )
    .map(team => getUserTeamContribution(userId, team, allTasks, allGoals))
    .sort((a, b) => b.contributionPercentage - a.contributionPercentage); // Sort by contribution
}

// ============================================================================
// TEAM ANALYTICS
// ============================================================================

/**
 * Calculate team workload distribution
 */
export function getTeamWorkloadDistribution(team: Team, allTasks: Task[]) {
  const teamTasks = getActiveTeamTasks(team, allTasks);
  const allMembers = [team.admin, ...team.members];

  return allMembers.map(member => {
    const memberTasks = teamTasks.filter(task =>
      task.collaborators?.some(c => (c.id || c.name) === member.id)
    );

    // Estimate hours (rough calculation: 2h per task average)
    const estimatedHours = memberTasks.length * 2;
    const utilization = Math.min((estimatedHours / 40) * 100, 120); // Cap at 120%

    return {
      name: member.name,
      tasks: memberTasks.length,
      hours: estimatedHours,
      utilization: Math.round(utilization),
    };
  });
}

/**
 * Get team activity summary
 */
export function getTeamActivitySummary(team: Team, allTasks: Task[], allGoals: any[]) {
  const teamTasks = getTeamTasks(team, allTasks);
  const teamGoals = getTeamGoals(team, allGoals);
  
  const activeTasks = teamTasks.filter(t => !t.completed).length;
  const completedTasks = teamTasks.filter(t => t.completed).length;
  const activeGoals = teamGoals.filter((g: any) => g.status !== 'completed').length;
  const completedGoals = teamGoals.filter((g: any) => g.status === 'completed').length;

  return {
    tasks: {
      active: activeTasks,
      completed: completedTasks,
      total: teamTasks.length,
      completionRate: teamTasks.length > 0 
        ? Math.round((completedTasks / teamTasks.length) * 100)
        : 0,
    },
    goals: {
      active: activeGoals,
      completed: completedGoals,
      total: teamGoals.length,
      completionRate: teamGoals.length > 0
        ? Math.round((completedGoals / teamGoals.length) * 100)
        : 0,
    },
    members: {
      total: team.members.length + 1, // +1 for admin
      active: team.members.filter(m => m.status === 'online').length + (team.admin.status === 'online' ? 1 : 0),
    },
  };
}

/**
 * Get priority breakdown for team tasks
 */
export function getTeamTasksPriorityBreakdown(team: Team, allTasks: Task[]) {
  const teamTasks = getActiveTeamTasks(team, allTasks);
  
  return {
    urgent: teamTasks.filter(t => t.priority === 'urgent').length,
    high: teamTasks.filter(t => t.priority === 'high').length,
    medium: teamTasks.filter(t => t.priority === 'medium').length,
    low: teamTasks.filter(t => t.priority === 'low').length,
  };
}
