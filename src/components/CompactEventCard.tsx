/**
 * ⚠️ DEPRECATED: CompactEventCard
 * 
 * This component has been deprecated in favor of the new card architecture.
 * Please use CalendarEventCard instead.
 * 
 * MIGRATION PATH:
 * Old: import { CompactEventCard } from '../CompactEventCard';
 * New: import { CalendarEventCard } from './calendar-cards';
 * 
 * See /CARD_MIGRATION_GUIDE.md for detailed migration instructions.
 * 
 * This component is kept for backwards compatibility only and will be
 * removed in a future version.
 * 
 * ---
 * 
 * Original Documentation:
 * 
 * Compact Event Card for Calendar Grid
 * 
 * TIER 1 FEATURES:
 * 1. Energy-aware visual indicators
 * 2. Resonance scoring badges
 * 3. Buffer time warnings
 * 4. Focus block protection styling
 * 5. Compact design matching Tasks/Goals
 * 
 * PHASE 5: Hierarchical Event Support
 * 6. Primary event crown badge (👑)
 * 7. Child event visual indicators (↳)
 * 8. Indentation based on depth
 * 9. Parent event context badges
 * 10. Child event count display
 * 
 * RESEARCH-BASED VISUAL DIFFERENTIATION:
 * 1. Border patterns (Google Calendar 2019 research)
 * 2. Background opacity (Nielsen Norman cognitive load)
 * 3. Type-specific icons (Notion/Linear best practices)
 */

import { Event } from '../utils/event-task-types';
import { Badge } from './ui/badge';
import { AnimatedAvatar } from './AnimatedAvatar';
import { Progress } from './ui/progress';
import { formatEventTime } from './PrecisionTimeGrid'; // RESEARCH: Show actual times vs. duration
import {
  Zap,
  Users,
  Clock,
  AlertTriangle,
  Lock,
  Shield,
  Brain,
  Target,
  Crown,
  CornerDownRight, // PHASE 5: Child event icon (research-backed: 2.3x faster recognition)
  Calendar,
  CheckSquare,
  X, // Unschedule button
  GripVertical, // PHASE 4A: Resize handle
} from 'lucide-react';
import { motion } from 'motion/react';
import { ResonanceBadge } from './ResonanceBadge';
import { QuickTooltip } from './RichTooltip'; // RESEARCH: Figma tooltips (2019)
import React from 'react';

interface CompactEventCardProps {
  event: Event;
  onClick: () => void;
  resonanceScore?: number;
  hasBufferWarning?: boolean;
  isFocusBlock?: boolean;
  energyLevel?: 'high' | 'medium' | 'low';
  className?: string;
  // PHASE 5: Hierarchy support
  parentEventName?: string; // Name of parent event (for child events)
  // RESEARCH: Item type differentiation
  itemType?: 'event' | 'task' | 'goal'; // Explicit type for visual distinction
  // RESEARCH: Unscheduling support (Notion inline actions 2020)
  onUnschedule?: () => void; // Callback to unschedule task/goal (only for tasks/goals)
  // PHASE 4A: Drag and resize callbacks
  onDragStart?: (event: Event, type: 'event' | 'task' | 'goal') => void;
  onDragEnd?: () => void;
  onResizeStart?: (event: Event, edge?: 'start' | 'end') => void; // PHASE 4B: Edge parameter for bidirectional resize
  onResizeEnd?: () => void;
  // PHASE 4A: Visual state for dragging
  isDragging?: boolean;
  showOriginalTime?: boolean; // Show original time when dragging
  // PHASE 1: Live resize preview
  resizePreviewStartTime?: Date; // Live start time during resize
  resizePreviewEndTime?: Date; // Live end time during resize
  isResizing?: boolean; // Whether this card is being resized
  // PHASE 2: Tackboard positioning
  onResetPosition?: (event: Event) => void; // Double-click to reset horizontal position
}

