import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface AchievementCriteria {
  type: 'count' | 'streak' | 'value' | 'percentage' | 'boolean';
  target: number;
  current?: number;
  description: string;
  domain?: string;
  category?: string;
}

export interface AchievementTemplate {
  id: string;
  type: string;
  title: string;
  description: string;
  criteria: AchievementCriteria;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: string;
  domain?: string;
  icon: string;
}

// Predefined achievement templates
const ACHIEVEMENT_TEMPLATES: AchievementTemplate[] = [
  // Productivity Achievements
  {
    id: 'first_task',
    type: 'completion',
    title: 'Getting Started',
    description: 'Complete your first task',
    criteria: { type: 'count', target: 1, description: 'Complete 1 task' },
    points: 10,
    rarity: 'common',
    category: 'productivity',
    icon: '🎯'
  },
  {
    id: 'task_master_10',
    type: 'completion',
    title: 'Task Master',
    description: 'Complete 10 tasks',
    criteria: { type: 'count', target: 10, description: 'Complete 10 tasks' },
    points: 50,
    rarity: 'common',
    category: 'productivity',
    icon: '⚡'
  },
  {
    id: 'task_master_50',
    type: 'completion',
    title: 'Productivity Pro',
    description: 'Complete 50 tasks',
    criteria: { type: 'count', target: 50, description: 'Complete 50 tasks' },
    points: 200,
    rarity: 'rare',
    category: 'productivity',
    icon: '🚀'
  },
  {
    id: 'task_master_100',
    type: 'completion',
    title: 'Task Legend',
    description: 'Complete 100 tasks',
    criteria: { type: 'count', target: 100, description: 'Complete 100 tasks' },
    points: 500,
    rarity: 'epic',
    category: 'productivity',
    icon: '👑'
  },

  // Streak Achievements
  {
    id: 'streak_3',
    type: 'streak',
    title: 'Getting Consistent',
    description: 'Maintain a 3-day task streak',
    criteria: { type: 'streak', target: 3, description: 'Maintain a 3-day streak' },
    points: 25,
    rarity: 'common',
    category: 'consistency',
    icon: '🔥'
  },
  {
    id: 'streak_7',
    type: 'streak',
    title: 'Week Warrior',
    description: 'Maintain a 7-day task streak',
    criteria: { type: 'streak', target: 7, description: 'Maintain a 7-day streak' },
    points: 75,
    rarity: 'rare',
    category: 'consistency',
    icon: '💪'
  },
  {
    id: 'streak_30',
    type: 'streak',
    title: 'Monthly Master',
    description: 'Maintain a 30-day task streak',
    criteria: { type: 'streak', target: 30, description: 'Maintain a 30-day streak' },
    points: 300,
    rarity: 'epic',
    category: 'consistency',
    icon: '🏆'
  },

  // Energy Engine Achievements
  {
    id: 'energy_surge',
    type: 'energy',
    title: 'Energy Surge',
    description: 'Reach 80+ energy level',
    criteria: { type: 'value', target: 80, description: 'Reach 80+ energy level' },
    points: 100,
    rarity: 'rare',
    category: 'wellness',
    domain: 'body',
    icon: '⚡'
  },
  {
    id: 'ep_collector_100',
    type: 'energy',
    title: 'EP Collector',
    description: 'Earn 100 Energy Points',
    criteria: { type: 'count', target: 100, description: 'Earn 100 EP' },
    points: 150,
    rarity: 'common',
    category: 'wellness',
    icon: '💎'
  },
  {
    id: 'ep_collector_500',
    type: 'energy',
    title: 'EP Enthusiast',
    description: 'Earn 500 Energy Points',
    criteria: { type: 'count', target: 500, description: 'Earn 500 EP' },
    points: 400,
    rarity: 'rare',
    category: 'wellness',
    icon: '🌟'
  },
  {
    id: 'ep_collector_1000',
    type: 'energy',
    title: 'EP Master',
    description: 'Earn 1000 Energy Points',
    criteria: { type: 'count', target: 1000, description: 'Earn 1000 EP' },
    points: 750,
    rarity: 'epic',
    category: 'wellness',
    icon: '💫'
  },

  // Domain-specific Achievements
  {
    id: 'body_warrior',
    type: 'domain',
    title: 'Body Warrior',
    description: 'Complete 20 body domain challenges',
    criteria: { type: 'count', target: 20, description: 'Complete 20 body challenges', domain: 'body' },
    points: 200,
    rarity: 'rare',
    category: 'wellness',
    domain: 'body',
    icon: '💪'
  },
  {
    id: 'mind_master',
    type: 'domain',
    title: 'Mind Master',
    description: 'Complete 20 mind domain challenges',
    criteria: { type: 'count', target: 20, description: 'Complete 20 mind challenges', domain: 'mind' },
    points: 200,
    rarity: 'rare',
    category: 'learning',
    domain: 'mind',
    icon: '🧠'
  },
  {
    id: 'social_butterfly',
    type: 'domain',
    title: 'Social Butterfly',
    description: 'Complete 20 social domain challenges',
    criteria: { type: 'count', target: 20, description: 'Complete 20 social challenges', domain: 'social' },
    points: 200,
    rarity: 'rare',
    category: 'social',
    domain: 'social',
    icon: '🦋'
  },

  // Event Achievements
  {
    id: 'event_planner',
    type: 'event',
    title: 'Event Planner',
    description: 'Complete 10 events with 80%+ completion',
    criteria: { type: 'count', target: 10, description: 'Complete 10 events with 80%+ completion' },
    points: 300,
    rarity: 'rare',
    category: 'productivity',
    icon: '📅'
  },
  {
    id: 'perfectionist',
    type: 'event',
    title: 'Perfectionist',
    description: 'Complete 5 events with 100% completion',
    criteria: { type: 'count', target: 5, description: 'Complete 5 events with 100% completion' },
    points: 400,
    rarity: 'epic',
    category: 'productivity',
    icon: '✨'
  },

  // Daily Challenge Achievements
  {
    id: 'challenge_champion',
    type: 'challenge',
    title: 'Challenge Champion',
    description: 'Complete 50 daily challenges',
    criteria: { type: 'count', target: 50, description: 'Complete 50 daily challenges' },
    points: 250,
    rarity: 'rare',
    category: 'wellness',
    icon: '🏅'
  },
  {
    id: 'streak_stretcher',
    type: 'challenge',
    title: 'Streak Stretcher',
    description: 'Complete 7 stretch challenges',
    criteria: { type: 'count', target: 7, description: 'Complete 7 stretch challenges' },
    points: 200,
    rarity: 'rare',
    category: 'wellness',
    icon: '🎯'
  }
];

