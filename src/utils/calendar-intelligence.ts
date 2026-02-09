/**
 * Calendar Intelligence Utilities
 * 
 * TIER 1 FEATURES:
 * - Buffer time detection and warnings
 * - Focus block identification
 * - Energy level calculation
 * - Resonance scoring for events
 */

import { Event } from './event-task-types';

/**
 * Calculate buffer time between two events (in minutes)
 */
export function calculateBufferTime(event1: Event, event2: Event): number {
  const end1 = new Date(event1.endTime).getTime();
  const start2 = new Date(event2.startTime).getTime();
  
  return Math.round((start2 - end1) / (1000 * 60)); // Convert to minutes
}

/**
 * Check if buffer time is adequate (< 10 minutes triggers warning)
 */
export function hasBufferWarning(bufferMinutes: number): boolean {
  return bufferMinutes < 10 && bufferMinutes >= 0;
}

/**
 * Identify focus blocks (2+ hour blocks with no attendees)
 */
export function isFocusBlock(event: Event): boolean {
  const duration = (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
  const noAttendees = !event.teamMembers || event.teamMembers.length === 0;
  const isFocusType = event.title.toLowerCase().includes('focus') || 
                      event.title.toLowerCase().includes('deep work') ||
                      event.eventType === 'deadline';
  
  return (duration >= 2 && noAttendees) || isFocusType;
}

/**
 * Calculate energy level for an event based on time of day
 * Based on chronotype research and circadian rhythms
 */
export function calculateEnergyLevel(event: Event): 'high' | 'medium' | 'low' {
  const hour = new Date(event.startTime).getHours();
  
  // Peak energy: 9-11 AM (high)
  if (hour >= 9 && hour < 11) return 'high';
  
  // Good energy: 8 AM, 3-5 PM (medium-high)
  if (hour === 8 || (hour >= 15 && hour < 17)) return 'high';
  
  // Medium energy: 7 AM, 11 AM-12 PM, 5-6 PM
  if (hour === 7 || (hour >= 11 && hour < 13) || (hour >= 17 && hour < 18)) return 'medium';
  
  // Low energy: 1-2 PM (post-lunch), 6+ PM (evening)
  return 'low';
}

/**
 * Calculate resonance score for an event
 * Based on multiple factors:
 * - Energy alignment (does event energy requirement match time of day?)
 * - Focus block protection (is deep work scheduled during peak hours?)
 * - Buffer time (adequate breaks between meetings?)
 * - Team size (smaller meetings generally more productive)
 */
export function calculateEventResonance(
  event: Event, 
  nextEvent?: Event,
  userPeakHours?: number[]
): number {
  let score = 0.5; // Base score
  
  // Factor 1: Energy alignment (+/- 0.2)
  const eventHour = new Date(event.startTime).getHours();
  const energyLevel = calculateEnergyLevel(event);
  const isPeakHour = userPeakHours?.includes(eventHour) || (eventHour >= 9 && eventHour < 11);
  
  if (isFocusBlock(event) && isPeakHour) {
    score += 0.25; // Focus work during peak hours = excellent
  } else if (isFocusBlock(event) && energyLevel === 'low') {
    score -= 0.15; // Focus work during low energy = poor
  }
  
  // Factor 2: Meeting size (+/- 0.15)
  const attendeeCount = event.teamMembers?.length || 0;
  if (attendeeCount === 1) {
    score += 0.15; // 1:1 meetings highly productive
  } else if (attendeeCount <= 5) {
    score += 0.1; // Small meetings good
  } else if (attendeeCount > 15) {
    score -= 0.1; // Large meetings often less productive
  }
  
  // Factor 3: Buffer time (+/- 0.15)
  if (nextEvent) {
    const buffer = calculateBufferTime(event, nextEvent);
    if (buffer >= 15) {
      score += 0.15; // Good buffer
    } else if (buffer < 5) {
      score -= 0.2; // Back-to-back = stress
    }
  }
  
  // Factor 4: Event type (+/- 0.1)
  if (event.eventType === 'deadline' || isFocusBlock(event)) {
    score += 0.1; // Focus time is valuable
  } else if (event.eventType === 'social' && energyLevel === 'low') {
    score += 0.1; // Social events ok during low energy
  }
  
  // Factor 5: Task completion readiness (+/- 0.15)
  if (event.tasks && event.tasks.length > 0) {
    const completedTasks = event.tasks.filter(t => t.completed).length;
    const completionRate = completedTasks / event.tasks.length;
    
    if (completionRate >= 0.8) {
      score += 0.15; // Well prepared
    } else if (completionRate < 0.3) {
      score -= 0.15; // Underprepared
    }
  }
  
  // Clamp score between -1 and 1
  return Math.max(-1, Math.min(1, score));
}

/**
 * Analyze a day's calendar for insights
 */
export interface CalendarDayAnalysis {
  totalMeetingTime: number; // minutes
  totalFocusTime: number; // minutes
  bufferWarnings: string[]; // event IDs with insufficient buffer
  energyMismatches: string[]; // event IDs scheduled at suboptimal times
  fragmentationScore: number; // 0-100, higher = more fragmented
  recommendedChanges: string[];
}

export function analyzeDayCalendar(events: Event[]): CalendarDayAnalysis {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  
  let totalMeetingTime = 0;
  let totalFocusTime = 0;
  const bufferWarnings: string[] = [];
  const energyMismatches: string[] = [];
  const recommendedChanges: string[] = [];
  
  sortedEvents.forEach((event, index) => {
    const duration = (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60);
    
    if (isFocusBlock(event)) {
      totalFocusTime += duration;
      
      // Check if focus block is during peak hours
      const hour = new Date(event.startTime).getHours();
      if (hour < 9 || hour > 17) {
        energyMismatches.push(event.id);
        recommendedChanges.push(`Move "${event.title}" to morning peak hours (9-11 AM)`);
      }
    } else {
      totalMeetingTime += duration;
    }
    
    // Check buffer time
    if (index < sortedEvents.length - 1) {
      const buffer = calculateBufferTime(event, sortedEvents[index + 1]);
      if (hasBufferWarning(buffer)) {
        bufferWarnings.push(event.id);
        recommendedChanges.push(`Add buffer time after "${event.title}"`);
      }
    }
  });
  
  // Calculate fragmentation score
  // More events with shorter gaps = higher fragmentation
  const avgGapTime = sortedEvents.length > 1 
    ? sortedEvents.slice(0, -1).reduce((sum, event, index) => {
        return sum + calculateBufferTime(event, sortedEvents[index + 1]);
      }, 0) / (sortedEvents.length - 1)
    : 60;
  
  const fragmentationScore = Math.max(0, Math.min(100, 100 - avgGapTime));
  
  return {
    totalMeetingTime,
    totalFocusTime,
    bufferWarnings,
    energyMismatches,
    fragmentationScore,
    recommendedChanges,
  };
}

/**
 * Get suggested buffer time based on event types
 */
export function getSuggestedBufferTime(event1: Event, event2: Event): number {
  const isHighEnergyEvent1 = calculateEnergyLevel(event1) === 'high';
  const isHighEnergyEvent2 = calculateEnergyLevel(event2) === 'high';
  const isFocus1 = isFocusBlock(event1);
  const isFocus2 = isFocusBlock(event2);
  
  // After focus block: 15 minutes
  if (isFocus1) return 15;
  
  // Before focus block: 10 minutes
  if (isFocus2) return 10;
  
  // Between high-energy meetings: 15 minutes
  if (isHighEnergyEvent1 && isHighEnergyEvent2) return 15;
  
  // Default: 10 minutes
  return 10;
}
