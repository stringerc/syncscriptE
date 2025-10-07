import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * GET /api/brief/morning
 * Get morning brief
 */
router.get('/morning', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    
    // Mock morning brief - replace with actual implementation
    const brief = {
      date: new Date().toISOString(),
      weather: {
        condition: 'Sunny',
        temperature: 72,
        suggestion: 'Great day for outdoor activities'
      },
      tasks: [
        { id: '1', title: 'Review Q4 Budget', priority: 'high' },
        { id: '2', title: 'Team Meeting Prep', priority: 'medium' }
      ],
      events: [
        { id: '1', title: 'Team Sync', time: '10:00 AM' }
      ],
      energy: {
        level: 85,
        suggestion: 'High energy - tackle important tasks first'
      }
    };

    res.json({
      success: true,
      data: brief
    });
  } catch (error: any) {
    logger.error('Failed to fetch morning brief', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch morning brief'
    });
  }
});

export default router;
