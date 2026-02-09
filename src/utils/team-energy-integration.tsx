/**
 * Team Energy Integration Utilities (Phase 6C)
 * 
 * Bridges individual energy system with team collaboration features.
 * Enables energy-aware scheduling, workload balancing, and team analytics.
 * 
 * Features:
 * - Aggregate team energy levels in real-time
 * - Optimal time suggestions for team events
 * - Energy-based workload balancing
 * - Burnout prevention for teams
 * - Team energy curves and predictions
 * - Historical pattern analysis
 */

import { Team, TeamMember } from '../types/team';
import { Event } from './event-task-types';
import { EnergyState, COLOR_LEVELS, ColorLevel } from './energy-system';

// ============================================================================
// TYPES
// ============================================================================

export interface TeamEnergyStats {
  teamId: string;
  teamName: string;
  totalEnergy: number;
  averageEnergy: number;
  minEnergy: number;
  maxEnergy: number;
  activeMembers: number;
  energyDistribution: {
    red: number;    // Members in Red
    orange: number;
    yellow: number;
    green: number;
    blue: number;
    indigo: number;
    violet: number;
  };
  teamColorLevel: ColorLevel; // Based on average
  burnoutRisk: 'low' | 'medium' | 'high';
  optimalWorkHours: string[]; // e.g., ["09:00", "10:00", "14:00"]
}

export interface MemberEnergyInfo {
  userId: string;
  userName: string;
  currentEnergy: number;
  colorLevel: ColorLevel;
  colorIndex: number;
  lastActivity: Date;
  isActive: boolean; // Active in last 4 hours
  burnoutRisk: 'low' | 'medium' | 'high';
}

export interface TeamEnergySchedulingSuggestion {
  suggestedTime: Date;
  confidence: number; // 0-100
  reason: string;
  expectedTeamEnergy: number;
  expectedColorLevel: ColorLevel;
  availableMembers: string[]; // User IDs
  energyForecast: {
    high: string[]; // User IDs with high energy
    medium: string[];
    low: string[];
  };
}

export interface TeamWorkloadBalance {
  isBalanced: boolean;
  imbalanceScore: number; // 0-100, lower is better
  overloadedMembers: string[]; // User IDs
  underutilizedMembers: string[];
  recommendations: string[];
}

export interface TeamEnergyTrend {
  date: string; // YYYY-MM-DD
  averageEnergy: number;
  totalEnergy: number;
  colorLevel: ColorLevel;
  activeMembers: number;
  eventsCompleted: number;
}

// ============================================================================
// AGGREGATE TEAM ENERGY
// ============================================================================

/**
 * Calculate comprehensive team energy statistics
 */
export function calculateTeamEnergyStats(
  team: Team,
  memberEnergyStates: Map<string, EnergyState> // userId -> EnergyState
): TeamEnergyStats {
  const memberEnergies = team.members
    .map(member => {
      const energyState = memberEnergyStates.get(member.userId);
      return energyState?.totalEnergy || 0;
    })
    .filter(e => e > 0);

  const totalEnergy = memberEnergies.reduce((sum, e) => sum + e, 0);
  const averageEnergy = memberEnergies.length > 0 
    ? totalEnergy / memberEnergies.length 
    : 0;
  const minEnergy = memberEnergies.length > 0 ? Math.min(...memberEnergies) : 0;
  const maxEnergy = memberEnergies.length > 0 ? Math.max(...memberEnergies) : 0;

  // Calculate energy distribution by color
  const distribution = {
    red: 0, orange: 0, yellow: 0, green: 0, blue: 0, indigo: 0, violet: 0
  };

  team.members.forEach(member => {
    const energyState = memberEnergyStates.get(member.userId);
    if (energyState) {
      const colorName = energyState.currentColor.colorName;
      distribution[colorName]++;
    }
  });

  // Team color level based on average energy
  const teamColorLevel = getColorLevelFromEnergy(averageEnergy);

  // Burnout risk assessment
  const lowEnergyCount = distribution.red + distribution.orange;
  const burnoutRisk = calculateBurnoutRisk(lowEnergyCount, team.members.length);

  // Optimal work hours (mock - would use historical data in production)
  const optimalWorkHours = generateOptimalWorkHours(averageEnergy);

  return {
    teamId: team.id,
    teamName: team.name,
    totalEnergy,
    averageEnergy,
    minEnergy,
    maxEnergy,
    activeMembers: memberEnergies.length,
    energyDistribution: distribution,
    teamColorLevel,
    burnoutRisk,
    optimalWorkHours,
  };
}

