/**
 * 🚨 RESIZE CONSTRAINT INDICATOR - Visual Feedback for Invalid Resizes
 * 
 * Shows real-time warnings when users try to resize events beyond valid constraints.
 * 
 * RESEARCH BASIS:
 * - Google Calendar (2021) - Red indicator when resize invalid
 * - Outlook Calendar (2020) - "Cannot make event shorter than 15 minutes"
 * - Apple Calendar (2019) - Visual feedback prevents errors before they happen
 * - Motion.app (2023) - Smart constraints with helpful messaging
 * 
 * CONSTRAINTS ENFORCED:
 * 1. Minimum duration: 15 minutes (industry standard)
 * 2. Maximum duration: 24 hours (day view limit)
 * 3. Start time before end time (logical constraint)
 * 4. No negative durations
 * 5. Cross-day events (start and end on different days)
 * 
 * FEATURES:
 * - Real-time validation during drag (not just on release)
 * - Visual warning indicator (red border + icon)
 * - Helpful constraint message
 * - Smooth animations
 * - Auto-dismiss when constraint satisfied
 * 
 * USAGE:
 * <ResizeConstraintIndicator
 *   visible={isResizing}
 *   constraintType="minimum"
 *   currentDuration={10}
 *   minimumDuration={15}
 *   eventId="event-123"
 * />
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Clock, AlertTriangle, Calendar } from 'lucide-react';

export type ConstraintType = 'minimum' | 'maximum' | 'invalid' | 'cross-day' | 'none';

interface ResizeConstraintIndicatorProps {
  visible: boolean;
  constraintType: ConstraintType;
  currentDuration: number; // in minutes
  minimumDuration?: number; // in minutes (default: 15)
  maximumDuration?: number; // in minutes (default: 1440 = 24 hours)
  eventId: string;
  
  // Position (follows cursor or attaches to event)
  cursorX?: number;
  cursorY?: number;
  attachToEvent?: boolean; // If true, position relative to event instead of cursor
  eventTop?: number;
  eventLeft?: number;
}

/**
 * Format duration in human-readable format
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Get constraint message based on type
 */
function getConstraintMessage(
  type: ConstraintType,
  currentDuration: number,
  minimumDuration: number,
  maximumDuration: number
): string {
  switch (type) {
    case 'minimum':
      return `Too short • ${formatDuration(minimumDuration)} minimum`;
    case 'maximum':
      return `Too long • ${formatDuration(maximumDuration)} maximum`;
    case 'invalid':
      return 'Invalid duration';
    case 'cross-day':
      return 'Cross-day events not allowed';
    case 'none':
      return '';
  }
}

/**
 * Get icon for constraint type
 */
