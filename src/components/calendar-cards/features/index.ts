/**
 * 🎯 FEATURE WRAPPERS - Behavior Layer
 * 
 * These components add behavior to BaseCard through composition.
 * Each wrapper handles ONE specific interaction.
 * 
 * USAGE:
 * import { InteractiveCard, DraggableCard, ResizableCard } from '@/components/calendar-cards/features';
 */

export { InteractiveCard, type InteractiveCardProps } from './InteractiveCard';
export { DraggableCard, type DraggableCardProps, getDragData } from './DraggableCard';
export { PointerDraggableCard, type PointerDraggableCardProps } from './PointerDraggableCard';
export { ResizableCard, type ResizableCardProps } from './ResizableCard';
export { UnschedulableCard, type UnschedulableCardProps } from './UnschedulableCard';
export { HoverExpandCard } from './HoverExpandCard';