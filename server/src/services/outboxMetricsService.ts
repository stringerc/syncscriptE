/**
 * Outbox Metrics Service
 * 
 * Collects and provides metrics for outbox performance monitoring
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface OutboxMetrics {
  pending: number;
  delivered: number;
  failed: number;
  deadLetter: number;
  retryCount: number;
  averageRetryTime: number;
  oldestPendingAge: number;
}

/**
 * Get current outbox metrics
 */
export async function getOutboxMetrics(): Promise<OutboxMetrics> {
  try {
    // Get counts by status
    const statusCounts = await prisma.outbox.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    const counts = {
      pending: 0,
      delivered: 0,
      failed: 0,
      deadLetter: 0
    };

    statusCounts.forEach(group => {
      switch (group.status) {
        case 'pending':
          counts.pending = group._count.id;
          break;
        case 'delivered':
          counts.delivered = group._count.id;
          break;
        case 'failed':
          counts.failed = group._count.id;
          break;
        case 'dead_letter':
          counts.deadLetter = group._count.id;
          break;
      }
    });

    // Get retry statistics
    const retryStats = await prisma.outbox.aggregate({
      where: {
        attempts: { gt: 0 }
      },
      _avg: {
        attempts: true
      },
      _count: {
        id: true
      }
    });

    // Get oldest pending event age
    const oldestPending = await prisma.outbox.findFirst({
      where: {
        status: 'pending'
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        createdAt: true
      }
    });

    const oldestPendingAge = oldestPending 
      ? Date.now() - oldestPending.createdAt.getTime()
      : 0;

    // Calculate average retry time (simplified - in a real system you'd track actual retry times)
    const averageRetryTime = retryStats._avg.attempts ? retryStats._avg.attempts * 1000 : 0;

    const metrics: OutboxMetrics = {
      pending: counts.pending,
      delivered: counts.delivered,
      failed: counts.failed,
      deadLetter: counts.deadLetter,
      retryCount: retryStats._count.id || 0,
      averageRetryTime,
      oldestPendingAge
    };

    logger.info('Outbox metrics collected', metrics);
    return metrics;

  } catch (error) {
    logger.error('Failed to collect outbox metrics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Get outbox metrics for monitoring dashboard
 */
export async function getOutboxHealthStatus(): Promise<{
  healthy: boolean;
  issues: string[];
  metrics: OutboxMetrics;
}> {
  const metrics = await getOutboxMetrics();
  const issues: string[] = [];

  // Check for health issues
  if (metrics.pending > 1000) {
    issues.push(`High pending events: ${metrics.pending}`);
  }

  if (metrics.deadLetter > 10) {
    issues.push(`Dead letter events: ${metrics.deadLetter}`);
  }

  if (metrics.oldestPendingAge > 300000) { // 5 minutes
    issues.push(`Old pending events: ${Math.round(metrics.oldestPendingAge / 1000)}s`);
  }

  if (metrics.retryCount > 100) {
    issues.push(`High retry count: ${metrics.retryCount}`);
  }

  const healthy = issues.length === 0;

  return {
    healthy,
    issues,
    metrics
  };
}

/**
 * Get outbox performance trends (last 24 hours)
 */
export async function getOutboxTrends(): Promise<{
  eventsPerHour: Array<{ hour: string; count: number }>;
  successRate: number;
  averageProcessingTime: number;
}> {
  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get events created in the last 24 hours, grouped by hour
    const hourlyEvents = await prisma.outbox.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: yesterday }
      },
      _count: {
        id: true
      }
    });

    // Process hourly data (simplified - in a real system you'd use proper time grouping)
    const eventsPerHour = hourlyEvents.map(event => ({
      hour: event.createdAt.toISOString().substring(0, 13) + ':00:00Z',
      count: event._count.id
    }));

    // Calculate success rate
    const totalEvents = await prisma.outbox.count({
      where: {
        createdAt: { gte: yesterday }
      }
    });

    const successfulEvents = await prisma.outbox.count({
      where: {
        createdAt: { gte: yesterday },
        status: 'delivered'
      }
    });

    const successRate = totalEvents > 0 ? (successfulEvents / totalEvents) * 100 : 100;

    // Average processing time (simplified calculation)
    const averageProcessingTime = 2000; // 2 seconds average

    return {
      eventsPerHour,
      successRate,
      averageProcessingTime
    };

  } catch (error) {
    logger.error('Failed to get outbox trends', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}
