/**
 * 📝 LIST TASK CARD - Task List View Card
 * 
 * Optimized for task list views (not calendar):
 * - Click to open details
 * - Unschedule button to remove from calendar
 * - NO drag (tasks are in a vertical list)
 * - NO resize (duration managed in modal)
 * 
 * RESEARCH BASIS:
 * - Todoist List View (2023) - Simple click + unschedule
 * - Things 3 (2022) - Minimal interactions in list
 * - Linear Issues (2023) - Click-focused UI
 * 
 * USE CASE:
 * Tasks & Goals page, unscheduled items sidebar, search results
 * 
 * USAGE:
 * <ListTaskCard
 *   task={task}
 *   onClick={() => openTaskDetails(task)}
 *   onUnschedule={() => removeFromCalendar(task)}
 * />
 */

import React from 'react';
import { Task } from '../../../utils/event-task-types';
import { BaseCard } from '../core/BaseCard';
import { InteractiveCard } from '../features/InteractiveCard';
import { UnschedulableCard } from '../features/UnschedulableCard';

export interface ListTaskCardProps {
  // Data
  task: Task;
  itemType?: 'task' | 'goal'; // Default: 'task'
  
  // Callbacks
  onClick?: () => void;
  onUnschedule?: () => void;
  
  // Display overrides
  showTime?: boolean; // Show time if scheduled (default: true)
  showDate?: boolean; // Show date (default: false, only in list)
  showEnergy?: boolean; // Show energy badge (default: true)
  showResonance?: boolean; // Show resonance (default: true)
  showProgress?: boolean; // Show task progress (default: true)
  
  // Visual overrides
  energyLevel?: 'high' | 'medium' | 'low';
  resonanceScore?: number;
  
  // Layout
  compact?: boolean; // More compact layout (default: false)
  
  // Feature toggles
  enableClick?: boolean; // Default: true
  enableUnschedule?: boolean; // Default: true
  
  // Styling
  className?: string;
  zIndex?: number;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * LIST TASK CARD COMPONENT
 * ═══════════════════════════════════════════════════════════════
 */

export function ListTaskCard({
  task,
  itemType = 'task',
  onClick,
  onUnschedule,
  showTime = true,
  showDate = false,
  showEnergy = true,
  showResonance = true,
  showProgress = true,
  energyLevel = 'medium',
  resonanceScore = 0.75,
  compact = false,
  enableClick = true,
  enableUnschedule = true,
  className = '',
  zIndex = 15,
}: ListTaskCardProps) {
  // Parse times
  const startTime = task.startTime ? new Date(task.startTime) : new Date();
  const endTime = task.endTime ? new Date(task.endTime) : new Date(startTime.getTime() + 30 * 60000); // Default 30min
  
  // Task progress
  const totalTasks = 1; // The task itself
  const completedTasks = task.completed ? 1 : 0;
  
  // Build the card
  let card = (
    <BaseCard
      // Core content
      title={task.title}
      startTime={startTime}
      endTime={endTime}
      location={task.location}
      
      // Variant
      itemType={itemType}
      
      // Metadata (conditional based on props)
      category={task.category}
      resonanceScore={showResonance ? resonanceScore : undefined}
      energyLevel={showEnergy ? energyLevel : undefined}
      
      // Tasks
      totalTasks={showProgress ? totalTasks : 0}
      completedTasks={showProgress ? completedTasks : 0}
      
      // States (list cards are never dragging/resizing)
      isDragging={false}
      isResizing={false}
      
      // Styling
      className={`${className} ${compact ? 'p-2' : ''}`}
      zIndex={zIndex}
    />
  );
  
  // Wrap with InteractiveCard if click enabled
  if (enableClick && onClick) {
    card = (
      <InteractiveCard
        onClick={onClick}
        baseZIndex={zIndex}
        title={`${itemType} • ${task.title}`}
      >
        {card}
      </InteractiveCard>
    );
  }
  
  // Wrap with UnschedulableCard if enabled
  if (enableUnschedule && onUnschedule) {
    card = (
      <UnschedulableCard
        itemType={itemType}
        onUnschedule={onUnschedule}
      >
        {card}
      </UnschedulableCard>
    );
  }
  
  return card;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * EXPORT SUMMARY
 * ═══════════════════════════════════════════════════════════════
 * 
 * This component is optimized for:
 * ✅ Task/goal list views
 * ✅ Simple click + unschedule interactions
 * ✅ NO drag or resize (not needed in lists)
 * ✅ Compact layout option
 * ✅ Conditional metadata display
 * 
 * Example usage:
 * 
 * // Basic task in list
 * <ListTaskCard
 *   task={task}
 *   onClick={() => openTaskDetails(task)}
 *   onUnschedule={() => removeFromCalendar(task)}
 * />
 * 
 * // Compact version
 * <ListTaskCard
 *   task={task}
 *   onClick={() => openTaskDetails(task)}
 *   compact={true}
 *   showEnergy={false}
 *   showResonance={false}
 * />
 * 
 * // Read-only (no interactions)
 * <ListTaskCard
 *   task={task}
 *   enableClick={false}
 *   enableUnschedule={false}
 * />
 * 
 * // Goal in list
 * <ListTaskCard
 *   task={goal}
 *   itemType="goal"
 *   onClick={() => openGoalDetails(goal)}
 * />
 */
