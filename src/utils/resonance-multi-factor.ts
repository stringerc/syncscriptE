/**
 * Multi-Factor Resonance Scoring
 * 
 * Implements: R_i(t) = w_S·S(t) + w_H·H(t) + w_C·C(t)
 * Where:
 * - S(t) = System-centric score (schedule efficiency, performance metrics)
 * - H(t) = Human-centric score (user feedback, preferences, satisfaction)
 * - C(t) = Context-centric score (environment, resources, external factors)
 * 
 * Based on Resonance Calculus framework Section 5.1
 */

import { Task } from '../types/task';
import { Event } from '../utils/event-task-types';
import { calculateResonanceScore, UserContext, TimeSlot } from './resonance-calculus';

// ============================================================================
// TYPES
// ============================================================================

export interface SubsystemResonance {
  systemScore: number;          // 0-1: Technical/schedule metrics
  humanScore: number;           // 0-1: User satisfaction/feedback
  contextScore: number;         // 0-1: Environmental factors
  overallResonance: number;     // 0-1: Weighted combination
  weights: {
    system: number;             // Default: 0.4
    human: number;              // Default: 0.3
    context: number;            // Default: 0.3
  };
  subsystemName: string;
  timestamp: Date;
}

export interface GlobalResonance {
  overall: number;              // 0-1: System-wide resonance
  subsystems: SubsystemResonance[];
  dominantFactors: string[];    // What's driving the score
  recommendations: string[];
  timestamp: Date;
}

export interface UserFeedback {
  taskId: string;
  completionQuality: number;    // 1-5 rating
  actualProductivity: number;   // Self-reported 0-1
  schedulingWasGood: boolean;
  comments?: string;
  timestamp: Date;
}

export interface PerformanceMetrics {
  taskCompletionRate: number;   // 0-1: % tasks completed on time
  avgTaskSwitches: number;       // Lower is better
  scheduleAdherence: number;    // 0-1: How well user follows schedule
  energyAlignment: number;      // 0-1: Tasks matched to energy levels
  bufferTime: number;           // Average minutes between tasks
}

// ============================================================================
// SYSTEM-CENTRIC SCORE - S(t)
// Technical and schedule-based metrics
// ============================================================================

/**
 * Calculate system-centric score
 * Based on schedule efficiency, task distribution, and technical metrics
 */
export function calculateSystemScore(
  schedule: Event[],
  tasks: Task[],
  metrics: PerformanceMetrics
): number {
  let score = 0.0;
  
  // 1. Task completion rate (25%)
  score += metrics.taskCompletionRate * 0.25;
  
  // 2. Schedule quality (25%)
  // Penalize excessive context switches
  const switchPenalty = Math.min(1.0, metrics.avgTaskSwitches / 10);
  score += (1 - switchPenalty) * 0.25;
  
  // 3. Energy alignment (25%)
  score += metrics.energyAlignment * 0.25;
  
  // 4. Buffer time adequacy (15%)
  // Ideal buffer: 15-20 minutes
  const bufferScore = metrics.bufferTime >= 15 && metrics.bufferTime <= 20 
    ? 1.0 
    : Math.max(0, 1 - Math.abs(metrics.bufferTime - 17.5) / 17.5);
  score += bufferScore * 0.15;
  
  // 5. Schedule balance (10%)
  // Not overloaded, not underutilized
  const taskCount = tasks.filter(t => !t.completed).length;
  const balanceScore = taskCount >= 4 && taskCount <= 8 
    ? 1.0 
    : taskCount < 4 
      ? taskCount / 4 
      : Math.max(0, 1 - (taskCount - 8) / 8);
  score += balanceScore * 0.10;
  
  return Math.max(0, Math.min(1, score));
}

/**
 * Calculate schedule fragmentation
 * Lower is better - indicates less context switching
 */
export function calculateFragmentation(schedule: Event[]): number {
  if (schedule.length < 2) return 0.0;
  
  const sortedEvents = [...schedule].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  
  let totalGaps = 0;
  let gapCount = 0;
  
  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const end = new Date(sortedEvents[i].endTime);
    const nextStart = new Date(sortedEvents[i + 1].startTime);
    const gapMinutes = (nextStart.getTime() - end.getTime()) / 60000;
    
    if (gapMinutes < 60) { // Only count gaps < 1 hour
      totalGaps += gapMinutes;
      gapCount++;
    }
  }
  
  const avgGap = gapCount > 0 ? totalGaps / gapCount : 30;
  
  // Fragmentation score: 0 = ideal (15-20 min gaps), 1 = highly fragmented
  return Math.abs(avgGap - 17.5) / 17.5;
}

// ============================================================================
// HUMAN-CENTRIC SCORE - H(t)
// User satisfaction, preferences, and feedback
// ============================================================================

/**
 * Calculate human-centric score
 * Based on user feedback, satisfaction, and historical preferences
 */
