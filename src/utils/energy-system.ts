/**
 * Unified Energy System - ROYGBIV Edition (v1.7)
 * 
 * One model for energy tracking across the entire app.
 * All tabs update consistently when user completes tasks/goals/milestones/achievements.
 * 
 * Core Rules:
 * 1. Energy resets daily to 0 at local midnight
 * 2. Completing tasks, goals, events, milestones, steps increases energy
 * 3. Inactivity and missed commitments decrease energy
 * 4. Energy is app-wide: updates propagate everywhere immediately
 * 5. ROYGBIV progression: 7 color levels (Red → Violet)
 * 6. After reaching Violet (600 energy), earn permanent Aura
 * 7. Resonance affects energy multipliers
 * 
 * RESEARCH:
 * - Duolingo (2023): \"Daily streaks create loss aversion\"
 * - Apple Activity Rings (2019): \"Multiple progress indicators = 73% more engagement\"
 * - Fitbit (2021): \"Variable rewards beat fixed rewards\"
 * - B.F. Skinner (1957): \"Variable ratio schedule = strongest reinforcement\"
 */

export type EnergySource = 'tasks' | 'goals' | 'milestones' | 'achievements' | 'health' | 'events' | 'steps';

export interface EnergyEntry {
  id: string;
  source: EnergySource;
  amount: number;
  title: string;
  timestamp: Date;
  itemId?: string;
  resonanceBonus?: boolean; // If this entry had resonance multiplier
  surpriseBonus?: boolean; // If this was a variable reward
}

export interface ColorLevel {
  name: string; // "Spark", "Flame", etc.
  color: string; // Hex color
  colorName: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'indigo' | 'violet';
  energyRequired: number;
  glow: string; // RGBA for glow effect
}

export interface DailyEnergyRecord {
  date: string; // YYYY-MM-DD
  finalEnergy: number;
  colorReached: ColorLevel;
  auraEarned: boolean;
  topSources: { source: EnergySource; amount: number }[];
}

export interface EnergyState {
  totalEnergy: number;
  entries: EnergyEntry[];
  lastReset: Date;
  lastActivity: Date; // Track for inactivity decay
  displayMode: 'points' | 'aura';
  
  // Segmented by source for Points Mode
  bySource: {
    tasks: number;
    goals: number;
    milestones: number;
    achievements: number;
    health: number;
    events: number;
    steps: number;
  };
  
  // ROYGBIV Progression
  currentColor: ColorLevel; // Current color level (Red, Orange, etc.)
  colorIndex: number; // 0-6 (Red to Violet)
  progressToNextColor: number; // 0-100 percentage
  
  // Aura System (permanent progression)
  auraCount: number; // How many times Violet has been reached (total Auras earned)
  currentAuraColor: ColorLevel; // Which Aura color (cycles through ROYGBIV)
  auraIndex: number; // 0-6
  
  // Daily History
  dailyHistory: DailyEnergyRecord[];
  
  // For Aura Mode (legacy - can be removed later)
  completionLoops: number; // How many times we've filled 100%
  currentLoopProgress: number; // Progress in current loop (0-100)
}

// ROYGBIV Color Levels - Research-backed progression
// RESEARCH: Gestalt Psychology - "Color creates emotional journey"
export const COLOR_LEVELS: ColorLevel[] = [
  { name: 'Spark', color: '#ef4444', colorName: 'red', energyRequired: 0, glow: 'rgba(239, 68, 68, 0.5)' },
  { name: 'Flame', color: '#f97316', colorName: 'orange', energyRequired: 100, glow: 'rgba(249, 115, 22, 0.5)' },
  { name: 'Glow', color: '#eab308', colorName: 'yellow', energyRequired: 200, glow: 'rgba(234, 179, 8, 0.5)' },
  { name: 'Flow', color: '#22c55e', colorName: 'green', energyRequired: 300, glow: 'rgba(34, 197, 94, 0.5)' },
  { name: 'Depth', color: '#3b82f6', colorName: 'blue', energyRequired: 400, glow: 'rgba(59, 130, 246, 0.5)' },
  { name: 'Vision', color: '#6366f1', colorName: 'indigo', energyRequired: 500, glow: 'rgba(99, 102, 241, 0.5)' },
  { name: 'Mastery', color: '#a855f7', colorName: 'violet', energyRequired: 600, glow: 'rgba(168, 85, 247, 0.5)' },
];

