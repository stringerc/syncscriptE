import express from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

// Search endpoint
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { q: query, type, limit = '20' } = req.query;
  
  if (!query || typeof query !== 'string') {
    throw createError('Search query is required', 400);
  }

  const searchQuery = query.trim();
  const limitNumber = parseInt(limit as string);
  const userId = req.user!.id;

  logger.info('Search request', { userId, query: searchQuery, type });

  try {
    const results = {
      tasks: [],
      events: [],
      totalResults: 0
    };

    // Search tasks
    if (!type || type === 'tasks' || type === 'all') {
      const tasks = await prisma.task.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: searchQuery } },
            { description: { contains: searchQuery } },
            { tags: { contains: searchQuery } }
          ]
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ],
        take: limitNumber,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          scheduledAt: true,
          createdAt: true,
          tags: true
        }
      });

      results.tasks = tasks.map(task => ({
        id: task.id,
        type: 'task',
        title: task.title,
        description: task.description,
        date: task.dueDate || task.scheduledAt,
        status: task.status,
        priority: task.priority,
        tags: task.tags,
        createdAt: task.createdAt
      }));
    }

    // Search events
    if (!type || type === 'events' || type === 'all') {
      const events = await prisma.event.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: searchQuery } },
            { description: { contains: searchQuery } },
            { location: { contains: searchQuery } }
          ]
        },
        orderBy: [
          { startTime: 'asc' },
          { createdAt: 'desc' }
        ],
        take: limitNumber,
        select: {
          id: true,
          title: true,
          description: true,
          startTime: true,
          endTime: true,
          location: true,
          createdAt: true
        }
      });

      results.events = events.map(event => ({
        id: event.id,
        type: 'event',
        title: event.title,
        description: event.description,
        date: event.startTime,
        endDate: event.endTime,
        location: event.location,
        createdAt: event.createdAt
      }));
    }

    // Calculate total results
    results.totalResults = results.tasks.length + results.events.length;

    logger.info('Search completed', { 
      userId, 
      query: searchQuery, 
      taskCount: results.tasks.length,
      eventCount: results.events.length,
      totalResults: results.totalResults
    });

    res.json({
      success: true,
      data: results,
      message: `Found ${results.totalResults} results for "${searchQuery}"`
    });

  } catch (error) {
    logger.error('Search error:', error);
    throw createError('Search failed', 500);
  }
}));

// Advanced search endpoint
router.get('/advanced', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { 
    q: query, 
    type, 
    status, 
    priority, 
    dateFrom, 
    dateTo, 
    tags,
    limit = '20',
    sortBy = 'relevance',
    sortOrder = 'desc'
  } = req.query;

  if (!query || typeof query !== 'string') {
    throw createError('Search query is required', 400);
  }

  const searchQuery = query.trim();
  const limitNumber = parseInt(limit as string);
  const userId = req.user!.id;

  logger.info('Advanced search request', { 
    userId, 
    query: searchQuery, 
    filters: { type, status, priority, dateFrom, dateTo, tags }
  });

  try {
    const results = {
      tasks: [],
      events: [],
      totalResults: 0,
      filters: {
        type,
        status,
        priority,
        dateFrom,
        dateTo,
        tags
      }
    };

    // Build task search conditions
    if (!type || type === 'tasks' || type === 'all') {
      const taskWhere: any = {
        userId,
        OR: [
          { title: { contains: searchQuery } },
          { description: { contains: searchQuery } },
          { tags: { has: searchQuery } }
        ]
      };

      // Add filters
      if (status) taskWhere.status = status;
      if (priority) taskWhere.priority = priority;
      if (tags) taskWhere.tags = { hasSome: Array.isArray(tags) ? tags : [tags] };
      if (dateFrom || dateTo) {
        taskWhere.dueDate = {};
        if (dateFrom) taskWhere.dueDate.gte = new Date(dateFrom as string);
        if (dateTo) taskWhere.dueDate.lte = new Date(dateTo as string);
      }

      const tasks = await prisma.task.findMany({
        where: taskWhere,
        orderBy: getSortOrder(sortBy as string, sortOrder as string),
        take: limitNumber,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          scheduledAt: true,
          createdAt: true,
          tags: true,
          energyRequired: true,
          estimatedDuration: true
        }
      });

      results.tasks = tasks.map(task => ({
        id: task.id,
        type: 'task',
        title: task.title,
        description: task.description,
        date: task.dueDate || task.scheduledAt,
        status: task.status,
        priority: task.priority,
        tags: task.tags,
        energyRequired: task.energyRequired,
        estimatedDuration: task.estimatedDuration,
        createdAt: task.createdAt
      }));
    }

    // Build event search conditions
    if (!type || type === 'events' || type === 'all') {
      const eventWhere: any = {
        userId,
        OR: [
          { title: { contains: searchQuery } },
          { description: { contains: searchQuery } },
          { location: { contains: searchQuery } }
        ]
      };

      // Add date filters for events
      if (dateFrom || dateTo) {
        eventWhere.startTime = {};
        if (dateFrom) eventWhere.startTime.gte = new Date(dateFrom as string);
        if (dateTo) eventWhere.startTime.lte = new Date(dateTo as string);
      }

      const events = await prisma.event.findMany({
        where: eventWhere,
        orderBy: [
          { startTime: 'asc' },
          { createdAt: 'desc' }
        ],
        take: limitNumber,
        select: {
          id: true,
          title: true,
          description: true,
          startTime: true,
          endTime: true,
          location: true,
          createdAt: true
        }
      });

      results.events = events.map(event => ({
        id: event.id,
        type: 'event',
        title: event.title,
        description: event.description,
        date: event.startTime,
        endDate: event.endTime,
        location: event.location,
        createdAt: event.createdAt
      }));
    }

    results.totalResults = results.tasks.length + results.events.length;

    logger.info('Advanced search completed', { 
      userId, 
      query: searchQuery, 
      taskCount: results.tasks.length,
      eventCount: results.events.length,
      totalResults: results.totalResults
    });

    res.json({
      success: true,
      data: results,
      message: `Found ${results.totalResults} results for "${searchQuery}" with applied filters`
    });

  } catch (error) {
    logger.error('Advanced search error:', error);
    throw createError('Advanced search failed', 500);
  }
}));

// Helper function to get sort order for Railway deployment
function getSortOrder(sortBy: string, sortOrder: string) {
  const order: 'asc' | 'desc' = sortOrder === 'asc' ? 'asc' : 'desc';
  
  switch (sortBy) {
    case 'title':
      return [{ title: order }];
    case 'date':
      return [{ dueDate: order }];
    case 'priority':
      return [{ priority: order }];
    case 'status':
      return [{ status: order }];
    case 'created':
      return [{ createdAt: order }];
    case 'relevance':
    default:
      return [
        { priority: 'desc' as const },
        { dueDate: 'asc' as const },
        { createdAt: 'desc' as const }
      ];
  }
}

export default router;
