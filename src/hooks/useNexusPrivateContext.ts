import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEnergy } from '../contexts/EnergyContext';
import { useUserPreferences } from '../utils/user-preferences';
import { useCurrentReadiness } from './useCurrentReadiness';
import { useDashboardMetrics } from './useDashboardMetrics';

export function useNexusPrivateContext() {
  const { user } = useAuth();
  const { energy } = useEnergy();
  const { preferences } = useUserPreferences();
  const readiness = useCurrentReadiness();
  const metrics = useDashboardMetrics();

  return useMemo(() => {
    return {
      surface: 'authenticated',
      user: {
        id: user?.id || null,
        name: user?.name || 'User',
      },
      dashboard: {
        peakWindow: `${metrics.peakWindow.windowStart}:00-${metrics.peakWindow.windowEnd}:00`,
        tasksCompletedToday: metrics.taskSummary.completedToday,
        scheduledToday: metrics.taskSummary.scheduledToday,
        urgentOpen: metrics.taskSummary.highPriority,
        streak: metrics.streak,
        level: metrics.level,
      },
      resonance: {
        readinessPercent: Math.round(readiness),
        inPeakWindow: metrics.peakWindow.isInPeak,
        calibrationReady: metrics.calibration.hasData,
      },
      energy: {
        total: energy.totalEnergy,
        currentColor: energy.currentColor?.name || null,
      },
      preferences: {
        peakEnergyTime: preferences.peakEnergyTime,
        preferredStartTime: preferences.preferredStartTime,
        preferredEndTime: preferences.preferredEndTime,
      },
      timestamp: new Date().toISOString(),
    };
  }, [
    user?.id,
    user?.name,
    metrics.peakWindow.windowStart,
    metrics.peakWindow.windowEnd,
    metrics.peakWindow.isInPeak,
    metrics.taskSummary.completedToday,
    metrics.taskSummary.scheduledToday,
    metrics.taskSummary.highPriority,
    metrics.streak,
    metrics.level,
    metrics.calibration.hasData,
    readiness,
    energy.totalEnergy,
    energy.currentColor?.name,
    preferences.peakEnergyTime,
    preferences.preferredStartTime,
    preferences.preferredEndTime,
  ]);
}
