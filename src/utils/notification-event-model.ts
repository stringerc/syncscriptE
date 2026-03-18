export type NotificationPriority = 'P0' | 'P1' | 'P2';

export interface NotificationEvent {
  id: string;
  type: 'success' | 'warning' | 'info' | 'reminder';
  title: string;
  message: string;
  occurredAtIso: string;
  fingerprint: string;
  watchEligible: boolean;
}

export interface NotificationBudgetPolicy {
  maxPerHourByPriority: Record<NotificationPriority, number>;
  dedupeWindowMs: number;
}

export interface NotificationBudgetResult {
  kept: NotificationEvent[];
  droppedByBudget: number;
  droppedByDedupe: number;
  watchCount: number;
}

export const DEFAULT_NOTIFICATION_POLICY: NotificationBudgetPolicy = {
  maxPerHourByPriority: {
    P0: 6,
    P1: 12,
    P2: 20,
  },
  dedupeWindowMs: 5 * 60 * 1000,
};

function priorityForEvent(event: NotificationEvent): NotificationPriority {
  if (event.type === 'warning') return 'P0';
  if (event.type === 'reminder') return 'P1';
  return 'P2';
}

export function applyNotificationBudget(
  events: NotificationEvent[],
  policy: NotificationBudgetPolicy = DEFAULT_NOTIFICATION_POLICY,
): NotificationBudgetResult {
  const sorted = [...events].sort(
    (a, b) => new Date(b.occurredAtIso).getTime() - new Date(a.occurredAtIso).getTime(),
  );
  const kept: NotificationEvent[] = [];
  const seenFingerprintAt = new Map<string, number>();
  const perHourBucket = new Map<string, number>();
  let droppedByBudget = 0;
  let droppedByDedupe = 0;

  for (const event of sorted) {
    const ts = new Date(event.occurredAtIso).getTime();
    if (!Number.isFinite(ts)) continue;

    const lastSeen = seenFingerprintAt.get(event.fingerprint);
    if (typeof lastSeen === 'number' && Math.abs(lastSeen - ts) < policy.dedupeWindowMs) {
      droppedByDedupe += 1;
      continue;
    }

    const priority = priorityForEvent(event);
    const hourBucket = `${priority}:${new Date(ts).toISOString().slice(0, 13)}`;
    const bucketCount = perHourBucket.get(hourBucket) || 0;
    const maxForPriority = policy.maxPerHourByPriority[priority];
    if (bucketCount >= maxForPriority) {
      droppedByBudget += 1;
      continue;
    }

    kept.push(event);
    perHourBucket.set(hourBucket, bucketCount + 1);
    seenFingerprintAt.set(event.fingerprint, ts);
  }

  return {
    kept,
    droppedByBudget,
    droppedByDedupe,
    watchCount: kept.filter((event) => event.watchEligible).length,
  };
}
