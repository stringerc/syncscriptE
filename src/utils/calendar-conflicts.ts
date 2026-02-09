/**
 * Calendar Conflict Detection
 * 
 * Research-based conflict detection following industry standards:
 * - Google Calendar: Warns about conflicts, never blocks
 * - Outlook: Shows "Scheduling Conflict" badges
 * - Apple Calendar: Visual stacking of overlapping events
 * 
 * Best Practice: DETECT and WARN, never PREVENT
 */

import { Event } from './event-task-types';

export interface ConflictInfo {
  hasConflict: boolean;
  conflictingEvents: Event[];
  overlapMinutes: number;
}

/**
 * Check if two time ranges overlap
 */
export function doTimeRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * Calculate overlap duration in minutes
 */
export function calculateOverlapMinutes(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): number {
  if (!doTimeRangesOverlap(start1, end1, start2, end2)) {
    return 0;
  }

  const overlapStart = start1 > start2 ? start1 : start2;
  const overlapEnd = end1 < end2 ? end1 : end2;
  
  return (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60);
}

/**
 * Detect conflicts for a specific event
 * Returns list of conflicting events
 */
export function detectEventConflicts(
  targetEvent: Event,
  allEvents: Event[]
): ConflictInfo {
  const conflictingEvents = allEvents.filter(event => {
    // Don't compare with itself
    if (event.id === targetEvent.id) return false;
    
    // Check if time ranges overlap
    return doTimeRangesOverlap(
      new Date(targetEvent.startTime),
      new Date(targetEvent.endTime),
      new Date(event.startTime),
      new Date(event.endTime)
    );
  });

  const totalOverlap = conflictingEvents.reduce((total, event) => {
    return total + calculateOverlapMinutes(
      new Date(targetEvent.startTime),
      new Date(targetEvent.endTime),
      new Date(event.startTime),
      new Date(event.endTime)
    );
  }, 0);

  return {
    hasConflict: conflictingEvents.length > 0,
    conflictingEvents,
    overlapMinutes: Math.round(totalOverlap),
  };
}

/**
 * Get conflict severity level
 */
export function getConflictSeverity(overlapMinutes: number): 'low' | 'medium' | 'high' {
  if (overlapMinutes < 15) return 'low';
  if (overlapMinutes < 60) return 'medium';
  return 'high';
}

/**
 * Format conflict message for display
 */
export function formatConflictMessage(conflictInfo: ConflictInfo): string {
  if (!conflictInfo.hasConflict) return '';
  
  const count = conflictInfo.conflictingEvents.length;
  const minutes = conflictInfo.overlapMinutes;
  
  if (count === 1) {
    return `Conflicts with "${conflictInfo.conflictingEvents[0].title}" (${minutes}min overlap)`;
  }
  
  return `Conflicts with ${count} events (${minutes}min total overlap)`;
}
