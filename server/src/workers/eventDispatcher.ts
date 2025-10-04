import { logger } from '../utils/logger';
import { getPendingEvents, markEventDelivered, markEventFailed, moveToDeadLetter } from '../services/eventService';
import { PrismaClient } from '@prisma/client';
import { runWithTraceContext, createTraceContext, logWithTrace } from '../services/traceService';

const prisma = new PrismaClient();

// Configuration for retry backoff
const RETRY_CONFIG = {
  maxAttempts: 5,
  baseDelayMs: 100,
  maxDelayMs: 3200,
  jitterMs: 50
};

/**
 * Calculate jittered exponential backoff delay
 */
function calculateBackoffDelay(attempt: number): number {
  const exponentialDelay = Math.min(
    RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt - 1),
    RETRY_CONFIG.maxDelayMs
  );
  
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * RETRY_CONFIG.jitterMs;
  
  return Math.floor(exponentialDelay + jitter);
}

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
 * Process a single event with retry logic and dead-letter handling
 */
async function processEvent(event: any): Promise<{ success: boolean; shouldRetry: boolean }> {
  const { eventId, eventType, payload, attempts } = event;
  
  // Parse payload to extract trace context
  let parsedPayload: any;
  let traceContext: any;
  
  try {
    parsedPayload = JSON.parse(payload);
    traceContext = parsedPayload._trace;
  } catch (error) {
    logger.error('Failed to parse event payload', { eventId, eventType });
    return { success: false, shouldRetry: false };
  }
  
  // Create trace context for event processing
  const processingContext = createTraceContext(
    traceContext?.traceId,
    traceContext?.spanId,
    undefined, // No user context in worker
    `process-event-${eventType}`
  );
  
  return runWithTraceContext(processingContext, async () => {
    try {
      const handler = eventHandlers[eventType];
      if (!handler) {
        logWithTrace('warn', 'No handler found for event type', { eventType, eventId });
        await markEventDelivered(eventId, 'internal', false, `No handler for event type: ${eventType}`);
        return { success: false, shouldRetry: false };
      }
      
      // Remove trace data from payload before passing to handler
      const { _trace, ...handlerPayload } = parsedPayload;
      await handler(handlerPayload);
      
      await markEventDelivered(eventId, 'internal', true);
      logWithTrace('info', 'Event processed successfully', { eventId, eventType, attempts });
      return { success: true, shouldRetry: false };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const currentAttempts = attempts + 1;
      
      logWithTrace('error', 'Failed to process event', { 
        eventId, 
        eventType, 
        attempts: currentAttempts,
        maxAttempts: RETRY_CONFIG.maxAttempts,
        error: errorMessage 
      });
      
      // Check if we should retry or move to dead letter
      if (currentAttempts >= RETRY_CONFIG.maxAttempts) {
        logWithTrace('error', 'Event exceeded max retry attempts, moving to dead letter', { 
          eventId, 
          eventType, 
          attempts: currentAttempts 
        });
        
        await moveToDeadLetter(eventId, errorMessage);
        return { success: false, shouldRetry: false };
      }
      
      // Schedule retry with backoff
      const backoffDelay = calculateBackoffDelay(currentAttempts);
      const nextRetryAt = new Date(Date.now() + backoffDelay);
      
      await markEventFailed(eventId, errorMessage, nextRetryAt);
      
      logWithTrace('info', 'Event scheduled for retry', { 
        eventId, 
        eventType, 
        attempts: currentAttempts,
        backoffDelay,
        nextRetryAt 
      });
      
      return { success: false, shouldRetry: true };
    }
  });
}

/**
 * Process all pending events with retry and dead-letter handling
 */
export async function processPendingEvents(): Promise<{ processed: number; failed: number; deadLettered: number }> {
  const events = await getPendingEvents(50); // Process up to 50 events at a time
  
  if (events.length === 0) {
    return { processed: 0, failed: 0, deadLettered: 0 };
  }
  
  logger.info('Processing pending events', { count: events.length });
  
  let processed = 0;
  let failed = 0;
  let deadLettered = 0;
  
  for (const event of events) {
    try {
      const result = await processEvent(event);
      
      if (result.success) {
        processed++;
      } else if (result.shouldRetry) {
        failed++;
      } else {
        deadLettered++;
      }
    } catch (error) {
      failed++;
      logger.error('Unexpected error processing event', { 
        eventId: event.eventId, 
        eventType: event.eventType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  logger.info('Event processing complete', { 
    processed, 
    failed, 
    deadLettered,
    total: events.length 
  });
  
  return { processed, failed, deadLettered };
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