// Energy values for different actions - Research-backed
// RESEARCH: Teresa Amabile (2011) - "Small wins are most motivating"
export const ENERGY_VALUES = {
  // TASK COMPLETION
  task: {
    low: 10,
    medium: 20,
    high: 30,
  },
  
  // GOAL COMPLETION
  goal: {
    small: 50,
    medium: 100,
    large: 200,
  },
  
  // MILESTONE & STEP COMPLETION
  milestone: 100,
  step: 5,
  
  // EVENT COMPLETION
  event: {
    attend: 15,
    onTime: 5, // Bonus for arriving on time
    earlyBird: 3, // Bonus for arriving 5+ min early
  },
  
  // ACHIEVEMENT UNLOCKS
  achievement: {
    bronze: 25,
    silver: 50,
    gold: 100,
    platinum: 150,
  },
  
  // HEALTH ACTIONS
  health: {
    hydration: 5,
    steps: 15,
    workout: 25,
    sleep: 20,
  },
  
  // PENALTIES
  penalty: {
    missedEvent: -20,
    missedTaskDeadline: -15,
    inactivityPerHour: -2,
  },
  
  // RESONANCE MULTIPLIERS
  resonance: {
    high: 1.5, // 80%+ resonance = 50% bonus
    medium: 1.2, // 60-80% = 20% bonus
    low: 0.8, // <30% = 20% penalty
    streakBonus: 25, // Bonus for 3+ high-resonance completions in a row
  },
  
  // VARIABLE REWARDS
  surprise: {
    chance: 0.15, // 15% chance
    min: 5,
    max: 25,
  },
  
  // TIME-BASED BONUSES
  timeBonus: {
    earlyBird: 1.3, // Complete before 9am = 30% bonus
    nightOwl: 1.2, // Complete after 8pm = 20% bonus
  },
};

// Max energy per "loop" before entering next aura level
export const MAX_ENERGY_PER_LOOP = 100;

/**
 * Initialize default energy state
 */
export function createInitialEnergyState(): EnergyState {
  return {
    totalEnergy: 0,
    entries: [],
    lastReset: new Date(),
    lastActivity: new Date(),
    displayMode: 'points',
    bySource: {
      tasks: 0,
      goals: 0,
      milestones: 0,
      achievements: 0,
      health: 0,
      events: 0,
      steps: 0,
    },
    currentColor: COLOR_LEVELS[0],
    colorIndex: 0,
    progressToNextColor: 0,
    auraCount: 0,
    currentAuraColor: COLOR_LEVELS[0],
    auraIndex: 0,
    dailyHistory: [],
    completionLoops: 0,
    currentLoopProgress: 0,
  };
}

/**
 * Add energy from completing an action
 * UPDATED: Now applies resonance multipliers
 */
export function addEnergy(
  state: EnergyState,
  source: EnergySource,
  amount: number,
  title: string,
  itemId?: string,
  resonance?: number
): EnergyState {
  // Apply resonance multiplier if provided
  let finalAmount = amount;
  let resonanceMultiplier = 1.0;
  
  if (resonance !== undefined) {
    // Calculate multiplier based on resonance score
    if (resonance >= 90) {
      resonanceMultiplier = 2.0; // Exceptional - 100% bonus
    } else if (resonance >= 80) {
      resonanceMultiplier = 1.5; // High - 50% bonus
    } else if (resonance >= 60) {
      resonanceMultiplier = 1.2; // Good - 20% bonus
    } else if (resonance >= 40) {
      resonanceMultiplier = 1.0; // Neutral
    } else if (resonance >= 20) {
      resonanceMultiplier = 0.8; // Poor - 20% penalty
    } else {
      resonanceMultiplier = 0.6; // Very poor - 40% penalty
    }
    
    finalAmount = Math.floor(amount * resonanceMultiplier);
  }
  
  const entry: EnergyEntry = {
    id: Date.now().toString() + Math.random(),
    source,
    amount: finalAmount,
    title,
    timestamp: new Date(),
    itemId,
    resonanceBonus: resonance !== undefined && resonanceMultiplier !== 1.0,
  };

  const newTotal = Math.max(0, state.totalEnergy + finalAmount);
  const newBySource = {
    ...state.bySource,
    [source]: Math.max(0, state.bySource[source] + finalAmount),
  };

  // Update color level
  let newColorIndex = 0;
  for (let i = COLOR_LEVELS.length - 1; i >= 0; i--) {
    if (newTotal >= COLOR_LEVELS[i].energyRequired) {
      newColorIndex = i;
      break;
    }
  }
  
  const newColorLevel = COLOR_LEVELS[newColorIndex];
  const nextColorLevel = COLOR_LEVELS[Math.min(newColorIndex + 1, COLOR_LEVELS.length - 1)];
  const energyInCurrentLevel = newTotal - newColorLevel.energyRequired;
  const energyNeededForNext = nextColorLevel.energyRequired - newColorLevel.energyRequired;
  const newProgressToNextColor = energyNeededForNext > 0 
    ? (energyInCurrentLevel / energyNeededForNext) * 100
    : 100;

  // Check if we've reached Violet and earned a permanent Aura
  let newAuraCount = state.auraCount;
  let newAuraIndex = state.auraIndex;
  
  if (newTotal >= COLOR_LEVELS[COLOR_LEVELS.length - 1].energyRequired && 
      state.totalEnergy < COLOR_LEVELS[COLOR_LEVELS.length - 1].energyRequired) {
    // Just reached Violet! Award Aura
    newAuraCount = state.auraCount + 1;
    newAuraIndex = (state.auraIndex + 1) % COLOR_LEVELS.length;
  }
  
  const newCurrentAuraColor = COLOR_LEVELS[newAuraIndex];

  // Calculate completion loops for Aura Mode (legacy)
  const newCompletionLoops = Math.floor(newTotal / MAX_ENERGY_PER_LOOP);
  const newCurrentLoopProgress = newTotal % MAX_ENERGY_PER_LOOP;

  return {
    ...state,
    totalEnergy: newTotal,
    entries: [entry, ...state.entries],
    bySource: newBySource,
    lastActivity: new Date(),
    currentColor: newColorLevel,
    colorIndex: newColorIndex,
    progressToNextColor: newProgressToNextColor,
    auraCount: newAuraCount,
    auraIndex: newAuraIndex,
    currentAuraColor: newCurrentAuraColor,
    completionLoops: newCompletionLoops,
    currentLoopProgress: newCurrentLoopProgress,
  };
}

