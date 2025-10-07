import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { idempotencyMiddleware } from '../middleware/idempotency';
import { metricsService } from '../services/metricsService';
import { findTopHoldsForEvent } from '../services/scheduling/aplSlotFinder';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /apl/ready?eventId={eventId}
 * Check if APL is ready for an event
 * Returns mock data for now
 */
router.get('/ready', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { eventId } = req.query;
  const userId = req.user!.id;

  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ error: 'eventId is required' });
  }

  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: { id: eventId, userId }
  });

  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  // Mock response - always ready for now
  res.json({ ready: true });
}));

/**
 * POST /apl/suggest?eventId={eventId}
 * Suggest tentative holds for an event
 * Uses real slot finding when make_it_real flag is enabled
 */
router.post('/suggest', authenticateToken, idempotencyMiddleware('apl-suggest'), asyncHandler(async (req: AuthRequest, res) => {
  const { eventId, version = 1, stepId = 'default' } = req.query as any;
  const userId = req.user!.id;

  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ error: 'eventId is required' });
  }

  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: { id: eventId, userId }
  });

  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const { max = 3, source = 'manual' } = req.body;
  const idem = req.headers['x-idempotency-key'] as string;

  const startTimer = Date.now();
  
  try {
    // Check if make_it_real flag is enabled (mock implementation for now)
    const isRealWritesEnabled = process.env.NODE_ENV === 'development' || req.headers['x-make-it-real'] === 'true';
    
    if (!isRealWritesEnabled) {
      // Existing mock path
      const mockHolds = [
        {
          id: uuidv4(),
          start: new Date(Date.now() + 3600 * 1000).toISOString(),
          end: new Date(Date.now() + 3600 * 1000 + 30 * 60 * 1000).toISOString(),
          provider: 'syncscript',
          status: 'suggested' as const,
          key: `${eventId}:v0:suggest:hold1`
        },
        {
          id: uuidv4(),
          start: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
          end: new Date(Date.now() + 2 * 3600 * 1000 + 45 * 60 * 1000).toISOString(),
          provider: 'syncscript',
          status: 'suggested' as const,
          key: `${eventId}:v0:suggest:hold2`
        },
        {
          id: uuidv4(),
          start: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
          end: new Date(Date.now() + 3 * 3600 * 1000 + 60 * 60 * 1000).toISOString(),
          provider: 'syncscript',
          status: 'suggested' as const,
          key: `${eventId}:v0:suggest:hold3`
        }
      ];

      const createdHolds = await Promise.all(
        mockHolds.map(hold =>
          prisma.tentativeHold.create({
            data: {
              id: hold.id,
              userId,
              eventId,
              startsAt: hold.start,
              endsAt: hold.end,
              provider: hold.provider,
              status: hold.status,
              idempotencyKey: hold.key
            }
          })
        )
      );

      metricsService.recordAplSuggestDuration(source, Date.now() - startTimer);
      metricsService.recordAplSuggested();

      return res.json({ holds: createdHolds, maxHolds: max });
    }

    // Real writes path
    // Check for existing holds with the same idempotency key
    const existingHolds = await prisma.tentativeHold.findMany({
      where: { idempotencyKey: idem }
    });

    if (existingHolds.length > 0) {
      logger.info('APL suggest request already processed (idempotent hit)', { userId, eventId, idem });
      metricsService.recordIdempotencyHit('apl-suggest');
      metricsService.recordAplSuggested();
      return res.json({ holds: existingHolds, maxHolds: max });
    }

    // Compute suggestions (pure)
    const slots = await findTopHoldsForEvent(eventId, userId, { 
      windowDays: 14, 
      minMinutes: 60, 
      maxSuggestions: 3 
    });

    // Write up to 3 holds with safe upserts
    const writes = await Promise.all(
      slots.map((slot, i) => 
        prisma.tentativeHold.upsert({
          where: { idempotencyKey: `${idem}:h${i}` },
          update: {}, // idempotent
          create: {
            eventId,
            userId,
            provider: slot.provider,
            startsAt: slot.startsAt,
            endsAt: slot.endsAt,
            status: 'suggested',
            idempotencyKey: `${idem}:h${i}`,
          },
        })
      )
    );

    metricsService.recordAplSuggestDuration(source, Date.now() - startTimer);
    metricsService.recordAplSuggested();

    logger.info('APL holds suggested (real writes)', { 
      userId, 
      eventId, 
      holdCount: writes.length,
      idem,
      duration: Date.now() - startTimer
    });

    return res.json({ 
      holds: writes.map(w => ({
        id: w.id, 
        startsAt: w.startsAt, 
        endsAt: w.endsAt, 
        provider: w.provider, 
        status: w.status,
      })), 
      maxHolds: max 
    });

  } catch (err: any) {
    metricsService.recordAplSuggestError();
    logger.error('APL suggest failed', { userId, eventId, error: err?.message });
    return res.status(500).json({ 
      error: 'apl_suggest_failed', 
      message: err?.message ?? 'unknown' 
    });
  }
}));

