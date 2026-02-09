/**
 * Team Resonance Integration Utilities (Phase 6D)
 * 
 * Calculates team-wide resonance scores, member alignment metrics,
 * and provides AI-powered insights for improving team dynamics.
 * 
 * Features:
 * - Team resonance aggregation from individual scores
 * - Member alignment tracking (how well members sync with team)
 * - Event resonance levels (team engagement with events)
 * - Discord detection (identify out-of-sync members)
 * - Harmony metrics (overall team cohesion)
 * - AI-powered recommendations for team improvement
 */

import { Team, TeamMember } from '../types/team';
import { Event } from './event-task-types';

// ============================================================================
// TYPES
// ============================================================================

export type ResonanceLevel = 'discord' | 'neutral' | 'harmony' | 'peak-harmony';
export type AlignmentLevel = 'misaligned' | 'partially-aligned' | 'aligned' | 'highly-aligned';

export interface TeamResonanceScore {
  teamId: string;
  teamName: string;
  
  // Overall team resonance (0-100)
  overallResonance: number;
  resonanceLevel: ResonanceLevel;
  
  // Member alignment
  memberAlignments: MemberAlignment[];
  averageAlignment: number;
  
  // Team harmony metrics
  harmony: {
    cohesion: number; // 0-100, how well team works together
    consistency: number; // 0-100, how consistent team performance is
    engagement: number; // 0-100, overall team engagement
    momentum: number; // -100 to +100, trending up or down
  };
  
  // Discord warnings
  discordWarnings: DiscordWarning[];
  
  // Event resonance
  eventResonance: {
    highResonanceEvents: number; // Count of events with >80 resonance
    lowResonanceEvents: number; // Count of events with <40 resonance
    averageEventResonance: number;
  };
  
  // Timestamps
  calculatedAt: Date;
  lastUpdated: Date;
}

export interface MemberAlignment {
  userId: string;
  userName: string;
  
  // Individual resonance score
  personalResonance: number;
  
  // Alignment with team
  teamAlignment: number; // 0-100
  alignmentLevel: AlignmentLevel;
  
  // Contribution metrics
  contributionScore: number; // 0-100, based on participation
  engagementScore: number; // 0-100, based on activity
  
  // Sync status
  inSync: boolean; // Is this member in harmony with the team?
  syncDelta: number; // Difference from team average (-100 to +100)
  
  // Trends
  trend: 'improving' | 'stable' | 'declining';
  trendPercentage: number; // % change from previous period
}

export interface DiscordWarning {
  id: string;
  type: 'low-alignment' | 'declining-resonance' | 'member-disconnect' | 'event-engagement';
  severity: 'low' | 'medium' | 'high';
  
  message: string;
  affectedMembers: string[]; // User IDs
  affectedEvents?: string[]; // Event IDs
  
  recommendation: string;
  createdAt: Date;
}

export interface EventResonance {
  eventId: string;
  eventTitle: string;
  
  // Team resonance for this event
  teamResonance: number; // 0-100
  
  // Individual member resonance for this event
  memberResonances: {
    userId: string;
    userName: string;
    resonance: number;
  }[];
  
  // Event engagement
  engagementScore: number; // 0-100
  participationRate: number; // 0-100, % of assigned members engaged
  
  // Insights
  isHighResonance: boolean;
  isLowResonance: boolean;
  needsAttention: boolean;
}

export interface TeamResonanceInsight {
  id: string;
  category: 'harmony' | 'alignment' | 'engagement' | 'momentum' | 'discord';
  priority: 'low' | 'medium' | 'high';
  
  title: string;
  description: string;
  impact: string;
  
  recommendations: string[];
  affectedMembers?: string[];
  
  aiGenerated: boolean;
  confidence: number; // 0-100
}

export interface ResonanceWave {
  timestamp: Date;
  teamResonance: number;
  memberResonances: {
    userId: string;
    resonance: number;
  }[];
}

// ============================================================================
// TEAM RESONANCE CALCULATION
// ============================================================================