/**
 * Get individual member energy information
 */
export function getMemberEnergyInfo(
  member: TeamMember,
  energyState: EnergyState | undefined
): MemberEnergyInfo {
  if (!energyState) {
    return {
      userId: member.userId,
      userName: member.name,
      currentEnergy: 0,
      colorLevel: COLOR_LEVELS[0],
      colorIndex: 0,
      lastActivity: new Date(),
      isActive: false,
      burnoutRisk: 'low',
    };
  }

  const isActive = isRecentlyActive(energyState.lastActivity);
  const burnoutRisk = calculateIndividualBurnoutRisk(
    energyState.totalEnergy,
    energyState.lastActivity
  );

  return {
    userId: member.userId,
    userName: member.name,
    currentEnergy: energyState.totalEnergy,
    colorLevel: energyState.currentColor,
    colorIndex: energyState.colorIndex,
    lastActivity: energyState.lastActivity,
    isActive,
    burnoutRisk,
  };
}

// ============================================================================
// OPTIMAL SCHEDULING
// ============================================================================

/**
 * Suggest optimal times for team events based on energy patterns
 */
export function suggestOptimalTeamEventTime(
  team: Team,
  memberEnergyStates: Map<string, EnergyState>,
  eventDuration: number = 60 // minutes
): TeamEnergySchedulingSuggestion[] {
  const suggestions: TeamEnergySchedulingSuggestion[] = [];
  const now = new Date();

  // Generate suggestions for next 7 days
  const timeSlots = generateTimeSlots(now, 7);

  timeSlots.forEach(slot => {
    const prediction = predictTeamEnergyAtTime(
      team,
      memberEnergyStates,
      slot
    );

    if (prediction.expectedTeamEnergy > 200) { // Minimum threshold
      suggestions.push({
        suggestedTime: slot,
        confidence: prediction.confidence,
        reason: prediction.reason,
        expectedTeamEnergy: prediction.expectedTeamEnergy,
        expectedColorLevel: prediction.colorLevel,
        availableMembers: prediction.availableMembers,
        energyForecast: prediction.energyForecast,
      });
    }
  });

  // Sort by expected energy and confidence
  return suggestions
    .sort((a, b) => {
      const scoreA = a.expectedTeamEnergy * (a.confidence / 100);
      const scoreB = b.expectedTeamEnergy * (b.confidence / 100);
      return scoreB - scoreA;
    })
    .slice(0, 5); // Top 5 suggestions
}

/**
 * Predict team energy at specific time
 */
function predictTeamEnergyAtTime(
  team: Team,
  memberEnergyStates: Map<string, EnergyState>,
  targetTime: Date
) {
  const hour = targetTime.getHours();
  const dayOfWeek = targetTime.getDay();

  // Calculate base energy from current states
  const currentStats = calculateTeamEnergyStats(team, memberEnergyStates);
  
  // Apply time-of-day multiplier
  let timeMultiplier = 1.0;
  if (hour >= 9 && hour <= 11) timeMultiplier = 1.2; // Morning peak
  else if (hour >= 14 && hour <= 16) timeMultiplier = 1.1; // Afternoon peak
  else if (hour >= 18 || hour <= 6) timeMultiplier = 0.5; // Off hours
  
  // Apply day-of-week multiplier
  let dayMultiplier = 1.0;
  if (dayOfWeek === 0 || dayOfWeek === 6) dayMultiplier = 0.7; // Weekend

  const expectedEnergy = currentStats.averageEnergy * timeMultiplier * dayMultiplier;
  const confidence = calculateConfidence(hour, dayOfWeek);

  // Categorize members by predicted energy
  const forecast = {
    high: team.members.filter(m => {
      const state = memberEnergyStates.get(m.userId);
      return state && (state.totalEnergy * timeMultiplier) > 400;
    }).map(m => m.userId),
    medium: team.members.filter(m => {
      const state = memberEnergyStates.get(m.userId);
      const predictedEnergy = state ? state.totalEnergy * timeMultiplier : 0;
      return predictedEnergy >= 200 && predictedEnergy <= 400;
    }).map(m => m.userId),
    low: team.members.filter(m => {
      const state = memberEnergyStates.get(m.userId);
      return state && (state.totalEnergy * timeMultiplier) < 200;
    }).map(m => m.userId),
  };

  const reason = generateSchedulingReason(hour, timeMultiplier, expectedEnergy);

  return {
    expectedTeamEnergy: Math.round(expectedEnergy),
    colorLevel: getColorLevelFromEnergy(expectedEnergy),
    confidence,
    reason,
    availableMembers: team.members.map(m => m.userId),
    energyForecast: forecast,
  };
}

