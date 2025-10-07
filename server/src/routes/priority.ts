import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * GET /api/priority/hierarchy
 * Get priority hierarchy for tasks and events
 */
router.get('/hierarchy', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    
    // Mock priority hierarchy - replace with actual implementation
    const hierarchy = {
      levels: [
        { id: 'urgent', name: 'Urgent', color: '#ef4444', order: 4 },
        { id: 'high', name: 'High', color: '#f97316', order: 3 },
        { id: 'medium', name: 'Medium', color: '#eab308', order: 2 },
        { id: 'low', name: 'Low', color: '#22c55e', order: 1 }
      ],
      rules: [
        'Urgent tasks override all others',
        'High priority tasks should be completed within 24 hours',
        'Medium priority tasks can be scheduled for later',
        'Low priority tasks are flexible'
      ]
    };

    res.json({
      success: true,
      data: hierarchy
    });
  } catch (error: any) {
    logger.error('Failed to fetch priority hierarchy', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch priority hierarchy'
    });
  }
});

/**
 * POST /api/priority/calculate
 * Calculate priority for a task based on various factors
 */
router.post('/calculate', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { taskData, context } = req.body;
    const userId = req.user?.id;

    if (!taskData) {
      return res.status(400).json({
        success: false,
        error: 'Task data is required'
      });
    }

    // Mock priority calculation - replace with actual AI implementation
    const calculatedPriority = {
      level: 'high',
      score: 0.85,
      factors: [
        { name: 'Deadline proximity', weight: 0.4, value: 0.9 },
        { name: 'Energy requirement', weight: 0.3, value: 0.8 },
        { name: 'Dependencies', weight: 0.2, value: 0.7 },
        { name: 'Impact', weight: 0.1, value: 0.9 }
      ],
      reasoning: 'High priority due to approaching deadline and high impact'
    };

    res.json({
      success: true,
      data: calculatedPriority
    });
  } catch (error: any) {
    logger.error('Failed to calculate priority', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to calculate priority'
    });
  }
});

export default router;
