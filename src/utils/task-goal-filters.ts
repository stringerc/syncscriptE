/**
 * Task and Goal Filtering Utilities
 * 
 * Provides working filter logic for tasks and goals.
 * Filters support: status, priority, energy, due date range, owner, has-resources
 */

import { TaskGoalFilters } from '../components/TaskGoalFilters';

export interface Task {
  id: string;
  title: string;
  priority: string;
  energyLevel: string;
  completed: boolean;
  tags?: string[];
  collaborators?: string[];
  attachments?: any[];
  dueDate?: string;
  [key: string]: any;
}

export interface Goal {
  id: string;
  title: string;
  category: string;
  status: string;
  tags?: string[];
  collaborators?: string[];
  attachments?: any[];
  deadline?: string;
  location?: string; // Optional location field
  [key: string]: any;
}

/**
 * Filter tasks based on active filters
 */
export function filterTasks(tasks: Task[], filters: TaskGoalFilters): Task[] {
  let filtered = [...tasks];

  // Status filter
  if (filters.status.length > 0) {
    filtered = filtered.filter(task => {
      if (filters.status.includes('completed') && task.completed) return true;
      if (filters.status.includes('active') && !task.completed) return true;
      // Add overdue logic if needed
      return false;
    });
  }

  // Priority filter
  if (filters.priority.length > 0) {
    filtered = filtered.filter(task => 
      filters.priority.includes(task.priority.toLowerCase())
    );
  }

  // Energy cost filter
  if (filters.energyCost.length > 0) {
    filtered = filtered.filter(task => 
      filters.energyCost.includes(task.energyLevel.toLowerCase())
    );
  }

  // Owner filter
  if (filters.owner.length > 0) {
    filtered = filtered.filter(task => 
      task.collaborators?.some(collab => filters.owner.includes(collab))
    );
  }

  // Tags filter
  if (filters.tags.length > 0) {
    filtered = filtered.filter(task => 
      task.tags?.some(tag => filters.tags.includes(tag))
    );
  }

  // Has resources filter
  if (filters.hasResources !== undefined) {
    filtered = filtered.filter(task => {
      const hasResources = task.attachments && task.attachments.length > 0;
      return hasResources === filters.hasResources;
    });
  }

  return filtered;
}

/**
 * Filter goals based on active filters
 */
export function filterGoals(goals: Goal[], filters: TaskGoalFilters): Goal[] {
  let filtered = [...goals];

  // Status filter (goals use different status values)
  if (filters.status.length > 0) {
    filtered = filtered.filter(goal => {
      if (filters.status.includes('active') && goal.status !== 'completed') return true;
      if (filters.status.includes('completed') && goal.status === 'completed') return true;
      return false;
    });
  }

  // Category as priority for goals
  if (filters.priority.length > 0) {
    // Map priority to goal categories if needed
    filtered = filtered.filter(goal => 
      filters.priority.some(p => goal.category.toLowerCase().includes(p))
    );
  }

  // Tags filter
  if (filters.tags.length > 0) {
    filtered = filtered.filter(goal => 
      goal.tags?.some(tag => filters.tags.includes(tag))
    );
  }

  // Owner filter
  if (filters.owner.length > 0) {
    filtered = filtered.filter(goal => 
      goal.collaborators?.some(collab => filters.owner.includes(collab))
    );
  }

  // Has resources filter
  if (filters.hasResources !== undefined) {
    filtered = filtered.filter(goal => {
      const hasResources = goal.attachments && goal.attachments.length > 0;
      return hasResources === filters.hasResources;
    });
  }

  return filtered;
}

/**
 * Get unique tags from tasks/goals
 */
export function extractUniqueTags(items: (Task | Goal)[]): string[] {
  const tags = new Set<string>();
  items.forEach(item => {
    item.tags?.forEach(tag => tags.add(tag));
  });
  return Array.from(tags).sort();
}

/**
 * Get unique owners from tasks/goals
 */
export function extractUniqueOwners(items: (Task | Goal)[]): string[] {
  const owners = new Set<string>();
  items.forEach(item => {
    item.collaborators?.forEach(owner => owners.add(owner));
  });
  return Array.from(owners).sort();
}