// ============================================================================
// WORKLOAD BALANCING
// ============================================================================

/**
 * Analyze team workload balance and provide recommendations
 */
export function analyzeTeamWorkloadBalance(
  team: Team,
  memberEnergyStates: Map<string, EnergyState>,
  teamEvents: Event[]
): TeamWorkloadBalance {
  const memberWorkloads = team.members.map(member => {
    const energyState = memberEnergyStates.get(member.userId);
    const assignedEvents = teamEvents.filter(event => 
      event.teamId === team.id && 
      event.assignedTo?.includes(member.userId)
    );

    return {
      userId: member.userId,
      currentEnergy: energyState?.totalEnergy || 0,
      assignedEvents: assignedEvents.length,
      workloadScore: assignedEvents.length * 10, // Simple scoring
    };
  });

  const avgWorkload = memberWorkloads.reduce((sum, m) => sum + m.workloadScore, 0) / memberWorkloads.length;
  const variance = memberWorkloads.reduce((sum, m) => 
    sum + Math.pow(m.workloadScore - avgWorkload, 2), 0
  ) / memberWorkloads.length;
  
  const imbalanceScore = Math.min(100, Math.sqrt(variance));
  const isBalanced = imbalanceScore < 30;

  // Identify overloaded and underutilized members
  const threshold = avgWorkload * 0.3;
  const overloaded = memberWorkloads
    .filter(m => m.workloadScore > avgWorkload + threshold)
    .map(m => m.userId);
  const underutilized = memberWorkloads
    .filter(m => m.workloadScore < avgWorkload - threshold && m.currentEnergy > 200)
    .map(m => m.userId);

  // Generate recommendations
  const recommendations: string[] = [];
  if (overloaded.length > 0) {
    recommendations.push(`${overloaded.length} member(s) are overloaded. Consider redistributing tasks.`);
  }
  if (underutilized.length > 0) {
    recommendations.push(`${underutilized.length} member(s) have capacity for more work.`);
  }
  if (isBalanced) {
    recommendations.push('Team workload is well balanced!');
  }

  return {
    isBalanced,
    imbalanceScore: Math.round(imbalanceScore),
    overloadedMembers: overloaded,
    underutilizedMembers: underutilized,
    recommendations,
  };
}

// ============================================================================
// ENERGY TRENDS
// ============================================================================

/**
 * Generate team energy trends over time
 */
export function generateTeamEnergyTrends(
  team: Team,
  memberEnergyStates: Map<string, EnergyState>,
  days: number = 7
): TeamEnergyTrend[] {
  const trends: TeamEnergyTrend[] = [];
  const today = new Date();

  // Mock historical data - in production, would query database
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const stats = calculateTeamEnergyStats(team, memberEnergyStates);
    
    // Simulate variation over time
    const variation = Math.random() * 0.3 + 0.85; // 85-115% of current
    const avgEnergy = stats.averageEnergy * variation;
    
    trends.push({
      date: date.toISOString().split('T')[0],
      averageEnergy: Math.round(avgEnergy),
      totalEnergy: Math.round(avgEnergy * stats.activeMembers),
      colorLevel: getColorLevelFromEnergy(avgEnergy),
      activeMembers: stats.activeMembers,
      eventsCompleted: Math.floor(Math.random() * 5) + 1,
    });
  }

  return trends;
}

/**
 * Predict team energy for next N days
 */
