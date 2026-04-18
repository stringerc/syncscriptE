import { useEffect, useRef } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import type { Event } from '../utils/event-task-types';

const SYNCED_PREFIX = 'event-from-task-';

/**
 * Bridges tasks with scheduledTime into calendar Event objects.
 * Any task that has a scheduledTime (including Nexus phone-created events)
 * will automatically appear on the Calendar tab.
 */
export function TaskCalendarSync() {
  const { tasks } = useTasks();
  const { events, addEvent } = useCalendarEvents();
  const syncedIdsRef = useRef(new Set<string>());

  useEffect(() => {
    if (!tasks?.length) return;

    const existingTaskEventIds = new Set(
      events
        .filter((e) => e.id.startsWith(SYNCED_PREFIX) || (e as any).createdFromTaskId)
        .map((e) => (e as any).createdFromTaskId || e.id.replace(SYNCED_PREFIX, '')),
    );

    for (const task of tasks) {
      if (!task.scheduledTime || task.completed) continue;
      if (existingTaskEventIds.has(task.id)) continue;
      if (syncedIdsRef.current.has(task.id)) continue;

      const start = new Date(task.scheduledTime);
      if (Number.isNaN(start.getTime())) continue;

      let durationMs = 60 * 60 * 1000;
      if (task.estimatedTime) {
        const match = String(task.estimatedTime).match(/(\d+)\s*(min|h)/i);
        if (match) {
          const n = parseInt(match[1], 10);
          durationMs = match[2].toLowerCase() === 'h' ? n * 3600000 : n * 60000;
        }
      }
      const end = new Date(start.getTime() + durationMs);

      const eventId = `${SYNCED_PREFIX}${task.id}`;
      const newEvent: Event = {
        id: eventId,
        title: task.title.replace(/^\u{1F4C5}\s*/u, ''),
        description: task.description || '',
        startTime: start,
        endTime: end,
        completed: false,
        tasks: [],
        hasScript: false,
        resources: [],
        linksNotes: [],
        teamMembers: [],
        createdBy: task.createdBy || 'Nexus',
        createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
        updatedAt: new Date(),
        allowTeamEdits: false,
        hierarchyType: 'primary',
        isPrimaryEvent: true,
        childEventIds: [],
        depth: 0,
        isScheduled: true,
        archived: false,
        autoArchiveChildren: false,
        inheritPermissions: false,
        createdFromTaskId: task.id,
        category: (task.tags || []).includes('calendar-event') ? 'calendar-event' : undefined,
      } as Event;

      syncedIdsRef.current.add(task.id);
      addEvent(newEvent);
    }
  }, [tasks, events, addEvent]);

  return null;
}
