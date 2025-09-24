import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  timezone: z.string().optional(),
  energyLevel: z.number().min(1).max(10).optional(),
  avatar: z.string().url().optional()
});

const updateSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  aiSchedulingEnabled: z.boolean().optional(),
  aiBudgetAdviceEnabled: z.boolean().optional(),
  aiEnergyAdaptation: z.boolean().optional(),
  dataSharingEnabled: z.boolean().optional(),
  workHoursStart: z.string().optional(),
  workHoursEnd: z.string().optional(),
  breakDuration: z.number().positive().optional()
});

const energyLevelSchema = z.object({
  level: z.number().min(1).max(10),
  notes: z.string().optional()
});

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required to delete account'),
  confirmDelete: z.boolean().refine(val => val === true, 'You must confirm account deletion')
});

// Get user profile
router.get('/profile', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      settings: true,
      achievements: {
        orderBy: { unlockedAt: 'desc' },
        take: 10
      },
      streaks: true,
      _count: {
        select: {
          tasks: true,
          events: true,
          notifications: {
            where: { isRead: false }
          }
        }
      }
    }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    data: userWithoutPassword
  });
}));

// Update user profile
router.put('/profile', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const updateData = updateProfileSchema.parse(req.body);

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      timezone: true,
      energyLevel: true,
      createdAt: true,
      updatedAt: true
    }
  });

  logger.info('User profile updated', { userId: user.id });

  res.json({
    success: true,
    data: user,
    message: 'Profile updated successfully'
  });
}));

// Get user settings
router.get('/settings', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const settings = await prisma.userSettings.findUnique({
    where: { userId: req.user!.id }
  });

  if (!settings) {
    throw createError('Settings not found', 404);
  }

  res.json({
    success: true,
    data: settings
  });
}));

// Update user settings
router.put('/settings', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const updateData = updateSettingsSchema.parse(req.body);

  const settings = await prisma.userSettings.upsert({
    where: { userId: req.user!.id },
    update: updateData,
    create: {
      userId: req.user!.id,
      ...updateData
    }
  });

  logger.info('User settings updated', { userId: req.user!.id });

  res.json({
    success: true,
    data: settings,
    message: 'Settings updated successfully'
  });
}));

// Log energy level
router.post('/energy-level', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { level, notes } = energyLevelSchema.parse(req.body);

  const energyLevel = await prisma.energyLevel.create({
    data: {
      userId: req.user!.id,
      level,
      notes
    }
  });

  // Update user's current energy level
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { energyLevel: level }
  });

  logger.info('Energy level logged', { userId: req.user!.id, level });

  res.status(201).json({
    success: true,
    data: energyLevel,
    message: 'Energy level logged successfully'
  });
}));

// Get energy level history
router.get('/energy-level', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { days = '30' } = req.query;
  const daysNumber = parseInt(days as string);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysNumber);

  const energyLevels = await prisma.energyLevel.findMany({
    where: {
      userId: req.user!.id,
      date: { gte: startDate }
    },
    orderBy: { date: 'desc' }
  });

  res.json({
    success: true,
    data: energyLevels
  });
}));

// Get user dashboard data
router.get('/dashboard', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    user,
    todayTasks,
    upcomingEvents,
    recentAchievements,
    activeStreaks,
    unreadNotifications
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        energyLevel: true,
        timezone: true
      }
    }),
    prisma.task.findMany({
      where: {
        userId: req.user!.id,
        status: { not: 'COMPLETED' },
        OR: [
          { dueDate: { gte: today, lt: tomorrow } },
          { scheduledAt: { gte: today, lt: tomorrow } },
          { dueDate: null, scheduledAt: null }
        ]
      },
      include: { subtasks: true },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' }
      ],
      take: 10
    }),
    prisma.event.findMany({
      where: {
        userId: req.user!.id,
        startTime: { gte: new Date() }
      },
      orderBy: { startTime: 'asc' },
      take: 5
    }),
    prisma.achievement.findMany({
      where: { userId: req.user!.id },
      orderBy: { unlockedAt: 'desc' },
      take: 5
    }),
    prisma.streak.findMany({
      where: { userId: req.user!.id },
      orderBy: { count: 'desc' }
    }),
    prisma.notification.findMany({
      where: {
        userId: req.user!.id,
        isRead: false
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
  ]);

  if (!user) {
    throw createError('User not found', 404);
  }

  res.json({
    success: true,
    data: {
      user,
      todayTasks,
      upcomingEvents,
      recentAchievements,
      activeStreaks,
      unreadNotifications
    }
  });
}));

// Get user statistics
router.get('/stats', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { period = '30' } = req.query;
  const daysNumber = parseInt(period as string);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysNumber);

  const [
    taskStats,
    eventStats,
    achievementStats,
    streakStats
  ] = await Promise.all([
    prisma.task.groupBy({
      by: ['status'],
      where: {
        userId: req.user!.id,
        createdAt: { gte: startDate }
      },
      _count: { status: true }
    }),
    prisma.event.count({
      where: {
        userId: req.user!.id,
        startTime: { gte: startDate }
      }
    }),
    prisma.achievement.count({
      where: {
        userId: req.user!.id,
        unlockedAt: { gte: startDate }
      }
    }),
    prisma.streak.findMany({
      where: { userId: req.user!.id },
      orderBy: { count: 'desc' }
    })
  ]);

  const stats = {
    tasks: {
      total: taskStats.reduce((sum, stat) => sum + stat._count.status, 0),
      completed: taskStats.find(s => s.status === 'COMPLETED')?._count.status || 0,
      pending: taskStats.find(s => s.status === 'PENDING')?._count.status || 0,
      inProgress: taskStats.find(s => s.status === 'IN_PROGRESS')?._count.status || 0
    },
    events: eventStats,
    achievements: achievementStats,
    streaks: streakStats,
    period: `${daysNumber} days`
  };

  res.json({
    success: true,
    data: stats
  });
}));

// Delete user account
router.delete('/account', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { password, confirmDelete } = deleteAccountSchema.parse(req.body);

  if (!confirmDelete) {
    throw createError('Account deletion must be confirmed', 400);
  }

  // Get user with password for verification
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  // Verify password
  const bcrypt = require('bcryptjs');
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    throw createError('Invalid password', 401);
  }

  // Delete user (cascade will handle related data)
  await prisma.user.delete({
    where: { id: req.user!.id }
  });

  logger.info('User account deleted', { userId: req.user!.id, email: user.email });

  res.json({
    success: true,
    message: 'Account has been permanently deleted'
  });
}));

export default router;
