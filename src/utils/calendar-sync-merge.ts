import type { Event } from '@/utils/event-task-types';
import type { CalendarSyncGroupRow } from '@/lib/calendar-linked-api';

/**
 * Second-resolution fingerprint (title + start/end epoch seconds).
 * Safer than minute-only; still not a unique id — see ambiguous-group handling below.
 */
export function fingerprintEvent(e: Pick<Event, 'title' | 'startTime' | 'endTime'>): string {
  const s = e.startTime instanceof Date ? e.startTime : new Date(e.startTime);
  const t = e.endTime instanceof Date ? e.endTime : new Date(e.endTime);
  const ss = Math.floor(s.getTime() / 1000);
  const es = Math.floor(t.getTime() / 1000);
  return `${String(e.title).trim().toLowerCase()}|${ss}|${es}`;
}

export function fingerprintSyncGroup(g: Pick<CalendarSyncGroupRow, 'title' | 'start_time' | 'end_time'>): string {
  const ss = Math.floor(new Date(g.start_time).getTime() / 1000);
  const es = Math.floor(new Date(g.end_time).getTime() / 1000);
  return `${String(g.title).trim().toLowerCase()}|${ss}|${es}`;
}

/**
 * Collapse duplicate local rows that match the same linked hold.
 * - **By `syncGroupId`:** always trusted when it matches a group id.
 * - **By fingerprint:** only when exactly **one** group in KV has that fingerprint (avoids
 *   picking the wrong group when two holds collide on title+time). Events with `syncGroupId`
 *   set only match that group by id, never by fingerprint to another group.
 */
export function mergeLocalEventsWithSyncGroups(
  events: Event[],
  groups: CalendarSyncGroupRow[] | undefined | null,
): Event[] {
  if (!groups?.length) return events;

  const fpToGroups = new Map<string, CalendarSyncGroupRow[]>();
  for (const g of groups) {
    const fp = fingerprintSyncGroup(g);
    const list = fpToGroups.get(fp) ?? [];
    list.push(g);
    fpToGroups.set(fp, list);
  }
  const ambiguousFp = new Set<string>();
  for (const [fp, list] of fpToGroups) {
    if (list.length > 1) ambiguousFp.add(fp);
  }

  const hidden = new Set<string>();
  const enrich = new Map<string, Pick<Event, 'syncGroupId' | 'linkedCalendarInstances'>>();

  for (const g of groups) {
    const fpG = fingerprintSyncGroup(g);

    const byId = events.filter((e) => e.syncGroupId === g.id);
    const byFp =
      ambiguousFp.has(fpG)
        ? []
        : events.filter(
            (e) =>
              !e.syncGroupId &&
              fingerprintEvent(e) === fpG,
          );

    const matching = byId.length > 0 ? byId : byFp;
    if (matching.length === 0) continue;

    const primary = matching[0];
    for (let i = 1; i < matching.length; i++) {
      hidden.add(matching[i].id);
    }

    enrich.set(primary.id, {
      syncGroupId: g.id,
      linkedCalendarInstances: g.instances.map((i) => ({
        provider: i.provider,
        eventId: i.event_id,
        link: i.link ?? null,
      })),
    });
  }

  return events
    .filter((e) => !hidden.has(e.id))
    .map((e) => {
      const patch = enrich.get(e.id);
      return patch ? { ...e, ...patch } : e;
    });
}
