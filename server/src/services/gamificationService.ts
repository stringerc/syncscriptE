import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface GamificationEvent {
  userId: string;
  type: 'task_completed' | 'task_created' | 'event_attended' | 'event_created' | 'streak_milestone' | 'achievement_unlocked';
  data?: any;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: (stats: any) => boolean;
}

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: (stats: any) => boolean;
}

// Achievement definitions
export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first_task',
    title: 'Getting Started',
    description: 'Complete your first task',
    points: 10,
    icon: '🎯',
    rarity: 'common',
    condition: (stats) => stats.tasksCompleted >= 1
  },
  {
    id: 'task_master_10',
    title: 'Task Master',
    description: 'Complete 10 tasks',
    points: 50,
    icon: '⭐',
    rarity: 'common',
    condition: (stats) => stats.tasksCompleted >= 10
  },
  {
    id: 'task_master_50',
    title: 'Productivity Pro',
    description: 'Complete 50 tasks',
    points: 200,
    icon: '🏆',
    rarity: 'rare',
    condition: (stats) => stats.tasksCompleted >= 50
  },
  {
    id: 'task_master_100',
    title: 'Task Legend',
    description: 'Complete 100 tasks',
    points: 500,
    icon: '👑',
    rarity: 'epic',
    condition: (stats) => stats.tasksCompleted >= 100
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    points: 100,
    icon: '🔥',
    rarity: 'rare',
    condition: (stats) => stats.currentStreak >= 7
  },
  {
    id: 'streak_30',
    title: 'Month Master',
    description: 'Maintain a 30-day streak',
    points: 500,
    icon: '💎',
    rarity: 'epic',
    condition: (stats) => stats.currentStreak >= 30
  },
  {
    id: 'streak_100',
    title: 'Century Champion',
    description: 'Maintain a 100-day streak',
    points: 1000,
    icon: '🌟',
    rarity: 'legendary',
    condition: (stats) => stats.currentStreak >= 100
  },
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Complete a task before 9 AM',
    points: 25,
    icon: '🐦',
    rarity: 'common',
    condition: (stats) => stats.earlyMorningTasks >= 1
  },
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Complete a task after 10 PM',
    points: 25,
    icon: '🦉',
    rarity: 'common',
    condition: (stats) => stats.lateNightTasks >= 1
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Complete a task in under 15 minutes',
    points: 30,
    icon: '⚡',
    rarity: 'common',
    condition: (stats) => stats.fastTasks >= 1
  },
  {
    id: 'marathon_runner',
    title: 'Marathon Runner',
    description: 'Complete a task that takes over 2 hours',
    points: 50,
    icon: '🏃',
    rarity: 'rare',
    condition: (stats) => stats.longTasks >= 1
  },
  {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Attend 10 events',
    points: 100,
    icon: '🦋',
    rarity: 'rare',
    condition: (stats) => stats.eventsAttended >= 10
  },
  {
    id: 'event_planner',
    title: 'Event Planner',
    description: 'Create 25 events',
    points: 150,
    icon: '📅',
    rarity: 'rare',
    condition: (stats) => stats.eventsCreated >= 25
  },
  {
    id: 'level_5',
    title: 'Rising Star',
    description: 'Reach level 5',
    points: 100,
    icon: '⭐',
    rarity: 'common',
    condition: (stats) => stats.currentLevel >= 5
  },
  {
    id: 'level_10',
    title: 'Expert',
    description: 'Reach level 10',
    points: 300,
    icon: '🎖️',
    rarity: 'rare',
    condition: (stats) => stats.currentLevel >= 10
  },
  {
    id: 'level_25',
    title: 'Master',
    description: 'Reach level 25',
    points: 750,
    icon: '🏅',
    rarity: 'epic',
    condition: (stats) => stats.currentLevel >= 25
  },
  {
    id: 'level_50',
    title: 'Legend',
    description: 'Reach level 50',
    points: 1500,
    icon: '👑',
    rarity: 'legendary',
    condition: (stats) => stats.currentLevel >= 50
  }
];

