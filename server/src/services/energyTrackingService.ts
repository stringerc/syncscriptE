import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export type EnergyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'PEAK';

interface EnergyLog {
  id: string;
  userId: string;
  energyLevel: EnergyLevel;
  energyValue: number;
  loggedAt: Date;
  source: string;
  mood?: string;
  notes?: string;
}

interface EnergyPattern {
  averageByHour: Record<number, number>;
  peakHours: number[];
  lowHours: number[];
  weekdayPattern: Record<string, number>;
}

class EnergyTrackingService {
  /**
   * Log user's current energy level
   */
  async logEnergy(
    userId: string, 
    energyLevel: EnergyLevel,
    options?: {
      mood?: string;
      notes?: string;
      source?: string;
    }
  ): Promise<EnergyLog> {
    // Map energy level to numeric value (1-10)
    const energyValueMap: Record<EnergyLevel, number> = {
      'LOW': 3,
      'MEDIUM': 5,
      'HIGH': 7,
      'PEAK': 10
    };

    const energyValue = energyValueMap[energyLevel];

    // Insert energy log
    const log = await prisma.$queryRaw`
      INSERT INTO energy_logs (
        id, userId, energyLevel, energyValue, loggedAt, 
        source, mood, notes, createdAt
      ) VALUES (
        ${this.generateId()},
        ${userId},
        ${energyLevel},
        ${energyValue},
        datetime('now'),
        ${options?.source || 'manual'},
        ${options?.mood || null},
        ${options?.notes || null},
        datetime('now')
      )
      RETURNING *
    ` as any[];

    logger.info('Energy logged', { 
      userId, 
      energyLevel, 
      energyValue,
      source: options?.source || 'manual'
    });

    // Check for emblem unlocks based on energy logs
    await this.checkEnergyEmblemUnlocks(userId);

    return log[0];
  }

  /**
   * Get user's energy history
   */
  async getEnergyHistory(
    userId: string, 
    days: number = 7
  ): Promise<EnergyLog[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await prisma.$queryRaw`
      SELECT * FROM energy_logs
      WHERE userId = ${userId}
        AND loggedAt >= datetime(${startDate.toISOString()})
      ORDER BY loggedAt DESC
      LIMIT 100
    ` as EnergyLog[];

    return logs;
  }

  /**
   * Analyze user's energy patterns
   */
  async analyzeEnergyPattern(userId: string): Promise<EnergyPattern> {
    const logs = await this.getEnergyHistory(userId, 30);

    const hourlyData: Record<number, number[]> = {};
    const weekdayData: Record<string, number[]> = {};

    logs.forEach(log => {
      const date = new Date(log.loggedAt);
      const hour = date.getHours();
      const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });

      if (!hourlyData[hour]) hourlyData[hour] = [];
      hourlyData[hour].push(log.energyValue);

      if (!weekdayData[weekday]) weekdayData[weekday] = [];
      weekdayData[weekday].push(log.energyValue);
    });

    // Calculate averages
    const averageByHour: Record<number, number> = {};
    Object.keys(hourlyData).forEach(hour => {
      const values = hourlyData[parseInt(hour)];
      averageByHour[parseInt(hour)] = values.reduce((a, b) => a + b, 0) / values.length;
    });

    // Find peak and low hours
    const sortedHours = Object.entries(averageByHour)
      .sort(([, a], [, b]) => b - a);
    
    const peakHours = sortedHours.slice(0, 3).map(([hour]) => parseInt(hour));
    const lowHours = sortedHours.slice(-3).map(([hour]) => parseInt(hour));

    // Calculate weekday patterns
    const weekdayPattern: Record<string, number> = {};
    Object.keys(weekdayData).forEach(day => {
      const values = weekdayData[day];
      weekdayPattern[day] = values.reduce((a, b) => a + b, 0) / values.length;
    });

    return {
      averageByHour,
      peakHours,
      lowHours,
      weekdayPattern
    };
  }

  /**
   * Predict user's energy for a given time
   */
  async predictEnergy(
    userId: string,
    targetTime: Date
  ): Promise<{ level: EnergyLevel; confidence: number }> {
    const pattern = await this.analyzeEnergyPattern(userId);
    const hour = targetTime.getHours();

    const avgEnergy = pattern.averageByHour[hour] || 5;

    let level: EnergyLevel;
    if (avgEnergy >= 8.5) level = 'PEAK';
    else if (avgEnergy >= 6.5) level = 'HIGH';
    else if (avgEnergy >= 4) level = 'MEDIUM';
    else level = 'LOW';

    // Confidence based on data points
    const confidence = Math.min(Object.keys(pattern.averageByHour).length / 24, 1);

    return { level, confidence };
  }

  /**
   * Check and unlock energy-based emblems
   */
  private async checkEnergyEmblemUnlocks(userId: string): Promise<void> {
    // Get all energy logs for user
    const logs = await this.getEnergyHistory(userId, 365);

    // Check Genesis Spark (first energy log)
    if (logs.length >= 1) {
      await this.unlockEmblem(userId, 'emblem_genesis_spark');
    }

    // Check Early Bird (3 logs before 8am)
    const earlyLogs = logs.filter(log => {
      const hour = new Date(log.loggedAt).getHours();
      return hour < 8;
    });
    if (earlyLogs.length >= 3) {
      await this.unlockEmblem(userId, 'emblem_early_bird');
    }

    // Check Sunrise Keeper (14 logs between 5-7am)
    const sunriseLogs = logs.filter(log => {
      const hour = new Date(log.loggedAt).getHours();
      return hour >= 5 && hour <= 7;
    });
    if (sunriseLogs.length >= 14) {
      await this.unlockEmblem(userId, 'emblem_sunrise_keeper');
    }

    // Check Peak energy achievements
    const peakLogs = logs.filter(log => log.energyLevel === 'PEAK');
    if (peakLogs.length >= 20) {
      await this.unlockEmblem(userId, 'emblem_solar_flare');
    }

    // Check consecutive high energy
    const recentLogs = logs.slice(0, 3);
    if (recentLogs.length === 3 && recentLogs.every(log => 
      log.energyLevel === 'HIGH' || log.energyLevel === 'PEAK'
    )) {
      await this.unlockEmblem(userId, 'emblem_crystal_focus');
    }
  }

  /**
   * Unlock an emblem for a user
   */
  private async unlockEmblem(userId: string, emblemId: string): Promise<void> {
    try {
      // Check if already unlocked
      const existing = await prisma.$queryRaw`
        SELECT * FROM user_emblems
        WHERE userId = ${userId} AND emblemId = ${emblemId}
      ` as any[];

      if (existing.length === 0) {
        // Create user-emblem relationship
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

        logger.info('Emblem unlocked!', { userId, emblemId });
      } else if (!existing[0].isUnlocked) {
        // Update to unlocked
        await prisma.$executeRaw`
          UPDATE user_emblems
          SET isUnlocked = true,
              unlockedAt = datetime('now'),
              progress = 100,
              updatedAt = datetime('now')
          WHERE userId = ${userId} AND emblemId = ${emblemId}
        `;

        logger.info('Emblem unlocked (updated)!', { userId, emblemId });
      }
    } catch (error) {
      logger.error('Error unlocking emblem', { userId, emblemId, error });
    }
  }

  /**
   * Generate a unique ID (simple cuid-like)
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default new EnergyTrackingService();

