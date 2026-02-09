/**
 * ══════════════════════════════════════════════════════════════════════════
 * CARD ENHANCEMENTS - Export Module
 * ══════════════════════════════════════════════════════════════════════════
 * 
 * Forward-thinking UX optimizations for event/task/goal cards
 */

export { EnhancedEventCard } from './EnhancedEventCard';
export { ProgressWithMomentum } from './ProgressWithMomentum';
export { SmartActions } from './SmartActions';
export { NaturalTime } from './NaturalTime';

// Re-export utilities for convenience
export { CardIntelligence } from '../../utils/card-intelligence';
export type {
  DensityMode,
  SmartAction,
  ProgressMomentum,
  AdaptiveTheme,
  GroupedItems,
} from '../../utils/card-intelligence';
