import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * GET /api/budgeting/categories
 * Get budget categories
 */
router.get('/categories', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    
    // Mock budget categories - replace with actual implementation
    const categories = [
      { id: '1', name: 'Food & Dining', color: '#f97316', budget: 500 },
      { id: '2', name: 'Transportation', color: '#3b82f6', budget: 300 },
      { id: '3', name: 'Entertainment', color: '#8b5cf6', budget: 200 }
    ];

    res.json({
      success: true,
      data: categories
    });
  } catch (error: any) {
    logger.error('Failed to fetch budget categories', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch budget categories'
    });
  }
});

export default router;
