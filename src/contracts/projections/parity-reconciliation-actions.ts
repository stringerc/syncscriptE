import type { TaskCalendarParityReport } from './task-calendar-parity';

export type ParityReconciliationActionType =
  | 'link_missing_task'
  | 'remove_orphan_event'
  | 'inspect_event_linkage';

export interface ParityReconciliationAction {
  id: string;
  type: ParityReconciliationActionType;
  priority: 'high' | 'medium';
  taskId?: string;
  eventId?: string;
  summary: string;
}

export function buildParityReconciliationActions(
  report: TaskCalendarParityReport,
): ParityReconciliationAction[] {
  const actions: ParityReconciliationAction[] = [];

  for (const taskId of report.missingLinks) {
    actions.push({
      id: `link:${taskId}`,
      type: 'link_missing_task',
      priority: 'high',
      taskId,
      summary: `Create or re-attach calendar event for scheduled task ${taskId}.`,
    });
  }

  for (const eventId of report.orphanedEvents) {
    actions.push({
      id: `orphan:${eventId}`,
      type: 'remove_orphan_event',
      priority: 'high',
      eventId,
      summary: `Archive or remove orphaned event ${eventId}.`,
    });
  }

  if (actions.length === 0 && report.parityScore < 1) {
    actions.push({
      id: 'inspect:parity-score',
      type: 'inspect_event_linkage',
      priority: 'medium',
      summary: 'Inspect schedule linkage for partial parity loss.',
    });
  }

  return actions;
}
