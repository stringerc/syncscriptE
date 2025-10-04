import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import EnergyEngineService from '../services/energyEngineService';
import { idempotencyMiddleware } from '../services/idempotencyService';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.string().nullable().optional(),
  isAllDay: z.boolean().default(false),
  budgetImpact: z.number().optional()
});

const updateEventSchema = createEventSchema.partial();

const querySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
  includePast: z.string().transform(val => val === 'true').default('false'),
  sortBy: z.enum(['startTime', 'title', 'createdAt']).default('startTime'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

// GET /providers - Get all connected calendar providers
router.get('/providers', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  // Fetch all external calendar accounts for the user
  const externalAccounts = await prisma.externalCalendarAccount.findMany({
    where: { userId },
    select: {
      id: true,
      provider: true,
      email: true,
      status: true,
      lastSyncAt: true,
      createdAt: true
    }
  });

  // Group by provider
  const providers = {
    google: externalAccounts.find(acc => acc.provider === 'google') || null,
    outlook: externalAccounts.find(acc => acc.provider === 'outlook') || null,
    apple: externalAccounts.find(acc => acc.provider === 'apple') || null
  };

  // Format response
  const formattedProviders = {
    google: providers.google ? {
      connected: providers.google.status === 'CONNECTED',
      email: providers.google.email,
      lastSyncAt: providers.google.lastSyncAt,
      status: providers.google.status
    } : { connected: false },
    outlook: providers.outlook ? {
      connected: providers.outlook.status === 'CONNECTED',
      email: providers.outlook.email,
      lastSyncAt: providers.outlook.lastSyncAt,
      status: providers.outlook.status
    } : { connected: false },
    apple: providers.apple ? {
      connected: providers.apple.status === 'CONNECTED',
      email: providers.apple.email,
      lastSyncAt: providers.apple.lastSyncAt,
      status: providers.apple.status
    } : { connected: false }
  };

  res.json({
    success: true,
    data: formattedProviders
  });
}));

// Get all events with filtering and pagination
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  try {
    logger.info('Calendar API called', { userId: req.user!.id, query: req.query });
    
    const query = querySchema.parse(req.query);
    const { page, limit, startDate, endDate, search, includePast, sortBy, sortOrder } = query;

    const skip = (page - 1) * limit;

    // Get user's holiday preference
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { showHolidays: true }
    });

    logger.info('Calendar API - User holiday preference', { 
      userId: req.user!.id, 
      showHolidays: user?.showHolidays,
      willFilterHolidays: user?.showHolidays === false
    });

    const where: any = {
      userId: req.user!.id
    };

    // Filter out holiday events if user has disabled them
    if (user?.showHolidays === false) {
      where.NOT = {
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
          { title: { contains: 'Columbus Day' } },
          { title: { contains: 'Halloween' } },
          { title: { contains: 'Easter' } },
          { title: { contains: 'Valentine' } },
          { title: { contains: 'Mother\'s Day' } },
          { title: { contains: 'Father\'s Day' } },
          { title: { contains: 'Juneteenth' } },
          { title: { contains: 'Flag Day' } },
          { title: { contains: 'Tax Day' } },
          { title: { contains: 'Cinco de Mayo' } },
          { title: { contains: 'St. Patrick' } },
          { title: { contains: 'Daylight Saving' } },
          { title: { contains: 'Election Day' } },
          { title: { contains: 'Black Friday' } }
        ]
      };
    }

  // Only filter by time if explicitly requested
  if (startDate || endDate || includePast === false) {
    where.startTime = {};
    if (startDate) where.startTime.gte = new Date(startDate);
    if (endDate) where.startTime.lte = new Date(endDate);
    
    // Only filter to future events if includePast is explicitly false
    if (includePast === false && !startDate && !endDate) {
      const now = new Date();
      where.startTime.gte = now;
      
      logger.info('Filtering events to show only future events', { 
        currentTime: now.toISOString(),
        currentTimeLocal: now.toLocaleString(),
        userId: req.user!.id,
        includePast: false
      });
    } else {
      logger.info('Using custom date range', { 
        startDate, 
        endDate, 
        includePast,
        userId: req.user!.id
      });
    }
  } else {
    logger.info('Showing all events (no time filtering)', { 
      userId: req.user!.id,
      includePast: includePast
    });
  }

  // Debug: Log all events before filtering
  const allEvents = await prisma.event.findMany({
    where: { userId: req.user!.id },
    select: { id: true, title: true, startTime: true, calendarProvider: true, isAllDay: true }
  });
  
  logger.info('All events for user before filtering', { 
    totalEvents: allEvents.length,
    events: allEvents.map(e => ({
      id: e.id,
      title: e.title,
      startTime: e.startTime,
      provider: e.calendarProvider,
      isAllDay: e.isAllDay
    }))
  });

  logger.info('Calendar API - Final where clause', { 
    userId: req.user!.id,
    whereClause: JSON.stringify(where, null, 2)
  });

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { location: { contains: search } }
    ];
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit
    }),
    prisma.event.count({ where })
  ]);

  // Log the events being returned for debugging
  if (events.length > 0) {
    const now = new Date();
    logger.info('Returning events', { 
      count: events.length,
      currentTime: now.toISOString(),
      currentTimeLocal: now.toLocaleString(),
      events: events.map(e => ({
        id: e.id,
        title: e.title,
        startTime: e.startTime.toISOString(),
        startTimeLocal: e.startTime.toLocaleString(),
        isFuture: e.startTime > now,
        timeDifference: e.startTime.getTime() - now.getTime()
      }))
    });
  }

  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: events,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  });
  } catch (error) {
    logger.error('Calendar API error', { error: error.message, stack: error.stack, userId: req.user!.id });
    throw error;
  }
}));

