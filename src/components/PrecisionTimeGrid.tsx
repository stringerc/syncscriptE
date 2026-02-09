import React from 'react';

/**
 * RESEARCH-BASED PRECISION TIME GRID
 * 
 * Based on industry standards from Google Calendar, Outlook, and Apple Calendar:
 * - 100px per hour for optimal spacing and visibility (increased from 60px)
 * - 15-minute interval markers for visual reference
 * - Bold hour markers for primary time reference
 * - Exact pixel positioning for events/tasks/goals
 * 
 * UX Research:
 * - Users make better scheduling decisions with absolute times vs. durations
 * - 15-minute intervals balance precision with visual cleanliness
 * - Pixel-perfect positioning reduces cognitive load (what you see is accurate)
 * - Increased spacing (100px/hour) improves readability and reduces eye strain
 */

const PIXELS_PER_HOUR = 100; // Increased from 60 for better spacing
const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60; // ~1.67px per minute
const INTERVAL_MINUTES = 15; // 15-minute intervals

export interface TimePosition {
  top: number;
  height: number;
}

/**
 * Calculate exact pixel position for a time
 */
export function getPixelPosition(time: Date): number {
  const hours = time.getHours();
  const minutes = time.getMinutes();
  return hours * PIXELS_PER_HOUR + minutes * PIXELS_PER_MINUTE;
}

/**
 * Calculate position and height for an event
 */
export function calculateEventPosition(startTime: Date, endTime: Date, pixelsPerHour: number = PIXELS_PER_HOUR): TimePosition {
  const pixelsPerMinute = pixelsPerHour / 60;
  const startHours = startTime.getHours();
  const startMinutes = startTime.getMinutes();
  const endHours = endTime.getHours();
  const endMinutes = endTime.getMinutes();
  
  // RESEARCH: Sub-pixel Rendering - Always round to prevent browser inconsistencies
  const top = Math.round(startHours * pixelsPerHour + startMinutes * pixelsPerMinute);
  const bottom = Math.round(endHours * pixelsPerHour + endMinutes * pixelsPerMinute);
  const height = Math.max(bottom - top, 20); // Minimum 20px for accessibility
  
  return { top, height };
}

/**
 * Format time for display on event cards
 */
export function formatEventTime(startTime: Date, endTime: Date): string {
  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const minuteStr = minutes === 0 ? '' : `:${minutes.toString().padStart(2, '0')}`;
    return `${hours}${minuteStr} ${ampm}`;
  };
  
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

/**
 * Snap time to nearest interval (15 minutes by default)
 */
export function snapToInterval(date: Date, intervalMinutes: number = INTERVAL_MINUTES): Date {
  const minutes = date.getMinutes();
  const snappedMinutes = Math.round(minutes / intervalMinutes) * intervalMinutes;
  const result = new Date(date);
  result.setMinutes(snappedMinutes);
  result.setSeconds(0);
  result.setMilliseconds(0);
  return result;
}

/**
 * Time Grid Component - Renders 24 hours with 15-minute interval markers
 */
interface PrecisionTimeGridProps {
  showIntervals?: boolean; // Show 15-minute interval lines
  className?: string;
}

export function PrecisionTimeGrid({ showIntervals = true, className = '' }: PrecisionTimeGridProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  return (
    <div className={`relative ${className}`}>
      {hours.map((hour) => (
        <div 
          key={hour} 
          className="relative border-b border-gray-800/50"
          style={{ height: `${PIXELS_PER_HOUR}px` }}
        >
          {/* Hour label */}
          <div className="absolute top-0 left-0 w-24 text-sm text-gray-500 font-medium p-3">
            {hour === 0 ? '12:00 AM' : hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`}
          </div>
          
          {/* 15-minute interval markers */}
          {showIntervals && (
            <>
              <div 
                className="absolute left-24 right-0 border-t border-gray-800/20"
                style={{ top: '25px' }}
              />
              <div 
                className="absolute left-24 right-0 border-t border-gray-800/30"
                style={{ top: '50px' }}
              />
              <div 
                className="absolute left-24 right-0 border-t border-gray-800/20"
                style={{ top: '75px' }}
              />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Time Grid for Week View - Multiple columns with precision positioning
 */
interface PrecisionTimeGridWeekProps {
  days: string[];
  showIntervals?: boolean;
  className?: string;
}

export function PrecisionTimeGridWeek({ days, showIntervals = true, className = '' }: PrecisionTimeGridWeekProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  return (
    <div className={`${className}`}>
      {hours.map((hour) => (
        <div 
          key={hour} 
          className="grid grid-cols-8 border-b border-gray-800/50"
          style={{ height: `${PIXELS_PER_HOUR}px` }}
        >
          {/* Time label column */}
          <div className="text-sm text-gray-500 font-medium p-3 border-r border-gray-800/50">
            {hour === 0 ? '12:00 AM' : hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`}
          </div>
          
          {/* Day columns */}
          {days.map((day, idx) => (
            <div 
              key={`${hour}-${day}`}
              className="relative border-r border-gray-800/50"
            >
              {/* 15-minute interval markers */}
              {showIntervals && (
                <>
                  <div 
                    className="absolute left-0 right-0 border-t border-gray-800/20"
                    style={{ top: '25px' }}
                  />
                  <div 
                    className="absolute left-0 right-0 border-t border-gray-800/30"
                    style={{ top: '50px' }}
                  />
                  <div 
                    className="absolute left-0 right-0 border-t border-gray-800/20"
                    style={{ top: '75px' }}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export { PIXELS_PER_HOUR, PIXELS_PER_MINUTE, INTERVAL_MINUTES };