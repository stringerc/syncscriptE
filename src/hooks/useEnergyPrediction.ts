/**
 * useEnergyPrediction Hook
 * 
 * PHASE 4: Advanced Features - Energy Prediction Algorithm
 * 
 * Predicts end-of-day energy based on current progress, historical patterns,
 * and scheduled activities. Uses lightweight ML-inspired calculations.
 * 
 * FEATURES:
 * - Real-time prediction updates
 * - Historical pattern analysis
 * - Scheduled task/event consideration
 * - Confidence scoring
 * - Actionable recommendations
 */

import { useMemo } from 'react';
import { useEnergy } from './useEnergy';
import { useCalendarEvents } from './useCalendarEvents';
import { useTasks } from './useTasks';
import { getTaskEnergyValue, getGoalEnergyValue } from '../utils/energy-system';

export interface EnergyPrediction {
  // Predictions
  predictedEnergy: number;
  predictedColor: string;
  predictedColorName: string;
  
  // Confidence
  confidence: number; // 0-1
  confidenceLevel: 'low' | 'medium' | 'high';
  
  // Analysis
  currentProgress: number; // Percentage of typical daily energy
  remainingPotential: number; // Energy available from scheduled items
  historicalAverage: number; // Typical end-of-day energy
  
  // Recommendations
  recommendations: string[];
  onTrackForGoal: boolean;
  goalColor: string;
  
  // Time-based insights
  hoursRemaining: number;
  tasksRemaining: number;
  eventsRemaining: number;
}

/**
 * Calculate average energy from history
 */
function calculateHistoricalAverage(history: any[]): number {
  if (history.length === 0) return 300; // Default assumption
  
  const recent = history.slice(-7); // Last 7 days
  const sum = recent.reduce((acc, day) => acc + (day.totalEnergy || 0), 0);
  return Math.round(sum / recent.length);
}

/**
 * Get color for energy value
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
 * Calculate confidence based on data quality
 */
function calculateConfidence(
  hasHistory: boolean,
  scheduledItems: number,
  currentHour: number
): number {
  let confidence = 0.5; // Base
  
  // Historical data increases confidence
  if (hasHistory) confidence += 0.2;
  
  // More scheduled items = more predictable
  if (scheduledItems >= 3) confidence += 0.2;
  if (scheduledItems >= 5) confidence += 0.1;
  
  // Later in day = more confident
  if (currentHour >= 12) confidence += 0.1;
  if (currentHour >= 18) confidence += 0.1;
  
  return Math.min(confidence, 1.0);
}

/**
 * Predict remaining energy from scheduled items
 */
function predictRemainingEnergy(
  tasks: any[],
  events: any[]
): { total: number; tasksCount: number; eventsCount: number } {
  const now = new Date();
  
  // Incomplete scheduled tasks for today
  const remainingTasks = tasks.filter(t => {
    if (t.completed) return false;
    if (!t.scheduledTime) return false;
    
    const taskTime = new Date(t.scheduledTime);
    return (
      taskTime.getDate() === now.getDate() &&
      taskTime.getMonth() === now.getMonth() &&
      taskTime.getFullYear() === now.getFullYear() &&
      taskTime.getTime() > now.getTime()
    );
  });
  
  // Upcoming events today
  const remainingEvents = events.filter(e => {
    if (!e.startTime) return false;
    const eventTime = new Date(e.startTime);
    return (
      eventTime.getDate() === now.getDate() &&
      eventTime.getMonth() === now.getMonth() &&
      eventTime.getFullYear() === now.getFullYear() &&
      eventTime.getTime() > now.getTime()
    );
  });
  
  // Calculate potential energy
  const taskEnergy = remainingTasks.reduce((acc, t) => {
    const priority = t.priority === 'urgent' || t.priority === 'high' 
      ? 'high' 
      : t.priority === 'medium' ? 'medium' : 'low';
    return acc + getTaskEnergyValue(priority);
  }, 0);
  
  const eventEnergy = remainingEvents.length * 15; // Avg event energy
  
  return {
    total: taskEnergy + eventEnergy,
    tasksCount: remainingTasks.length,
    eventsCount: remainingEvents.length,
  };
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  current: number,
  predicted: number,
  remaining: number,
  goalColor: string
): string[] {
  const recommendations: string[] = [];
  const goalEnergy = getEnergyForColor(goalColor);
  const gap = goalEnergy - predicted;
  
  if (predicted >= goalEnergy) {
    recommendations.push(`🎯 On track for ${goalColor}! Keep going!`);
  } else if (gap <= remaining) {
    recommendations.push(`💪 Complete ${Math.ceil(gap / 20)} more tasks to reach ${goalColor}`);
  } else {
    const achievableColor = getColorForEnergy(predicted).name;
    recommendations.push(`🎯 Adjust goal to ${achievableColor} for today`);
  }
  
  if (remaining > 50) {
    recommendations.push('📅 You have significant energy potential scheduled');
  }
  
  if (current < 100 && new Date().getHours() >= 12) {
    recommendations.push('⚡ Energy low for this time. Quick wins recommended!');
  }
  
  return recommendations;
}

