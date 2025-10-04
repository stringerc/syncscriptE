/**
 * Cron Locks Tests
 * 
 * Tests the advisory database lock functionality for cron jobs
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  acquireCronLock, 
  releaseCronLock, 
  withCronLock, 
  getActiveLocks,
  cleanupExpiredLocks 
} from '../../server/src/services/cronLockService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Cron Locks', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.$executeRaw`DELETE FROM cron_locks`;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.$executeRaw`DELETE FROM cron_locks`;
  });

  test('should acquire and release a cron lock', async () => {
    const jobName = 'test-job';
    const lockDurationMinutes = 5;

    // Acquire lock
    const lock = await acquireCronLock(jobName, lockDurationMinutes, { test: 'data' });
    
    expect(lock).toBeTruthy();
    expect(lock?.jobName).toBe(jobName);
    expect(lock?.metadata).toBe(JSON.stringify({ test: 'data' }));
    expect(lock?.expiresAt.getTime()).toBeGreaterThan(Date.now());

    // Verify lock is active
    const activeLocks = await getActiveLocks(jobName);
    expect(activeLocks).toHaveLength(1);
    expect(activeLocks[0].id).toBe(lock?.id);

    // Release lock
    const released = await releaseCronLock(lock!.id);
    expect(released).toBe(true);

    // Verify lock is no longer active
    const activeLocksAfter = await getActiveLocks(jobName);
    expect(activeLocksAfter).toHaveLength(0);
  }, 10000);

  test('should prevent concurrent execution of the same job', async () => {
    const jobName = 'concurrent-test-job';
    const lockDurationMinutes = 5;

    // Acquire first lock
    const lock1 = await acquireCronLock(jobName, lockDurationMinutes);
    expect(lock1).toBeTruthy();

    // Try to acquire second lock for same job
    const lock2 = await acquireCronLock(jobName, lockDurationMinutes);
    expect(lock2).toBeNull(); // Should fail

    // Release first lock
    await releaseCronLock(lock1!.id);

    // Now should be able to acquire lock
    const lock3 = await acquireCronLock(jobName, lockDurationMinutes);
    expect(lock3).toBeTruthy();
    expect(lock3?.id).not.toBe(lock1?.id);

    // Clean up
    await releaseCronLock(lock3!.id);
  }, 10000);

  test('should allow different jobs to run concurrently', async () => {
    const job1Name = 'job-1';
    const job2Name = 'job-2';
    const lockDurationMinutes = 5;

    // Acquire locks for different jobs
    const lock1 = await acquireCronLock(job1Name, lockDurationMinutes);
    const lock2 = await acquireCronLock(job2Name, lockDurationMinutes);

    expect(lock1).toBeTruthy();
    expect(lock2).toBeTruthy();
    expect(lock1?.id).not.toBe(lock2?.id);

    // Both should be active
    const allActiveLocks = await getActiveLocks();
    expect(allActiveLocks).toHaveLength(2);

    // Clean up
    await releaseCronLock(lock1!.id);
    await releaseCronLock(lock2!.id);
  }, 10000);

  test('should execute function with cron lock', async () => {
    const jobName = 'function-test-job';
    let executed = false;

    const result = await withCronLock(
      jobName,
      async () => {
        executed = true;
        return 'success';
      },
      5,
      { test: 'function' }
    );

    expect(result).toBe('success');
    expect(executed).toBe(true);

    // Lock should be automatically released
    const activeLocks = await getActiveLocks(jobName);
    expect(activeLocks).toHaveLength(0);
  }, 10000);

  test('should skip execution if job is already locked', async () => {
    const jobName = 'skip-test-job';
    let executed = false;

    // Acquire lock manually
    const lock = await acquireCronLock(jobName, 5);
    expect(lock).toBeTruthy();

    // Try to execute with lock - should be skipped
    const result = await withCronLock(
      jobName,
      async () => {
        executed = true;
        return 'should not execute';
      },
      5
    );

    expect(result).toBeNull();
    expect(executed).toBe(false);

    // Clean up
    await releaseCronLock(lock!.id);
  }, 10000);

  test('should handle lock expiration', async () => {
    const jobName = 'expiration-test-job';
    const lockDurationMinutes = 0.01; // 0.6 seconds

    // Acquire lock with short duration
    const lock = await acquireCronLock(jobName, lockDurationMinutes);
    expect(lock).toBeTruthy();

    // Wait for lock to expire
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Should be able to acquire new lock
    const newLock = await acquireCronLock(jobName, 5);
    expect(newLock).toBeTruthy();
    expect(newLock?.id).not.toBe(lock?.id);

    // Clean up
    await releaseCronLock(newLock!.id);
  }, 15000);

  test('should cleanup expired locks', async () => {
    const jobName = 'cleanup-test-job';

    // Create an expired lock manually
    const expiredLockId = 'expired-lock';
    await prisma.$executeRaw`
      INSERT INTO cron_locks (id, job_name, locked_by, locked_at, expires_at, metadata)
      VALUES (${expiredLockId}, ${jobName}, 'test', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 minutes', '{}')
    `;

    // Create an active lock
    const activeLock = await acquireCronLock(jobName, 5);
    expect(activeLock).toBeTruthy();

    // Run cleanup
    const cleanedCount = await cleanupExpiredLocks();
    expect(cleanedCount).toBe(1);

    // Active lock should still exist
    const activeLocks = await getActiveLocks(jobName);
    expect(activeLocks).toHaveLength(1);
    expect(activeLocks[0].id).toBe(activeLock?.id);

    // Clean up
    await releaseCronLock(activeLock!.id);
  }, 10000);

  test('should handle double-runner scenario', async () => {
    const jobName = 'double-runner-test';
    
    // Simulate two runners trying to execute the same job
    const runner1 = withCronLock(jobName, async () => {
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 100));
      return 'runner1';
    }, 1);

    const runner2 = withCronLock(jobName, async () => {
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 100));
      return 'runner2';
    }, 1);

    // Both should complete, but only one should actually execute
    const [result1, result2] = await Promise.all([runner1, runner2]);
    
    // One should return a result, the other should be null
    const results = [result1, result2].filter(r => r !== null);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatch(/^runner[12]$/);

    // No active locks should remain
    const activeLocks = await getActiveLocks(jobName);
    expect(activeLocks).toHaveLength(0);
  }, 10000);
});
