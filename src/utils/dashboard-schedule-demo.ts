/**
 * Dashboard "Today's schedule" + AI Focus demo fallback.
 *
 * Production often returns 0 tasks for a brand-new account. In that case we merge sample tasks so
 * the dashboard is not a blank wall.
 *
 * If the user has real task rows in the list but they are all complete, we do **not** add demos
 * (otherwise "Review Q4" / "Client presentation" reappear after they finish everything).
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

export type DashboardScheduleDemoOptions = {
  /**
   * From local signal once this user has had real task rows; when API returns `[]` we still
   * suppress demos (e.g. user deleted all tasks after being established).
   */
  hasEstablishedTaskHistory?: boolean;
};

/**
 * If there is at least one open non-demo task, return tasks unchanged.
 * If there is at least one real (non-demo) task row but none are open, return only that list
 * (all complete) — do not add samples.
 * If there are no real tasks: add schedule demos only for first-time / new accounts, not
 * when `hasEstablishedTaskHistory` (per-device) is set.
 */
export function withDashboardScheduleDemoFallback(
  tasks: Task[] | undefined | null,
  options?: DashboardScheduleDemoOptions,
): Task[] {
  const { hasEstablishedTaskHistory = false } = options || {};
  const list = tasks || [];
  const hasOpenReal = list.some((t) => isDashboardOpenTask(t) && !isDashboardDemoTask(t));
  if (hasOpenReal) return list;
  const withoutDemos = list.filter((t) => !isDashboardDemoTask(t));
  if (withoutDemos.length > 0) {
    // User has real tasks in the list but everything is done — no phantom demo work.
    return withoutDemos;
  }
  if (hasEstablishedTaskHistory) {
    return [];
  }
  return [...withoutDemos, ...getDashboardScheduleDemoTasks()];
}
