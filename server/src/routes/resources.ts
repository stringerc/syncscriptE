import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * GET /api/resources
 * Get all resources for a user
 */
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    
    // Mock resources data - replace with actual implementation
    const resources = [
      {
        id: '1',
        title: 'Sample Resource',
        description: 'This is a sample resource',
        url: 'https://example.com',
        type: 'link',
        tags: ['productivity', 'tools']
      }
    ];

    res.json({
      success: true,
      data: resources
    });
  } catch (error: any) {
    logger.error('Failed to fetch resources', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resources'
    });
  }
});

/**
 * POST /api/resources
 * Create a new resource
 */
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { title, description, url, type, tags } = req.body;
    const userId = req.user?.id;

    if (!title || !url) {
      return res.status(400).json({
        success: false,
        error: 'Title and URL are required'
      });
    }

    // Mock resource creation - replace with actual implementation
    const newResource = {
      id: Date.now().toString(),
      title,
      description,
      url,
      type: type || 'link',
      tags: tags || [],
      userId,
      createdAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      data: newResource
    });
  } catch (error: any) {
    logger.error('Failed to create resource', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create resource'
    });
  }
});

export default router;
