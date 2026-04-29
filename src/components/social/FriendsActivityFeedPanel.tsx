/**
 * Friend activity stream (requires accepted friend relationships + opted-in visibility).
 */
import { useEffect, useState } from 'react';
import { Loader2, Users } from 'lucide-react';
import { TeamActivityFeed } from '../TeamActivityFeed';
import type { TeamActivity } from '../../utils/team-integration';
import { fetchFriendActivityFeed } from '../../utils/edge-productivity-client';

function mapFriendEvents(rows: Awaited<ReturnType<typeof fetchFriendActivityFeed>>): TeamActivity[] {
  return rows.map((row) => {
    const meta = row.metadata || {};
    const title = typeof meta.title === 'string' ? meta.title : '';
    const desc =
      row.event_type === 'task_completed'
        ? `Completed task${title ? `: ${title}` : ''}`
        : row.event_type === 'focus_block'
          ? `Focus block${typeof meta.durationMinutes === 'number' ? ` (${meta.durationMinutes}m)` : ''}`
          : row.event_type === 'external_ide_session'
            ? 'IDE session logged'
            : String(row.event_type || 'Activity');
    return {
      type: 'task_completed',
      memberId: row.actor_user_id,
      memberName: 'Friend',
      timestamp: new Date(row.occurred_at),
      description: desc,
      points: Math.min(50, Math.max(0, Number(row.intensity) || 0) * 3),
    };
  });
}

export function FriendsActivityFeedPanel({ enabled }: { enabled: boolean }) {
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<TeamActivity[]>([]);

  useEffect(() => {
    if (!enabled) {
      setActivities([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const rows = await fetchFriendActivityFeed(30);
      if (!cancelled) {
        setActivities(mapFriendEvents(rows));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="mb-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-blue-200">
        <Users className="h-3.5 w-3.5" />
        Friend activity
      </div>
      {loading ? (
        <div className="flex items-center gap-2 py-4 text-xs text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : (
        <TeamActivityFeed activities={activities} maxItems={8} showTimestamps />
      )}
    </div>
  );
}
