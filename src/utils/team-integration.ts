/**
 * Team Integration System
 * 
 * Centralizes all team-related data integrations across:
 * - Calendar Events (shared team events)
 * - Tasks & Goals (team assignments)
 * - Energy Management (team energy levels)
 * - Resonance Engine (team harmony scores)
 * - Gamification (team achievements)
 * 
 * This is the foundation for system-wide team collaboration features.
 */

import { Event } from './event-task-types';
import { Task } from '../types/task';
import { Goal } from '../types/goal';

// ========================================
// TEAM DATA TYPES
// ========================================

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
  // Integration fields
  totalTasks?: number;
  completedTasks?: number;
  totalEvents?: number;
  resonanceScore?: number;
  points?: number; // Gamification
  achievements?: string[]; // Gamification
}

export interface Team {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  admin: TeamMember;
  members: TeamMember[];
  // Integration fields
  projectCount: number;
  tasksCompleted: number;
  totalTasks: number;
  totalGoals?: number;
  completedGoals?: number;
  totalEvents?: number;
  avgEnergyLevel?: number;
  teamResonance?: number; // 0-100 harmony score
  totalPoints?: number; // Gamification
  teamLevel?: number; // Gamification
}

export interface TeamActivity {
  type: 'task_completed' | 'goal_achieved' | 'event_created' | 'member_joined' | 'achievement_unlocked';
  memberId: string;
  memberName: string;
  timestamp: Date;
  description: string;
  points?: number; // Gamification
}

export interface TeamStatistics {
  totalMembers: number;
  activeTasks: number;
  completedTasks: number;
  overdueTasks: number;
  activeGoals: number;
  completedGoals: number;
  upcomingEvents: number;
  avgEnergyLevel: number;
  teamResonance: number;
  productivityScore: number;
  collaborationScore: number;
  // Gamification
  totalPoints: number;
  teamLevel: number;
  nextLevelProgress: number;
  recentAchievements: string[];
}

// ========================================
// CALENDAR EVENTS INTEGRATION
// ========================================

/**
 * Get all events that involve team members
 */
export function getTeamEvents(team: Team, allEvents: Event[]): Event[] {
  const teamMemberIds = [team.admin.id, ...team.members.map(m => m.id)];
  
  return allEvents.filter(event => {
    // Event is team-related if any team member is involved
    const eventMemberIds = event.teamMembers?.map(m => m.id) || [];
    return eventMemberIds.some(id => teamMemberIds.includes(id));
  });
}

/**
 * Get upcoming team events (next 7 days)
 */
