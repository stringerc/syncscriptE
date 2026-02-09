/**
 * 🎯 CALENDAR CARDS UTILITIES - BARREL EXPORT
 * 
 * Clean exports for all calendar card utilities.
 * 
 * USAGE:
 * import { PIXELS_PER_HOUR, calculateEventPosition } from '@/components/calendar-cards/utils';
 */

// Sizing utilities
export {
  // Constants
  PIXELS_PER_HOUR,
  PIXELS_PER_MINUTE,
  PIXELS_PER_HOUR_LEGACY,
  PIXELS_PER_MINUTE_LEGACY,
  INTERVAL_MINUTES,
  INTERVALS_PER_HOUR,
  INTERVALS_PER_DAY,
  HOURS_PER_DAY,
  DAY_HEIGHT,
  DAY_HEIGHT_LEGACY,
  MIN_CARD_HEIGHT,
  DEFAULT_CARD_WIDTH,
  CARD_PADDING,
  CARD_BORDER_WIDTH,
  OVERLAP_OFFSET_PX,
  MAX_OVERLAP_COLUMNS,
  WIDTH_PER_COLUMN,
  RESIZE_HANDLE_HEIGHT,
  RESIZE_HANDLE_HEIGHT_TOP,
  DRAG_THRESHOLD_PX,
  
  // Conversion functions
  minutesToPixels,
  pixelsToMinutes,
  hoursToPixels,
  pixelsToHours,
  
  // Position calculations
  calculateEventPosition,
  snapToInterval,
  pixelsToTime,
  timeToPixels,
  
  // Duration calculations
  calculateDurationMinutes,
  calculateDurationHours,
  
  // Validation
  isValidTime,
  clampTime,
  
  // Types
  type TimePosition,
} from './sizing';

// Positioning utilities
export {
  eventsOverlap,
  calculateEventColumns,
  getEventPosition,
  setEventTackboardPosition,
  resetEventPosition,
  hasCustomPosition,
  clampHorizontalPosition,
  snapHorizontalPosition,
  type EventPosition,
} from './positioning';