export function predictTeamEnergyTrend(
  team: Team,
  memberEnergyStates: Map<string, EnergyState>,
  days: number = 7
): TeamEnergyTrend[] {
  const predictions: TeamEnergyTrend[] = [];
  const today = new Date();
  const currentStats = calculateTeamEnergyStats(team, memberEnergyStates);

  for (let i = 1; i <= days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    // Simple prediction: current average with slight decay
    const decayFactor = Math.pow(0.95, i); // 5% decay per day
    const predictedAvg = currentStats.averageEnergy * decayFactor;
    
    predictions.push({
      date: date.toISOString().split('T')[0],
      averageEnergy: Math.round(predictedAvg),
      totalEnergy: Math.round(predictedAvg * currentStats.activeMembers),
      colorLevel: getColorLevelFromEnergy(predictedAvg),
      activeMembers: currentStats.activeMembers,
      eventsCompleted: 0, // Unknown future
    });
  }

  return predictions;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getColorLevelFromEnergy(energy: number): ColorLevel {
  for (let i = COLOR_LEVELS.length - 1; i >= 0; i--) {
    if (energy >= COLOR_LEVELS[i].energyRequired) {
      return COLOR_LEVELS[i];
    }
  }
  return COLOR_LEVELS[0];
}

function calculateBurnoutRisk(
  lowEnergyCount: number,
  totalMembers: number
): 'low' | 'medium' | 'high' {
  const ratio = lowEnergyCount / totalMembers;
  if (ratio > 0.5) return 'high';
  if (ratio > 0.3) return 'medium';
  return 'low';
}

function calculateIndividualBurnoutRisk(
  energy: number,
  lastActivity: Date
): 'low' | 'medium' | 'high' {
  const hoursSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);
  
  if (energy < 100 || hoursSinceActivity > 12) return 'high';
  if (energy < 200 || hoursSinceActivity > 8) return 'medium';
  return 'low';
}

function isRecentlyActive(lastActivity: Date): boolean {
  const hours = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);
  return hours < 4;
}

function generateOptimalWorkHours(averageEnergy: number): string[] {
  // Based on energy level, suggest optimal times
  if (averageEnergy > 400) {
    return ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
  } else if (averageEnergy > 200) {
    return ["10:00", "11:00", "14:00", "15:00"];
  } else {
    return ["11:00", "14:00"];
  }
}

function generateTimeSlots(startDate: Date, days: number): Date[] {
  const slots: Date[] = [];
  const workHours = [9, 10, 11, 14, 15, 16]; // 9am-11am, 2pm-4pm

  for (let day = 0; day < days; day++) {
    workHours.forEach(hour => {
      const slot = new Date(startDate);
      slot.setDate(slot.getDate() + day);
      slot.setHours(hour, 0, 0, 0);
      if (slot > startDate) { // Only future slots
        slots.push(slot);
      }
    });
  }

  return slots;
}

function calculateConfidence(hour: number, dayOfWeek: number): number {
  let confidence = 70; // Base confidence

  // Higher confidence during typical work hours
  if (hour >= 9 && hour <= 17) confidence += 20;
  
  // Lower confidence on weekends
  if (dayOfWeek === 0 || dayOfWeek === 6) confidence -= 20;

  return Math.max(0, Math.min(100, confidence));
}

function generateSchedulingReason(
  hour: number,
  multiplier: number,
  expectedEnergy: number
): string {
  if (hour >= 9 && hour <= 11) {
    return "Morning hours typically show peak team energy and focus";
  } else if (hour >= 14 && hour <= 16) {
    return "Post-lunch period with renewed energy and clarity";
  } else if (expectedEnergy > 400) {
    return "High team energy predicted at this time";
  } else {
    return "Moderate team energy expected";
  }
}

// ============================================================================
// EVENT ENERGY REQUIREMENTS
// ============================================================================

/**
 * Calculate energy requirements for an event
 */
export function calculateEventEnergyRequirement(event: Event): number {
  // Base energy cost on duration
  const durationMinutes = event.duration || 60;
  let baseEnergy = durationMinutes * 2; // 2 energy per minute

  // Adjust for complexity (based on child count, milestones, etc.)
  const childCount = event.children?.length || 0;
  const milestoneCount = event.milestones?.length || 0;
  
  baseEnergy += childCount * 50;
  baseEnergy += milestoneCount * 30;

  return baseEnergy;
}

/**
 * Check if team has sufficient energy for event
 */
export function canTeamHandleEvent(
  team: Team,
  memberEnergyStates: Map<string, EnergyState>,
  event: Event
): { canHandle: boolean; reason: string; energyGap: number } {
  const requirement = calculateEventEnergyRequirement(event);
  const stats = calculateTeamEnergyStats(team, memberEnergyStates);

  const canHandle = stats.totalEnergy >= requirement;
  const energyGap = requirement - stats.totalEnergy;

  let reason = '';
  if (canHandle) {
    reason = `Team has sufficient energy (${stats.totalEnergy} available, ${requirement} needed)`;
  } else {
    reason = `Team needs ${energyGap} more energy for this event`;
  }

  return { canHandle, reason, energyGap };
}
