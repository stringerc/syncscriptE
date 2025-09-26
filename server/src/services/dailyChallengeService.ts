import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  type: 'task_completion' | 'streak_maintenance' | 'energy_optimization' | 'event_creation';
  target: number;
  reward: number;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expiresAt: Date;
}

export class DailyChallengeService {
  private static instance: DailyChallengeService;

  private constructor() {}

  public static getInstance(): DailyChallengeService {
    if (!DailyChallengeService.instance) {
      DailyChallengeService.instance = new DailyChallengeService();
    }
    return DailyChallengeService.instance;
  }

  // Generate daily challenges for a user
  public async generateDailyChallenges(userId: string): Promise<DailyChallenge[]> {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of day

    const challenges: DailyChallenge[] = [
      {
        id: 'complete_3_tasks',
        title: 'Task Master',
        description: 'Complete 3 tasks today',
        type: 'task_completion',
        target: 3,
        reward: 25,
        icon: '✅',
        difficulty: 'easy',
        expiresAt: today
      },
      {
        id: 'maintain_streak',
        title: 'Streak Keeper',
        description: 'Maintain your daily streak',
        type: 'streak_maintenance',
        target: 1,
        reward: 15,
        icon: '🔥',
        difficulty: 'easy',
        expiresAt: today
      },
      {
        id: 'energy_optimization',
        title: 'Energy Pro',
        description: 'Complete a task during your peak energy time',
        type: 'energy_optimization',
        target: 1,
        reward: 30,
        icon: '⚡',
        difficulty: 'medium',
        expiresAt: today
      },
      {
        id: 'create_event',
        title: 'Event Planner',
        description: 'Create 1 event today',
        type: 'event_creation',
        target: 1,
        reward: 20,
        icon: '📅',
        difficulty: 'easy',
        expiresAt: today
      }
    ];

    return challenges;
  }

  // Check if user completed a challenge
  public async checkChallengeCompletion(userId: string, challengeId: string): Promise<boolean> {
    const userStats = await prisma.userStats.findUnique({ where: { userId } });
    if (!userStats) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (challengeId) {
      case 'complete_3_tasks':
        // Check if user completed 3 tasks today
        const todayTasks = await prisma.task.count({
          where: {
            userId,
            status: 'COMPLETED',
            completedAt: {
              gte: today
            }
          }
        });
        return todayTasks >= 3;

      case 'maintain_streak':
        // Check if user has active streak
        const streak = await prisma.streak.findFirst({
          where: {
            userId,
            type: 'daily_tasks',
            lastDate: {
              gte: today
            }
          }
        });
        return !!streak;

      case 'energy_optimization':
        // Check if user completed task during peak energy (simplified)
        const energyTasks = await prisma.task.count({
          where: {
            userId,
            status: 'COMPLETED',
            completedAt: {
              gte: today
            }
          }
        });
        return energyTasks >= 1;

      case 'create_event':
        // Check if user created event today
        const todayEvents = await prisma.event.count({
          where: {
            userId,
            createdAt: {
              gte: today
            }
          }
        });
        return todayEvents >= 1;

      default:
        return false;
    }
  }

  // Award challenge completion
  public async awardChallengeCompletion(userId: string, challengeId: string, reward: number): Promise<void> {
    await prisma.userStats.update({
      where: { userId },
      data: {
        totalPoints: { increment: reward },
        experiencePoints: { increment: reward }
      }
    });

    // Add point record
    await prisma.point.create({
      data: {
        userId,
        amount: reward,
        source: 'daily_challenge',
        description: `Completed challenge: ${challengeId}`,
        earnedAt: new Date()
      }
    });

    logger.info('Challenge completed', { userId, challengeId, reward });
  }
}

export default DailyChallengeService.getInstance();
