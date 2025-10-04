const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const { PrismaClient } = require('@prisma/client');
const { acquireCronLock, releaseCronLock, cleanupExpiredLocks } = require('../../src/services/cronLockService');

const prisma = new PrismaClient();

describe('CronLock Service', () => {
  const testJobName = 'test-job';
  
  beforeEach(async () => {
    // Clean up any existing locks
    await prisma.cronLock.deleteMany({
      where: { jobName: testJobName }
    });
  });

  afterEach(async () => {
    // Clean up test locks
    await prisma.cronLock.deleteMany({
      where: { jobName: testJobName }
    });
  });

  describe('acquireCronLock', () => {
    it('should acquire a lock successfully', async () => {
      const lock = await acquireCronLock(testJobName, 5); // 5 minutes
      
      expect(lock).not.toBeNull();
      expect(lock?.jobName).toBe(testJobName);
      expect(lock?.lockedBy).toBeDefined();
      expect(lock?.expiresAt).toBeInstanceOf(Date);
      expect(lock?.lockedAt).toBeInstanceOf(Date);
    });

    it('should return null when job is already locked', async () => {
      // Acquire first lock
      const firstLock = await acquireCronLock(testJobName, 5);
      expect(firstLock).not.toBeNull();

      // Try to acquire second lock immediately
      const secondLock = await acquireCronLock(testJobName, 5);
      expect(secondLock).toBeNull();
    });

    it('should allow acquiring lock after expiration', async () => {
      // Acquire lock with very short duration
      const firstLock = await acquireCronLock(testJobName, 0.01); // 0.6 seconds
      expect(firstLock).not.toBeNull();

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Should be able to acquire new lock
      const secondLock = await acquireCronLock(testJobName, 5);
      expect(secondLock).not.toBeNull();
      expect(secondLock?.id).not.toBe(firstLock?.id);
    });

    it('should clean up expired locks before acquiring new one', async () => {
      // Create an expired lock manually
      await prisma.cronLock.create({
        data: {
          id: 'expired-lock',
          jobName: testJobName,
          lockedBy: 'test',
          lockedAt: new Date(Date.now() - 60000), // 1 minute ago
          expiresAt: new Date(Date.now() - 30000), // 30 seconds ago
          metadata: '{}'
        }
      });

      // Acquire new lock - should clean up expired one
      const lock = await acquireCronLock(testJobName, 5);
      expect(lock).not.toBeNull();

      // Verify expired lock was cleaned up
      const expiredLock = await prisma.cronLock.findUnique({
        where: { id: 'expired-lock' }
      });
      expect(expiredLock).toBeNull();
    });

    it('should use correct column names (camelCase)', async () => {
      const lock = await acquireCronLock(testJobName, 5);
      
      // Verify the lock was created with camelCase columns
      const dbLock = await prisma.cronLock.findUnique({
        where: { id: lock?.id }
      });
      
      expect(dbLock).not.toBeNull();
      expect(dbLock?.jobName).toBe(testJobName);
      expect(dbLock?.lockedAt).toBeInstanceOf(Date);
      expect(dbLock?.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe('releaseCronLock', () => {
    it('should release a lock successfully', async () => {
      const lock = await acquireCronLock(testJobName, 5);
      expect(lock).not.toBeNull();

      const released = await releaseCronLock(lock?.id || '');
      expect(released).toBe(true);

      // Verify lock is gone
      const dbLock = await prisma.cronLock.findUnique({
        where: { id: lock?.id || '' }
      });
      expect(dbLock).toBeNull();
    });

    it('should return false for non-existent lock', async () => {
      const released = await releaseCronLock('non-existent-id');
      expect(released).toBe(false);
    });
  });

  describe('cleanupExpiredLocks', () => {
    it('should clean up expired locks', async () => {
      // Create expired lock
      await prisma.cronLock.create({
        data: {
          id: 'expired-1',
          jobName: testJobName,
          lockedBy: 'test',
          lockedAt: new Date(Date.now() - 60000),
          expiresAt: new Date(Date.now() - 30000),
          metadata: '{}'
        }
      });

      // Create active lock
      await prisma.cronLock.create({
        data: {
          id: 'active-1',
          jobName: testJobName,
          lockedBy: 'test',
          lockedAt: new Date(),
          expiresAt: new Date(Date.now() + 300000), // 5 minutes from now
          metadata: '{}'
        }
      });

      const cleanedCount = await cleanupExpiredLocks();
      expect(cleanedCount).toBe(1);

      // Verify only expired lock was removed
      const expiredLock = await prisma.cronLock.findUnique({
        where: { id: 'expired-1' }
      });
      expect(expiredLock).toBeNull();

      const activeLock = await prisma.cronLock.findUnique({
        where: { id: 'active-1' }
      });
      expect(activeLock).not.toBeNull();
    });
  });

  describe('Race Condition Tests', () => {
    it('should handle concurrent lock acquisition', async () => {
      const promises = Array.from({ length: 5 }, () => 
        acquireCronLock(testJobName, 5)
      );

      const results = await Promise.all(promises);
      
      // Only one should succeed
      const successfulLocks = results.filter(lock => lock !== null);
      expect(successfulLocks).toHaveLength(1);
      
      // All others should be null
      const failedLocks = results.filter(lock => lock === null);
      expect(failedLocks).toHaveLength(4);
    });
  });
});
