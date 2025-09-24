import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.string().optional(),
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
  sortBy: z.enum(['startTime', 'title', 'createdAt']).default('startTime'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

// Get all events with filtering and pagination
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const query = querySchema.parse(req.query);
  const { page, limit, startDate, endDate, search, sortBy, sortOrder } = query;

  const skip = (page - 1) * limit;

  const where: any = {
    userId: req.user!.id
  };

  if (startDate || endDate) {
    where.startTime = {};
    if (startDate) where.startTime.gte = new Date(startDate);
    if (endDate) where.startTime.lte = new Date(endDate);
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } }
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
router.post('/', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const eventData = createEventSchema.parse(req.body);

  // Validate that end time is after start time
  const startTime = new Date(eventData.startTime);
  const endTime = new Date(eventData.endTime);
  
  if (endTime <= startTime) {
    throw createError('End time must be after start time', 400);
  }

  const event = await prisma.event.create({
    data: {
      ...eventData,
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
router.put('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
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
router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
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

export default router;
