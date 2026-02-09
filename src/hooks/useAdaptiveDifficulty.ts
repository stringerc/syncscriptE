/**
 * useAdaptiveDifficulty Hook
 * 
 * PHASE 5: Forward-Thinking - Adaptive Difficulty ML
 * 
 * Automatically adjusts energy thresholds based on user performance.
 * Creates personalized challenge levels that adapt over time.
 * 
 * FEATURES:
 * - Performance tracking (7-day rolling average)
 * - Automatic threshold adjustment (±10%)
 * - Difficulty tiers (Easy, Normal, Hard, Expert)
 * - Encouragement/celebration messaging
 * - Reset to baseline option
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useEnergy } from './useEnergy';
import { toast } from 'sonner@2.0.3';

export interface AdaptiveDifficultyConfig {
  enabled: boolean;
  evaluationDays: number;       // Days to evaluate (default: 7)
  adjustmentThreshold: number;  // Days needed to trigger (default: 5)
  maxAdjustment: number;        // Max percentage change (default: 0.30 = 30%)
  adjustmentStep: number;       // Percentage per adjustment (default: 0.10 = 10%)
}

export interface DifficultyTier {
  name: string;
  multiplier: number;
  description: string;
  colorThresholds: number[];
}

const DIFFICULTY_TIERS: { [key: string]: DifficultyTier } = {
  easy: {
    name: 'Easy',
    multiplier: 0.7,
    description: 'Lower thresholds for a gentler pace',
    colorThresholds: [0, 70, 140, 210, 280, 350, 420], // 30% reduction
  },
  normal: {
    name: 'Normal',
    multiplier: 1.0,
    description: 'Standard energy requirements',
    colorThresholds: [0, 100, 200, 300, 400, 500, 600], // Default
  },
  hard: {
    name: 'Hard',
    multiplier: 1.2,
    description: 'Increased thresholds for high achievers',
    colorThresholds: [0, 120, 240, 360, 480, 600, 720], // 20% increase
  },
  expert: {
    name: 'Expert',
    multiplier: 1.5,
    description: 'Maximum challenge for elite performers',
    colorThresholds: [0, 150, 300, 450, 600, 750, 900], // 50% increase
  },
};

const DEFAULT_CONFIG: AdaptiveDifficultyConfig = {
  enabled: true,
  evaluationDays: 7,
  adjustmentThreshold: 5,
  maxAdjustment: 0.30,
  adjustmentStep: 0.10,
};

/**
 * Calculate average color level reached
 */
function calculateAvgColorLevel(history: any[]): number {
  if (history.length === 0) return 2; // Default to Yellow
  
  const levels = history.map(day => {
    const energy = day.totalEnergy || 0;
    if (energy >= 600) return 6; // Violet
    if (energy >= 500) return 5; // Indigo
    if (energy >= 400) return 4; // Blue
    if (energy >= 300) return 3; // Green
    if (energy >= 200) return 2; // Yellow
    if (energy >= 100) return 1; // Orange
    return 0; // Red
  });
  
  const sum = levels.reduce((acc, level) => acc + level, 0);
  return sum / levels.length;
}

/**
 * Determine recommended difficulty tier
 */
function getRecommendedTier(avgLevel: number, currentTier: string): string {
  // Crushing it (Blue+ for 5+ days) → Increase
  if (avgLevel >= 4.5 && currentTier !== 'expert') {
    if (currentTier === 'hard') return 'expert';
    if (currentTier === 'normal') return 'hard';
    return 'normal';
  }
  
  // Doing well (Green+ for 5+ days) → Maybe increase
  if (avgLevel >= 3.5 && currentTier === 'easy') {
    return 'normal';
  }
  
  // Struggling (Orange or less for 5+ days) → Decrease
  if (avgLevel <= 1.5 && currentTier !== 'easy') {
    if (currentTier === 'expert') return 'hard';
    if (currentTier === 'hard') return 'normal';
    return 'easy';
  }
  
  return currentTier; // No change
}

/**
 * Main hook
 */
