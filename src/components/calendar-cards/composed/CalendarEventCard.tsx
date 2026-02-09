import React from 'react';
import { Event, Task } from '../../../utils/event-task-types';
import { BaseCard } from '../core/BaseCard';
import { InteractiveCard } from '../features/InteractiveCard';
import { DraggableCard } from '../features/DraggableCard';
import { PointerDraggableCard } from '../features/PointerDraggableCard';
import { UnschedulableCard } from '../features/UnschedulableCard';
import { 
  calculateBufferTime, 
  hasBufferWarning, 
  isFocusBlock, 
  calculateEnergyLevel, 
  calculateEventResonance 
} from '../../../utils/calendar-intelligence';
import { EventHoverCard } from '../../calendar/EventHoverCard';

/**
 * ═══════════════════════════════════════════════════════════════
 * TYPE DEFINITIONS
 * ═══════════════════════════════════════════════════════════════
 */

export interface CalendarEventCardProps {
  // Core data
  event: Event;
  itemType: 'event' | 'task' | 'goal';
  
  // Callbacks
  onClick?: (event: Event) => void;
  onDoubleClick?: (event: Event) => void;
  onMouseDown?: (e: React.MouseEvent, event: Event) => void; // NEW: For free-form dragging
  
  // Drag hook (simplified API)
  dragHook?: {
    startDrag: (item: Event | Task) => void;
    endDrag: () => void;
    updateDragPosition?: (clientX: number, clientY: number, offsetX: number, offsetY: number) => void;
    startResize: (event: Event, edge: 'top' | 'bottom') => void;
    endResize: () => void;
    startHorizontalResize?: (event: Event, edge: 'left' | 'right') => void;
    endHorizontalResize?: () => void;
    updateHorizontalResize?: (xPosition: number, width: number, edge: 'left' | 'right') => void;
    dragState?: { item: Event | Task };
    resizeState?: { event: Event; edge: 'top' | 'bottom'; resizeEdge: 'top' | 'bottom' };
    horizontalResizeState?: { event: Event; edge: 'left' | 'right'; currentXPosition: number; currentWidth: number };
  };
  
  // Individual callbacks (fallback if dragHook not provided)
  onDragStart?: (item: Event | Task) => void;
  onDragEnd?: () => void;
  onResizeStart?: (event: Event, edge: 'top' | 'bottom') => void;
  onResizeEnd?: () => void;
  onHorizontalResizeStart?: (event: Event, edge: 'left' | 'right') => void;
  onHorizontalResizeMove?: (xPosition: number, width: number, edge: 'left' | 'right') => void;
  onHorizontalResizeEnd?: (xPosition: number, width: number, edge: 'left' | 'right') => void;
  onUnschedule?: () => void;
  
  // Context data
  allEvents?: Event[];
  parentEventName?: string;
  
  // Milestone/Step completion callbacks (NEW)
  onToggleMilestone?: (milestoneId: string) => void;
  onToggleStep?: (milestoneId: string, stepId: string) => void;
  
  // State overrides
  isDragging?: boolean;
  isResizing?: boolean;
  isHorizontalResizing?: boolean;
  resizePreviewStartTime?: Date;
  resizePreviewEndTime?: Date;
  
  // Metadata overrides
  energyLevel?: 'high' | 'medium' | 'low';
  resonanceScore?: number;
  
  // Feature toggles
  enableDrag?: boolean;
  enableResize?: boolean;
  enableHorizontalResize?: boolean;
  enableUnschedule?: boolean;
  enableClick?: boolean;
  
  // Expand/collapse
  isExpanded?: boolean;
  showExpandButton?: boolean;
  onToggleExpand?: () => void;
  isHoveringCard?: boolean; // NEW: Track if hovering over card
  isManuallyExpanded?: boolean; // NEW: Track if manually locked expanded (separate from hover state)
  
