/**
 * Resonance Calculus Core Engine
 * 
 * Based on Coherence-Weighted Service Curves (CWSC) framework
 * Implements: c(t) × β(t) where:
 * - c(t) = coherence factor (alignment between task and context)
 * - β(t) = base service curve (circadian productivity pattern)
 * 
 * Pragmatic implementation focusing on user value over mathematical rigor.
 */

import { Task } from '../types/task';
import { Event } from '../utils/event-task-types';

// ============================================================================
// TYPES
// ============================================================================

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  hour: number;
  duration: number; // minutes
  naturalEnergy: 'high' | 'medium' | 'low';
}

export interface UserContext {
  currentTime: Date;
  schedule: Event[];
  completedTasksToday: number;
  recentTaskSwitches: number; // in last 2 hours
  cognitiveLoad: number; // 0-1
  previousTask?: Task;
  nextEvent?: Event;
  dayStart: Date;
}

export interface CoherenceFactors {
  energyAlignment: number;    // 0-1: Task energy requirement vs. slot energy
  contextMatch: number;        // 0-1: Right tools/people/resources available
  scheduleFlow: number;        // 0-1: Compatibility with adjacent tasks
  timingOptimal: number;       // 0-1: Circadian rhythm alignment
}

export interface ResonanceScore {
  overall: number;             // 0-1: Final resonance score
  coherence: number;           // 0-1: c(t) - alignment factor
  serviceLevel: number;        // 0-1: β(t) - base productivity
  components: CoherenceFactors;
  recommendation: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  confidence: number;          // 0-1: How confident we are in this score
}

// ============================================================================
// CIRCADIAN RHYTHM - β(t)
// Based on research: Two-Process Model (Borbély, 1982)
// ============================================================================

/**
 * Circadian performance curve β(t)
 * Returns β(t) value between 0-1
 * 
 * RESEARCH-BASED COSINOR MODEL:
 * Based on the gold-standard circadian rhythm model (Refinetti, 2006; Folkard & Monk, 1985)
 * 
 * Formula: Performance(t) = MESOR + Amplitude × cos(2π × (t - acrophase) / 24)
 * 
 * Key characteristics:
 * - ONE MAIN ARCH ABOVE threshold (0.65): Morning/afternoon peak
 * - ONE MAIN ARCH BELOW threshold (0.65): Night/early morning trough
 * - MESOR = 0.65 (threshold line - the midpoint of performance)
 * - Peak (acrophase) = 10-11 AM (~15-16 hours after midnight)
 * - Trough = 3-4 AM (lowest performance during sleep)
 * - Smooth sinusoidal curve (no jagged edges)
 * 
 * This single-wave model is validated by:
 * - Core body temperature rhythms (Kleitman, 1963)
 * - Cognitive performance studies (Folkard, 1975)
 * - Reaction time measurements (Blake, 1967)
 * - Circadian physiology research (Refinetti, 2006)
 */
export function getCircadianCurve(hour: number): number {
  // Cosinor model parameters (research-validated)
  const MESOR = 0.65;           // Midline Estimating Statistic Of Rhythm (our threshold)
  const AMPLITUDE = 0.30;       // Peak-to-trough range (0.65 ± 0.30 = 0.35 to 0.95)
  const ACROPHASE = 10.5;       // Peak at 10:30 AM (optimal cognitive performance)
  const PERIOD = 24;            // 24-hour cycle
  
  // Classic cosinor formula: M + A × cos(2π × (t - φ) / T)
  // We use (acrophase - hour) to create peak at acrophase time
  const radians = (2 * Math.PI * (hour - ACROPHASE)) / PERIOD;
  const value = MESOR + (AMPLITUDE * Math.cos(radians));
  
  // Clamp to valid range [0.30, 0.95] for safety
  return Math.max(0.30, Math.min(0.95, value));
}

/**
 * Adjust circadian curve based on user's chronotype
 * Future enhancement: personalize based on historical data
 */
