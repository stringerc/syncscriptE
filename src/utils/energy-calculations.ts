/**
 * ENERGY CALCULATIONS - Helper Functions
 * 
 * Research-backed calculation logic for the energy system.
 * Handles resonance multipliers, variable rewards, time bonuses, and penalties.
 * 
 * RESEARCH:
 * - B.F. Skinner (1957): "Variable ratio schedule = strongest reinforcement"
 * - Fitbit (2021): "Variable rewards beat fixed rewards by 61%"
 * - Teresa Amabile (2011): "Small wins are most motivating force"
 */

import { ENERGY_VALUES, COLOR_LEVELS, ColorLevel, EnergyState } from './energy-system';

/**
 * Calculate energy gain with all bonuses and multipliers
 */
export interface EnergyCalculationOptions {
  baseEnergy: number;
  resonance?: number;
  isEarlyMorning?: boolean; // Before 9am
  isLateEvening?: boolean; // After 8pm
  allowVariableReward?: boolean;
}

export interface EnergyCalculationResult {
  finalEnergy: number;
  baseEnergy: number;
  resonanceBonus: number;
  resonanceMultiplier: number;
  timeBonus: number;
  surpriseBonus: number;
  hadSurprise: boolean;
  bonusMessages: string[];
}

/**
 * Calculate task energy with all bonuses
 */
export function calculateTaskEnergy(
  priority: 'low' | 'medium' | 'high' | 'urgent',
  options: Omit<EnergyCalculationOptions, 'baseEnergy'> = {}
): EnergyCalculationResult {
  const baseEnergy = ENERGY_VALUES.task[priority];
  return calculateEnergy({ ...options, baseEnergy });
}

/**
 * Calculate milestone energy
 * Milestones are major achievements that deserve significant energy
 */
export function calculateMilestoneEnergy(
  options: Omit<EnergyCalculationOptions, 'baseEnergy'> = {}
): EnergyCalculationResult {
  const baseEnergy = ENERGY_VALUES.milestone;
  return calculateEnergy({ ...options, baseEnergy });
}

/**
 * Calculate step energy (mini-tasks within milestones)
 * Steps are smaller than tasks, so they award less energy
 */
export function calculateStepEnergy(
  options: Omit<EnergyCalculationOptions, 'baseEnergy'> = {}
): EnergyCalculationResult {
  const baseEnergy = ENERGY_VALUES.step;
  return calculateEnergy({ ...options, baseEnergy });
}

/**
 * Calculate event energy with attendance bonuses
 */
export function calculateEventEnergy(
  attended: boolean,
  minutesLate: number,
  resonance?: number
): EnergyCalculationResult {
  let baseEnergy = attended ? ENERGY_VALUES.event.attend : 0;
  
  // On-time bonus
  if (attended && minutesLate <= 0) {
    baseEnergy += ENERGY_VALUES.event.onTime;
  }
  
  // Early bird bonus (5+ min early)
  if (attended && minutesLate <= -5) {
    baseEnergy += ENERGY_VALUES.event.earlyBird;
  }
  
  return calculateEnergy({ 
    baseEnergy, 
    resonance,
    allowVariableReward: attended,
  });
}

/**
 * Master calculation function
 * Applies all bonuses: resonance, time-based, variable rewards
 */
export function calculateEnergy(options: EnergyCalculationOptions): EnergyCalculationResult {
  const {
    baseEnergy,
    resonance,
    isEarlyMorning = false,
    isLateEvening = false,
    allowVariableReward = true,
  } = options;
  
  let energy = baseEnergy;
  const bonusMessages: string[] = [];
  
  // 1. Resonance Multiplier
  let resonanceMultiplier = 1.0;
  let resonanceBonus = 0;
  
  if (resonance !== undefined) {
    if (resonance >= 80) {
      resonanceMultiplier = ENERGY_VALUES.resonance.high;
      bonusMessages.push('🎵 High resonance! +50% energy');
    } else if (resonance >= 60) {
      resonanceMultiplier = ENERGY_VALUES.resonance.medium;
      bonusMessages.push('🎵 Good resonance! +20% energy');
    } else if (resonance < 30) {
      resonanceMultiplier = ENERGY_VALUES.resonance.low;
      bonusMessages.push('⚠️ Low resonance. -20% energy');
    }
    
    resonanceBonus = Math.floor(baseEnergy * (resonanceMultiplier - 1));
    energy = Math.floor(baseEnergy * resonanceMultiplier);
  }
  
  // 2. Time-based Bonuses
  let timeBonus = 0;
  
  if (isEarlyMorning) {
    const bonus = Math.floor(energy * (ENERGY_VALUES.timeBonus.earlyBird - 1));
    timeBonus += bonus;
    bonusMessages.push('🌅 Early bird! +30% energy');
  } else if (isLateEvening) {
    const bonus = Math.floor(energy * (ENERGY_VALUES.timeBonus.nightOwl - 1));
    timeBonus += bonus;
    bonusMessages.push('🌙 Night owl! +20% energy');
  }
  
  energy += timeBonus;
  
  // 3. Variable Reward (surprise bonus)
  let surpriseBonus = 0;
  let hadSurprise = false;
  
  if (allowVariableReward && Math.random() < ENERGY_VALUES.surprise.chance) {
    surpriseBonus = Math.floor(
      Math.random() * (ENERGY_VALUES.surprise.max - ENERGY_VALUES.surprise.min + 1) +
      ENERGY_VALUES.surprise.min
    );
    energy += surpriseBonus;
    hadSurprise = true;
    bonusMessages.push(`✨ Surprise bonus! +${surpriseBonus} energy`);
  }
  
  return {
    finalEnergy: Math.floor(energy),
    baseEnergy,
    resonanceBonus,
    resonanceMultiplier,
    timeBonus,
    surpriseBonus,
    hadSurprise,
    bonusMessages,
  };
}