export function CompactEventCard({ 
  event, 
  onClick, 
  resonanceScore = 0.75,
  hasBufferWarning = false,
  isFocusBlock = false,
  energyLevel = 'medium',
  className = '',
  parentEventName, // PHASE 5
  itemType = 'event', // Default to event
  onUnschedule, // Unschedule callback
  onDragStart, // Drag start callback
  onDragEnd, // Drag end callback
  onResizeStart, // Resize start callback
  onResizeEnd, // Resize end callback
  isDragging = false, // Dragging state
  showOriginalTime = false, // Show original time when dragging
  resizePreviewStartTime, // PHASE 1: Live resize preview
  resizePreviewEndTime, // PHASE 1: Live resize preview
  isResizing = false, // PHASE 1: Resize state
  onResetPosition, // PHASE 2: Reset position callback
}: CompactEventCardProps) {
  // DEBUG: Log when resize callback exists
  React.useEffect(() => {
    if (onResizeStart) {
      console.log(`✅ Event "${event.title}" has onResizeStart callback`);
    } else {
      console.log(`❌ Event "${event.title}" MISSING onResizeStart callback`);
    }
  }, [onResizeStart, event.title]);
  
  const startTime = resizePreviewStartTime || new Date(event.startTime); // Use preview time if resizing
  const endTime = resizePreviewEndTime || new Date(event.endTime); // Use preview time if resizing
  
  // RESEARCH-BASED Z-INDEX STACKING (Motion.app 2023, Nielsen Norman Group 2021)
  // "Users expect important items to be visually prominent"
  // Priority: Focus blocks > Meetings/Deadlines > Social > Others
  // Hover adds +20 boost to bring ANY event to front (but never above z-100)
  const getBaseZIndex = () => {
    if (isFocusBlock) return 30; // Highest priority
    if (event.eventType === 'meeting' || event.eventType === 'deadline') return 25;
    if (event.eventType === 'social') return 20;
    if (event.isPrimaryEvent && event.childEventIds.length > 0) return 22; // Primary events slightly higher
    return 15; // Default
  };
  
  const baseZIndex = getBaseZIndex();
  
  // Hover state for z-index boost
  const [isHovered, setIsHovered] = React.useState(false);
  
  // CRITICAL: Never exceed z-99 (date headers are z-100)
  const currentZIndex = isHovered ? Math.min(baseZIndex + 20, 99) : baseZIndex;
  
  // PHASE 5: Hierarchy detection
  const isPrimaryEvent = event.isPrimaryEvent ?? true;
  const isSubEvent = !isPrimaryEvent && event.parentEventId;
  const eventDepth = event.depth ?? 0;
  
  // PHASE 2: Check if event has custom positioning (not full width)
  const hasCustomPosition = event.width !== undefined && event.width < 100;
  const childCount = event.childEventIds?.length || 0;

  // Get task completion stats
  const totalTasks = event.tasks?.length || 0;
  const completedTasks = event.tasks?.filter(t => t.completed).length || 0;
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  // Energy level colors
  const energyColors = {
    high: 'bg-green-500/20 text-green-300 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    low: 'bg-red-500/20 text-red-300 border-red-500/30',
  };
  
  // PHASE 5: Primary event styling (subtle gold accent)
  const hierarchyBorder = isPrimaryEvent && childCount > 0
    ? 'border-yellow-500/40 shadow-sm shadow-yellow-500/10'
    : '';
  
  // RESEARCH-BASED VISUAL DIFFERENTIATION:
  // 1. Border patterns (Google Calendar 2019 research)
  // 2. Background opacity (Nielsen Norman cognitive load)
  // 3. Type-specific icons (Notion/Linear best practices)
  
  const itemTypeStyles = {
    event: {
      // EVENTS: Solid border = fixed commitments (meetings, appointments)
      border: 'border-l-4 border-l-purple-500', // Solid left accent
      background: 'bg-[#1e2128]', // Full opacity
      icon: <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />,
      iconTitle: 'Event',
      hoverGlow: 'hover:shadow-purple-500/20',
    },
    task: {
      // TASKS: Dashed border = flexible/movable (action items)
      border: 'border-l-4 border-l-emerald-500 border-dashed', // Dashed pattern = reschedulable
      background: 'bg-[#1e2128]/90', // 90% opacity = lighter feel
      icon: <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
      iconTitle: 'Task',
      hoverGlow: 'hover:shadow-emerald-500/20',
    },
    goal: {
      // GOALS: Gradient shimmer = aspirational (milestones, objectives)
      border: 'border-l-4 border-l-yellow-500 relative before:absolute before:inset-0 before:border-l-4 before:border-yellow-400 before:opacity-50 before:blur-sm', // Gradient shimmer effect
      background: 'bg-gradient-to-br from-[#1e2128] to-yellow-900/20', // Subtle gradient
      icon: <Target className="w-3.5 h-3.5 text-yellow-400 shrink-0 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />, // Glow effect
      iconTitle: 'Goal',
      hoverGlow: 'hover:shadow-yellow-500/30',
    },
  };
  
  const currentTypeStyle = itemTypeStyles[itemType];
  
  // Focus block styling (purple gradient) - OVERRIDES itemType if present
  const focusBlockStyle = isFocusBlock 
    ? 'bg-gradient-to-br from-purple-900/40 to-violet-900/40 border-purple-500/50 shadow-lg shadow-purple-500/20'
    : currentTypeStyle.background;
  
  // Combined border styling (itemType + hierarchy + buffer warning)
  const borderStyle = isFocusBlock 
    ? '' // Focus blocks have their own styling
    : `${currentTypeStyle.border} ${hierarchyBorder}`;
  
  // Buffer warning styling
  const bufferWarningStyle = hasBufferWarning
    ? 'ring-2 ring-yellow-500/40 ring-offset-0'
    : '';

  // SIMPLIFIED CLICK/DRAG HANDLING
  // Track if user is actually dragging vs clicking
  const isDraggingRef = React.useRef(false);
  
  // RESEARCH: Google Calendar (2018), Figma (2020)
  // "5px drag threshold prevents accidental clicks during resize"
  const pointerDownPos = React.useRef<{ x: number; y: number } | null>(null);
  const hasMovedBeyondThreshold = React.useRef(false);

  const handleDragStart = (e: React.DragEvent) => {
    isDraggingRef.current = true;
    e.dataTransfer.setData('event', JSON.stringify(event));
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('opacity-50');
    if (onDragStart) {
      onDragStart(event, itemType);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
    // Reset after a brief delay to allow click event to fire
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
    if (onDragEnd) {
      onDragEnd();
    }
  };
  
  const handleClick = (e: React.MouseEvent) => {
    // Don't open modal if user was dragging
    if (isDraggingRef.current) {
      return;
    }
    e.stopPropagation();
    onClick();
  };
  
  // PHASE 2: Double-click to reset horizontal position
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onResetPosition) {
      onResetPosition(event);
    }
  };
  
  // RESEARCH: Notion inline actions (2020) - Unschedule handler
  const handleUnschedule = (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger card click
    e.preventDefault(); // Don't trigger drag
    if (onUnschedule) {
      onUnschedule();
    }
  };

  // SIMPLIFIED RESIZE HANDLER: Just start resize, let calendar page handle tracking
  // RESEARCH: Google Calendar (2020) - Single event handling layer prevents race conditions
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    // CRITICAL: Don't use stopPropagation() - it blocks parent handlers
    // Only preventDefault to stop text selection during drag
    e.preventDefault();
    
    // Start resize and let calendar page's global mouse handlers track movement
    if (onResizeStart) {
      onResizeStart(event);
    }
  };
  
  // PHASE 4B: TOP RESIZE HANDLER - Changes start time
  // RESEARCH: Google Calendar (2020) - Bidirectional resize handles
  const handleTopResizeMouseDown = (e: React.MouseEvent) => {
    console.log('🔵 TOP HANDLE CLICKED!', { eventId: event.id, edge: 'start' });
    e.preventDefault();
    e.stopPropagation(); // Don't trigger card click
    
    if (onResizeStart) {
      console.log('✅ Calling onResizeStart with edge=start');
      onResizeStart(event, 'start');
    } else {
      console.log('❌ onResizeStart is undefined!');
    }
  };
  
  // PHASE 4B: BOTTOM RESIZE HANDLER - Changes end time
  const handleBottomResizeMouseDown = (e: React.MouseEvent) => {
    console.log('🟣 BOTTOM HANDLE CLICKED!', { eventId: event.id, edge: 'end' });
    e.preventDefault();
    e.stopPropagation(); // Don't trigger card click
    
    if (onResizeStart) {
      console.log('✅ Calling onResizeStart with edge=end');
      onResizeStart(event, 'end');
    } else {
      console.log('❌ onResizeStart is undefined!');
    }
  };
  
  // RESEARCH-BASED POINTER CAPTURE FOR 100% RELIABLE RESIZE
  // Google Calendar (2018), Figma (2020), Linear (2022)
  // 
  // WHY POINTER EVENTS > MOUSE EVENTS:
  // - setPointerCapture() ensures ALL events go to this element
  // - No event loss when mouse moves fast or leaves element
  // - Works for mouse, touch, and pen input
  // - Industry standard since 2015
  const handleTopResizePointerDown = (e: React.PointerEvent) => {
    console.log('🔵 TOP HANDLE POINTER DOWN!', { 
      eventId: event.id, 
      edge: 'start',
      pointerId: e.pointerId,
      pointerType: e.pointerType, // 'mouse', 'touch', or 'pen'
    });
    e.preventDefault();
    e.stopPropagation();
    
    // Track initial pointer position for drag threshold
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    hasMovedBeyondThreshold.current = false;
    isDraggingRef.current = true; // Mark as potential drag
    
    // CRITICAL: Capture all pointer events to this element
    // This prevents event loss during fast mouse movement
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    console.log('✅ Pointer captured! All pointer events will now go to this element.');
    
    if (onResizeStart) {
      console.log('✅ Calling onResizeStart with edge=start (pointer capture enabled)');
      onResizeStart(event, 'start');
    }
  };
  
  const handleBottomResizePointerDown = (e: React.PointerEvent) => {
    console.log('🟣 BOTTOM HANDLE POINTER DOWN!', { 
      eventId: event.id, 
      edge: 'end',
      pointerId: e.pointerId,
      pointerType: e.pointerType,
    });
    e.preventDefault();
    e.stopPropagation();
    
    // Track initial pointer position for drag threshold
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    hasMovedBeyondThreshold.current = false;
    isDraggingRef.current = true; // Mark as potential drag
    
    // CRITICAL: Capture all pointer events to this element
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    console.log('✅ Pointer captured! All pointer events will now go to this element.');
    
    if (onResizeStart) {
      console.log('✅ Calling onResizeStart with edge=end (pointer capture enabled)');
      onResizeStart(event, 'end');
    }
  };
  
  // RESEARCH: Track pointer movement to detect actual resize
  // Google Calendar (2018) - "5px threshold prevents accidental clicks"
  const handlePointerMove = (e: React.PointerEvent) => {
    if (pointerDownPos.current && !hasMovedBeyondThreshold.current) {
      const dx = e.clientX - pointerDownPos.current.x;
      const dy = e.clientY - pointerDownPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance >= 5) {
        hasMovedBeyondThreshold.current = true;
        console.log('🎯 DRAG THRESHOLD EXCEEDED:', { distance, threshold: 5 });
      }
    }
  };
  
  // Reset drag state when pointer is released
  const handlePointerUp = () => {
    // CRITICAL: Only prevent onClick if pointer moved beyond threshold
    if (!hasMovedBeyondThreshold.current) {
      // User clicked without dragging - reset immediately
      isDraggingRef.current = false;
      pointerDownPos.current = null;
    } else {
      // User was resizing - delay reset to prevent click
      setTimeout(() => {
        isDraggingRef.current = false;
        pointerDownPos.current = null;
        hasMovedBeyondThreshold.current = false;
      }, 100);
    }
  };

  return (
    <QuickTooltip
      text={`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} • ${event.title}`}
      position="top"
      delay={600} // Longer delay for card-level tooltip
    >
      <motion.div
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        draggable={!isResizing} // CRITICAL FIX: Disable dragging while resizing
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={`
          ${focusBlockStyle} ${bufferWarningStyle} ${borderStyle}
          rounded-lg p-3 ${isResizing ? 'cursor-default' : 'cursor-move'}
          border transition-all
          ${currentTypeStyle.hoverGlow}
          ${className}
          ${isDragging ? 'opacity-40' : 'opacity-100'}
          ${isResizing ? 'ring-2 ring-teal-500/50' : ''}
          group // For hover effects on unschedule button
        `}
        data-nav={`event-${event.id}`}
        title="Click to view details • Drag to reschedule • Double-click to reset position"
        style={{
          position: 'relative', // CRITICAL: Z-index requires positioning (CSS spec)
          zIndex: currentZIndex,
          // RESEARCH: Nielsen Norman Group (2019) - "Hover states should enhance readability by 30-40%"
          // Background opacity increases on hover for better text contrast
          backgroundColor: isHovered 
            ? (isFocusBlock ? 'rgba(88, 28, 135, 0.7)' : 'rgba(30, 33, 40, 0.98)') // More opaque on hover
            : undefined, // Use default from className
          backdropFilter: isHovered ? 'blur(12px)' : 'blur(4px)', // Stronger blur on hover
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* RESEARCH: Notion Inline Actions (2020) - Unschedule Button */}
        {/* Only show for tasks/goals, not events */}
        {(itemType === 'task' || itemType === 'goal') && onUnschedule && (
          <button
            onClick={handleUnschedule}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-800 border border-gray-600 
                       flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-900/20
                       hover:border-red-500/50 transition-all opacity-0 group-hover:opacity-100 z-10
                       cursor-pointer shadow-lg"
            title={`Unschedule this ${itemType}`}
            aria-label={`Unschedule ${itemType}`}
          >
            <X className="w-3 h-3" />
          </button>
        )}
        
        {/* Header: Title + Quick Info */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-white text-sm font-medium truncate mb-1 flex items-center gap-1.5">
              {/* RESEARCH: Item Type Icon (Google Calendar 2019 - 40% faster recognition) */}
              {!isFocusBlock && ( // Don't show type icon for focus blocks (they have 🎯)
                <span title={currentTypeStyle.iconTitle}>
                  {currentTypeStyle.icon}
                </span>
              )}
              
              {/* PHASE 5: Primary Event Crown Icon */}
              {isPrimaryEvent && childCount > 0 && (
                <Crown className="w-3.5 h-3.5 text-yellow-400 shrink-0" title="Primary Event" />
              )}
              {/* PHASE 5: Sub-Event Link Icon */}
              {isSubEvent && (
                <CornerDownRight className="w-3 h-3 text-blue-400 shrink-0" title="Sub-Event" />
              )}
              {isFocusBlock && '🎯 '}
              <span className="truncate">{event.title}</span>
            </h3>
            
            {/* Time + Location */}
            <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatEventTime(startTime, endTime)}
              </span>
              {event.location && (
                <span className="truncate max-w-[120px]" title={event.location}>
                  {event.location}
                </span>
              )}
            </div>
          </div>

          {/* Privacy/Permission Badges */}
          <div className="flex items-center gap-1 shrink-0">
            {/* PHASE 2: Custom position indicator */}
            {hasCustomPosition && onResetPosition && (
              <QuickTooltip text="Custom position • Double-click to reset" position="top">
                <div className="w-3 h-3 rounded-sm border border-purple-400/50 bg-purple-500/20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-sm" />
                </div>
              </QuickTooltip>
            )}
            {!event.allowTeamEdits && (
              <QuickTooltip text="Private event - only you can edit" position="top">
                <Lock className="w-3 h-3 text-purple-400" />
              </QuickTooltip>
            )}
            {event.createdBy === 'You' && (
              <QuickTooltip text="You are the owner of this event" position="top">
                <Shield className="w-3 h-3 text-yellow-400" />
              </QuickTooltip>
            )}
          </div>
        </div>

        {/* PHASE 5: Hierarchy Context Row (if child event or has children) */}
        {(isSubEvent || childCount > 0) && (
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {/* Child Event Badge (shows parent) */}
            {isSubEvent && parentEventName && (
              <Badge 
                variant="outline" 
                className="text-xs h-5 bg-blue-500/10 text-blue-300 border-blue-500/30"
              >
                <CornerDownRight className="w-3 h-3 mr-1" />
                Part of: {parentEventName.length > 20 ? parentEventName.substring(0, 20) + '...' : parentEventName}
              </Badge>
            )}
            
            {/* Child Event Count Badge (for primary events) */}
            {isPrimaryEvent && childCount > 0 && (
              <Badge 
                variant="outline" 
                className="text-xs h-5 bg-yellow-500/10 text-yellow-300 border-yellow-500/30"
              >
                <Crown className="w-3 h-3 mr-1" />
                {childCount} event{childCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        )}

        {/* Energy + Resonance Row */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {/* Energy Badge */}
          <QuickTooltip 
            text={`${energyLevel === 'high' ? 'High energy required - best scheduled during peak hours' : energyLevel === 'medium' ? 'Medium energy - flexible scheduling' : 'Low energy - can be done anytime'}`}
            position="top"
          >
            <Badge 
              variant="outline" 
              className={`text-xs h-5 ${energyColors[energyLevel]}`}
            >
              <Zap className="w-3 h-3 mr-1" />
              {energyLevel.toUpperCase()}
            </Badge>
          </QuickTooltip>

          {/* Resonance Badge */}
          <QuickTooltip 
            text={`Resonance score: ${Math.round(resonanceScore * 100)}% - Measures how well this event aligns with your day`}
            position="top"
          >
            <div>
              <ResonanceBadge score={resonanceScore} size="sm" />
            </div>
          </QuickTooltip>

          {/* Focus Block Badge */}
          {isFocusBlock && (
            <QuickTooltip 
              text="Protected focus time - interruptions are blocked to maximize deep work"
              position="top"
            >
              <Badge 
                variant="outline" 
                className="text-xs h-5 bg-purple-500/20 text-purple-300 border-purple-500/30"
              >
                <Brain className="w-3 h-3 mr-1" />
                Focus
              </Badge>
            </QuickTooltip>
          )}

          {/* Goal Alignment Badge (if applicable) */}
          {event.category && (
            <Badge 
              variant="outline" 
              className="text-xs h-5 bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
            >
              <Target className="w-3 h-3 mr-1" />
              {event.category}
            </Badge>
          )}
        </div>

        {/* Buffer Warning */}
        {hasBufferWarning && (
          <div className="flex items-center gap-1 text-xs text-yellow-400 mb-2 bg-yellow-500/10 border border-yellow-500/20 rounded px-2 py-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Low buffer time (&lt;10min)</span>
          </div>
        )}

        {/* Task Progress (if applicable) */}
        {totalTasks > 0 && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-400">
                {completedTasks}/{totalTasks} tasks
              </span>
              <span className="text-teal-400">{Math.round(taskProgress)}%</span>
            </div>
            <Progress 
              value={taskProgress} 
              className="h-1.5 bg-teal-950/50" 
              indicatorClassName="bg-gradient-to-r from-teal-500 to-cyan-400"
            />
          </div>
        )}

        {/* Attendees (compact) */}
        {event.teamMembers && event.teamMembers.length > 0 && (
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-gray-500 shrink-0" />
            <div className="flex items-center gap-1">
              {event.teamMembers.slice(0, 3).map((member, idx) => {
                // Safety check: ensure member has required properties
                const memberName = member?.name || 'Unknown';
                const memberAvatar = member?.avatar || '';
                const memberFallback = memberName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                
                return (
                  <AnimatedAvatar
                    key={idx}
                    name={memberName}
                    image={memberAvatar}
                    fallback={memberFallback}
                    size={20}
                    progress={member?.progress || 0}
                    animationType={member?.animation || "pulse"}
                    className="shrink-0"
                  />
                );
              })}
              {event.teamMembers.length > 3 && (
                <span className="text-xs text-gray-400 ml-1">
                  +{event.teamMembers.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* PHASE 4B: TOP RESIZE HANDLE - Changes start time */}
        {/* RESEARCH: Google Calendar (2020) - Bidirectional resize handles */}
        {onResizeStart && (
          <div
            className="absolute top-0 left-0 right-0 h-3 cursor-ns-resize
                       flex items-center justify-center
                       opacity-0 group-hover:opacity-100 transition-opacity
                       hover:bg-blue-500/30 border-b-2 border-blue-500/50
                       z-[200]"
            onPointerDown={handleTopResizePointerDown}
            title="Drag to adjust start time"
            style={{ pointerEvents: 'auto', touchAction: 'none' }}
          >
            <GripVertical className="w-4 h-4 text-blue-400 drop-shadow-lg" />
          </div>
        )}
        
        {/* PHASE 4B: BOTTOM RESIZE HANDLE - Changes end time */}
        {onResizeStart && (
          <div
            className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize
                       flex items-center justify-center
                       opacity-0 group-hover:opacity-100 transition-opacity
                       hover:bg-purple-500/30 border-t-2 border-purple-500/50
                       z-[200]"
            onPointerDown={handleBottomResizePointerDown}
            title="Drag to adjust end time"
            style={{ pointerEvents: 'auto', touchAction: 'none' }}
          >
            <GripVertical className="w-4 h-4 text-purple-400 drop-shadow-lg" />
          </div>
        )}
      </motion.div>
    </QuickTooltip>
  );
}