/**
 * Calculate overall team resonance from individual member scores
 */
export function calculateTeamResonance(
  team: Team,
  memberResonanceScores: Map<string, number>
): TeamResonanceScore {
  const activeMembers = team.members.filter(m => m.status === 'active');
  
  // Calculate overall resonance (weighted average)
  const totalResonance = activeMembers.reduce((sum, member) => {
    const score = memberResonanceScores.get(member.userId) || 50;
    return sum + score;
  }, 0);
  
  const overallResonance = activeMembers.length > 0 
    ? totalResonance / activeMembers.length 
    : 50;
  
  // Calculate member alignments
  const memberAlignments = calculateMemberAlignments(
    activeMembers,
    memberResonanceScores,
    overallResonance
  );
  
  const averageAlignment = memberAlignments.reduce((sum, m) => sum + m.teamAlignment, 0) 
    / memberAlignments.length || 0;
  
  // Calculate harmony metrics
  const harmony = calculateHarmonyMetrics(memberAlignments, overallResonance);
  
  // Detect discord warnings
  const discordWarnings = detectDiscordWarnings(memberAlignments, harmony);
  
  // Calculate event resonance (mock for now)
  const eventResonance = {
    highResonanceEvents: 0,
    lowResonanceEvents: 0,
    averageEventResonance: overallResonance,
  };
  
  return {
    teamId: team.id,
    teamName: team.name,
    overallResonance,
    resonanceLevel: getResonanceLevel(overallResonance),
    memberAlignments,
    averageAlignment,
    harmony,
    discordWarnings,
    eventResonance,
    calculatedAt: new Date(),
    lastUpdated: new Date(),
  };
}

/**
 * Calculate individual member alignment with team
 */
function calculateMemberAlignments(
  members: TeamMember[],
  memberResonanceScores: Map<string, number>,
  teamAverageResonance: number
): MemberAlignment[] {
  return members.map(member => {
    const personalResonance = memberResonanceScores.get(member.userId) || 50;
    
    // Calculate alignment (how close to team average)
    const syncDelta = personalResonance - teamAverageResonance;
    const alignmentDistance = Math.abs(syncDelta);
    const teamAlignment = Math.max(0, 100 - alignmentDistance);
    
    // Calculate contribution score (based on role)
    const contributionScore = calculateContributionScore(member);
    
    // Calculate engagement score
    const engagementScore = calculateEngagementScore(member, personalResonance);
    
    // Determine if in sync (within 15 points of team average)
    const inSync = alignmentDistance <= 15;
    
    // Calculate trend (mock for now)
    const trend: 'improving' | 'stable' | 'declining' = 'stable';
    const trendPercentage = 0;
    
    return {
      userId: member.userId,
      userName: member.name,
      personalResonance,
      teamAlignment,
      alignmentLevel: getAlignmentLevel(teamAlignment),
      contributionScore,
      engagementScore,
      inSync,
      syncDelta,
      trend,
      trendPercentage,
    };
  });
}

/**
 * Calculate harmony metrics for team
 */
function calculateHarmonyMetrics(
  memberAlignments: MemberAlignment[],
  overallResonance: number
): TeamResonanceScore['harmony'] {
  // Cohesion: How aligned members are
  const cohesion = memberAlignments.reduce((sum, m) => sum + m.teamAlignment, 0) 
    / memberAlignments.length || 0;
  
  // Consistency: Standard deviation of resonance scores
  const resonances = memberAlignments.map(m => m.personalResonance);
  const mean = resonances.reduce((a, b) => a + b, 0) / resonances.length;
  const variance = resonances.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) 
    / resonances.length;
  const stdDev = Math.sqrt(variance);
  const consistency = Math.max(0, 100 - stdDev);
  
  // Engagement: Average engagement score
  const engagement = memberAlignments.reduce((sum, m) => sum + m.engagementScore, 0) 
    / memberAlignments.length || 0;
  
  // Momentum: Based on overall resonance (mock trend)
  const momentum = overallResonance > 70 ? 25 : overallResonance < 40 ? -25 : 0;
  
  return {
    cohesion,
    consistency,
    engagement,
    momentum,
  };
}

