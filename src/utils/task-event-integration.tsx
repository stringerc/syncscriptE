/**
 * Task-Event Integration Utilities
 * 
 * PHASE 5E: Helper functions for managing task-event associations
 * 
 * Features:
 * - Link/unlink tasks to events
 * - Get event hierarchy for tasks
 * - Filter tasks by event association
 * - Sync task archiving with parent events
 */

import { Task, Event } from './event-task-types';

export interface TaskEventAssociation {
  taskId: string;
  parentEventId?: string;
  primaryEventId?: string;
  archiveWithParentEvent: boolean;
}

/**
 * Link a task to an event
 */
export function linkTaskToEvent(
  task: Task,
  eventId: string,
  primaryEventId?: string,
  archiveWithParent: boolean = true
): Task {
  return {
    ...task,
    parentEventId: eventId,
    primaryEventId: primaryEventId || eventId,
    archiveWithParentEvent: archiveWithParent,
  };
}

/**
 * Unlink a task from its parent event
 */
export function unlinkTaskFromEvent(task: Task): Task {
  const { parentEventId, primaryEventId, ...rest } = task;
  return {
    ...rest,
    archiveWithParentEvent: false,
  } as Task;
}

/**
 * Get the full event hierarchy for a task
 */
export function getTaskEventHierarchy(
  task: Task,
  allEvents: Event[]
): Event[] {
  if (!task.parentEventId) return [];

  const hierarchy: Event[] = [];
  let currentEventId = task.parentEventId;

  while (currentEventId) {
    const event = allEvents.find(e => e.id === currentEventId);
    if (!event) break;

    hierarchy.unshift(event);
    currentEventId = event.parentEventId;
  }

  return hierarchy;
}

/**
 * Get tasks associated with a specific event (direct children only)
 */
export function getTasksForEvent(
  eventId: string,
  allTasks: Task[],
  includeArchived: boolean = false
): Task[] {
  return allTasks.filter(task => {
    if (!includeArchived && task.archived) return false;
    return task.parentEventId === eventId;
  });
}

/**
 * Get all tasks in an event hierarchy (including child events)
 */
export function getTasksForEventHierarchy(
  eventId: string,
  allEvents: Event[],
  allTasks: Task[],
  includeArchived: boolean = false
): Task[] {
  // Get the event and all its descendants
  const event = allEvents.find(e => e.id === eventId);
  if (!event) return [];

  const descendantIds = getDescendantEventIds(eventId, allEvents);
  const relevantEventIds = [eventId, ...descendantIds];

  return allTasks.filter(task => {
    if (!includeArchived && task.archived) return false;
    return task.parentEventId && relevantEventIds.includes(task.parentEventId);
  });
}

/**
 * Helper to get descendant event IDs (recursive)
 */
function getDescendantEventIds(eventId: string, allEvents: Event[]): string[] {
  const children = allEvents.filter(e => e.parentEventId === eventId);
  const descendantIds: string[] = [];

  for (const child of children) {
    descendantIds.push(child.id);
    descendantIds.push(...getDescendantEventIds(child.id, allEvents));
  }

  return descendantIds;
}

/**
 * Filter standalone tasks (not associated with any event)
 */
export function filterStandaloneTasks(
  tasks: Task[],
  includeArchived: boolean = false
): Task[] {
  return tasks.filter(task => {
    if (!includeArchived && task.archived) return false;
    return !task.parentEventId && !task.primaryEventId;
  });
}

/**
 * Filter event-associated tasks
 */
export function filterEventAssociatedTasks(
  tasks: Task[],
  includeArchived: boolean = false
): Task[] {
  return tasks.filter(task => {
    if (!includeArchived && task.archived) return false;
    return task.parentEventId || task.primaryEventId;
  });
}

/**
 * Get event association status for a task
 */
export function getTaskEventStatus(
  task: Task,
  allEvents: Event[]
): {
  isAssociated: boolean;
  parentEvent?: Event;
  primaryEvent?: Event;
  hierarchy: Event[];
  depth: number;
} {
  const hierarchy = getTaskEventHierarchy(task, allEvents);
  const parentEvent = task.parentEventId
    ? allEvents.find(e => e.id === task.parentEventId)
    : undefined;
  const primaryEvent = task.primaryEventId
    ? allEvents.find(e => e.id === task.primaryEventId)
    : undefined;

  return {
    isAssociated: !!task.parentEventId || !!task.primaryEventId,
    parentEvent,
    primaryEvent,
    hierarchy,
    depth: hierarchy.length,
  };
}

/**
 * Check if a task should be archived based on parent event status
 */
export function shouldAutoArchiveTask(
  task: Task,
  allEvents: Event[]
): boolean {
  if (!task.archiveWithParentEvent || !task.parentEventId) {
    return false;
  }

  const parentEvent = allEvents.find(e => e.id === task.parentEventId);
  if (!parentEvent) return false;

  return parentEvent.completed || parentEvent.archived;
}

/**
 * Bulk link multiple tasks to an event
 */
export function bulkLinkTasksToEvent(
  tasks: Task[],
  eventId: string,
  primaryEventId?: string,
  archiveWithParent: boolean = true
): Task[] {
  return tasks.map(task =>
    linkTaskToEvent(task, eventId, primaryEventId, archiveWithParent)
  );
}

/**
 * Bulk unlink multiple tasks from events
 */
export function bulkUnlinkTasksFromEvents(tasks: Task[]): Task[] {
  return tasks.map(unlinkTaskFromEvent);
}

/**
 * Get statistics about task-event associations
 */
export function getTaskEventStats(
  tasks: Task[],
  events: Event[]
): {
  totalTasks: number;
  standaloneTasks: number;
  eventTasks: number;
  tasksPerEvent: Map<string, number>;
  orphanedTasks: number; // Tasks linked to non-existent events
} {
  const totalTasks = tasks.length;
  const standaloneTasks = filterStandaloneTasks(tasks, true).length;
  const eventTasks = filterEventAssociatedTasks(tasks, true).length;

  const tasksPerEvent = new Map<string, number>();
  const eventIds = new Set(events.map(e => e.id));
  let orphanedTasks = 0;

  tasks.forEach(task => {
    if (task.parentEventId) {
      if (eventIds.has(task.parentEventId)) {
        tasksPerEvent.set(
          task.parentEventId,
          (tasksPerEvent.get(task.parentEventId) || 0) + 1
        );
      } else {
        orphanedTasks++;
      }
    }
  });

  return {
    totalTasks,
    standaloneTasks,
    eventTasks,
    tasksPerEvent,
    orphanedTasks,
  };
}