export function calculateHumanScore(
  recentFeedback: UserFeedback[],
  userPreferences: {
    preferredWorkHours?: [number, number];  // e.g., [9, 17] for 9 AM - 5 PM
    preferredBreakLength?: number;          // minutes
    maxMeetingsPerDay?: number;
  } = {}
): number {
  let score = 0.5; // Base score if no feedback
  
  if (recentFeedback.length === 0) {
    return score;
  }
  
  // 1. Average completion quality (40%)
  const avgQuality = recentFeedback.reduce((sum, f) => sum + f.completionQuality, 0) / 
                     recentFeedback.length / 5; // Normalize to 0-1
  score = avgQuality * 0.40;
  
  // 2. Average self-reported productivity (30%)
  const avgProductivity = recentFeedback.reduce((sum, f) => sum + f.actualProductivity, 0) / 
                          recentFeedback.length;
  score += avgProductivity * 0.30;
  
  // 3. Scheduling satisfaction (30%)
  const satisfactionRate = recentFeedback.filter(f => f.schedulingWasGood).length / 
                           recentFeedback.length;
  score += satisfactionRate * 0.30;
  
  return Math.max(0, Math.min(1, score));
}

/**
 * Get user satisfaction trend
 * Returns 'improving', 'stable', or 'declining'
 */
export function getUserSatisfactionTrend(feedback: UserFeedback[]): 'improving' | 'stable' | 'declining' {
  if (feedback.length < 4) return 'stable';
  
  // Compare first half to second half
  const midpoint = Math.floor(feedback.length / 2);
  const firstHalf = feedback.slice(0, midpoint);
  const secondHalf = feedback.slice(midpoint);
  
  const avgFirst = firstHalf.reduce((sum, f) => sum + f.completionQuality, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((sum, f) => sum + f.completionQuality, 0) / secondHalf.length;
  
  const change = avgSecond - avgFirst;
  
  if (change > 0.5) return 'improving';
  if (change < -0.5) return 'declining';
  return 'stable';
}

// ============================================================================
// CONTEXT-CENTRIC SCORE - C(t)
// Environmental and external factors
// ============================================================================

/**
 * Calculate context-centric score
 * Based on environment, resources, and external conditions
 */
export function calculateContextScore(
  currentContext: {
    timeOfDay: number;                // hour (0-23)
    dayOfWeek: number;                // 0 = Sunday, 6 = Saturday
    workload: 'light' | 'normal' | 'heavy';
    interruptions: number;            // count today
    teamAvailability: number;         // 0-1
    resourceAvailability: number;     // 0-1 (tools, bandwidth, etc.)
  }
): number {
  let score = 0.0;
  
  // 1. Time of day quality (25%)
  // Prefer standard work hours
  const isWorkHours = currentContext.timeOfDay >= 8 && currentContext.timeOfDay < 18;
  score += (isWorkHours ? 1.0 : 0.5) * 0.25;
  
  // 2. Day of week quality (15%)
  // Weekdays better than weekends for most work
  const isWeekday = currentContext.dayOfWeek >= 1 && currentContext.dayOfWeek <= 5;
  score += (isWeekday ? 1.0 : 0.6) * 0.15;
  
  // 3. Workload appropriateness (20%)
  const workloadScore = currentContext.workload === 'normal' ? 1.0 :
                       currentContext.workload === 'light' ? 0.8 :
                       0.5; // heavy
  score += workloadScore * 0.20;
  
  // 4. Interruption penalty (15%)
  // Penalize excessive interruptions
  const interruptionScore = Math.max(0, 1 - currentContext.interruptions / 10);
  score += interruptionScore * 0.15;
  
  // 5. Team availability (15%)
  score += currentContext.teamAvailability * 0.15;
  
  // 6. Resource availability (10%)
  score += currentContext.resourceAvailability * 0.10;
  
  return Math.max(0, Math.min(1, score));
}

// ============================================================================
// MULTI-FACTOR RESONANCE CALCULATION
// Combines S(t), H(t), C(t) with weights
// ============================================================================

/**
 * Calculate subsystem resonance
 * R_i(t) = w_S·S(t) + w_H·H(t) + w_C·C(t)
 */
export function calculateSubsystemResonance(
  systemScore: number,
  humanScore: number,
  contextScore: number,
  weights: { system: number; human: number; context: number } = {
    system: 0.40,
    human: 0.30,
    context: 0.30,
  },
  subsystemName: string = 'default'
): SubsystemResonance {
  // Normalize weights to sum to 1.0
  const totalWeight = weights.system + weights.human + weights.context;
  const normalizedWeights = {
    system: weights.system / totalWeight,
    human: weights.human / totalWeight,
    context: weights.context / totalWeight,
  };
  
  // Calculate weighted resonance
  const overallResonance = 
    normalizedWeights.system * systemScore +
    normalizedWeights.human * humanScore +
    normalizedWeights.context * contextScore;
  
  return {
    systemScore,
    humanScore,
    contextScore,
    overallResonance,
    weights: normalizedWeights,
    subsystemName,
    timestamp: new Date(),
  };
}

/**
 * Calculate global resonance across all subsystems
 * R_global(t) = Σ(w_i · R_i(t)) / Σ(w_i)
 */
export function calculateGlobalResonance(
  subsystems: Array<{
    resonance: SubsystemResonance;
    importance: number; // 0-1, how critical this subsystem is
  }>
): GlobalResonance {
  // Weighted average of subsystem resonances
  const totalImportance = subsystems.reduce((sum, s) => sum + s.importance, 0);
  const overall = subsystems.reduce(
    (sum, s) => sum + (s.resonance.overallResonance * s.importance),
    0
  ) / totalImportance;
  
  // Identify dominant factors (top 3 contributors)
  const factors: Array<{ name: string; contribution: number }> = [];
  
  subsystems.forEach(s => {
    factors.push({
      name: `${s.resonance.subsystemName} (System)`,
      contribution: s.resonance.systemScore * s.resonance.weights.system * s.importance,
    });
    factors.push({
      name: `${s.resonance.subsystemName} (Human)`,
      contribution: s.resonance.humanScore * s.resonance.weights.human * s.importance,
    });
    factors.push({
      name: `${s.resonance.subsystemName} (Context)`,
      contribution: s.resonance.contextScore * s.resonance.weights.context * s.importance,
    });
  });
  
  const dominantFactors = factors
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3)
    .map(f => f.name);
  
  // Generate recommendations
  const recommendations = generateRecommendations(subsystems, overall);
  
  return {
    overall,
    subsystems: subsystems.map(s => s.resonance),
    dominantFactors,
    recommendations,
    timestamp: new Date(),
  };
}

