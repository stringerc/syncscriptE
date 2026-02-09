/**
 * ❌ UNSCHEDULABLE CARD - Unschedule Action Wrapper
 * 
 * Adds an unschedule button to remove items from calendar.
 * 
 * RESEARCH BASIS:
 * - Notion Inline Actions (2020)
 * - Todoist Quick Actions (2019)
 * - Linear Hover Actions (2022)
 * 
 * FEATURES:
 * - Hover-activated unschedule button
 * - Appears in top-right corner
 * - Only shows for tasks/goals (not events)
 * - Prevents event bubbling to avoid conflicts
 * - Visual feedback on hover
 * 
 * USAGE:
 * <UnschedulableCard
 *   itemType="task"
 *   onUnschedule={() => removeFromCalendar(task)}
 * >
 *   <BaseCard {...visualProps} />
 * </UnschedulableCard>
 */

import React from 'react';
import { X } from 'lucide-react';

export interface UnschedulableCardProps {
  children: React.ReactNode;
  
  // Item type (only tasks/goals are unschedulable)
  itemType: 'event' | 'task' | 'goal';
  
  // Callback
  onUnschedule?: () => void;
  
  // Visual control
  showButton?: boolean; // Force show/hide button
  disabled?: boolean; // Disable unschedule action
  
  // Position
  buttonPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

/**
 * ═══════════════════════════════════════════════════════════════
 * UNSCHEDULABLE CARD COMPONENT
 * ═══════════════════════════════════════════════════════════════
 */

export function UnschedulableCard({
  children,
  itemType,
  onUnschedule,
  showButton = true,
  disabled = false,
  buttonPosition = 'top-right',
}: UnschedulableCardProps) {
  /**
   * Handle unschedule button click
   * RESEARCH: Notion (2020) - Inline actions prevent event bubbling
   */
  const handleUnschedule = (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger card click
    e.preventDefault(); // Don't trigger drag
    
    if (disabled) return;
    
    console.log('🗑️ UNSCHEDULE CLICKED:', { itemType });
    onUnschedule?.();
  };
  
  // Determine if button should show
  // RESEARCH: Only tasks and goals can be unscheduled (events are fixed)
  const shouldShowButton = 
    showButton && 
    (itemType === 'task' || itemType === 'goal') && 
    onUnschedule !== undefined;
  
  // Position classes
  const positionClasses = {
    'top-right': '-top-2 -right-2',
    'top-left': '-top-2 -left-2',
    'bottom-right': '-bottom-2 -right-2',
    'bottom-left': '-bottom-2 -left-2',
  };
  
  return (
    <div className="relative group">
      {children}
      
      {/* Unschedule Button */}
      {shouldShowButton && (
        <button
          onClick={handleUnschedule}
          disabled={disabled}
          className={`
            absolute ${positionClasses[buttonPosition]}
            w-5 h-5 rounded-full 
            bg-gray-800 border border-gray-600 
            flex items-center justify-center 
            text-gray-400 
            hover:text-red-400 hover:bg-red-900/20 hover:border-red-500/50 
            transition-all 
            opacity-0 group-hover:opacity-100 
            z-10
            cursor-pointer 
            shadow-lg
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          title={`Unschedule this ${itemType}`}
          aria-label={`Unschedule ${itemType}`}
          type="button"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════
 * EXPORT SUMMARY
 * ═══════════════════════════════════════════════════════════════
 * 
 * This wrapper adds:
 * ✅ Hover-activated unschedule button
 * ✅ Smart visibility (only tasks/goals)
 * ✅ Event propagation control
 * ✅ Visual feedback
 * ✅ Disabled state support
 * ✅ Customizable position
 * 
 * Example usage:
 * 
 * <UnschedulableCard
 *   itemType="task"
 *   onUnschedule={() => {
 *     removeTaskFromCalendar(task);
 *     showToast('Task unscheduled');
 *   }}
 * >
 *   <ResizableCard {...resizeProps}>
 *     <DraggableCard {...dragProps}>
 *       <InteractiveCard {...clickProps}>
 *         <BaseCard {...visualProps} />
 *       </InteractiveCard>
 *     </DraggableCard>
 *   </ResizableCard>
 * </UnschedulableCard>
 */
