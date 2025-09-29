import express from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import EnhancedAchievementsService from '../services/enhancedAchievementsService';

const router = express.Router();

// Get user's achievements with progress
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const achievements = await EnhancedAchievementsService.getUserAchievements(req.user!.id);
    
    logger.info('User achievements retrieved', { 
      userId: req.user!.id, 
      count: achievements.length 
    });

    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    logger.error('Error getting user achievements:', error);
    throw createError('Failed to get achievements', 500);
  }
}));

// Get achievement templates
router.get('/templates', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const templates = EnhancedAchievementsService.getAchievementTemplates();
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    logger.error('Error getting achievement templates:', error);
    throw createError('Failed to get achievement templates', 500);
  }
}));

// Get achievements by category
router.get('/category/:category', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const { category } = req.params;
    const achievements = EnhancedAchievementsService.getAchievementsByCategory(category);
    
    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    logger.error('Error getting achievements by category:', error);
    throw createError('Failed to get achievements by category', 500);
  }
}));

// Get achievements by rarity
router.get('/rarity/:rarity', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const { rarity } = req.params;
    const achievements = EnhancedAchievementsService.getAchievementsByRarity(rarity);
    
    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    logger.error('Error getting achievements by rarity:', error);
    throw createError('Failed to get achievements by rarity', 500);
  }
}));

// Get achievement categories
router.get('/categories', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const categories = EnhancedAchievementsService.getAchievementCategories();
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('Error getting achievement categories:', error);
    throw createError('Failed to get achievement categories', 500);
  }
}));

// Check and unlock achievements (triggered after actions)
router.post('/check', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const unlockedAchievements = await EnhancedAchievementsService.checkAndUnlockAchievements(req.user!.id);
    
    logger.info('Achievements checked', { 
      userId: req.user!.id, 
      unlocked: unlockedAchievements.length 
    });

    res.json({
      success: true,
      data: {
        unlocked: unlockedAchievements,
        count: unlockedAchievements.length
      }
    });
  } catch (error) {
    logger.error('Error checking achievements:', error);
    throw createError('Failed to check achievements', 500);
  }
}));

// Get specific achievement details
router.get('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const achievements = await EnhancedAchievementsService.getUserAchievements(req.user!.id);
    const achievement = achievements.find(a => a.id === id);
    
    if (!achievement) {
      throw createError('Achievement not found', 404);
    }

    res.json({
      success: true,
      data: achievement
    });
  } catch (error) {
    logger.error('Error getting achievement details:', error);
    throw createError('Failed to get achievement details', 500);
  }
}));

export default router;
