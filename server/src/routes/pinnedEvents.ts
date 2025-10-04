/**
 * Pinned Events Routes
 * 
 * API endpoints for managing pinned events on the dashboard rail
 */

import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { asyncHandler } from '../utils/asyncHandler';
import { getCurrentTraceContext, logWithTrace } from '../services/traceService';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/pinned/events
 * Get all pinned events for the user
 */
router.get('/events', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const traceContext = getCurrentTraceContext();
    
    const pinnedEvents = await prisma.event.findMany({
      where: {
        userId: req.user!.id,
        isPinned: true
      },
      orderBy: {
        pinOrder: 'asc'
      },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        location: true,
        isAllDay: true,
        pinOrder: true
      }
    });

    logWithTrace('info', 'Pinned events retrieved', {
      userId: req.user!.id,
      count: pinnedEvents.length
    });

    res.json({
      success: true,
      data: pinnedEvents
    });
  } catch (error) {
    logWithTrace('error', 'Failed to get pinned events', {
      userId: req.user!.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get pinned events'
    });
  }
}));

/**
 * POST /api/pinned/events/:eventId/pin
 * Pin an event to the dashboard rail
 */
router.post('/events/:eventId/pin', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const { eventId } = req.params;
    const traceContext = getCurrentTraceContext();
    
    // Check if event exists and belongs to user
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId: req.user!.id
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    if (event.isPinned) {
      return res.status(400).json({
        success: false,
        error: 'Event is already pinned'
      });
    }

    // Get the next available pin order
    const maxPinOrder = await prisma.event.findFirst({
      where: {
        userId: req.user!.id,
        isPinned: true
      },
      orderBy: {
        pinOrder: 'desc'
      },
      select: {
        pinOrder: true
      }
    });

    const nextPinOrder = (maxPinOrder?.pinOrder || 0) + 1;

    // Check if we've reached the maximum number of pinned events (5)
    if (nextPinOrder > 5) {
      return res.status(400).json({
        success: false,
        error: 'Maximum number of pinned events (5) reached'
      });
    }

    // Pin the event
    await prisma.event.update({
      where: {
        id: eventId
      },
      data: {
        isPinned: true,
        pinOrder: nextPinOrder
      }
    });

    logWithTrace('info', 'Event pinned', {
      userId: req.user!.id,
      eventId,
      pinOrder: nextPinOrder
    });

    res.json({
      success: true,
      message: 'Event pinned successfully',
      data: {
        eventId,
        pinOrder: nextPinOrder
      }
    });
  } catch (error) {
    logWithTrace('error', 'Failed to pin event', {
      userId: req.user!.id,
      eventId: req.params.eventId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to pin event'
    });
  }
}));

/**
 * POST /api/pinned/events/:eventId/unpin
 * Unpin an event from the dashboard rail
 */
router.post('/events/:eventId/unpin', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const { eventId } = req.params;
    const traceContext = getCurrentTraceContext();
    
    // Check if event exists and belongs to user
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId: req.user!.id
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    if (!event.isPinned) {
      return res.status(400).json({
        success: false,
        error: 'Event is not pinned'
      });
    }

    const pinOrder = event.pinOrder;

    // Unpin the event
    await prisma.event.update({
      where: {
        id: eventId
      },
      data: {
        isPinned: false,
        pinOrder: null
      }
    });

    // Reorder remaining pinned events
    await prisma.event.updateMany({
      where: {
        userId: req.user!.id,
        isPinned: true,
        pinOrder: {
          gt: pinOrder
        }
      },
      data: {
        pinOrder: {
          decrement: 1
        }
      }
    });

    logWithTrace('info', 'Event unpinned', {
      userId: req.user!.id,
      eventId,
      previousPinOrder: pinOrder
    });

    res.json({
      success: true,
      message: 'Event unpinned successfully'
    });
  } catch (error) {
    logWithTrace('error', 'Failed to unpin event', {
      userId: req.user!.id,
      eventId: req.params.eventId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to unpin event'
    });
  }
}));

/**
 * PUT /api/pinned/events/reorder
 * Reorder pinned events
 */
router.put('/events/reorder', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const { eventIds } = req.body; // Array of event IDs in new order
    const traceContext = getCurrentTraceContext();
    
    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'eventIds must be a non-empty array'
      });
    }

    if (eventIds.length > 5) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 5 events can be pinned'
      });
    }

    // Verify all events belong to the user and are pinned
    const events = await prisma.event.findMany({
      where: {
        id: { in: eventIds },
        userId: req.user!.id,
        isPinned: true
      }
    });

    if (events.length !== eventIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Some events are not found or not pinned'
      });
    }

    // Update pin orders
    const updates = eventIds.map((eventId, index) => 
      prisma.event.update({
        where: { id: eventId },
        data: { pinOrder: index + 1 }
      })
    );

    await Promise.all(updates);

    logWithTrace('info', 'Pinned events reordered', {
      userId: req.user!.id,
      eventIds,
      newOrder: eventIds.map((id, index) => ({ id, order: index + 1 }))
    });

    res.json({
      success: true,
      message: 'Events reordered successfully'
    });
  } catch (error) {
    logWithTrace('error', 'Failed to reorder pinned events', {
      userId: req.user!.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to reorder events'
    });
  }
}));

export default router;