/**
 * Detect discord warnings in team
 */
function detectDiscordWarnings(
  memberAlignments: MemberAlignment[],
  harmony: TeamResonanceScore['harmony']
): DiscordWarning[] {
  const warnings: DiscordWarning[] = [];
  
  // Check for low alignment members
  const lowAlignmentMembers = memberAlignments.filter(m => m.teamAlignment < 50);
  if (lowAlignmentMembers.length > 0) {
    warnings.push({
      id: `discord-${Date.now()}-low-alignment`,
      type: 'low-alignment',
      severity: lowAlignmentMembers.length > 2 ? 'high' : 'medium',
      message: `${lowAlignmentMembers.length} team member(s) are out of sync with the team`,
      affectedMembers: lowAlignmentMembers.map(m => m.userId),
      recommendation: 'Schedule 1-on-1 check-ins to understand individual concerns and realign goals',
      createdAt: new Date(),
    });
  }
  
  // Check for declining resonance
  const decliningMembers = memberAlignments.filter(m => m.trend === 'declining');
  if (decliningMembers.length > 0) {
    warnings.push({
      id: `discord-${Date.now()}-declining`,
      type: 'declining-resonance',
      severity: 'medium',
      message: `${decliningMembers.length} member(s) showing declining engagement`,
      affectedMembers: decliningMembers.map(m => m.userId),
      recommendation: 'Review recent workload and adjust assignments to prevent burnout',
      createdAt: new Date(),
    });
  }
  
  // Check for low cohesion
  if (harmony.cohesion < 50) {
    warnings.push({
      id: `discord-${Date.now()}-cohesion`,
      type: 'member-disconnect',
      severity: 'high',
      message: 'Team cohesion is below optimal levels',
      affectedMembers: memberAlignments.map(m => m.userId),
      recommendation: 'Organize team-building activities and clarify shared objectives',
      createdAt: new Date(),
    });
  }
  
  return warnings;
}

// ============================================================================
// EVENT RESONANCE
// ============================================================================

/**
 * Calculate resonance for a specific team event
 */
export function calculateEventResonance(
  event: Event,
  team: Team,
  memberResonanceScores: Map<string, number>
): EventResonance {
  const assignedMembers = team.members.filter(m => 
    event.assignedTo?.includes(m.userId)
  );
  
  if (assignedMembers.length === 0) {
    return {
      eventId: event.id,
      eventTitle: event.title,
      teamResonance: 50,
      memberResonances: [],
      engagementScore: 0,
      participationRate: 0,
      isHighResonance: false,
      isLowResonance: false,
      needsAttention: true,
    };
  }
  
  // Calculate member resonances for this event
  const memberResonances = assignedMembers.map(member => ({
    userId: member.userId,
    userName: member.name,
    resonance: memberResonanceScores.get(member.userId) || 50,
  }));
  
  // Calculate team resonance for event (average)
  const teamResonance = memberResonances.reduce((sum, m) => sum + m.resonance, 0) 
    / memberResonances.length;
  
  // Calculate engagement score
  const engagementScore = calculateEventEngagement(event, assignedMembers);
  
  // Calculate participation rate (mock)
  const participationRate = 85; // Would be based on actual participation data
  
  return {
    eventId: event.id,
    eventTitle: event.title,
    teamResonance,
    memberResonances,
    engagementScore,
    participationRate,
    isHighResonance: teamResonance >= 80,
    isLowResonance: teamResonance < 40,
    needsAttention: teamResonance < 50 || participationRate < 60,
  };
}

/**
 * Calculate engagement score for an event
 */
