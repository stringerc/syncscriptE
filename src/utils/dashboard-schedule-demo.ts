/**
 * Dashboard "Today's schedule" + AI Focus demo fallback.
 *
 * Production uses Supabase (often empty for new visitors); mock data only loads with MockTaskRepository.
 * When the user has no open real tasks, we merge sample tasks so the dashboard matches a populated account.
 */

import { getFreshMockTasks } from '../data/mockTasks';
import type { Task } from '../types/task';

type TaskLike = Pick<Task, 'completed'> & {
  archived?: boolean;
  status?: string;
  tags?: string[];
  id?: string;
};

export const DASHBOARD_SCHEDULE_DEMO_TAG = '__demo_schedule';

export function isDashboardDemoTask(task: TaskLike): boolean {
  if (task.tags?.includes(DASHBOARD_SCHEDULE_DEMO_TAG)) return true;
  return typeof task.id === 'string' && task.id.startsWith('__demo_schedule_');
}

/** Same rules as the schedule card: show active, non-archived work. */
export function isDashboardOpenTask(task: TaskLike): boolean {
  if (task.completed) return false;
  if (task.archived) return false;
  if (task.status === 'completed') return false;
  return true;
}

/**
 * Sample tasks for empty dashboards — dates rebased to "today" so they stay current.
 */
export function getDashboardScheduleDemoTasks(): Task[] {
  const seed = getFreshMockTasks().slice(0, 6);
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const hours = [9, 10, 11, 14, 15, 17];

  return seed.map((t, i) => {
    const hour = hours[i % hours.length];
    const due = new Date(y, m, d, hour, (i % 2) * 30, 0, 0);
    const sched = new Date(y, m, d, hour, 0, 0, 0);
    const baseTags = (t.tags || []).filter((tag) => tag !== DASHBOARD_SCHEDULE_DEMO_TAG);
    return {
      ...t,
      id: `__demo_schedule_${t.id}`,
      completed: false,
      dueDate: due.toISOString(),
      scheduledTime: sched.toISOString(),
      tags: [...baseTags, DASHBOARD_SCHEDULE_DEMO_TAG],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  });
}

/**
 * If there is at least one open non-demo task, return tasks unchanged.
 * Otherwise merge demo tasks (replacing any stale demo rows).
 */
export function withDashboardScheduleDemoFallback(tasks: Task[] | undefined | null): Task[] {
  const list = tasks || [];
  const hasOpenReal = list.some((t) => isDashboardOpenTask(t) && !isDashboardDemoTask(t));
  if (hasOpenReal) return list;
  const withoutDemos = list.filter((t) => !isDashboardDemoTask(t));
  return [...withoutDemos, ...getDashboardScheduleDemoTasks()];
}
