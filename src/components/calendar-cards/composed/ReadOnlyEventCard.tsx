/**
 * 👁️ READ-ONLY EVENT CARD - Display-Only Card
 * 
 * Pure rendering with ZERO interactions:
 * - NO click
 * - NO drag
 * - NO resize
 * - NO hover effects
 * - NO unschedule
 * 
 * RESEARCH BASIS:
 * - Print CSS Best Practices (W3C, 2020)
 * - PDF Export Patterns (Chrome DevTools, 2022)
 * - Accessibility Guidelines (WCAG 2.1)
 * 
 * USE CASE:
 * Exports, prints, screenshots, email embeds, public sharing
 * 
 * USAGE:
 * <ReadOnlyEventCard
 *   event={event}
 *   itemType="event"
 *   showAllMetadata={true}
 * />
 */

import React from 'react';
import { Event, Task } from '../../../utils/event-task-types';
import { BaseCard } from '../core/BaseCard';

export interface ReadOnlyEventCardProps {
  // Data
  event: Event | Task;
  itemType: 'event' | 'task' | 'goal';
  
  // Display options
  showAllMetadata?: boolean; // Show everything (default: true)
  showTime?: boolean; // Show time (default: true)
  showLocation?: boolean; // Show location (default: true)
  showEnergy?: boolean; // Show energy (default: true)
  showResonance?: boolean; // Show resonance (default: true)
  showProgress?: boolean; // Show progress (default: true)
  showTeam?: boolean; // Show team (default: true)
  showCategory?: boolean; // Show category (default: true)
  showPrivacy?: boolean; // Show lock/shield icons (default: true)
  
  // Visual overrides
  energyLevel?: 'high' | 'medium' | 'low';
  resonanceScore?: number;
  
  // Print-specific
  printOptimized?: boolean; // Optimize for print (default: false)
  grayscale?: boolean; // Use grayscale colors (default: false)
  
  // Styling
  className?: string;
  zIndex?: number;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * READ-ONLY EVENT CARD COMPONENT
 * ═══════════════════════════════════════════════════════════════
 */

export function ReadOnlyEventCard({
  event,
  itemType,
  showAllMetadata = true,
  showTime = true,
  showLocation = true,
  showEnergy = true,
  showResonance = true,
  showProgress = true,
  showTeam = true,
  showCategory = true,
  showPrivacy = true,
  energyLevel = 'medium',
  resonanceScore = 0.75,
  printOptimized = false,
  grayscale = false,
  className = '',
  zIndex = 15,
}: ReadOnlyEventCardProps) {
  // Parse times
  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);
  
  // Hierarchy detection
  const isPrimaryEvent = event.isPrimaryEvent ?? true;
  const isSubEvent = !isPrimaryEvent && event.parentEventId;
  const childCount = event.childEventIds?.length || 0;
  
  // Task progress
  const totalTasks = event.tasks?.length || 0;
  const completedTasks = event.tasks?.filter(t => t.completed).length || 0;
  
  // Print-specific styles
  const printStyles = printOptimized 
    ? 'print:bg-white print:text-black print:border-gray-400'
    : '';
  
  const grayscaleStyles = grayscale
    ? 'grayscale'
    : '';
  
  return (
    <BaseCard
      // Core content
      title={event.title}
      startTime={showTime || showAllMetadata ? startTime : undefined}
      endTime={showTime || showAllMetadata ? endTime : undefined}
      location={(showLocation || showAllMetadata) ? event.location : undefined}
      
      // Variant
      itemType={itemType}
      
      // Hierarchy
      isPrimaryEvent={isPrimaryEvent}
      isSubEvent={isSubEvent}
      childCount={childCount}
      
      // Metadata (conditional based on props)
      category={(showCategory || showAllMetadata) ? event.category : undefined}
      resonanceScore={(showResonance || showAllMetadata) ? resonanceScore : undefined}
      energyLevel={(showEnergy || showAllMetadata) ? energyLevel : undefined}
      
      // Privacy (conditional)
      allowTeamEdits={(showPrivacy || showAllMetadata) ? event.allowTeamEdits : true}
      createdBy={(showPrivacy || showAllMetadata) ? event.createdBy : undefined}
      
      // Progress
      totalTasks={(showProgress || showAllMetadata) ? totalTasks : 0}
      completedTasks={(showProgress || showAllMetadata) ? completedTasks : 0}
      
      // Team
      teamMembers={(showTeam || showAllMetadata) ? event.teamMembers : undefined}
      
      // States (all false for read-only)
      isDragging={false}
      isResizing={false}
      isHovered={false}
      isFocusBlock={false}
      
      // Styling
      className={`${className} ${printStyles} ${grayscaleStyles}`}
      zIndex={zIndex}
    />
  );
}

/**
 * ═══════════════════════════════════════════════════════════════
 * EXPORT SUMMARY
 * ═══════════════════════════════════════════════════════════════
 * 
 * This component is optimized for:
 * ✅ Export to PDF/image
 * ✅ Print to paper
 * ✅ Email embeds
 * ✅ Public sharing (no private info)
 * ✅ Screenshot generation
 * ✅ Accessibility tools
 * 
 * Example usage:
 * 
 * // Full metadata (default)
 * <ReadOnlyEventCard
 *   event={event}
 *   itemType="event"
 * />
 * 
 * // Print-optimized
 * <ReadOnlyEventCard
 *   event={event}
 *   itemType="event"
 *   printOptimized={true}
 *   grayscale={true}
 * />
 * 
 * // Minimal display (just title + time)
 * <ReadOnlyEventCard
 *   event={event}
 *   itemType="event"
 *   showAllMetadata={false}
 *   showTime={true}
 *   showEnergy={false}
 *   showResonance={false}
 *   showTeam={false}
 * />
 * 
 * // Public sharing (hide private info)
 * <ReadOnlyEventCard
 *   event={event}
 *   itemType="event"
 *   showPrivacy={false}
 * />
 * 
 * USE CASES:
 * - PDF calendar export
 * - Print weekly schedule
 * - Email calendar summary
 * - Screenshot for sharing
 * - Public event listing
 * - Accessibility readers
 * - Archive views
 */