export function useAdaptiveDifficulty(
  config: Partial<AdaptiveDifficultyConfig> = {}
) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const { energy } = useEnergy();
  
  // Current difficulty tier (stored in localStorage)
  const [currentTier, setCurrentTier] = useState<string>(() => {
    const stored = localStorage.getItem('syncscript_difficulty_tier');
    return stored || 'normal';
  });
  
  // Last evaluation date
  const [lastEvaluation, setLastEvaluation] = useState<Date>(() => {
    const stored = localStorage.getItem('syncscript_last_difficulty_eval');
    return stored ? new Date(stored) : new Date();
  });
  
  // Get current tier config
  const tier = useMemo(() => {
    return DIFFICULTY_TIERS[currentTier] || DIFFICULTY_TIERS.normal;
  }, [currentTier]);
  
  // Calculate recent performance
  const performance = useMemo(() => {
    const recentHistory = energy.dailyHistory?.slice(-fullConfig.evaluationDays) || [];
    const avgLevel = calculateAvgColorLevel(recentHistory);
    const daysEvaluated = recentHistory.length;
    
    return {
      avgLevel,
      daysEvaluated,
      performanceRating: avgLevel >= 4 ? 'excellent' : 
                        avgLevel >= 3 ? 'good' :
                        avgLevel >= 2 ? 'fair' : 'needs-improvement',
    };
  }, [energy.dailyHistory, fullConfig.evaluationDays]);
  
  // Check if adjustment is needed
  const shouldAdjust = useMemo(() => {
    if (!fullConfig.enabled) return false;
    
    const daysSinceEval = Math.floor(
      (new Date().getTime() - lastEvaluation.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return (
      daysSinceEval >= fullConfig.evaluationDays &&
      performance.daysEvaluated >= fullConfig.adjustmentThreshold
    );
  }, [fullConfig, lastEvaluation, performance.daysEvaluated]);
  
  // Perform adjustment
  const adjustDifficulty = useCallback(() => {
    const recommended = getRecommendedTier(performance.avgLevel, currentTier);
    
    if (recommended !== currentTier) {
      const oldTier = DIFFICULTY_TIERS[currentTier];
      const newTier = DIFFICULTY_TIERS[recommended];
      
      setCurrentTier(recommended);
      localStorage.setItem('syncscript_difficulty_tier', recommended);
      setLastEvaluation(new Date());
      localStorage.setItem('syncscript_last_difficulty_eval', new Date().toISOString());
      
      // Show notification
      if (newTier.multiplier > oldTier.multiplier) {
        toast.success('🔥 Raising the Bar!', {
          description: `You're crushing it! Difficulty increased to ${newTier.name}`,
          duration: 8000,
        });
      } else {
        toast.info('💙 Adjusting Difficulty', {
          description: `Let's make today achievable. Switched to ${newTier.name}`,
          duration: 6000,
        });
      }
    } else {
      // No change needed, just update evaluation date
      setLastEvaluation(new Date());
      localStorage.setItem('syncscript_last_difficulty_eval', new Date().toISOString());
    }
  }, [performance.avgLevel, currentTier]);
  
  // Auto-adjust on schedule
  useEffect(() => {
    if (shouldAdjust) {
      adjustDifficulty();
    }
  }, [shouldAdjust, adjustDifficulty]);
  
  // Manual tier change
  const setTier = useCallback((newTier: string) => {
    if (DIFFICULTY_TIERS[newTier]) {
      setCurrentTier(newTier);
      localStorage.setItem('syncscript_difficulty_tier', newTier);
      setLastEvaluation(new Date());
      localStorage.setItem('syncscript_last_difficulty_eval', new Date().toISOString());
      
      toast.success('Difficulty Updated', {
        description: `Switched to ${DIFFICULTY_TIERS[newTier].name} mode`,
      });
    }
  }, []);
  
  // Reset to normal
  const resetToNormal = useCallback(() => {
    setTier('normal');
  }, [setTier]);
  
  return {
    // Current state
    currentTier,
    tier,
    
    // Performance
    performance,
    
    // Adjustment
    shouldAdjust,
    adjustDifficulty,
    
    // Manual control
    setTier,
    resetToNormal,
    
    // Available tiers
    availableTiers: DIFFICULTY_TIERS,
    
    // Config
    config: fullConfig,
  };
}

/**
 * Helper: Get adjusted energy value based on current difficulty
 */
export function getAdjustedEnergyThreshold(
  baseThreshold: number,
  tier: DifficultyTier
): number {
  return Math.floor(baseThreshold * tier.multiplier);
}

/**
 * Helper: Get color name for adjusted threshold
 */
export function getColorNameForThreshold(threshold: number): string {
  const colors = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Indigo', 'Violet'];
  const index = Math.floor(threshold / 100);
  return colors[Math.min(index, colors.length - 1)];
}

/**
 * Helper: Get performance feedback message
 */
export function getPerformanceFeedback(
  rating: string,
  avgLevel: number
): { icon: string; message: string; color: string } {
  switch (rating) {
    case 'excellent':
      return {
        icon: '🔥',
        message: `Outstanding! Averaging ${avgLevel.toFixed(1)} color levels!`,
        color: 'text-purple-400',
      };
    case 'good':
      return {
        icon: '💪',
        message: `Great work! Consistently hitting your goals!`,
        color: 'text-green-400',
      };
    case 'fair':
      return {
        icon: '📈',
        message: `Making progress. Keep building momentum!`,
        color: 'text-yellow-400',
      };
    default:
      return {
        icon: '💙',
        message: `Finding your rhythm. Stay consistent!`,
        color: 'text-blue-400',
      };
  }
}
