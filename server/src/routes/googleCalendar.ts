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
  location: z.string().nullable().optional(),
  calendarId: z.string().default('primary')
});

// Get Google Calendar authorization URL (no auth required for initial login)
router.get('/auth-url', asyncHandler(async (req, res) => {
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

// Handle Google Calendar OAuth callback for login (no auth required)
router.post('/auth/login-callback', asyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    throw createError('Authorization code is required', 400);
  }

  try {
    // Exchange code for tokens
    const credentials = await GoogleCalendarService.getTokensFromCode(code);
    
    // Get user info from Google
    const userInfo = await GoogleCalendarService.getUserInfo(credentials.accessToken);
    
    // Debug logging
    logger.info('Google OAuth user info', { 
      email: userInfo.email, 
      name: userInfo.name, 
      googleId: userInfo.id 
    });
    
    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: userInfo.email }
    });

    logger.info('User lookup result', { 
      foundUser: !!user, 
      userId: user?.id, 
      userEmail: user?.email,
      hasGoogleId: !!user?.googleId
    });

    if (!user) {
      // Create new user
      logger.info('Creating new user for Google OAuth', { email: userInfo.email });
      user = await prisma.user.create({
        data: {
          email: userInfo.email,
          name: userInfo.name,
          googleId: userInfo.id,
          emailVerified: true
        }
      });
    } else {
      // Update existing user with Google ID if not set
      if (!user.googleId) {
        logger.info('Linking existing user to Google account', { 
          userId: user.id, 
          email: user.email 
        });
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: userInfo.id }
        });
      } else {
        logger.info('User already linked to Google', { 
          userId: user.id, 
          email: user.email 
        });
      }
    }

    // Create or update Google Calendar integration
    const existingIntegration = await prisma.calendarIntegration.findFirst({
      where: {
        userId: user.id,
        provider: 'google'
      }
    });

    if (existingIntegration) {
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
      await prisma.calendarIntegration.create({
        data: {
          userId: user.id,
          provider: 'google',
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken,
          expiresAt: credentials.expiresAt,
          isActive: true
        }
      });
    }

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    logger.info('Google Calendar login successful', { 
      userId: user.id,
      email: user.email
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isEmailVerified: user.emailVerified
        },
        token
      },
      message: 'Login successful'
    });
  } catch (error) {
    logger.error('Error handling Google Calendar login callback:', error);
    throw createError('Failed to login with Google', 500);
  }
}));

// Handle Google Calendar OAuth callback (requires auth)
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

// Get available holiday calendars
router.get('/holiday-calendars', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
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

    const holidayCalendars = await googleCalendarService.getAvailableHolidayCalendars();

    res.json({
      success: true,
      data: holidayCalendars
    });
  } catch (error) {
    logger.error('Error fetching holiday calendars:', error);
    throw createError('Failed to fetch holiday calendars', 500);
  }
}));

// Subscribe to a holiday calendar
router.post('/subscribe-holiday', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { calendarId } = req.body;

  if (!calendarId) {
    throw createError('Calendar ID is required', 400);
  }

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

    const subscribedCalendar = await googleCalendarService.subscribeToHolidayCalendar(calendarId);

    logger.info('Holiday calendar subscribed', { 
      userId: req.user!.id,
      calendarId 
    });

    res.json({
      success: true,
      data: subscribedCalendar,
      message: 'Successfully subscribed to holiday calendar'
    });
  } catch (error) {
    logger.error('Error subscribing to holiday calendar:', error);
    throw createError('Failed to subscribe to holiday calendar', 500);
  }
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

