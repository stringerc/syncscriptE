/**
 * GHOST EVENT MARKER
 * 
 * Shows the original position of an event during drag operations.
 * 
 * RESEARCH BASIS:
 * - Linear (2022): Ghost markers during drag
 * - Notion (2020): Transparent original position
 * - Figma (2019): Dimmed original with clear new position
 * - Google Calendar (2020): Light outline at source
 */

import { motion } from 'motion/react';
import { Event } from '../utils/event-task-types';
import { Clock } from 'lucide-react';

interface GhostEventMarkerProps {
  event: Event;
  originalTime: string;
}

export function GhostEventMarker({ event, originalTime }: GhostEventMarkerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.4 }}
      exit={{ opacity: 0 }}
      className="
        absolute inset-x-0 
        bg-gray-700/30 
        border-2 border-dashed border-gray-600/50
        rounded-lg p-2
        pointer-events-none
        backdrop-blur-[2px]
      "
    >
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Clock className="w-3 h-3" />
        <span>{originalTime}</span>
        <span className="truncate opacity-60">{event.title}</span>
      </div>
      <div className="text-[10px] text-gray-500 mt-1">
        Original position
      </div>
    </motion.div>
  );
}
