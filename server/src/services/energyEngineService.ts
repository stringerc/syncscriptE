import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface EnergyDomain {
  id: string;
  name: string;
  weight: number;
  description: string;
}

export interface DailyChallengeData {
  title: string;
  description: string;
  domain: string;
  type: 'core' | 'stretch';
  target: string;
  epReward: number;
}

export interface EnergyConversionResult {
  epEarned: number;
  energyGained: number;
  conversionRate: number;
  newEnergyLevel: number;
}

export class EnergyEngineService {
  // Domain definitions for the Energy Engine
  static readonly DOMAINS: EnergyDomain[] = [
    { id: 'body', name: 'Body', weight: 1.0, description: 'Physical health and movement' },
    { id: 'mind', name: 'Mind', weight: 1.0, description: 'Mental stimulation and learning' },
    { id: 'social', name: 'Social', weight: 1.0, description: 'Connections and relationships' },
    { id: 'order', name: 'Order', weight: 1.0, description: 'Organization and structure' },
    { id: 'finance', name: 'Finance', weight: 1.0, description: 'Financial health and planning' },
    { id: 'outdoors', name: 'Outdoors', weight: 1.0, description: 'Nature and outdoor activities' },
    { id: 'rest', name: 'Rest', weight: 1.0, description: 'Recovery and relaxation' }
  ];

  // EP caps and conversion rates
  static readonly DAILY_EP_CAP = 200;
  static readonly BASE_CONVERSION_RATE = 0.5; // 50% of EP converts to Energy
  static readonly DIMINISHING_RETURNS_THRESHOLD = 100; // EP threshold for diminishing returns

  /**
   * Get or create user's energy profile
   */
  static async getOrCreateEnergyProfile(userId: string) {
    let profile = await prisma.userEnergyProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      // Create default energy profile
      const defaultWeights = JSON.stringify(
        this.DOMAINS.reduce((acc, domain) => {
          acc[domain.id] = domain.weight;
          return acc;
        }, {} as Record<string, number>)
      );

      profile = await prisma.userEnergyProfile.create({
        data: {
          userId,
          currentEnergy: 50,
          energyLevel: 5,
          domainWeights: defaultWeights,
          personalizationData: JSON.stringify({})
        }
      });

      // Create default emblems
      await this.initializeEmblems(userId);
    }