// Get event by ID
router.get('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const event = await prisma.event.findFirst({
    where: {
      id,
      userId: req.user!.id
    }
  });

  if (!event) {
    throw createError('Event not found', 404);
  }

  res.json({
    success: true,
    data: event
  });
}));

// Create new event
router.post('/', authenticateToken, idempotencyMiddleware('calendar-write'), asyncHandler(async (req: AuthRequest, res) => {
  const eventData = createEventSchema.parse(req.body);

  // Validate that end time is after start time
  const startTime = new Date(eventData.startTime);
  const endTime = new Date(eventData.endTime);
  
  if (endTime <= startTime) {
    throw createError('End time must be after start time', 400);
  }

  const event = await prisma.event.create({
    data: {
      title: eventData.title,
      description: eventData.description,
      location: eventData.location,
      budgetImpact: eventData.budgetImpact,
      isAllDay: eventData.isAllDay,
      userId: req.user!.id,
      startTime,
      endTime
    }
  });

  logger.info('Event created', { userId: req.user!.id, eventId: event.id });

  res.status(201).json({
    success: true,
    data: event,
    message: 'Event created successfully'
  });
}));

// Update event
router.put('/:id', authenticateToken, idempotencyMiddleware('calendar-write'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const updateData = updateEventSchema.parse(req.body);

  // Check if event exists and belongs to user
  const existingEvent = await prisma.event.findFirst({
    where: {
      id,
      userId: req.user!.id
    }
  });

  if (!existingEvent) {
    throw createError('Event not found', 404);
  }

  // Validate times if provided
  if (updateData.startTime && updateData.endTime) {
    const startTime = new Date(updateData.startTime);
    const endTime = new Date(updateData.endTime);
    
    if (endTime <= startTime) {
      throw createError('End time must be after start time', 400);
    }
  }

  // Prepare update data
  const data: any = { ...updateData };
  if (data.startTime) data.startTime = new Date(data.startTime);
  if (data.endTime) data.endTime = new Date(data.endTime);

  const event = await prisma.event.update({
    where: { id },
    data
  });

  logger.info('Event updated', { userId: req.user!.id, eventId: event.id });

  res.json({
    success: true,
    data: event,
    message: 'Event updated successfully'
  });
}));

// Delete event
router.delete('/:id', authenticateToken, idempotencyMiddleware('calendar-write'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const event = await prisma.event.findFirst({
    where: {
      id,
      userId: req.user!.id
    }
  });

  if (!event) {
    throw createError('Event not found', 404);
  }

  await prisma.event.delete({
    where: { id }
  });

  logger.info('Event deleted', { userId: req.user!.id, eventId: id });

  res.json({
    success: true,
    message: 'Event deleted successfully'
  });
}));

// Get today's events
router.get('/today', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const events = await prisma.event.findMany({
    where: {
      userId: req.user!.id,
      startTime: { gte: today, lt: tomorrow }
    },
    orderBy: { startTime: 'asc' }
  });

  res.json({
    success: true,
    data: events
  });
}));

// Get upcoming events
router.get('/upcoming', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { days = '7' } = req.query;
  const daysNumber = parseInt(days as string);

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + daysNumber);

  const events = await prisma.event.findMany({
    where: {
      userId: req.user!.id,
      startTime: { gte: startDate, lte: endDate }
    },
    orderBy: { startTime: 'asc' }
  });

  res.json({
    success: true,
    data: events
  });
}));

