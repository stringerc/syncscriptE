/**
 * Return to Now - Floating Action Button
 * 
 * RESEARCH BASIS:
 * - Material Design FAB pattern (2014): Prominent, single action
 * - Waze "Return to GPS" pattern: Appears when off-course
 * - Gmail "Scroll to top": Appears after scrolling threshold
 * - Fitts's Law: Large touch target (56x56px) in corner
 * 
 * BEHAVIOR:
 * - Appears when scrolled >1 hour away from current time
 * - Smooth scroll back to "now" with easing
 * - Pulsing animation to draw attention
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ArrowDown } from 'lucide-react';
import { Button } from '../ui/button';

interface ReturnToNowButtonProps {
  /** Whether to show the button (based on scroll distance) */
  visible: boolean;
  /** Callback when button is clicked */
  onReturnToNow: () => void;
  /** Distance from now in hours (for display) */
  hoursAway?: number;
  /** Direction: 'past' or 'future' */
  direction?: 'past' | 'future';
}

export function ReturnToNowButton({ 
  visible, 
  onReturnToNow, 
  hoursAway = 0,
  direction = 'future' 
}: ReturnToNowButtonProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: 20 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
          }}
          className="fixed bottom-8 right-8 z-50"
        >
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Button
              onClick={onReturnToNow}
              size="lg"
              className="h-14 px-6 bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xl shadow-emerald-500/30 rounded-full font-semibold flex items-center gap-3 group"
            >
              <motion.div
                animate={{
                  rotate: direction === 'past' ? 180 : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                <Clock className="w-5 h-5" />
              </motion.div>
              
              <div className="flex flex-col items-start leading-tight">
                <span className="text-xs opacity-90">
                  {direction === 'past' 
                    ? `${Math.round(hoursAway)}h in the past`
                    : `${Math.round(hoursAway)}h ahead`
                  }
                </span>
                <span className="text-sm font-bold">Return to Now</span>
              </div>
              
              <motion.div
                animate={{
                  y: [0, 3, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <ArrowDown className={`w-4 h-4 ${direction === 'past' ? 'rotate-180' : ''}`} />
              </motion.div>
            </Button>
          </motion.div>
          
          {/* Subtle pulsing glow */}
          <motion.div
            className="absolute inset-0 bg-emerald-500 rounded-full blur-xl opacity-20 -z-10"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook to determine if Return to Now button should be visible
 * Based on distance from current time
 */
export function useReturnToNowVisibility(
  currentScrollTime: Date,
  threshold: number = 60 // minutes
): { visible: boolean; hoursAway: number; direction: 'past' | 'future' } {
  const now = new Date();
  const diffMinutes = (currentScrollTime.getTime() - now.getTime()) / (1000 * 60);
  const hoursAway = Math.abs(diffMinutes / 60);
  
  return {
    visible: Math.abs(diffMinutes) > threshold,
    hoursAway,
    direction: diffMinutes < 0 ? 'past' : 'future',
  };
}