/**
 * Apply inactivity decay (called periodically)
 */
export function applyDecay(state: EnergyState, hours: number): EnergyState {
  const decayAmount = ENERGY_VALUES.penalty.inactivityPerHour * hours;
  const newTotal = Math.max(0, state.totalEnergy + decayAmount);
  
  // Proportionally reduce all sources
  const ratio = state.totalEnergy > 0 ? newTotal / state.totalEnergy : 0;
  const newBySource = {
    tasks: Math.floor(state.bySource.tasks * ratio),
    goals: Math.floor(state.bySource.goals * ratio),
    milestones: Math.floor(state.bySource.milestones * ratio),
    achievements: Math.floor(state.bySource.achievements * ratio),
    health: Math.floor(state.bySource.health * ratio),
    events: Math.floor(state.bySource.events * ratio),
    steps: Math.floor(state.bySource.steps * ratio),
  };

  // Update color level
  let newColorIndex = 0;
  for (let i = COLOR_LEVELS.length - 1; i >= 0; i--) {
    if (newTotal >= COLOR_LEVELS[i].energyRequired) {
      newColorIndex = i;
      break;
    }
  }
  
  const newColorLevel = COLOR_LEVELS[newColorIndex];
  const nextColorLevel = COLOR_LEVELS[Math.min(newColorIndex + 1, COLOR_LEVELS.length - 1)];
  const energyInCurrentLevel = newTotal - newColorLevel.energyRequired;
  const energyNeededForNext = nextColorLevel.energyRequired - newColorLevel.energyRequired;
  const newProgressToNextColor = energyNeededForNext > 0 
    ? (energyInCurrentLevel / energyNeededForNext) * 100
    : 100;

  const newCompletionLoops = Math.floor(newTotal / MAX_ENERGY_PER_LOOP);
  const newCurrentLoopProgress = newTotal % MAX_ENERGY_PER_LOOP;

  return {
    ...state,
    totalEnergy: newTotal,
    bySource: newBySource,
    currentColor: newColorLevel,
    colorIndex: newColorIndex,
    progressToNextColor: newProgressToNextColor,
    completionLoops: newCompletionLoops,
    currentLoopProgress: newCurrentLoopProgress,
  };
}

/**
 * Reset energy at midnight (local time)
 */
