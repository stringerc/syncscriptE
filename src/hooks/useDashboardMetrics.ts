import { useMemo } from 'react';
import { useTasks } from './useTasks';
import { useAuth } from '../contexts/AuthContext';
import { useGamification } from '../contexts/GamificationContext';
import { useUserProfile } from '../utils/user-profile';
import { useUserPreferences } from '../utils/user-preferences';
import { CURRENT_USER } from '../utils/user-constants';
import { getPersonalizedCircadianCurve } from '../utils/resonance-calculus';
import { getCalibrationInsights, getCalibrationProfile } from '../utils/resonance-calibration';

const DEFAULT_PEAK_WINDOW = { start: 7, end: 14 };

type DashboardTask = {
  completed?: boolean;
  completedAt?: string | null;
  updatedAt?: string;
  priority?: string;
  scheduledTime?: string;
};

export function useDashboardMetrics() {
  const { tasks } = useTasks();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { preferences } = useUserPreferences();

  let gamification: ReturnType<typeof useGamification> | null = null;
  try {
    gamification = useGamification();
  } catch {
    gamification = null;
  }

  const now = new Date();
  const currentHour = now.getHours();

  const chronotype = useMemo<'morning' | 'evening' | 'neutral'>(() => {
    if (preferences.peakEnergyTime === 'morning') return 'morning';
    if (preferences.peakEnergyTime === 'evening' || preferences.peakEnergyTime === 'night') return 'evening';
    return 'neutral';
  }, [preferences.peakEnergyTime]);

  const peakWindow = useMemo(() => {
    const preferredWorkStart = user?.preferences?.workHours?.start;
    const preferredWorkEnd = user?.preferences?.workHours?.end;
    const hasValidPreferredWindow =
      typeof preferredWorkStart === 'number' &&
      typeof preferredWorkEnd === 'number' &&
      preferredWorkEnd > preferredWorkStart;

    const windowStart = hasValidPreferredWindow ? preferredWorkStart : DEFAULT_PEAK_WINDOW.start;
    const windowEnd = hasValidPreferredWindow ? preferredWorkEnd : DEFAULT_PEAK_WINDOW.end;
    const bestHour = Math.round((windowStart + windowEnd) / 2);
    const isInPeak = currentHour >= windowStart && currentHour <= windowEnd;

    return { bestHour, windowStart, windowEnd, isInPeak, peakValue: 1 };
  }, [currentHour, user?.preferences?.workHours?.start, user?.preferences?.workHours?.end]);

  const taskSummary = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeTasks = tasks.filter(t => !t.completed);
    const completedToday = (tasks as DashboardTask[]).filter(t => {
      if (!t.completed) return false;
      const completionTimestamp = t.completedAt || t.updatedAt;
      if (!completionTimestamp) return false;
      const completedDate = new Date(completionTimestamp);
      if (Number.isNaN(completedDate.getTime())) return false;
      return completedDate >= today && completedDate < tomorrow;
    }).length;

    const highPriority = activeTasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length;
    const scheduledToday = tasks.filter(t => {
      if (!t.scheduledTime) return false;
      const scheduled = new Date(t.scheduledTime);
      return scheduled >= today && scheduled < tomorrow && !t.completed;
    }).length;

    return { total: activeTasks.length, completedToday, highPriority, scheduledToday };
  }, [tasks]);

  const completionDates = useMemo(() => {
    return (tasks as DashboardTask[])
      .filter(task => task.completed)
      .map(task => task.completedAt || task.updatedAt)
      .filter((timestamp): timestamp is string => Boolean(timestamp))
      .map(timestamp => new Date(timestamp))
      .filter(date => !Number.isNaN(date.getTime()));
  }, [tasks]);

  const derivedStreak = useMemo(() => {
    if (completionDates.length === 0) return 0;
    const byDay = new Set(completionDates.map(d => d.toDateString()));
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    let streakDays = 0;

    while (byDay.has(cursor.toDateString())) {
      streakDays += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streakDays;
  }, [completionDates]);

  const streak = derivedStreak || gamification?.profile.stats.currentStreak || profile.dailyStreak || 0;
  const longestStreak = Math.max(streak, gamification?.profile.stats.longestStreak || streak);
  const level = profile.level || gamification?.profile.level || CURRENT_USER.level || 24;
  const xp = gamification?.profile.xp || 0;
  const nextLevelXp = gamification?.profile.nextLevelXp || 100;
  const xpPercent = Math.min(100, Math.round((xp / nextLevelXp) * 100));

  const sparklineData = useMemo(() => {
    const points: number[] = [];
    const windowMidpoint = (peakWindow.windowStart + peakWindow.windowEnd) / 2;
    const windowRadius = Math.max(1, (peakWindow.windowEnd - peakWindow.windowStart) / 2);

    for (let h = 6; h <= 22; h++) {
      const base = getPersonalizedCircadianCurve(h, chronotype);
      const distance = Math.abs(h - windowMidpoint) / windowRadius;
      const inWindowBoost = distance <= 1 ? 1 + (1 - distance) * 0.12 : 1 - Math.min(0.14, (distance - 1) * 0.08);
      points.push(Math.round(Math.max(0.3, Math.min(1, base * inWindowBoost)) * 100));
    }
    return points;
  }, [chronotype, peakWindow.windowStart, peakWindow.windowEnd]);

  const calibration = useMemo(() => {
    const calibrationProfile = getCalibrationProfile();
    const insights = getCalibrationInsights();
    return { profile: calibrationProfile, insights, hasData: calibrationProfile.dataPointCount >= 10 };
  }, []);

  return {
    currentHour,
    peakWindow,
    taskSummary,
    streak,
    longestStreak,
    level,
    xpPercent,
    sparklineData,
    calibration,
  };
}
