import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { AppleCalendarService } from '../services/appleCalendarService';
import { PrismaClient } from '@prisma/client';
import { getCurrentTraceContext, logWithTrace } from '../services/traceService';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/icloud-calendar/subscribe
 * Subscribe to an Apple/iCloud ICS feed
 */
router.post('/subscribe', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { icsUrl, calendarName } = req.body;

  if (!icsUrl) {
    throw createError('ICS URL is required', 400);
  }

  const traceContext = getCurrentTraceContext();
  logWithTrace('info', 'Apple ICS subscription requested', { userId, icsUrl });

  try {
    const appleService = AppleCalendarService.getInstance();
    const subscription = await appleService.subscribeToICSFeed(userId, icsUrl);

    logWithTrace('info', 'Apple ICS subscription created successfully', { 
      userId, 
      subscriptionId: subscription.id 
    });

    res.json({
      success: true,
      data: {
        message: 'Successfully subscribed to Apple/iCloud calendar',
        subscription: {
          id: subscription.id,
          calendarName: calendarName || 'Apple Calendar',
          icsUrl: icsUrl,
          status: 'CONNECTED'
        }
      }
    });

  } catch (error) {
    logWithTrace('error', 'Error subscribing to Apple ICS feed', { 
      userId, 
      icsUrl, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw createError('Failed to subscribe to Apple/iCloud calendar', 500);
  }
}));

/**
 * GET /api/icloud-calendar/events
 * Get events from subscribed Apple/iCloud calendars
 */
router.get('/events', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { startDate, endDate } = req.query;

  const traceContext = getCurrentTraceContext();
  logWithTrace('info', 'Apple calendar events requested', { userId, startDate, endDate });

  try {
    // Get user's Apple calendar accounts
    const accounts = await prisma.externalCalendarAccount.findMany({
      where: {
        userId,
        provider: 'apple',
        status: 'CONNECTED'
      }
    });

    if (accounts.length === 0) {
      return res.json({
        success: true,
        data: {
          events: [],
          message: 'No Apple/iCloud calendars subscribed'
        }
      });
    }

    const appleService = AppleCalendarService.getInstance();
    const allEvents = [];

    // Fetch events from each subscribed calendar
    for (const account of accounts) {
      try {
        const events = await appleService.getEventsFromICSFeed(
          account.accountId, // This is the hashed ICS URL
          startDate as string,
          endDate as string
        );
        allEvents.push(...events);
      } catch (error) {
        logWithTrace('warn', 'Error fetching events from Apple calendar', { 
          accountId: account.id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        // Continue with other calendars even if one fails
      }
    }

    logWithTrace('info', 'Apple calendar events fetched successfully', { 
      userId, 
      eventCount: allEvents.length 
    });

    res.json({
      success: true,
      data: {
        events: allEvents,
        count: allEvents.length
      }
    });

  } catch (error) {
    logWithTrace('error', 'Error getting Apple calendar events', { 
      userId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw createError('Failed to get Apple/iCloud calendar events', 500);
  }
}));

/**
 * GET /api/icloud-calendar/subscriptions
 * Get user's Apple/iCloud calendar subscriptions
 */
router.get('/subscriptions', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  try {
    const accounts = await prisma.externalCalendarAccount.findMany({
      where: {
        userId,
        provider: 'apple',
        status: 'CONNECTED'
      },
      select: {
        id: true,
        accountId: true,
        status: true,
        lastSyncAt: true,
        createdAt: true,
        scopes: true
      }
    });

    res.json({
      success: true,
      data: {
        subscriptions: accounts.map(account => ({
          id: account.id,
          status: account.status,
          lastSyncAt: account.lastSyncAt,
          createdAt: account.createdAt,
          scopes: account.scopes ? JSON.parse(account.scopes) : []
        }))
      }
    });

  } catch (error) {
    logger.error('Error getting Apple calendar subscriptions:', error);
    throw createError('Failed to get Apple/iCloud calendar subscriptions', 500);
  }
}));

/**
 * DELETE /api/icloud-calendar/subscriptions/:subscriptionId
 * Unsubscribe from an Apple/iCloud calendar
 */
router.delete('/subscriptions/:subscriptionId', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { subscriptionId } = req.params;

  const traceContext = getCurrentTraceContext();
  logWithTrace('info', 'Unsubscribing from Apple calendar', { userId, subscriptionId });

  try {
    // Verify the subscription belongs to the user
    const account = await prisma.externalCalendarAccount.findFirst({
      where: {
        id: subscriptionId,
        userId,
        provider: 'apple'
      }
    });

    if (!account) {
      throw createError('Apple/iCloud calendar subscription not found', 404);
    }

    // Remove the subscription
    await prisma.externalCalendarAccount.delete({
      where: {
        id: subscriptionId
      }
    });

    logWithTrace('info', 'Apple calendar subscription removed successfully', { 
      userId, 
      subscriptionId 
    });

    res.json({
      success: true,
      data: {
        message: 'Successfully unsubscribed from Apple/iCloud calendar'
      }
    });

  } catch (error) {
    logWithTrace('error', 'Error unsubscribing from Apple calendar', { 
      userId, 
      subscriptionId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw createError('Failed to unsubscribe from Apple/iCloud calendar', 500);
  }
}));

/**
 * POST /api/icloud-calendar/sync
 * Manually sync Apple/iCloud calendar events
 */
router.post('/sync', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const traceContext = getCurrentTraceContext();
  logWithTrace('info', 'Manual Apple calendar sync requested', { userId });

  try {
    const appleService = AppleCalendarService.getInstance();
    const syncResult = await appleService.syncAllSubscribedCalendars(userId);

    logWithTrace('info', 'Apple calendar sync completed', { 
      userId, 
      syncedCalendars: syncResult.syncedCalendars,
      totalEvents: syncResult.totalEvents
    });

    res.json({
      success: true,
      data: {
        message: 'Apple/iCloud calendar sync completed',
        syncedCalendars: syncResult.syncedCalendars,
        totalEvents: syncResult.totalEvents,
        errors: syncResult.errors
      }
    });

  } catch (error) {
    logWithTrace('error', 'Error syncing Apple calendar', { 
      userId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw createError('Failed to sync Apple/iCloud calendar', 500);
  }
}));

/**
 * GET /api/icloud-calendar/status
 * Get Apple/iCloud calendar connection status
 */
router.get('/status', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  try {
    const accounts = await prisma.externalCalendarAccount.findMany({
      where: {
        userId,
        provider: 'apple',
        status: 'CONNECTED'
      },
      select: {
        id: true,
        status: true,
        lastSyncAt: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: {
        connected: accounts.length > 0,
        subscriptionCount: accounts.length,
        subscriptions: accounts
      }
    });

  } catch (error) {
    logger.error('Error getting Apple/iCloud calendar status:', error);
    throw createError('Failed to get Apple/iCloud calendar status', 500);
  }
}));

export default router;