export function getPersonalizedCircadianCurve(
  hour: number, 
  chronotype: 'morning' | 'evening' | 'neutral' = 'neutral'
): number {
  const baseCurve = getCircadianCurve(hour);
  
  if (chronotype === 'morning') {
    // Shift peak earlier
    if (hour >= 7 && hour < 9) return Math.min(1.0, baseCurve + 0.1);
    if (hour >= 20) return Math.max(0.3, baseCurve - 0.1);
  } else if (chronotype === 'evening') {
    // Shift peak later
    if (hour >= 16 && hour < 20) return Math.min(1.0, baseCurve + 0.1);
    if (hour >= 7 && hour < 10) return Math.max(0.6, baseCurve - 0.1);
  }
  
  return baseCurve;
}

// ============================================================================
// ULTRADIAN RHYTHM - 90-120 Minute Cycles
// Based on BRAC (Basic Rest-Activity Cycle) - Kleitman
// ============================================================================

/**
 * Calculate position in ultradian cycle
 * Peak performance at 30-60 min into 90-min cycle
 * Dip at 80-90 min (need for break)
 */
export function getUltradianPhase(currentTime: Date, dayStart: Date): number {
  const minutesSinceDayStart = (currentTime.getTime() - dayStart.getTime()) / 60000;
  const cyclePosition = (minutesSinceDayStart % 90) / 90; // 0-1 position in cycle
  
  // Peak performance: 33-67% through cycle
  if (cyclePosition >= 0.33 && cyclePosition <= 0.67) return 1.0;
  
  // Dip: 85-100% through cycle (need break)
  if (cyclePosition >= 0.85) return 0.65;
  
  // Ramp up: 0-33% through cycle
  if (cyclePosition < 0.33) return 0.80 + (cyclePosition / 0.33) * 0.20;
  
  // Decline: 67-85% through cycle
  return 1.0 - ((cyclePosition - 0.67) / 0.18) * 0.35;
}

// ============================================================================
// COGNITIVE LOAD - Task Switching Cost
// Based on Mark et al. (2008): 23 minutes to refocus after interruption
// ============================================================================

/**
 * Calculate current cognitive load
 * Higher load = reduced capacity for additional work
 * 
 * Factors:
 * - Recent task switches (each switch adds load)
 * - Active concurrent tasks (beyond 3 tasks adds load)
 * - Time since last break
 */
export function calculateCognitiveLoad(context: UserContext): number {
  let load = 0.0;
  
  // Recent task switches penalty (each switch = 15% load)
  load += Math.min(0.45, context.recentTaskSwitches * 0.15);
  
  // Concurrent tasks penalty (beyond 3 tasks)
  const activeTasks = context.completedTasksToday;
  if (activeTasks > 3) {
    load += Math.min(0.30, (activeTasks - 3) * 0.10);
  }
  
  // Heavy schedule penalty
  const upcomingEventsNext2Hours = context.schedule.filter(event => {
    const eventStart = new Date(event.startTime);
    const twoHoursFromNow = new Date(context.currentTime.getTime() + 2 * 60 * 60 * 1000);
    return eventStart >= context.currentTime && eventStart <= twoHoursFromNow;
  }).length;
  
  if (upcomingEventsNext2Hours > 3) {
    load += 0.20;
  }
  
  return Math.min(1.0, load);
}

// ============================================================================
// COHERENCE FACTOR - c(t)
// Core alignment metric combining multiple factors
// ============================================================================

/**
 * Calculate energy alignment
 * How well does task's energy requirement match the time slot's natural energy?
 */
