import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { GoogleCalendarService } from '../utils/googleCalendarService';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const syncEventsSchema = z.object({
  calendarId: z.string().default('primary'),
  direction: z.enum(['from_google', 'to_google', 'bidirectional']).default('from_google')
});

const createGoogleEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.string().optional(),
  calendarId: z.string().default('primary')
});

// Get Google Calendar authorization URL
router.get('/auth-url', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const authUrl = GoogleCalendarService.getAuthUrl();
    
    res.json({
      success: true,
      data: { authUrl },
      message: 'Authorization URL generated successfully'
    });
  } catch (error) {
    logger.error('Error generating Google Calendar auth URL:', error);
    throw createError('Failed to generate authorization URL', 500);
  }
}));

// Handle Google Calendar OAuth callback
router.post('/auth/callback', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { code } = req.body;

  if (!code) {
    throw createError('Authorization code is required', 400);
  }

  try {
    // Exchange code for tokens
    const credentials = await GoogleCalendarService.getTokensFromCode(code);

    // Check if integration already exists
    const existingIntegration = await prisma.calendarIntegration.findFirst({
      where: {
        userId: req.user!.id,
        provider: 'google'
      }
    });

    if (existingIntegration) {
      // Update existing integration
      await prisma.calendarIntegration.update({
        where: { id: existingIntegration.id },
        data: {
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken,
          expiresAt: credentials.expiresAt,
          isActive: true
        }
      });
    } else {
      // Create new integration
      await prisma.calendarIntegration.create({
        data: {
          userId: req.user!.id,
          provider: 'google',
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken,
          expiresAt: credentials.expiresAt,
          isActive: true
        }
      });
    }

    logger.info('Google Calendar integration created/updated', { 
      userId: req.user!.id 
    });

    res.json({
      success: true,
      message: 'Google Calendar connected successfully'
    });
  } catch (error) {
    logger.error('Error handling Google Calendar callback:', error);
    throw createError('Failed to connect Google Calendar', 500);
  }
}));

// Get Google Calendar integration status
router.get('/status', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const integration = await prisma.calendarIntegration.findFirst({
    where: {
      userId: req.user!.id,
      provider: 'google',
      isActive: true
    }
  });

  res.json({
    success: true,
    data: {
      connected: !!integration,
      integration: integration ? {
        id: integration.id,
        createdAt: integration.createdAt,
        expiresAt: integration.expiresAt
      } : null
    }
  });
}));

// Disconnect Google Calendar
router.delete('/disconnect', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const integration = await prisma.calendarIntegration.findFirst({
    where: {
      userId: req.user!.id,
      provider: 'google'
    }
  });

  if (!integration) {
    throw createError('Google Calendar integration not found', 404);
  }

  await prisma.calendarIntegration.update({
    where: { id: integration.id },
    data: { isActive: false }
  });

  logger.info('Google Calendar disconnected', { 
    userId: req.user!.id 
  });

  res.json({
    success: true,
    message: 'Google Calendar disconnected successfully'
  });
}));

// Get Google Calendar calendars
router.get('/calendars', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const integration = await prisma.calendarIntegration.findFirst({
    where: {
      userId: req.user!.id,
      provider: 'google',
      isActive: true
    }
  });

  if (!integration) {
    throw createError('Google Calendar integration not found', 404);
  }

  try {
    const googleCalendarService = new GoogleCalendarService({
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken || undefined,
      expiresAt: integration.expiresAt || undefined
    });

    const calendars = await googleCalendarService.getCalendars();

    res.json({
      success: true,
      data: calendars
    });
  } catch (error) {
    logger.error('Error fetching Google Calendar calendars:', error);
    throw createError('Failed to fetch calendars', 500);
  }
}));

// Get Google Calendar events
router.get('/events', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { calendarId = 'primary', timeMin, timeMax, maxResults = '100' } = req.query;

  const integration = await prisma.calendarIntegration.findFirst({
    where: {
      userId: req.user!.id,
      provider: 'google',
      isActive: true
    }
  });

  if (!integration) {
    throw createError('Google Calendar integration not found', 404);
  }

  try {
    const googleCalendarService = new GoogleCalendarService({
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken || undefined,
      expiresAt: integration.expiresAt || undefined
    });

    const events = await googleCalendarService.getEvents(calendarId as string, {
      timeMin: timeMin as string,
      timeMax: timeMax as string,
      maxResults: parseInt(maxResults as string)
    });

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    logger.error('Error fetching Google Calendar events:', error);
    throw createError('Failed to fetch events', 500);
  }
}));

