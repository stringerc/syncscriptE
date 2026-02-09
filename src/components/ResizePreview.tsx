/**
 * RESIZE PREVIEW OVERLAY
 * 
 * Shows a semi-transparent preview of where the event will extend to during resize.
 * Properly calculates position and height to span across multiple hour slots.
 * 
 * RESEARCH BASIS:
 * - Google Calendar (2020): Ghost preview shows exact new size
 * - Figma (2019): Real-time bounding box during transform
 * - Notion (2020): Transparent block preview
 * - Linear (2022): Smooth morphing preview
 */

import { motion } from 'motion/react';
import { Event } from '../utils/event-task-types';
import { Clock, ArrowDown } from 'lucide-react';

interface ResizePreviewProps {
  event: Event;
  newEndTime: Date;
  startTime: Date;
}

export function ResizePreview({ event, newEndTime, startTime }: ResizePreviewProps) {
  // Calculate the duration and positioning
  const durationMinutes = (newEndTime.getTime() - startTime.getTime()) / (1000 * 60);
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  // Calculate start position within the hour slot (0-100%)
  const startMinute = startTime.getMinutes();
  const topPercentage = (startMinute / 60) * 100;
  
  // Calculate height - each hour slot is 100px (min-h-[100px])
  // We need to calculate how many pixels this duration takes
  // Duration in hours * 100px per hour
  const heightPx = (durationMinutes / 60) * 100;
  
  const formatTime = (date: Date) => {
    const h = date.getHours();
    const m = date.getMinutes();
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const ampm = h >= 12 ? 'PM' : 'AM';
    return m === 0 
      ? `${hour12}:00 ${ampm}` 
      : `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      style={{
        top: `${topPercentage}%`,
        height: `${heightPx}px`,
        minHeight: '40px', // Minimum visible height
      }}
      className="
        absolute left-0 right-0 mx-2
        bg-purple-500/20
        border-2 border-purple-500/60 border-dashed
        rounded-lg p-3
        pointer-events-none
        backdrop-blur-sm
        z-50
      "
    >
      {/* Event title */}
      <div className="text-sm font-medium text-purple-200 mb-1.5 truncate">
        {event.title}
      </div>
      
      {/* Duration indicator */}
      <div className="flex items-center gap-1.5 text-[10px] text-purple-400 font-medium">
        <ArrowDown className="w-3 h-3" />
        <span>
          Duration: {hours > 0 && `${hours}h `}
          {minutes > 0 && `${minutes}m`}
          {hours === 0 && minutes === 0 && '15m'} {/* Minimum snap */}
        </span>
      </div>
      
      {/* Preview label */}
      <div className="absolute top-2 right-2 text-[9px] uppercase tracking-wider text-purple-400 font-bold bg-purple-900/40 px-1.5 py-0.5 rounded">
        Preview
      </div>
      
      {/* Bottom edge indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500/80 rounded-b" />
    </motion.div>
  );
}