/**
 * Cron Locks Gate Test
 * 
 * Verifies that simulated double-runner executes once
 */

import { test, expect } from '@playwright/test';

test.describe('Cron Locks Gate', () => {
  test('simulated double-runner executes once', async ({ request }) => {
    // This test would require a test environment with the cron lock system running
    // For now, we'll create a placeholder that documents the expected behavior
    
    // 1. Trigger the daily energy reset job twice simultaneously
    const job1 = request.post('/api/admin/cron/daily-energy-reset', {
      data: { simulate: true }
    });
    
    const job2 = request.post('/api/admin/cron/daily-energy-reset', {
      data: { simulate: true }
    });
    
    // 2. Wait for both to complete
    const [response1, response2] = await Promise.all([job1, job2]);
    
    // 3. Verify that only one actually executed
    const result1 = await response1.json();
    const result2 = await response2.json();
    
    // One should return success, the other should indicate it was skipped
    const results = [result1, result2];
    const executed = results.filter(r => r.success && r.executed);
    const skipped = results.filter(r => r.success && !r.executed);
    
    expect(executed).toHaveLength(1);
    expect(skipped).toHaveLength(1);
    
    // 4. Verify that the lock was properly released
    const locksResponse = await request.get('/api/admin/cron/locks');
    expect(locksResponse.status()).toBe(200);
    
    const locksData = await locksResponse.json();
    const activeLocks = locksData.data.filter((lock: any) => 
      lock.jobName === 'daily-energy-reset' && 
      new Date(lock.expiresAt) > new Date()
    );
    
    expect(activeLocks).toHaveLength(0);
  });
  
  test('cron lock prevents concurrent execution', async ({ request }) => {
    // Test that multiple concurrent requests to the same cron job
    // result in only one execution
    
    const jobName = 'test-concurrent-job';
    const concurrentRequests = Array.from({ length: 5 }, () =>
      request.post('/api/admin/cron/test', {
        data: { jobName, duration: 2000 } // 2 second job
      })
    );
    
    const responses = await Promise.all(concurrentRequests);
    const results = await Promise.all(responses.map(r => r.json()));
    
    // Only one should have executed
    const executed = results.filter(r => r.executed);
    const skipped = results.filter(r => !r.executed);
    
    expect(executed).toHaveLength(1);
    expect(skipped).toHaveLength(4);
    
    // All should return success (either executed or skipped)
    expect(results.every(r => r.success)).toBe(true);
  });
  
  test('different cron jobs can run concurrently', async ({ request }) => {
    // Test that different cron jobs can run at the same time
    
    const job1 = request.post('/api/admin/cron/test', {
      data: { jobName: 'job-1', duration: 1000 }
    });
    
    const job2 = request.post('/api/admin/cron/test', {
      data: { jobName: 'job-2', duration: 1000 }
    });
    
    const [response1, response2] = await Promise.all([job1, job2]);
    const [result1, result2] = await Promise.all([
      response1.json(),
      response2.json()
    ]);
    
    // Both should execute since they're different jobs
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result1.executed).toBe(true);
    expect(result2.executed).toBe(true);
  });
  
  test('cron lock cleanup works', async ({ request }) => {
    // Test that expired locks are properly cleaned up
    
    // Create an expired lock
    await request.post('/api/admin/cron/create-expired-lock', {
      data: { jobName: 'expired-test-job' }
    });
    
    // Trigger cleanup
    const cleanupResponse = await request.post('/api/admin/cron/cleanup-expired');
    expect(cleanupResponse.status()).toBe(200);
    
    const cleanupResult = await cleanupResponse.json();
    expect(cleanupResult.success).toBe(true);
    expect(cleanupResult.cleanedCount).toBeGreaterThan(0);
    
    // Verify no expired locks remain
    const locksResponse = await request.get('/api/admin/cron/locks');
    const locksData = await locksResponse.json();
    
    const expiredLocks = locksData.data.filter((lock: any) => 
      new Date(lock.expiresAt) <= new Date()
    );
    
    expect(expiredLocks).toHaveLength(0);
  });
});