// Badge definitions
export const BADGES: BadgeDefinition[] = [
  {
    id: 'first_login',
    title: 'Welcome!',
    description: 'First time logging in',
    icon: '👋',
    rarity: 'common',
    condition: (stats) => stats.joinDate !== null
  },
  {
    id: 'daily_warrior',
    title: 'Daily Warrior',
    description: 'Complete tasks for 5 consecutive days',
    icon: '⚔️',
    rarity: 'rare',
    condition: (stats) => stats.currentStreak >= 5
  },
  {
    id: 'weekend_warrior',
    title: 'Weekend Warrior',
    description: 'Complete tasks on weekends',
    icon: '🏖️',
    rarity: 'common',
    condition: (stats) => stats.weekendTasks >= 1
  },
  {
    id: 'morning_person',
    title: 'Morning Person',
    description: 'Complete 10 tasks before noon',
    icon: '🌅',
    rarity: 'rare',
    condition: (stats) => stats.morningTasks >= 10
  },
  {
    id: 'night_shift',
    title: 'Night Shift',
    description: 'Complete 10 tasks after 8 PM',
    icon: '🌙',
    rarity: 'rare',
    condition: (stats) => stats.eveningTasks >= 10
  },
  {
    id: 'multitasker',
    title: 'Multitasker',
    description: 'Complete 5 tasks in one day',
    icon: '🎪',
    rarity: 'epic',
    condition: (stats) => stats.maxTasksInDay >= 5
  },
  {
    id: 'perfectionist',
    title: 'Perfectionist',
    description: 'Complete 20 tasks without any being overdue',
    icon: '✨',
    rarity: 'epic',
    condition: (stats) => stats.perfectTasks >= 20
  },
  {
    id: 'team_player',
    title: 'Team Player',
    description: 'Attend 5 events',
    icon: '🤝',
    rarity: 'common',
    condition: (stats) => stats.eventsAttended >= 5
  },
  {
    id: 'organizer',
    title: 'Organizer',
    description: 'Create 10 events',
    icon: '📋',
    rarity: 'common',
    condition: (stats) => stats.eventsCreated >= 10
  },
  {
    id: 'time_master',
    title: 'Time Master',
    description: 'Complete 50 tasks on time',
    icon: '⏰',
    rarity: 'epic',
    condition: (stats) => stats.onTimeTasks >= 50
  }
];

export class GamificationService {
  // Process a gamification event
  static async processEvent(event: GamificationEvent): Promise<void> {
    try {
      logger.info('Processing gamification event', { userId: event.userId, type: event.type });

      // Get or create user stats
      const userStats = await this.getOrCreateUserStats(event.userId);

      // Update stats based on event type
      await this.updateStatsForEvent(userStats, event);

      // Check for new achievements
      await this.checkAchievements(event.userId);

      // Check for new badges
      await this.checkBadges(event.userId);

      // Update streaks
      await this.updateStreaks(event.userId, event);

      logger.info('Gamification event processed successfully', { userId: event.userId, type: event.type });
    } catch (error) {
      logger.error('Error processing gamification event:', error);
      throw error;
    }
  }

  // Get or create user stats
  static async getOrCreateUserStats(userId: string) {
    let userStats = await prisma.userStats.findUnique({
      where: { userId }
    });

    if (!userStats) {
      userStats = await prisma.userStats.create({
        data: {
          userId,
          totalPoints: 0,
          currentLevel: 1,
          experiencePoints: 0,
          tasksCompleted: 0,
          tasksCreated: 0,
          totalTaskTime: 0,
          eventsAttended: 0,
          eventsCreated: 0,
          longestStreak: 0,
          currentStreak: 0,
          achievementsUnlocked: 0,
          badgesEarned: 0,
          lastActiveDate: new Date(),
          joinDate: new Date()
        }
      });
    }

    return userStats;
  }

  // Update stats based on event type
  static async updateStatsForEvent(userStats: any, event: GamificationEvent): Promise<void> {
    const updates: any = {
      lastActiveDate: new Date()
    };

    switch (event.type) {
      case 'task_completed':
        updates.tasksCompleted = userStats.tasksCompleted + 1;
        if (event.data?.duration) {
          updates.totalTaskTime = userStats.totalTaskTime + event.data.duration;
        }
        break;
      case 'task_created':
        updates.tasksCreated = userStats.tasksCreated + 1;
        break;
      case 'event_attended':
        updates.eventsAttended = userStats.eventsAttended + 1;
        break;
      case 'event_created':
        updates.eventsCreated = userStats.eventsCreated + 1;
        break;
    }

    await prisma.userStats.update({
      where: { id: userStats.id },
      data: updates
    });
  }