export function getUpcomingTeamEvents(team: Team, allEvents: Event[]): Event[] {
  const teamEvents = getTeamEvents(team, allEvents);
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  return teamEvents.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate >= now && eventDate <= sevenDaysLater;
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

/**
 * Get events created by specific team member
 */
export function getMemberEvents(memberId: string, allEvents: Event[]): Event[] {
  return allEvents.filter(event => event.createdBy === memberId);
}

// ========================================
// TASKS & GOALS INTEGRATION
// ========================================

/**
 * Get all tasks assigned to team members
 */
export function getTeamTasks(team: Team, allTasks: Task[]): Task[] {
  const teamMemberIds = [team.admin.id, ...team.members.map(m => m.id)];
  
  return allTasks.filter(task => {
    // Task is team-related if assigned to any team member
    return task.assignee && teamMemberIds.includes(task.assignee);
  });
}

/**
 * Get active (incomplete) team tasks
 */
export function getActiveTeamTasks(team: Team, allTasks: Task[]): Task[] {
  return getTeamTasks(team, allTasks).filter(task => !task.completed);
}

/**
 * Get completed team tasks
 */
export function getCompletedTeamTasks(team: Team, allTasks: Task[]): Task[] {
  return getTeamTasks(team, allTasks).filter(task => task.completed);
}

/**
 * Get overdue team tasks
 */
export function getOverdueTeamTasks(team: Team, allTasks: Task[]): Task[] {
  const now = new Date();
  return getActiveTeamTasks(team, allTasks).filter(task => {
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < now;
  });
}

/**
 * Get tasks for specific team member
 */
export function getMemberTasks(memberId: string, allTasks: Task[]): Task[] {
  return allTasks.filter(task => task.assignee === memberId);
}

/**
 * Get team goals
 */
export function getTeamGoals(team: Team, allGoals: Goal[]): Goal[] {
  const teamMemberIds = [team.admin.id, ...team.members.map(m => m.id)];
  
  return allGoals.filter(goal => {
    // Goal is team-related if it has team context or assigned to team member
    return goal.teamId === team.id || 
           (goal.assignee && teamMemberIds.includes(goal.assignee));
  });
}

/**
 * Get active team goals
 */
export function getActiveTeamGoals(team: Team, allGoals: Goal[]): Goal[] {
  return getTeamGoals(team, allGoals).filter(goal => !goal.completed);
}

/**
 * Get completed team goals
 */
export function getCompletedTeamGoals(team: Team, allGoals: Goal[]): Goal[] {
  return getTeamGoals(team, allGoals).filter(goal => goal.completed);
}

// ========================================
// ENERGY MANAGEMENT INTEGRATION
// ========================================

/**
 * Calculate average team energy level
 */
export function calculateTeamEnergyLevel(team: Team): number {
  const allMembers = [team.admin, ...team.members];
  const totalEnergy = allMembers.reduce((sum, member) => sum + (member.energy || 0), 0);
  return Math.round(totalEnergy / allMembers.length);
}

/**
 * Get team members with low energy (< 50)
 */
export function getLowEnergyMembers(team: Team): TeamMember[] {
  return [team.admin, ...team.members].filter(member => member.energy < 50);
}

/**
 * Get team members with high energy (>= 80)
 */
export function getHighEnergyMembers(team: Team): TeamMember[] {
  return [team.admin, ...team.members].filter(member => member.energy >= 80);
}

/**
 * Get energy distribution for visualization
 */
export function getTeamEnergyDistribution(team: Team): { range: string; count: number }[] {
  const allMembers = [team.admin, ...team.members];
  
  return [
    { range: '0-25', count: allMembers.filter(m => m.energy >= 0 && m.energy < 25).length },
    { range: '25-50', count: allMembers.filter(m => m.energy >= 25 && m.energy < 50).length },
    { range: '50-75', count: allMembers.filter(m => m.energy >= 50 && m.energy < 75).length },
    { range: '75-100', count: allMembers.filter(m => m.energy >= 75 && m.energy <= 100).length },
  ];
}

// ========================================
// RESONANCE ENGINE INTEGRATION
// ========================================

/**
 * Calculate team resonance (harmony score)
 * Based on:
 * - Energy level alignment
 * - Task completion synchronization
 * - Collaboration patterns
 */
export function calculateTeamResonance(
  team: Team,
  allTasks: Task[],
  allEvents: Event[]
): number {
  // 1. Energy alignment (40% weight)
  const energyLevels = [team.admin, ...team.members].map(m => m.energy);
  const avgEnergy = energyLevels.reduce((sum, e) => sum + e, 0) / energyLevels.length;
  const energyVariance = energyLevels.reduce((sum, e) => sum + Math.abs(e - avgEnergy), 0) / energyLevels.length;
  const energyScore = Math.max(0, 100 - energyVariance); // Lower variance = higher resonance
  
  // 2. Task completion rate (30% weight)
  const teamTasks = getTeamTasks(team, allTasks);
  const completionRate = teamTasks.length > 0 
    ? (getCompletedTeamTasks(team, allTasks).length / teamTasks.length) * 100 
    : 50;
  
  // 3. Collaboration frequency (30% weight)
  const teamEvents = getTeamEvents(team, allEvents);
  const recentEvents = teamEvents.filter(e => {
    const daysSince = (Date.now() - new Date(e.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  });
  const collaborationScore = Math.min(100, recentEvents.length * 10); // 10 points per event, capped at 100
  
  // Weighted average
  const resonance = (energyScore * 0.4) + (completionRate * 0.3) + (collaborationScore * 0.3);
  
  return Math.round(resonance);
}

/**
 * Get resonance interpretation
 */
export function getResonanceLevel(score: number): {
  level: string;
  color: string;
  description: string;
} {
  if (score >= 90) return {
    level: 'Perfect Harmony',
    color: 'text-emerald-400',
    description: 'Team is perfectly synchronized and highly productive'
  };
  if (score >= 75) return {
    level: 'Strong Resonance',
    color: 'text-teal-400',
    description: 'Team is well-aligned with good collaboration'
  };
  if (score >= 60) return {
    level: 'Good Sync',
    color: 'text-blue-400',
    description: 'Team is coordinated with room for improvement'
  };
  if (score >= 40) return {
    level: 'Moderate Alignment',
    color: 'text-yellow-400',
    description: 'Team needs better synchronization'
  };
  return {
    level: 'Low Resonance',
    color: 'text-red-400',
    description: 'Team requires attention to improve coordination'
  };
}

// ========================================
// GAMIFICATION INTEGRATION
// ========================================

/**
 * Calculate team points based on activities
 */
export function calculateTeamPoints(team: Team, allTasks: Task[], allGoals: Goal[]): number {
  let points = 0;
  
  // Points for completed tasks
  const completedTasks = getCompletedTeamTasks(team, allTasks);
  points += completedTasks.length * 10; // 10 points per task
  
  // Bonus for high-priority tasks
  const highPriorityCompleted = completedTasks.filter(t => t.priority === 'high');
  points += highPriorityCompleted.length * 15; // 15 bonus points
  
  // Points for completed goals
  const completedGoals = getCompletedTeamGoals(team, allGoals);
  points += completedGoals.length * 50; // 50 points per goal
  
  // Bonus for high resonance
  // (Calculated separately, added here for reference)
  
  return points;
}

/**
 * Calculate team level based on points
 */
export function calculateTeamLevel(points: number): number {
  // Level progression: 100 points per level
  return Math.floor(points / 100) + 1;
}

/**
 * Get progress to next level
 */
export function getNextLevelProgress(points: number): number {
  const pointsInCurrentLevel = points % 100;
  return pointsInCurrentLevel;
}

/**
 * Get team achievements
 */
export function getTeamAchievements(team: Team, allTasks: Task[], allGoals: Goal[]): string[] {
  const achievements: string[] = [];
  
  const completedTasks = getCompletedTeamTasks(team, allTasks).length;
  const completedGoals = getCompletedTeamGoals(team, allGoals).length;
  const teamSize = team.members.length + 1;
  
  // Task achievements
  if (completedTasks >= 10) achievements.push('Task Starter');
  if (completedTasks >= 50) achievements.push('Task Master');
  if (completedTasks >= 100) achievements.push('Task Legend');
  
  // Goal achievements
  if (completedGoals >= 5) achievements.push('Goal Getter');
  if (completedGoals >= 10) achievements.push('Goal Crusher');
  
  // Team size achievements
  if (teamSize >= 5) achievements.push('Growing Team');
  if (teamSize >= 10) achievements.push('Team Builder');
  
  // Resonance achievements
  const resonance = team.teamResonance || 0;
  if (resonance >= 75) achievements.push('Synchronized Squad');
  if (resonance >= 90) achievements.push('Perfect Harmony');
  
  return achievements;
}

// ========================================
// COMPREHENSIVE STATISTICS
// ========================================

/**
 * Get complete team statistics for dashboard
 */
export function getTeamStatistics(
  team: Team,
  allTasks: Task[],
  allGoals: Goal[],
  allEvents: Event[]
): TeamStatistics {
  const activeTasks = getActiveTeamTasks(team, allTasks);
  const completedTasks = getCompletedTeamTasks(team, allTasks);
  const overdueTasks = getOverdueTeamTasks(team, allTasks);
  const activeGoals = getActiveTeamGoals(team, allGoals);
  const completedGoals = getCompletedTeamGoals(team, allGoals);
  const upcomingEvents = getUpcomingTeamEvents(team, allEvents);
  
  const avgEnergyLevel = calculateTeamEnergyLevel(team);
  const teamResonance = calculateTeamResonance(team, allTasks, allEvents);
  const totalPoints = calculateTeamPoints(team, allTasks, allGoals);
  const teamLevel = calculateTeamLevel(totalPoints);
  const nextLevelProgress = getNextLevelProgress(totalPoints);
  const achievements = getTeamAchievements(team, allTasks, allGoals);
  
  // Productivity score (0-100)
  const totalTasks = activeTasks.length + completedTasks.length;
  const productivityScore = totalTasks > 0 
    ? Math.round((completedTasks.length / totalTasks) * 100)
    : 0;
  
  // Collaboration score (based on events)
  const recentEvents = upcomingEvents.length;
  const collaborationScore = Math.min(100, recentEvents * 10);
  
  return {
    totalMembers: team.members.length + 1,
    activeTasks: activeTasks.length,
    completedTasks: completedTasks.length,
    overdueTasks: overdueTasks.length,
    activeGoals: activeGoals.length,
    completedGoals: completedGoals.length,
    upcomingEvents: upcomingEvents.length,
    avgEnergyLevel,
    teamResonance,
    productivityScore,
    collaborationScore,
    totalPoints,
    teamLevel,
    nextLevelProgress,
    recentAchievements: achievements.slice(-3), // Last 3 achievements
  };
}

/**
 * Get team activity feed
 */
export function getTeamActivityFeed(
  team: Team,
  allTasks: Task[],
  allGoals: Goal[],
  allEvents: Event[],
  limit: number = 10
): TeamActivity[] {
  const activities: TeamActivity[] = [];
  
  // Add completed tasks
  const completedTasks = getCompletedTeamTasks(team, allTasks);
  completedTasks.forEach(task => {
    if (task.completedAt && task.assignee) {
      const member = [team.admin, ...team.members].find(m => m.id === task.assignee);
      if (member) {
        activities.push({
          type: 'task_completed',
          memberId: member.id,
          memberName: member.name,
          timestamp: new Date(task.completedAt),
          description: `Completed task: ${task.title}`,
          points: 10,
        });
      }
    }
  });
  
  // Add completed goals
  const completedGoals = getCompletedTeamGoals(team, allGoals);
  completedGoals.forEach(goal => {
    if (goal.completedAt && goal.assignee) {
      const member = [team.admin, ...team.members].find(m => m.id === goal.assignee);
      if (member) {
        activities.push({
          type: 'goal_achieved',
          memberId: member.id,
          memberName: member.name,
          timestamp: new Date(goal.completedAt),
          description: `Achieved goal: ${goal.title}`,
          points: 50,
        });
      }
    }
  });
  
  // Add created events
  const teamEvents = getTeamEvents(team, allEvents);
  teamEvents.forEach(event => {
    const member = [team.admin, ...team.members].find(m => m.name === event.createdBy);
    if (member) {
      activities.push({
        type: 'event_created',
        memberId: member.id,
        memberName: member.name,
        timestamp: new Date(event.createdAt),
        description: `Created event: ${event.title}`,
      });
    }
  });
  
  // Sort by timestamp (newest first) and limit
  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}