/**
 * Update ROYGBIV color level based on total energy
 */
export function updateColorLevel(
  currentState: EnergyState,
  newTotal: number
): {
  colorIndex: number;
  currentColor: ColorLevel;
  progressToNextColor: number;
  auraCount: number;
  auraIndex: number;
  currentAuraColor: ColorLevel;
} {
  // Find current color level
  let newColorIndex = 0;
  for (let i = COLOR_LEVELS.length - 1; i >= 0; i--) {
    if (newTotal >= COLOR_LEVELS[i].energyRequired) {
      newColorIndex = i;
      break;
    }
  }
  
  const newColorLevel = COLOR_LEVELS[newColorIndex];
  const nextColorLevel = COLOR_LEVELS[Math.min(newColorIndex + 1, COLOR_LEVELS.length - 1)];
  
  // Calculate progress to next color
  const energyInCurrentLevel = newTotal - newColorLevel.energyRequired;
  const energyNeededForNext = nextColorLevel.energyRequired - newColorLevel.energyRequired;
  const newProgressToNextColor = energyNeededForNext > 0 
    ? (energyInCurrentLevel / energyNeededForNext) * 100
    : 100;

  // Check if we've reached Violet and earned a permanent Aura
  let newAuraCount = currentState.auraCount;
  let newAuraIndex = currentState.auraIndex;
  
  if (newTotal >= COLOR_LEVELS[COLOR_LEVELS.length - 1].energyRequired && 
      currentState.totalEnergy < COLOR_LEVELS[COLOR_LEVELS.length - 1].energyRequired) {
    // Just reached Violet! Award Aura
    newAuraCount = currentState.auraCount + 1;
    newAuraIndex = (currentState.auraIndex + 1) % COLOR_LEVELS.length;
  }
  
  const newCurrentAuraColor = COLOR_LEVELS[newAuraIndex];
  
  return {
    colorIndex: newColorIndex,
    currentColor: newColorLevel,
    progressToNextColor: newProgressToNextColor,
    auraCount: newAuraCount,
    auraIndex: newAuraIndex,
    currentAuraColor: newCurrentAuraColor,
  };
}

/**
 * Check for resonance streak bonus
 * Awards bonus if user completes 3+ high-resonance items in a row
 */
export function checkResonanceStreak(recentEntries: Array<{ resonance?: number }>): {
  hasStreak: boolean;
  streakLength: number;
  bonus: number;
} {
  let streakLength = 0;
  
  for (let i = 0; i < Math.min(recentEntries.length, 10); i++) {
    const entry = recentEntries[i];
    if (entry.resonance && entry.resonance >= 80) {
      streakLength++;
    } else {
      break;
    }
  }
  
  const hasStreak = streakLength >= 3;
  const bonus = hasStreak ? ENERGY_VALUES.resonance.streakBonus : 0;
  
  return { hasStreak, streakLength, bonus };
}

/**
 * Calculate energy penalty for missed commitment
 */
export function calculatePenalty(type: 'missedEvent' | 'missedTaskDeadline'): number {
  return ENERGY_VALUES.penalty[type];
}

/**
 * Predict end-of-day energy based on current trajectory
 */
export function predictEndOfDayEnergy(
  currentEnergy: number,
  currentHour: number,
  avgEnergyPerHour: number
): {
  predicted: number;
  predictedColor: ColorLevel;
  confidence: number;
} {
  const hoursRemaining = 24 - currentHour;
  const predictedGain = avgEnergyPerHour * hoursRemaining;
  const predicted = Math.floor(currentEnergy + predictedGain);
  
  // Find predicted color
  let predictedColorIndex = 0;
  for (let i = COLOR_LEVELS.length - 1; i >= 0; i--) {
    if (predicted >= COLOR_LEVELS[i].energyRequired) {
      predictedColorIndex = i;
      break;
    }
  }
  
  const predictedColor = COLOR_LEVELS[predictedColorIndex];
  
  // Simple confidence calculation (decreases with hours remaining)
  const confidence = Math.max(0.3, 1 - (hoursRemaining / 24) * 0.7);
  
  return { predicted, predictedColor, confidence };
}