// Create event in Google Calendar
router.post('/events', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const eventData = createGoogleEventSchema.parse(req.body);

  const integration = await prisma.calendarIntegration.findFirst({
    where: {
      userId: req.user!.id,
      provider: 'google',
      isActive: true
    }
  });

  if (!integration) {
    throw createError('Google Calendar integration not found', 404);
  }

  try {
    const googleCalendarService = new GoogleCalendarService({
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken || undefined,
      expiresAt: integration.expiresAt || undefined
    });

    const googleEvent = await googleCalendarService.createEvent(
      eventData.calendarId,
      {
        summary: eventData.title,
        description: eventData.description,
        start: {
          dateTime: eventData.startTime,
          timeZone: 'UTC'
        },
        end: {
          dateTime: eventData.endTime,
          timeZone: 'UTC'
        },
        location: eventData.location
      }
    );

    // Also create the event in our local database
    const localEvent = await prisma.event.create({
      data: {
        userId: req.user!.id,
        title: eventData.title,
        description: eventData.description,
        startTime: new Date(eventData.startTime),
        endTime: new Date(eventData.endTime),
        location: eventData.location,
        calendarEventId: googleEvent.id,
        calendarProvider: 'google'
      }
    });

    logger.info('Event created in Google Calendar and local database', { 
      userId: req.user!.id,
      localEventId: localEvent.id,
      googleEventId: googleEvent.id
    });

    res.status(201).json({
      success: true,
      data: {
        localEvent,
        googleEvent
      },
      message: 'Event created successfully in Google Calendar'
    });
  } catch (error) {
    logger.error('Error creating Google Calendar event:', error);
    throw createError('Failed to create event in Google Calendar', 500);
  }
}));

// Sync events between Google Calendar and local database
router.post('/sync', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { calendarId = 'primary', direction = 'from_google' } = syncEventsSchema.parse(req.body);

  const integration = await prisma.calendarIntegration.findFirst({
    where: {
      userId: req.user!.id,
      provider: 'google',
      isActive: true
    }
  });

  if (!integration) {
    throw createError('Google Calendar integration not found', 404);
  }

  try {
    const googleCalendarService = new GoogleCalendarService({
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken || undefined,
      expiresAt: integration.expiresAt || undefined
    });

    let stats;

    if (direction === 'from_google') {
      // Sync from Google Calendar to local database
      stats = await googleCalendarService.syncEventsToLocal(
        calendarId,
        req.user!.id,
        prisma
      );
    } else if (direction === 'to_google') {
      // Sync from local database to Google Calendar
      const localEvents = await prisma.event.findMany({
        where: {
          userId: req.user!.id,
          calendarProvider: null // Only sync events that aren't already synced
        }
      });

      stats = await googleCalendarService.syncLocalEventsToGoogle(
        localEvents,
        calendarId
      );
    } else {
      // Bidirectional sync
      const fromGoogleStats = await googleCalendarService.syncEventsToLocal(
        calendarId,
        req.user!.id,
        prisma
      );

      const localEvents = await prisma.event.findMany({
        where: {
          userId: req.user!.id,
          calendarProvider: null
        }
      });

      const toGoogleStats = await googleCalendarService.syncLocalEventsToGoogle(
        localEvents,
        calendarId
      );

      stats = {
        created: fromGoogleStats.created + toGoogleStats.created,
        updated: fromGoogleStats.updated + toGoogleStats.updated,
        errors: fromGoogleStats.errors + toGoogleStats.errors
      };
    }

    logger.info('Calendar sync completed', { 
      userId: req.user!.id,
      direction,
      stats
    });

    res.json({
      success: true,
      data: {
        direction,
        calendarId,
        stats
      },
      message: 'Calendar sync completed successfully'
    });
  } catch (error) {
    logger.error('Error syncing calendar:', error);
    throw createError('Failed to sync calendar', 500);
  }
}));

// Refresh Google Calendar tokens
router.post('/refresh-tokens', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const integration = await prisma.calendarIntegration.findFirst({
    where: {
      userId: req.user!.id,
      provider: 'google',
      isActive: true
    }
  });

  if (!integration) {
    throw createError('Google Calendar integration not found', 404);
  }

  try {
    const googleCalendarService = new GoogleCalendarService({
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken || undefined,
      expiresAt: integration.expiresAt || undefined
    });

    const newCredentials = await googleCalendarService.refreshTokenIfNeeded();

    // Update the integration with new tokens
    await prisma.calendarIntegration.update({
      where: { id: integration.id },
      data: {
        accessToken: newCredentials.accessToken,
        refreshToken: newCredentials.refreshToken,
        expiresAt: newCredentials.expiresAt
      }
    });

    logger.info('Google Calendar tokens refreshed', { 
      userId: req.user!.id 
    });

    res.json({
      success: true,
      message: 'Tokens refreshed successfully'
    });
  } catch (error) {
    logger.error('Error refreshing Google Calendar tokens:', error);
    throw createError('Failed to refresh tokens', 500);
  }
}));

export default router;
