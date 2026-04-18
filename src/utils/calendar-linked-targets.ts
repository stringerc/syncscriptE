import type { Event } from '@/utils/event-task-types';

/** Derive PATCH `targets` from stored linked instances (google_calendar / outlook_calendar). */
export function targetsFromLinkedInstances(
  instances: Event['linkedCalendarInstances'] | undefined | null,
): ('google' | 'outlook')[] {
  const has: { google?: true; outlook?: true } = {};
  for (const i of instances || []) {
    const p = (i.provider || '').toLowerCase();
    if (p.includes('google')) has.google = true;
    if (p.includes('outlook')) has.outlook = true;
  }
  const out: ('google' | 'outlook')[] = [];
  if (has.google) out.push('google');
  if (has.outlook) out.push('outlook');
  return out;
}
