import { subHours } from 'date-fns';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export async function cleanupStaleHolds() {
  try {
    // Use advisory lock to prevent concurrent cleanup runs
    const lockResult = await prisma.$queryRaw`
      SELECT pg_try_advisory_lock(12345) as acquired
    ` as [{ acquired: boolean }];

    if (!lockResult[0]?.acquired) {
      logger.info('APL cleanup already running, skipping');
      return 0;
    }

    try {
      const threshold = subHours(new Date(), 48);
      const result = await prisma.tentativeHold.updateMany({
        where: { 
          status: 'suggested', 
          startsAt: { lt: threshold } 
        },
        data: { status: 'dismissed' },
      });

      logger.info('APL cleanup completed', { 
        dismissedCount: result.count,
        threshold: threshold.toISOString()
      });

      return result.count;
    } finally {
      // Release the advisory lock
      await prisma.$queryRaw`SELECT pg_advisory_unlock(12345)`;
    }
  } catch (error) {
    logger.error('APL cleanup failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}

// For SQLite (fallback if PostgreSQL advisory locks not available)
export async function cleanupStaleHoldsSQLite() {
  try {
    const threshold = subHours(new Date(), 48);
    const result = await prisma.tentativeHold.updateMany({
      where: { 
        status: 'suggested', 
        startsAt: { lt: threshold } 
      },
      data: { status: 'dismissed' },
    });

    logger.info('APL cleanup completed (SQLite)', { 
      dismissedCount: result.count,
      threshold: threshold.toISOString()
    });

    return result.count;
  } catch (error) {
    logger.error('APL cleanup failed (SQLite)', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}
