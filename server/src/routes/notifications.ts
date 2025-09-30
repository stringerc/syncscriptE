import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { NotificationType } from '../types';
import { notificationService } from '../services/notificationService';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createNotificationSchema = z.object({
  type: z.nativeEnum(NotificationType),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  actionUrl: z.string().optional(),
  metadata: z.any().optional()
});

const updateNotificationSchema = z.object({
  isRead: z.boolean().optional(),
  actionUrl: z.string().optional(),
  metadata: z.any().optional()
});

const querySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  type: z.nativeEnum(NotificationType).optional(),
  isRead: z.string().transform(val => val === 'true').optional(),
  sortBy: z.enum(['createdAt', 'type', 'isRead']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Get all notifications with filtering and pagination
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const query = querySchema.parse(req.query);
  const { page, limit, type, isRead, sortBy, sortOrder } = query;

  const skip = (page - 1) * limit;

  const where: any = {
    userId: req.user!.id
  };

  if (type) where.type = type;
  if (isRead !== undefined) where.isRead = isRead;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit
    }),
    prisma.notification.count({ where })
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  });
}));

// Get notification preferences
router.get('/preferences', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: req.user!.id }
    });

    if (!preferences) {
      // Create default preferences if none exist
      const defaultPreferences = {
        userId: req.user!.id,
        channels: JSON.stringify({
          in_app: { enabled: true, sound: true, showBadge: true },
          email: { enabled: true, frequency: 'immediate', types: ['task_reminder', 'event_reminder', 'deadline_warning'] },
          push: { enabled: true, sound: true, vibration: true },
          desktop: { enabled: true, sound: true, showPreview: true }
        }),
        timing: JSON.stringify({
          quietHours: { enabled: false, start: '22:00', end: '08:00', timezone: 'UTC' },
          energyBasedTiming: true,
          respectFocusMode: true
        }),
        types: JSON.stringify({
          task_reminders: { enabled: true, advanceMinutes: 15, priority: 'medium' },
          event_reminders: { enabled: true, advanceMinutes: 30, priority: 'medium' },
          energy_alerts: { enabled: true, threshold: 3, priority: 'high' },
          achievements: { enabled: true, priority: 'low' },
          deadline_warnings: { enabled: true, advanceHours: 2, priority: 'high' },
          system: { enabled: true, priority: 'medium' }
        })
      };

      const newPreferences = await prisma.notificationPreferences.create({
        data: defaultPreferences
      });

      return res.json({
        success: true,
        data: {
          ...newPreferences,
          channels: JSON.parse(newPreferences.channels),
          timing: JSON.parse(newPreferences.timing),
          types: JSON.parse(newPreferences.types)
        }
      });
    }

    res.json({
      success: true,
      data: {
        ...preferences,
        channels: JSON.parse(preferences.channels),
        timing: JSON.parse(preferences.timing),
        types: JSON.parse(preferences.types)
      }
    });
  } catch (error) {
    logger.error('Error fetching notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch preferences'
    });
  }
}));

// Get notification stats
router.get('/stats', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      total,
      unread,
      byType,
      byPriority,
      todayCount,
      weekCount,
      monthCount
    ] = await Promise.all([
      prisma.notification.count({ where: { userId: req.user!.id } }),
      prisma.notification.count({ where: { userId: req.user!.id, isRead: false } }),
      prisma.notification.groupBy({
        by: ['type'],
        where: { userId: req.user!.id },
        _count: { type: true }
      }),
      prisma.notification.groupBy({
        by: ['priority'],
        where: { userId: req.user!.id },
        _count: { priority: true }
      }),
      prisma.notification.count({ 
        where: { userId: req.user!.id, createdAt: { gte: today } }
      }),
      prisma.notification.count({ 
        where: { userId: req.user!.id, createdAt: { gte: weekAgo } }
      }),
      prisma.notification.count({ 
        where: { userId: req.user!.id, createdAt: { gte: monthAgo } }
      })
    ]);

    const stats = {
      total,
      unread,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<string, number>),
      byPriority: byPriority.reduce((acc, item) => {
        acc[item.priority || 'unknown'] = item._count.priority;
        return acc;
      }, {} as Record<string, number>),
      recentActivity: {
        today: todayCount,
        thisWeek: weekCount,
        thisMonth: monthCount
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats'
    });
  }
}));