  // Check for new achievements
  static async checkAchievements(userId: string): Promise<void> {
    const userStats = await prisma.userStats.findUnique({
      where: { userId }
    });

    if (!userStats) return;

    const existingAchievements = await prisma.achievement.findMany({
      where: { userId }
    });

    const existingAchievementTypes = existingAchievements.map(a => a.type);

    for (const achievement of ACHIEVEMENTS) {
      if (!existingAchievementTypes.includes(achievement.id) && achievement.condition(userStats)) {
        await this.unlockAchievement(userId, achievement);
      }
    }
  }

  // Check for new badges
  static async checkBadges(userId: string): Promise<void> {
    const userStats = await prisma.userStats.findUnique({
      where: { userId }
    });

    if (!userStats) return;

    const existingBadges = await prisma.badge.findMany({
      where: { userId }
    });

    const existingBadgeTypes = existingBadges.map(b => b.type);

    for (const badge of BADGES) {
      if (!existingBadgeTypes.includes(badge.id) && badge.condition(userStats)) {
        await this.unlockBadge(userId, badge);
      }
    }
  }

  // Unlock an achievement
  static async unlockAchievement(userId: string, achievement: AchievementDefinition): Promise<void> {
    await prisma.achievement.create({
      data: {
        userId,
        type: achievement.id,
        title: achievement.title,
        description: achievement.description,
        points: achievement.points
      }
    });

    // Add points
    await this.addPoints(userId, achievement.points, 'achievement', `Achievement: ${achievement.title}`);

    // Update user stats
    await prisma.userStats.update({
      where: { userId },
      data: {
        achievementsUnlocked: { increment: 1 },
        totalPoints: { increment: achievement.points },
        experiencePoints: { increment: achievement.points }
      }
    });

    // Check for level up
    await this.checkLevelUp(userId);

    logger.info('Achievement unlocked', { userId, achievement: achievement.id });
  }

  // Unlock a badge
  static async unlockBadge(userId: string, badge: BadgeDefinition): Promise<void> {
    await prisma.badge.create({
      data: {
        userId,
        type: badge.id,
        title: badge.title,
        description: badge.description,
        icon: badge.icon,
        rarity: badge.rarity
      }
    });

    // Update user stats
    await prisma.userStats.update({
      where: { userId },
      data: {
        badgesEarned: { increment: 1 }
      }
    });

    logger.info('Badge unlocked', { userId, badge: badge.id });
  }

  // Add points to user
  static async addPoints(userId: string, amount: number, source: string, description?: string): Promise<void> {
    await prisma.point.create({
      data: {
        userId,
        amount,
        source,
        description
      }
    });

    await prisma.userStats.update({
      where: { userId },
      data: {
        totalPoints: { increment: amount },
        experiencePoints: { increment: amount }
      }
    });

    await this.checkLevelUp(userId);
  }

  // Check for level up
  static async checkLevelUp(userId: string): Promise<void> {
    const userStats = await prisma.userStats.findUnique({
      where: { userId }
    });

    if (!userStats) return;

    const requiredXP = this.getRequiredXPForLevel(userStats.currentLevel + 1);
    
    if (userStats.experiencePoints >= requiredXP) {
      await prisma.userStats.update({
        where: { userId },
        data: {
          currentLevel: { increment: 1 }
        }
      });

      logger.info('Level up!', { userId, newLevel: userStats.currentLevel + 1 });
    }
  }

  // Get required XP for a level
  static getRequiredXPForLevel(level: number): number {
    // Exponential growth: level 1 = 100 XP, level 2 = 250 XP, level 3 = 450 XP, etc.
    return Math.floor(100 * Math.pow(level, 1.5));
  }

  // Update streaks
  static async updateStreaks(userId: string, event: GamificationEvent): Promise<void> {
    if (event.type === 'task_completed') {
      await this.updateTaskStreak(userId);
    }
  }