export function calculateEnergyAlignment(
  taskEnergyLevel: 'high' | 'medium' | 'low',
  slotNaturalEnergy: 'high' | 'medium' | 'low'
): number {
  const energyMap = { high: 3, medium: 2, low: 1 };
  const taskEnergy = energyMap[taskEnergyLevel];
  const slotEnergy = energyMap[slotNaturalEnergy];
  
  const difference = Math.abs(taskEnergy - slotEnergy);
  
  // Perfect match
  if (difference === 0) return 1.0;
  
  // One level off
  if (difference === 1) return 0.70;
  
  // Two levels off (high task in low slot or vice versa)
  return 0.40;
}

/**
 * Calculate context match
 * Are the right resources, tools, and people available?
 */
export function calculateContextMatch(
  task: Task,
  timeSlot: TimeSlot,
  context: UserContext
): number {
  let score = 0.5; // Base score
  
  // Check if collaborators are available (for team tasks)
  if (task.collaborators && task.collaborators.length > 0) {
    // Assume meetings scheduled = people available
    const hasCollaboratorMeeting = context.schedule.some(event => {
      const eventStart = new Date(event.startTime);
      return Math.abs(eventStart.getTime() - timeSlot.startTime.getTime()) < 30 * 60 * 1000;
    });
    
    if (hasCollaboratorMeeting) score += 0.30;
    else score -= 0.20; // Penalty if team task but no meeting
  } else {
    // Solo task - bonus if no interruptions expected
    score += 0.20;
  }
  
  // Duration match
  const taskDuration = task.estimatedDuration || 60;
  const slotDuration = timeSlot.duration;
  const durationRatio = slotDuration / taskDuration;
  
  if (durationRatio >= 1.2 && durationRatio <= 1.5) {
    score += 0.20; // Ideal - some buffer
  } else if (durationRatio >= 1.0) {
    score += 0.10; // Adequate
  } else {
    score -= 0.20; // Not enough time
  }
  
  return Math.max(0, Math.min(1, score));
}

/**
 * Calculate schedule flow
 * How well does this task fit with adjacent tasks?
 */
export function calculateScheduleFlow(
  task: Task,
  context: UserContext
): number {
  let score = 0.7; // Base score
  
  // Check compatibility with previous task
  if (context.previousTask) {
    const similarContext = isSimilarContext(task, context.previousTask);
    if (similarContext) {
      score += 0.20; // Bonus for context continuity
    } else {
      score -= 0.15; // Penalty for context switch
    }
  }
  
  // Check if next event is too close (< 15 min buffer)
  if (context.nextEvent) {
    const nextEventStart = new Date(context.nextEvent.startTime);
    const currentTime = context.currentTime;
    const bufferMinutes = (nextEventStart.getTime() - currentTime.getTime()) / 60000;
    
    if (bufferMinutes < 15) {
      score -= 0.25; // Penalty for tight schedule
    } else if (bufferMinutes >= 30) {
      score += 0.10; // Bonus for good buffer
    }
  }
  
  return Math.max(0, Math.min(1, score));
}

/**
 * Check if two tasks share similar context (reduce switching cost)
 */
function isSimilarContext(task1: Task, task2: Task): boolean {
  // Same category
  if (task1.category === task2.category) return true;
  
  // Similar energy levels
  if (task1.energyLevel === task2.energyLevel) return true;
  
  // Both are focus work
  const isFocus1 = task1.title.toLowerCase().includes('focus') || 
                   task1.title.toLowerCase().includes('deep work');
  const isFocus2 = task2.title.toLowerCase().includes('focus') || 
                   task2.title.toLowerCase().includes('deep work');
  if (isFocus1 && isFocus2) return true;
  
  return false;
}

/**
 * Calculate timing optimality
 * Combines circadian and ultradian rhythms
 */
export function calculateTimingOptimal(
  timeSlot: TimeSlot,
  context: UserContext
): number {
  // Circadian component (70% weight)
  const circadian = getCircadianCurve(timeSlot.hour);
  
  // Ultradian component (30% weight)
  const ultradian = getUltradianPhase(timeSlot.startTime, context.dayStart);
  
  return circadian * 0.70 + ultradian * 0.30;
}

