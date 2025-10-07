import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface DailyChallenge {
  id: string;
  userId: string;
  challengeType: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  rewardEmblemId?: string;
  rewardPoints: number;
  startDate: Date;
  endDate: Date;
  isCompleted: boolean;
  completedAt?: Date;
}

class DailyChallengeService {
  /**
   * Generate a daily challenge for user
   */
  async generateDailyChallenge(userId: string): Promise<DailyChallenge> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if user already has a challenge today
    const existing = await prisma.$queryRaw`
      SELECT * FROM daily_challenges
      WHERE userId = ${userId}
        AND startDate = date(${today.toISOString()})
        AND isCompleted = false
    ` as any[];

    if (existing.length > 0) {
      return existing[0];
    }

    // Random challenge types
    const challengeTypes = [
      {
        type: 'peak_performance',
        title: 'Peak Performance',
        description: 'Complete 3 tasks at PEAK or HIGH energy',
        targetValue: 3,
        rewardPoints: 150
      },
      {
        type: 'task_master',
        title: 'Task Master',
        description: 'Complete 5 tasks today',
        targetValue: 5,
        rewardPoints: 100
      },
      {
        type: 'energy_warrior',
        title: 'Energy Warrior',
        description: 'Log your energy 3 times today',
        targetValue: 3,
        rewardPoints: 75
      },
      {
        type: 'early_achiever',
        title: 'Early Achiever',
        description: 'Complete 2 tasks before 10am',
        targetValue: 2,
        rewardPoints: 120
      },
      {
        type: 'streak_keeper',
        title: 'Streak Keeper',
        description: 'Maintain your daily streak',
        targetValue: 1,
        rewardPoints: 80
      }
    ];

    // Randomly select a challenge
    const challenge = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];

    // Create challenge
    const newChallenge = await prisma.$queryRaw`
      INSERT INTO daily_challenges (
        id, userId, challengeType, title, description,
        targetValue, currentValue, rewardPoints,
        startDate, endDate, isCompleted, createdAt, updatedAt
      ) VALUES (
        ${this.generateId()},
        ${userId},
        ${challenge.type},
        ${challenge.title},
        ${challenge.description},
        ${challenge.targetValue},
        0,
        ${challenge.rewardPoints},
        date(${today.toISOString()}),
        date(${tomorrow.toISOString()}),
        false,
        datetime('now'),
        datetime('now')
      )
      RETURNING *
    ` as any[];

    logger.info('Daily challenge generated', { 
          userId,
      challengeType: challenge.type,
      title: challenge.title 
    });

    return newChallenge[0];
  }

  /**
   * Get active challenge for user
   */
  async getActiveChallenge(userId: string): Promise<DailyChallenge | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const challenges = await prisma.$queryRaw`
      SELECT * FROM daily_challenges
      WHERE userId = ${userId}
        AND startDate = date(${today.toISOString()})
      ORDER BY createdAt DESC
      LIMIT 1
    ` as any[];

    return challenges.length > 0 ? challenges[0] : null;
  }

  /**
   * Update challenge progress
   */
  async updateChallengeProgress(
    userId: string,
    challengeType: string,
    increment: number = 1
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's challenge of this type
    const challenges = await prisma.$queryRaw`
      SELECT * FROM daily_challenges
      WHERE userId = ${userId}
        AND challengeType = ${challengeType}
        AND startDate = date(${today.toISOString()})
        AND isCompleted = false
    ` as any[];

    if (challenges.length === 0) return;

    const challenge = challenges[0];
    const newValue = challenge.currentValue + increment;

    // Update progress
    await prisma.$executeRaw`
      UPDATE daily_challenges
      SET currentValue = ${newValue},
          updatedAt = datetime('now')
      WHERE id = ${challenge.id}
    `;

    // Check if completed
    if (newValue >= challenge.targetValue) {
      await this.completeChallenge(challenge.id, userId);
    }

    logger.info('Challenge progress updated', { 
      userId, 
      challengeType,
      progress: `${newValue}/${challenge.targetValue}`
    });
  }

  /**
   * Complete a challenge
   */
  private async completeChallenge(
    challengeId: string,
    userId: string
  ): Promise<void> {
    // Mark as completed
    await prisma.$executeRaw`
      UPDATE daily_challenges
      SET isCompleted = true,
          completedAt = datetime('now'),
          updatedAt = datetime('now')
      WHERE id = ${challengeId}
    `;

    // Get challenge details
    const challenges = await prisma.$queryRaw`
      SELECT * FROM daily_challenges WHERE id = ${challengeId}
    ` as any[];

    if (challenges.length === 0) return;

    const challenge = challenges[0];

    // Award points (via gamification service would go here)
    logger.info('Challenge completed!', { 
      userId, 
      challengeId,
      title: challenge.title,
      pointsAwarded: challenge.rewardPoints
    });

    // Check for emblem unlocks based on challenge completions
    await this.checkChallengeEmblemUnlocks(userId);
  }

  /**
   * Check and unlock challenge-based emblems
   */
  private async checkChallengeEmblemUnlocks(userId: string): Promise<void> {
    // Get total completed challenges
    const completed = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM daily_challenges
      WHERE userId = ${userId} AND isCompleted = true
    ` as any[];

    const totalCompleted = completed[0].count;

    // Thunder Storm: Complete 10 challenges
    if (totalCompleted >= 10) {
      await this.unlockEmblem(userId, 'emblem_thunder_storm');
    }

    // Check for 3 challenges in one day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCompleted = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM daily_challenges
      WHERE userId = ${userId} 
        AND isCompleted = true
        AND startDate = date(${today.toISOString()})
    ` as any[];

    if (todayCompleted[0].count >= 3) {
      // Phoenix Flame: 3 challenges in one day
      await this.unlockEmblem(userId, 'emblem_phoenix_flame');
    }
  }

  /**
   * Unlock an emblem
   */
  private async unlockEmblem(userId: string, emblemId: string): Promise<void> {
    try {
      const existing = await prisma.$queryRaw`
        SELECT * FROM user_emblems
        WHERE userId = ${userId} AND emblemId = ${emblemId}
      ` as any[];

      if (existing.length === 0) {
        await prisma.$executeRaw`
          INSERT INTO user_emblems (
            id, userId, emblemId, isUnlocked, unlockedAt, 
            progress, createdAt, updatedAt
          ) VALUES (
            ${this.generateId()},
            ${userId},
            ${emblemId},
            true,
            datetime('now'),
            100,
            datetime('now'),
            datetime('now')
          )
        `;
        logger.info('Emblem unlocked via challenge!', { userId, emblemId });
      }
    } catch (error) {
      logger.error('Error unlocking challenge emblem', { userId, emblemId, error });
    }
  }

  /**
   * Get challenge statistics for user
   */
  async getChallengeStats(userId: string): Promise<{
    totalCompleted: number;
    currentStreak: number;
    bestStreak: number;
  }> {
    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as totalCompleted
      FROM daily_challenges
      WHERE userId = ${userId} AND isCompleted = true
    ` as any[];

    return {
      totalCompleted: stats[0].totalCompleted,
      currentStreak: 0, // TODO: Calculate streak
      bestStreak: 0 // TODO: Calculate best streak
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default new DailyChallengeService();