// Clean up duplicate events
router.post('/cleanup-duplicates', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  try {
    // First, let's see what events exist for this user
    const allEvents = await prisma.event.findMany({
      where: { userId: req.user!.id },
      select: { id: true, title: true, startTime: true, createdAt: true },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log('🔍 All events for user:', allEvents.length);
    console.log('📋 Event details:', allEvents.map(e => ({
      id: e.id,
      title: e.title,
      startTime: e.startTime,
      createdAt: e.createdAt
    })));

    // Find and remove duplicate events - try multiple approaches
    const duplicates = await prisma.$queryRaw<Array<{ title: string; startTime: string; count: number }>>`
      SELECT title, "startTime", COUNT(*) as count
      FROM "events"
      WHERE "userId" = ${req.user!.id}
      GROUP BY title, "startTime"
      HAVING COUNT(*) > 1
    `;
    
    console.log('🔍 Found duplicates (exact match):', duplicates);

    // Also check for duplicates with similar titles (case-insensitive)
    const similarDuplicates = await prisma.$queryRaw<Array<{ title_lower: string; startTime: string; count: number }>>`
      SELECT LOWER(title) as title_lower, "startTime", COUNT(*) as count
      FROM "events"
      WHERE "userId" = ${req.user!.id}
      GROUP BY LOWER(title), "startTime"
      HAVING COUNT(*) > 1
    `;
    
    console.log('🔍 Found duplicates (similar titles):', similarDuplicates);

    // Check for events with same title but different times (might be recurring)
    const titleDuplicates = await prisma.$queryRaw<Array<{ title: string; count: number }>>`
      SELECT title, COUNT(*) as count
      FROM "events"
      WHERE "userId" = ${req.user!.id}
      GROUP BY title
      HAVING COUNT(*) > 1
    `;
    
    console.log('🔍 Found duplicates (same title):', titleDuplicates);

    let deletedCount = 0;
    
    // Handle exact duplicates (same title and time)
    for (const duplicate of duplicates) {
      const events = await prisma.event.findMany({
        where: {
          userId: req.user!.id,
          title: duplicate.title,
          startTime: new Date(duplicate.startTime)
        },
        orderBy: { createdAt: 'asc' }
      });

      if (events.length > 1) {
        const idsToDelete = events.slice(1).map(e => e.id);
        await prisma.event.deleteMany({
          where: { id: { in: idsToDelete } }
        });
        deletedCount += idsToDelete.length;
        console.log(`🗑️ Deleted ${idsToDelete.length} exact duplicates for "${duplicate.title}"`);
      }
    }
    
    // Handle similar duplicates (case-insensitive)
    for (const duplicate of similarDuplicates) {
      const events = await prisma.event.findMany({
        where: {
          userId: req.user!.id,
          startTime: new Date(duplicate.startTime)
        },
        orderBy: { createdAt: 'asc' }
      });

      // Filter by case-insensitive title match
      const matchingEvents = events.filter(event => 
        event.title.toLowerCase() === duplicate.title_lower
      );

      if (matchingEvents.length > 1) {
        const idsToDelete = matchingEvents.slice(1).map(e => e.id);
        await prisma.event.deleteMany({
          where: { id: { in: idsToDelete } }
        });
        deletedCount += idsToDelete.length;
        console.log(`🗑️ Deleted ${idsToDelete.length} similar duplicates for "${duplicate.title_lower}"`);
      }
    }
    
    // Handle title-only duplicates (keep the most recent one)
    for (const duplicate of titleDuplicates) {
      const events = await prisma.event.findMany({
        where: {
          userId: req.user!.id,
          title: duplicate.title
        },
        orderBy: { createdAt: 'desc' } // Keep the most recent
      });

      if (events.length > 1) {
        const idsToDelete = events.slice(1).map(e => e.id);
        await prisma.event.deleteMany({
          where: { id: { in: idsToDelete } }
        });
        deletedCount += idsToDelete.length;
        console.log(`🗑️ Deleted ${idsToDelete.length} title duplicates for "${duplicate.title}"`);
      }
    }

    logger.info('Cleaned up duplicate events', { 
      userId: req.user!.id, 
      deletedCount 
    });

    res.json({
      success: true,
      data: { deletedCount },
      message: `Cleaned up ${deletedCount} duplicate events`
    });
  } catch (error) {
    logger.error('Error cleaning up duplicates:', error);
    throw createError('Failed to clean up duplicates', 500);
  }
}));

