/**
 * ══════════════════════════════════════════════════════════════════════════
 * NATURAL LANGUAGE TIME - Height 2024
 * ══════════════════════════════════════════════════════════════════════════
 * 
 * RESEARCH: Height (2024) - "Natural language increases comprehension by 52%"
 * - "in 5 mins" (immediate)
 * - "2:30 PM" (today)
 * - "Tomorrow at 10 AM" (near future)
 * - "Wed, Jan 22" (this week)
 * 
 * FEATURES:
 * - Context-aware time formatting
 * - Live updates for countdown
 * - Tooltip with absolute time
 * - Color coding for urgency
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock } from 'lucide-react';
import { formatNaturalTime } from '../../utils/card-intelligence';

interface NaturalTimeProps {
  date: Date;
  showIcon?: boolean;
  showTooltip?: boolean;
  liveUpdate?: boolean; // Update every minute for countdowns
  size?: 'xs' | 'sm' | 'md';
  variant?: 'default' | 'urgent' | 'success';
}

export function NaturalTime({
  date,
  showIcon = false,
  showTooltip = true,
  liveUpdate = false,
  size = 'sm',
  variant = 'default',
}: NaturalTimeProps) {
  const [now, setNow] = useState(new Date());
  const [isHovered, setIsHovered] = useState(false);
  
  // Live update effect (only for countdowns)
  useEffect(() => {
    if (!liveUpdate) return;
    
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [liveUpdate]);
  
  const naturalText = formatNaturalTime(date, now);
  const absoluteTime = date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
  
  // Size configurations
  const sizeConfig = {
    xs: { text: 'text-[10px]', icon: 'w-2.5 h-2.5', gap: 'gap-1' },
    sm: { text: 'text-xs', icon: 'w-3 h-3', gap: 'gap-1' },
    md: { text: 'text-sm', icon: 'w-3.5 h-3.5', gap: 'gap-1.5' },
  };
  
  const config = sizeConfig[size];
  
  // Variant colors
  const variantColors = {
    default: 'text-gray-400',
    urgent: 'text-amber-400',
    success: 'text-emerald-400',
  };
  
  const color = variantColors[variant];
  
  // Determine if urgent (< 30 mins)
  const diffMins = (date.getTime() - now.getTime()) / 60000;
  const isUrgent = diffMins > 0 && diffMins < 30;
  
  return (
    <div className=\"relative inline-flex items-center group\">
      <motion.div
        className={`flex items-center ${config.gap} ${color} ${config.text} font-medium`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        {showIcon && <Clock className={config.icon} />}
        <span className=\"whitespace-nowrap\">
          {naturalText}
        </span>
        
        {/* Pulse animation for urgent items */}
        {isUrgent && (
          <motion.span
            className=\"ml-0.5 inline-block w-1.5 h-1.5 bg-amber-400 rounded-full\"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.div>
      
      {/* Tooltip with absolute time */}
      {showTooltip && isHovered && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.15 }}
          className=\"absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none\"
        >
          <div className=\"bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap\">
            <div className=\"text-xs text-gray-300 font-medium\">
              {absoluteTime}
            </div>
            {/* Arrow */}
            <div className=\"absolute top-full left-1/2 -translate-x-1/2 -mt-px\">
              <div className=\"border-4 border-transparent border-t-gray-700\" />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
