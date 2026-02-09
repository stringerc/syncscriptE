/**
 * Priority Color System
 * 
 * Research-based color coding for priority levels
 * - Red: High/Urgent (immediate attention)
 * - Amber: Medium (scheduled attention)
 * - Green: Low (background tasks)
 */

export type Priority = 'urgent' | 'high' | 'medium' | 'low';

/**
 * Get border color class for priority level
 * Returns 2px solid border in appropriate color
 */
export function getPriorityBorderClass(priority: Priority): string {
  switch (priority) {
    case 'urgent':
    case 'high':
      return 'border-2 border-red-500';
    case 'medium':
      return 'border-2 border-amber-500';
    case 'low':
      return 'border-2 border-green-500';
    default:
      return 'border-2 border-gray-700';
  }
}

/**
 * Get left border accent for Today's Schedule (research-backed design)
 * Uses 3px left border with desaturated colors + subtle background tint
 * Based on industry patterns: Trello, Asana, Linear, Height
 */
export function getPriorityLeftAccent(priority: Priority): string {
  switch (priority) {
    case 'urgent':
    case 'high':
      return 'border-l-[3px] border-l-red-400/70 bg-red-500/5';
    case 'medium':
      return 'border-l-[3px] border-l-amber-400/70 bg-amber-500/5';
    case 'low':
      return 'border-l-[3px] border-l-green-400/70 bg-green-500/5';
    default:
      return 'border-l-[3px] border-l-gray-500/50 bg-gray-500/5';
  }
}

/**
 * Get subtle glow effect for priority (optional enhancement)
 */
export function getPriorityGlowClass(priority: Priority): string {
  switch (priority) {
    case 'urgent':
    case 'high':
      return 'shadow-[0_0_15px_rgba(239,68,68,0.3)]';
    case 'medium':
      return 'shadow-[0_0_15px_rgba(245,158,11,0.2)]';
    case 'low':
      return 'shadow-[0_0_15px_rgba(34,197,94,0.15)]';
    default:
      return '';
  }
}

/**
 * Get priority label for accessibility (aria-label)
 */
export function getPriorityLabel(priority: Priority): string {
  switch (priority) {
    case 'urgent':
      return 'Urgent priority';
    case 'high':
      return 'High priority';
    case 'medium':
      return 'Medium priority';
    case 'low':
      return 'Low priority';
    default:
      return 'Normal priority';
  }
}

/**
 * Get priority icon/emoji for visual reinforcement
 */
export function getPriorityIcon(priority: Priority): string {
  switch (priority) {
    case 'urgent':
    case 'high':
      return '🔴';
    case 'medium':
      return '🟡';
    case 'low':
      return '🟢';
    default:
      return '⚪';
  }
}

/**
 * Get animation class for priority changes
 * Used when a task's priority is updated
 */
export function getPriorityChangeAnimation(oldPriority: Priority, newPriority: Priority): string {
  // If increasing priority (going to high/urgent)
  if ((newPriority === 'urgent' || newPriority === 'high') && 
      (oldPriority === 'medium' || oldPriority === 'low')) {
    return 'animate-pulse-red';
  }
  // If decreasing priority
  if ((oldPriority === 'urgent' || oldPriority === 'high') && 
      (newPriority === 'medium' || newPriority === 'low')) {
    return 'animate-fade-green';
  }
  return '';
}

/**
 * Priority filter keyboard shortcuts
 */
export const PRIORITY_SHORTCUTS = {
  HIGH: 'h',
  MEDIUM: 'm', 
  LOW: 'l',
  ALL: 'a',
} as const;

/**
 * Get keyboard shortcut label for priority filter
 */
export function getPriorityShortcut(filter: 'high' | 'medium' | 'low' | 'all'): string {
  return PRIORITY_SHORTCUTS[filter.toUpperCase() as keyof typeof PRIORITY_SHORTCUTS];
}