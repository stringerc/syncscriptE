/**
 * useEnergyNotifications Hook
 * 
 * PHASE 4: Advanced Features - Smart Notification System
 * 
 * Delivers contextual, time-based energy notifications to keep users
 * motivated and on track. Notifications are smart - they adapt based
 * on progress, time of day, and predicted outcomes.
 * 
 * FEATURES:
 * - Morning motivation with daily goals
 * - Midday check-ins with catch-up suggestions
 * - Evening final push reminders
 * - Color level-up celebrations
 * - Achievement milestones
 * - Smart timing (not during meetings/sleep)
 */

import { useEffect, useCallback, useRef } from 'react';
import { useEnergy } from './useEnergy';
import { useEnergyPrediction } from './useEnergyPrediction';
import { useCalendarEvents } from './useCalendarEvents';
import { toast } from 'sonner@2.0.3';

export interface NotificationConfig {
  enabled: boolean;
  morningTime: string;      // HH:MM format (default: "08:00")
  middayTime: string;       // HH:MM format (default: "12:00")
  eveningTime: string;      // HH:MM format (default: "18:00")
  quietHoursStart: string;  // HH:MM format (default: "22:00")
  quietHoursEnd: string;    // HH:MM format (default: "07:00")
  duringMeetings: boolean;  // Show during events (default: false)
}

const DEFAULT_CONFIG: NotificationConfig = {
  enabled: true,
  morningTime: "08:00",
  middayTime: "12:00",
  eveningTime: "18:00",
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  duringMeetings: false,
};

/**
 * Check if current time matches target time (within 1 minute)
 */
function isTime(targetTime: string): boolean {
  const now = new Date();
  const [hours, minutes] = targetTime.split(':').map(Number);
  
  return now.getHours() === hours && now.getMinutes() === minutes;
}

/**
 * Check if in quiet hours
 */
function isQuietHours(config: NotificationConfig): boolean {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const [startH, startM] = config.quietHoursStart.split(':').map(Number);
  const [endH, endM] = config.quietHoursEnd.split(':').map(Number);
  
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  
  if (startMinutes < endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  } else {
    // Wraps around midnight
    return nowMinutes >= startMinutes || nowMinutes < endMinutes;
  }
}

/**
 * Check if user is in a meeting/event
 */
function isInMeeting(events: any[]): boolean {
  const now = new Date();
  
  return events.some(event => {
    if (!event.startTime || !event.endTime) return false;
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    return now >= start && now <= end;
  });
}

/**
 * Main hook
 */
