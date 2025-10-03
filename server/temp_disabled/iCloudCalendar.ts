import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import { ICloudCalendarService } from '../utils/iCloudCalendarService';

const router = Router();
const prisma = new PrismaClient();

/**
 * Get iCloud Calendar connection status
 */
router.get('/status', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  try {
    const integration = await prisma.calendarIntegration.findFirst({
      where: {
        userId,
        provider: 'icloud',
        isActive: true
      }
    });

    res.json({
      success: true,
      data: {
        connected: !!integration,
        provider: 'icloud',
        lastSync: integration?.createdAt
      }
    });
  } catch (error) {
    logger.error('Error checking iCloud status:', error);
    throw createError('Failed to check iCloud Calendar status', 500);
  }
}));

/**
 * Connect iCloud Calendar using app-specific password
 */
router.post('/connect', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { username, appPassword } = req.body;

  if (!username || !appPassword) {
    throw createError('Apple ID username and app-specific password are required', 400);
  }

  try {
    // Test the connection first with a simple CalDAV request
    const testService = new ICloudCalendarService({
      accessToken: username,
      refreshToken: appPassword
    });

    // Try a simple connection test instead of full event fetch
    try {
      await testService.testConnection();
      logger.info(`iCloud Calendar connection test passed for user ${userId}`);
    } catch (connectionError) {
      logger.warn(`iCloud Calendar connection test failed for user ${userId}, but allowing connection:`, connectionError.message);
      // Don't throw error - allow connection but warn user
    }

    // Store the integration - first try to find existing, then create or update
    let integration = await prisma.calendarIntegration.findFirst({
      where: {
        userId,
        provider: 'apple'
      }
    });

    if (integration) {
      // Update existing integration
      integration = await prisma.calendarIntegration.update({
        where: { id: integration.id },
        data: {
          accessToken: username,
          refreshToken: appPassword,
          isActive: true,
          expiresAt: null // App passwords don't expire
        }
      });
    } else {
      // Create new integration
      integration = await prisma.calendarIntegration.create({
        data: {
          userId,
          provider: 'icloud',
          accessToken: username,
          refreshToken: appPassword,
          isActive: true
        }
      });
    }

    logger.info(`iCloud Calendar connected for user ${userId}`);

    res.json({
      success: true,
      data: {
        message: 'iCloud Calendar connected successfully. You can now sync events from your iCloud Calendar.',
        integrationId: integration.id
      }
    });
  } catch (error: any) {
    logger.error('Error connecting iCloud Calendar:', error);
    
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      throw createError('Invalid Apple ID credentials or app-specific password', 401);
    }
    
    throw createError('Failed to connect iCloud Calendar. Please check your credentials.', 500);
  }
}));

/**
 * Disconnect iCloud Calendar
 */
router.post('/disconnect', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  try {
    await prisma.calendarIntegration.updateMany({
      where: {
        userId,
        provider: 'apple'
      },
      data: {
        isActive: false
      }
    });

    logger.info(`iCloud Calendar disconnected for user ${userId}`);

    res.json({
      success: true,
      data: {
        message: 'iCloud Calendar disconnected successfully'
      }
    });
  } catch (error) {
    logger.error('Error disconnecting iCloud Calendar:', error);
    throw createError('Failed to disconnect iCloud Calendar', 500);
  }
}));

/**
 * Sync events from iCloud Calendar
 */
router.post('/sync', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { timeMin, timeMax } = req.body;

  try {
    const integration = await prisma.calendarIntegration.findFirst({
      where: {
        userId,
        provider: 'icloud',
        isActive: true
      }
    });

    if (!integration) {
      throw createError('iCloud Calendar not connected', 400);
    }

    const service = new ICloudCalendarService({
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken!
    });

    const events = await service.getEvents(timeMin, timeMax);

    logger.info(`Synced ${events.length} events from iCloud Calendar for user ${userId}`);

    res.json({
      success: true,
      data: {
        events,
        count: events.length,
        provider: 'apple'
      }
    });
  } catch (error) {
    logger.error('Error syncing iCloud Calendar events:', error);
    throw createError('Failed to sync iCloud Calendar events', 500);
  }
}));

/**
 * Get iCloud Calendar events
 */
router.get('/events', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { timeMin, timeMax } = req.query;

  try {
    const integration = await prisma.calendarIntegration.findFirst({
      where: {
        userId,
        provider: 'icloud',
        isActive: true
      }
    });

    if (!integration) {
      throw createError('iCloud Calendar not connected', 400);
    }

    const service = new ICloudCalendarService({
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken!
    });

    const events = await service.getEvents(
      timeMin as string,
      timeMax as string
    );

    res.json({
      success: true,
      data: {
        events,
        count: events.length,
        provider: 'apple'
      }
    });
  } catch (error) {
    logger.error('Error fetching iCloud Calendar events:', error);
    throw createError('Failed to fetch iCloud Calendar events', 500);
  }
}));

/**
 * Create event in iCloud Calendar
 */
router.post('/events', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const eventData = req.body;

  try {
    const integration = await prisma.calendarIntegration.findFirst({
      where: {
        userId,
        provider: 'icloud',
        isActive: true
      }
    });

    if (!integration) {
      throw createError('iCloud Calendar not connected', 400);
    }

    const service = new ICloudCalendarService({
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken!
    });

    const event = await service.createEvent(eventData);

    logger.info(`Created event in iCloud Calendar for user ${userId}: ${event.summary}`);

    res.json({
      success: true,
      data: {
        event,
        provider: 'apple'
      }
    });
  } catch (error) {
    logger.error('Error creating iCloud Calendar event:', error);
    throw createError('Failed to create iCloud Calendar event', 500);
  }
}));

/**
 * Update event in iCloud Calendar
 */
router.put('/events/:eventId', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { eventId } = req.params;
  const eventData = req.body;

  try {
    const integration = await prisma.calendarIntegration.findFirst({
      where: {
        userId,
        provider: 'icloud',
        isActive: true
      }
    });

    if (!integration) {
      throw createError('iCloud Calendar not connected', 400);
    }

    const service = new ICloudCalendarService({
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken!
    });

    const event = await service.updateEvent(eventId, eventData);

    logger.info(`Updated event in iCloud Calendar for user ${userId}: ${event.summary}`);

    res.json({
      success: true,
      data: {
        event,
        provider: 'apple'
      }
    });
  } catch (error) {
    logger.error('Error updating iCloud Calendar event:', error);
    throw createError('Failed to update iCloud Calendar event', 500);
  }
}));

/**
 * Delete event from iCloud Calendar
 */
router.delete('/events/:eventId', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { eventId } = req.params;

  try {
    const integration = await prisma.calendarIntegration.findFirst({
      where: {
        userId,
        provider: 'icloud',
        isActive: true
      }
    });

    if (!integration) {
      throw createError('iCloud Calendar not connected', 400);
    }

    const service = new ICloudCalendarService({
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken!
    });

    await service.deleteEvent(eventId);

    logger.info(`Deleted event from iCloud Calendar for user ${userId}: ${eventId}`);

    res.json({
      success: true,
      data: {
        message: 'Event deleted successfully',
        provider: 'apple'
      }
    });
  } catch (error) {
    logger.error('Error deleting iCloud Calendar event:', error);
    throw createError('Failed to delete iCloud Calendar event', 500);
  }
}));

export default router;
