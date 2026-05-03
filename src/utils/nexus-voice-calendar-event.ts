/**
 * Build a primary {@link Event} for the local calendar store from a
 * `propose_calendar_hold` tool detail (voice client creates the event — server returns proposal only).
 */
import type { Event } from './event-task-types';

/** Row from Edge GET /calendar/local-events (KV mirror of local-only holds). */
export type EdgeLocalCalendarRow = {
  id: string;
  title: string;
  start_iso: string;
  end_iso: string;
  source?: string;
  created_at?: string;
};

export function buildPrimaryEventFromEdgeLocalHold(row: EdgeLocalCalendarRow): Event {
  const id = `edge-local-${row.id}`;
  const startTime = new Date(String(row.start_iso));
  const endTime = new Date(String(row.end_iso));
  const now = new Date();
  const title = String(row.title || 'Calendar event').trim() || 'Calendar event';

  return {
    id,
    title,
    description: undefined,
    startTime,
    endTime,
    completed: false,
    hierarchyType: 'primary',
    isPrimaryEvent: true,
    childEventIds: [],
    depth: 0,
    isScheduled: true,
    archived: false,
    autoArchiveChildren: false,
    inheritPermissions: false,
    tasks: [],
    hasScript: false,
    resources: [],
    linksNotes: [],
    teamMembers: [],
    createdBy: 'SyncScript',
    createdAt: now,
    updatedAt: now,
    allowTeamEdits: true,
  } as Event;
}

export function buildPrimaryEventFromNexusCalendarHold(detail: {
  title?: string;
  start_iso?: string;
  end_iso?: string;
}): Event {
  const id = `nexus-vcal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const startTime = new Date(String(detail.start_iso));
  const endTime = new Date(String(detail.end_iso));
  const now = new Date();
  const title = String(detail.title || 'Calendar event').trim() || 'Calendar event';

  return {
    id,
    title,
    description: undefined,
    startTime,
    endTime,
    completed: false,
    hierarchyType: 'primary',
    isPrimaryEvent: true,
    childEventIds: [],
    depth: 0,
    isScheduled: true,
    archived: false,
    autoArchiveChildren: false,
    inheritPermissions: false,
    tasks: [],
    hasScript: false,
    resources: [],
    linksNotes: [],
    teamMembers: [],
    createdBy: 'Nexus Voice',
    createdAt: now,
    updatedAt: now,
    allowTeamEdits: true,
  } as Event;
}
