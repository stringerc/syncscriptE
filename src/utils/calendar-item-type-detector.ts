/**
 * Calendar Item Type Detector
 * 
 * Auto-detects whether a calendar item should be displayed as:
 * - Event (fixed commitments, meetings)
 * - Task (flexible work items)
 * - Goal (milestones, objectives)
 * 
 * Based on event properties and metadata.
 */

import { Event } from './event-task-types';

export type CalendarItemType = 'event' | 'task' | 'goal';

/**
 * Determine the visual type of a calendar item
 * 
 * Detection Logic:
 * 1. Check explicit flags (category, eventType)
 * 2. Check if created from task (isConvertedToEvent)
 * 3. Check event type and category keywords
 * 4. Default to 'event' for standard calendar items
 */
export function detectCalendarItemType(event: Event): CalendarItemType {
  // PRIORITY 1: Explicit goal indicators
  if (event.category?.toLowerCase().includes('goal') || 
      event.category?.toLowerCase().includes('milestone') ||
      event.category?.toLowerCase().includes('objective')) {
    return 'goal';
  }
  
  // PRIORITY 2: Task-related indicators
  // - Created from a task
  // - Has "task" in category
  // - Event type is "deadline" (tasks have deadlines)
  if (event.createdFromTaskId ||
      event.category?.toLowerCase().includes('task') ||
      event.category?.toLowerCase().includes('work') ||
      event.eventType === 'deadline') {
    return 'task';
  }
  
  // PRIORITY 3: Goal-related event types
  // Milestones and achievements are goals
  if (event.title?.toLowerCase().includes('milestone') ||
      event.title?.toLowerCase().includes('achievement') ||
      event.title?.toLowerCase().includes('target reached')) {
    return 'goal';
  }
  
  // PRIORITY 4: Task-related event types
  // Single-person work blocks without meetings
  if (event.eventType !== 'meeting' && 
      event.eventType !== 'social' &&
      (!event.teamMembers || event.teamMembers.length <= 1) &&
      event.title?.toLowerCase().includes('focus')) {
    return 'task';
  }
  
  // DEFAULT: Standard events (meetings, appointments, etc.)
  return 'event';
}

/**
 * Batch detect types for multiple events
 * Useful for processing calendar data efficiently
 */
export function detectCalendarItemTypes(events: Event[]): Map<string, CalendarItemType> {
  const typeMap = new Map<string, CalendarItemType>();
  
  events.forEach(event => {
    typeMap.set(event.id, detectCalendarItemType(event));
  });
  
  return typeMap;
}

/**
 * Get human-readable label for item type
 */
export function getItemTypeLabel(type: CalendarItemType): string {
  const labels = {
    event: 'Event',
    task: 'Task',
    goal: 'Goal',
  };
  
  return labels[type];
}

/**
 * Get description for item type (for tooltips/help)
 */
export function getItemTypeDescription(type: CalendarItemType): string {
  const descriptions = {
    event: 'Fixed commitments like meetings, appointments, and blocked time',
    task: 'Flexible work items that can be easily rescheduled based on energy',
    goal: 'Milestones, objectives, and achievement targets',
  };
  
  return descriptions[type];
}
