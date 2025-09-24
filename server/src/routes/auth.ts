import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  name: z.string().min(1, 'Name is required').optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'New password must contain at least one lowercase letter, one uppercase letter, and one number')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required')
});

// Register new user
router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, name } = registerSchema.parse(req.body);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw createError('User with this email already exists', 409);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Generate email verification token
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      emailVerified: false,
      emailVerificationToken: emailVerificationToken,
      settings: {
        create: {}
      }
    },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      createdAt: true
    }
  });

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  logger.info('User registered successfully', { userId: user.id, email });

  res.status(201).json({
    success: true,
    data: {
      user,
      token
    },
    message: 'User registered successfully'
  });
}));

// Login user
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      settings: true
    }
  });

  if (!user) {
    throw createError('Invalid email or password', 401);
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw createError('Invalid email or password', 401);
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  logger.info('User logged in successfully', { userId: user.id, email });

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    data: {
      user: userWithoutPassword,
      token
    },
    message: 'Login successful'
  });
}));

// Get current user
router.get('/me', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      settings: true,
      achievements: {
        orderBy: { unlockedAt: 'desc' },
        take: 5
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

// Change password
router.put('/change-password', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
  if (!isValidPassword) {
    throw createError('Current password is incorrect', 400);
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 12);

  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedNewPassword }
  });

  logger.info('Password changed successfully', { userId: user.id });

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

// Logout (client-side token removal, but we can log it)
router.post('/logout', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  logger.info('User logged out', { userId: req.user!.id });

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

// Refresh token
router.post('/refresh', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  // Generate new token
  const token = jwt.sign(
    { userId: req.user!.id, email: req.user!.email },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    success: true,
    data: { token },
    message: 'Token refreshed successfully'
  });
}));

// Get current user info
router.get('/me', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      timezone: true,
      energyLevel: true,
      avatar: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  res.json({
    success: true,
    data: user
  });
}));

// Forgot password - send reset email
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = forgotPasswordSchema.parse(req.body);

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    // Don't reveal if email exists or not for security
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
    return;
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Save reset token to database
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires
    }
  });

  // TODO: Send email with reset link
  // For now, we'll log the token for development
  logger.info('Password reset token generated', { 
    userId: user.id, 
    email: user.email,
    resetToken: resetToken 
  });

  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.',
    // Remove this in production - only for development
    ...(process.env.NODE_ENV === 'development' && { resetToken })
  });
}));

// Reset password with token
router.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, password } = resetPasswordSchema.parse(req.body);

  // Find user with valid reset token
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: {
        gt: new Date()
      }
    }
  });

  if (!user) {
    throw createError('Invalid or expired reset token', 400);
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Update user password and clear reset token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null
    }
  });

  logger.info('Password reset successful', { userId: user.id, email: user.email });

  res.json({
    success: true,
    message: 'Password has been reset successfully'
  });
}));

// Verify email address
router.post('/verify-email', asyncHandler(async (req, res) => {
  const { token } = verifyEmailSchema.parse(req.body);

  // Find user with verification token
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerified: false
    }
  });

  if (!user) {
    throw createError('Invalid or expired verification token', 400);
  }

  // Update user as verified
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerificationToken: null
    }
  });

  logger.info('Email verified successfully', { userId: user.id, email: user.email });

  res.json({
    success: true,
    message: 'Email has been verified successfully'
  });
}));

// Resend verification email
router.post('/resend-verification', asyncHandler(async (req, res) => {
  const { email } = forgotPasswordSchema.parse(req.body);

  // Check if user exists and is not verified
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    // Don't reveal if email exists or not for security
    res.json({
      success: true,
      message: 'If an account with that email exists and is unverified, a verification email has been sent.'
    });
    return;
  }

  if (user.emailVerified) {
    res.json({
      success: true,
      message: 'Email is already verified.'
    });
    return;
  }

  // Generate new verification token
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');

  // Update user with new token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: emailVerificationToken
    }
  });

  // TODO: Send email with verification link
  // For now, we'll log the token for development
  logger.info('Email verification token generated', { 
    userId: user.id, 
    email: user.email,
    verificationToken: emailVerificationToken 
  });

  res.json({
    success: true,
    message: 'If an account with that email exists and is unverified, a verification email has been sent.',
    // Remove this in production - only for development
    ...(process.env.NODE_ENV === 'development' && { verificationToken: emailVerificationToken })
  });
}));

export default router;
