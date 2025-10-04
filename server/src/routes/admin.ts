/**
 * Admin Routes
 * 
 * Administrative endpoints for monitoring and managing the system
 */

import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getOutboxMetrics, getOutboxHealthStatus, getOutboxTrends } from '../services/outboxMetricsService';
import { getActiveLocks, cleanupExpiredLocks, withCronLock } from '../services/cronLockService';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Middleware to check if user is admin
 */
async function requireAdmin(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // In a real system, you'd check user roles/permissions
  // For now, we'll allow any authenticated user to access admin endpoints
  // TODO: Implement proper admin role checking
  next();
}

/**
 * GET /api/admin/outbox/metrics
 * Get outbox performance metrics
 */
router.get('/outbox/metrics', authenticateToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const metrics = await getOutboxMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Failed to get outbox metrics', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get outbox metrics'
    });
  }
}));

/**
 * GET /api/admin/outbox/health
 * Get outbox health status
 */
router.get('/outbox/health', authenticateToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const health = await getOutboxHealthStatus();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Failed to get outbox health', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get outbox health'
    });
  }
}));

/**
 * GET /api/admin/outbox/trends
 * Get outbox performance trends
 */
router.get('/outbox/trends', authenticateToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const trends = await getOutboxTrends();
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    logger.error('Failed to get outbox trends', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get outbox trends'
    });
  }
}));

/**
 * GET /api/admin/outbox/dead-letter
 * Get dead letter events
 */
router.get('/outbox/dead-letter', authenticateToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const deadLetterEvents = await prisma.outbox.findMany({
      where: {
        status: 'dead_letter'
      },
      orderBy: {
        updatedAt: 'desc'
      },
      skip: offset,
      take: Number(limit)
    });

    const total = await prisma.outbox.count({
      where: {
        status: 'dead_letter'
      }
    });

    res.json({
      success: true,
      data: {
        events: deadLetterEvents,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get dead letter events', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get dead letter events'
    });
  }
}));

/**
 * POST /api/admin/outbox/dead-letter/:eventId/requeue
 * Requeue a dead letter event
 */
router.post('/outbox/dead-letter/:eventId/requeue', authenticateToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.outbox.findUnique({
      where: { eventId }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    if (event.status !== 'dead_letter') {
      return res.status(400).json({
        success: false,
        error: 'Event is not in dead letter status'
      });
    }

    // Reset the event for retry
    await prisma.outbox.update({
      where: { eventId },
      data: {
        status: 'pending',
        attempts: 0,
        error: null,
        nextRetryAt: new Date(), // Retry immediately
        updatedAt: new Date()
      }
    });

    logger.info('Dead letter event requeued', { eventId, eventType: event.eventType });

    res.json({
      success: true,
      message: 'Event requeued successfully'
    });
  } catch (error) {
    logger.error('Failed to requeue dead letter event', { error, eventId: req.params.eventId });
    res.status(500).json({
      success: false,
      error: 'Failed to requeue event'
    });
  }
}));

/**
 * POST /api/admin/outbox/dead-letter/requeue-all
 * Requeue all dead letter events
 */
router.post('/outbox/dead-letter/requeue-all', authenticateToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const result = await prisma.outbox.updateMany({
      where: {
        status: 'dead_letter'
      },
      data: {
        status: 'pending',
        attempts: 0,
        error: null,
        nextRetryAt: new Date(),
        updatedAt: new Date()
      }
    });

    logger.info('All dead letter events requeued', { count: result.count });

    res.json({
      success: true,
      message: `${result.count} events requeued successfully`
    });
  } catch (error) {
    logger.error('Failed to requeue all dead letter events', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to requeue all events'
    });
  }
}));

/**
 * DELETE /api/admin/outbox/dead-letter/:eventId
 * Delete a dead letter event
 */
router.delete('/outbox/dead-letter/:eventId', authenticateToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.outbox.findUnique({
      where: { eventId }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    if (event.status !== 'dead_letter') {
      return res.status(400).json({
        success: false,
        error: 'Event is not in dead letter status'
      });
    }

    await prisma.outbox.delete({
      where: { eventId }
    });

    logger.info('Dead letter event deleted', { eventId, eventType: event.eventType });

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete dead letter event', { error, eventId: req.params.eventId });
    res.status(500).json({
      success: false,
      error: 'Failed to delete event'
    });
  }
}));

/**
 * GET /api/admin/cron/locks
 * Get active cron locks
 */
router.get('/cron/locks', authenticateToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const { jobName } = req.query;
    const locks = await getActiveLocks(jobName as string);
    
    res.json({
      success: true,
      data: locks
    });
  } catch (error) {
    logger.error('Failed to get cron locks', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get cron locks'
    });
  }
}));

/**
 * POST /api/admin/cron/cleanup-expired
 * Clean up expired cron locks
 */
router.post('/cron/cleanup-expired', authenticateToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const cleanedCount = await cleanupExpiredLocks();
    
    res.json({
      success: true,
      data: {
        cleanedCount
      }
    });
  } catch (error) {
    logger.error('Failed to cleanup expired cron locks', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup expired locks'
    });
  }
}));

/**
 * POST /api/admin/cron/test
 * Test cron lock functionality
 */
router.post('/cron/test', authenticateToken, requireAdmin, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const { jobName, duration = 1000 } = req.body;
    
    if (!jobName) {
      return res.status(400).json({
        success: false,
        error: 'jobName is required'
      });
    }
    
    const result = await withCronLock(
      jobName,
      async () => {
        // Simulate work
        await new Promise(resolve => setTimeout(resolve, duration));
        return { executed: true, jobName, duration };
      },
      1, // 1 minute lock
      { test: true, requestedBy: req.user?.id }
    );
    
    res.json({
      success: true,
      data: {
        executed: result !== null,
        result
      }
    });
  } catch (error) {
    logger.error('Failed to test cron lock', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to test cron lock'
    });
  }
}));

export default router;