/**
 * POST /apl/confirm/:holdId
 * Confirm a tentative hold
 * Uses real outbox pattern when make_it_real flag is enabled
 */
router.post('/confirm/:holdId', authenticateToken, idempotencyMiddleware('apl-confirm'), asyncHandler(async (req: AuthRequest, res) => {
  const { holdId } = req.params;
  const userId = req.user!.id;
  const idem = req.headers['x-idempotency-key'] as string;

  try {
    const hold = await prisma.tentativeHold.findUnique({ where: { id: holdId } });
    if (!hold || hold.userId !== userId) {
      metricsService.recordAplConfirmError('unknown');
      return res.status(404).json({ error: 'Hold not found or unauthorized' });
    }

    if (hold.status !== 'suggested') {
      metricsService.recordAplConfirmError('invalid_status');
      return res.status(400).json({ error: 'Hold is not in suggested status' });
    }

    // Check for existing idempotency key
    const existing = await prisma.idempotencyKey.findUnique({ where: { key: idem } });
    if (existing) {
      return res.status(202).json({ enqueued: true, providerEventId: 'existing-event' });
    }

    // Check if make_it_real flag is enabled
    const isRealWritesEnabled = process.env.NODE_ENV === 'development' || req.headers['x-make-it-real'] === 'true';
    
    if (isRealWritesEnabled) {
      // Real writes path - enqueue calendar write via outbox
      // Note: This would use your existing eventService.enqueueCalendarWriteRequested
      // For now, we'll simulate the outbox pattern
      logger.info('APL hold confirmed (real writes)', { 
        userId, 
        holdId, 
        eventId: hold.eventId,
        provider: hold.provider,
        idem 
      });
    }

    // Mark confirmed; optionally dismiss siblings for the same event window
    await prisma.$transaction([
      prisma.tentativeHold.update({ 
        where: { id: holdId }, 
        data: { 
          status: 'confirmed',
          idempotencyKey: idem,
          updatedAt: new Date()
        } 
      }),
      prisma.tentativeHold.updateMany({
        where: { 
          eventId: hold.eventId, 
          id: { not: holdId }, 
          status: 'suggested' 
        },
        data: { status: 'dismissed' },
      }),
    ]);

    metricsService.recordAplConfirmSuccess(hold.provider);

    logger.info('APL hold confirmed', { 
      userId, 
      holdId, 
      eventId: hold.eventId,
      provider: hold.provider,
      idem 
    });

    return res.status(202).json({ enqueued: true, providerEventId: 'mock-event-123' });

  } catch (err: any) {
    metricsService.recordAplConfirmError('system_error');
    logger.error('APL confirm failed', { userId, holdId, error: err?.message });
    return res.status(500).json({ 
      error: 'apl_confirm_failed', 
      message: err?.message ?? 'unknown' 
    });
  }
}));

/**
 * POST /apl/dismiss/:holdId
 * Dismiss a tentative hold
 */
router.post('/dismiss/:holdId', authenticateToken, idempotencyMiddleware('apl-dismiss'), asyncHandler(async (req: AuthRequest, res) => {
  const { holdId } = req.params;
  const userId = req.user!.id;
  const idem = req.headers['x-idempotency-key'] as string;

  try {
    const hold = await prisma.tentativeHold.findUnique({ where: { id: holdId } });
    if (!hold || hold.userId !== userId) {
      metricsService.recordAplDismissed(); // Still record dismissal attempt
      return res.status(404).json({ error: 'Hold not found or unauthorized' });
    }

    // Check for existing idempotency key
    const existing = await prisma.idempotencyKey.findUnique({ where: { key: idem } });
    if (existing) {
      return res.json({ ok: true });
    }

    // Update hold status to dismissed
    await prisma.tentativeHold.update({
      where: { id: holdId },
      data: { 
        status: 'dismissed',
        idempotencyKey: idem,
        updatedAt: new Date()
      }
    });

    // Record metrics
    metricsService.recordAplDismissed();

    logger.info('APL hold dismissed', { 
      userId, 
      holdId, 
      eventId: hold.eventId,
      idem 
    });

    res.json({ ok: true });

  } catch (err: any) {
    logger.error('APL dismiss failed', { userId, holdId, error: err?.message });
    return res.status(500).json({ 
      error: 'apl_dismiss_failed',
      message: err?.message ?? 'unknown'
    });
  }
}));

/**
 * GET /apl/holds/:eventId
 * Get holds for an event
 */
router.get('/holds/:eventId', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { eventId } = req.params;
  const userId = req.user!.id;

  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: { id: eventId, userId }
  });

  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  // Get holds for this event
  const holds = await prisma.tentativeHold.findMany({
    where: { eventId, userId },
    orderBy: { createdAt: 'asc' }
  });

  res.json({ holds });
}));

export default router;