// Get Google Calendar events
router.get('/events', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { calendarId = 'primary', timeMin, timeMax, maxResults = '100' } = req.query;
  
  // Decode the calendar ID if it was encoded by the frontend
  const decodedCalendarId = decodeURIComponent(calendarId as string);
  
  // Log calendar requests for debugging
  logger.info('Fetching Google Calendar events', { 
    originalCalendarId: calendarId,
    decodedCalendarId,
    timeMin,
    timeMax,
    maxResults,
    isHolidayCalendar: decodedCalendarId.includes('holiday')
  });

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

    // Set default time range to 1 year if not specified
    const defaultTimeMin = timeMin as string || new Date().toISOString()
    const defaultTimeMax = timeMax as string || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
    
    const events = await googleCalendarService.getEvents(decodedCalendarId, {
      timeMin: defaultTimeMin,
      timeMax: defaultTimeMax,
      maxResults: parseInt(maxResults as string)
    });

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    logger.error('Error fetching Google Calendar events:', error);
    
    // For holiday calendars, return empty array instead of throwing error
    if (decodedCalendarId.includes('holiday')) {
      logger.warn('Holiday calendar access failed, returning empty events', { 
        calendarId: decodedCalendarId,
        error: error.message 
      });
      return res.json({
        success: true,
        data: []
      });
    }
    
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
    let createdEvents = [];
    let updatedEvents = [];

    if (direction === 'from_google') {
      // Sync from Google Calendar to local database
      const syncResult = await googleCalendarService.syncEventsToLocal(
        calendarId,
        req.user!.id,
        prisma
      );
      stats = syncResult;
      createdEvents = syncResult.createdEvents || [];
      updatedEvents = syncResult.updatedEvents || [];
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
      const fromGoogleResult = await googleCalendarService.syncEventsToLocal(
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
        created: fromGoogleResult.created + toGoogleStats.created,
        updated: fromGoogleResult.updated + toGoogleStats.updated,
        errors: fromGoogleResult.errors + toGoogleStats.errors
      };
      createdEvents = fromGoogleResult.createdEvents || [];
      updatedEvents = fromGoogleResult.updatedEvents || [];
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
        stats,
        createdEvents,
        updatedEvents
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

// Subscribe to holiday calendar
router.post('/subscribe-holiday', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { calendarId } = req.body;

  if (!calendarId) {
    throw createError('Calendar ID is required', 400);
  }

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

    await googleCalendarService.subscribeToHolidayCalendar(calendarId);

    logger.info('Holiday calendar subscribed', { 
      userId: req.user!.id,
      calendarId
    });

    res.json({
      success: true,
      message: 'Successfully subscribed to holiday calendar'
    });
  } catch (error) {
    logger.error('Error subscribing to holiday calendar:', error);
    throw createError('Failed to subscribe to holiday calendar', 500);
  }
}));

// Unsubscribe from holiday calendar (safe - preserves user-created events)
router.delete('/unsubscribe-holiday', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { calendarId } = req.body;

  if (!calendarId) {
    throw createError('Calendar ID is required', 400);
  }

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

    // Unsubscribe from the holiday calendar
    await googleCalendarService.unsubscribeFromHolidayCalendar(calendarId);

    // IMPORTANT: Only delete events that were synced from this specific holiday calendar
    // This preserves any user-created events or tasks
    const deletedEvents = await prisma.event.deleteMany({
      where: {
        userId: req.user!.id,
        calendarProvider: 'google',
        calendarEventId: {
          not: null // Only delete events that have a Google Calendar event ID
        },
        // Additional safety: only delete events that match holiday calendar patterns
        OR: [
          { title: { contains: 'Holiday' } },
          { title: { contains: 'Christmas' } },
          { title: { contains: 'Thanksgiving' } },
          { title: { contains: 'New Year' } },
          { title: { contains: 'Independence Day' } },
          { title: { contains: 'Memorial Day' } },
          { title: { contains: 'Labor Day' } },
          { title: { contains: 'Veterans Day' } },
          { title: { contains: 'Presidents Day' } },
          { title: { contains: 'Martin Luther King' } },
          { title: { contains: 'Columbus Day' } }
        ]
      }
    });

    logger.info('Holiday calendar unsubscribed and related events cleaned up', { 
      userId: req.user!.id,
      calendarId,
      deletedEventsCount: deletedEvents.count
    });

    res.json({
      success: true,
      message: 'Successfully unsubscribed from holiday calendar',
      data: {
        deletedEventsCount: deletedEvents.count,
        preservedUserEvents: true
      }
    });
  } catch (error) {
    logger.error('Error unsubscribing from holiday calendar:', error);
    throw createError('Failed to unsubscribe from holiday calendar', 500);
  }
}));

// Get available holiday calendars
router.get('/holiday-calendars', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
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

    const holidayCalendars = await googleCalendarService.getAvailableHolidayCalendars();

    res.json({
      success: true,
      data: holidayCalendars,
      message: 'Holiday calendars retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting holiday calendars:', error);
    throw createError('Failed to get holiday calendars', 500);
  }
}));

export default router;
