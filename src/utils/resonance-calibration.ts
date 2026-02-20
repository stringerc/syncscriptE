/**
 * Resonance Self-Calibration System
 * 
 * Tracks actual user performance data and adjusts the resonance model
 * to become personalized over time.
 * 
 * RESEARCH BASIS:
 * - Mixed-effects cosinor framework (2025): Individual circadian offsets
 *   computed from longitudinal data reduce attenuation bias
 * - Smartphone-based circadian monitoring (Nature, 2026): Typing dynamics
 *   and app usage patterns infer circadian rhythms non-invasively
 * - Sleep phenotype study (2025, N=79,000): Individual chronotype,
 *   sleep quality, and social jetlag independently predict productivity
 * 
 * HOW IT WORKS:
 * 1. Every task completion records: time, duration, priority, resonance score
 * 2. After 10+ data points, the system identifies the user's ACTUAL peak hours
 * 3. The acrophase (peak time) shifts toward the user's real performance pattern
 * 4. Cognitive load thresholds adjust based on how the user handles multitasking
 * 5. Post-lunch dip severity is calibrated from afternoon completion patterns
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PerformanceDataPoint {
  timestamp: string;        // ISO string when task was completed
  hour: number;             // Hour of day (0-23)
  dayOfWeek: number;        // 0=Sunday, 6=Saturday
  taskPriority: string;     // 'low' | 'medium' | 'high' | 'urgent'
  taskEnergyLevel: string;  // 'low' | 'medium' | 'high'
  resonanceAtCompletion: number;  // What the engine predicted
  completionDuration?: number;    // Actual minutes to complete (if tracked)
  estimatedDuration?: number;     // Original estimate in minutes
  concurrentTasks: number;        // How many other tasks were active
  userRating?: number;            // Optional 1-5 "did this feel right?" rating
}

export interface CalibrationProfile {
  // Core circadian parameters (start with defaults, adapt over time)
  acrophase: number;        // Default 10.5, shifts based on data
  amplitude: number;        // Default 0.30, adjusts for individual variance
  mesor: number;            // Default 0.65, rarely changes
  
  // Individual adjustments
  postLunchDipSeverity: number;   // Default 0 (uses base model), range -0.2 to +0.2
  eveningBoost: number;           // Default 0, positive for evening types
  cognitiveLoadSensitivity: number; // Default 1.0, multiplier for load penalty
  
  // Confidence & metadata
  dataPointCount: number;
  lastCalibrated: string;   // ISO date
  calibrationVersion: number;
  confidenceLevel: 'low' | 'medium' | 'high'; // Based on data quantity
  
  // Derived insights
  bestHours: number[];      // Top 3 most productive hours
  worstHours: number[];     // Bottom 3 hours
  avgCompletionsByHour: Record<number, number>; // Completions per hour
  weekdayVsWeekend: {
    weekdayPeak: number;
    weekendPeak: number;
  };
}

// ============================================================================
// STORAGE
// ============================================================================

const PERFORMANCE_KEY = 'syncscript_performance_data_v1';
const CALIBRATION_KEY = 'syncscript_calibration_profile_v1';
const MAX_DATA_POINTS = 500; // Keep last 500 completions

function loadPerformanceData(): PerformanceDataPoint[] {
  try {
    const stored = localStorage.getItem(PERFORMANCE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('[Calibration] Failed to load performance data:', e);
  }
  return [];
}

function savePerformanceData(data: PerformanceDataPoint[]) {
  try {
    // Keep only the most recent data points
    const trimmed = data.slice(-MAX_DATA_POINTS);
    localStorage.setItem(PERFORMANCE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('[Calibration] Failed to save performance data:', e);
  }
}

function loadCalibrationProfile(): CalibrationProfile {
  try {
    const stored = localStorage.getItem(CALIBRATION_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('[Calibration] Failed to load calibration profile:', e);
  }
  return getDefaultProfile();
}

function saveCalibrationProfile(profile: CalibrationProfile) {
  try {
    localStorage.setItem(CALIBRATION_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('[Calibration] Failed to save calibration profile:', e);
  }
}

function getDefaultProfile(): CalibrationProfile {
  return {
    acrophase: 10.5,
    amplitude: 0.30,
    mesor: 0.65,
    postLunchDipSeverity: 0,
    eveningBoost: 0,
    cognitiveLoadSensitivity: 1.0,
    dataPointCount: 0,
    lastCalibrated: new Date().toISOString(),
    calibrationVersion: 1,
    confidenceLevel: 'low',
    bestHours: [9, 10, 11],
    worstHours: [13, 14, 3],
    avgCompletionsByHour: {},
    weekdayVsWeekend: {
      weekdayPeak: 10,
      weekendPeak: 11,
    },
  };
}

// ============================================================================
// DATA RECORDING
// ============================================================================

/**
 * Record a task completion for calibration purposes.
 * Called every time a task is marked as done.
 */
