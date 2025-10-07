import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { eventService } from '../../server/src/services/eventService';

const prisma = new PrismaClient();

describe('APL Shadow Wiring', () => {
  let testUserId: string;
  let testEventId: string;
  let testScriptId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: 'shadow-test@example.com',
        name: 'Shadow Test User',
        role: 'user'
      }
    });
    testUserId = user.id;

    // Create test event
    const event = await prisma.event.create({
      data: {
        id: uuidv4(),
        title: 'Shadow Test Event',
        description: 'Test event for shadow wiring',
        startTime: new Date(Date.now() + 3600 * 1000),
        endTime: new Date(Date.now() + 3600 * 1000 + 30 * 60 * 1000),
        userId: testUserId,
        isAllDay: false
      }
    });
    testEventId = event.id;

    // Create test script
    const script = await prisma.script.create({
      data: {
        id: uuidv4(),
        name: 'Shadow Test Script',
        description: 'Test script for shadow wiring',
        content: 'Test script content',
        userId: testUserId
      }
    });
    testScriptId = script.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.outbox.deleteMany({ where: { eventType: 'AplSuggestRequested' } });
    await prisma.script.deleteMany({ where: { id: testScriptId } });
    await prisma.event.deleteMany({ where: { id: testEventId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  describe('ScriptApplied event triggers APL suggest', () => {
    it('should enqueue AplSuggestRequested when ScriptApplied is published', async () => {
      const scriptAppliedEvent = {
        scriptId: testScriptId,
        userId: testUserId,
        eventId: testEventId,
        tasksCreated: 3,
        eventsCreated: 1,
        appliedAt: new Date()
      };

      // Publish ScriptApplied event
      await eventService.publishEvent('ScriptApplied', 'Script', testScriptId, scriptAppliedEvent);

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check outbox for AplSuggestRequested event
      const outboxEvents = await prisma.outbox.findMany({
        where: {
          eventType: 'AplSuggestRequested',
          aggregateId: testEventId
        }
      });

      expect(outboxEvents).toHaveLength(1);
      expect(outboxEvents[0].status).toBe('pending');

      // Verify payload structure
      const payload = JSON.parse(outboxEvents[0].payload);
      expect(payload).toMatchObject({
        userId: testUserId,
        eventId: testEventId,
        key: expect.stringMatching(/^evt:.*:v\d+:step:\d+$/)
      });
    });

    it('should not create duplicate AplSuggestRequested for same event', async () => {
      const scriptAppliedEvent = {
        scriptId: testScriptId,
        userId: testUserId,
        eventId: testEventId,
        tasksCreated: 2,
        eventsCreated: 0,
        appliedAt: new Date()
      };

      // Publish same ScriptApplied event again
      await eventService.publishEvent('ScriptApplied', 'Script', testScriptId, scriptAppliedEvent);

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should still only have 1 AplSuggestRequested event
      const outboxEvents = await prisma.outbox.findMany({
        where: {
          eventType: 'AplSuggestRequested',
          aggregateId: testEventId
        }
      });

      expect(outboxEvents).toHaveLength(1);
    });
  });

  describe('EventCreated event triggers APL suggest', () => {
    let newEventId: string;

    beforeAll(async () => {
      // Create a new event for this test
      const event = await prisma.event.create({
        data: {
          id: uuidv4(),
          title: 'New Event for Shadow Test',
          description: 'New event for shadow wiring',
          startTime: new Date(Date.now() + 7200 * 1000), // 2 hours from now
          endTime: new Date(Date.now() + 7200 * 1000 + 60 * 60 * 1000), // 1 hour duration
          userId: testUserId,
          isAllDay: false
        }
      });
      newEventId = event.id;
    });

    afterAll(async () => {
      await prisma.outbox.deleteMany({ where: { aggregateId: newEventId } });
      await prisma.event.deleteMany({ where: { id: newEventId } });
    });

    it('should enqueue AplSuggestRequested when EventCreated is published', async () => {
      const eventCreatedEvent = {
        eventId: newEventId,
        userId: testUserId,
        title: 'New Event for Shadow Test',
        startTime: new Date(Date.now() + 7200 * 1000),
        endTime: new Date(Date.now() + 7200 * 1000 + 60 * 60 * 1000),
        createdAt: new Date()
      };

      // Publish EventCreated event
      await eventService.publishEvent('EventCreated', 'Event', newEventId, eventCreatedEvent);

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check outbox for AplSuggestRequested event
      const outboxEvents = await prisma.outbox.findMany({
        where: {
          eventType: 'AplSuggestRequested',
          aggregateId: newEventId
        }
      });

      expect(outboxEvents).toHaveLength(1);
      expect(outboxEvents[0].status).toBe('pending');

      // Verify payload structure
      const payload = JSON.parse(outboxEvents[0].payload);
      expect(payload).toMatchObject({
        userId: testUserId,
        eventId: newEventId,
        key: expect.stringMatching(/^evt:.*:v\d+:step:\d+$/)
      });
    });
  });

  describe('Deduplication key format', () => {
    it('should use consistent deduplication key format', async () => {
      const testEventId2 = uuidv4();
      
      // Create test event
      await prisma.event.create({
        data: {
          id: testEventId2,
          title: 'Dedup Test Event',
          description: 'Test event for deduplication',
          startTime: new Date(Date.now() + 3600 * 1000),
          endTime: new Date(Date.now() + 3600 * 1000 + 30 * 60 * 1000),
          userId: testUserId,
          isAllDay: false
        }
      });

      const scriptAppliedEvent = {
        scriptId: testScriptId,
        userId: testUserId,
        eventId: testEventId2,
        tasksCreated: 1,
        eventsCreated: 0,
        appliedAt: new Date()
      };

      // Publish ScriptApplied event
      await eventService.publishEvent('ScriptApplied', 'Script', testScriptId, scriptAppliedEvent);

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check outbox for AplSuggestRequested event
      const outboxEvents = await prisma.outbox.findMany({
        where: {
          eventType: 'AplSuggestRequested',
          aggregateId: testEventId2
        }
      });

      expect(outboxEvents).toHaveLength(1);

      // Verify deduplication key format
      const payload = JSON.parse(outboxEvents[0].payload);
      const key = payload.key;
      
      // Should match pattern: evt:{eventId}:v{version}:step:{stepId}
      expect(key).toMatch(/^evt:[a-f0-9-]+:v\d+:step:\d+$/);

      // Cleanup
      await prisma.outbox.deleteMany({ where: { aggregateId: testEventId2 } });
      await prisma.event.deleteMany({ where: { id: testEventId2 } });
    });
  });
});