function calculateEventEngagement(event: Event, members: TeamMember[]): number {
  let score = 50; // Base score
  
  // Boost for resources
  if (event.resources && event.resources.length > 0) {
    score += 10;
  }
  
  // Boost for notes
  if (event.linksNotes && event.linksNotes.length > 0) {
    score += 10;
  }
  
  // Boost for tasks
  if (event.associatedTasks && event.associatedTasks.length > 0) {
    score += 15;
  }
  
  // Boost for team size
  score += Math.min(15, members.length * 3);
  
  return Math.min(100, score);
}

// ============================================================================
// AI INSIGHTS GENERATION
// ============================================================================

/**
 * Generate AI-powered insights for team resonance
 */
export function generateTeamResonanceInsights(
  teamResonance: TeamResonanceScore
): TeamResonanceInsight[] {
  const insights: TeamResonanceInsight[] = [];
  
  // Harmony insights
  if (teamResonance.overallResonance >= 80) {
    insights.push({
      id: `insight-${Date.now()}-high-harmony`,
      category: 'harmony',
      priority: 'low',
      title: 'Exceptional Team Harmony',
      description: `Your team is operating at peak harmony with a resonance score of ${teamResonance.overallResonance.toFixed(0)}`,
      impact: 'Continue current practices to maintain this high-performance state',
      recommendations: [
        'Document what\'s working well for future reference',
        'Share your team\'s success patterns with other teams',
        'Celebrate this achievement to boost morale',
      ],
      aiGenerated: true,
      confidence: 95,
    });
  } else if (teamResonance.overallResonance < 40) {
    insights.push({
      id: `insight-${Date.now()}-low-harmony`,
      category: 'discord',
      priority: 'high',
      title: 'Team Harmony Needs Attention',
      description: `Team resonance is below optimal at ${teamResonance.overallResonance.toFixed(0)}`,
      impact: 'Low harmony can lead to reduced productivity and increased turnover',
      recommendations: [
        'Schedule immediate team retrospective meeting',
        'Conduct anonymous feedback survey',
        'Review and adjust team goals for clarity',
        'Consider team-building activities',
      ],
      affectedMembers: teamResonance.memberAlignments.map(m => m.userId),
      aiGenerated: true,
      confidence: 90,
    });
  }
  
  // Alignment insights
  const misalignedMembers = teamResonance.memberAlignments.filter(
    m => m.alignmentLevel === 'misaligned'
  );
  
  if (misalignedMembers.length > 0) {
    insights.push({
      id: `insight-${Date.now()}-misalignment`,
      category: 'alignment',
      priority: 'high',
      title: 'Member Alignment Issues Detected',
      description: `${misalignedMembers.length} team member(s) are significantly out of alignment`,
      impact: 'Misalignment can cause friction and reduce team effectiveness',
      recommendations: [
        'Schedule 1-on-1 meetings with affected members',
        'Clarify individual roles and expectations',
        'Ensure workload is evenly distributed',
        'Address any blockers or concerns',
      ],
      affectedMembers: misalignedMembers.map(m => m.userId),
      aiGenerated: true,
      confidence: 85,
    });
  }
  
  // Engagement insights
  if (teamResonance.harmony.engagement < 60) {
    insights.push({
      id: `insight-${Date.now()}-low-engagement`,
      category: 'engagement',
      priority: 'medium',
      title: 'Team Engagement Below Target',
      description: `Overall engagement is at ${teamResonance.harmony.engagement.toFixed(0)}%, below the 60% threshold`,
      impact: 'Low engagement can signal burnout or lack of motivation',
      recommendations: [
        'Review current projects for meaningful work',
        'Rotate assignments to maintain interest',
        'Provide recognition for recent achievements',
        'Ensure adequate breaks and time off',
      ],
      aiGenerated: true,
      confidence: 80,
    });
  }
  
  // Momentum insights
  if (teamResonance.harmony.momentum > 20) {
    insights.push({
      id: `insight-${Date.now()}-positive-momentum`,
      category: 'momentum',
      priority: 'low',
      title: 'Positive Team Momentum',
      description: 'Team is trending upward with strong positive momentum',
      impact: 'Capitalize on this momentum for major initiatives',
      recommendations: [
        'This is a great time to tackle challenging projects',
        'Use momentum to drive innovation',
        'Capture learnings to replicate success',
      ],
      aiGenerated: true,
      confidence: 75,
    });
  } else if (teamResonance.harmony.momentum < -20) {
    insights.push({
      id: `insight-${Date.now()}-negative-momentum`,
      category: 'momentum',
      priority: 'high',
      title: 'Declining Team Momentum',
      description: 'Team momentum is trending downward',
      impact: 'Negative momentum can compound into larger issues',
      recommendations: [
        'Identify and address root causes immediately',
        'Quick wins to rebuild confidence',
        'Re-energize with a team reset meeting',
        'Adjust timelines if needed to reduce pressure',
      ],
      aiGenerated: true,
      confidence: 85,
    });
  }
  
  return insights;
}

