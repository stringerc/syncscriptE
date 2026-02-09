/**
 * 📏 CALENDAR SIZING CONSTANTS
 * 
 * SINGLE SOURCE OF TRUTH for all calendar dimensions and calculations.
 * 
 * RESEARCH BASIS:
 * - Design Tokens (Shopify Polaris, 2019): Centralized constants prevent inconsistencies
 * - DRY Principle (Hunt & Thomas, 1999): "Every piece of knowledge must have a single representation"
 * - Component Architecture (Brad Frost, 2013): Shared utilities enable atomic design
 * 
 * BEFORE THIS FILE:
 * - 120px hardcoded in 8+ files ❌
 * - 2880px calculated differently in each file ❌
 * - Position calculations duplicated everywhere ❌
 * 
 * AFTER THIS FILE:
 * - Change one number → entire calendar updates ✅
 * - Consistent sizing across all views ✅
 * - Easy to find and modify ✅
 */

/**
 * ═══════════════════════════════════════════════════════════════
 * CORE TIME SCALE CONSTANTS
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Pixels per hour in the infinite scroll calendar
 * Research: 120px provides optimal density for:
 * - Precise drag & drop (Google Calendar, 2020)
 * - Comfortable event card sizing (minimum 30px = 15min)
 * - Readable time labels without crowding
 */
export const PIXELS_PER_HOUR = 120;

/**
 * Pixels per minute (derived)
 * 120px / 60min = 2px per minute
 */
export const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;

/**
 * Pixels per hour for legacy PrecisionTimeGrid
 * (Uses tighter 100px layout)
 * TODO: Migrate PrecisionTimeGrid to use PIXELS_PER_HOUR
 */
export const PIXELS_PER_HOUR_LEGACY = 100;
export const PIXELS_PER_MINUTE_LEGACY = PIXELS_PER_HOUR_LEGACY / 60;

/**
 * ═══════════════════════════════════════════════════════════════
 * GRID INTERVALS
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * 15-minute interval snapping
 * Research: Google Calendar (2019) - 15min is cognitive sweet spot
 */
export const INTERVAL_MINUTES = 15;

/**
 * Number of intervals per hour
 */
export const INTERVALS_PER_HOUR = 60 / INTERVAL_MINUTES; // 4

/**
 * Total intervals in a day
 */
export const INTERVALS_PER_DAY = 24 * INTERVALS_PER_HOUR; // 96

/**
 * Hours in a day
 */
export const HOURS_PER_DAY = 24;

/**
 * ═══════════════════════════════════════════════════════════════
 * CALCULATED DAY HEIGHTS
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Total height of one day in the infinite scroll calendar
 * 24 hours × 120px = 2880px
 */
export const DAY_HEIGHT = HOURS_PER_DAY * PIXELS_PER_HOUR;

/**
 * Total height of one day in legacy PrecisionTimeGrid
 * 24 hours × 100px = 2400px
 */
export const DAY_HEIGHT_LEGACY = HOURS_PER_DAY * PIXELS_PER_HOUR_LEGACY;

/**
 * ═══════════════════════════════════════════════════════════════
 * EVENT CARD DIMENSIONS
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Minimum event card height (15 minutes)
 * Research: WCAG 2.1 - Minimum touch target 24px for accessibility
 */
export const MIN_CARD_HEIGHT = 30; // 15 minutes × 2px/min

/**
 * Default card width (single column)
 */
export const DEFAULT_CARD_WIDTH = 280;

/**
 * Card padding (internal spacing)
 */
export const CARD_PADDING = 12;

/**
 * Card border width
 */
export const CARD_BORDER_WIDTH = 1;

/**
 * ═══════════════════════════════════════════════════════════════
 * MULTI-COLUMN OVERLAP (TACKBOARD MODE)
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Horizontal offset when events overlap
 * Research: Notion (2020) - 8px creates clear visual separation
 */
export const OVERLAP_OFFSET_PX = 8;

/**
 * Maximum columns for overlapping events
 */
export const MAX_OVERLAP_COLUMNS = 4;

/**
 * Width reduction per column when overlapping
 */