class EnhancedAchievementsService {
  // Get all available achievement templates
  getAchievementTemplates(): AchievementTemplate[] {
    return ACHIEVEMENT_TEMPLATES;
  }

  // Get user's achievements with progress
  async getUserAchievements(userId: string) {
    try {
      const achievements = await prisma.achievement.findMany({
        where: { userId },
        orderBy: [
          { isUnlocked: 'desc' },
          { progress: 'desc' },
          { unlockedAt: 'desc' }
        ]
      });

      // Get user stats for progress calculation
      const userStats = await prisma.userStats.findUnique({
        where: { userId }
      });

      const energyProfile = await prisma.userEnergyProfile.findUnique({
        where: { userId }
      });

      // Calculate progress for each achievement
      const achievementsWithProgress = await Promise.all(
        achievements.map(async (achievement) => {
          const progress = await this.calculateAchievementProgress(
            userId,
            achievement,
            userStats,
            energyProfile
          );
          
          return {
            ...achievement,
            progress: progress.current,
            target: progress.target,
            isUnlocked: progress.current >= progress.target
          };
        })
      );

      return achievementsWithProgress;
    } catch (error) {
      logger.error('Error getting user achievements:', error);
      throw error;
    }
  }

  // Calculate progress for a specific achievement
  async calculateAchievementProgress(
    userId: string,
    achievement: any,
    userStats?: any,
    energyProfile?: any
  ) {
    try {
      const criteria = achievement.criteria ? JSON.parse(achievement.criteria) : {};
      let current = 0;
      let target = criteria.target || 100;

      switch (achievement.type) {
        case 'completion':
          current = userStats?.tasksCompleted || 0;
          break;

        case 'streak':
          const streak = await prisma.streak.findFirst({
            where: { userId, type: 'daily_tasks' }
          });
          current = streak?.count || 0;
          break;

        case 'energy':
          if (achievement.id.includes('energy_surge')) {
            current = energyProfile?.currentEnergy || 0;
          } else if (achievement.id.includes('ep_collector')) {
            const epTotal = await prisma.energyPoint.aggregate({
              where: { userId },
              _sum: { amount: true }
            });
            current = epTotal._sum.amount || 0;
          }
          break;

        case 'domain':
          const domainChallenges = await prisma.dailyChallenge.count({
            where: {
              userId,
              domain: criteria.domain,
              isCompleted: true
            }
          });
          current = domainChallenges;
          break;

        case 'event':
          if (achievement.id === 'event_planner') {
            // Count events with 80%+ completion (would need to track this)
            current = 0; // Placeholder
          } else if (achievement.id === 'perfectionist') {
            // Count events with 100% completion
            current = 0; // Placeholder
          }
          break;

        case 'challenge':
          if (achievement.id === 'challenge_champion') {
            const completedChallenges = await prisma.dailyChallenge.count({
              where: { userId, isCompleted: true }
            });
            current = completedChallenges;
          } else if (achievement.id === 'streak_stretcher') {
            const stretchChallenges = await prisma.dailyChallenge.count({
              where: { userId, type: 'stretch', isCompleted: true }
            });
            current = stretchChallenges;
          }
          break;

        default:
          current = 0;
      }

      return {
        current: Math.min(current, target),
        target,
        percentage: Math.round((current / target) * 100)
      };
    } catch (error) {
      logger.error('Error calculating achievement progress:', error);
      return { current: 0, target: 100, percentage: 0 };
    }
  }

