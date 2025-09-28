import express from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import GamificationService, { ACHIEVEMENTS, BADGES } from '../services/gamificationService';

const router = express.Router();
const prisma = new PrismaClient();

// Get user's gamification data
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  logger.info('Getting gamification data', { userId });

  try {
    const gamificationData = await GamificationService.getUserGamificationData(userId);

    // If user has no achievements, unlock welcome achievement
    if (gamificationData.achievements.length === 0) {
      // Ensure user stats exist first
      await GamificationService.getOrCreateUserStats(userId);
      
      await GamificationService.unlockAchievement(userId, {
        id: 'welcome',
        title: 'Welcome to SyncScript!',
        description: 'You\'ve discovered the gamification system!',
        points: 10,
        icon: '🎉',
        rarity: 'common',
        condition: () => true // Always true for welcome achievement
      });
      
      // Refresh data after unlocking achievement
      const updatedData = await GamificationService.getUserGamificationData(userId);
      return res.json({
        success: true,
        data: updatedData
      });
    }

    // For existing users, check if they should unlock any new achievements
    // This ensures existing users get achievements they've earned but haven't been awarded
    await GamificationService.checkAndUnlockEligibleAchievements(userId);
    
    // Refresh data after checking achievements
    const updatedData = await GamificationService.getUserGamificationData(userId);

    res.json({
      success: true,
      data: updatedData
    });
  } catch (error) {
    logger.error('Error getting gamification data:', error);
    throw createError('Failed to get gamification data', 500);
  }
}));

// Get user stats
router.get('/stats', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  try {
    const userStats = await GamificationService.getOrCreateUserStats(userId);

    res.json({
      success: true,
      data: userStats
    });
  } catch (error) {
    logger.error('Error getting user stats:', error);
    throw createError('Failed to get user stats', 500);
  }
}));

// Get achievements
router.get('/achievements', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  try {
    const achievements = await prisma.achievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'desc' }
    });

    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    logger.error('Error getting achievements:', error);
    throw createError('Failed to get achievements', 500);
  }
}));

// Get badges
router.get('/badges', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  try {
    const badges = await prisma.badge.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' }
    });

    res.json({
      success: true,
      data: badges
    });
  } catch (error) {
    logger.error('Error getting badges:', error);
    throw createError('Failed to get badges', 500);
  }
}));

// Get streaks
router.get('/streaks', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  try {
    const streaks = await prisma.streak.findMany({
      where: { userId }
    });

    res.json({
      success: true,
      data: streaks
    });
  } catch (error) {
    logger.error('Error getting streaks:', error);
    throw createError('Failed to get streaks', 500);
  }
}));

// Get points history
router.get('/points', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { limit = '50', offset = '0' } = req.query;

  try {
    const points = await prisma.point.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    const totalPoints = await prisma.point.aggregate({
      where: { userId },
      _sum: { amount: true }
    });

    res.json({
      success: true,
      data: {
        points,
        total: totalPoints._sum.amount || 0
      }
    });
  } catch (error) {
    logger.error('Error getting points:', error);
    throw createError('Failed to get points', 500);
  }
}));

// Get leaderboard (top users by points)
router.get('/leaderboard', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { limit = '10' } = req.query;

  try {
    const leaderboard = await prisma.userStats.findMany({
      take: parseInt(limit as string),
      orderBy: { totalPoints: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: leaderboard.map((entry, index) => ({
        rank: index + 1,
        userId: entry.userId,
        name: entry.user.name || 'Anonymous',
        avatar: entry.user.avatar,
        totalPoints: entry.totalPoints,
        currentLevel: entry.currentLevel,
        tasksCompleted: entry.tasksCompleted
      }))
    });
  } catch (error) {
    logger.error('Error getting leaderboard:', error);
    throw createError('Failed to get leaderboard', 500);
  }
}));

// Get available achievements (not yet unlocked)
router.get('/achievements/available', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  try {
    const userStats = await GamificationService.getOrCreateUserStats(userId);
    const unlockedAchievements = await prisma.achievement.findMany({
      where: { userId },
      select: { type: true }
    });

    const unlockedTypes = unlockedAchievements.map(a => a.type);
    const availableAchievements = ACHIEVEMENTS.filter(
      achievement => !unlockedTypes.includes(achievement.id)
    );

    res.json({
      success: true,
      data: availableAchievements
    });
  } catch (error) {
    logger.error('Error getting available achievements:', error);
    throw createError('Failed to get available achievements', 500);
  }
}));