  // Update task completion streak
  static async updateTaskStreak(userId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let streak = await prisma.streak.findFirst({
      where: {
        userId,
        type: 'daily_tasks'
      }
    });

    if (!streak) {
      // Create new streak
      streak = await prisma.streak.create({
        data: {
          userId,
          type: 'daily_tasks',
          count: 1,
          lastDate: today
        }
      });
    } else {
      const lastDate = new Date(streak.lastDate);
      lastDate.setHours(0, 0, 0, 0);

      if (lastDate.getTime() === today.getTime()) {
        // Already counted today, do nothing
        return;
      } else if (lastDate.getTime() === yesterday.getTime()) {
        // Consecutive day, increment streak
        streak = await prisma.streak.update({
          where: { id: streak.id },
          data: {
            count: { increment: 1 },
            lastDate: today
          }
        });
      } else {
        // Streak broken, reset to 1
        streak = await prisma.streak.update({
          where: { id: streak.id },
          data: {
            count: 1,
            lastDate: today
          }
        });
      }
    }

    // Update user stats
    await prisma.userStats.update({
      where: { userId },
      data: {
        currentStreak: streak.count,
        longestStreak: Math.max(streak.count, await this.getLongestStreak(userId))
      }
    });
  }

  // Get longest streak for user
  static async getLongestStreak(userId: string): Promise<number> {
    const userStats = await prisma.userStats.findUnique({
      where: { userId },
      select: { longestStreak: true }
    });

    return userStats?.longestStreak || 0;
  }

  // Get user's gamification data
  static async getUserGamificationData(userId: string) {
    const [userStats, achievements, badges, streaks, recentPoints] = await Promise.all([
      prisma.userStats.findUnique({ where: { userId } }),
      prisma.achievement.findMany({ 
        where: { userId },
        orderBy: { unlockedAt: 'desc' }
      }),
      prisma.badge.findMany({ 
        where: { userId },
        orderBy: { earnedAt: 'desc' }
      }),
      prisma.streak.findMany({ where: { userId } }),
      prisma.point.findMany({
        where: { userId },
        orderBy: { earnedAt: 'desc' },
        take: 10
      })
    ]);

    return {
      stats: userStats,
      achievements,
      badges,
      streaks,
      recentPoints,
      levelProgress: userStats ? this.calculateLevelProgress(userStats) : null
    };
  }

  // Calculate level progress
  static calculateLevelProgress(userStats: any) {
    const currentLevelXP = this.getRequiredXPForLevel(userStats.currentLevel);
    const nextLevelXP = this.getRequiredXPForLevel(userStats.currentLevel + 1);
    const progress = ((userStats.experiencePoints - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

    return {
      currentLevel: userStats.currentLevel,
      nextLevel: userStats.currentLevel + 1,
      currentXP: userStats.experiencePoints,
      requiredXP: nextLevelXP,
      progress: Math.max(0, Math.min(100, progress))
    };
  }

  // Check and unlock eligible achievements for existing users
  static async checkAndUnlockEligibleAchievements(userId: string): Promise<void> {
    try {
      // Get user stats
      const userStats = await this.getOrCreateUserStats(userId);
      
      // Get already unlocked achievements
      const unlockedAchievements = await prisma.achievement.findMany({
        where: { userId },
        select: { type: true }
      });
      
      const unlockedTypes = unlockedAchievements.map(a => a.type);
      
      // Check each achievement definition
      for (const achievement of ACHIEVEMENTS) {
        // Skip if already unlocked
        if (unlockedTypes.includes(achievement.id)) {
          continue;
        }
        
        // Check if user meets the condition
        if (achievement.condition(userStats)) {
          await this.unlockAchievement(userId, achievement);
          logger.info('Retroactively unlocked achievement', { 
            userId, 
            achievement: achievement.id,
            title: achievement.title 
          });
        }
      }
      
      // Check badges too
      const unlockedBadges = await prisma.badge.findMany({
        where: { userId },
        select: { type: true }
      });
      
      const unlockedBadgeTypes = unlockedBadges.map(b => b.type);
      
      for (const badge of BADGES) {
        if (unlockedBadgeTypes.includes(badge.id)) {
          continue;
        }
        
        if (badge.condition(userStats)) {
          await this.unlockBadge(userId, badge);
          logger.info('Retroactively unlocked badge', { 
            userId, 
            badge: badge.id,
            title: badge.title 
          });
        }
      }
    } catch (error) {
      logger.error('Error checking eligible achievements:', error);
    }
  }
}

export default GamificationService;
