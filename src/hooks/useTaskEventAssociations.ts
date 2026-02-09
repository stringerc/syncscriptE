/**
 * useTaskEventAssociations Hook
 * 
 * PHASE 5E: Custom React hook for managing task-event associations
 * 
 * Provides:
 * - Filtered tasks by association type
 * - Link/unlink operations
 * - Statistics and counts
 * - Auto-archive detection
 * - Memoized results for performance
 */

import { useMemo, useCallback } from 'react';
import { Task, Event } from '../utils/event-task-types';
import {
  filterStandaloneTasks,
  filterEventAssociatedTasks,
  getTasksForEvent,
  getTasksForEventHierarchy,
  linkTaskToEvent,
  unlinkTaskFromEvent,
  getTaskEventStats,
  shouldAutoArchiveTask,
  getTaskEventStatus,
  TaskEventFilterType,
} from '../utils/task-event-integration';

interface UseTaskEventAssociationsProps {
  tasks: Task[];
  events: Event[];
  onTasksChange?: (tasks: Task[]) => void;
}

export function useTaskEventAssociations({
  tasks,
  events,
  onTasksChange,
}: UseTaskEventAssociationsProps) {
  // Statistics
  const stats = useMemo(
    () => getTaskEventStats(tasks, events),
    [tasks, events]
  );

  // Filtered tasks
  const standaloneTasks = useMemo(
    () => filterStandaloneTasks(tasks),
    [tasks]
  );

  const eventAssociatedTasks = useMemo(
    () => filterEventAssociatedTasks(tasks),
    [tasks]
  );

  // Get tasks for a specific filter type
  const getFilteredTasks = useCallback(
    (filterType: 'all' | 'standalone' | 'event-associated') => {
      switch (filterType) {
        case 'standalone':
          return standaloneTasks;
        case 'event-associated':
          return eventAssociatedTasks;
        default:
          return tasks;
      }
    },
    [tasks, standaloneTasks, eventAssociatedTasks]
  );

  // Get tasks for a specific event
  const getTasksForEventById = useCallback(
    (eventId: string, includeArchived: boolean = false) =>
      getTasksForEvent(eventId, tasks, includeArchived),
    [tasks]
  );

  // Get tasks for an event hierarchy
  const getTasksForEventHierarchyById = useCallback(
    (eventId: string, includeArchived: boolean = false) =>
      getTasksForEventHierarchy(eventId, events, tasks, includeArchived),
    [events, tasks]
  );

  // Link a task to an event
  const linkTask = useCallback(
    (
      taskId: string,
      eventId: string,
      primaryEventId?: string,
      archiveWithParent: boolean = true
    ) => {
      const updatedTasks = tasks.map(task =>
        task.id === taskId
          ? linkTaskToEvent(task, eventId, primaryEventId, archiveWithParent)
          : task
      );
      onTasksChange?.(updatedTasks);
      return updatedTasks;
    },
    [tasks, onTasksChange]
  );

  // Unlink a task from its event
  const unlinkTask = useCallback(
    (taskId: string) => {
      const updatedTasks = tasks.map(task =>
        task.id === taskId ? unlinkTaskFromEvent(task) : task
      );
      onTasksChange?.(updatedTasks);
      return updatedTasks;
    },
    [tasks, onTasksChange]
  );

  // Check if a task should be auto-archived
  const checkShouldAutoArchive = useCallback(
    (taskId: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return false;
      return shouldAutoArchiveTask(task, events);
    },
    [tasks, events]
  );

  // Get event status for a task
  const getTaskEventStatusById = useCallback(
    (taskId: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return null;
      return getTaskEventStatus(task, events);
    },
    [tasks, events]
  );

  // Get count for filter badges
  const getFilterCounts = useCallback(() => {
    return {
      all: tasks.length,
      standalone: standaloneTasks.length,
      eventAssociated: eventAssociatedTasks.length,
    };
  }, [tasks.length, standaloneTasks.length, eventAssociatedTasks.length]);

  // Find orphaned tasks (tasks linked to non-existent events)
  const orphanedTasks = useMemo(() => {
    const eventIds = new Set(events.map(e => e.id));
    return tasks.filter(
      task => task.parentEventId && !eventIds.has(task.parentEventId)
    );
  }, [tasks, events]);

  // Clean up orphaned tasks
  const cleanUpOrphanedTasks = useCallback(() => {
    const eventIds = new Set(events.map(e => e.id));
    const cleanedTasks = tasks.map(task => {
      if (task.parentEventId && !eventIds.has(task.parentEventId)) {
        return unlinkTaskFromEvent(task);
      }
      return task;
    });
    onTasksChange?.(cleanedTasks);
    return cleanedTasks;
  }, [tasks, events, onTasksChange]);

  return {
    // Filtered tasks
    standaloneTasks,
    eventAssociatedTasks,
    orphanedTasks,

    // Statistics
    stats,

    // Filter functions
    getFilteredTasks,
    getTasksForEventById,
    getTasksForEventHierarchyById,
    getFilterCounts,

    // Operations
    linkTask,
    unlinkTask,
    cleanUpOrphanedTasks,

    // Checks
    checkShouldAutoArchive,
    getTaskEventStatusById,
  };
}

// Type export for convenience
export type { TaskEventFilterType };
