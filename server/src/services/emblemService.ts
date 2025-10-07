import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface Emblem {
  id: string;
  name: string;
  description: string;
  emoji: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: string;
  bonusType: string;
  bonusValue: number;
  unlockCriteria: string;
  order: number;
}

interface UserEmblem {
  id: string;
  userId: string;
  emblemId: string;
  isUnlocked: boolean;
  unlockedAt?: Date;
  isEquipped: boolean;
  equippedAt?: Date;
  progress: number;
  emblem?: Emblem;
}

class EmblemService {
  /**
   * Get all emblems (master list)
   */
  async getAllEmblems(): Promise<Emblem[]> {
    const emblems = await prisma.$queryRaw`
      SELECT * FROM emblems
      WHERE isActive = true
      ORDER BY "order" ASC
    ` as Emblem[];

    return emblems;
  }

  /**
   * Get user's emblems with unlock status
   */
  async getUserEmblems(userId: string): Promise<UserEmblem[]> {
    const userEmblems = await prisma.$queryRaw`
      SELECT 
        ue.*,
        e.name,
        e.description,
        e.emoji,
        e.rarity,
        e.category,
        e.bonusType,
        e.bonusValue
      FROM user_emblems ue
      JOIN emblems e ON ue.emblemId = e.id
      WHERE ue.userId = ${userId}
      ORDER BY e."order" ASC
    ` as any[];

    return userEmblems;
  }

  /**
   * Get user's equipped emblems
   */
  async getEquippedEmblems(userId: string): Promise<UserEmblem[]> {
    const equipped = await prisma.$queryRaw`
      SELECT 
        ue.*,
        e.name,
        e.description,
        e.emoji,
        e.rarity,
        e.bonusType,
        e.bonusValue
      FROM user_emblems ue
      JOIN emblems e ON ue.emblemId = e.id
      WHERE ue.userId = ${userId} AND ue.isEquipped = true
    ` as any[];

    return equipped;
  }

  /**
   * Equip an emblem
   */
  async equipEmblem(userId: string, emblemId: string): Promise<void> {
    // Check if user has unlocked this emblem
    const userEmblem = await prisma.$queryRaw`
      SELECT * FROM user_emblems
      WHERE userId = ${userId} AND emblemId = ${emblemId}
    ` as any[];

    if (userEmblem.length === 0 || !userEmblem[0].isUnlocked) {
      throw new Error('Emblem not unlocked');
    }

    // Unequip all other emblems (for now, allow only 1 equipped)
    await prisma.$executeRaw`
      UPDATE user_emblems
      SET isEquipped = false, equippedAt = NULL, updatedAt = datetime('now')
      WHERE userId = ${userId}
    `;

    // Equip the selected emblem
    await prisma.$executeRaw`
      UPDATE user_emblems
      SET isEquipped = true, 
          equippedAt = datetime('now'),
          updatedAt = datetime('now')
      WHERE userId = ${userId} AND emblemId = ${emblemId}
    `;

    logger.info('Emblem equipped', { userId, emblemId });
  }

  /**
   * Unequip an emblem
   */
  async unequipEmblem(userId: string, emblemId: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE user_emblems
      SET isEquipped = false, equippedAt = NULL, updatedAt = datetime('now')
      WHERE userId = ${userId} AND emblemId = ${emblemId}
    `;

    logger.info('Emblem unequipped', { userId, emblemId });
  }

  /**
   * Calculate total active bonuses for user
   */
  async calculateActiveBonuses(userId: string): Promise<{
    pointsMultiplier: number;
    energyBoost: number;
    timeBonus: number;
  }> {
    const equipped = await this.getEquippedEmblems(userId);

    let pointsMultiplier = 1.0;
    let energyBoost = 0;
    let timeBonus = 0;

    equipped.forEach(emblem => {
      switch (emblem.bonusType) {
        case 'points_multiplier':
          pointsMultiplier += emblem.bonusValue / 100;
          break;
        case 'energy_boost':
          energyBoost += emblem.bonusValue;
          break;
        case 'time_bonus':
          timeBonus += emblem.bonusValue;
          break;
      }
    });

    return { pointsMultiplier, energyBoost, timeBonus };
  }

  /**
   * Update emblem progress for user
   */
  async updateEmblemProgress(
    userId: string, 
    emblemId: string, 
    progress: number
  ): Promise<void> {
    // Ensure user-emblem record exists
    const existing = await prisma.$queryRaw`
      SELECT * FROM user_emblems
      WHERE userId = ${userId} AND emblemId = ${emblemId}
    ` as any[];

    if (existing.length === 0) {
      // Create new record
      await prisma.$executeRaw`
        INSERT INTO user_emblems (
          id, userId, emblemId, progress, createdAt, updatedAt
        ) VALUES (
          ${this.generateId()},
          ${userId},
          ${emblemId},
          ${progress},
          datetime('now'),
          datetime('now')
        )
      `;
    } else {
      // Update existing record
      await prisma.$executeRaw`
        UPDATE user_emblems
        SET progress = ${progress}, updatedAt = datetime('now')
        WHERE userId = ${userId} AND emblemId = ${emblemId}
      `;
    }

    // Auto-unlock if progress reaches 100
    if (progress >= 100) {
      await prisma.$executeRaw`
        UPDATE user_emblems
        SET isUnlocked = true, 
            unlockedAt = datetime('now'),
            updatedAt = datetime('now')
        WHERE userId = ${userId} AND emblemId = ${emblemId} AND isUnlocked = false
      `;
    }
  }

  /**
   * Initialize emblems for new user
   */
  async initializeUserEmblems(userId: string): Promise<void> {
    const allEmblems = await this.getAllEmblems();

    for (const emblem of allEmblems) {
      const existing = await prisma.$queryRaw`
        SELECT * FROM user_emblems
        WHERE userId = ${userId} AND emblemId = ${emblem.id}
      ` as any[];

      if (existing.length === 0) {
        await prisma.$executeRaw`
          INSERT INTO user_emblems (
            id, userId, emblemId, progress, createdAt, updatedAt
          ) VALUES (
            ${this.generateId()},
            ${userId},
            ${emblem.id},
            0,
            datetime('now'),
            datetime('now')
          )
        `;
      }
    }

    logger.info('User emblems initialized', { userId, count: allEmblems.length });
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default new EmblemService();

