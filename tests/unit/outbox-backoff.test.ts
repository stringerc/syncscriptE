/**
 * Outbox Backoff and Dead-Letter Tests
 * 
 * Tests the jittered exponential backoff and dead-letter functionality
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { processPendingEvents, registerEventHandler } from '../../server/src/workers/eventDispatcher';
import { publishEvent } from '../../server/src/services/eventService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Outbox Backoff and Dead-Letter', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.eventDelivery.deleteMany();
    await prisma.outbox.deleteMany();
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.eventDelivery.deleteMany();
    await prisma.outbox.deleteMany();
  });

  test('should retry failed events with jittered exponential backoff', async () => {
    // Register a handler that always fails
    registerEventHandler('TestEvent', async () => {
      throw new Error('Simulated failure');
    });

    // Publish a test event
    await publishEvent('TestEvent', 'Test', 'test-id', { test: 'data' });

    // Process the event (should fail and schedule retry)
    const result1 = await processPendingEvents();
    expect(result1.processed).toBe(0);
    expect(result1.failed).toBe(1);
    expect(result1.deadLettered).toBe(0);

    // Check that the event is scheduled for retry
    const outboxEvent = await prisma.outbox.findFirst({
      where: { eventType: 'TestEvent' }
    });

    expect(outboxEvent).toBeTruthy();
    expect(outboxEvent?.status).toBe('pending');
    expect(outboxEvent?.attempts).toBe(1);
    expect(outboxEvent?.nextRetryAt).toBeTruthy();

    // Verify the retry delay is within expected range (100ms + jitter)
    const now = new Date();
    const retryTime = outboxEvent?.nextRetryAt;
    const delay = retryTime ? retryTime.getTime() - now.getTime() : 0;
    
    // Should be between 100ms and 150ms (100ms base + up to 50ms jitter)
    expect(delay).toBeGreaterThanOrEqual(100);
    expect(delay).toBeLessThanOrEqual(150);
  }, 10000);

  test('should move events to dead letter after max retries', async () => {
    // Register a handler that always fails
    registerEventHandler('DeadLetterTest', async () => {
      throw new Error('Persistent failure');
    });

    // Publish a test event
    await publishEvent('DeadLetterTest', 'Test', 'dead-letter-test', { test: 'data' });

    // Simulate multiple retry attempts by manually updating attempts
    for (let i = 0; i < 5; i++) {
      await processPendingEvents();
      
      // Manually increment attempts to simulate max retries
      await prisma.outbox.updateMany({
        where: { eventType: 'DeadLetterTest' },
        data: { attempts: i + 1 }
      });
    }

    // Process one more time - should move to dead letter
    const result = await processPendingEvents();
    expect(result.deadLettered).toBe(1);

    // Check that the event is in dead letter status
    const deadLetterEvent = await prisma.outbox.findFirst({
      where: { eventType: 'DeadLetterTest' }
    });

    expect(deadLetterEvent?.status).toBe('dead_letter');
    expect(deadLetterEvent?.attempts).toBe(5);
  }, 15000);

  test('should successfully process events after retry', async () => {
    let attemptCount = 0;
    
    // Register a handler that fails twice then succeeds
    registerEventHandler('RetrySuccessTest', async () => {
      attemptCount++;
      if (attemptCount <= 2) {
        throw new Error(`Attempt ${attemptCount} failed`);
      }
      // Success on third attempt
    });

    // Publish a test event
    await publishEvent('RetrySuccessTest', 'Test', 'retry-success-test', { test: 'data' });

    // First attempt - should fail
    const result1 = await processPendingEvents();
    expect(result1.processed).toBe(0);
    expect(result1.failed).toBe(1);

    // Second attempt - should fail
    const result2 = await processPendingEvents();
    expect(result2.processed).toBe(0);
    expect(result2.failed).toBe(1);

    // Third attempt - should succeed
    const result3 = await processPendingEvents();
    expect(result3.processed).toBe(1);
    expect(result3.failed).toBe(0);

    // Check that the event is marked as delivered
    const deliveredEvent = await prisma.outbox.findFirst({
      where: { eventType: 'RetrySuccessTest' }
    });

    expect(deliveredEvent?.status).toBe('delivered');
  }, 15000);

  test('should handle events with no handler gracefully', async () => {
    // Publish an event with no registered handler
    await publishEvent('NoHandlerEvent', 'Test', 'no-handler-test', { test: 'data' });

    // Process the event
    const result = await processPendingEvents();
    expect(result.processed).toBe(0);
    expect(result.failed).toBe(0); // No handler events don't retry
    expect(result.deadLettered).toBe(1);

    // Check that the event is marked as delivered (but failed)
    const event = await prisma.outbox.findFirst({
      where: { eventType: 'NoHandlerEvent' }
    });

    expect(event?.status).toBe('delivered'); // No handler events are marked as delivered
  }, 10000);

  test('should respect nextRetryAt timing', async () => {
    // Register a handler that always fails
    registerEventHandler('TimingTest', async () => {
      throw new Error('Timing test failure');
    });

    // Publish a test event
    await publishEvent('TimingTest', 'Test', 'timing-test', { test: 'data' });

    // Process the event (should fail and schedule retry)
    await processPendingEvents();

    // Check that nextRetryAt is in the future
    const outboxEvent = await prisma.outbox.findFirst({
      where: { eventType: 'TimingTest' }
    });

    expect(outboxEvent?.nextRetryAt).toBeTruthy();
    expect(outboxEvent?.nextRetryAt!.getTime()).toBeGreaterThan(Date.now());
  }, 10000);
});
