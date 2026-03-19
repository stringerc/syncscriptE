type TaskLike = {
  id: string;
  scheduledTime?: string | Date | null;
  scheduledEventId?: string | null;
};

type EventTaskLike = { id: string };

type EventLike = {
  id: string;
  entityId?: string;
  createdFromTaskId?: string | null;
  sourceTaskId?: string | null;
  linkedTaskIds?: string[];
  tasks?: EventTaskLike[];
  archived?: boolean;
};

export interface TaskCalendarParityReport {
  scheduledTasks: number;
  linkedTasks: number;
  missingLinks: string[];
  orphanedEvents: string[];
  parityScore: number;
}

function toTaskIdSetFromEvents(events: EventLike[]): Set<string> {
  const taskIds = new Set<string>();
  for (const event of events) {
    const fromTask = String(event.createdFromTaskId || '').trim();
    if (fromTask) taskIds.add(fromTask);
    const sourceTask = String(event.sourceTaskId || '').trim();
    if (sourceTask) taskIds.add(sourceTask);
    if (Array.isArray(event.linkedTaskIds)) {
      for (const linkedTaskId of event.linkedTaskIds) {
        const id = String(linkedTaskId || '').trim();
        if (id) taskIds.add(id);
      }
    }
    if (Array.isArray(event.tasks)) {
      for (const task of event.tasks) {
        const id = String(task?.id || '').trim();
        if (id) taskIds.add(id);
      }
    }
  }
  return taskIds;
}

export function buildTaskCalendarParityReport(tasks: TaskLike[], events: EventLike[]): TaskCalendarParityReport {
  const activeEvents = events.filter((event) => !event?.archived);
  const eventTaskIds = toTaskIdSetFromEvents(activeEvents);
  const eventIds = new Set(
    activeEvents
      .flatMap((event) => [String(event?.id || '').trim(), String(event?.entityId || '').trim()])
      .filter(Boolean),
  );
  const scheduledTasks = tasks.filter((task) => !!task.scheduledTime);
  const missingLinks = scheduledTasks
    .filter((task) => {
      const taskId = String(task.id);
      if (eventTaskIds.has(taskId)) return false;
      const scheduledEventId = String(task?.scheduledEventId || '').trim();
      if (scheduledEventId && eventIds.has(scheduledEventId)) return false;
      return true;
    })
    .map((task) => String(task.id));

  const allTaskIds = new Set(tasks.map((task) => String(task.id)));
  const orphanedEvents = activeEvents
    .filter((event) => {
      const fromTask = String(event.createdFromTaskId || '').trim();
      const sourceTask = String(event.sourceTaskId || '').trim();
      if (fromTask) return !allTaskIds.has(fromTask);
      if (sourceTask) return !allTaskIds.has(sourceTask);
      return false;
    })
    .map((event) => String(event.id));

  const linkedTasks = Math.max(0, scheduledTasks.length - missingLinks.length);
  const parityScore = scheduledTasks.length === 0
    ? 1
    : Math.max(0, linkedTasks / scheduledTasks.length);

  return {
    scheduledTasks: scheduledTasks.length,
    linkedTasks,
    missingLinks,
    orphanedEvents,
    parityScore,
  };
}