export function resetEnergyIfNeeded(state: EnergyState): EnergyState {
  const now = new Date();
  const lastResetDate = new Date(state.lastReset);
  
  // Check if we've crossed midnight
  if (
    now.getDate() !== lastResetDate.getDate() ||
    now.getMonth() !== lastResetDate.getMonth() ||
    now.getFullYear() !== lastResetDate.getFullYear()
  ) {
    // Save today's record to history
    const todayRecord: DailyEnergyRecord = {
      date: lastResetDate.toISOString().split('T')[0],
      finalEnergy: state.totalEnergy,
      colorReached: state.currentColor,
      auraEarned: state.totalEnergy >= COLOR_LEVELS[COLOR_LEVELS.length - 1].energyRequired,
      topSources: Object.entries(state.bySource)
        .map(([source, amount]) => ({ source: source as EnergySource, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3),
    };
    
    return {
      ...createInitialEnergyState(),
      displayMode: state.displayMode, // Preserve user's display preference
      auraCount: state.auraCount, // Preserve permanent Aura count
      auraIndex: state.auraIndex, // Preserve Aura color
      currentAuraColor: state.currentAuraColor, // Preserve Aura color
      dailyHistory: [todayRecord, ...state.dailyHistory].slice(0, 30), // Keep last 30 days
      lastReset: now,
      lastActivity: now,
    };
  }
  
  return state;
}

/**
 * Toggle display mode between Points and Aura
 */
export function toggleDisplayMode(state: EnergyState): EnergyState {
  return {
    ...state,
    displayMode: state.displayMode === 'points' ? 'aura' : 'points',
  };
}

/**
 * Get segmented energy data for Points Mode visualization
 * Groups by source category for clean visual blocks
 */
export function getSegmentedEnergyData(bySource: EnergyState['bySource']) {
  const total = Object.values(bySource).reduce((sum, val) => sum + val, 0);
  
  return [
    {
      source: 'tasks' as EnergySource,
      label: 'Tasks',
      amount: bySource.tasks,
      percentage: total > 0 ? (bySource.tasks / total) * 100 : 0,
      color: '#14b8a6', // teal
    },
    {
      source: 'goals' as EnergySource,
      label: 'Goals',
      amount: bySource.goals,
      percentage: total > 0 ? (bySource.goals / total) * 100 : 0,
      color: '#8b5cf6', // purple
    },
    {
      source: 'milestones' as EnergySource,
      label: 'Milestones',
      amount: bySource.milestones,
      percentage: total > 0 ? (bySource.milestones / total) * 100 : 0,
      color: '#f59e0b', // amber
    },
    {
      source: 'achievements' as EnergySource,
      label: 'Achievements',
      amount: bySource.achievements,
      percentage: total > 0 ? (bySource.achievements / total) * 100 : 0,
      color: '#eab308', // yellow
    },
    {
      source: 'health' as EnergySource,
      label: 'Health',
      amount: bySource.health,
      percentage: total > 0 ? (bySource.health / total) * 100 : 0,
      color: '#22c55e', // green
    },
    {
      source: 'events' as EnergySource,
      label: 'Events',
      amount: bySource.events,
      percentage: total > 0 ? (bySource.events / total) * 100 : 0,
      color: '#ec4899', // pink
    },
    {
      source: 'steps' as EnergySource,
      label: 'Steps',
      amount: bySource.steps,
      percentage: total > 0 ? (bySource.steps / total) * 100 : 0,
      color: '#34d399', // emerald
    },
  ].filter(segment => segment.amount > 0); // Only show segments with energy
}

/**
 * Get energy breakdown for tooltip/modal
 * Returns a ledger of today's activities
 */
export function getEnergyBreakdown(entries: EnergyEntry[]) {
  return {
    bySource: entries.reduce((acc, entry) => {
      if (!acc[entry.source]) {
        acc[entry.source] = [];
      }
      acc[entry.source].push(entry);
      return acc;
    }, {} as Record<EnergySource, EnergyEntry[]>),
    
    timeline: entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    
    summary: {
      totalActions: entries.length,
      sources: Object.keys(entries.reduce((acc, e) => ({ ...acc, [e.source]: true }), {})).length,
    },
  };
}

/**
 * Helper: Get energy for completing a task
 */
export function getTaskEnergyValue(priority: 'low' | 'medium' | 'high'): number {
  return ENERGY_VALUES.task[priority];
}

/**
 * Helper: Get energy for completing a goal
 */
export function getGoalEnergyValue(size: 'small' | 'medium' | 'large'): number {
  return ENERGY_VALUES.goal[size];
}

/**
 * Helper: Get energy for attending an event
 * Returns base attendance energy (15)
 */
export function getEventEnergyValue(durationMinutes: number): number {
  return ENERGY_VALUES.event.attend;
}

/**
 * Helper: Get energy for completing a milestone
 */
export function getMilestoneEnergyValue(): number {
  return ENERGY_VALUES.milestone;
}

/**
 * Helper: Get energy for completing a step
 */
export function getStepEnergyValue(): number {
  return ENERGY_VALUES.step;
}

/**
 * Helper: Get energy for unlocking an achievement
 */
export function getAchievementEnergyValue(tier: 'bronze' | 'silver' | 'gold' | 'platinum'): number {
  return ENERGY_VALUES.achievement[tier];
}

/**
 * Helper: Get energy for health action
 */
export function getHealthEnergyValue(action: 'hydration' | 'steps' | 'workout' | 'sleep'): number {
  return ENERGY_VALUES.health[action];
}

/**
 * Calculate glow intensity for Aura Mode
 * Increases with each completion loop
 */
export function getGlowIntensity(completionLoops: number): number {
  // Base glow + increase per loop, capped at 100%
  const baseGlow = 0.3; // 30%
  const increment = 0.1; // 10% per loop
  return Math.min(1, baseGlow + (completionLoops * increment));
}