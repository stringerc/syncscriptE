import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

// Extend Express Request type
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

/**
 * GET /scripts/my-scripts
 * Get user's saved scripts with optional filtering
 */
router.get('/my-scripts', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { q, favorites } = req.query;

    let where: any = { userId };

    // Filter by favorites
    if (favorites === 'true') {
      where.isFavorite = true;
    }

    // Search query
    if (q && typeof q === 'string') {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } }
      ];
    }

    const scripts = await prisma.userScript.findMany({
      where,
      orderBy: [
        { isFavorite: 'desc' },
        { lastUsedAt: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Transform to match template format for frontend compatibility
    const transformed = scripts.map(script => {
      let manifest;
      try {
        manifest = JSON.parse(script.manifest);
      } catch (e) {
        manifest = { tasks: [], subEvents: [] };
      }

      let tags;
      try {
        tags = JSON.parse(script.tags);
      } catch (e) {
        tags = [];
      }

      return {
        id: script.id,
        versionId: script.id, // For compatibility with template system
        title: script.title,
        description: script.description,
        category: script.category || 'General',
        tags,
        manifest,
        isFavorite: script.isFavorite,
        applyCount: script.applyCount,
        lastUsedAt: script.lastUsedAt,
        createdAt: script.createdAt,
        updatedAt: script.updatedAt
      };
    });

    res.json({
      success: true,
      data: transformed
    });
  } catch (error: any) {
    logger.error('Error fetching my scripts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scripts'
    });
  }
});

/**
 * POST /scripts/events/:eventId/save-as-script
 * Save an event as a reusable script
 */
router.post('/events/:eventId/save-as-script', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { eventId } = req.params;
    const { title, description, category, tags } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }

    // Fetch the event and its preparation tasks
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        preparationTasks: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    if (event.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Build manifest
    const manifest = {
      tasks: event.preparationTasks.map(task => ({
        title: task.title,
        description: task.description,
        durationMin: task.durationMin || 30,
        priority: task.priority
      })),
      subEvents: [] // TODO: If we support sub-events in the future
    };

    // Create the script
    const script = await prisma.userScript.create({
      data: {
        userId,
        sourceEventId: eventId,
        title,
        description: description || event.description || '',
        category: category || 'General',
        tags: JSON.stringify(tags || []),
        manifest: JSON.stringify(manifest),
        isFavorite: false,
        applyCount: 0
      }
    });

    logger.info(`User ${userId} created script ${script.id} from event ${eventId}`);

    res.json({
      success: true,
      data: {
        script,
        message: 'Event saved as script successfully'
      }
    });
  } catch (error: any) {
    logger.error('Error saving event as script:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save event as script'
    });
  }
});

/**
 * POST /scripts/create
 * Create a new user script from an event
 */
router.post('/create', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { eventId, title, description, category, tags } = req.body;

    if (!eventId || !title) {
      return res.status(400).json({
        success: false,
        error: 'eventId and title are required'
      });
    }

    // Fetch the event and its preparation tasks
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        preparationTasks: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    if (event.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Build manifest
    const manifest = {
      tasks: event.preparationTasks.map(task => ({
        title: task.title,
        description: task.description,
        durationMin: task.durationMin || 30,
        priority: task.priority
      })),
      subEvents: [] // TODO: If we support sub-events in the future
    };

    // Create the script
    const script = await prisma.userScript.create({
      data: {
        userId,
        sourceEventId: eventId,
        title,
        description: description || event.description || '',
        category: category || 'General',
        tags: JSON.stringify(tags || []),
        manifest: JSON.stringify(manifest),
        isFavorite: false,
        applyCount: 0
      }
    });

    logger.info(`User ${userId} created script ${script.id} from event ${eventId}`);

    res.json({
      success: true,
      data: script
    });
  } catch (error: any) {
    logger.error('Error creating script:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create script'
    });
  }
});

/**
 * POST /scripts/:scriptId/favorite
 * Toggle favorite status for a script
 */
router.post('/:scriptId/favorite', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { scriptId } = req.params;
    const { isFavorite } = req.body;

    if (typeof isFavorite !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isFavorite must be a boolean'
      });
    }

    // Verify ownership
    const script = await prisma.userScript.findUnique({
      where: { id: scriptId }
    });

    if (!script) {
      return res.status(404).json({
        success: false,
        error: 'Script not found'
      });
    }

    if (script.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Update favorite status
    const updated = await prisma.userScript.update({
      where: { id: scriptId },
      data: { isFavorite }
    });

    res.json({
      success: true,
      data: updated
    });
  } catch (error: any) {
    logger.error('Error updating favorite:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update favorite'
    });
  }
});

/**
 * POST /scripts/:scriptId/apply
 * Apply a user script to an event
 */
router.post('/:scriptId/apply/:eventId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { scriptId, eventId } = req.params;

    // Verify script ownership
    const script = await prisma.userScript.findUnique({
      where: { id: scriptId }
    });

    if (!script) {
      return res.status(404).json({
        success: false,
        error: 'Script not found'
      });
    }

    if (script.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Verify event ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    if (event.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Parse manifest
    let manifest;
    try {
      manifest = JSON.parse(script.manifest);
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'Invalid script manifest'
      });
    }

    // Create tasks from manifest
    const tasks = await Promise.all(
      manifest.tasks.map((task: any) => {
        return prisma.task.create({
          data: {
            userId,
            eventId,
            title: task.title,
            description: task.description || '',
            status: 'PENDING',
            durationMin: task.durationMin || 30,
            priority: task.priority || 'MEDIUM'
          }
        });
      })
    );

    // Update script usage
    await prisma.userScript.update({
      where: { id: scriptId },
      data: {
        applyCount: { increment: 1 },
        lastUsedAt: new Date()
      }
    });

    logger.info(`User ${userId} applied script ${scriptId} to event ${eventId}`);

    res.json({
      success: true,
      data: {
        tasksCreated: tasks.length
      }
    });
  } catch (error: any) {
    logger.error('Error applying script:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to apply script'
    });
  }
});

/**
 * DELETE /scripts/:scriptId
 * Delete a user script
 */
router.delete('/:scriptId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { scriptId } = req.params;

    // Verify ownership
    const script = await prisma.userScript.findUnique({
      where: { id: scriptId }
    });

    if (!script) {
      return res.status(404).json({
        success: false,
        error: 'Script not found'
      });
    }

    if (script.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    await prisma.userScript.delete({
      where: { id: scriptId }
    });

    logger.info(`User ${userId} deleted script ${scriptId}`);

    res.json({
      success: true
    });
  } catch (error: any) {
    logger.error('Error deleting script:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete script'
    });
  }
});

export default router;