export function useEnergyNotifications(
  config: Partial<NotificationConfig> = {}
) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const { energy } = useEnergy();
  const prediction = useEnergyPrediction('Green');
  const { events } = useCalendarEvents();
  
  // Track shown notifications to avoid duplicates
  const shownToday = useRef<Set<string>>(new Set());
  
  // Reset daily tracking at midnight
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        shownToday.current.clear();
      }
    };
    
    const interval = setInterval(checkMidnight, 60000);
    return () => clearInterval(interval);
  }, []);
  
  // Check if notification should be shown
  const shouldShow = useCallback((notificationId: string): boolean => {
    if (!fullConfig.enabled) return false;
    if (shownToday.current.has(notificationId)) return false;
    if (isQuietHours(fullConfig)) return false;
    if (!fullConfig.duringMeetings && isInMeeting(events)) return false;
    
    return true;
  }, [fullConfig, events]);
  
  // Mark notification as shown
  const markShown = useCallback((notificationId: string) => {
    shownToday.current.add(notificationId);
  }, []);
  
  // Morning motivation
  const showMorningMotivation = useCallback(() => {
    const id = `morning-${new Date().toDateString()}`;
    if (!shouldShow(id)) return;
    
    const message = prediction.onTrackForGoal
      ? `Good morning! Complete 3 tasks to reach ${prediction.goalColor} by noon 🌅`
      : `Good morning! Aim for ${prediction.predictedColorName} today 🌅`;
    
    toast('☀️ New Day, New Energy!', {
      description: message,
      duration: 6000,
    });
    
    markShown(id);
  }, [prediction, shouldShow, markShown]);
  
  // Midday check-in
  const showMiddayCheckIn = useCallback(() => {
    const id = `midday-${new Date().toDateString()}`;
    if (!shouldShow(id)) return;
    
    if (energy.totalEnergy < 150) {
      toast('⚡ Midday Boost Time!', {
        description: 'Quick boost: Complete 2 tasks to catch up!',
        duration: 5000,
      });
    } else if (prediction.onTrackForGoal) {
      toast('🔥 You\'re Crushing It!', {
        description: `On pace for ${prediction.goalColor}! Keep it up!`,
        duration: 5000,
      });
    }
    
    markShown(id);
  }, [energy.totalEnergy, prediction, shouldShow, markShown]);
  
  // Evening final push
  const showEveningPush = useCallback(() => {
    const id = `evening-${new Date().toDateString()}`;
    if (!shouldShow(id)) return;
    
    const nextColorEnergy = getNextColorThreshold(energy.totalEnergy);
    const gap = nextColorEnergy - energy.totalEnergy;
    
    if (gap > 0 && gap <= 50) {
      const nextColor = getColorForEnergy(nextColorEnergy).name;
      toast('🎯 So Close!', {
        description: `${gap} energy to ${nextColor}! One more push!`,
        duration: 6000,
      });
      markShown(id);
    }
  }, [energy.totalEnergy, shouldShow, markShown]);
  
  // Color level up celebration
  const showColorLevelUp = useCallback((newColor: string) => {
    const id = `levelup-${newColor}-${new Date().getTime()}`;
    
    toast.success(`🎉 ${newColor} Achieved!`, {
      description: 'You\'re glowing! Amazing progress!',
      duration: 8000,
    });
    
    // Don't mark as shown - can happen multiple times
  }, []);
  
  // Achievement milestone
  const showAchievementMilestone = useCallback((achievement: string) => {
    toast('👑 Achievement Unlocked!', {
      description: achievement,
      duration: 7000,
    });
  }, []);
  
  // Streak notification
  const showStreakNotification = useCallback((days: number) => {
    const id = `streak-${days}`;
    if (!shouldShow(id)) return;
    
    toast('🔥 Streak Alert!', {
      description: `${days} days of high resonance! Unstoppable!`,
      duration: 6000,
    });
    
    markShown(id);
  }, [shouldShow, markShown]);
  
  // Schedule time-based notifications
  useEffect(() => {
    if (!fullConfig.enabled) return;
    
    const checkNotifications = () => {
      // Morning
      if (isTime(fullConfig.morningTime)) {
        showMorningMotivation();
      }
      
      // Midday
      if (isTime(fullConfig.middayTime)) {
        showMiddayCheckIn();
      }
      
      // Evening
      if (isTime(fullConfig.eveningTime)) {
        showEveningPush();
      }
    };
    
    // Check every minute
    const interval = setInterval(checkNotifications, 60000);
    
    // Check immediately
    checkNotifications();
    
    return () => clearInterval(interval);
  }, [
    fullConfig,
    showMorningMotivation,
    showMiddayCheckIn,
    showEveningPush,
  ]);
  
  return {
    config: fullConfig,
    showMorningMotivation,
    showMiddayCheckIn,
    showEveningPush,
    showColorLevelUp,
    showAchievementMilestone,
    showStreakNotification,
  };
}

/**
 * Helper: Get next color threshold
 */
function getNextColorThreshold(currentEnergy: number): number {
  const thresholds = [0, 100, 200, 300, 400, 500, 600];
  return thresholds.find(t => t > currentEnergy) || 700;
}

/**
 * Helper: Get color for energy value
 */
function getColorForEnergy(energy: number): { name: string; color: string } {
  if (energy >= 600) return { name: 'Violet', color: '#8b5cf6' };
  if (energy >= 500) return { name: 'Indigo', color: '#6366f1' };
  if (energy >= 400) return { name: 'Blue', color: '#3b82f6' };
  if (energy >= 300) return { name: 'Green', color: '#22c55e' };
  if (energy >= 200) return { name: 'Yellow', color: '#eab308' };
  if (energy >= 100) return { name: 'Orange', color: '#f97316' };
  return { name: 'Red', color: '#ef4444' };
}

/**
 * Hook: useEnergy (create this if it doesn't exist)
 */
function useEnergy() {
  // This should import from your actual useEnergy hook
  // Placeholder for type safety
  return {
    energy: {
      totalEnergy: 0,
      displayMode: 'points' as const,
      currentLoopProgress: 0,
      completionLoops: 0,
      bySource: {},
      entries: [],
      lastReset: new Date(),
      lastActivity: new Date(),
      dailyHistory: [],
    },
  };
}
