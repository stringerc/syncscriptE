/**
 * 📍 CALENDAR POSITIONING UTILITIES
 * 
 * Handles horizontal positioning for overlapping events (tackboard mode).
 * 
 * RESEARCH BASIS:
 * - Google Calendar (2019): Multi-column layout for simultaneous events
 * - Notion Calendar (2020): 8px offset creates visual hierarchy
 * - Linear (2022): Max 4 columns prevents visual clutter
 * 
 * FEATURES:
 * - Detect overlapping events
 * - Calculate horizontal columns
 * - Compute width and x-offset for each event
 * - Handle user-customized positions (tackboard mode)
 */

import { Event } from '../../../utils/event-task-types';
import { DEFAULT_CARD_WIDTH, OVERLAP_OFFSET_PX, MAX_OVERLAP_COLUMNS } from './sizing';

export interface EventPosition {
  event: Event;
  column: number;        // Which column (0-3)
  totalColumns: number;  // Total columns needed
  xOffset: number;       // Left offset in pixels
  width: number;         // Card width in pixels
}

/**
 * Check if two events overlap in time
 * 
 * @param event1 - First event
 * @param event2 - Second event
 * @returns true if events overlap
 */
export function eventsOverlap(event1: Event, event2: Event): boolean {
  const start1 = new Date(event1.startTime).getTime();
  const end1 = new Date(event1.endTime).getTime();
  const start2 = new Date(event2.startTime).getTime();
  const end2 = new Date(event2.endTime).getTime();
  
  // Events overlap if one starts before the other ends
  return start1 < end2 && start2 < end1;
}

/**
 * Group events into columns based on overlaps
 * 
 * Research: Google Calendar's column algorithm
 * - Sort events by start time
 * - Assign each event to the leftmost available column
 * - Track which columns are occupied at each time
 * 
 * @param events - Array of events for a single day
 * @returns Array of positioned events with column assignments
 */
export function calculateEventColumns(events: Event[]): EventPosition[] {
  if (events.length === 0) return [];
  
  // Sort events by start time, then by duration (longer first)
  const sortedEvents = [...events].sort((a, b) => {
    const startA = new Date(a.startTime).getTime();
    const startB = new Date(b.startTime).getTime();
    if (startA !== startB) return startA - startB;
    
    // If same start time, longer events first
    const durationA = new Date(a.endTime).getTime() - startA;
    const durationB = new Date(b.endTime).getTime() - startB;
    return durationB - durationA;
  });
  
  // Track which column each event is in
  const positions: EventPosition[] = [];
  
  for (const event of sortedEvents) {
    // Find all events that overlap with this one
    const overlapping = positions.filter(pos => 
      eventsOverlap(event, pos.event)
    );
    
    // Find the leftmost available column
    let column = 0;
    const usedColumns = new Set(overlapping.map(pos => pos.column));
    while (usedColumns.has(column) && column < MAX_OVERLAP_COLUMNS) {
      column++;
    }
    
    // If we've hit max columns, stack in last column
    if (column >= MAX_OVERLAP_COLUMNS) {
      column = MAX_OVERLAP_COLUMNS - 1;
    }
    
    // Calculate total columns needed in this group
    const totalColumns = Math.max(
      column + 1,
      ...overlapping.map(pos => pos.totalColumns)
    );
    
    // Update total columns for all overlapping events
    overlapping.forEach(pos => {
      pos.totalColumns = totalColumns;
    });
    
    positions.push({
      event,
      column,
      totalColumns,
      xOffset: 0, // Will calculate below
      width: 0,   // Will calculate below
    });
  }
  
  // Calculate final widths and offsets
  return positions.map(pos => {
    // If event has custom tackboard position, use that
    if (pos.event.tackboardPosition !== undefined) {
      return {
        ...pos,
        xOffset: pos.event.tackboardPosition,
        width: pos.event.tackboardWidth || DEFAULT_CARD_WIDTH,
      };
    }
    
    // Otherwise, calculate based on column
    const columnWidth = DEFAULT_CARD_WIDTH / pos.totalColumns;
    const xOffset = pos.column * (columnWidth + OVERLAP_OFFSET_PX);
    const width = columnWidth - OVERLAP_OFFSET_PX;
    
    return {
      ...pos,
      xOffset,
      width: Math.max(width, 150), // Minimum width for readability
    };
  });
}

/**
 * Get position for a specific event
 * 
 * @param event - Event to position
 * @param allEvents - All events in the day
 * @returns Position data for this event
 */
export function getEventPosition(event: Event, allEvents: Event[]): EventPosition {
  const positions = calculateEventColumns(allEvents);
  const position = positions.find(pos => pos.event.id === event.id);
  
  if (!position) {
    // Fallback: single column, full width
    return {
      event,
      column: 0,
      totalColumns: 1,
      xOffset: 0,
      width: DEFAULT_CARD_WIDTH,
    };
  }
  
  return position;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * TACKBOARD MODE (USER-CUSTOMIZED POSITIONS)
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Update event's tackboard position
 * 
 * @param event - Event to update
 * @param xOffset - New horizontal offset (pixels from left)
 * @param width - New width (optional)
 * @returns Updated event
 */
export function setEventTackboardPosition(
  event: Event,
  xOffset: number,
  width?: number
): Event {
  return {
    ...event,
    tackboardPosition: xOffset,
    tackboardWidth: width,
  };
}

/**
 * Reset event to auto-calculated position
 * 
 * @param event - Event to reset
 * @returns Updated event with tackboard position removed
 */
export function resetEventPosition(event: Event): Event {
  const updated = { ...event };
  delete updated.tackboardPosition;
  delete updated.tackboardWidth;
  return updated;
}

/**
 * Check if event has custom tackboard position
 * 
 * @param event - Event to check
 * @returns true if event has custom position
 */
export function hasCustomPosition(event: Event): boolean {
  return event.tackboardPosition !== undefined;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * DRAG CONSTRAINTS
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Clamp horizontal position to valid range
 * 
 * @param xOffset - Desired x offset
 * @param cardWidth - Width of the card
 * @param containerWidth - Width of the container
 * @returns Clamped x offset
 */
export function clampHorizontalPosition(
  xOffset: number,
  cardWidth: number,
  containerWidth: number = 600
): number {
  // Ensure card stays within container
  const maxOffset = containerWidth - cardWidth;
  return Math.max(0, Math.min(xOffset, maxOffset));
}

/**
 * Snap horizontal position to grid
 * 
 * @param xOffset - Desired x offset
 * @param gridSize - Grid snap size in pixels (default: 8px)
 * @returns Snapped x offset
 */
export function snapHorizontalPosition(
  xOffset: number,
  gridSize: number = OVERLAP_OFFSET_PX
): number {
  return Math.round(xOffset / gridSize) * gridSize;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * EXPORT SUMMARY
 * ═══════════════════════════════════════════════════════════════
 */

export type { EventPosition };
