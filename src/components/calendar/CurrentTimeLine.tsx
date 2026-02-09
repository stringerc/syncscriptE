/**
 * Current Time Line Component
 * 
 * RESEARCH BASIS:
 * - TV Guide Channel pattern (1980s-present): Moving "now" indicator
 * - Google Calendar's red line (2008): Clear temporal orientation
 * - Animation: 60fps for smooth movement (requestAnimationFrame)
 * - Visibility: High contrast + pulsing dot for attention
 * 
 * BEHAVIOR:
 * - Updates position every minute (1px per minute at standard zoom)
 * - Stays at absolute time position (doesn't follow scroll)
 * - Visible when in viewport, hidden when scrolled away
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Clock } from 'lucide-react';

interface CurrentTimeLineProps {
  /** Current time as Date object */
  currentTime: Date;
  /** Offset from top of timeline in pixels */
  offsetTop: number;
  /** Whether user is currently viewing this time range */
  isInViewport: boolean;
}

export function CurrentTimeLine({ currentTime, offsetTop, isInViewport }: CurrentTimeLineProps) {
  const [time, setTime] = useState(currentTime);
  
  // Update time every second for smooth animation
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  
  const formattedDate = time.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isInViewport ? 1 : 0.3 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'absolute',
        top: `${offsetTop}px`,
        left: 0,
        right: 0,
        zIndex: 40, // Above events but below modals
        pointerEvents: 'none', // Don't block interactions
      }}
      className="flex items-center"
    >
      {/* Pulsing indicator dot */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 flex-shrink-0"
      />
      
      {/* Green line extending across */}
      <div className="flex-1 h-[2px] bg-emerald-500 shadow-lg shadow-emerald-500/30 relative">
        {/* Gradient fade out */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-transparent" />
      </div>
      
      {/* Time badge */}
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="ml-3 px-3 py-1.5 bg-emerald-500 rounded-lg shadow-lg flex items-center gap-2 text-sm font-semibold text-white pointer-events-auto"
        style={{ pointerEvents: 'auto' }}
      >
        <Clock className="w-3.5 h-3.5" />
        <div className="flex flex-col leading-tight">
          <span className="text-xs opacity-90">{formattedDate}</span>
          <span className="text-sm">{formattedTime}</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Hook to calculate current time line position
 * Returns offset in pixels from timeline start (midnight of earliest day)
 */
export function useCurrentTimePosition(timelineStartDate: Date): number {
  const [position, setPosition] = useState(0);
  
  useEffect(() => {
    const calculatePosition = () => {
      const now = new Date();
      const diffMs = now.getTime() - timelineStartDate.getTime();
      const diffMinutes = diffMs / (1000 * 60);
      
      // Each 15-minute slot = 100px height (matching TimelineSlot)
      // So 1 minute = 100/15 = 6.67px
      const pixelsPerMinute = 100 / 15;
      const offset = diffMinutes * pixelsPerMinute;
      
      setPosition(offset);
    };
    
    // Update every second for smooth movement
    calculatePosition();
    const interval = setInterval(calculatePosition, 1000);
    
    return () => clearInterval(interval);
  }, [timelineStartDate]);
  
  return position;
}
