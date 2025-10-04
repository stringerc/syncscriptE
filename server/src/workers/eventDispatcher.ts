import { logger } from '../utils/logger';
import { getPendingEvents, markEventDelivered } from '../services/eventService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Event handlers - these would be registered by each domain
const eventHandlers: Record<string, (payload: any) => Promise<void>> = {};

/**
 * Register an event handler for a specific event type
 */
export function registerEventHandler(eventType: string, handler: (payload: any) => Promise<void>): void {
  eventHandlers[eventType] = handler;
  logger.info('Event handler registered', { eventType });
}

/**
 * Process a single event
 */
async function processEvent(event: any): Promise<void> {
  const { eventId, eventType, payload } = event;
  
  try {
    const handler = eventHandlers[eventType];
    if (!handler) {
      logger.warn('No handler found for event type', { eventType, eventId });
      await markEventDelivered(eventId, 'internal', false, `No handler for event type: ${eventType}`);
      return;
    }
    
    const parsedPayload = JSON.parse(payload);
    await handler(parsedPayload);
    
    await markEventDelivered(eventId, 'internal', true);
    logger.info('Event processed successfully', { eventId, eventType });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to process event', { eventId, eventType, error: errorMessage });
    await markEventDelivered(eventId, 'internal', false, errorMessage);
  }
}

/**
 * Process all pending events
 */
export async function processPendingEvents(): Promise<{ processed: number; failed: number }> {
  const events = await getPendingEvents(50); // Process up to 50 events at a time
  
  if (events.length === 0) {
    return { processed: 0, failed: 0 };
  }
  
  logger.info('Processing pending events', { count: events.length });
  
  let processed = 0;
  let failed = 0;
  
  for (const event of events) {
    try {
      await processEvent(event);
      processed++;
    } catch (error) {
      failed++;
      logger.error('Failed to process event', { 
        eventId: event.eventId, 
        eventType: event.eventType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  logger.info('Event processing complete', { processed, failed, total: events.length });
  return { processed, failed };
}

/**
 * Start the event dispatcher worker
 */
export function startEventDispatcher(intervalMs: number = 5000): NodeJS.Timeout {
  logger.info('Starting event dispatcher', { intervalMs });
  
  // Process events immediately on start
  processPendingEvents().catch(error => {
    logger.error('Error in initial event processing', { error: error instanceof Error ? error.message : 'Unknown error' });
  });
  
  // Then process every interval
  return setInterval(async () => {
    try {
      await processPendingEvents();
    } catch (error) {
      logger.error('Error in event dispatcher', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }, intervalMs);
}

/**
 * Stop the event dispatcher worker
 */
export function stopEventDispatcher(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId);
  logger.info('Event dispatcher stopped');
}

// Register default handlers for core events
registerEventHandler('TaskCompleted', async (payload) => {
  logger.info('Task completed event received', { taskId: payload.taskId, userId: payload.userId });
  // This would trigger energy updates, achievement checks, etc.
});

registerEventHandler('ScriptApplied', async (payload) => {
  logger.info('Script applied event received', { scriptId: payload.scriptId, userId: payload.userId });
  // This would trigger analytics, usage tracking, etc.
});

registerEventHandler('CalendarWriteRequested', async (payload) => {
  logger.info('Calendar write requested event received', { 
    userId: payload.userId, 
    provider: payload.provider,
    operation: payload.operation 
  });
  // This would trigger the actual calendar write operation
});

registerEventHandler('EnergySnapshotCreated', async (payload) => {
  logger.info('Energy snapshot created event received', { 
    userId: payload.userId, 
    snapshotDate: payload.snapshotDate 
  });
  // This would trigger analytics, reporting, etc.
});