// Get notification by ID
router.get('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const notification = await prisma.notification.findFirst({
    where: {
      id,
      userId: req.user!.id
    }
  });

  if (!notification) {
    throw createError('Notification not found', 404);
  }

  res.json({
    success: true,
    data: notification
  });
}));

// Create new notification
router.post('/', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const notificationData = createNotificationSchema.parse(req.body);

  const notification = await prisma.notification.create({
    data: {
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      actionUrl: notificationData.actionUrl,
      metadata: notificationData.metadata ? JSON.stringify(notificationData.metadata) : null,
      userId: req.user!.id
    }
  });

  logger.info('Notification created', { userId: req.user!.id, notificationId: notification.id });

  res.status(201).json({
    success: true,
    data: notification,
    message: 'Notification created successfully'
  });
}));

// Update notification
router.put('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const updateData = updateNotificationSchema.parse(req.body);

  const notification = await prisma.notification.findFirst({
    where: {
      id,
      userId: req.user!.id
    }
  });

  if (!notification) {
    throw createError('Notification not found', 404);
  }

  const updatedNotification = await prisma.notification.update({
    where: { id },
    data: updateData
  });

  logger.info('Notification updated', { userId: req.user!.id, notificationId: notification.id });

  res.json({
    success: true,
    data: updatedNotification,
    message: 'Notification updated successfully'
  });
}));

// Delete notification
router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const notification = await prisma.notification.findFirst({
    where: {
      id,
      userId: req.user!.id
    }
  });

  if (!notification) {
    throw createError('Notification not found', 404);
  }

  await prisma.notification.delete({
    where: { id }
  });

  logger.info('Notification deleted', { userId: req.user!.id, notificationId: id });

  res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
}));

// Mark notification as read
router.patch('/:id/read', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const notification = await prisma.notification.findFirst({
    where: {
      id,
      userId: req.user!.id
    }
  });

  if (!notification) {
    throw createError('Notification not found', 404);
  }

  const updatedNotification = await prisma.notification.update({
    where: { id },
    data: { isRead: true }
  });

  logger.info('Notification marked as read', { userId: req.user!.id, notificationId: id });

  res.json({
    success: true,
    data: updatedNotification,
    message: 'Notification marked as read'
  });
}));

// Mark all notifications as read
router.patch('/mark-all-read', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const result = await prisma.notification.updateMany({
    where: {
      userId: req.user!.id,
      isRead: false
    },
    data: { isRead: true }
  });

  logger.info('All notifications marked as read', { userId: req.user!.id, count: result.count });

  res.json({
    success: true,
    data: { updatedCount: result.count },
    message: `Marked ${result.count} notifications as read`
  });
}));

// Get unread notifications count
router.get('/unread/count', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const count = await prisma.notification.count({
    where: {
      userId: req.user!.id,
      isRead: false
    }
  });

  res.json({
    success: true,
    data: { count }
  });
}));

// Get recent notifications
router.get('/recent', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { limit = '10' } = req.query;
  const limitNumber = parseInt(limit as string);

  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: limitNumber
  });

  res.json({
    success: true,
    data: notifications
  });
}));

// POST /send - Manually trigger notification (for testing/admin)
router.post('/send', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { type, title, body, data } = req.body;
  const userId = req.user!.id;

  const success = await notificationService.sendNotification(userId, type, title, body, data);

  res.json({
    success,
    message: success ? 'Notification sent' : 'Failed to send notification'
  });
}));

// POST /check-due-tasks - Trigger due task notification check (cron job endpoint)
router.post('/check-due-tasks', asyncHandler(async (req, res) => {
  // TODO: Add admin/cron authentication
  await notificationService.checkDueTaskNotifications();

  res.json({
    success: true,
    message: 'Due task notifications checked'
  });
}));

export default router;
