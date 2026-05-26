/**
 * Gamification engine — points, levels, streaks.
 *
 * Points flow from the SyncScript MCP (create_task, verify_done, create_event)
 * and from the Dream State session sync. Every action earns points.
 * The heat map visualizes activity. Streaks reward consistency.
 */

export const POINTS_CONFIG = {
  task_created: 10,
  task_completed: 25,
  verify_done: 50,
  event_created: 5,
  memory_updated: 3,
  session_login: 1,
} as const;

export type PointAction = keyof typeof POINTS_CONFIG;

export function calculateLevel(points: number): number {
  return Math.floor(points / 100) + 1;
}

export function pointsForNextLevel(points: number): number {
  const currentLevel = calculateLevel(points);
  return currentLevel * 100 - points;
}

export function calculateStreak(
  activityDates: string[], // sorted YYYY-MM-DD strings, most recent first
): { current: number; longest: number } {
  if (activityDates.length === 0) return { current: 0, longest: 0 };

  const uniqueDays = [...new Set(activityDates)].sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Current streak: count backwards from today or yesterday
  let current = 0;
  const startDay = uniqueDays[0] === today || uniqueDays[0] === yesterday ? uniqueDays[0] : null;

  if (startDay) {
    const startDate = new Date(startDay);
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(startDay);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      if (uniqueDays.includes(dateStr)) {
        current++;
      } else {
        break;
      }
    }
  }

  // Longest streak: scan all unique days
  let longest = 0;
  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diffDays === 1) {
      streak++;
    } else {
      longest = Math.max(longest, streak);
      streak = 1;
    }
  }
  longest = Math.max(longest, streak, current);

  return { current, longest };
}

export function levelTitle(level: number): string {
  if (level <= 1) return 'Initiate';
  if (level <= 3) return 'Apprentice';
  if (level <= 5) return 'Journeyer';
  if (level <= 10) return 'Artisan';
  if (level <= 20) return 'Expert';
  if (level <= 50) return 'Master';
  if (level <= 100) return 'Grandmaster';
  return 'Ascended';
}
