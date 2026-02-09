/**
 * useResonanceEnergyMultiplier Hook
 * 
 * PHASE 3: Resonance Integration
 * 
 * Calculates energy multipliers based on task/event resonance scores.
 * Applies automatic bonuses for high-resonance activities and creates
 * positive feedback loops for aligned schedules.
 * 
 * FEATURES:
 * - Real-time resonance tracking
 * - Dynamic energy multipliers
 * - Resonance streak detection
 * - Harmony state detection (FLOW)
 * - AI-powered resonance insights
 */

import { useMemo, useCallback } from 'react';
import { useCalendarEvents } from './useCalendarEvents';
import { useTasks } from './useTasks';

export interface ResonanceEnergyMultiplier {
  // Current state
  avgResonance: number;
  multiplier: number;
  status: 'low' | 'medium' | 'high' | 'flow';
  
  // Streak tracking
  streakDays: number;
  streakBonus: number;
  inStreak: boolean;
  
  // Harmony detection
  inHarmony: boolean;
  harmonyBonus: number;
  harmonyMessage?: string;
  
  // Methods
  getMultiplierForResonance: (resonance: number) => number;
  checkResonanceHarmony: (completedToday: number) => boolean;
  getResonanceInsight: () => string;
}

/**
 * Calculate energy multiplier based on resonance score
 */
function calculateMultiplier(resonance: number): number {
  if (resonance >= 90) return 2.0;   // Exceptional alignment - 100% bonus
  if (resonance >= 80) return 1.5;   // High alignment - 50% bonus
  if (resonance >= 60) return 1.2;   // Good alignment - 20% bonus
  if (resonance >= 40) return 1.0;   // Neutral - no modifier
  if (resonance >= 20) return 0.8;   // Poor alignment - 20% penalty
  return 0.6;                         // Very poor - 40% penalty
}

/**
 * Determine resonance status
 */
function getResonanceStatus(resonance: number): 'low' | 'medium' | 'high' | 'flow' {
  if (resonance >= 90) return 'flow';
  if (resonance >= 80) return 'high';
  if (resonance >= 60) return 'medium';
  return 'low';
}

/**
 * Calculate streak bonus
 */
function calculateStreakBonus(streakDays: number): number {
  if (streakDays >= 7) return 50;   // Week streak
  if (streakDays >= 5) return 30;   // 5-day streak
  if (streakDays >= 3) return 15;   // 3-day streak
  return 0;
}

/**
 * Check if schedule is today
 */
function isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

/**
 * Main hook
 */
export function useResonanceEnergyMultiplier(): ResonanceEnergyMultiplier {
  const { events } = useCalendarEvents();
  const { tasks } = useTasks();
  
  // Calculate today's average resonance
  const avgResonance = useMemo(() => {
    const today = new Date();
    
    // Get today's tasks and events
    const todayTasks = tasks.filter(t => {
      if (!t.scheduledTime) return false;
      const taskDate = new Date(t.scheduledTime);
      return isToday(taskDate);
    });
    
    const todayEvents = events.filter(e => {
      if (!e.startTime) return false;
      return isToday(e.startTime);
    });
    
    // Combine all items
    const allItems = [
      ...todayTasks.map(t => t.resonance || 50),
      ...todayEvents.map(e => e.resonance || 50),
    ];
    
    if (allItems.length === 0) return 50; // Neutral default
    
    const sum = allItems.reduce((acc, r) => acc + r, 0);
    return Math.round(sum / allItems.length);
  }, [tasks, events]);
  
  // Calculate current multiplier
  const multiplier = useMemo(() => {
    return calculateMultiplier(avgResonance);
  }, [avgResonance]);
  
  // Determine status
  const status = useMemo(() => {
    return getResonanceStatus(avgResonance);
  }, [avgResonance]);
  
  // Calculate streak (simplified - would use localStorage in production)
  const streakDays = useMemo(() => {
    // TODO: Track actual streak across days using localStorage
    // For now, return mock value based on current resonance
    if (avgResonance >= 80) return 5;
    if (avgResonance >= 70) return 3;
    return 0;
  }, [avgResonance]);
  
  const streakBonus = useMemo(() => {
    return calculateStreakBonus(streakDays);
  }, [streakDays]);
  
  const inStreak = streakDays >= 3;
  
  // Check for resonance harmony (FLOW state)
  const checkResonanceHarmony = useCallback((completedToday: number): boolean => {
    return completedToday >= 5 && avgResonance >= 80;
  }, [avgResonance]);
  
  const inHarmony = useMemo(() => {
    // Count completed tasks today
    const completedToday = tasks.filter(t => {
      if (!t.completed || !t.scheduledTime) return false;
      return isToday(new Date(t.scheduledTime));
    }).length;
    
    return checkResonanceHarmony(completedToday);
  }, [tasks, checkResonanceHarmony]);
  
  const harmonyBonus = inHarmony ? 50 : 0;
  const harmonyMessage = inHarmony 
    ? '🌊 You\'re in FLOW! Resonance harmony achieved!' 
    : undefined;
  
  // Get multiplier for specific resonance value
  const getMultiplierForResonance = useCallback((resonance: number): number => {
    return calculateMultiplier(resonance);
  }, []);
  
  // Get AI insight based on current state
  const getResonanceInsight = useCallback((): string => {
    if (status === 'flow') {
      return '✨ Perfect alignment! Every action amplifies your energy.';
    }
    if (status === 'high') {
      return '🔥 Strong resonance! Tasks feel natural and energizing.';
    }
    if (status === 'medium') {
      return '💡 Good rhythm. Consider rescheduling low-resonance items.';
    }
    return '⚠️ Low alignment detected. Time to retune your schedule.';
  }, [status]);
  
  return {
    avgResonance,
    multiplier,
    status,
    streakDays,
    streakBonus,
    inStreak,
    inHarmony,
    harmonyBonus,
    harmonyMessage,
    getMultiplierForResonance,
    checkResonanceHarmony,
    getResonanceInsight,
  };
}

/**
 * Helper: Apply resonance multiplier to base energy
 */
export function applyResonanceMultiplier(
  baseEnergy: number,
  resonance: number
): number {
  const multiplier = calculateMultiplier(resonance);
  return Math.floor(baseEnergy * multiplier);
}

/**
 * Helper: Get resonance feedback message
 */
export function getResonanceFeedback(
  multiplier: number
): { icon: string; message?: string } {
  if (multiplier >= 2.0) {
    return { icon: '✨', message: 'Perfect resonance! Maximum energy boost!' };
  }
  if (multiplier >= 1.5) {
    return { icon: '🔥', message: 'High resonance! Energy boosted!' };
  }
  if (multiplier >= 1.2) {
    return { icon: '💫', message: 'Good resonance. Nice alignment!' };
  }
  if (multiplier < 1.0) {
    return { icon: '⚠️', message: 'Low resonance. Consider rescheduling.' };
  }
  return { icon: '⚡' };
}