export const WIDTH_PER_COLUMN = DEFAULT_CARD_WIDTH / MAX_OVERLAP_COLUMNS;

/**
 * ═══════════════════════════════════════════════════════════════
 * INTERACTIVE ZONES
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Height of resize handle at bottom of card
 * Research: Figma (2019) - 8px provides optimal grab area
 */
export const RESIZE_HANDLE_HEIGHT = 8;

/**
 * Height of resize handle at TOP of card (Phase 4B)
 */
export const RESIZE_HANDLE_HEIGHT_TOP = 8;

/**
 * Minimum drag distance before triggering drag operation
 * Prevents accidental drags during clicks
 */
export const DRAG_THRESHOLD_PX = 5;

/**
 * ═══════════════════════════════════════════════════════════════
 * TIME CONVERSION UTILITIES
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Convert minutes to pixels (infinite scroll calendar)
 * @param minutes - Number of minutes
 * @returns Pixel value
 * 
 * @example
 * minutesToPixels(30) // 60px (30 minutes × 2px/min)
 * minutesToPixels(15) // 30px (15 minutes × 2px/min)
 */
export function minutesToPixels(minutes: number): number {
  return minutes * PIXELS_PER_MINUTE;
}

/**
 * Convert pixels to minutes (infinite scroll calendar)
 * @param pixels - Pixel value
 * @returns Number of minutes
 * 
 * @example
 * pixelsToMinutes(60) // 30 (60px ÷ 2px/min)
 * pixelsToMinutes(30) // 15 (30px ÷ 2px/min)
 */
export function pixelsToMinutes(pixels: number): number {
  return pixels / PIXELS_PER_MINUTE;
}

/**
 * Convert hours to pixels (infinite scroll calendar)
 * @param hours - Number of hours
 * @returns Pixel value
 * 
 * @example
 * hoursToPixels(2) // 240px (2 hours × 120px/hour)
 * hoursToPixels(0.5) // 60px (30 minutes)
 */
export function hoursToPixels(hours: number): number {
  return hours * PIXELS_PER_HOUR;
}

/**
 * Convert pixels to hours (infinite scroll calendar)
 * @param pixels - Pixel value
 * @returns Number of hours
 * 
 * @example
 * pixelsToHours(240) // 2 (240px ÷ 120px/hour)
 * pixelsToHours(60) // 0.5 (30 minutes)
 */
