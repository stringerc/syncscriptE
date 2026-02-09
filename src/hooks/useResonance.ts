/**
 * useResonance Hook
 * 
 * React hook for integrating resonance calculations into components
 * Provides easy access to resonance scores, recommendations, and real-time updates
 */

import { useState, useEffect, useMemo } from 'react';
import { Task } from '../types/task';
import { Event } from '../utils/event-task-types';
import {
  calculateResonanceScore,
  generateTimeSlots,
  UserContext,
  TimeSlot,
  ResonanceScore,
  getResonanceColor,
  getResonanceLabel,
  getRecommendationText,
} from '../utils/resonance-calculus';
import {
  calculateSystemScore,
  calculateHumanScore,
  calculateContextScore,
  calculateSubsystemResonance,
  calculateGlobalResonance,
  SubsystemResonance,
  GlobalResonance,
  PerformanceMetrics,
  UserFeedback,
  getPersonalizedWeights,
} from '../utils/resonance-multi-factor';

// ============================================================================
// TYPES
// ============================================================================

export interface ResonanceHookResult {
  // Single task resonance
  getTaskResonance: (task: Task, timeSlot?: TimeSlot) => ResonanceScore;
  
  // Batch resonance for multiple tasks
  getBatchResonance: (tasks: Task[]) => Map<string, ResonanceScore>;
  
  // Global system resonance
  globalResonance: GlobalResonance | null;
  
  // Time slot analysis
  analyzeTimeSlots: (task: Task) => Array<{ slot: TimeSlot; resonance: ResonanceScore }>;
  
  // Best time recommendation
  getBestTimeSlot: (task: Task) => { slot: TimeSlot; resonance: ResonanceScore } | null;
  
  // UI helpers
  getColor: (score: number) => string;
  getLabel: (score: number) => string;
  
  // State
  loading: boolean;
  error: string | null;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useResonance(
  tasks: Task[],
  schedule: Event[],
  userType: 'individual' | 'team-lead' | 'executive' = 'individual'
): ResonanceHookResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [globalResonance, setGlobalResonance] = useState<GlobalResonance | null>(null);
  
  // Build user context from current data
  const userContext = useMemo((): UserContext => {
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    
    // Count completed tasks today
    const completedTasksToday = tasks.filter(t => {
      if (!t.completed) return false;
      // In real implementation, check completion timestamp
      return true;
    }).length;
    
    // Estimate recent task switches (simplified)
    const recentTaskSwitches = Math.min(completedTasksToday, 3);
    
    // Calculate cognitive load estimate
    const activeTasks = tasks.filter(t => !t.completed).length;
    const cognitiveLoad = Math.min(1.0, activeTasks / 10);
    
    return {
      currentTime: now,
      schedule,
      completedTasksToday,
      recentTaskSwitches,
      cognitiveLoad,
      dayStart,
    };
  }, [tasks, schedule]);
  
