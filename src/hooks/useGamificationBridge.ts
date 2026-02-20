/**
 * Gamification Bridge Hook
 * 
 * Connects ALL app events to the gamification system:
 * - Task completion → XP + Mastery + Quest progress + Streak
 * - Goal completion → XP + Achievement check + Celebration
 * - Energy thresholds → ROYGBIV achievement unlocks
 * - Resonance alignment → XP multiplier bonus
 * - Daily quest generation from real user data
 * 
 * RESEARCH:
 * - Self-Determination Theory (Deci & Ryan): Autonomy, Competence, Relatedness
 * - HEXAD gamification model: Different user types respond to different rewards
 * - Variable ratio reinforcement (Skinner): Random bonuses maintain engagement
 */

import { useCallback, useEffect, useRef } from 'react';
import { useGamification } from '../contexts/GamificationContext';
import { toast } from 'sonner';

// ============================================================================
// XP TABLES - Research-backed reward scaling
// ============================================================================

const TASK_XP = {
  low: 15,
  medium: 30,
  high: 50,
  urgent: 75,
} as const;

const GOAL_XP = {
  milestone_complete: 100,
  step_complete: 10,
  goal_complete_small: 200,
  goal_complete_medium: 500,
  goal_complete_large: 1000,
} as const;

const ENERGY_COLOR_XP = {
  orange: 50,
  yellow: 100,
  green: 200,
  blue: 350,
  indigo: 500,
  violet: 750,
} as const;

const STREAK_XP_BONUS = {
  3: 25,    // 3-day streak
  7: 75,    // Week warrior
  14: 150,  // Two-week champion
  30: 500,  // Monthly master
  60: 1000, // Discipline legend
  100: 2500, // Centurion
} as const;

// ============================================================================
// QUEST TEMPLATES - Generated from real user patterns
// ============================================================================

interface QuestTemplate {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'challenge';
  objectives: Array<{
    id: string;
    description: string;
    target: number;
    metric: 'tasks_completed' | 'high_priority_done' | 'resonance_above_80' | 'energy_logged' | 'goals_progressed' | 'streak_maintained';
  }>;
  xpReward: number;
  seasonXpReward: number;
}

const DAILY_QUEST_POOL: QuestTemplate[] = [
  {
    id: 'daily-complete-3',
    title: 'Task Triad',
    description: 'Complete 3 tasks today to build momentum',
    type: 'daily',
    objectives: [{ id: 'obj-1', description: 'Complete 3 tasks', target: 3, metric: 'tasks_completed' }],
    xpReward: 50,
    seasonXpReward: 15,
  },
  {
    id: 'daily-high-priority',
    title: 'Priority Striker',
    description: 'Tackle a high-priority task head on',
    type: 'daily',
    objectives: [{ id: 'obj-1', description: 'Complete 1 high-priority task', target: 1, metric: 'high_priority_done' }],
    xpReward: 40,
    seasonXpReward: 12,
  },
  {
    id: 'daily-resonance',
    title: 'In The Zone',
    description: 'Complete a task during a high-resonance window',
    type: 'daily',
    objectives: [{ id: 'obj-1', description: 'Complete task with 80%+ resonance', target: 1, metric: 'resonance_above_80' }],
    xpReward: 60,
    seasonXpReward: 20,
  },
  {
    id: 'daily-energy-log',
    title: 'Energy Awareness',
    description: 'Log your energy at least once today',
    type: 'daily',
    objectives: [{ id: 'obj-1', description: 'Log energy', target: 1, metric: 'energy_logged' }],
    xpReward: 25,
    seasonXpReward: 8,
  },
  {
    id: 'daily-goal-progress',
    title: 'Goal Getter',
    description: 'Make progress on at least one goal',
    type: 'daily',
    objectives: [{ id: 'obj-1', description: 'Update a goal\'s progress', target: 1, metric: 'goals_progressed' }],
    xpReward: 35,
    seasonXpReward: 10,
  },
];

const WEEKLY_QUEST_POOL: QuestTemplate[] = [
  {
    id: 'weekly-complete-15',
    title: 'Productivity Powerhouse',
    description: 'Complete 15 tasks this week',
    type: 'weekly',
    objectives: [{ id: 'obj-1', description: 'Complete 15 tasks', target: 15, metric: 'tasks_completed' }],
    xpReward: 200,
    seasonXpReward: 50,
  },
  {
    id: 'weekly-streak-7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day activity streak',
    type: 'weekly',
    objectives: [{ id: 'obj-1', description: 'Maintain 7-day streak', target: 7, metric: 'streak_maintained' }],
    xpReward: 250,
    seasonXpReward: 75,
  },
  {
    id: 'weekly-high-priority-5',
    title: 'Priority Commander',
    description: 'Complete 5 high-priority tasks this week',
    type: 'weekly',
    objectives: [{ id: 'obj-1', description: 'Complete 5 high-priority tasks', target: 5, metric: 'high_priority_done' }],
    xpReward: 175,
    seasonXpReward: 45,
  },
];