/**
 * Calculate complete coherence factor c(t)
 * Combines all alignment metrics
 */
export function calculateCoherence(
  task: Task,
  timeSlot: TimeSlot,
  context: UserContext
): CoherenceFactors {
  return {
    energyAlignment: calculateEnergyAlignment(
      task.energyLevel,
      timeSlot.naturalEnergy
    ),
    contextMatch: calculateContextMatch(task, timeSlot, context),
    scheduleFlow: calculateScheduleFlow(task, context),
    timingOptimal: calculateTimingOptimal(timeSlot, context),
  };
}

// ============================================================================
// RESONANCE SCORE CALCULATION - Main Function
// Implements: R = c(t) × β(t) with cognitive load adjustment
// ============================================================================

/**
 * Calculate resonance score for a task in a specific time slot
 * This is the core resonance calculus function
 * 
 * Formula: R = c_avg × β(t) × (1 - cognitive_load_penalty)
 */
export function calculateResonanceScore(
  task: Task,
  timeSlot: TimeSlot,
  context: UserContext
): ResonanceScore {
  // 1. Calculate coherence factors c(t)
  const coherenceFactors = calculateCoherence(task, timeSlot, context);
  
  // Average coherence (equal weighting for now)
  const coherenceAvg = (
    coherenceFactors.energyAlignment +
    coherenceFactors.contextMatch +
    coherenceFactors.scheduleFlow +
    coherenceFactors.timingOptimal
  ) / 4;
  
  // 2. Get base service curve β(t)
  const serviceLevel = getCircadianCurve(timeSlot.hour);
  
  // 3. Calculate cognitive load penalty
  const cognitiveLoad = calculateCognitiveLoad(context);
  const loadPenalty = cognitiveLoad * 0.20; // Max 20% penalty
  
  // 4. Core formula: R = c(t) × β(t) × (1 - load_penalty)
  let overallScore = coherenceAvg * serviceLevel * (1 - loadPenalty);
  
  // 5. Apply additional multipliers
  
  // Penalty for overload (>12 tasks today)
  if (context.completedTasksToday > 12) {
    overallScore *= 0.85;
  }
  
  // Bonus for perfect energy match
  if (task.energyLevel === timeSlot.naturalEnergy) {
    overallScore *= 1.10;
  }
  
  // Penalty for excessive context switching
  if (context.recentTaskSwitches > 3) {
    overallScore *= 0.90;
  }
  
  // 6. Clamp to 0-1 range
  overallScore = Math.max(0, Math.min(1, overallScore));
  
  // 7. Determine recommendation category
  let recommendation: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  if (overallScore >= 0.85) recommendation = 'excellent';
  else if (overallScore >= 0.70) recommendation = 'good';
  else if (overallScore >= 0.50) recommendation = 'fair';
  else if (overallScore >= 0.30) recommendation = 'poor';
  else recommendation = 'critical';
  
  // 8. Calculate confidence (higher with more data/context)
  let confidence = 0.7; // Base confidence
  if (context.previousTask) confidence += 0.1;
  if (context.schedule.length > 3) confidence += 0.1;
  if (task.dueDate) confidence += 0.1;
  confidence = Math.min(1.0, confidence);
  
  return {
    overall: overallScore,
    coherence: coherenceAvg,
    serviceLevel: serviceLevel,
    components: coherenceFactors,
    recommendation,
    confidence,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get color for resonance score (for UI)
 */
export function getResonanceColor(score: number): string {
  if (score >= 0.85) return '#10b981'; // Green - Excellent
  if (score >= 0.70) return '#14b8a6'; // Teal - Good
  if (score >= 0.50) return '#f59e0b'; // Orange - Fair
  if (score >= 0.30) return '#ef4444'; // Red - Poor
  return '#991b1b'; // Dark Red - Critical
}

/**
 * Get label for resonance score
 */
export function getResonanceLabel(score: number): string {
  if (score >= 0.85) return 'Excellent';
  if (score >= 0.70) return 'Good';
  if (score >= 0.50) return 'Fair';
  if (score >= 0.30) return 'Poor';
  return 'Critical';
}

/**
 * Get recommendation text
 */
export function getRecommendationText(score: number, timeSlot: TimeSlot): string {
  if (score >= 0.85) {
    return `Perfect time! Peak performance window at ${timeSlot.hour}:00.`;
  }
  if (score >= 0.70) {
    return `Good slot. You should be productive at ${timeSlot.hour}:00.`;
  }
  if (score >= 0.50) {
    return `Acceptable, but not optimal. Consider earlier or later.`;
  }
  if (score >= 0.30) {
    return `Poor timing. Reschedule to 9-11 AM or 3-5 PM for better results.`;
  }
  return `Critical mismatch. Strongly recommend rescheduling.`;
}

/**
 * Generate next 24 hours of time slots
 */
export function generateTimeSlots(startTime: Date, intervalMinutes: number = 60): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const currentTime = new Date(startTime);
  
  for (let i = 0; i < 24; i++) {
    const slotStart = new Date(currentTime);
    const slotEnd = new Date(currentTime.getTime() + intervalMinutes * 60 * 1000);
    const hour = slotStart.getHours();
    
    // Determine natural energy based on circadian curve
    const circadianValue = getCircadianCurve(hour);
    let naturalEnergy: 'high' | 'medium' | 'low';
    if (circadianValue >= 0.85) naturalEnergy = 'high';
    else if (circadianValue >= 0.70) naturalEnergy = 'medium';
    else naturalEnergy = 'low';
    
    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
      hour,
      duration: intervalMinutes,
      naturalEnergy,
    });
    
    currentTime.setHours(currentTime.getHours() + 1);
  }
  
  return slots;
}

