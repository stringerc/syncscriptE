/**
 * FLOATING TIME BADGE
 * 
 * Shows live time preview during drag operations.
 * Follows cursor with smooth animation.
 * 
 * RESEARCH BASIS:
 * - Google Calendar (2020): Floating time tooltip
 * - Figma (2019): Measurement tooltips during resize
 * - Superhuman (2022): Floating action badges
 * - Motion.app (2023): Time snap indicators
 */

import { motion } from 'motion/react';
import { Clock } from 'lucide-react';

interface FloatingTimeBadgeProps {
  time: string;
  position: { x: number; y: number };
  isSnapped?: boolean;
  type?: 'drag' | 'resize';
}

export function FloatingTimeBadge({ 
  time, 
  position, 
  isSnapped = false,
  type = 'drag'
}: FloatingTimeBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: position.x,
        y: position.y,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ 
        type: 'spring', 
        stiffness: 500, 
        damping: 30,
        opacity: { duration: 0.15 }
      }}
      className={`
        fixed pointer-events-none z-[9999]
        px-3 py-1.5 rounded-lg
        flex items-center gap-2
        shadow-lg backdrop-blur-sm
        ${isSnapped 
          ? 'bg-teal-500 text-white border border-teal-400 shadow-teal-500/50' 
          : 'bg-gray-900/95 text-gray-200 border border-gray-700'
        }
      `}
      style={{
        transform: 'translate(-50%, -150%)', // Center horizontally, position above cursor
      }}
    >
      <Clock className="w-3.5 h-3.5" />
      <span className="text-sm font-medium tabular-nums">
        {time}
      </span>
      {isSnapped && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-1.5 h-1.5 rounded-full bg-white"
        />
      )}
    </motion.div>
  );
}

/**
 * Floating Time Range Badge (for resize operations)
 * Shows start time - end time
 */
interface FloatingTimeRangeBadgeProps {
  startTime: string;
  endTime: string;
  position: { x: number; y: number };
  isSnapped?: boolean;
}

export function FloatingTimeRangeBadge({ 
  startTime, 
  endTime, 
  position, 
  isSnapped = false 
}: FloatingTimeRangeBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: position.x,
        y: position.y,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ 
        type: 'spring', 
        stiffness: 500, 
        damping: 30,
        opacity: { duration: 0.15 }
      }}
      className={`
        fixed pointer-events-none z-[9999]
        px-3 py-1.5 rounded-lg
        flex items-center gap-2
        shadow-lg backdrop-blur-sm
        ${isSnapped 
          ? 'bg-purple-500 text-white border border-purple-400 shadow-purple-500/50' 
          : 'bg-gray-900/95 text-gray-200 border border-gray-700'
        }
      `}
      style={{
        transform: 'translate(-50%, -150%)', // Center horizontally, position above cursor
      }}
    >
      <Clock className="w-3.5 h-3.5" />
      <span className="text-sm font-medium tabular-nums">
        {startTime} - {endTime}
      </span>
      {isSnapped && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-1.5 h-1.5 rounded-full bg-white"
        />
      )}
    </motion.div>
  );
}