// ============================================================================
// ACHIEVEMENT DEFINITIONS
// ============================================================================

interface AchievementDef {
  id: string;
  title: string;
  description: string;
  metric: string;
  target: number;
  xpReward: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

const ACHIEVEMENT_DEFINITIONS: AchievementDef[] = [
  // Task milestones
  { id: 'tasks_10', title: 'Getting Started', description: 'Complete 10 tasks', metric: 'tasksCompleted', target: 10, xpReward: 50, tier: 'bronze' },
  { id: 'tasks_50', title: 'Productive Soul', description: 'Complete 50 tasks', metric: 'tasksCompleted', target: 50, xpReward: 150, tier: 'silver' },
  { id: 'tasks_100', title: 'Task Centurion', description: 'Complete 100 tasks', metric: 'tasksCompleted', target: 100, xpReward: 300, tier: 'gold' },
  { id: 'tasks_500', title: 'Task Legend', description: 'Complete 500 tasks', metric: 'tasksCompleted', target: 500, xpReward: 1000, tier: 'platinum' },
  { id: 'tasks_1000', title: 'Unstoppable Force', description: 'Complete 1000 tasks', metric: 'tasksCompleted', target: 1000, xpReward: 2500, tier: 'platinum' },
  
  // Streak milestones
  { id: 'streak_7', title: 'Week Warrior', description: 'Maintain a 7-day streak', metric: 'currentStreak', target: 7, xpReward: 75, tier: 'bronze' },
  { id: 'streak_14', title: 'Fortnight Fighter', description: 'Maintain a 14-day streak', metric: 'currentStreak', target: 14, xpReward: 150, tier: 'silver' },
  { id: 'streak_30', title: 'Monthly Master', description: 'Maintain a 30-day streak', metric: 'currentStreak', target: 30, xpReward: 500, tier: 'gold' },
  { id: 'streak_100', title: 'Centurion Streak', description: 'Maintain a 100-day streak', metric: 'currentStreak', target: 100, xpReward: 2000, tier: 'platinum' },
  
  // Quest milestones
  { id: 'quests_10', title: 'Quester', description: 'Complete 10 quests', metric: 'questsCompleted', target: 10, xpReward: 100, tier: 'bronze' },
  { id: 'quests_50', title: 'Quest Champion', description: 'Complete 50 quests', metric: 'questsCompleted', target: 50, xpReward: 300, tier: 'silver' },
  
  // Focus milestones
  { id: 'focus_100', title: 'Focus Apprentice', description: 'Log 100 focus hours', metric: 'focusHours', target: 100, xpReward: 200, tier: 'silver' },
  { id: 'focus_500', title: 'Focus Master', description: 'Log 500 focus hours', metric: 'focusHours', target: 500, xpReward: 1000, tier: 'platinum' },
];

// ============================================================================
// THE BRIDGE HOOK
// ============================================================================

export function useGamificationBridge() {
  const gamification = useGamification();
  const lastQuestRefresh = useRef<string>('');

  // ──────────────────────────────────────────────
  // TASK COMPLETION → XP + Mastery + Quest Progress
  // ──────────────────────────────────────────────
  const onTaskCompleted = useCallback((taskId: string, taskTitle: string, priority: string, resonance?: number) => {
    // 1. Award base XP (scaled by priority)
    const baseXP = TASK_XP[priority as keyof typeof TASK_XP] || TASK_XP.medium;
    
    // 2. Apply resonance multiplier to XP
    let resonanceMultiplier = 1.0;
    if (resonance !== undefined) {
      if (resonance >= 90) resonanceMultiplier = 1.5;
      else if (resonance >= 80) resonanceMultiplier = 1.3;
      else if (resonance >= 60) resonanceMultiplier = 1.1;
      else if (resonance < 40) resonanceMultiplier = 0.9;
    }
    
    const finalXP = Math.round(baseXP * resonanceMultiplier);
    const xpGain = gamification.earnXP(finalXP, `Task: ${taskTitle}`);
    
    // 3. Award mastery XP
    gamification.earnMasteryXP('task', Math.round(finalXP * 0.3), `Task: ${taskTitle}`);
    
    // 4. Award season XP
    gamification.earnSeasonXP(Math.round(finalXP * 0.2), `Task: ${taskTitle}`);
    
    // 5. Update streak
    updateStreak();
    
    // 6. Update quest progress
    updateQuestMetric('tasks_completed', 1);
    if (priority === 'high' || priority === 'urgent') {
      updateQuestMetric('high_priority_done', 1);
    }
    if (resonance !== undefined && resonance >= 80) {
      updateQuestMetric('resonance_above_80', 1);
    }
    
    // 7. Check task-based achievements
    checkAchievements();
    
    // 8. Variable ratio bonus (15% chance, Skinner reinforcement)
    if (Math.random() < 0.15) {
      const bonusXP = Math.floor(Math.random() * 20) + 10;
      gamification.earnXP(bonusXP, 'Surprise Bonus!');
      toast.success('Surprise Bonus! 🎁', {
        description: `+${bonusXP} bonus XP for being awesome!`,
        duration: 3000,
      });
    }
    
    return xpGain;
  }, [gamification]);

  // ──────────────────────────────────────────────
  // GOAL EVENTS → XP + Achievements
  // ──────────────────────────────────────────────
  const onGoalCompleted = useCallback((goalId: string, goalTitle: string, size: 'small' | 'medium' | 'large') => {
    const xpKey = `goal_complete_${size}` as keyof typeof GOAL_XP;
    const xp = GOAL_XP[xpKey] || GOAL_XP.goal_complete_medium;
    
    gamification.earnXP(xp, `Goal Complete: ${goalTitle}`);
    gamification.earnMasteryXP('task', Math.round(xp * 0.4), `Goal: ${goalTitle}`);
    gamification.earnSeasonXP(Math.round(xp * 0.3), `Goal: ${goalTitle}`);
    
    gamification.triggerCelebration('achievement', {
      title: 'Goal Completed!',
      description: goalTitle,
    });
    
    updateQuestMetric('goals_progressed', 1);
    checkAchievements();
  }, [gamification]);

  const onGoalProgressUpdated = useCallback((goalId: string, goalTitle: string, progress: number) => {
    if (progress > 0) {
      updateQuestMetric('goals_progressed', 1);
    }
    // Award small XP for progress updates
    gamification.earnXP(5, `Goal progress: ${goalTitle}`);
  }, [gamification]);

  const onMilestoneCompleted = useCallback((milestoneTitle: string) => {
    gamification.earnXP(GOAL_XP.milestone_complete, `Milestone: ${milestoneTitle}`);
    gamification.earnMasteryXP('task', 30, `Milestone: ${milestoneTitle}`);
    gamification.earnSeasonXP(25, `Milestone: ${milestoneTitle}`);
  }, [gamification]);

  const onStepCompleted = useCallback((stepTitle: string) => {
    gamification.earnXP(GOAL_XP.step_complete, `Step: ${stepTitle}`);
  }, [gamification]);

  // ──────────────────────────────────────────────
  // ENERGY COLOR THRESHOLDS → Achievements
  // ──────────────────────────────────────────────
  const onEnergyColorChanged = useCallback((newColor: string, previousColor: string) => {
    const colorXP = ENERGY_COLOR_XP[newColor as keyof typeof ENERGY_COLOR_XP];
    if (colorXP && newColor !== 'red') {
      gamification.earnXP(colorXP, `Energy level: ${newColor.charAt(0).toUpperCase() + newColor.slice(1)}`);
      gamification.earnMasteryXP('energy', Math.round(colorXP * 0.5), `Energy: ${newColor}`);
      
      gamification.triggerCelebration('achievement', {
        title: `${newColor.charAt(0).toUpperCase() + newColor.slice(1)} Energy Reached!`,
        description: `Your energy has ascended to ${newColor}`,
      });
    }
  }, [gamification]);

  const onEnergyLogged = useCallback(() => {
    updateQuestMetric('energy_logged', 1);
    gamification.earnXP(5, 'Energy logged');
    gamification.earnMasteryXP('energy', 5, 'Energy log');
  }, [gamification]);

  // ──────────────────────────────────────────────
  // STREAK MANAGEMENT
  // ──────────────────────────────────────────────
  const updateStreak = useCallback(() => {
    const today = new Date().toDateString();
    const lastActive = localStorage.getItem('syncscript_last_active_date');
    const currentStreak = gamification.profile.stats.currentStreak;
    
    if (lastActive === today) return; // Already counted today
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isConsecutive = lastActive === yesterday.toDateString();
    
    const newStreak = isConsecutive ? currentStreak + 1 : 1;
    const longestStreak = Math.max(newStreak, gamification.profile.stats.longestStreak);
    
    // Check streak milestones
    const streakBonuses = Object.entries(STREAK_XP_BONUS) as [string, number][];
    for (const [days, bonus] of streakBonuses) {
      if (newStreak === Number(days)) {
        gamification.earnXP(bonus, `${days}-day streak!`);
        toast.success(`🔥 ${days}-Day Streak!`, {
          description: `+${bonus} XP bonus! Keep it going!`,
          duration: 4000,
        });
        break;
      }
    }
    
    localStorage.setItem('syncscript_last_active_date', today);
  }, [gamification]);

  // ──────────────────────────────────────────────
  // QUEST PROGRESS
  // ──────────────────────────────────────────────
  const updateQuestMetric = useCallback((metric: string, increment: number) => {
    // Update progress on all active quests that track this metric
    const quests = gamification.activeQuests;
    for (const quest of quests) {
      for (const objective of quest.objectives) {
        if ((objective as any).metric === metric) {
          const newProgress = Math.min(objective.current + increment, objective.target);
          gamification.updateQuestProgress(quest.id, objective.id, newProgress);
        }
      }
    }
  }, [gamification]);

  // ──────────────────────────────────────────────
  // ACHIEVEMENT CHECKER
  // ──────────────────────────────────────────────
  const checkAchievements = useCallback(() => {
    const stats = gamification.profile.stats;
    const unlocked = gamification.profile.unlockedAchievements;
    
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      if (unlocked.includes(def.id)) continue;
      
      const currentValue = (stats as any)[def.metric];
      if (currentValue !== undefined && currentValue >= def.target) {
        // Achievement earned!
        gamification.checkAchievementProgress(def.id, def.target);
      }
    }
  }, [gamification]);