/**
 * Calculate overall resonance score for a schedule (aggregate across all tasks)
 * This provides a single metric for how well the entire schedule aligns
 * 
 * ENHANCED: Now includes calendar events in the calculation for complete accuracy
 */
export function calculateOverallResonance(
  tasks: Task[],
  events: any[] // Calendar events to include in resonance calculation
): number {
  // Filter to only scheduled, non-completed tasks
  const scheduledTasks = tasks.filter(t => t.scheduledTime && !t.completed);
  
  if (scheduledTasks.length === 0) {
    // No scheduled tasks - return neutral/good score
    return 0.75;
  }
  
  // Calculate resonance for each task
  const scores: number[] = [];
  
  for (const task of scheduledTasks) {
    const scheduledDate = new Date(task.scheduledTime!);
    const hour = scheduledDate.getHours();
    
    // Create a minimal TimeSlot
    const timeSlot: TimeSlot = {
      startTime: scheduledDate,
      endTime: new Date(scheduledDate.getTime() + 60 * 60 * 1000), // 1 hour default
      hour,
      duration: 60,
      naturalEnergy: getEnergyLevelForHour(hour),
    };
    
    // Create a UserContext with REAL events for better accuracy
    const context: UserContext = {
      currentTime: new Date(),
      dayStart: new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate(), 7, 0),
      schedule: events || [], // NOW USING REAL EVENTS
      completedTasksToday: tasks.filter(t => t.completed).length,
      recentTaskSwitches: 0,
      cognitiveLoad: 0,
    };
    
    // Calculate resonance score
    const resonance = calculateResonanceScore(task, timeSlot, context);
    scores.push(resonance.overall);
  }
  
  // Return average resonance
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return average;
}

/**
 * Helper: Determine natural energy level for an hour of the day
 */
export function getEnergyLevelForHour(hour: number): 'high' | 'medium' | 'low' {
  const circadianValue = getCircadianCurve(hour);
  if (circadianValue >= 0.75) return 'high';
  if (circadianValue >= 0.50) return 'medium';
  return 'low';
}