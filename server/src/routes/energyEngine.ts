import express from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import EnergyEngineService from '../services/energyEngineService';
import { dailyChallengeService } from '../services/dailyChallengeService';
import DailyChallengeService from '../services/dailyChallengeService';
import { runDailyEnergyReset } from '../jobs/energyResetJob';

const router = express.Router();
const prisma = new PrismaClient();

// Get user's energy status
router.get('/status', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  try {
    const energyStatus = await EnergyEngineService.getEnergyStatus(userId);
    
    res.json({
      success: true,
      data: energyStatus
    });
  } catch (error) {
    logger.error('Error getting energy status:', error);
    throw createError('Failed to get energy status', 500);
  }
}));

// Complete a daily challenge (legacy endpoint - simplified)
router.post('/challenges/:challengeId/complete', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { challengeId } = req.params;

  try {
    // Mark challenge as completed
    const challenge = await prisma.dailyChallenge.update({
      where: { id: challengeId },
      data: {
        isCompleted: true,
        completedAt: new Date()
      }
    });
    
    // Award EP
    const epAwarded = challenge.epReward || 20;
    
    res.json({
      success: true,
      data: {
        challenge,
        epAwarded,
        capped: false
      },
      message: `Challenge completed! You earned ${epAwarded} EP.`
    });
  } catch (error) {
    logger.error('Error completing challenge:', error);
    throw createError('Failed to complete challenge', 500);
  }
}));

// Get challenge statistics
router.get('/challenges/stats', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  try {
    // Calculate stats from database
    const totalChallenges = await prisma.dailyChallenge.count({ where: { userId } });
    const completedChallenges = await prisma.dailyChallenge.count({ 
      where: { userId, isCompleted: true } 
    });
    const stats = {
      total: totalChallenges,
      completed: completedChallenges,
      pending: totalChallenges - completedChallenges,
      completionRate: totalChallenges > 0 ? (completedChallenges / totalChallenges) * 100 : 0
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting challenge stats:', error);
    throw createError('Failed to get challenge statistics', 500);
  }
}));

// Award EP manually (for testing or special events)
router.post('/award-ep', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { amount, source, domain, description, metadata } = req.body;

  if (!amount || !source) {
    throw createError('Amount and source are required', 400);
  }

  try {
    const result = await EnergyEngineService.awardEnergyPoints(
      userId,
      amount,
      source,
      domain,
      description,
      metadata
    );
    
    res.json({
      success: true,
      data: {
        epAwarded: result.awarded,
        capped: result.capped,
        energyPoint: result.energyPoint
      },
      message: `Awarded ${result.awarded} EP${result.capped ? ' (daily cap reached)' : ''}.`
    });
  } catch (error) {
    logger.error('Error awarding EP:', error);
    throw createError('Failed to award EP', 500);
  }
}));

// Convert EP to Energy (usually done automatically at night)
router.post('/convert', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { date } = req.body;

  try {
    const result = await EnergyEngineService.convertEPToEnergy(userId, date ? new Date(date) : undefined);
    
    res.json({
      success: true,
      data: result,
      message: `Converted ${result.epEarned} EP to ${result.energyGained} Energy.`
    });
  } catch (error) {
    logger.error('Error converting EP to Energy:', error);
    throw createError('Failed to convert EP to Energy', 500);
  }
}));

// Get user's energy profile
router.get('/profile', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  try {
    const profile = await EnergyEngineService.getOrCreateEnergyProfile(userId);
    
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    logger.error('Error getting energy profile:', error);
    throw createError('Failed to get energy profile', 500);
  }
}));

// Get user's emblems
router.get('/emblems', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  try {
    const emblems = await prisma.energyEmblem.findMany({
      where: { userId },
      orderBy: { emblemType: 'asc' }
    });
    
    res.json({
      success: true,
      data: emblems
    });
  } catch (error) {
    logger.error('Error getting emblems:', error);
    throw createError('Failed to get emblems', 500);
  }
}));

// Activate an emblem
router.post('/emblems/:emblemType/activate', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { emblemType } = req.params;

  try {
    // First, deactivate all other emblems
    await prisma.energyEmblem.updateMany({
      where: { userId },
      data: { isActive: false }
    });

    // Then activate the selected emblem
    const emblem = await prisma.energyEmblem.updateMany({
      where: {
        userId,
        emblemType,
        isUnlocked: true
      },
      data: { isActive: true }
    });

    if (emblem.count === 0) {
      throw createError('Emblem not found or not unlocked', 404);
    }
    
    res.json({
      success: true,
      message: `Activated ${emblemType} emblem.`
    });
  } catch (error) {
    logger.error('Error activating emblem:', error);
    throw createError('Failed to activate emblem', 500);
  }
}));

// Get EP history
router.get('/ep-history', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { days = 7 } = req.query;

  try {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

    const epHistory = await prisma.energyPoint.findMany({
      where: {
        userId,
        earnedAt: {
          gte: daysAgo
        }
      },
      orderBy: { earnedAt: 'desc' }
    });
    
    res.json({
      success: true,
      data: epHistory
    });
  } catch (error) {
    logger.error('Error getting EP history:', error);
    throw createError('Failed to get EP history', 500);
  }
}));