/**
 * Get energy threshold for color
 */
function getEnergyForColor(color: string): number {
  const colorMap: { [key: string]: number } = {
    'Red': 0,
    'Orange': 100,
    'Yellow': 200,
    'Green': 300,
    'Blue': 400,
    'Indigo': 500,
    'Violet': 600,
  };
  return colorMap[color] || 300;
}

/**
 * Main hook
 */
export function useEnergyPrediction(goalColor: string = 'Green'): EnergyPrediction {
  const { energy } = useEnergy();
  const { events } = useCalendarEvents();
  const { tasks } = useTasks();
  
  const prediction = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const hoursRemaining = 24 - currentHour;
    
    // Historical average
    const historicalAverage = calculateHistoricalAverage(
      energy.dailyHistory || []
    );
    
    // Current progress vs typical
    const currentProgress = historicalAverage > 0
      ? (energy.totalEnergy / historicalAverage) * 100
      : 50;
    
    // Remaining potential from schedule
    const remainingData = predictRemainingEnergy(tasks, events);
    const remainingPotential = remainingData.total;
    
    // Simple prediction: current + 70% of remaining potential
    // (Assume 70% completion rate for scheduled items)
    const predictedEnergy = Math.round(
      energy.totalEnergy + (remainingPotential * 0.7)
    );
    
    // Color prediction
    const predictedColorData = getColorForEnergy(predictedEnergy);
    
    // Confidence calculation
    const confidence = calculateConfidence(
      energy.dailyHistory && energy.dailyHistory.length > 0,
      remainingData.tasksCount + remainingData.eventsCount,
      currentHour
    );
    
    const confidenceLevel: 'low' | 'medium' | 'high' = 
      confidence >= 0.7 ? 'high' : confidence >= 0.5 ? 'medium' : 'low';
    
    // Goal tracking
    const goalEnergy = getEnergyForColor(goalColor);
    const onTrackForGoal = predictedEnergy >= goalEnergy;
    
    // Recommendations
    const recommendations = generateRecommendations(
      energy.totalEnergy,
      predictedEnergy,
      remainingPotential,
      goalColor
    );
    
    return {
      predictedEnergy,
      predictedColor: predictedColorData.color,
      predictedColorName: predictedColorData.name,
      confidence,
      confidenceLevel,
      currentProgress,
      remainingPotential,
      historicalAverage,
      recommendations,
      onTrackForGoal,
      goalColor,
      hoursRemaining,
      tasksRemaining: remainingData.tasksCount,
      eventsRemaining: remainingData.eventsCount,
    };
  }, [energy, tasks, events, goalColor]);
  
  return prediction;
}

/**
 * Helper: Get prediction status icon and message
 */
export function getPredictionStatus(prediction: EnergyPrediction): {
  icon: string;
  message: string;
  color: string;
} {
  if (prediction.onTrackForGoal) {
    return {
      icon: '🎯',
      message: `On track for ${prediction.goalColor}!`,
      color: 'text-green-400',
    };
  }
  
  const gap = getEnergyForColor(prediction.goalColor) - prediction.predictedEnergy;
  if (gap <= prediction.remainingPotential) {
    return {
      icon: '💪',
      message: `${gap} energy needed. Still achievable!`,
      color: 'text-yellow-400',
    };
  }
  
  return {
    icon: '📊',
    message: `Trending toward ${prediction.predictedColorName}`,
    color: 'text-blue-400',
  };
}
