/**
 * Tooltip Component
 * Combines shadcn-style tooltip with custom PriorityTooltip
 */

import * as React from "react";
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ===== SHADCN-STYLE TOOLTIP (for existing components) =====

const TooltipProvider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { delayDuration?: number }
>(({ children, delayDuration = 300, ...props }, ref) => {
  return <div ref={ref} {...props}>{children}</div>;
});
TooltipProvider.displayName = "TooltipProvider";

interface TooltipContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const TooltipContext = React.createContext<TooltipContextValue | undefined>(undefined);

const Tooltip = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <TooltipContext.Provider value={{ isOpen, setIsOpen }}>
      <div ref={ref} className="relative inline-block" {...props}>{children}</div>
    </TooltipContext.Provider>
  );
});
Tooltip.displayName = "Tooltip";

const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ children, asChild, ...props }, ref) => {
  const context = React.useContext(TooltipContext);
  if (!context) throw new Error('TooltipTrigger must be used within Tooltip');
  
  const handleMouseEnter = () => context.setIsOpen(true);
  const handleMouseLeave = () => context.setIsOpen(false);
  
  if (asChild && React.isValidElement(children)) {
    // Clone the child and add event handlers to it
    return React.cloneElement(children, {
      ...props,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    } as any);
  }
  
  return (
    <div 
      ref={ref} 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
});
TooltipTrigger.displayName = "TooltipTrigger";

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { side?: 'top' | 'bottom' | 'left' | 'right' }
>(({ className = '', children, side = 'top', ...props }, ref) => {
  const context = React.useContext(TooltipContext);
  if (!context) throw new Error('TooltipContent must be used within Tooltip');
  
  if (!context.isOpen) return null;
  
  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };
  
  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className={`absolute ${sideClasses[side]} z-[9999] overflow-hidden rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white border border-gray-700 shadow-xl pointer-events-none ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
});
TooltipContent.displayName = "TooltipContent";

// ===== SIMPLE TOOLTIP (for Phase 2 implementation) =====

interface SimpleTooltipProps {
  content: string;
  children: React.ReactNode;
  delay?: number; // milliseconds
  position?: 'top' | 'bottom' | 'left' | 'right';
}

function SimpleTooltip({ content, children, delay = 300, position = 'top' }: SimpleTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className="relative w-full"
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
            className={`absolute ${positionClasses[position]} z-[9999] pointer-events-none`}
          >
            <div className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded shadow-xl border border-gray-700 whitespace-nowrap">
              {content}
              {/* Arrow */}
              <div className={`absolute w-2 h-2 bg-gray-900 border-gray-700 transform rotate-45 ${
                position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2 border-r border-b' :
                position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2 border-l border-t' :
                position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2 border-r border-t' :
                'left-[-4px] top-1/2 -translate-y-1/2 border-l border-b'
              }`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Priority-specific tooltip with color-coded styling
 */
interface PriorityTooltipProps {
  priority: 'urgent' | 'high' | 'medium' | 'low';
  children: React.ReactNode;
}

function PriorityTooltip({ priority, children }: PriorityTooltipProps) {
  const tooltipContent = {
    urgent: '🔴 Urgent Priority',
    high: '🔴 High Priority',
    medium: '🟡 Medium Priority',
    low: '🟢 Low Priority',
  };

  return (
    <SimpleTooltip content={tooltipContent[priority]} position="bottom">
      {children}
    </SimpleTooltip>
  );
}

// Export everything
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  SimpleTooltip,
  PriorityTooltip,
};