  // Calculate resonance for a single task at a specific time slot
  const getTaskResonance = (task: Task, timeSlot?: TimeSlot): ResonanceScore => {
    try {
      // If no time slot provided, use current time
      const slot = timeSlot || {
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60 * 1000),
        hour: new Date().getHours(),
        duration: 60,
        naturalEnergy: 'medium' as const,
      };
      
      return calculateResonanceScore(task, slot, userContext);
    } catch (err) {
      console.error('Error calculating task resonance:', err);
      return {
        overall: 0.5,
        coherence: 0.5,
        serviceLevel: 0.5,
        components: {
          energyAlignment: 0.5,
          contextMatch: 0.5,
          scheduleFlow: 0.5,
          timingOptimal: 0.5,
        },
        recommendation: 'fair',
        confidence: 0.3,
      };
    }
  };
  
  // Calculate resonance for multiple tasks
  const getBatchResonance = (taskList: Task[]): Map<string, ResonanceScore> => {
    const results = new Map<string, ResonanceScore>();
    
    taskList.forEach(task => {
      const resonance = getTaskResonance(task);
      results.set(task.id, resonance);
    });
    
    return results;
  };
  
  // Analyze all time slots in next 24 hours for a task
  const analyzeTimeSlots = (task: Task): Array<{ slot: TimeSlot; resonance: ResonanceScore }> => {
    const now = new Date();
    const slots = generateTimeSlots(now, 60); // 1-hour intervals
    
    return slots.map(slot => ({
      slot,
      resonance: getTaskResonance(task, slot),
    }));
  };
  
  // Find best time slot for a task
  const getBestTimeSlot = (task: Task): { slot: TimeSlot; resonance: ResonanceScore } | null => {
    const analysis = analyzeTimeSlots(task);
    
    if (analysis.length === 0) return null;
    
    // Sort by resonance score descending
    const sorted = analysis.sort((a, b) => b.resonance.overall - a.resonance.overall);
    
    return sorted[0];
  };
  
  // Calculate global resonance (runs on mount and when data changes)
  useEffect(() => {
    const calculateGlobal = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build subsystems
        const weights = getPersonalizedWeights(userType);
        
        // 1. Schedule subsystem
        const scheduleMetrics: PerformanceMetrics = {
          taskCompletionRate: tasks.filter(t => t.completed).length / Math.max(1, tasks.length),
          avgTaskSwitches: userContext.recentTaskSwitches,
          scheduleAdherence: 0.75, // Mock - would track actual vs scheduled
          energyAlignment: 0.80, // Mock - would calculate from historical data
          bufferTime: 15, // Mock - average buffer minutes
        };
        
        const systemScore = calculateSystemScore(schedule, tasks, scheduleMetrics);
        
        // 2. User satisfaction (mock feedback for now)
        const mockFeedback: UserFeedback[] = [
          {
            taskId: 'task-1',
            completionQuality: 4,
            actualProductivity: 0.8,
            schedulingWasGood: true,
            timestamp: new Date(),
          },
        ];
        const humanScore = calculateHumanScore(mockFeedback);
        
        // 3. Context factors
        const now = new Date();
        const contextScore = calculateContextScore({
          timeOfDay: now.getHours(),
          dayOfWeek: now.getDay(),
          workload: tasks.length > 10 ? 'heavy' : tasks.length < 5 ? 'light' : 'normal',
          interruptions: userContext.recentTaskSwitches,
          teamAvailability: 0.8, // Mock
          resourceAvailability: 0.9, // Mock
        });
        
        // Calculate subsystem resonance
        const scheduleResonance = calculateSubsystemResonance(
          systemScore,
          humanScore,
          contextScore,
          weights,
          'Schedule'
        );
        
        // Calculate global resonance
        const global = calculateGlobalResonance([
          { resonance: scheduleResonance, importance: 1.0 },
        ]);
        
        setGlobalResonance(global);
      } catch (err) {
        console.error('Error calculating global resonance:', err);
        setError('Failed to calculate resonance');
      } finally {
        setLoading(false);
      }
    };
    
    calculateGlobal();
  }, [tasks, schedule, userContext, userType]);
  
  return {
    getTaskResonance,
    getBatchResonance,
    globalResonance,
    analyzeTimeSlots,
    getBestTimeSlot,
    getColor: getResonanceColor,
    getLabel: getResonanceLabel,
    loading,
    error,
  };
}

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Hook for real-time resonance monitoring
 * Updates every minute to track changing conditions
 */
export function useRealtimeResonance(
  task: Task | null,
  updateInterval: number = 60000 // 1 minute
) {
  const [currentResonance, setCurrentResonance] = useState<ResonanceScore | null>(null);
  
  useEffect(() => {
    if (!task) return;
    
    const updateResonance = () => {
      // This would use the useResonance hook or direct calculation
      // For now, simplified
      const now = new Date();
      const timeSlot: TimeSlot = {
        startTime: now,
        endTime: new Date(now.getTime() + 60 * 60 * 1000),
        hour: now.getHours(),
        duration: 60,
        naturalEnergy: 'medium',
      };
      
      // Would call calculateResonanceScore here with proper context
      // Simplified for demo
      setCurrentResonance({
        overall: 0.75,
        coherence: 0.80,
        serviceLevel: 0.85,
        components: {
          energyAlignment: 0.8,
          contextMatch: 0.75,
          scheduleFlow: 0.8,
          timingOptimal: 0.85,
        },
        recommendation: 'good',
        confidence: 0.8,
      });
    };
    
    // Initial update
    updateResonance();
    
    // Set up interval
    const interval = setInterval(updateResonance, updateInterval);
    
    return () => clearInterval(interval);
  }, [task, updateInterval]);
  
  return currentResonance;
}

/**
 * Hook for tracking resonance history
 * Useful for trend analysis and learning
 */
export function useResonanceHistory(taskId: string, daysBack: number = 7) {
  const [history, setHistory] = useState<Array<{
    timestamp: Date;
    resonance: number;
    completed: boolean;
  }>>([]);
  
  useEffect(() => {
    // In real implementation, fetch from storage/database
    // For now, return empty array
    setHistory([]);
  }, [taskId, daysBack]);
  
  return history;
}
