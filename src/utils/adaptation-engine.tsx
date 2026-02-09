import { UserPreferences } from './user-preferences';

export interface AdaptableParam {
  name: string;
  description: string;
  type: 'number' | 'time' | 'text' | 'boolean';
  defaultValue: any;
  adaptedValue?: any;
  reason?: string;
}

export interface AdaptationResult {
  params: AdaptableParam[];
  overallExplanation: string;
  confidenceScore: number; // 0-100
}

/**
 * Rules-Based Adaptation Engine
 * Calculates personalized script parameters based on user preferences
 * No ML/AI needed - uses heuristic rules based on behavioral science
 */
export class AdaptationEngine {
  
  /**
   * Adapt a script's parameters to user preferences
   */
  static adaptScript(
    scriptParams: AdaptableParam[],
    userPrefs: UserPreferences,
    scriptCategory: string
  ): AdaptationResult {
    const adaptedParams: AdaptableParam[] = [];
    let totalAdaptations = 0;

    for (const param of scriptParams) {
      const adapted = this.adaptParameter(param, userPrefs, scriptCategory);
      if (adapted.adaptedValue !== adapted.defaultValue) {
        totalAdaptations++;
      }
      adaptedParams.push(adapted);
    }

    const confidenceScore = this.calculateConfidenceScore(userPrefs, totalAdaptations);
    const overallExplanation = this.generateOverallExplanation(userPrefs, totalAdaptations);

    return {
      params: adaptedParams,
      overallExplanation,
      confidenceScore
    };
  }

  /**
   * Adapt a single parameter based on user preferences
   */
  private static adaptParameter(
    param: AdaptableParam,
    userPrefs: UserPreferences,
    scriptCategory: string
  ): AdaptableParam {
    const paramName = param.name.toLowerCase();

    // Time-based adaptations
    if (param.type === 'time' || paramName.includes('time') || paramName.includes('start')) {
      return this.adaptTimeParameter(param, userPrefs);
    }

    // Duration/count adaptations
    if (paramName.includes('task') && paramName.includes('count')) {
      return this.adaptTaskCount(param, userPrefs);
    }

    if (paramName.includes('break') && paramName.includes('duration')) {
      return this.adaptBreakDuration(param, userPrefs);
    }

    if (paramName.includes('session') || paramName.includes('focus') || paramName.includes('duration')) {
      return this.adaptFocusDuration(param, userPrefs);
    }

    // Complexity adaptations
    if (paramName.includes('detail') || paramName.includes('complexity')) {
      return this.adaptComplexity(param, userPrefs);
    }

    // Default: no adaptation
    return { ...param, adaptedValue: param.defaultValue };
  }

  /**
   * Adapt timing parameters based on energy peaks
   */
  private static adaptTimeParameter(param: AdaptableParam, userPrefs: UserPreferences): AdaptableParam {
    const defaultTime = param.defaultValue as string;
    let adaptedTime = defaultTime;
    let reason = '';

    // Map energy peaks to preferred times
    const energyTimeMap = {
      'morning': '8:00 AM',
      'afternoon': '2:00 PM',
      'evening': '6:00 PM',
      'night': '9:00 PM'
    };

    // If default is morning but user peaks later
    if (defaultTime.includes('AM') && defaultTime < '11:00 AM') {
      if (userPrefs.peakEnergyTime === 'afternoon' || userPrefs.peakEnergyTime === 'evening') {
        adaptedTime = energyTimeMap[userPrefs.peakEnergyTime];
        reason = `Your peak energy is in the ${userPrefs.peakEnergyTime} - we moved this to match your natural rhythm`;
      }
    }

    // Use preferred start time if available
    if (paramName.includes('start') && userPrefs.preferredStartTime !== '9:00 AM') {
      adaptedTime = userPrefs.preferredStartTime;
      reason = `Aligned to your preferred work start time`;
    }

    return {
      ...param,
      adaptedValue: adaptedTime,
      reason: reason || undefined
    };
  }

  /**
   * Adapt task count based on completion speed
   */
  private static adaptTaskCount(param: AdaptableParam, userPrefs: UserPreferences): AdaptableParam {
    const defaultCount = param.defaultValue as number;
    let adaptedCount = defaultCount;
    let reason = '';

    // Adjust based on completion speed
    if (userPrefs.taskCompletionSpeed > 1.2) {
      adaptedCount = Math.ceil(defaultCount * 0.8); // Reduce by 20%
      const speedPercent = Math.round((userPrefs.taskCompletionSpeed - 1) * 100);
      reason = `You complete tasks ${speedPercent}% faster than average - streamlined for your pace`;
    } else if (userPrefs.taskCompletionSpeed < 0.8) {
      adaptedCount = Math.ceil(defaultCount * 1.2); // Increase by 20%
      reason = `Adjusted task load to match your preferred pace`;
    }

    // Also consider average tasks per day
    if (userPrefs.avgTasksPerDay < 6 && defaultCount > 8) {
      adaptedCount = Math.min(adaptedCount, 6);
      reason = `You typically handle ${userPrefs.avgTasksPerDay} tasks per day - we've optimized to prevent overload`;
    }

    return {
      ...param,
      adaptedValue: adaptedCount,
      reason: reason || undefined
    };
  }