export function recordTaskCompletion(params: {
  taskPriority: string;
  taskEnergyLevel: string;
  resonanceAtCompletion: number;
  completionDuration?: number;
  estimatedDuration?: number;
  concurrentTasks: number;
}) {
  const now = new Date();
  const dataPoint: PerformanceDataPoint = {
    timestamp: now.toISOString(),
    hour: now.getHours(),
    dayOfWeek: now.getDay(),
    taskPriority: params.taskPriority,
    taskEnergyLevel: params.taskEnergyLevel,
    resonanceAtCompletion: params.resonanceAtCompletion,
    completionDuration: params.completionDuration,
    estimatedDuration: params.estimatedDuration,
    concurrentTasks: params.concurrentTasks,
  };
  
  const data = loadPerformanceData();
  data.push(dataPoint);
  savePerformanceData(data);
  
  // Re-calibrate if we have enough new data (every 10 completions)
  if (data.length % 10 === 0 && data.length >= 10) {
    recalibrate(data);
  }
}

/**
 * Record user feedback on timing quality.
 * Called when user rates "Did this feel like the right time?"
 */
export function recordTimingFeedback(rating: number) {
  const data = loadPerformanceData();
  if (data.length > 0) {
    data[data.length - 1].userRating = rating;
    savePerformanceData(data);
  }
}

// ============================================================================
// CALIBRATION ENGINE
// ============================================================================

/**
 * Main calibration function.
 * Analyzes accumulated performance data and adjusts the model.
 */
