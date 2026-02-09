/**
 * 🎯 GOAL PREVIEW CARD - Goal Display Card
 * 
 * Optimized for goal showcase and preview contexts:
 * - Click to view details (optional)
 * - Prominent visual indicators
 * - NO drag or resize (goals are aspirational)
 * - NO unschedule (goals are persistent)
 * 
 * RESEARCH BASIS:
 * - Notion Databases (2023) - Rich preview cards
 * - Asana Goals (2022) - Visual goal tracking
 * - OKR Tools (2023) - Progress-focused display
 * 
 * USE CASE:
 * Goals dashboard, goal gallery, achievement showcase, reports
 * 
 * USAGE:
 * <GoalPreviewCard
 *   goal={goal}
 *   onClick={() => navigateToGoalDetail(goal)}
 *   showProgress={true}
 * />
 */

import React from 'react';
import { Task } from '../../../utils/event-task-types';
import { BaseCard } from '../core/BaseCard';
import { InteractiveCard } from '../features/InteractiveCard';

export interface GoalPreviewCardProps {
  // Data
  goal: Task; // Goals are stored as tasks with special properties
  
  // Callbacks
  onClick?: () => void;
  
  // Display options
  showProgress?: boolean; // Show goal progress (default: true)
  showResonance?: boolean; // Show resonance (default: true)
  showEnergy?: boolean; // Show energy requirement (default: true)
  showCategory?: boolean; // Show category badge (default: true)
  showTeam?: boolean; // Show team members (default: true)
  showTimeline?: boolean; // Show start/end times (default: true)
  
  // Visual emphasis
  highlight?: boolean; // Highlight important goals (default: false)
  
  // Visual overrides
  energyLevel?: 'high' | 'medium' | 'low';
  resonanceScore?: number;
  
  // Feature toggles
  enableClick?: boolean; // Default: true
  enableHover?: boolean; // Default: true
  
  // Styling
  className?: string;
  zIndex?: number;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * GOAL PREVIEW CARD COMPONENT
 * ═══════════════════════════════════════════════════════════════
 */

export function GoalPreviewCard({
  goal,
  onClick,
  showProgress = true,
  showResonance = true,
  showEnergy = true,
  showCategory = true,
  showTeam = true,
  showTimeline = true,
  highlight = false,
  energyLevel = 'medium',
  resonanceScore = 0.75,
  enableClick = true,
  enableHover = true,
  className = '',
  zIndex = 15,
}: GoalPreviewCardProps) {
  // Parse times
  const startTime = goal.startTime ? new Date(goal.startTime) : new Date();
  const endTime = goal.endTime ? new Date(goal.endTime) : new Date(startTime.getTime() + 7 * 24 * 60 * 60000); // Default 1 week
  
  // Calculate goal progress from subtasks
  const totalTasks = goal.tasks?.length || 0;
  const completedTasks = goal.tasks?.filter(t => t.completed).length || 0;
  
  // Enhanced styling for highlighted goals
  const highlightStyles = highlight 
    ? 'ring-2 ring-yellow-500/50 shadow-lg shadow-yellow-500/20'
    : '';
  
  // Build the card
  let card = (
    <BaseCard
      // Core content
      title={goal.title}
      startTime={showTimeline ? startTime : undefined}
      endTime={showTimeline ? endTime : undefined}
      location={goal.location}
      
      // Variant - Always 'goal'
      itemType="goal"
      
      // Metadata (conditional based on props)
      category={showCategory ? goal.category : undefined}
      resonanceScore={showResonance ? resonanceScore : undefined}
      energyLevel={showEnergy ? energyLevel : undefined}
      
      // Progress
      totalTasks={showProgress ? totalTasks : 0}
      completedTasks={showProgress ? completedTasks : 0}
      
      // Team
      teamMembers={showTeam ? goal.teamMembers : undefined}
      
      // States
      isDragging={false}
      isResizing={false}
      
      // Styling
      className={`${className} ${highlightStyles}`}
      zIndex={zIndex}
    />
  );
  
  // Wrap with InteractiveCard if click/hover enabled
  if ((enableClick && onClick) || enableHover) {
    card = (
      <InteractiveCard
        onClick={enableClick ? onClick : undefined}
        baseZIndex={zIndex}
        hoverZIndexBoost={enableHover ? 20 : 0}
        title={`Goal • ${goal.title}`}
      >
        {card}
      </InteractiveCard>
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
 * ✅ Goal showcase and gallery views
 * ✅ Progress-focused display
 * ✅ Click to view details (optional)
 * ✅ NO drag/resize/unschedule
 * ✅ Rich metadata display
 * 
 * Example usage:
 * 
 * // Full-featured goal preview
 * <GoalPreviewCard
 *   goal={goal}
 *   onClick={() => navigateToGoal(goal.id)}
 *   showProgress={true}
 *   showResonance={true}
 * />
 * 
 * // Highlighted goal (featured achievement)
 * <GoalPreviewCard
 *   goal={goal}
 *   highlight={true}
 *   onClick={() => celebrateGoal(goal)}
 * />
 * 
 * // Minimal preview (compact)
 * <GoalPreviewCard
 *   goal={goal}
 *   showEnergy={false}
 *   showResonance={false}
 *   showTeam={false}
 *   showTimeline={false}
 * />
 * 
 * // Read-only display
 * <GoalPreviewCard
 *   goal={goal}
 *   enableClick={false}
 *   enableHover={false}
 * />
 * 
 * USE CASES:
 * - Goals dashboard (main view)
 * - Achievement showcase
 * - Progress reports
 * - Team goal gallery
 * - Goal search results
 */
