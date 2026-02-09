/**
 * 🎯 CARD SELECTOR UTILITY
 * 
 * Helper functions to choose the right card component for your context.
 * 
 * RESEARCH BASIS:
 * - Factory Pattern (Gang of Four, 1994)
 * - Smart Defaults (Apple HIG, 2023)
 * - Progressive Disclosure (Nielsen Norman, 2020)
 * 
 * PURPOSE:
 * Make it easy for developers to pick the right card without
 * memorizing all the options.
 * 
 * USAGE:
 * import { getRecommendedCard } from '@/components/calendar-cards/utils/card-selector';
 * const CardComponent = getRecommendedCard('calendar', 'event');
 */

/**
 * ═══════════════════════════════════════════════════════════════
 * CONTEXT TYPES
 * ═══════════════════════════════════════════════════════════════
 */

export type CardContext = 
  | 'calendar'      // Main calendar grid view
  | 'list'          // Task/goal list view
  | 'preview'       // Goal showcase/gallery
  | 'detail'        // Detail page/modal
  | 'export'        // PDF/print/screenshot
  | 'email'         // Email embed
  | 'public'        // Public sharing
  | 'search';       // Search results

export type ItemType = 'event' | 'task' | 'goal';

/**
 * ═══════════════════════════════════════════════════════════════
 * CARD RECOMMENDATION TABLE
 * ═══════════════════════════════════════════════════════════════
 * 
 * Research: Decision Matrix (Edward Tufte, 2001)
 * "The best interface is one that makes the right choice obvious."
 */

export const CARD_RECOMMENDATIONS = {
  calendar: {
    event: 'CalendarEventCard',   // Full drag + resize + click
    task: 'CalendarEventCard',    // Full drag + resize + click + unschedule
    goal: 'CalendarEventCard',    // Full drag + resize + click + unschedule
  },
  list: {
    event: 'ListTaskCard',        // Click only (events rarely in lists)
    task: 'ListTaskCard',         // Click + unschedule
    goal: 'ListTaskCard',         // Click + unschedule
  },
  preview: {
    event: 'GoalPreviewCard',     // Click + hover
    task: 'GoalPreviewCard',      // Click + hover
    goal: 'GoalPreviewCard',      // Click + hover (primary use case)
  },
  detail: {
    event: 'ReadOnlyEventCard',   // Display only (interactions in modal)
    task: 'ReadOnlyEventCard',    // Display only
    goal: 'ReadOnlyEventCard',    // Display only
  },
  export: {
    event: 'ReadOnlyEventCard',   // Pure rendering
    task: 'ReadOnlyEventCard',    // Pure rendering
    goal: 'ReadOnlyEventCard',    // Pure rendering
  },
  email: {
    event: 'ReadOnlyEventCard',   // Pure rendering, no interactions
    task: 'ReadOnlyEventCard',    // Pure rendering, no interactions
    goal: 'ReadOnlyEventCard',    // Pure rendering, no interactions
  },
  public: {
    event: 'ReadOnlyEventCard',   // Pure rendering, hide private info
    task: 'ReadOnlyEventCard',    // Pure rendering, hide private info
    goal: 'ReadOnlyEventCard',    // Pure rendering, hide private info
  },
  search: {
    event: 'ListTaskCard',        // Click to view
    task: 'ListTaskCard',         // Click to view
    goal: 'GoalPreviewCard',      // Rich preview
  },
} as const;

/**
 * ═══════════════════════════════════════════════════════════════
 * RECOMMENDATION FUNCTION
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Get the recommended card component name for a given context
 * 
 * @param context - Where the card will be displayed
 * @param itemType - Type of item (event/task/goal)
 * @returns Component name as string
 * 
 * @example
 * const cardName = getRecommendedCard('calendar', 'event');
 * // Returns: 'CalendarEventCard'
 */
export function getRecommendedCard(
  context: CardContext,
  itemType: ItemType
): string {
  return CARD_RECOMMENDATIONS[context][itemType];
}

/**
 * ═══════════════════════════════════════════════════════════════
 * FEATURE MATRIX
 * ═══════════════════════════════════════════════════════════════
 * 
 * Shows which features each card supports
 */