// Get energy conversion history
router.get('/conversion-history', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { days = 30 } = req.query;

  try {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

    const conversionHistory = await prisma.energyConversion.findMany({
      where: {
        userId,
        date: {
          gte: daysAgo
        }
      },
      orderBy: { date: 'desc' }
    });
    
    res.json({
      success: true,
      data: conversionHistory
    });
  } catch (error) {
    logger.error('Error getting conversion history:', error);
    throw createError('Failed to get conversion history', 500);
  }
}));

// Check and unlock new emblems
router.post('/check-emblems', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  try {
    const unlockedEmblems = await EnergyEngineService.checkAndUnlockEmblems(userId);
    
    res.json({
      success: true,
      data: {
        unlockedEmblems
      },
      message: unlockedEmblems.length > 0 ? 
        `Unlocked ${unlockedEmblems.length} new emblem(s)!` : 
        'No new emblems to unlock.'
    });
  } catch (error) {
    logger.error('Error checking emblems:', error);
    throw createError('Failed to check emblems', 500);
  }
}));

// POST /admin/override-energy - Admin endpoint to manually set user energy (email-gated)
router.post('/admin/override-energy', authenticateToken, asyncHandler(async (req: any, res) => {
  const adminId = req.user.id
  const { userId, energy, reason } = req.body

  if (!userId || energy === undefined) {
    throw createError('User ID and energy level are required', 400)
  }

  if (energy < 0 || energy > 100) {
    throw createError('Energy must be between 0 and 100', 400)
  }

  // TODO: Add proper admin role check
  // For now, check if admin email contains 'admin' or specific whitelist
  const adminUser = await prisma.user.findUnique({ where: { id: adminId } })
  
  if (!adminUser || !adminUser.email.includes('admin')) {
    logger.warn('Non-admin attempted energy override', { adminId, targetUserId: userId })
    throw createError('Admin access required', 403)
  }

  // Get current energy for audit
  const profile = await prisma.userEnergyProfile.findUnique({
    where: { userId }
  })

  // Update energy
  await prisma.userEnergyProfile.upsert({
    where: { userId },
    create: {
      userId,
      currentEnergy: energy,
      energyLevel: Math.floor(energy / 10) // Convert to 0-10 scale
    },
    update: {
      currentEnergy: energy,
      energyLevel: Math.floor(energy / 10)
    }
  })

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'energy_override',
      targetType: 'user',
      targetId: userId,
      beforeState: JSON.stringify({ energy: profile?.currentEnergy || 0 }),
      afterState: JSON.stringify({ energy }),
      reason: reason || 'Admin manual override',
      ipAddress: req.ip
    }
  })

  logger.warn('Admin overrode user energy', { adminId, targetUserId: userId, energy, reason })

  res.json({
    success: true,
    data: {
      userId,
      energy,
      displayEnergy: Math.floor(energy / 10)
    },
    message: `Energy manually set to ${energy}/100 (${Math.floor(energy / 10)}/10)`
  })
}))

// GET /challenges - Get daily challenges for user
router.get('/challenges', authenticateToken, asyncHandler(async (req: any, res) => {
  const userId = req.user.id

  const challenges = await prisma.dailyChallenge.findMany({
    where: {
      userId,
      date: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    },
    orderBy: { date: 'desc' }
  })

  res.json({
    success: true,
    data: challenges
  })
}))

// POST /challenges/:challengeId/start - Start a challenge session
router.post('/challenges/:challengeId/start', authenticateToken, asyncHandler(async (req: any, res) => {
  const userId = req.user.id
  const { challengeId } = req.params

  const session = await dailyChallengeService.startChallenge(userId, challengeId)

  res.json({
    success: true,
    data: session,
    message: 'Challenge session started'
  })
}))

// POST /challenges/sessions/:sessionId/pause - Pause a challenge session
router.post('/challenges/sessions/:sessionId/pause', authenticateToken, asyncHandler(async (req: any, res) => {
  const { sessionId } = req.params

  await dailyChallengeService.pauseChallenge(sessionId)

  res.json({
    success: true,
    message: 'Session paused'
  })
}))

// POST /challenges/sessions/:sessionId/resume - Resume a challenge session
router.post('/challenges/sessions/:sessionId/resume', authenticateToken, asyncHandler(async (req: any, res) => {
  const { sessionId } = req.params

  await dailyChallengeService.resumeChallenge(sessionId)

  res.json({
    success: true,
    message: 'Session resumed'
  })
}))

// POST /challenges/sessions/:sessionId/complete - Complete a challenge session
router.post('/challenges/sessions/:sessionId/complete', authenticateToken, asyncHandler(async (req: any, res) => {
  const { sessionId } = req.params
  const { elapsedMinutes, partialCredit } = req.body

  await dailyChallengeService.completeChallenge(sessionId, elapsedMinutes, partialCredit)

  res.json({
    success: true,
    message: partialCredit ? 'Partial credit awarded' : 'Challenge completed!',
    data: { elapsedMinutes, partialCredit }
  })
}))

// GET /challenges/sessions/active - Get user's active session
router.get('/challenges/sessions/active', authenticateToken, asyncHandler(async (req: any, res) => {
  const userId = req.user.id

  const session = dailyChallengeService.getActiveSession(userId)

  res.json({
    success: true,
    data: session
  })
}))

// POST /admin/daily-reset - Manual trigger for daily energy reset (cron job)
router.post('/admin/daily-reset', asyncHandler(async (req: any, res) => {
  // In production, add API key authentication here
  const result = await runDailyEnergyReset()

  res.json({
    success: true,
    message: 'Daily energy reset complete',
    data: result
  })
}))

export default router;
