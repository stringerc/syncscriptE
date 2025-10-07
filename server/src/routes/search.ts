import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * GET /api/search
 * Search across tasks, events, and other content
 */
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { q, type, limit = 10 } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    // Mock search results - replace with actual search implementation
    const results = {
      tasks: [
        {
          id: '1',
          title: 'Sample Task',
          description: 'This is a sample task',
          type: 'task'
        }
      ],
      events: [
        {
          id: '1',
          title: 'Sample Event',
          description: 'This is a sample event',
          type: 'event'
        }
      ],
      total: 2
    };

    res.json({
      success: true,
      data: results
    });
  } catch (error: any) {
    logger.error('Search failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

export default router;