  // ──────────────────────────────────────────────
  // DAILY QUEST GENERATION
  // ──────────────────────────────────────────────
  const generateDailyQuests = useCallback(() => {
    const today = new Date().toDateString();
    if (lastQuestRefresh.current === today) return;
    lastQuestRefresh.current = today;
    
    const existingDaily = gamification.activeQuests.filter(q => q.type === 'daily');
    if (existingDaily.length >= 3) return; // Already have daily quests
    
    // Pick 3 random daily quests
    const shuffled = [...DAILY_QUEST_POOL].sort(() => Math.random() - 0.5);
    const selectedDaily = shuffled.slice(0, 3);
    
    // Pick 1 weekly quest if none active
    const existingWeekly = gamification.activeQuests.filter(q => q.type === 'weekly');
    const selectedWeekly = existingWeekly.length === 0 
      ? [WEEKLY_QUEST_POOL[Math.floor(Math.random() * WEEKLY_QUEST_POOL.length)]]
      : [];
    
    const newQuests = [...selectedDaily, ...selectedWeekly];
    
    // We can't directly add quests through the current context API,
    // but we can use acceptQuest if we populate the quest data first.
    // For now, store in localStorage and let the context pick them up.
    const questsToAdd = newQuests.map(template => ({
      id: `${template.id}-${Date.now()}`,
      title: template.title,
      description: template.description,
      type: template.type as any,
      difficulty: 'medium' as const,
      status: 'active' as const,
      progress: 0,
      objectives: template.objectives.map(obj => ({
        id: obj.id,
        description: obj.description,
        target: obj.target,
        current: 0,
        completed: false,
        metric: obj.metric,
      })),
      rewards: [
        { type: 'xp' as const, amount: template.xpReward },
        { type: 'seasonXp' as const, amount: template.seasonXpReward },
      ],
      timeLimit: template.type === 'daily' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + (template.type === 'daily' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000)),
      category: 'productivity' as any,
    }));
    
    // Store for the context to load
    try {
      const existingStored = localStorage.getItem('syncscript_quests_v1');
      const existing = existingStored ? JSON.parse(existingStored) : [];
      const combined = [...existing.filter((q: any) => q.status === 'active'), ...questsToAdd];
      localStorage.setItem('syncscript_quests_v1', JSON.stringify(combined));
    } catch (e) {
      console.error('[GamificationBridge] Failed to store quests:', e);
    }
    
    if (newQuests.length > 0) {
      toast.info('New Quests Available! ⚔️', {
        description: `${selectedDaily.length} daily + ${selectedWeekly.length} weekly quests ready`,
        duration: 4000,
      });
    }
  }, [gamification]);

  // Generate daily quests on mount
  useEffect(() => {
    generateDailyQuests();
  }, [generateDailyQuests]);

  return {
    onTaskCompleted,
    onGoalCompleted,
    onGoalProgressUpdated,
    onMilestoneCompleted,
    onStepCompleted,
    onEnergyColorChanged,
    onEnergyLogged,
    generateDailyQuests,
    checkAchievements,
  };
}
