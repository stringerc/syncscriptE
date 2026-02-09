import { EnergySource } from '../contexts/EnergyContext';

/**
 * Energy point values for different actions
 */
export const ENERGY_VALUES = {
  // Tasks
  TASK_COMPLETE_LOW: 5,
  TASK_COMPLETE_MEDIUM: 10,
  TASK_COMPLETE_HIGH: 15,
  SUBTASK_COMPLETE: 2,
  
  // Goals
  GOAL_PROGRESS_25: 10,
  GOAL_PROGRESS_50: 20,
  GOAL_PROGRESS_75: 30,
  GOAL_COMPLETE: 50,
  
  // Milestones
  MILESTONE_COMPLETE: 25,
  GOAL_MILESTONE_COMPLETE: 20,
  
  // Achievements
  ACHIEVEMENT_UNLOCK: 30,
  BADGE_EARN: 15,
  STREAK_DAY: 5,
  
  // Health
  HEALTH_ACTION: 8,
  MEDITATION_SESSION: 10,
  EXERCISE_SESSION: 12,
  SLEEP_GOAL_MET: 15,
  
  // Decay
  MISSED_TASK: -10,
  MISSED_GOAL_DEADLINE: -20,
  INACTIVITY_DAY: -5,
} as const;

/**
 * Calculate energy value for task completion
 */
export function getTaskEnergyValue(priority: 'low' | 'medium' | 'high'): number {
  switch (priority) {
    case 'high':
      return ENERGY_VALUES.TASK_COMPLETE_HIGH;
    case 'medium':
      return ENERGY_VALUES.TASK_COMPLETE_MEDIUM;
    case 'low':
      return ENERGY_VALUES.TASK_COMPLETE_LOW;
  }
}

/**
 * Calculate energy value for goal progress
 */
export function getGoalEnergyValue(progress: number): number {
  if (progress >= 100) return ENERGY_VALUES.GOAL_COMPLETE;
  if (progress >= 75) return ENERGY_VALUES.GOAL_PROGRESS_75;
  if (progress >= 50) return ENERGY_VALUES.GOAL_PROGRESS_50;
  if (progress >= 25) return ENERGY_VALUES.GOAL_PROGRESS_25;
  return 0;
}

/**
 * Get description for energy change
 */
export function getEnergyDescription(
  source: EnergySource,
  action: string,
  itemName?: string
): string {
  const item = itemName ? `"${itemName}"` : '';
  
  switch (source) {
    case 'tasks':
      return `Completed task ${item}`;
    case 'goals':
      return `Progress on goal ${item}`;
    case 'milestones':
      return `Reached milestone ${item}`;
    case 'achievements':
      return `Unlocked achievement ${item}`;
    case 'health':
      return `Completed health action ${item}`;
    default:
      return action;
  }
}

/**
 * Format energy value for display
 */
export function formatEnergyChange(value: number): string {
  if (value > 0) return `+${value}`;
  return value.toString();
}

/**
 * Get color for energy source
 */
export function getEnergySourceColor(source: EnergySource): string {
  switch (source) {
    case 'tasks':
      return 'orange';
    case 'goals':
      return 'yellow';
    case 'milestones':
      return 'green';
    case 'achievements':
      return 'blue';
    case 'health':
      return 'teal';
  }
}