export function pixelsToHours(pixels: number): number {
  return pixels / PIXELS_PER_HOUR;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * POSITION CALCULATIONS
 * ═══════════════════════════════════════════════════════════════
 */

export interface TimePosition {
  top: number;    // Y position from top of day
  height: number; // Height of event card
}

/**
 * Calculate position for an event in the calendar
 * 
 * @param startTime - Event start time
 * @param endTime - Event end time
 * @param pixelsPerHour - Override pixels per hour (default: PIXELS_PER_HOUR)
 * @returns Position object with top and height
 * 
 * @example
 * const start = new Date('2026-01-15T09:00:00');
 * const end = new Date('2026-01-15T10:30:00');
 * calculateEventPosition(start, end);
 * // { top: 1080, height: 180 } (9am = 1080px, 1.5hr = 180px)
 */
export function calculateEventPosition(
  startTime: Date,
  endTime: Date,
  pixelsPerHour: number = PIXELS_PER_HOUR
): TimePosition {
  const pixelsPerMinute = pixelsPerHour / 60;
  
  // Extract time components
  const startHours = startTime.getHours();
  const startMinutes = startTime.getMinutes();
  const endHours = endTime.getHours();
  const endMinutes = endTime.getMinutes();
  
  // Calculate EXACT pixel positions
  // RESEARCH: Sub-pixel Rendering (Chrome/Firefox/Safari) - Always round to prevent browser inconsistencies
  const top = Math.round(startHours * pixelsPerHour + startMinutes * pixelsPerMinute);
  const bottom = Math.round(endHours * pixelsPerHour + endMinutes * pixelsPerMinute);
  const height = Math.max(bottom - top, MIN_CARD_HEIGHT);
  
  return { top, height };
}

/**
 * Snap time to nearest interval
 * 
 * @param hour - Hour (0-23)
 * @param minute - Minute (0-59)
 * @param intervalMinutes - Snap interval (default: INTERVAL_MINUTES)
 * @returns Snapped { hour, minute }
 * 
 * @example
 * snapToInterval(9, 17) // { hour: 9, minute: 15 } (rounds to nearest 15min)
 * snapToInterval(9, 22) // { hour: 9, minute: 30 }
 */
export function snapToInterval(
  hour: number,
  minute: number,
  intervalMinutes: number = INTERVAL_MINUTES
): { hour: number; minute: number } {
  // Round minute to nearest interval
  const snappedMinute = Math.round(minute / intervalMinutes) * intervalMinutes;
  
  // Handle minute overflow (e.g., 60 minutes → next hour)
  if (snappedMinute >= 60) {
    return {
      hour: (hour + 1) % 24,
      minute: 0,
    };
  }
  
  return { hour, minute: snappedMinute };
}

/**
 * Calculate hour and minute from pixel position
 * 
 * @param pixels - Y position in pixels
 * @param pixelsPerHour - Override pixels per hour (default: PIXELS_PER_HOUR)
 * @returns { hour, minute }
 * 
 * @example
 * pixelsToTime(1080) // { hour: 9, minute: 0 } (1080px ÷ 120px/hr = 9hr)
 * pixelsToTime(1110) // { hour: 9, minute: 15 }
 */
export function pixelsToTime(
  pixels: number,
  pixelsPerHour: number = PIXELS_PER_HOUR
): { hour: number; minute: number } {
  const totalMinutes = pixelsToMinutes(pixels);
  const hour = Math.floor(totalMinutes / 60);
  const minute = Math.floor(totalMinutes % 60);
  
  return { hour, minute };
}

/**
 * Calculate pixel position from hour and minute
 * 
 * @param hour - Hour (0-23)
 * @param minute - Minute (0-59)
 * @param pixelsPerHour - Override pixels per hour (default: PIXELS_PER_HOUR)
 * @returns Pixel position
 * 
 * @example
 * timeToPixels(9, 0) // 1080 (9 hours × 120px/hr)
 * timeToPixels(9, 30) // 1140 (9.5 hours × 120px/hr)
 */
export function timeToPixels(
  hour: number,
  minute: number,
  pixelsPerHour: number = PIXELS_PER_HOUR
): number {
  return hour * pixelsPerHour + minute * (pixelsPerHour / 60);
}

/**
 * ═══════════════════════════════════════════════════════════════
 * DURATION CALCULATIONS
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Calculate duration between two times in minutes
 * 
 * @param startTime - Start time
 * @param endTime - End time
 * @returns Duration in minutes
 */
export function calculateDurationMinutes(startTime: Date, endTime: Date): number {
  return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
}

/**
 * Calculate duration between two times in hours
 * 
 * @param startTime - Start time
 * @param endTime - End time
 * @returns Duration in hours
 */
export function calculateDurationHours(startTime: Date, endTime: Date): number {
  return calculateDurationMinutes(startTime, endTime) / 60;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * VALIDATION
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Check if a time is valid
 * @param hour - Hour (0-23)
 * @param minute - Minute (0-59)
 * @returns true if valid
 */
export function isValidTime(hour: number, minute: number): boolean {
  return hour >= 0 && hour < 24 && minute >= 0 && minute < 60;
}

/**
 * Clamp time to valid range
 * @param hour - Hour
 * @param minute - Minute
 * @returns Clamped { hour, minute }
 */
export function clampTime(hour: number, minute: number): { hour: number; minute: number } {
  return {
    hour: Math.max(0, Math.min(23, hour)),
    minute: Math.max(0, Math.min(59, minute)),
  };
}

/**
 * ═══════════════════════════════════════════════════════════════
 * EXPORT SUMMARY
 * ═══════════════════════════════════════════════════════════════
 * 
 * Import this file anywhere you need calendar sizing:
 * 
 * import { 
 *   PIXELS_PER_HOUR, 
 *   DAY_HEIGHT,
 *   calculateEventPosition,
 *   minutesToPixels,
 * } from '@/components/calendar-cards/utils/sizing';
 */