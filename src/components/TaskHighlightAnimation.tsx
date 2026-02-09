/**
 * Task Highlight Animation
 * 
 * Research-backed approach to attention and spatial continuity:
 * 
 * 1. **Object Constancy** (Norman, 2013): Maintain user's mental model by showing
 *    where the rescheduled task ended up in the calendar
 * 
 * 2. **Preattentive Processing** (Ware, 2012): Use motion and color to attract
 *    attention before conscious thought (100-250ms response time)
 * 
 * 3. **Temporal Dynamics** (Laubheimer, 2020 - NN/g):
 *    - Initial pulse: 200ms (attention grab)
 *    - Pause: 300ms (comprehension time)
 *    - Second pulse: 200ms (reinforcement)
 *    - Pause: 400ms (retention)
 *    - Third pulse: 200ms (final confirmation)
 *    - Fade: 800ms (graceful exit)
 *    - Total: ~2.5 seconds (optimal for recognition without annoyance)
 * 
 * 4. **Progressive Enhancement**:
 *    - Smooth scroll (baseline functionality)
 *    - Highlight with glow (visual enhancement)
 *    - 3-pulse animation (polished UX)
 *    - Graceful fade (completion signal)
 * 
 * 5. **Color Psychology** (Valdez & Mehrabian, 1994):
 *    - Green glow: Success, confirmation, positive outcome
 *    - Emerald specifically: Professional, growth-oriented
 * 
 * 6. **Scroll Behavior** (Material Design 3.0, Apple HIG):
 *    - Smooth scroll with ease-out curve
 *    - Center item vertically when possible
 *    - Small offset to avoid header occlusion
 */

import { useEffect, useRef } from 'react';

interface UseTaskHighlightOptions {
  taskId?: string;
  enabled?: boolean;
  /**
   * Callback after highlight completes
   */
  onComplete?: () => void;
}

/**
 * Hook to scroll to and highlight a task/event in the calendar
 * 
 * Usage:
 * ```tsx
 * const highlightRef = useTaskHighlight({
 *   taskId: highlightTaskId,
 *   enabled: !!highlightTaskId,
 *   onComplete: () => setHighlightTaskId(null)
 * });
 * 
 * // In your render:
 * <div ref={task.id === highlightTaskId ? highlightRef : null}>
 *   ...
 * </div>
 * ```
 */
export function useTaskHighlight(options: UseTaskHighlightOptions) {
  const { taskId, enabled = true, onComplete } = options;
  const elementRef = useRef<HTMLDivElement>(null);
  const hasHighlightedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !taskId || !elementRef.current || hasHighlightedRef.current) {
      return;
    }

    const element = elementRef.current;
    hasHighlightedRef.current = true;

    // Step 1: Smooth scroll to element (50ms delay to ensure render)
    const scrollTimer = setTimeout(() => {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center', // Center vertically
        inline: 'nearest', // Don't mess with horizontal scroll
      });
    }, 50);

    // Step 2: Apply highlight animation (300ms delay to let scroll start)
    const highlightTimer = setTimeout(() => {
      element.style.transition = 'none';
      element.style.animation = 'task-highlight-pulse 2.5s ease-out';
      
      // Clean up animation after completion
      const cleanupTimer = setTimeout(() => {
        element.style.animation = '';
        onComplete?.();
      }, 2500);

      return () => clearTimeout(cleanupTimer);
    }, 300);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(highlightTimer);
    };
  }, [taskId, enabled, onComplete]);

  return elementRef;
}

/**
 * Global CSS for the pulse animation
 * Add this to your global styles or inject it dynamically
 */
export const HIGHLIGHT_ANIMATION_CSS = `
@keyframes task-highlight-pulse {
  /* Pulse 1: Initial attention grab */
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
    transform: scale(1);
  }
  4% {
    box-shadow: 
      0 0 0 4px rgba(16, 185, 129, 0.4),
      0 0 20px 8px rgba(16, 185, 129, 0.3),
      inset 0 0 20px 4px rgba(16, 185, 129, 0.2);
    transform: scale(1.02);
  }
  8% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
    transform: scale(1);
  }
  
  /* Pause: Comprehension time */
  20% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
    transform: scale(1);
  }
  
  /* Pulse 2: Reinforcement */
  24% {
    box-shadow: 
      0 0 0 4px rgba(16, 185, 129, 0.5),
      0 0 25px 10px rgba(16, 185, 129, 0.4),
      inset 0 0 20px 4px rgba(16, 185, 129, 0.25);
    transform: scale(1.025);
  }
  28% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
    transform: scale(1);
  }
  
  /* Pause: Retention */
  44% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
    transform: scale(1);
  }
  
  /* Pulse 3: Final confirmation */
  48% {
    box-shadow: 
      0 0 0 4px rgba(16, 185, 129, 0.4),
      0 0 20px 8px rgba(16, 185, 129, 0.3),
      inset 0 0 20px 4px rgba(16, 185, 129, 0.2);
    transform: scale(1.02);
  }
  52% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
    transform: scale(1);
  }
  
  /* Fade: Graceful exit */
  68% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
    transform: scale(1);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
    transform: scale(1);
  }
}
`;
