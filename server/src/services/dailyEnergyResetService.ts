import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { publishEvent, EnergySnapshotCreatedEvent } from './eventService';
import { metricsService } from './metricsService';

const prisma = new PrismaClient();

/**
 * Get user's local date in their timezone
 */
function getUserLocalDate(userTimezone: string): Date {
  const now = new Date();
  if (!userTimezone) {
    // Default to UTC if no timezone
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  
  try {
    // Convert to user's timezone
    const userDate = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
    return new Date(userDate.getFullYear(), userDate.getMonth(), userDate.getDate());
  } catch (error) {
    logger.warn('Invalid timezone, using UTC', { userTimezone, error: error instanceof Error ? error.message : 'Unknown error' });
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}

/**
 * Reset energy for a single user if needed
 */
export async function resetUserEnergyIfNeeded(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { energyProfile: true }
    });
    
    if (!user) {
      logger.warn('User not found for energy reset', { userId });
      return false;
    }
    
    const userLocalDate = getUserLocalDate(user.timezone || 'UTC');
    const lastResetDate = user.lastEnergyResetLocalDate;
    
    // Check if we need to reset (new day)
    if (lastResetDate && lastResetDate.getTime() === userLocalDate.getTime()) {
      return false; // Already reset today
    }
    
    // Get current energy values
    const currentEnergy = user.energyProfile?.currentEnergy || 0;
    const currentEP = user.energyProfile?.epToday || 0;
    
    // Create snapshot of previous day's energy
    const previousDate = new Date(userLocalDate);
    previousDate.setDate(previousDate.getDate() - 1);
    
    await prisma.$transaction(async (tx) => {
      // Create daily snapshot (idempotent due to unique constraint)
      await tx.userEnergyDailySnapshot.upsert({
        where: {
          userId_snapshotDate: {
            userId,
            snapshotDate: previousDate
          }
        },
        create: {
          userId,
          snapshotDate: previousDate,
          energy: currentEnergy,
          epToday: currentEP
        },
        update: {
          energy: currentEnergy,
          epToday: currentEP
        }
      });
      
      // Reset energy to 0
      await tx.user.update({
        where: { id: userId },
        data: {
          lastEnergyResetLocalDate: userLocalDate
        }
      });
      
      // Reset energy profile
      if (user.energyProfile) {
        await tx.userEnergyProfile.update({
          where: { userId },
          data: {
            currentEnergy: 0,
            epToday: 0,
            updatedAt: new Date()
          }
        });
      } else {
        await tx.userEnergyProfile.create({
          data: {
            userId,
            currentEnergy: 0,
            epToday: 0
          }
        });
      }
      
      // Publish event
      const event: EnergySnapshotCreatedEvent = {
        userId,
        snapshotDate: previousDate,
        energy: currentEnergy,
        epToday: currentEP,
        resetAt: new Date()
      };
      
      await publishEvent('EnergySnapshotCreated', 'Energy', userId, event);
    });
    
    logger.info('Energy reset completed for user', { 
      userId, 
      previousDate, 
      snapshotEnergy: currentEnergy, 
      snapshotEP: currentEP 
    });
    
    metricsService.recordEnergyResetRun();
    return true;
    
  } catch (error) {
    logger.error('Failed to reset energy for user', { 
      userId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    metricsService.recordEnergyResetError();
    throw error;
  }
}

/**
 * Reset energy for all users (run by cron job)
 */
export async function resetAllUsersEnergy(): Promise<{ processed: number; reset: number; errors: number }> {
  logger.info('Starting daily energy reset for all users');
  
  const users = await prisma.user.findMany({
    select: { id: true, timezone: true }
  });
  
  let processed = 0;
  let reset = 0;
  let errors = 0;
  
  for (const user of users) {
    try {
      processed++;
      const wasReset = await resetUserEnergyIfNeeded(user.id);
      if (wasReset) {
        reset++;
      }
    } catch (error) {
      errors++;
      logger.error('Error resetting energy for user', { 
        userId: user.id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
  
  logger.info('Daily energy reset complete', { processed, reset, errors });
  return { processed, reset, errors };
}

/**
 * Read-time guard: check and reset energy when reading/modifying energy
 * This ensures energy is reset even if the cron job fails or user is sleeping
 */
export async function ensureEnergyReset(userId: string): Promise<void> {
  try {
    await resetUserEnergyIfNeeded(userId);
  } catch (error) {
    logger.error('Failed to ensure energy reset', { 
      userId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    // Don't throw - this is a guard, not a critical operation
  }
}

/**
 * Get energy snapshot for a specific date
 */
export async function getEnergySnapshot(userId: string, date: Date): Promise<any | null> {
  return await prisma.userEnergyDailySnapshot.findUnique({
    where: {
      userId_snapshotDate: {
        userId,
        snapshotDate: date
      }
    }
  });
}

/**
 * Get energy history for a user
 */
export async function getEnergyHistory(userId: string, days: number = 30): Promise<any[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await prisma.userEnergyDailySnapshot.findMany({
    where: {
      userId,
      snapshotDate: { gte: startDate }
    },
    orderBy: { snapshotDate: 'desc' }
  });
}
