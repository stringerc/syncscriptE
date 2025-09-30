import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import { asyncHandler, createError } from '../middleware/errorHandler'
import { logger } from '../utils/logger'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// GET /pinned - Get user's pinned events
router.get('/pinned', authenticateToken, asyncHandler(async (req: any, res) => {
  const userId = req.user.id

  const pinnedEvents = await prisma.event.findMany({
    where: {
      userId,
      isPinned: true
    },
    orderBy: { pinOrder: 'asc' },
    take: 5, // Max 5 pinned
    include: {
      preparationTasks: {
        where: { status: { not: 'COMPLETED' } },
        take: 5
      }
    }
  })

  res.json({
    success: true,
    data: pinnedEvents
  })
}))

// POST /events/:eventId/pin - Pin an event
router.post('/events/:eventId/pin', authenticateToken, asyncHandler(async (req: any, res) => {
  const userId = req.user.id
  const { eventId } = req.params

  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: { id: eventId, userId }
  })

  if (!event) {
    throw createError(404, 'Event not found')
  }

  // Check if already at max pins
  const pinnedCount = await prisma.event.count({
    where: { userId, isPinned: true }
  })

  if (pinnedCount >= 5 && !event.isPinned) {
    throw createError(400, 'Maximum 5 events can be pinned. Unpin one first.')
  }

  // Get next pin order
  const maxOrder = await prisma.event.findFirst({
    where: { userId, isPinned: true },
    orderBy: { pinOrder: 'desc' },
    select: { pinOrder: true }
  })

  const nextOrder = (maxOrder?.pinOrder || 0) + 1

  // Pin the event
  await prisma.event.update({
    where: { id: eventId },
    data: {
      isPinned: true,
      pinOrder: nextOrder
    }
  })

  // Log analytics
  const { analyticsService } = await import('../services/analyticsService')
  await analyticsService.logEvent(userId, 'event_pin', { eventId })

  logger.info('Event pinned', { userId, eventId, pinOrder: nextOrder })

  res.json({
    success: true,
    message: 'Event pinned successfully'
  })
}))

// POST /events/:eventId/unpin - Unpin an event
router.post('/events/:eventId/unpin', authenticateToken, asyncHandler(async (req: any, res) => {
  const userId = req.user.id
  const { eventId } = req.params

  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: { id: eventId, userId }
  })

  if (!event) {
    throw createError(404, 'Event not found')
  }

  // Unpin the event
  await prisma.event.update({
    where: { id: eventId },
    data: {
      isPinned: false,
      pinOrder: null
    }
  })

  // Reorder remaining pinned events
  const remainingPinned = await prisma.event.findMany({
    where: { userId, isPinned: true },
    orderBy: { pinOrder: 'asc' }
  })

  for (let i = 0; i < remainingPinned.length; i++) {
    await prisma.event.update({
      where: { id: remainingPinned[i].id },
      data: { pinOrder: i + 1 }
    })
  }

  // Log analytics
  const { analyticsService } = await import('../services/analyticsService')
  await analyticsService.logEvent(userId, 'event_unpin', { eventId })

  logger.info('Event unpinned', { userId, eventId })

  res.json({
    success: true,
    message: 'Event unpinned successfully'
  })
}))

// POST /reorder - Reorder pinned events
router.post('/reorder', authenticateToken, asyncHandler(async (req: any, res) => {
  const userId = req.user.id
  const { eventIds } = req.body // Array of event IDs in new order

  if (!Array.isArray(eventIds) || eventIds.length > 5) {
    throw createError(400, 'Invalid event IDs array (max 5)')
  }

  // Verify all events belong to user and are pinned
  const events = await prisma.event.findMany({
    where: {
      id: { in: eventIds },
      userId,
      isPinned: true
    }
  })

  if (events.length !== eventIds.length) {
    throw createError(400, 'Some events not found or not pinned')
  }

  // Update order
  for (let i = 0; i < eventIds.length; i++) {
    await prisma.event.update({
      where: { id: eventIds[i] },
      data: { pinOrder: i + 1 }
    })
  }

  logger.info('Pinned events reordered', { userId, newOrder: eventIds })

  res.json({
    success: true,
    message: 'Order updated successfully'
  })
}))

export default router