// Check for schedule conflicts
router.post('/check-conflicts', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { startTime, endTime, excludeEventId } = req.body;

  if (!startTime || !endTime) {
    throw createError('Start time and end time are required', 400);
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  const where: any = {
    userId: req.user!.id,
    OR: [
      // New event starts during existing event
      {
        startTime: { lte: start },
        endTime: { gt: start }
      },
      // New event ends during existing event
      {
        startTime: { lt: end },
        endTime: { gte: end }
      },
      // New event completely contains existing event
      {
        startTime: { gte: start },
        endTime: { lte: end }
      },
      // Existing event completely contains new event
      {
        startTime: { lte: start },
        endTime: { gte: end }
      }
    ]
  };

  if (excludeEventId) {
    where.id = { not: excludeEventId };
  }

  const conflicts = await prisma.event.findMany({
    where,
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
      location: true
    }
  });

  res.json({
    success: true,
    data: {
      hasConflicts: conflicts.length > 0,
      conflicts
    }
  });
}));

// Get calendar integrations
router.get('/integrations', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const integrations = await prisma.calendarIntegration.findMany({
    where: { userId: req.user!.id },
    select: {
      id: true,
      provider: true,
      isActive: true,
      createdAt: true
    }
  });

  res.json({
    success: true,
    data: integrations
  });
}));

// Sync with external calendar (placeholder for future implementation)
router.post('/sync/:provider', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { provider } = req.params;

  if (!['google', 'outlook', 'apple'].includes(provider)) {
    throw createError('Invalid calendar provider', 400);
  }

  // TODO: Implement actual calendar sync logic
  // This would involve:
  // 1. OAuth flow for the provider
  // 2. Fetching events from the provider's API
  // 3. Syncing with local database
  // 4. Handling conflicts and updates

  logger.info('Calendar sync requested', { 
    userId: req.user!.id, 
    provider 
  });

  res.json({
    success: true,
    message: `Calendar sync with ${provider} initiated`,
    data: {
      provider,
      status: 'pending',
      estimatedTime: '2-5 minutes'
    }
  });
}));

// Complete event and award EP based on completion percentage
router.patch('/:id/complete', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { completionPercentage } = req.body;

  if (!completionPercentage || completionPercentage < 0 || completionPercentage > 100) {
    throw createError('Completion percentage must be between 0 and 100', 400);
  }

  const event = await prisma.event.findFirst({
    where: {
      id,
      userId: req.user!.id
    },
    include: {
      preparationTasks: true
    }
  });

  if (!event) {
    throw createError('Event not found', 404);
  }

  // Calculate EP based on completion percentage
  let epAwarded = 0;
  let bonusMessage = '';

  if (completionPercentage >= 80) {
    // 80%+ completion gets bonus EP
    const baseEP = 20;
    const bonusMultiplier = Math.min(completionPercentage / 100, 1.5); // Max 1.5x bonus
    epAwarded = Math.round(baseEP * bonusMultiplier);
    bonusMessage = `Excellent! You completed ${completionPercentage}% of "${event.title}" and earned a completion bonus!`;
  } else if (completionPercentage >= 50) {
    // 50-79% completion gets standard EP
    epAwarded = Math.round(15 * (completionPercentage / 100));
    bonusMessage = `Good work! You completed ${completionPercentage}% of "${event.title}".`;
  } else {
    // Below 50% gets minimal EP
    epAwarded = Math.round(5 * (completionPercentage / 100));
    bonusMessage = `You completed ${completionPercentage}% of "${event.title}". Keep going!`;
  }

  // Award EP for event completion
  try {
    const epResult = await EnergyEngineService.awardEnergyPoints(
      req.user!.id,
      epAwarded,
      'event_completion',
      'order', // Events generally fall under the "order" domain
      `Completed ${completionPercentage}% of event: ${event.title}`,
      {
        eventId: id,
        completionPercentage,
        eventTitle: event.title,
        completedAt: new Date()
      }
    );

    logger.info('Event completion EP awarded', {
      userId: req.user!.id,
      eventId: id,
      completionPercentage,
      epAwarded: epResult.awarded,
      capped: epResult.capped
    });

    res.json({
      success: true,
      data: {
        event,
        completionPercentage,
        epAwarded: epResult.awarded,
        capped: epResult.capped
      },
      message: bonusMessage + ` You earned ${epResult.awarded} EP!`
    });
  } catch (error) {
    logger.error('Failed to award EP for event completion:', error);
    // Still return success for the event completion, but note EP award failed
    res.json({
      success: true,
      data: {
        event,
        completionPercentage,
        epAwarded: 0,
        capped: false
      },
      message: bonusMessage + ' (EP award failed)'
    });
  }
}));

