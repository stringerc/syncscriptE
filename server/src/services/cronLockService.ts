/**
 * Cron Lock Service
 * 
 * Provides advisory database locks to prevent concurrent execution of cron jobs
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { getCurrentTraceContext, logWithTrace } from './traceService';
import { metricsService } from './metricsService';

const prisma = new PrismaClient();

export interface CronLock {
  id: string;
  jobName: string;
  lockedBy: string;
  lockedAt: Date;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Acquire an advisory lock for a cron job
 */
export async function acquireCronLock(
  jobName: string,
  lockDurationMinutes: number = 30,
  metadata?: Record<string, any>
): Promise<CronLock | null> {
  const traceContext = getCurrentTraceContext();
  const lockId = `${jobName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const lockedBy = traceContext?.traceId || 'unknown';
  const lockedAt = new Date();
  const expiresAt = new Date(lockedAt.getTime() + lockDurationMinutes * 60 * 1000);

  try {
    // Use a transaction to ensure atomic lock acquisition
    const result = await prisma.$transaction(async (tx) => {
      // Check for existing active locks
      const existingLocks = await tx.$queryRaw`
        SELECT * FROM cron_locks 
        WHERE jobName = ${jobName} 
        AND expiresAt > datetime('now')
      `;

      if (Array.isArray(existingLocks) && existingLocks.length > 0) {
        logWithTrace('warn', 'Cron job already locked', {
          jobName,
          existingLocks: existingLocks.length,
          lockId
        });
        metricsService.recordCronLockAcquireFail(jobName, 'already_locked');
        return null;
      }

      // Clean up expired locks
      await tx.$executeRaw`
        DELETE FROM cron_locks 
        WHERE jobName = ${jobName} 
        AND expiresAt <= datetime('now')
      `;

      // Acquire new lock
      const lock = await tx.$queryRaw`
        INSERT INTO cron_locks (id, jobName, lockedBy, lockedAt, expiresAt, metadata)
        VALUES (${lockId}, ${jobName}, ${lockedBy}, ${lockedAt.toISOString()}, ${expiresAt.toISOString()}, ${JSON.stringify(metadata || {})})
        RETURNING *
      `;

      return Array.isArray(lock) ? lock[0] : lock;
    });

    if (result) {
      logWithTrace('info', 'Cron lock acquired', {
        jobName,
        lockId,
        lockedBy,
        expiresAt
      });
      metricsService.recordCronLockAcquireSuccess(jobName);
    }

    return result as CronLock | null;

  } catch (error) {
    logWithTrace('error', 'Failed to acquire cron lock', {
      jobName,
      lockId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    metricsService.recordCronLockAcquireFail(jobName, 'error');
    throw error;
  }
}

/**
 * Release a cron lock
 */
export async function releaseCronLock(lockId: string): Promise<boolean> {
  const traceContext = getCurrentTraceContext();
  
  try {
    const result = await prisma.$executeRaw`
      DELETE FROM cron_locks 
      WHERE id = ${lockId}
    `;

    const released = result > 0;
    
    if (released) {
      logWithTrace('info', 'Cron lock released', {
        lockId,
        releasedBy: traceContext?.traceId || 'unknown'
      });
      
      // Record lock duration if we can find the original lock
      try {
        const originalLock = await prisma.cronLock.findUnique({
          where: { id: lockId }
        });
        if (originalLock) {
          const durationSeconds = (Date.now() - originalLock.lockedAt.getTime()) / 1000;
          metricsService.recordCronLockHeldDuration(originalLock.jobName, durationSeconds);
        }
      } catch (durationError) {
        // Don't fail the release if we can't record duration
        logWithTrace('warn', 'Failed to record lock duration', { lockId, error: durationError });
      }
    } else {
      logWithTrace('warn', 'Cron lock not found or already released', {
        lockId
      });
    }

    return released;

  } catch (error) {
    logWithTrace('error', 'Failed to release cron lock', {
      lockId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Extend a cron lock
 */
export async function extendCronLock(
  lockId: string,
  additionalMinutes: number = 30
): Promise<boolean> {
  const traceContext = getCurrentTraceContext();
  const newExpiresAt = new Date(Date.now() + additionalMinutes * 60 * 1000);

  try {
    const result = await prisma.$executeRaw`
      UPDATE cron_locks 
      SET expiresAt = ${newExpiresAt.toISOString()}
      WHERE id = ${lockId} 
      AND expiresAt > datetime('now')
    `;

    const extended = result > 0;
    
    if (extended) {
      logWithTrace('info', 'Cron lock extended', {
        lockId,
        newExpiresAt,
        extendedBy: traceContext?.traceId || 'unknown'
      });
    } else {
      logWithTrace('warn', 'Cron lock not found or expired', {
        lockId
      });
    }

    return extended;

  } catch (error) {
    logWithTrace('error', 'Failed to extend cron lock', {
      lockId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Get active locks for a job
 */
export async function getActiveLocks(jobName?: string): Promise<CronLock[]> {
  try {
    let query = `
      SELECT * FROM cron_locks 
      WHERE expiresAt > datetime('now')
    `;
    
    const params: any[] = [];
    
    if (jobName) {
      query += ` AND jobName = $1`;
      params.push(jobName);
    }
    
    query += ` ORDER BY lockedAt DESC`;

    const locks = await prisma.$queryRawUnsafe(query, ...params);
    return Array.isArray(locks) ? locks as CronLock[] : [];

  } catch (error) {
    logWithTrace('error', 'Failed to get active locks', {
      jobName,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Clean up expired locks (run periodically)
 */
export async function cleanupExpiredLocks(): Promise<number> {
  try {
    const result = await prisma.$executeRaw`
      DELETE FROM cron_locks 
      WHERE expiresAt <= datetime('now')
    `;

    logWithTrace('info', 'Expired cron locks cleaned up', {
      count: result
    });

    return result;

  } catch (error) {
    logWithTrace('error', 'Failed to cleanup expired locks', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Execute a function with a cron lock
 */
export async function withCronLock<T>(
  jobName: string,
  fn: () => Promise<T>,
  lockDurationMinutes: number = 30,
  metadata?: Record<string, any>
): Promise<T | null> {
  const lock = await acquireCronLock(jobName, lockDurationMinutes, metadata);
  
  if (!lock) {
    logWithTrace('info', 'Cron job skipped - already running', {
      jobName
    });
    return null;
  }

  try {
    const result = await fn();
    return result;
  } finally {
    await releaseCronLock(lock.id);
  }
}

/**
 * Execute a function with a cron lock and auto-extension
 */
export async function withCronLockAutoExtend<T>(
  jobName: string,
  fn: (extendLock: () => Promise<boolean>) => Promise<T>,
  lockDurationMinutes: number = 30,
  extensionIntervalMinutes: number = 10,
  metadata?: Record<string, any>
): Promise<T | null> {
  const lock = await acquireCronLock(jobName, lockDurationMinutes, metadata);
  
  if (!lock) {
    logWithTrace('info', 'Cron job skipped - already running', {
      jobName
    });
    return null;
  }

  let extensionTimer: NodeJS.Timeout | null = null;

  try {
    // Set up auto-extension
    const extendLock = async (): Promise<boolean> => {
      return await extendCronLock(lock.id, lockDurationMinutes);
    };

    // Start auto-extension timer
    extensionTimer = setInterval(async () => {
      try {
        await extendLock();
      } catch (error) {
        logWithTrace('error', 'Failed to auto-extend cron lock', {
          lockId: lock.id,
          jobName,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }, extensionIntervalMinutes * 60 * 1000);

    const result = await fn(extendLock);
    return result;
  } finally {
    if (extensionTimer) {
      clearInterval(extensionTimer);
    }
    await releaseCronLock(lock.id);
  }
}