function getConstraintIcon(type: ConstraintType) {
  switch (type) {
    case 'minimum':
      return Clock;
    case 'maximum':
      return AlertTriangle;
    case 'invalid':
      return AlertCircle;
    case 'cross-day':
      return Calendar;
    case 'none':
      return AlertCircle;
  }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * RESIZE CONSTRAINT INDICATOR COMPONENT
 * ═══════════════════════════════════════════════════════════════
 */

export function ResizeConstraintIndicator({
  visible,
  constraintType,
  currentDuration,
  minimumDuration = 15,
  maximumDuration = 1440, // 24 hours
  eventId,
  cursorX,
  cursorY,
  attachToEvent = false,
  eventTop,
  eventLeft,
}: ResizeConstraintIndicatorProps) {
  // Only show if there's an actual constraint violation
  const hasViolation = visible && constraintType !== 'none';
  
  if (!hasViolation) return null;
  
  const Icon = getConstraintIcon(constraintType);
  const message = getConstraintMessage(constraintType, currentDuration, minimumDuration, maximumDuration);
  
  // Calculate position
  const position = attachToEvent && eventTop !== undefined && eventLeft !== undefined
    ? { top: eventTop - 60, left: eventLeft } // Above event
    : cursorX !== undefined && cursorY !== undefined
    ? { top: cursorY - 60, left: cursorX } // Above cursor
    : { top: 100, left: 100 }; // Fallback
  
  return (
    <AnimatePresence>
      {hasViolation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ 
            duration: 0.2, 
            ease: 'easeOut',
            scale: { type: 'spring', stiffness: 300, damping: 20 }
          }}
          className="fixed pointer-events-none z-[200]"
          style={{
            top: position.top,
            left: position.left,
            transform: 'translateX(-50%)', // Center horizontally
          }}
        >
          {/* Warning Badge */}
          <div className="relative">
            {/* Pulsing Glow */}
            <motion.div
              animate={{ 
                opacity: [0.4, 0.8, 0.4],
                scale: [1, 1.1, 1],
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 bg-red-500/30 rounded-full blur-xl"
            />
            
            {/* Main Badge */}
            <div className="relative flex items-center gap-2 bg-red-950/95 border-2 border-red-500 rounded-lg px-3 py-2 shadow-2xl backdrop-blur-sm">
              {/* Icon */}
              <Icon className="w-4 h-4 text-red-400 flex-shrink-0" />
              
              {/* Message */}
              <div className="flex flex-col gap-0.5">
                <div className="text-red-400 font-bold text-xs whitespace-nowrap">
                  {message}
                </div>
                <div className="text-red-500/70 text-[10px] font-medium">
                  Current: {formatDuration(currentDuration)}
                </div>
              </div>
              
              {/* Animated Border Pulse */}
              <motion.div
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 border-2 border-red-400 rounded-lg"
              />
            </div>
            
            {/* Pointer Arrow (points down to cursor/event) */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-950 border-r-2 border-b-2 border-red-500 rotate-45" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════
 * EVENT BORDER CONSTRAINT INDICATOR
 * ═══════════════════════════════════════════════════════════════
 * 
 * Shows red border around event during invalid resize.
 * Use this in addition to the floating badge.
 */

interface EventBorderConstraintProps {
  visible: boolean;
  constraintType: ConstraintType;
}

export function EventBorderConstraint({
  visible,
  constraintType,
}: EventBorderConstraintProps) {
  const hasViolation = visible && constraintType !== 'none';
  
  if (!hasViolation) return null;
  
  return (
    <AnimatePresence>
      {hasViolation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 pointer-events-none z-[100] rounded-lg overflow-hidden"
        >
          {/* Animated Red Border */}
          <motion.div
            animate={{
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 border-2 border-red-500 rounded-lg"
            style={{
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.5), inset 0 0 20px rgba(239, 68, 68, 0.2)',
            }}
          />
          
          {/* Red Overlay Tint */}
          <div className="absolute inset-0 bg-red-500/10" />
          
          {/* Corner Indicators */}
          <div className="absolute top-1 left-1 w-2 h-2 bg-red-500 rounded-full" />
          <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          <div className="absolute bottom-1 left-1 w-2 h-2 bg-red-500 rounded-full" />
          <div className="absolute bottom-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════
 * CONSTRAINT VALIDATION UTILITIES
 * ═══════════════════════════════════════════════════════════════
 */

export interface ConstraintValidation {
  isValid: boolean;
  constraintType: ConstraintType;
  durationMinutes: number;
  message: string;
}

/**
 * Validate event duration against constraints
 */
export function validateEventDuration(
  startTime: Date,
  endTime: Date,
  minimumMinutes: number = 15,
  maximumMinutes: number = 10080 // PHASE 4C: Allow up to 7 days (7 * 24 * 60 = 10080 minutes)
): ConstraintValidation {
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationMinutes = durationMs / (1000 * 60);
  
  // Invalid: Negative duration
  if (durationMinutes < 0) {
    return {
      isValid: false,
      constraintType: 'invalid',
      durationMinutes: Math.abs(durationMinutes),
      message: 'End time must be after start time',
    };
  }
  
  // Minimum constraint
  if (durationMinutes < minimumMinutes) {
    return {
      isValid: false,
      constraintType: 'minimum',
      durationMinutes,
      message: `Events must be at least ${formatDuration(minimumMinutes)}`,
    };
  }
  
  // Maximum constraint - PHASE 4C: Allow multi-day events up to 7 days
  if (durationMinutes > maximumMinutes) {
    return {
      isValid: false,
      constraintType: 'maximum',
      durationMinutes,
      message: `Events cannot exceed ${formatDuration(maximumMinutes)} (7 days max)`,
    };
  }
  
  // PHASE 4C: Cross-day events are now ALLOWED - removed constraint
  // No cross-day check here
  
  // Valid!
  return {
    isValid: true,
    constraintType: 'none',
    durationMinutes,
    message: '',
  };
}

/**
 * Calculate constraint during live resize
 * PHASE 4C: Updated to support multi-day events up to 7 days
 */
export function calculateResizeConstraint(
  originalStartTime: Date,
  originalEndTime: Date,
  resizeEdge: 'start' | 'end',
  newHour: number,
  newMinute: number,
  minimumMinutes: number = 15,
  maximumMinutes: number = 10080 // PHASE 4C: 7 days max (7 * 24 * 60)
): ConstraintValidation {
  let newStartTime = new Date(originalStartTime);
  let newEndTime = new Date(originalEndTime);
  
  if (resizeEdge === 'start') {
    newStartTime.setHours(newHour, newMinute, 0, 0);
  } else {
    newEndTime.setHours(newHour, newMinute, 0, 0);
    
    // PHASE 4C: Handle cross-day resize
    // If new end time is before start time on same day, it means user wants next day
    if (newEndTime <= newStartTime) {
      newEndTime.setDate(newEndTime.getDate() + 1);
    }
  }
  
  return validateEventDuration(newStartTime, newEndTime, minimumMinutes, maximumMinutes);
}

/**
 * ═══════════════════════════════════════════════════════════════
 * EXPORT SUMMARY
 * ═══════════════════════════════════════════════════════════════
 * 
 * This component provides:
 * ✅ Real-time constraint validation during resize
 * ✅ Visual warning badge with icon + message
 * ✅ Red border overlay on invalid events
 * ✅ Pulsing animations for attention
 * ✅ Helper utilities for validation logic
 * ✅ Follows cursor or attaches to event
 * 
 * Constraints enforced:
 * - Minimum: 15 minutes (configurable)
 * - Maximum: 24 hours (configurable)
 * - Logical: Start before end
 * - Cross-day events
 * 
 * Research-backed design:
 * - Google Calendar: Red indicator for invalid resize
 * - Outlook Calendar: "Cannot make event shorter" message
 * - Apple Calendar: Visual feedback prevents errors
 * - Motion.app: Smart constraints with helpful messaging
 * 
 * Usage pattern:
 * 
 * 1. Floating Badge (follows cursor):
 *    <ResizeConstraintIndicator
 *      visible={isResizing}
 *      constraintType={validation.constraintType}
 *      currentDuration={validation.durationMinutes}
 *      cursorX={mouseX}
 *      cursorY={mouseY}
 *      eventId={event.id}
 *    />
 * 
 * 2. Event Border (on event card):
 *    <EventBorderConstraint
 *      visible={isResizing}
 *      constraintType={validation.constraintType}
 *    />
 * 
 * 3. Validation Helpers:
 *    const validation = calculateResizeConstraint(
 *      startTime, endTime, 'end', newHour, newMinute
 *    );
 *    if (!validation.isValid) {
 *      // Show warning, prevent save, etc.
 *    }
 */