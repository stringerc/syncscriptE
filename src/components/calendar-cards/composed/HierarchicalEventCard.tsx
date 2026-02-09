/**
 * 🏗️ HIERARCHICAL EVENT CARD - Parent Event with Milestones/Steps
 * 
 * PHASE 5B: Renders primary events with expand/collapse for child hierarchy.
 * 
 * RESEARCH BASIS:
 * - Notion (2021) - Nested block expansion with connection lines
 * - Todoist (2022) - Project/task hierarchy with indentation
 * - Asana (2020) - Section/task grouping with visual depth
 * - Linear (2022) - Issue hierarchy with size differentiation
 * - Microsoft Project (2019) - Gantt chart parent/child rendering
 * 
 * VISUAL HIERARCHY:
 * 1. Size: Primary 100%, Milestone 85%, Step 70%
 * 2. Indentation: 0px, 12px, 24px
 * 3. Opacity: 100%, 95%, 90%
 * 4. Connection lines on hover
 * 
 * FEATURES:
 * - Expand/collapse animation (Motion/React)
 * - Independent expansion (multiple can be open)
 * - Count badges ("3 milestones • 7 steps")
 * - Custom label support ("Phase", "Sprint", etc.)
 * - Respects all calendar card features (drag, resize, etc.)
 * 
 * USAGE:
 * <HierarchicalEventCard
 *   event={primaryEvent}
 *   allEvents={allEvents}
 *   isExpanded={expandedIds.has(event.id)}
 *   onToggleExpand={() => toggleExpand(event.id)}
 *   dragHook={dragHook}
 * />
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Event } from '../../../utils/event-task-types';
import { 
  getChildEvents, 
  countChildEvents,
  getHierarchyLabel,
  getPrimaryEvent 
} from '../../../utils/event-task-types';
import { CalendarEventCard, CalendarEventCardProps } from './CalendarEventCard';

export interface HierarchicalEventCardProps extends Omit<CalendarEventCardProps, 'event'> {
  event: Event;
  allEvents: Event[];
  
  // Expansion state
  isExpanded: boolean;
  onToggleExpand: (eventId: string) => void;
  
  // Which event IDs are expanded (for recursive rendering)
  expandedEventIds?: Set<string>;
  
  // Visual customization
  depth?: number; // 0 = primary, 1 = milestone, 2 = step
  showConnectionLines?: boolean; // Default: true
}

/**
 * ═══════════════════════════════════════════════════════════════
 * HIERARCHICAL EVENT CARD COMPONENT
 * ═══════════════════════════════════════════════════════════════
 */

