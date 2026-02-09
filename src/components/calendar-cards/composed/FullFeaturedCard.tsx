/**
 * 🎨 FULL-FEATURED CARD - Complete Composition Example
 * 
 * Demonstrates how to compose all behavior wrappers with BaseCard.
 * This is a reference implementation showing the composition pattern.
 * 
 * RESEARCH BASIS:
 * - Composition Pattern (Gang of Four, 1994)
 * - Higher-Order Components (React Patterns, 2016)
 * - Render Props Pattern (Michael Jackson, 2017)
 * 
 * ARCHITECTURE:
 * UnschedulableCard (outermost)
 *   └─ ResizableCard
 *       └─ DraggableCard
 *           └─ InteractiveCard
 *               └─ BaseCard (innermost)
 * 
 * WHY THIS ORDER?
 * 1. Unschedule: Outermost so button appears on top
 * 2. Resize: Before drag to prevent conflicts
 * 3. Drag: Before click to handle drag threshold
 * 4. Interactive: Before BaseCard to manage hover
 * 5. BaseCard: Pure rendering at the core
 * 
 * USAGE:
 * <FullFeaturedCard
 *   event={event}
 *   onClick={() => openModal(event)}
 *   onDragStart={handleDragStart}
 *   onResizeStart={handleResizeStart}
 *   onUnschedule={handleUnschedule}
 * />
 */

import React from 'react';
import { Event, Task } from '../../../utils/event-task-types';
import { BaseCard } from '../core/BaseCard';
import { InteractiveCard } from '../features/InteractiveCard';
import { DraggableCard } from '../features/DraggableCard';
import { ResizableCard } from '../features/ResizableCard';
import { UnschedulableCard } from '../features/UnschedulableCard';
import { 
  calculateBufferTime, 
  hasBufferWarning, 
  isFocusBlock, 
  calculateEnergyLevel, 
  calculateEventResonance 
} from '../../../utils/calendar-intelligence';

export interface FullFeaturedCardProps {
  // Data
  event: Event | Task;
  itemType: 'event' | 'task' | 'goal';
  
  // Callbacks
  onClick?: () => void;
  onDoubleClick?: () => void;
  onDragStart?: (item: any, itemType: string) => void;
  onDragEnd?: () => void;
  onResizeStart?: (item: any, edge: 'start' | 'end') => void;
  onResizeEnd?: () => void;
  onUnschedule?: () => void;
  
  // Context
  allEvents?: Event[]; // For buffer calculation
  parentEventName?: string;
  
  // State
  isDragging?: boolean;
  isResizing?: boolean;
  resizePreviewStartTime?: Date;
  resizePreviewEndTime?: Date;
  
  // Visual overrides
  energyLevel?: 'high' | 'medium' | 'low';
  resonanceScore?: number;
  
  // Styling
  className?: string;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * FULL-FEATURED CARD COMPONENT
 * ═══════════════════════════════════════════════════════════════
 */

export function FullFeaturedCard({
  event,
  itemType,
  onClick,
  onDoubleClick,
  onDragStart,
  onDragEnd,
  onResizeStart,
  onResizeEnd,
  onUnschedule,
  allEvents = [],
  parentEventName,
  isDragging = false,
  isResizing = false,
  resizePreviewStartTime,
  resizePreviewEndTime,
  energyLevel: energyLevelOverride,
  resonanceScore: resonanceScoreOverride,
  className = '',
}: FullFeaturedCardProps) {
  // Calculate intelligent metadata
  const bufferWarning = hasBufferWarning(event, allEvents);
  const focusBlock = isFocusBlock(event);
  const energyLevel = energyLevelOverride || calculateEnergyLevel(event);
  const resonanceScore = resonanceScoreOverride || calculateEventResonance(event, allEvents);
  
  // Use preview times if resizing
  const displayStartTime = resizePreviewStartTime || new Date(event.startTime);
  const displayEndTime = resizePreviewEndTime || new Date(event.endTime);
  
  // Hierarchy detection
  const isPrimaryEvent = event.isPrimaryEvent ?? true;
  const isSubEvent = !isPrimaryEvent && event.parentEventId;
  const childCount = event.childEventIds?.length || 0;
  
  // Task progress
  const totalTasks = event.tasks?.length || 0;
  const completedTasks = event.tasks?.filter(t => t.completed).length || 0;
  
  return (
    <UnschedulableCard
      itemType={itemType}
      onUnschedule={onUnschedule}
    >
      <ResizableCard
        item={event}
        onResizeStart={onResizeStart}
        onResizeEnd={onResizeEnd}
        isResizing={isResizing}
        showHandles={true}
      >
        <DraggableCard
          dragData={event}
          itemType={itemType}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          isResizing={isResizing}
        >
          <InteractiveCard
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            isDragging={isDragging}
            isResizing={isResizing}
            title={`${itemType} • ${event.title}`}
          >
            <BaseCard
              // Core content
              title={event.title}
              startTime={displayStartTime}
              endTime={displayEndTime}
              location={event.location}
              
              // Variant
              itemType={itemType}
              
              // States
              isDragging={isDragging}
              isResizing={isResizing}
              isFocusBlock={focusBlock}
              
              // Hierarchy
              isPrimaryEvent={isPrimaryEvent}
              isSubEvent={isSubEvent}
              parentEventName={parentEventName}
              childCount={childCount}
              
              // Metadata
              category={event.category}
              resonanceScore={resonanceScore}
              energyLevel={energyLevel}
              hasBufferWarning={bufferWarning}
              hasCustomPosition={event.tackboardPosition !== undefined}
              
              // Privacy
              allowTeamEdits={event.allowTeamEdits}
              createdBy={event.createdBy}
              
              // Tasks
              totalTasks={totalTasks}
              completedTasks={completedTasks}
              
              // Team
              teamMembers={event.teamMembers}
              
              // Styling
              className={className}
            />
          </InteractiveCard>
        </DraggableCard>
      </ResizableCard>
    </UnschedulableCard>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════
 * EXPORT SUMMARY
 * ═══════════════════════════════════════════════════════════════
 * 
 * This composition demonstrates:
 * ✅ Proper wrapper ordering (unschedule → resize → drag → click → render)
 * ✅ Clean separation of concerns (each wrapper = one responsibility)
 * ✅ Reusability (any wrapper can be removed/swapped)
 * ✅ Type safety (full TypeScript support)
 * ✅ Intelligent defaults (auto-calculates resonance, energy, etc.)
 * 
 * Example usage:
 * 
 * <FullFeaturedCard
 *   event={event}
 *   itemType="event"
 *   onClick={() => setSelectedEvent(event)}
 *   onDragStart={(item) => dragHook.startDrag(item, 'event')}
 *   onResizeStart={(item, edge) => dragHook.startResize(item, edge)}
 *   allEvents={dayEvents}
 * />
 * 
 * You can also compose your own:
 * 
 * <ResizableCard {...}>
 *   <BaseCard {...} />
 * </ResizableCard>
 * 
 * <InteractiveCard {...}>
 *   <BaseCard {...} />
 * </InteractiveCard>
 */