  // Styling
  className?: string;
  zIndex?: number;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * CALENDAR EVENT CARD COMPONENT
 * ═══════════════════════════════════════════════════════════════
 */

export function CalendarEventCard({
  event,
  itemType,
  onClick,
  onDoubleClick,
  onMouseDown,
  dragHook,
  onDragStart,
  onDragEnd,
  onResizeStart,
  onResizeEnd,
  onHorizontalResizeStart,
  onHorizontalResizeMove,
  onHorizontalResizeEnd,
  onUnschedule,
  allEvents = [],
  parentEventName,
  isDragging: isDraggingProp,
  isResizing: isResizingProp,
  isHorizontalResizing: isHorizontalResizingProp,
  resizePreviewStartTime,
  resizePreviewEndTime,
  energyLevel: energyLevelOverride,
  resonanceScore: resonanceScoreOverride,
  enableDrag = true, // TEMPORARILY DISABLED - will re-enable after fixes
  enableResize = true,
  enableHorizontalResize = true,
  enableUnschedule = true,
  enableClick = true,
  isExpanded = false,
  showExpandButton = false,
  onToggleExpand,
  className = '',
  zIndex,
  isHoveringCard,
  isManuallyExpanded,
  onToggleMilestone,
  onToggleStep,
}: CalendarEventCardProps) {
  // ═══════════════════════════════════════════════════════════════════════════
  // DRAG ENABLED - Using new free-form drag system with onMouseDown
  // ═══════════════════════════════════════════════════════════════════════════
  const DRAG_TEMPORARILY_DISABLED = false; // ✅ Re-enabled for free-form dragging!
  
  // ══════════════════════════════════════════════════════════════════════════
  // HOVER-TO-EXPAND - Auto-expand on hover (like Google Calendar)
  // ═══════════════════════════════════════════════════════════════════════════
  const [isHovered, setIsHovered] = React.useState(false);
  const [isLocalDragging, setIsLocalDragging] = React.useState(false);
  
  // Expansion logic: Expanded if manually expanded OR currently hovered
  // This allows hover to preview details, while clicking button "pins" the expansion
  const isActuallyExpanded = isExpanded || isHovered || isHoveringCard || isManuallyExpanded;
  
  // Use dragHook if provided, otherwise use individual callbacks
  const handleDragStart = dragHook?.startDrag || onDragStart;
  const handleDragEnd = dragHook?.endDrag || onDragEnd;
  const handleResizeStart = dragHook?.startResize || onResizeStart;
  const handleResizeEnd = dragHook?.endResize || onResizeEnd;
  const handleHorizontalResizeStart = dragHook?.startHorizontalResize || onHorizontalResizeStart;
  // CRITICAL FIX: Use correct property name from dragHook
  const handleHorizontalResizeMove = dragHook?.updateHorizontalResize || onHorizontalResizeMove;
  const handleHorizontalResizeEnd = dragHook?.endHorizontalResize || onHorizontalResizeEnd;
  
  // Determine drag/resize state
  const isDragging = isDraggingProp ?? ((dragHook?.dragState?.item.id === event.id) || isLocalDragging);
  const isResizing = isResizingProp ?? (dragHook?.resizeState?.event.id === event.id);
  const isHorizontalResizing = isHorizontalResizingProp ?? (dragHook?.horizontalResizeState?.event.id === event.id);
  
  // Calculate intelligent metadata
  const focusBlock = isFocusBlock(event);
  const energyLevel = energyLevelOverride || calculateEnergyLevel(event);
  const resonanceScore = resonanceScoreOverride || calculateEventResonance(event);
  
  // Calculate buffer warning if we have the next event
  const nextEvent = allEvents.find(e => 
    new Date(e.startTime).getTime() > new Date(event.endTime).getTime()
  );
  const bufferMinutes = nextEvent ? calculateBufferTime(event, nextEvent) : 999;
  const bufferWarning = hasBufferWarning(bufferMinutes);
  
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
  
  // Milestone progress (NEW)
  // RESEARCH: Milestones = top-level tasks, Steps = subtasks
  // Progressive Disclosure: Show milestone count, expand to see steps
  const milestones = event.tasks?.map(task => ({
    id: task.id,
    title: task.title,
    completed: task.completed,
    steps: task.subtasks?.map(subtask => ({
      id: subtask.id,
      title: subtask.title,
      completed: subtask.completed,
    })) || [],
  })) || [];
  
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(m => m.completed).length;
  
  // RESEARCH: Google Calendar (2020) - Z-index stacking
  // Focus blocks > Meetings/Deadlines > Social > Others
  const calculateBaseZIndex = () => {
    if (zIndex !== undefined) return zIndex;
    if (focusBlock) return 30;
    if (event.eventType === 'meeting' || event.eventType === 'deadline') return 25;
    if (event.eventType === 'social') return 20;
    if (isPrimaryEvent && childCount > 0) return 22;
    return 15;
  };
  
  const baseZIndex = calculateBaseZIndex();
  
  // Build the composition
  let card = (
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
      resizingEdge={dragHook?.resizeState?.resizeEdge} // ✅ Pass which edge is being resized
      isFocusBlock={focusBlock}
      
      // Hierarchy
      isPrimaryEvent={isPrimaryEvent}
      isSubEvent={isSubEvent}
      parentEventName={parentEventName}
      childCount={childCount}
      
      // Metadata
      category={event.category}
      color={event.color}
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
      
      // Milestones (NEW)
      totalMilestones={totalMilestones}
      completedMilestones={completedMilestones}
      milestones={milestones}
      onToggleMilestone={onToggleMilestone}
      onToggleStep={onToggleStep}
      
      // Team
      teamMembers={event.teamMembers}
      
      // NEW: Resize zones (replaces ResizableCard wrapper)
      showResizeZones={enableResize}
      onResizeStart={enableResize && handleResizeStart ? (e, edge) => {
        // ✅ CRITICAL FIX: Pass the ACTUAL edge type (not legacy conversion)
        // The dragHook.startResize() accepts all 8 edges: top, bottom, left, right, corners
        // Previous bug: Was converting left/right → bottom, causing horizontal resizes to fail
        // RESEARCH: Microsoft Word (2024) - 8-directional resize for maximum flexibility
        handleResizeStart(event, edge as any);
      } : undefined}
      
      // Expand/Collapse
      isExpanded={isActuallyExpanded}
      showExpandButton={showExpandButton}
      onToggleExpand={onToggleExpand}
      isHoveringCard={isHoveringCard}
      isManuallyExpanded={isManuallyExpanded}
      
      // Styling
      className={className}
      zIndex={baseZIndex}
    />
  );
  
  // Wrap with InteractiveCard if click enabled
  if (enableClick && onClick) {
    card = (
      <InteractiveCard
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        isDragging={isDragging}
        isResizing={isResizing}
        disableClickTracking={true} // ✅ DISABLE click tracking for free-form drag compatibility
        baseZIndex={baseZIndex}
        title={`${itemType} • ${event.title}`}
        onHoverChange={(hovered) => setIsHovered(hovered)}
      >
        {card}
      </InteractiveCard>
    );
  } else {
    // Even without click enabled, we still want hover-to-expand
    card = (
      <div
        className="h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {card}
      </div>
    );
  }
  
  // Wrap with DraggableCard if drag enabled
  // ✅ CRITICAL FIX: Render wrapper if EITHER old drag system OR new free-form drag system is used
  // RESEARCH: React Patterns (2023) - "Check for feature availability, not implementation details"
  
  console.log('🔍 DRAG WRAPPER CHECK:', {
    enableDrag,
    handleDragStart: !!handleDragStart,
    onMouseDown: !!onMouseDown,
    DRAG_TEMPORARILY_DISABLED,
    willRenderWrapper: enableDrag && (handleDragStart || onMouseDown) && !DRAG_TEMPORARILY_DISABLED,
  });
  
  if (enableDrag && (handleDragStart || onMouseDown) && !DRAG_TEMPORARILY_DISABLED) {
    console.log('✅ RENDERING PointerDraggableCard wrapper for:', event.title);
    card = (
      <PointerDraggableCard
        dragData={event}
        itemType={itemType}
        onDragStart={handleDragStart}
        onDragMove={dragHook?.updateDragPosition}
        onDragEnd={handleDragEnd}
        onDraggingChange={setIsLocalDragging}
        isResizing={isResizing}
        disabled={true} // ✅ DISABLE old drag system - using new free-form system via onMouseDown
        onMouseDown={onMouseDown}
      >
        {card}
      </PointerDraggableCard>
    );
  } else {
    console.log('❌ NOT rendering PointerDraggableCard wrapper for:', event.title);
  }
  
  // Wrap with UnschedulableCard if enabled and applicable
  if (enableUnschedule && (itemType === 'task' || itemType === 'goal') && onUnschedule) {
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
 * ✅ Calendar grid view (main use case)
 * ✅ All interactions enabled by default
 * ✅ Intelligent defaults (auto-calculates resonance, energy)
 * ✅ Simplified API (dragHook pattern)
 * ✅ Feature toggles (disable drag/resize/etc. as needed)
 * 
 * Example usage:
 * 
 * const dragHook = useCalendarDrag();
 * 
 * <CalendarEventCard
 *   event={event}
 *   itemType="event"
 *   onClick={() => setSelectedEvent(event)}
 *   dragHook={dragHook}
 *   allEvents={dayEvents}
 * />
 * 
 * Or with individual callbacks:
 * 
 * <CalendarEventCard
 *   event={event}
 *   itemType="task"
 *   onClick={() => openTaskModal(task)}
 *   onDragStart={(item) => handleDrag(item)}
 *   onResizeStart={(item, edge) => handleResize(item, edge)}
 *   onUnschedule={() => removeTask(task)}
 * />
 * 
 * Disable features as needed:
 * 
 * <CalendarEventCard
 *   event={event}
 *   itemType="event"
 *   enableDrag={false}  // Fixed position
 *   enableResize={false} // Fixed duration
 * />
 */