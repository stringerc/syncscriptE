/**
 * 🎨 CALENDAR CARDS MODULE - Main Entry Point
 * 
 * Complete card system with separation of concerns:
 * - Core: Pure presentational components
 * - Features: Behavior wrappers (drag, resize, click, etc.)
 * - Composed: Pre-built combinations
 * - Utils: Sizing, positioning, and helpers
 * 
 * ARCHITECTURE:
 * This module follows the Atomic Design pattern:
 * - Atoms: BaseCard (core/)
 * - Molecules: Feature wrappers (features/)
 * - Organisms: Composed cards (composed/)
 * - Utilities: Shared logic (utils/)
 * 
 * USAGE EXAMPLES:
 * 
 * // 1. Use pre-composed card (easiest)
 * import { FullFeaturedCard } from '@/components/calendar-cards';
 * <FullFeaturedCard event={event} onClick={...} />
 * 
 * // 2. Compose your own (flexible)
 * import { BaseCard, DraggableCard, InteractiveCard } from '@/components/calendar-cards';
 * <DraggableCard onDrag={...}>
 *   <InteractiveCard onClick={...}>
 *     <BaseCard {...visualProps} />
 *   </InteractiveCard>
 * </DraggableCard>
 * 
 * // 3. Use utilities
 * import { PIXELS_PER_HOUR, calculateEventPosition } from '@/components/calendar-cards';
 * const { top, height } = calculateEventPosition(start, end);
 */

// ═══════════════════════════════════════════════════════════════
// CORE - Pure Presentational Components
// ═══════════════════════════════════════════════════════════════

export { BaseCard, type BaseCardProps } from './core/BaseCard';
export { BaseCardV2, type BaseCardV2Props } from './core/BaseCardV2';

// ═══════════════════════════════════════════════════════════════
// FEATURES - Behavior Wrappers
// ═══════════════════════════════════════════════════════════════

export { 
  InteractiveCard, 
  type InteractiveCardProps 
} from './features/InteractiveCard';

export { 
  DraggableCard, 
  type DraggableCardProps,
  getDragData 
} from './features/DraggableCard';

export { 
  ResizableCard, 
  type ResizableCardProps 
} from './features/ResizableCard';

export { 
  UnschedulableCard, 
  type UnschedulableCardProps 
} from './features/UnschedulableCard';

// ═══════════════════════════════════════════════════════════════
// COMPOSED - Pre-built Combinations
// ═══════════════════════════════════════════════════════════════

export { 
  FullFeaturedCard, 
  type FullFeaturedCardProps 
} from './composed/FullFeaturedCard';

export {
  CalendarEventCard,
  type CalendarEventCardProps
} from './composed/CalendarEventCard';

export {
  ListTaskCard,
  type ListTaskCardProps
} from './composed/ListTaskCard';

export {
  GoalPreviewCard,
  type GoalPreviewCardProps
} from './composed/GoalPreviewCard';

export {
  ReadOnlyEventCard,
  type ReadOnlyEventCardProps
} from './composed/ReadOnlyEventCard';

// ═══════════════════════════════════════════════════════════════
// UTILS - Sizing & Positioning
// ═══════════════════════════════════════════════════════════════

export {
  // Constants
  PIXELS_PER_HOUR,
  PIXELS_PER_MINUTE,
  PIXELS_PER_HOUR_LEGACY,
  PIXELS_PER_MINUTE_LEGACY,
  INTERVAL_MINUTES,
  INTERVALS_PER_HOUR,
  INTERVALS_PER_DAY,
  HOURS_PER_DAY,
  DAY_HEIGHT,
  DAY_HEIGHT_LEGACY,
  MIN_CARD_HEIGHT,
  DEFAULT_CARD_WIDTH,
  CARD_PADDING,
  CARD_BORDER_WIDTH,
  OVERLAP_OFFSET_PX,
  MAX_OVERLAP_COLUMNS,
  WIDTH_PER_COLUMN,
  RESIZE_HANDLE_HEIGHT,
  RESIZE_HANDLE_HEIGHT_TOP,
  DRAG_THRESHOLD_PX,
  
  // Conversion functions
  minutesToPixels,
  pixelsToMinutes,
  hoursToPixels,
  pixelsToHours,
  
  // Position calculations
  calculateEventPosition,
  snapToInterval,
  pixelsToTime,
  timeToPixels,
  
  // Duration calculations
  calculateDurationMinutes,
  calculateDurationHours,
  
  // Validation
  isValidTime,
  clampTime,
  
  // Types
  type TimePosition,
} from './utils/sizing';

export {
  // Overlap detection
  eventsOverlap,
  calculateEventColumns,
  getEventPosition,
  
  // Tackboard mode
  setEventTackboardPosition,
  resetEventPosition,
  hasCustomPosition,
  
  // Constraints
  clampHorizontalPosition,
  snapHorizontalPosition,
  
  // Types
  type EventPosition,
} from './utils/positioning';

export {
  // Card selection helper
  getRecommendedCard,
  getCardRecommendationWithReason,
  cardSupportsFeature,
  getCardFeatures,
  CARD_RECOMMENDATIONS,
  CARD_FEATURES,
  
  // Types
  type CardContext,
  type ItemType,
} from './utils/card-selector';

/**
 * ═══════════════════════════════════════════════════════════════
 * MIGRATION GUIDE
 * ═══════════════════════════════════════════════════════════════
 * 
 * Migrating from CompactEventCard?
 * 
 * BEFORE:
 * ```typescript
 * <CompactEventCard
 *   event={event}
 *   onClick={handleClick}
 *   onDragStart={handleDrag}
 *   onResizeStart={handleResize}
 *   onUnschedule={handleUnschedule}
 *   resonanceScore={0.85}
 * />
 * ```
 * 
 * AFTER:
 * ```typescript
 * <FullFeaturedCard
 *   event={event}
 *   itemType="event"
 *   onClick={handleClick}
 *   onDragStart={handleDrag}
 *   onResizeStart={handleResize}
 *   onUnschedule={handleUnschedule}
 *   resonanceScore={0.85}
 * />
 * ```
 * 
 * Benefits:
 * ✅ Same API, better architecture
 * ✅ Easier to customize (remove features you don't need)
 * ✅ Better performance (React.memo optimizations)
 * ✅ Easier to test (pure components)
 * ✅ Clearer code organization
 */