import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /templates/catalog
 * Get template catalog (placeholder for now)
 */
router.get('/catalog', authenticateToken, asyncHandler(async (req, res) => {
  try {
    // For now, return an empty catalog
    // In the future, this could return system templates, community templates, etc.
    const catalog = {
      systemTemplates: [],
      communityTemplates: [],
      featuredTemplates: []
    };

    res.json({
      success: true,
      data: catalog
    });
  } catch (error: any) {
    logger.error('Error fetching template catalog:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch template catalog'
    });
  }
}));

export default router;