// ============================================================================
// RESONANCE WAVES (TIME-SERIES DATA)
// ============================================================================

/**
 * Generate resonance wave data for visualization
 */
export function generateResonanceWaves(
  team: Team,
  memberResonanceScores: Map<string, number>,
  days: number = 7
): ResonanceWave[] {
  const waves: ResonanceWave[] = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const timestamp = new Date(now);
    timestamp.setDate(timestamp.getDate() - i);
    
    // Mock historical data with slight variations
    const teamResonance = calculateTeamResonance(team, memberResonanceScores).overallResonance;
    const variation = (Math.random() - 0.5) * 20;
    
    const memberResonances = team.members
      .filter(m => m.status === 'active')
      .map(m => ({
        userId: m.userId,
        resonance: Math.max(0, Math.min(100, 
          (memberResonanceScores.get(m.userId) || 50) + variation
        )),
      }));
    
    waves.push({
      timestamp,
      teamResonance: Math.max(0, Math.min(100, teamResonance + variation)),
      memberResonances,
    });
  }
  
  return waves;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getResonanceLevel(score: number): ResonanceLevel {
  if (score >= 80) return 'peak-harmony';
  if (score >= 60) return 'harmony';
  if (score >= 40) return 'neutral';
  return 'discord';
}

function getAlignmentLevel(score: number): AlignmentLevel {
  if (score >= 80) return 'highly-aligned';
  if (score >= 60) return 'aligned';
  if (score >= 40) return 'partially-aligned';
  return 'misaligned';
}

function calculateContributionScore(member: TeamMember): number {
  // Base score from role
  let score = 50;
  
  if (member.role === 'admin' || member.role === 'owner') {
    score += 20;
  } else if (member.role === 'member') {
    score += 10;
  }
  
  // Would add more factors based on actual contribution data
  return Math.min(100, score);
}

function calculateEngagementScore(member: TeamMember, resonance: number): number {
  // Base engagement from resonance
  let score = resonance;
  
  // Adjust for activity status
  if (member.status === 'active') {
    score += 10;
  } else if (member.status === 'away') {
    score -= 20;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Get recommended actions based on team resonance
 */
export function getResonanceRecommendations(
  teamResonance: TeamResonanceScore
): string[] {
  const recommendations: string[] = [];
  
  if (teamResonance.overallResonance < 50) {
    recommendations.push('Schedule a team retrospective to identify pain points');
    recommendations.push('Review and clarify team goals and individual responsibilities');
  }
  
  if (teamResonance.harmony.cohesion < 60) {
    recommendations.push('Organize team-building activities to strengthen bonds');
    recommendations.push('Create more opportunities for cross-functional collaboration');
  }
  
  if (teamResonance.harmony.engagement < 60) {
    recommendations.push('Recognize and celebrate recent team achievements');
    recommendations.push('Rotate assignments to keep work interesting');
  }
  
  if (teamResonance.discordWarnings.length > 2) {
    recommendations.push('Address multiple discord warnings as a priority');
    recommendations.push('Consider bringing in a facilitator for team dynamics');
  }
  
  return recommendations;
}
