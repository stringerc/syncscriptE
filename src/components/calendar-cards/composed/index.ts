/**
 * 🏗️ COMPOSED COMPONENTS - Full Implementations
 * 
 * Pre-composed cards with all features for common use cases.
 * 
 * USAGE:
 * import { FullFeaturedCard } from '@/components/calendar-cards/composed';
 */

export { FullFeaturedCard, type FullFeaturedCardProps } from './FullFeaturedCard';
export { CalendarEventCard, type CalendarEventCardProps } from './CalendarEventCard';
export { ListTaskCard, type ListTaskCardProps } from './ListTaskCard';
export { GoalPreviewCard, type GoalPreviewCardProps } from './GoalPreviewCard';
export { ReadOnlyEventCard, type ReadOnlyEventCardProps } from './ReadOnlyEventCard';

// PHASE 5B: Hierarchical event cards
export { HierarchicalEventCard, type HierarchicalEventCardProps, getDepthVisualProperties } from './HierarchicalEventCard';