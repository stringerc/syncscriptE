const { describe, it, expect } = require('@jest/globals');
const { PrismaClient } = require('@prisma/client');
const { acquireCronLock, releaseCronLock } = require('../../../src/services/cronLockService');

const prisma = new PrismaClient();

describe('Cron Lock E2E Race Tests', () => {
  const testJobName = 'energy-reset-race-test';
  
  afterEach(async () => {
    // Clean up test locks
    await prisma.cronLock.deleteMany({
      where: { jobName: testJobName }
    });
  });

  it('should handle parallel energy reset lock acquisition', async () => {
    // Simulate two parallel energy reset jobs trying to acquire the same lock
    const promises = [
      acquireCronLock(testJobName, 30), // 30 minute lock
      acquireCronLock(testJobName, 30)  // Same job, same duration
    ];

    const results = await Promise.all(promises);
    
    // Exactly one should succeed
    const successfulLocks = results.filter(lock => lock !== null);
    expect(successfulLocks).toHaveLength(1);
    
    // The other should fail
    const failedLocks = results.filter(lock => lock === null);
    expect(failedLocks).toHaveLength(1);
    
    // Verify the successful lock has correct properties
    const lock = successfulLocks[0];
    expect(lock?.jobName).toBe(testJobName);
    expect(lock?.lockedBy).toBeDefined();
    expect(lock?.expiresAt.getTime()).toBeGreaterThan(Date.now());
    
    // Clean up
    if (lock) {
      await releaseCronLock(lock.id);
    }
  });

  it('should handle multiple job types acquiring locks simultaneously', async () => {
    const jobTypes = ['energy-reset', 'budget-monitor', 'event-dispatcher'];
    
    // All jobs try to acquire their locks simultaneously
    const promises = jobTypes.map(jobName => 
      acquireCronLock(jobName, 5)
    );

    const results = await Promise.all(promises);
    
    // All should succeed since they're different job names
    const successfulLocks = results.filter(lock => lock !== null);
    expect(successfulLocks).toHaveLength(3);
    
    // Verify each lock has the correct job name
    const lockJobNames = successfulLocks.map(lock => lock?.jobName);
    expect(lockJobNames).toEqual(expect.arrayContaining(jobTypes));
    
    // Clean up
    for (const lock of successfulLocks) {
      if (lock) {
        await releaseCronLock(lock.id);
      }
    }
  });

  it('should handle rapid lock acquisition and release cycles', async () => {
    const cycles = 10;
    const results: Array<{ acquired: boolean; released: boolean }> = [];
    
    for (let i = 0; i < cycles; i++) {
      // Acquire lock
      const lock = await acquireCronLock(testJobName, 1); // 1 minute
      const acquired = lock !== null;
      
      let released = false;
      if (lock) {
        released = await releaseCronLock(lock.id);
      }
      
      results.push({ acquired, released });
      
      // Small delay between cycles
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // All acquisitions should succeed since we release immediately
    const successfulAcquisitions = results.filter(r => r.acquired);
    expect(successfulAcquisitions).toHaveLength(cycles);
    
    // All releases should succeed
    const successfulReleases = results.filter(r => r.released);
    expect(successfulReleases).toHaveLength(cycles);
  });

  it('should maintain lock integrity under high concurrency', async () => {
    const concurrentJobs = 20;
    const promises = Array.from({ length: concurrentJobs }, (_, i) => 
      acquireCronLock(`${testJobName}-${i}`, 5)
    );

    const results = await Promise.all(promises);
    
    // All should succeed since they're different job names
    const successfulLocks = results.filter(lock => lock !== null);
    expect(successfulLocks).toHaveLength(concurrentJobs);
    
    // Verify no duplicate IDs
    const lockIds = successfulLocks.map(lock => lock?.id);
    const uniqueIds = new Set(lockIds);
    expect(uniqueIds.size).toBe(concurrentJobs);
    
    // Clean up all locks
    for (const lock of successfulLocks) {
      if (lock) {
        await releaseCronLock(lock.id);
      }
    }
  });
});
