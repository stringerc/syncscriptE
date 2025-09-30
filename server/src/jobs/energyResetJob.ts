import { PrismaClient } from '@prisma/client';
import { EnergyEngineService } from '../services/energyEngineService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Daily Energy Reset Job
 * Runs at midnight to:
 * 1. Convert yesterday's EP to Energy
 * 2. Reset energy to 0 for the new day
 * 3. Reset active emblem animations
 */
export async function runDailyEnergyReset() {
  try {
    logger.info('🌙 Starting daily energy reset job...');

    // Get all users with energy profiles
    const users = await prisma.userEnergyProfile.findMany({
      select: { userId: true }
    });

    logger.info(`Processing ${users.length} users for energy reset`);

    let successCount = 0;
    let errorCount = 0;

    for (const { userId } of users) {
      try {
        // Step 1: Convert yesterday's EP to energy (for historical tracking)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        await EnergyEngineService.convertEPToEnergy(userId, yesterday);

        // Step 2: Reset current energy to 0 for the new day
        await prisma.userEnergyProfile.update({
          where: { userId },
          data: {
            currentEnergy: 0,
            energyLevel: 0,
            updatedAt: new Date()
          }
        });

        // Step 3: Skip energyHistory logging for now (table may not exist yet)

        successCount++;
        logger.info(`✅ Reset energy for user ${userId}`);
      } catch (error) {
        errorCount++;
        logger.error(`❌ Failed to reset energy for user ${userId}`, { error });
      }
    }

    logger.info(`🎉 Daily energy reset complete! Success: ${successCount}, Errors: ${errorCount}`);
    
    return { success: successCount, errors: errorCount };
  } catch (error) {
    logger.error('💥 Critical error in daily energy reset job', { error });
    throw error;
  }
}

/**
 * Real-time EP to Energy conversion
 * Called whenever a user earns EP to update their energy immediately
 */
export async function updateUserEnergyInRealtime(userId: string, epAmount: number) {
  try {
    const profile = await EnergyEngineService.getOrCreateEnergyProfile(userId);
    
    // Get today's total EP
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

    const totalEP = todayEP._sum.amount || 0;

    // Convert to energy (0-100 scale) with diminishing returns
    let currentEnergy: number;
    if (totalEP <= EnergyEngineService.DIMINISHING_RETURNS_THRESHOLD) {
      currentEnergy = totalEP * EnergyEngineService.BASE_CONVERSION_RATE;
    } else {
      const baseEnergy = EnergyEngineService.DIMINISHING_RETURNS_THRESHOLD * EnergyEngineService.BASE_CONVERSION_RATE;
      const excess = totalEP - EnergyEngineService.DIMINISHING_RETURNS_THRESHOLD;
      const diminishedEnergy = excess * (EnergyEngineService.BASE_CONVERSION_RATE * 0.5);
      currentEnergy = baseEnergy + diminishedEnergy;
    }

    // Cap at 100
    currentEnergy = Math.min(currentEnergy, 100);
    
    // Convert to 0-10 scale for display
    const energyLevel = Math.round(currentEnergy / 10);

    // Update profile
    await prisma.userEnergyProfile.update({
      where: { userId },
      data: {
        currentEnergy: Math.round(currentEnergy),
        energyLevel,
        updatedAt: new Date()
      }
    });

    logger.info(`⚡ Real-time energy update for user ${userId}: ${energyLevel}/10 (${currentEnergy}/100)`);

    return { currentEnergy, energyLevel };
  } catch (error) {
    logger.error('Failed to update user energy in real-time', { userId, error });
    throw error;
  }
}