  // Check and unlock achievements
  async checkAndUnlockAchievements(userId: string) {
    try {
      const userStats = await prisma.userStats.findUnique({
        where: { userId }
      });

      const energyProfile = await prisma.userEnergyProfile.findUnique({
        where: { userId }
      });

      const unlockedAchievements = [];

      for (const template of ACHIEVEMENT_TEMPLATES) {
        // Check if achievement already exists
        const existingAchievement = await prisma.achievement.findFirst({
          where: { userId, type: template.type }
        });

        if (existingAchievement && existingAchievement.isUnlocked) {
          continue; // Already unlocked
        }

        // Calculate progress
        const progress = await this.calculateAchievementProgress(
          userId,
          { ...template, criteria: JSON.stringify(template.criteria) },
          userStats,
          energyProfile
        );

        if (progress.current >= progress.target) {
          // Unlock achievement
          const achievement = await prisma.achievement.upsert({
            where: { id: existingAchievement?.id || '' },
            update: {
              isUnlocked: true,
              progress: progress.current,
              unlockedAt: new Date()
            },
            create: {
              userId,
              type: template.type,
              title: template.title,
              description: template.description,
              points: template.points,
              criteria: JSON.stringify(template.criteria),
              progress: progress.current,
              target: progress.target,
              isUnlocked: true,
              rarity: template.rarity,
              category: template.category,
              domain: template.domain,
              icon: template.icon,
              unlockedAt: new Date()
            }
          });

          unlockedAchievements.push(achievement);

          // Award points
          if (template.points > 0) {
            await prisma.point.create({
              data: {
                userId,
                amount: template.points,
                source: 'achievement',
                description: `Achievement unlocked: ${template.title}`,
                metadata: JSON.stringify({ achievementId: achievement.id })
              }
            });

            // Update user stats
            await prisma.userStats.upsert({
              where: { userId },
              update: {
                totalPoints: { increment: template.points },
                achievementsUnlocked: { increment: 1 }
              },
              create: {
                userId,
                totalPoints: template.points,
                achievementsUnlocked: 1
              }
            });
          }
        } else if (existingAchievement) {
          // Update progress
          await prisma.achievement.update({
            where: { id: existingAchievement.id },
            data: { progress: progress.current }
          });
        } else {
          // Create achievement with current progress
          await prisma.achievement.create({
            data: {
              userId,
              type: template.type,
              title: template.title,
              description: template.description,
              points: template.points,
              criteria: JSON.stringify(template.criteria),
              progress: progress.current,
              target: progress.target,
              isUnlocked: false,
              rarity: template.rarity,
              category: template.category,
              domain: template.domain,
              icon: template.icon
            }
          });
        }
      }

      return unlockedAchievements;
    } catch (error) {
      logger.error('Error checking and unlocking achievements:', error);
      throw error;
    }
  }

  // Get achievement categories
  getAchievementCategories() {
    const categories = new Set(ACHIEVEMENT_TEMPLATES.map(t => t.category));
    return Array.from(categories);
  }

  // Get achievements by category
  getAchievementsByCategory(category: string) {
    return ACHIEVEMENT_TEMPLATES.filter(t => t.category === category);
  }

  // Get achievements by rarity
  getAchievementsByRarity(rarity: string) {
    return ACHIEVEMENT_TEMPLATES.filter(t => t.rarity === rarity);
  }
}

export default new EnhancedAchievementsService();