// Get available badges (not yet earned)
router.get('/badges/available', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  try {
    const userStats = await GamificationService.getOrCreateUserStats(userId);
    const earnedBadges = await prisma.badge.findMany({
      where: { userId },
      select: { type: true }
    });

    const earnedTypes = earnedBadges.map(b => b.type);
    const availableBadges = BADGES.filter(
      badge => !earnedTypes.includes(badge.id)
    );

    res.json({
      success: true,
      data: availableBadges
    });
  } catch (error) {
    logger.error('Error getting available badges:', error);
    throw createError('Failed to get available badges', 500);
  }
}));

// Manually trigger achievement check (for testing)
router.post('/check-achievements', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  try {
    await GamificationService.checkAchievements(userId);
    await GamificationService.checkBadges(userId);

    res.json({
      success: true,
      message: 'Achievement and badge checks completed'
    });
  } catch (error) {
    logger.error('Error checking achievements:', error);
    throw createError('Failed to check achievements', 500);
  }
}));

// Add points manually (for testing)
router.post('/points', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { amount, source, description } = req.body;

  if (!amount || typeof amount !== 'number') {
    throw createError('Amount is required and must be a number', 400);
  }

  try {
    await GamificationService.addPoints(
      userId, 
      amount, 
      source || 'manual', 
      description || 'Manual points addition'
    );

    res.json({
      success: true,
      message: 'Points added successfully'
    });
  } catch (error) {
    logger.error('Error adding points:', error);
    throw createError('Failed to add points', 500);
  }
}));

// Get level information
router.get('/level', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  try {
    const userStats = await GamificationService.getOrCreateUserStats(userId);
    const levelProgress = GamificationService.calculateLevelProgress(userStats);

    res.json({
      success: true,
      data: levelProgress
    });
  } catch (error) {
    logger.error('Error getting level info:', error);
    throw createError('Failed to get level information', 500);
  }
}));

// Get gamification summary for dashboard
router.get('/summary', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  try {
    const [userStats, recentAchievements, recentBadges, currentStreak] = await Promise.all([
      GamificationService.getOrCreateUserStats(userId),
      prisma.achievement.findMany({
        where: { userId },
        orderBy: { unlockedAt: 'desc' },
        take: 3
      }),
      prisma.badge.findMany({
        where: { userId },
        orderBy: { earnedAt: 'desc' },
        take: 3
      }),
      prisma.streak.findFirst({
        where: { userId, type: 'daily_tasks' }
      })
    ]);

    const levelProgress = GamificationService.calculateLevelProgress(userStats);

    res.json({
      success: true,
      data: {
        stats: userStats,
        levelProgress,
        recentAchievements,
        recentBadges,
        currentStreak: currentStreak?.count || 0,
        nextAchievement: await getNextAchievement(userId),
        nextBadge: await getNextBadge(userId)
      }
    });
  } catch (error) {
    logger.error('Error getting gamification summary:', error);
    throw createError('Failed to get gamification summary', 500);
  }
}));

// Helper function to get next achievable achievement
async function getNextAchievement(userId: string) {
  const userStats = await GamificationService.getOrCreateUserStats(userId);
  const unlockedAchievements = await prisma.achievement.findMany({
    where: { userId },
    select: { type: true }
  });

  const unlockedTypes = unlockedAchievements.map(a => a.type);
  const nextAchievement = ACHIEVEMENTS.find(
    achievement => !unlockedTypes.includes(achievement.id) && achievement.condition(userStats)
  );

  return nextAchievement || null;
}

// Helper function to get next achievable badge
async function getNextBadge(userId: string) {
  const userStats = await GamificationService.getOrCreateUserStats(userId);
  const earnedBadges = await prisma.badge.findMany({
    where: { userId },
    select: { type: true }
  });

  const earnedTypes = earnedBadges.map(b => b.type);
  const nextBadge = BADGES.find(
    badge => !earnedTypes.includes(badge.id) && badge.condition(userStats)
  );

  return nextBadge || null;
}

// Get daily challenges
router.get('/challenges', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  
  try {
    const DailyChallengeService = (await import('../services/dailyChallengeService')).default;
    const challenges = await DailyChallengeService.generateDailyChallenges(userId);
    
    res.json({
      success: true,
      data: challenges
    });
  } catch (error) {
    logger.error('Error getting daily challenges:', error);
    throw createError('Failed to get daily challenges', 500);
  }
}));

export default router;