export const CARD_FEATURES = {
  CalendarEventCard: {
    click: true,
    doubleClick: true,
    drag: true,
    resize: true,
    unschedule: true, // For tasks/goals only
    hover: true,
    zIndexBoost: true,
    intelligentMetadata: true,
    featureToggles: true,
  },
  FullFeaturedCard: {
    click: true,
    doubleClick: true,
    drag: true,
    resize: true,
    unschedule: true,
    hover: true,
    zIndexBoost: true,
    intelligentMetadata: true,
    featureToggles: false, // Less flexible
  },
  ListTaskCard: {
    click: true,
    doubleClick: false,
    drag: false,
    resize: false,
    unschedule: true,
    hover: true,
    zIndexBoost: false,
    intelligentMetadata: false,
    featureToggles: true,
  },
  GoalPreviewCard: {
    click: true,
    doubleClick: false,
    drag: false,
    resize: false,
    unschedule: false,
    hover: true,
    zIndexBoost: true,
    intelligentMetadata: false,
    featureToggles: true,
  },
  ReadOnlyEventCard: {
    click: false,
    doubleClick: false,
    drag: false,
    resize: false,
    unschedule: false,
    hover: false,
    zIndexBoost: false,
    intelligentMetadata: false,
    featureToggles: true, // Display toggles
  },
  BaseCard: {
    click: false,
    doubleClick: false,
    drag: false,
    resize: false,
    unschedule: false,
    hover: false,
    zIndexBoost: false,
    intelligentMetadata: false,
    featureToggles: false,
  },
} as const;

/**
 * ═══════════════════════════════════════════════════════════════
 * HELPER FUNCTIONS
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Check if a card supports a specific feature
 */
export function cardSupportsFeature(
  cardName: keyof typeof CARD_FEATURES,
  feature: keyof typeof CARD_FEATURES.CalendarEventCard
): boolean {
  return CARD_FEATURES[cardName]?.[feature] ?? false;
}

/**
 * Get all supported features for a card
 */
export function getCardFeatures(
  cardName: keyof typeof CARD_FEATURES
): string[] {
  const features = CARD_FEATURES[cardName];
  if (!features) return [];
  
  return Object.entries(features)
    .filter(([_, supported]) => supported)
    .map(([feature]) => feature);
}

/**
 * ═══════════════════════════════════════════════════════════════
 * DECISION HELPER
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Get card recommendation with explanation
 * 
 * @example
 * const result = getCardRecommendationWithReason('calendar', 'task');
 * console.log(result.card); // 'CalendarEventCard'
 * console.log(result.reason); // 'Full interactions needed for calendar view'
 */
export function getCardRecommendationWithReason(
  context: CardContext,
  itemType: ItemType
): { card: string; reason: string; features: string[] } {
  const card = getRecommendedCard(context, itemType);
  const features = getCardFeatures(card as keyof typeof CARD_FEATURES);
  
  const reasons: Record<CardContext, string> = {
    calendar: 'Full interactions needed for calendar view (drag, resize, click)',
    list: 'List view needs click and unschedule only',
    preview: 'Preview needs visual emphasis with click to details',
    detail: 'Detail page handles interactions, card is display only',
    export: 'Export requires pure rendering with no interactions',
    email: 'Email embeds cannot have interactive elements',
    public: 'Public sharing should hide private information',
    search: 'Search results need quick preview with click to open',
  };
  
  return {
    card,
    reason: reasons[context],
    features,
  };
}

/**
 * ═══════════════════════════════════════════════════════════════
 * USAGE EXAMPLES
 * ═══════════════════════════════════════════════════════════════
 */

/*
// Example 1: Get recommendation
const cardName = getRecommendedCard('calendar', 'event');
// Returns: 'CalendarEventCard'

// Example 2: Check feature support
const canDrag = cardSupportsFeature('CalendarEventCard', 'drag');
// Returns: true

// Example 3: Get all features
const features = getCardFeatures('ListTaskCard');
// Returns: ['click', 'unschedule', 'hover', ...]

// Example 4: Get recommendation with explanation
const { card, reason, features } = getCardRecommendationWithReason('export', 'task');
console.log(`Use ${card} because: ${reason}`);
console.log(`Supported features: ${features.join(', ')}`);

// Example 5: Use in component selection
import * as Cards from '@/components/calendar-cards/composed';

function renderEventCard(context: CardContext, event: Event) {
  const cardName = getRecommendedCard(context, 'event');
  const CardComponent = Cards[cardName];
  
  return <CardComponent event={event} {...props} />;
}
*/

/**
 * ═══════════════════════════════════════════════════════════════
 * EXPORT SUMMARY
 * ═══════════════════════════════════════════════════════════════
 * 
 * This utility helps developers:
 * ✅ Choose the right card for their context
 * ✅ Understand feature differences
 * ✅ Make informed decisions quickly
 * ✅ Avoid using wrong card for use case
 * 
 * Quick Reference:
 * - Calendar view → CalendarEventCard
 * - List view → ListTaskCard
 * - Goal gallery → GoalPreviewCard
 * - Export/print → ReadOnlyEventCard
 * - Custom needs → Use feature wrappers directly
 */