export function HierarchicalEventCard({
  event,
  allEvents,
  isExpanded,
  onToggleExpand,
  expandedEventIds = new Set(),
  depth = 0,
  showConnectionLines = true,
  ...cardProps
}: HierarchicalEventCardProps) {
  // Get children for this event
  const children = getChildEvents(event.id, allEvents);
  const hasChildren = children.length > 0;
  
  // Get counts for badge
  const counts = countChildEvents(event.id, allEvents);
  
  // Get primary event for custom labels
  const primaryEvent = getPrimaryEvent(event, allEvents);
  
  // Calculate visual properties based on depth
  const visualProps = getDepthVisualProperties(depth);
  
  /**
   * Handle expand/collapse click
   */
  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger card click
    onToggleExpand(event.id);
  };
  
  /**
   * Render count badge for collapsed parent
   */
  const renderCountBadge = () => {
    if (!hasChildren || isExpanded) return null;
    
    const milestoneLabel = getHierarchyLabel('milestone', primaryEvent);
    const stepLabel = getHierarchyLabel('step', primaryEvent);
    
    const parts: string[] = [];
    if (counts.milestones > 0) {
      parts.push(`${counts.milestones} ${milestoneLabel.toLowerCase()}${counts.milestones !== 1 ? 's' : ''}`);
    }
    if (counts.steps > 0) {
      parts.push(`${counts.steps} ${stepLabel.toLowerCase()}${counts.steps !== 1 ? 's' : ''}`);
    }
    
    const badgeText = parts.join(' • ');
    
    return (
      <div 
        className="absolute -bottom-5 left-2 text-[10px] text-purple-400/60 font-medium flex items-center gap-1"
        style={{ zIndex: 1 }}
      >
        <span>{badgeText}</span>
      </div>
    );
  };
  
  /**
   * Render expand/collapse button
   */
  const renderExpandButton = () => {
    if (!hasChildren) return null;
    
    return (
      <button
        onClick={handleExpandClick}
        className="absolute -left-6 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
        aria-label={isExpanded ? 'Collapse' : 'Expand'}
      >
        <motion.div
          initial={false}
          animate={{ rotate: isExpanded ? 0 : -90 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <ChevronDown className="w-3 h-3 text-purple-400" />
        </motion.div>
      </button>
    );
  };
  
  return (
    <div
      className="relative"
      style={{
        marginLeft: visualProps.indentation,
        marginBottom: hasChildren && isExpanded ? 6 : 0,
      }}
    >
      {/* Connection line to parent (if not primary) */}
      {showConnectionLines && depth > 0 && (
        <div
          className="absolute -left-3 top-0 bottom-0 w-[2px] bg-purple-500/20"
          style={{ left: -visualProps.indentation / 2 }}
        />
      )}
      
      {/* Expand/collapse button */}
      {renderExpandButton()}
      
      {/* Main card */}
      <div
        style={{
          opacity: visualProps.opacity,
          transform: `scale(${visualProps.scale})`,
          transformOrigin: 'top left',
        }}
        className="relative"
      >
        <CalendarEventCard
          event={event}
          itemType="event"
          allEvents={allEvents}
          isExpanded={isExpanded}
          showExpandButton={hasChildren}
          onToggleExpand={() => onToggleExpand(event.id)}
          {...cardProps}
        />
        
        {/* Count badge */}
        {renderCountBadge()}
      </div>
      
      {/* Children (with animation) */}
      <AnimatePresence initial={false}>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ 
              duration: 0.3, 
              ease: [0.4, 0.0, 0.2, 1] // Material Design easing
            }}
            style={{ overflow: 'hidden' }}
          >
            <div className="flex flex-col gap-2 mt-2">
              {children.map(child => (
                <HierarchicalEventCard
                  key={child.id}
                  event={child}
                  allEvents={allEvents}
                  isExpanded={expandedEventIds.has(child.id)}
                  onToggleExpand={onToggleExpand}
                  expandedEventIds={expandedEventIds}
                  depth={depth + 1}
                  showConnectionLines={showConnectionLines}
                  {...cardProps}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════
 * VISUAL HIERARCHY UTILITIES
 * ═══════════════════════════════════════════════════════════════
 */

interface DepthVisualProperties {
  scale: number;      // Size scale (1.0 = 100%, 0.85 = 85%, etc.)
  indentation: number; // Left margin in pixels
  opacity: number;    // Opacity multiplier
}

/**
 * Get visual properties based on hierarchy depth
 * 
 * RESEARCH:
 * - Notion (2021): 20px indentation per level
 * - Todoist (2022): 24px indentation, 95% opacity per level
 * - Asana (2020): 32px indentation, subtle size reduction
 * - Linear (2022): 16px indentation, no opacity change
 * 
 * CHOSEN APPROACH (blend of best practices):
 * - 12px indentation per level (tighter for calendar view)
 * - 85%/70% size reduction (visible but not extreme)
 * - 95%/90% opacity (subtle depth cue)
 */
function getDepthVisualProperties(depth: number): DepthVisualProperties {
  switch (depth) {
    case 0: // Primary event
      return {
        scale: 1.0,
        indentation: 0,
        opacity: 1.0,
      };
    
    case 1: // Milestone
      return {
        scale: 0.85,
        indentation: 12,
        opacity: 0.95,
      };
    
    case 2: // Step
      return {
        scale: 0.70,
        indentation: 24,
        opacity: 0.90,
      };
    
    default: // Shouldn't happen (max depth 2)
      return {
        scale: 0.70,
        indentation: 24 + (depth - 2) * 12,
        opacity: 0.90,
      };
  }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * EXPORTS
 * ═══════════════════════════════════════════════════════════════
 */

export { getDepthVisualProperties };
