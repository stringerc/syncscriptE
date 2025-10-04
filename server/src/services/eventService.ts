import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { getCurrentTraceContext, createTraceHeaders } from './traceService';

const prisma = new PrismaClient();

// Event types for type safety
export interface TaskCompletedEvent {
  taskId: string;
  userId: string;
  completedAt: Date;
  energyGained: number;
  epGained: number;
}

export interface ScriptAppliedEvent {
  scriptId: string;
  userId: string;
  appliedAt: Date;
  tasksCreated: number;
  eventsCreated: number;
}

export interface CalendarWriteRequestedEvent {
  userId: string;
  provider: string;
  eventId: string;
  requestedAt: Date;
  operation: 'create' | 'update' | 'delete';
}

export interface EnergySnapshotCreatedEvent {
  userId: string;
  snapshotDate: Date;
  energy: number;
  epToday: number;
  resetAt: Date;
}

export interface EnergyPointsEarnedEvent {
  userId: string;
  amount: number;
  source: string;
  domain: string;
  description?: string;
  earnedAt: Date;
}

export interface EnergyLevelChangedEvent {
  userId: string;
  oldLevel: number;
  newLevel: number;
  energyGained: number;
  changedAt: Date;
}

export interface DailyEnergyResetEvent {
  userId: string;
  previousEnergy: number;
  previousEP: number;
  resetDate: Date;
  resetAt: Date;
}

export interface GamificationEnergyRequestEvent {
  userId: string;
  amount: number;
  source: string;
  domain: string;
  description?: string;
  requestedAt: Date;
}

export interface AchievementUnlockedEvent {
  userId: string;
  achievementId: string;
  achievementName: string;
  points: number;
  unlockedAt: Date;
}

export type DomainEvent = 
  | TaskCompletedEvent
  | ScriptAppliedEvent
  | CalendarWriteRequestedEvent
  | EnergySnapshotCreatedEvent
  | EnergyPointsEarnedEvent
  | EnergyLevelChangedEvent
  | DailyEnergyResetEvent
  | GamificationEnergyRequestEvent
  | AchievementUnlockedEvent;

export type EventType = 
  | 'TaskCompleted'
  | 'ScriptApplied'
  | 'CalendarWriteRequested'
  | 'EnergySnapshotCreated'
  | 'EnergyPointsEarned'
  | 'EnergyLevelChanged'
  | 'DailyEnergyReset'
  | 'GamificationEnergyRequest'
  | 'AchievementUnlocked';

export type AggregateType = 
  | 'Task'
  | 'Script'
  | 'Calendar'
  | 'Energy'
  | 'Gamification';

/**
 * Publish an event to the outbox within the current transaction
 * This ensures events are only published if the domain operation succeeds
 */
export async function publishEvent(
  eventType: EventType,
  aggregateType: AggregateType,
  aggregateId: string,
  payload: DomainEvent
): Promise<void> {
  const eventId = uuidv4();
  const traceContext = getCurrentTraceContext();
  
  try {
    // Include trace context in the event payload
    const enrichedPayload = {
      ...payload,
      _trace: traceContext ? {
        traceId: traceContext.traceId,
        spanId: traceContext.spanId,
        operation: traceContext.operation
      } : undefined
    };
    
    await prisma.outbox.create({
      data: {
        eventId,
        eventType,
        aggregateType,
        aggregateId,
        payload: JSON.stringify(enrichedPayload),
        status: 'pending',
        attempts: 0
      }
    });
    
    logger.info('Event published to outbox', {
      eventId,
      eventType,
      aggregateType,
      aggregateId,
      traceId: traceContext?.traceId,
      spanId: traceContext?.spanId
    });
  } catch (error) {
    logger.error('Failed to publish event to outbox', {
      eventId,
      eventType,
      aggregateType,
      aggregateId,
      traceId: traceContext?.traceId,
      spanId: traceContext?.spanId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Get pending events from the outbox for processing
 */
export async function getPendingEvents(limit: number = 100): Promise<any[]> {
  return await prisma.outbox.findMany({
    where: {
      status: 'pending',
      OR: [
        { nextRetryAt: null },
        { nextRetryAt: { lte: new Date() } }
      ]
    },
    orderBy: { occurredAt: 'asc' },
    take: limit
  });
}

/**
 * Mark an event as delivered
 */
export async function markEventDelivered(
  eventId: string,
  target: string,
  success: boolean,
  error?: string
): Promise<void> {
  const now = new Date();
  
  // Record the delivery
  await prisma.eventDelivery.upsert({
    where: {
      eventId_target: {
        eventId,
        target
      }
    },
    create: {
      eventId,
      target,
      deliveredAt: now,
      success,
      error
    },
    update: {
      deliveredAt: now,
      success,
      error
    }
  });
  
  // Update outbox status if all targets are delivered
  if (success) {
    const deliveryCount = await prisma.eventDelivery.count({
      where: { eventId, success: true }
    });
    
    // For now, assume single target delivery
    // In a more complex system, you'd track multiple targets
    if (deliveryCount >= 1) {
      await prisma.outbox.update({
        where: { eventId },
        data: { status: 'delivered' }
      });
    }
  } else {
    // Mark as failed and schedule retry
    const outboxEvent = await prisma.outbox.findUnique({
      where: { eventId }
    });
    
    if (outboxEvent) {
      const nextRetryAt = new Date();
      nextRetryAt.setMinutes(nextRetryAt.getMinutes() + Math.pow(2, outboxEvent.attempts));
      
      await prisma.outbox.update({
        where: { eventId },
        data: {
          status: 'failed',
          attempts: outboxEvent.attempts + 1,
          error,
          nextRetryAt
        }
      });
    }
  }
}

/**
 * Mark an event as failed and schedule for retry (enhanced version)
 */
export async function markEventFailed(
  eventId: string,
  error: string,
  nextRetryAt: Date
): Promise<void> {
  try {
    await prisma.outbox.update({
      where: { eventId },
      data: {
        status: 'pending',
        attempts: { increment: 1 },
        error,
        nextRetryAt,
        updatedAt: new Date()
      }
    });

    logger.info('Event marked as failed and scheduled for retry', { 
      eventId, 
      nextRetryAt,
      error 
    });
  } catch (error) {
    logger.error('Failed to mark event as failed', { 
      eventId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}

/**
 * Move an event to dead letter queue
 */
export async function moveToDeadLetter(
  eventId: string,
  error: string
): Promise<void> {
  try {
    await prisma.outbox.update({
      where: { eventId },
      data: {
        status: 'dead_letter',
        error,
        updatedAt: new Date()
      }
    });

    logger.error('Event moved to dead letter queue', { eventId, error });
  } catch (error) {
    logger.error('Failed to move event to dead letter', { 
      eventId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}

/**
 * Clean up old delivered events (run periodically)
 */
export async function cleanupOldEvents(olderThanDays: number = 7): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  
  const result = await prisma.outbox.deleteMany({
    where: {
      status: 'delivered',
      updatedAt: { lt: cutoffDate }
    }
  });
  
  logger.info('Cleaned up old events', { count: result.count, cutoffDate });
  return result.count;
}