function recalibrate(data: PerformanceDataPoint[]) {
  const profile = loadCalibrationProfile();
  
  // 1. Calculate completions by hour
  const completionsByHour: Record<number, number> = {};
  const highPriorityByHour: Record<number, number> = {};
  
  for (let h = 0; h < 24; h++) {
    completionsByHour[h] = 0;
    highPriorityByHour[h] = 0;
  }
  
  for (const point of data) {
    completionsByHour[point.hour]++;
    if (point.taskPriority === 'high' || point.taskPriority === 'urgent') {
      highPriorityByHour[point.hour]++;
    }
  }
  
  // 2. Find actual peak hours (weighted by priority)
  const hourScores: Array<{ hour: number; score: number }> = [];
  for (let h = 6; h <= 22; h++) {
    // Weight: high-priority completions count 3x, normal count 1x
    const score = completionsByHour[h] + (highPriorityByHour[h] * 2);
    hourScores.push({ hour: h, score });
  }
  
  hourScores.sort((a, b) => b.score - a.score);
  
  const bestHours = hourScores.slice(0, 3).map(h => h.hour);
  const worstHours = hourScores.filter(h => h.score > 0).slice(-3).map(h => h.hour);
  
  // 3. Estimate actual acrophase from peak activity
  if (data.length >= 20) {
    // Weighted average of top-performing hours
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const { hour, score } of hourScores.slice(0, 5)) {
      if (score > 0) {
        weightedSum += hour * score;
        totalWeight += score;
      }
    }
    
    if (totalWeight > 0) {
      const estimatedPeak = weightedSum / totalWeight;
      
      // Gradual adaptation: move acrophase 20% toward estimated peak each calibration
      // This prevents wild swings from noisy data
      const LEARNING_RATE = 0.2;
      profile.acrophase = profile.acrophase + LEARNING_RATE * (estimatedPeak - profile.acrophase);
      
      // Clamp to reasonable range (6 AM to 6 PM)
      profile.acrophase = Math.max(6, Math.min(18, profile.acrophase));
    }
  }
  
  // 4. Detect post-lunch dip severity
  const morningCompletions = data.filter(p => p.hour >= 9 && p.hour <= 11).length;
  const lunchCompletions = data.filter(p => p.hour >= 13 && p.hour <= 14).length;
  
  if (morningCompletions > 5 && lunchCompletions > 0) {
    const dipRatio = lunchCompletions / morningCompletions;
    // If lunch completions are much lower than morning, dip is severe
    if (dipRatio < 0.3) {
      profile.postLunchDipSeverity = Math.min(0.15, profile.postLunchDipSeverity + 0.02);
    } else if (dipRatio > 0.7) {
      // User doesn't have a strong dip
      profile.postLunchDipSeverity = Math.max(-0.05, profile.postLunchDipSeverity - 0.02);
    }
  }
  
  // 5. Detect evening type tendency
  const eveningCompletions = data.filter(p => p.hour >= 17 && p.hour <= 21).length;
  if (data.length >= 20) {
    const eveningRatio = eveningCompletions / data.length;
    if (eveningRatio > 0.3) {
      profile.eveningBoost = Math.min(0.15, profile.eveningBoost + 0.02);
    } else {
      profile.eveningBoost = Math.max(0, profile.eveningBoost - 0.01);
    }
  }
  
  // 6. Calibrate cognitive load sensitivity
  const highConcurrencyCompletions = data.filter(p => p.concurrentTasks > 3);
  const lowConcurrencyCompletions = data.filter(p => p.concurrentTasks <= 2);
  
  if (highConcurrencyCompletions.length >= 5 && lowConcurrencyCompletions.length >= 5) {
    // If user completes many tasks even with high concurrency, they handle it well
    const ratio = highConcurrencyCompletions.length / lowConcurrencyCompletions.length;
    if (ratio > 0.5) {
      // Good multitasker - reduce cognitive load penalty
      profile.cognitiveLoadSensitivity = Math.max(0.5, profile.cognitiveLoadSensitivity - 0.05);
    } else {
      // Struggles with multitasking - increase penalty
      profile.cognitiveLoadSensitivity = Math.min(1.5, profile.cognitiveLoadSensitivity + 0.05);
    }
  }
  
  // 7. Weekday vs weekend peak detection
  const weekdayData = data.filter(p => p.dayOfWeek >= 1 && p.dayOfWeek <= 5);
  const weekendData = data.filter(p => p.dayOfWeek === 0 || p.dayOfWeek === 6);
  
  if (weekdayData.length >= 10) {
    const weekdayHours: Record<number, number> = {};
    weekdayData.forEach(p => { weekdayHours[p.hour] = (weekdayHours[p.hour] || 0) + 1; });
    const topWeekdayHour = Object.entries(weekdayHours).sort((a, b) => b[1] - a[1])[0];
    if (topWeekdayHour) profile.weekdayVsWeekend.weekdayPeak = parseInt(topWeekdayHour[0]);
  }
  
  if (weekendData.length >= 5) {
    const weekendHours: Record<number, number> = {};
    weekendData.forEach(p => { weekendHours[p.hour] = (weekendHours[p.hour] || 0) + 1; });
    const topWeekendHour = Object.entries(weekendHours).sort((a, b) => b[1] - a[1])[0];
    if (topWeekendHour) profile.weekdayVsWeekend.weekendPeak = parseInt(topWeekendHour[0]);
  }
  
  // 8. Update metadata
  profile.dataPointCount = data.length;
  profile.lastCalibrated = new Date().toISOString();
  profile.calibrationVersion++;
  profile.bestHours = bestHours;
  profile.worstHours = worstHours;
  profile.avgCompletionsByHour = completionsByHour;
  
  // Confidence level based on data quantity
  if (data.length >= 50) profile.confidenceLevel = 'high';
  else if (data.length >= 20) profile.confidenceLevel = 'medium';
  else profile.confidenceLevel = 'low';
  
  saveCalibrationProfile(profile);
  
  console.log(`[Calibration] Re-calibrated with ${data.length} data points. ` +
    `Acrophase: ${profile.acrophase.toFixed(1)}, ` +
    `Best hours: ${bestHours.join(', ')}, ` +
    `Confidence: ${profile.confidenceLevel}`);
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get the calibrated circadian curve for the current user.
 * Falls back to default model if insufficient data.
 */
