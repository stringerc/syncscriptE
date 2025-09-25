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

  // Remove password from response and format for frontend
  const { password: _, ...userWithoutPassword } = user;

  // Format user data with preferences structure
  const formattedUser = {
    ...userWithoutPassword,
    isEmailVerified: user.emailVerified || false,
    preferences: {
      notifications: user.settings?.emailNotifications ?? true,
      darkMode: user.settings?.darkMode ?? false,
      timezone: user.timezone || 'UTC'
    }
  };

  res.json({
    success: true,
    data: formattedUser
  });
}));

// Update user profile
router.put('/profile', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { preferences, ...updateData } = req.body;
  
  // Update user data
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
      updatedAt: true,
      emailVerified: true
    }
  });

  // Update preferences if provided
  if (preferences) {
    await prisma.userSettings.upsert({
      where: { userId: req.user!.id },
      update: {
        emailNotifications: preferences.notifications
      },
      create: {
        userId: req.user!.id,
        emailNotifications: preferences.notifications,
        pushNotifications: true,
        smsNotifications: false,
        aiSchedulingEnabled: true,
        aiBudgetAdviceEnabled: true,
        aiEnergyAdaptation: true,
        dataSharingEnabled: false,
        workHoursStart: '09:00',
        workHoursEnd: '17:00',
        breakDuration: 15
      }
    });
  }

  logger.info('User profile updated', { userId: user.id });

  // Return formatted response
  const formattedUser = {
    ...user,
    isEmailVerified: user.emailVerified || false,
    preferences: {
      notifications: preferences?.notifications ?? true,
      darkMode: preferences?.darkMode ?? false,
      timezone: user.timezone || 'UTC'
    }
  };

  res.json({
    success: true,
    data: formattedUser,
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
          userId: req.user!.id
          // TEMPORARILY DISABLED: Complex timezone filtering causing errors
          // TODO: Fix timezone handling properly
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

// Get profile statistics for profile page
router.get('/profile/stats', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const [
    totalTasks,
    completedTasks,
    totalEvents,
    currentStreak
  ] = await Promise.all([
    prisma.task.count({
      where: { userId: req.user!.id }
    }),
    prisma.task.count({
      where: { 
        userId: req.user!.id,
        status: 'COMPLETED'
      }
    }),
    prisma.event.count({
      where: { userId: req.user!.id }
    }),
    prisma.streak.findFirst({
      where: { userId: req.user!.id },
      orderBy: { count: 'desc' },
      select: { count: true }
    })
  ]);

  res.json({
    success: true,
    data: {
      totalTasks,
      completedTasks,
      totalEvents,
      streakDays: currentStreak?.count || 0
    }
  });
}));

// Resend email verification
router.post('/resend-verification', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  if (user.emailVerified) {
    return res.json({
      success: true,
      message: 'Email is already verified'
    });
  }

  // Generate verification token
  const crypto = require('crypto');
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Save verification token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: tokenExpiry
    }
  });

  // Send verification email
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });

  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'SyncScript - Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">SyncScript Email Verification</h2>
        <p>Hello ${user.name || 'there'},</p>
        <p>Thank you for signing up for SyncScript! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p>This verification link will expire in 24 hours.</p>
        <p>If you didn't create an account with SyncScript, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This email was sent from SyncScript. If you have any questions, please contact our support team.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info('Verification email sent', { userId: user.id, email: user.email });

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    logger.error('Failed to send verification email', { userId: user.id, error: error.message });
    throw createError('Failed to send verification email', 500);
  }
}));

// Verify email with token
router.post('/verify-email', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw createError('Verification token is required', 400);
  }

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      OR: [
        { emailVerificationExpiry: { gt: new Date() } },
        { emailVerificationExpiry: null } // Handle old tokens without expiry
      ]
    }
  });

  if (!user) {
    throw createError('Invalid or expired verification token', 400);
  }

  // Update user to mark email as verified
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationExpiry: null
    }
  });

  logger.info('Email verified successfully', { userId: user.id, email: user.email });

  res.json({
    success: true,
    message: 'Email verified successfully'
  });
}));

export default router;