    return profile;
  }

  /**
   * Initialize default emblems for a user
   */
  static async initializeEmblems(userId: string) {
    const emblemTypes = ['bolt', 'heart', 'comet', 'wave'];
    
    for (const emblemType of emblemTypes) {
      await prisma.energyEmblem.create({
        data: {
          userId,
          emblemType,
          isUnlocked: emblemType === 'bolt', // Bolt is unlocked by default
          isActive: emblemType === 'bolt',
          metadata: JSON.stringify({
            name: this.getEmblemName(emblemType),
            description: this.getEmblemDescription(emblemType),
            unlockCondition: emblemType === 'bolt' ? 'default' : this.getEmblemUnlockCondition(emblemType)
          })
        }
      });
    }
  }

  /**
   * Award Energy Points (EP) to a user
   */
  static async awardEnergyPoints(
    userId: string,
    amount: number,
    source: string,
    domain?: string,
    description?: string,
    metadata?: any
  ) {
    // Check daily EP cap
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEP = await prisma.energyPoint.aggregate({
      where: {
        userId,
        earnedAt: {
          gte: today,
          lt: tomorrow
        }
      },
      _sum: {
        amount: true
      }
    });

    const dailyEPUsed = todayEP._sum.amount || 0;
    const remainingEP = this.DAILY_EP_CAP - dailyEPUsed;
    const actualAmount = Math.min(amount, remainingEP);

    if (actualAmount <= 0) {
      logger.info('Daily EP cap reached', { userId, dailyEPUsed, requestedAmount: amount });
      return { awarded: 0, capped: true };
    }

    // Create EP record
    const energyPoint = await prisma.energyPoint.create({
      data: {
        userId,
        amount: actualAmount,
        source,
        domain,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
        earnedAt: new Date()
      }
    });

    logger.info('Energy Points awarded', { 
      userId, 
      amount: actualAmount, 
      source, 
      domain,
      dailyEPUsed: dailyEPUsed + actualAmount
    });

    return { awarded: actualAmount, capped: false, energyPoint };
  }

  /**
   * Convert EP to Energy with diminishing returns
   */
  static async convertEPToEnergy(userId: string, date?: Date): Promise<EnergyConversionResult> {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get EP earned on the target date
    const epEarned = await prisma.energyPoint.aggregate({
      where: {
        userId,
        earnedAt: {
          gte: targetDate,
          lt: nextDay
        }
      },
      _sum: {
        amount: true
      }
    });

    const totalEP = epEarned._sum.amount || 0;

    // Calculate conversion with diminishing returns
    let energyGained: number;
    let conversionRate: number;

    if (totalEP <= this.DIMINISHING_RETURNS_THRESHOLD) {
      // Linear conversion up to threshold
      energyGained = totalEP * this.BASE_CONVERSION_RATE;
      conversionRate = this.BASE_CONVERSION_RATE;
    } else {
      // Diminishing returns above threshold
      const linearEnergy = this.DIMINISHING_RETURNS_THRESHOLD * this.BASE_CONVERSION_RATE;
      const excessEP = totalEP - this.DIMINISHING_RETURNS_THRESHOLD;
      const diminishingEnergy = excessEP * (this.BASE_CONVERSION_RATE * 0.3); // 30% of base rate
      energyGained = linearEnergy + diminishingEnergy;
      conversionRate = energyGained / totalEP;
    }

    // Cap energy gained at 100
    energyGained = Math.min(energyGained, 100);

    // Get current energy profile
    const profile = await this.getOrCreateEnergyProfile(userId);
    const newEnergyLevel = Math.min(profile.currentEnergy + energyGained, 100);

    // Update energy profile
    await prisma.userEnergyProfile.update({
      where: { userId },
      data: {
        currentEnergy: newEnergyLevel,
        lastConversion: new Date()
      }
    });

    // Record conversion
    const conversion = await prisma.energyConversion.create({
      data: {
        userId,
        epEarned: totalEP,
        energyGained,
        conversionRate,
        date: targetDate,
        metadata: JSON.stringify({
          linearEP: Math.min(totalEP, this.DIMINISHING_RETURNS_THRESHOLD),
          diminishingEP: Math.max(0, totalEP - this.DIMINISHING_RETURNS_THRESHOLD),
          previousEnergy: profile.currentEnergy
        })
      }
    });

    logger.info('EP to Energy conversion completed', {
      userId,
      epEarned: totalEP,
      energyGained,
      conversionRate,
      newEnergyLevel
    });

    return {
      epEarned: totalEP,
      energyGained,
      conversionRate,
      newEnergyLevel
    };
  }

  /**
   * Get user's current energy status
   */
  static async getEnergyStatus(userId: string) {
    const profile = await this.getOrCreateEnergyProfile(userId);
    
    // Get today's EP
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEP = await prisma.energyPoint.aggregate({
      where: {
        userId,
        earnedAt: {
          gte: today,
          lt: tomorrow
        }
      },
      _sum: {
        amount: true
      }
    });

    // Get active emblem
    const activeEmblem = await prisma.energyEmblem.findFirst({
      where: {
        userId,
        isActive: true
      }
    });

    return {
      currentEnergy: profile.currentEnergy,
      energyLevel: profile.energyLevel,
      todayEP: todayEP._sum.amount || 0,
      dailyEPCap: this.DAILY_EP_CAP,
      remainingEP: this.DAILY_EP_CAP - (todayEP._sum.amount || 0),
      activeEmblem: activeEmblem?.emblemType || 'bolt',
      lastConversion: profile.lastConversion
    };
  }

  /**
   * Get emblem name
   */
  static getEmblemName(emblemType: string): string {
    const names: Record<string, string> = {
      bolt: 'Lightning Bolt',
      heart: 'Heart of Energy',
      comet: 'Cosmic Comet',
      wave: 'Energy Wave'
    };
    return names[emblemType] || 'Unknown';
  }

  /**
   * Get emblem description
   */
  static getEmblemDescription(emblemType: string): string {
    const descriptions: Record<string, string> = {
      bolt: 'The classic energy symbol - quick and powerful',
      heart: 'Warm, steady energy that flows from within',
      comet: 'Rare bursts of cosmic energy and inspiration',
      wave: 'Flowing, rhythmic energy that builds momentum'
    };
    return descriptions[emblemType] || 'Unknown emblem';
  }

  /**
   * Get emblem unlock condition
   */
  static getEmblemUnlockCondition(emblemType: string): string {
    const conditions: Record<string, string> = {
      bolt: 'Default emblem',
      heart: 'Reach 70+ energy for 3 consecutive days',
      comet: 'Earn 500+ EP in a single day',
      wave: 'Complete 50+ daily challenges'
    };
    return conditions[emblemType] || 'Unknown condition';
  }

  /**
   * Check and unlock emblems based on user progress
   */
  static async checkAndUnlockEmblems(userId: string) {
    const profile = await this.getOrCreateEnergyProfile(userId);
    const emblems = await prisma.energyEmblem.findMany({
      where: { userId }
    });

    const unlockedEmblems: string[] = [];

    for (const emblem of emblems) {
      if (emblem.isUnlocked) continue;

      let shouldUnlock = false;

      switch (emblem.emblemType) {
        case 'heart':
          // Check for 3 consecutive days with 70+ energy
          shouldUnlock = await this.checkHeartEmblemCondition(userId);
          break;
        case 'comet':
          // Check for 500+ EP in a single day
          shouldUnlock = await this.checkCometEmblemCondition(userId);
          break;
        case 'wave':
          // Check for 50+ completed challenges
          shouldUnlock = await this.checkWaveEmblemCondition(userId);
          break;
      }

      if (shouldUnlock) {
        await prisma.energyEmblem.update({
          where: { id: emblem.id },
          data: {
            isUnlocked: true,
            unlockedAt: new Date()
          }
        });
        unlockedEmblems.push(emblem.emblemType);
      }
    }

    if (unlockedEmblems.length > 0) {
      logger.info('New emblems unlocked', { userId, unlockedEmblems });
    }

    return unlockedEmblems;
  }

  /**
   * Check heart emblem condition (3 consecutive days with 70+ energy)
   */
  private static async checkHeartEmblemCondition(userId: string): Promise<boolean> {
    // This would require energy history tracking
    // For now, return false as we need to implement energy history
    return false;
  }

  /**
   * Check comet emblem condition (500+ EP in a single day)
   */
  private static async checkCometEmblemCondition(userId: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEP = await prisma.energyPoint.aggregate({
      where: {
        userId,
        earnedAt: {
          gte: today,
          lt: tomorrow
        }
      },
      _sum: {
        amount: true
      }
    });

    return (todayEP._sum.amount || 0) >= 500;
  }

  /**
   * Check wave emblem condition (50+ completed challenges)
   */
  private static async checkWaveEmblemCondition(userId: string): Promise<boolean> {
    const completedChallenges = await prisma.dailyChallenge.count({
      where: {
        userId,
        isCompleted: true
      }
    });

    return completedChallenges >= 50;
  }
}

export default EnergyEngineService;