export function getCalibratedCircadianCurve(hour: number): number {
  const profile = loadCalibrationProfile();
  
  if (profile.dataPointCount < 10) {
    // Not enough data yet, use default model
    return getDefaultCircadianCurve(hour);
  }
  
  // Calibrated cosinor model with personalized parameters
  const radians = (2 * Math.PI * (hour - profile.acrophase)) / 24;
  let value = profile.mesor + (profile.amplitude * Math.cos(radians));
  
  // Apply post-lunch dip adjustment
  if (hour >= 13 && hour <= 14) {
    value -= profile.postLunchDipSeverity;
  }
  
  // Apply evening boost for evening types
  if (hour >= 17 && hour <= 21) {
    value += profile.eveningBoost;
  }
  
  return Math.max(0.25, Math.min(0.98, value));
}

function getDefaultCircadianCurve(hour: number): number {
  const MESOR = 0.65;
  const AMPLITUDE = 0.30;
  const ACROPHASE = 10.5;
  const radians = (2 * Math.PI * (hour - ACROPHASE)) / 24;
  return Math.max(0.30, Math.min(0.95, MESOR + AMPLITUDE * Math.cos(radians)));
}

/**
 * Get the current calibration profile (for display in UI).
 */
export function getCalibrationProfile(): CalibrationProfile {
  return loadCalibrationProfile();
}

/**
 * Get calibrated cognitive load sensitivity.
 */
export function getCalibratedCognitiveLoadSensitivity(): number {
  return loadCalibrationProfile().cognitiveLoadSensitivity;
}

/**
 * Get insights from the calibration system for the user.
 */
export function getCalibrationInsights(): string[] {
  const profile = loadCalibrationProfile();
  const insights: string[] = [];
  
  if (profile.dataPointCount < 10) {
    insights.push('Keep completing tasks to help me learn your patterns. I need about 10 more completions.');
    return insights;
  }
  
  // Peak hour insight
  if (profile.bestHours.length > 0) {
    const formattedHours = profile.bestHours.map(h => {
      const period = h >= 12 ? 'PM' : 'AM';
      const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
      return `${displayHour}${period}`;
    });
    insights.push(`Your peak productivity hours are ${formattedHours.join(', ')}. Schedule your hardest tasks then.`);
  }
  
  // Acrophase drift insight
  if (Math.abs(profile.acrophase - 10.5) > 1) {
    if (profile.acrophase > 10.5) {
      insights.push(`You tend to peak later than average (around ${Math.round(profile.acrophase)}:00). I've adjusted your curve accordingly.`);
    } else {
      insights.push(`You're an early peaker (around ${Math.round(profile.acrophase)}:00). I've shifted your optimal windows earlier.`);
    }
  }
  
  // Post-lunch dip insight
  if (profile.postLunchDipSeverity > 0.08) {
    insights.push('You have a strong post-lunch energy dip. Consider lighter tasks or a short walk between 1-3 PM.');
  } else if (profile.postLunchDipSeverity < -0.02) {
    insights.push('You handle the afternoon well! Your post-lunch dip is minimal compared to most people.');
  }
  
  // Evening type insight
  if (profile.eveningBoost > 0.08) {
    insights.push('You show strong evening productivity. I\'ve boosted your resonance scores for 5-9 PM tasks.');
  }
  
  // Multitasking insight
  if (profile.cognitiveLoadSensitivity < 0.8) {
    insights.push('You handle task switching well. I\'ve reduced the cognitive load penalty in your score.');
  } else if (profile.cognitiveLoadSensitivity > 1.2) {
    insights.push('Deep focus works best for you. I recommend limiting concurrent tasks to 2-3 at a time.');
  }
  
  // Confidence level
  if (profile.confidenceLevel === 'high') {
    insights.push(`Calibration confidence: HIGH (${profile.dataPointCount} data points). Your personalized curve is well-tuned.`);
  } else if (profile.confidenceLevel === 'medium') {
    insights.push(`Calibration confidence: MEDIUM (${profile.dataPointCount} data points). Getting more accurate with each task you complete.`);
  }
  
  return insights;
}

/**
 * Force a manual recalibration (e.g., from settings page).
 */
export function forceRecalibrate() {
  const data = loadPerformanceData();
  if (data.length >= 10) {
    recalibrate(data);
    return true;
  }
  return false;
}

/**
 * Reset calibration to defaults (e.g., if user wants to start fresh).
 */
export function resetCalibration() {
  localStorage.removeItem(PERFORMANCE_KEY);
  localStorage.removeItem(CALIBRATION_KEY);
}
