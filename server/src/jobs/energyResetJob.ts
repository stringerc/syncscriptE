import { PrismaClient } from '@prisma/client';
import { EnergyEngineService } from '../services/energyEngineService';
import { resetAllUsersEnergy } from '../services/dailyEnergyResetService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Daily Energy Reset Job (Legacy - now uses new service)
 * @deprecated Use resetAllUsersEnergy from dailyEnergyResetService instead
 */
export async function runDailyEnergyReset() {
  logger.warn('Using legacy energy reset job - consider migrating to dailyEnergyResetService');
  return await resetAllUsersEnergy();
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