/**
 * Generate actionable recommendations based on resonance scores
 */
function generateRecommendations(
  subsystems: Array<{
    resonance: SubsystemResonance;
    importance: number;
  }>,
  globalScore: number
): string[] {
  const recommendations: string[] = [];
  
  // Global recommendations
  if (globalScore < 0.50) {
    recommendations.push('⚠️ System resonance is low. Consider reducing workload or rescheduling tasks.');
  } else if (globalScore >= 0.85) {
    recommendations.push('✅ Excellent resonance! You have capacity for additional high-priority work.');
  }
  
  // Subsystem-specific recommendations
  subsystems.forEach(s => {
    const r = s.resonance;
    
    // Low system score
    if (r.systemScore < 0.50) {
      recommendations.push(
        `📊 ${r.subsystemName}: Schedule efficiency is low. Consider consolidating similar tasks.`
      );
    }
    
    // Low human score
    if (r.humanScore < 0.50) {
      recommendations.push(
        `😓 ${r.subsystemName}: User satisfaction is low. Review scheduling preferences and take breaks.`
      );
    }
    
    // Low context score
    if (r.contextScore < 0.50) {
      recommendations.push(
        `🌍 ${r.subsystemName}: Context factors are unfavorable. Check for interruptions or resource issues.`
      );
    }
    
    // Imbalanced scores
    const maxScore = Math.max(r.systemScore, r.humanScore, r.contextScore);
    const minScore = Math.min(r.systemScore, r.humanScore, r.contextScore);
    if (maxScore - minScore > 0.40) {
      recommendations.push(
        `⚖️ ${r.subsystemName}: Scores are imbalanced. Focus on the weakest dimension.`
      );
    }
  });
  
  return recommendations.slice(0, 5); // Limit to top 5
}

// ============================================================================
// ADAPTIVE WEIGHT LEARNING (Future Enhancement)
// ============================================================================

/**
 * Learn optimal weights from historical data
 * Future: Implement L1-regularized regression as described in framework
 * For now: Use domain-knowledge-based defaults
 */
export function getOptimalWeights(
  historicalData: Array<{
    systemScore: number;
    humanScore: number;
    contextScore: number;
    actualPerformance: number; // 0-1, actual outcome
  }>
): { system: number; human: number; context: number } {
  // TODO: Implement sparse L1-regularized solver
  // For now, return balanced defaults
  return {
    system: 0.40,
    human: 0.30,
    context: 0.30,
  };
}

/**
 * Adjust weights based on user type or role
 */
export function getPersonalizedWeights(
  userType: 'individual' | 'team-lead' | 'executive'
): { system: number; human: number; context: number } {
  switch (userType) {
    case 'individual':
      // Individual contributors care more about personal productivity
      return { system: 0.35, human: 0.40, context: 0.25 };
    
    case 'team-lead':
      // Team leads balance personal work with context (team availability)
      return { system: 0.30, human: 0.30, context: 0.40 };
    
    case 'executive':
      // Executives prioritize context and strategic alignment
      return { system: 0.25, human: 0.25, context: 0.50 };
    
    default:
      return { system: 0.40, human: 0.30, context: 0.30 };
  }
}
