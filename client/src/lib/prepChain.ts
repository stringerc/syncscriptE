/**
 * Utility functions for handling preparation task chains
 */

export interface PrepChainItem {
  id: string;
  title: string;
  type: 'task' | 'event';
}

/**
 * Builds a hierarchical preparation chain for a task
 * @param taskTitle - The current task title
 * @param eventTitle - The event title this task is preparing for
 * @param isAlreadyPrepTask - Whether the task already has "Prep for:" in its title
 * @returns The formatted preparation chain title
 */
export function buildPrepChainTitle(
  taskTitle: string, 
  eventTitle: string, 
  isAlreadyPrepTask: boolean = false
): string {
  // Remove existing "Prep for:" prefix if present
  const cleanTaskTitle = taskTitle.replace(/^Prep for:\s*/i, '');
  
  // If this is already a prep task, build the chain
  if (isAlreadyPrepTask) {
    return `Prep for: ${eventTitle} > ${cleanTaskTitle}`;
  }
  
  // For new prep tasks, just add the event title
  return `Prep for: ${eventTitle}`;
}

/**
 * Extracts the base task title from a prep chain
 * @param prepTitle - The preparation chain title
 * @returns The base task title without prep prefixes
 */
export function extractBaseTaskTitle(prepTitle: string): string {
  // Remove "Prep for:" and any chain elements
  return prepTitle
    .replace(/^Prep for:\s*/i, '')
    .split(' > ')
    .pop() || prepTitle;
}

/**
 * Checks if a task title is already a preparation task
 * @param title - The task title to check
 * @returns True if the title starts with "Prep for:"
 */
export function isPrepTask(title: string): boolean {
  return /^Prep for:\s*/i.test(title);
}

/**
 * Gets the event title from a prep task title
 * @param prepTitle - The preparation task title
 * @returns The event title or null if not found
 */
export function getEventTitleFromPrepTask(prepTitle: string): string | null {
  const match = prepTitle.match(/^Prep for:\s*([^>]+)/i);
  return match ? match[1].trim() : null;
}

/**
 * Builds a hierarchical preparation chain for nested prep tasks
 * @param currentTaskTitle - The current task title
 * @param parentEventTitle - The parent event title
 * @param grandparentEventTitle - The grandparent event title (if any)
 * @returns The formatted hierarchical chain
 */
export function buildHierarchicalPrepChain(
  currentTaskTitle: string,
  parentEventTitle: string,
  grandparentEventTitle?: string
): string {
  const cleanTaskTitle = currentTaskTitle.replace(/^Prep for:\s*/i, '');
  
  if (grandparentEventTitle) {
    return `Prep for: ${grandparentEventTitle} > ${parentEventTitle} > ${cleanTaskTitle}`;
  }
  
  return `Prep for: ${parentEventTitle} > ${cleanTaskTitle}`;
}
