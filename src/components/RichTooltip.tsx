/**
 * Rich Tooltip Component
 * 
 * RESEARCH: Figma Tooltip System (2019)
 * - Multi-line content support
 * - Icon + text combinations
 * - Keyboard shortcut display
 * - Contextual positioning
 * 
 * Used for:
 * - Item type indicators (Event/Task/Goal)
 * - Badge explanations (High energy, Focus, etc.)
 * - Feature tooltips with keyboard shortcuts
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface RichTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  title?: string;
  subtitle?: string;
  shortcut?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number; // ms delay before showing
  disabled?: boolean;
  className?: string;
}

export function RichTooltip({
  children,
  content,
  title,
  subtitle,
  shortcut,
  position = 'top',
  delay = 300,
  disabled = false,
  className = '',
}: RichTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (disabled) return;
    
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  // Position styling
  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  // Arrow styling based on position
  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-t-8 border-x-transparent border-x-8 border-b-0',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-b-8 border-x-transparent border-x-8 border-t-0',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-l-8 border-y-transparent border-y-8 border-r-0',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-r-8 border-y-transparent border-y-8 border-l-0',
  };

  return (
    <div 
      className="relative inline-block h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`
              absolute z-50 ${positionStyles[position]}
              bg-gray-800 border border-gray-700 rounded-lg shadow-xl
              px-3 py-2 min-w-[200px] max-w-[300px]
              ${className}
            `}
          >
            {/* Arrow */}
            <div className={`absolute w-0 h-0 ${arrowStyles[position]}`} />
            
            {/* Title Row */}
            {title && (
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-white font-medium text-sm">{title}</span>
                {shortcut && (
                  <kbd className="px-1.5 py-0.5 text-xs bg-gray-700 text-gray-300 rounded border border-gray-600">
                    {shortcut}
                  </kbd>
                )}
              </div>
            )}
            
            {/* Subtitle */}
            {subtitle && (
              <div className="text-gray-400 text-xs mb-2">{subtitle}</div>
            )}
            
            {/* Content */}
            <div className="text-gray-300 text-xs leading-relaxed">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Quick Tooltip (Simple text-only version)
 * For simple single-line tooltips without complex content
 */
interface QuickTooltipProps {
  children: React.ReactNode;
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export function QuickTooltip({
  children,
  text,
  position = 'top',
  delay = 300,
  className = '',
}: QuickTooltipProps) {
  return (
    <RichTooltip
      content={text}
      position={position}
      delay={delay}
      className={`min-w-0 whitespace-nowrap ${className}`}
    >
      {children}
    </RichTooltip>
  );
}