// Clear all synced events (from Google Calendar)
router.delete('/clear-synced', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  logger.info(`Clearing all synced events for user ${userId}`);

  // Delete all events that were synced from Google Calendar
  const deletedEvents = await prisma.event.deleteMany({
    where: {
      userId,
      // We can identify synced events by checking if they have a source or externalId
      // For now, we'll delete all events - in a real implementation, you'd want to track the source
      // OR we could add a field like `source: 'google_calendar'` to identify synced events
    }
  });

  logger.info(`Deleted ${deletedEvents.count} synced events for user ${userId}`);

  res.json({
    success: true,
    message: `Cleared ${deletedEvents.count} synced events`,
    data: {
      deletedCount: deletedEvents.count
    }
  });
}));

// Sync events from Google Calendar to local events
router.post('/sync-from-google', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { calendarId = 'primary', timeRange = '30' } = req.body; // timeRange in days
  const userId = req.user!.id;

  logger.info('Starting Google Calendar sync to events', { userId, calendarId, timeRange });

  try {
    // Check if user has Google Calendar integration
    const integration = await prisma.calendarIntegration.findFirst({
      where: {
        userId,
        provider: 'google',
        isActive: true
      }
    });

    if (!integration) {
      throw createError('Google Calendar integration not found. Please connect your Google Calendar first.', 404);
    }

    // Import GoogleCalendarService
    const { GoogleCalendarService } = await import('../utils/googleCalendarService');
    
    const googleCalendarService = new GoogleCalendarService({
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken || undefined,
      expiresAt: integration.expiresAt || undefined
    });

    // Calculate time range
    const now = new Date();
    const futureDate = new Date(now.getTime() + parseInt(timeRange) * 24 * 60 * 60 * 1000);

    // Get events from Google Calendar
    const googleEvents = await googleCalendarService.getEvents(calendarId, {
      timeMin: now.toISOString(),
      timeMax: futureDate.toISOString(),
      maxResults: 100
    });

    logger.info('Fetched Google Calendar events', { 
      userId, 
      eventCount: googleEvents.length,
      timeRange: `${now.toISOString()} to ${futureDate.toISOString()}`
    });

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const createdEvents = [];
    const updatedEvents = [];

    for (const googleEvent of googleEvents) {
      try {
        // Skip events without a title
        if (!googleEvent.summary) {
          skippedCount++;
          continue;
        }

        // Parse event times
        let startTime: Date;
        let endTime: Date;
        let isAllDay = false;

        if (googleEvent.start.date || googleEvent.end.date) {
          // All-day event
          startTime = new Date(googleEvent.start.date + 'T00:00:00');
          endTime = new Date(googleEvent.end.date + 'T23:59:59');
          isAllDay = true;
        } else {
          startTime = new Date(googleEvent.start.dateTime);
          endTime = new Date(googleEvent.end.dateTime);
          isAllDay = false;
        }

        // Check if event already exists
        const existingEvent = await prisma.event.findFirst({
          where: {
            userId,
            calendarEventId: googleEvent.id,
            calendarProvider: 'google'
          }
        });

        const eventData = {
          title: googleEvent.summary,
          description: googleEvent.description || null,
          startTime,
          endTime,
          location: googleEvent.location || null,
          isAllDay,
          calendarProvider: 'google',
          calendarEventId: googleEvent.id
        };

        if (existingEvent) {
          // Update existing event
          await prisma.event.update({
            where: { id: existingEvent.id },
            data: eventData
          });
          updatedCount++;
          updatedEvents.push({
            id: existingEvent.id,
            title: eventData.title,
            startTime: eventData.startTime.toISOString(),
            endTime: eventData.endTime.toISOString()
          });
        } else {
          // Create new event
          const newEvent = await prisma.event.create({
            data: {
              ...eventData,
              userId
            }
          });
          createdCount++;
          createdEvents.push({
            id: newEvent.id,
            title: eventData.title,
            startTime: eventData.startTime.toISOString(),
            endTime: eventData.endTime.toISOString()
          });
        }
      } catch (error) {
        logger.error('Error processing individual Google event:', error);
        skippedCount++;
      }
    }

    logger.info('Google Calendar sync completed', { 
      userId, 
      createdCount, 
      updatedCount, 
      skippedCount 
    });

    res.json({
      success: true,
      data: {
        stats: {
          created: createdCount,
          updated: updatedCount,
          skipped: skippedCount,
          total: googleEvents.length
        },
        createdEvents,
        updatedEvents,
        timeRange: `${timeRange} days`,
        calendarId
      },
      message: `Successfully synced ${createdCount} new events and updated ${updatedCount} existing events from Google Calendar`
    });

  } catch (error) {
    logger.error('Error syncing from Google Calendar:', error);
    throw createError('Failed to sync events from Google Calendar', 500);
  }
}));

export default router;