  /**
   * Adapt break duration based on preferences
   */
  private static adaptBreakDuration(param: AdaptableParam, userPrefs: UserPreferences): AdaptableParam {
    const defaultDuration = param.defaultValue as number;
    let adaptedDuration = defaultDuration;
    let reason = '';

    if (userPrefs.prefersLongerBreaks) {
      adaptedDuration = Math.max(defaultDuration, userPrefs.breakDuration);
      reason = 'Your focus improves with slightly longer breaks';
    } else if (userPrefs.taskCompletionSpeed > 1.3) {
      adaptedDuration = Math.max(5, defaultDuration - 5);
      reason = 'Your fast pace suggests you prefer shorter, more frequent breaks';
    }

    return {
      ...param,
      adaptedValue: adaptedDuration,
      reason: reason || undefined
    };
  }

  /**
   * Adapt focus session duration
   */
  private static adaptFocusDuration(param: AdaptableParam, userPrefs: UserPreferences): AdaptableParam {
    const defaultDuration = param.defaultValue as number;
    let adaptedDuration = userPrefs.focusSessionDuration;
    let reason = '';

    if (userPrefs.focusSessionDuration !== 90) {
      if (userPrefs.focusSessionDuration > 90) {
        reason = 'Your data shows sustained focus for longer blocks - extended for better flow';
      } else {
        reason = 'Optimized for your preferred focus session length';
      }
    } else {
      adaptedDuration = defaultDuration;
    }

    return {
      ...param,
      adaptedValue: adaptedDuration,
      reason: reason || undefined
    };
  }

  /**
   * Adapt complexity based on user preferences
   */
  private static adaptComplexity(param: AdaptableParam, userPrefs: UserPreferences): AdaptableParam {
    const defaultValue = param.defaultValue;
    let adaptedValue = defaultValue;
    let reason = '';

    if (userPrefs.complexityPreference === 'simple' && defaultValue !== 'simple') {
      adaptedValue = 'simple';
      reason = 'Simplified based on your preference for streamlined workflows';
    } else if (userPrefs.complexityPreference === 'complex' && defaultValue === 'simple') {
      adaptedValue = 'detailed';
      reason = 'Enhanced with more detail to match your preference';
    }

    if (!userPrefs.likesDetailedPlans && defaultValue === 'detailed') {
      adaptedValue = 'overview';
      reason = 'Condensed to high-level overview based on your preference';
    }

    return {
      ...param,
      adaptedValue,
      reason: reason || undefined
    };
  }

  /**
   * Calculate confidence score for adaptations
   */
  private static calculateConfidenceScore(userPrefs: UserPreferences, adaptationCount: number): number {
    let score = 50; // Base score

    // Higher confidence if user has completed onboarding
    if (userPrefs.onboardingComplete) {
      score += 20;
    }

    // Higher confidence with more adaptations
    score += Math.min(adaptationCount * 5, 20);

    // Higher confidence if preferences are recent
    const daysSinceUpdate = this.getDaysSinceUpdate(userPrefs.lastUpdated);
    if (daysSinceUpdate < 7) {
      score += 10;
    }

    return Math.min(score, 95); // Cap at 95%
  }

  /**
   * Generate overall explanation for adaptations
   */
  private static generateOverallExplanation(userPrefs: UserPreferences, adaptationCount: number): string {
    if (adaptationCount === 0) {
      return 'This script already matches your preferences perfectly!';
    }

    const explanations = [
      `We've tuned ${adaptationCount} parameter${adaptationCount > 1 ? 's' : ''} to match your unique rhythm.`,
      `Based on your ${userPrefs.peakEnergyTime} energy peak, we've optimized the timing.`,
    ];

    if (userPrefs.taskCompletionSpeed > 1.2) {
      explanations.push('Your above-average pace means we can streamline the workflow.');
    } else if (userPrefs.taskCompletionSpeed < 0.8) {
      explanations.push('We\'ve added buffer time to match your thoughtful approach.');
    }

    if (userPrefs.prefersLongerBreaks) {
      explanations.push('Extended breaks will help you maintain peak focus.');
    }

    return explanations.join(' ');
  }

  /**
   * Helper: Calculate days since last update
   */
  private static getDaysSinceUpdate(lastUpdated: string): number {
    const now = new Date();
    const updated = new Date(lastUpdated);
    const diffTime = Math.abs(now.getTime() - updated.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
