import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import { asyncHandler, createError } from '../middleware/errorHandler'
import { suggestAPIRateLimit } from '../middleware/rateLimitMiddleware'
import { suggestionService } from '../services/suggestionService'
import { logger } from '../utils/logger'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// POST /tasks - Get task suggestions
router.post('/tasks', authenticateToken, suggestAPIRateLimit, asyncHandler(async (req: any, res) => {
  const userId = req.user.id
  const { context } = req.body

  logger.info('Task suggestions requested', { userId, hasContext: !!context })

  const suggestions = await suggestionService.suggestTasks(userId, context)

  res.json({
    success: true,
    data: {
      suggestions,
      count: suggestions.length
    }
  })
}))

// POST /events - Get event suggestions
router.post('/events', authenticateToken, suggestAPIRateLimit, asyncHandler(async (req: any, res) => {
  const userId = req.user.id
  const { context } = req.body

  logger.info('Event suggestions requested', { userId, hasContext: !!context })

  const suggestions = await suggestionService.suggestEvents(userId, context)

  res.json({
    success: true,
    data: {
      suggestions,
      count: suggestions.length
    }
  })
}))

// POST /accept - Accept a suggestion and create task/event (idempotent)
router.post('/accept', authenticateToken, asyncHandler(async (req: any, res) => {
  const userId = req.user.id
  const { suggestionId, type, data } = req.body

  if (!suggestionId || !type || !data) {
    throw createError(400, 'suggestionId, type, and data are required')
  }

  // Check idempotency - did we already create this?
  const idempotencyKey = `suggestion-${userId}-${suggestionId}`
  
  // Simple in-memory check (in production, use Redis)
  // For now, just check if a recent item exists with matching title
  if (type === 'task') {
    const existingTask = await prisma.task.findFirst({
      where: {
        userId,
        title: data.title,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000) // Last minute
        }
      }
    })

    if (existingTask) {
      logger.info('Idempotent suggestion accept detected', { userId, suggestionId, existingId: existingTask.id })
      return res.json({
        success: true,
        data: {
          id: existingTask.id,
          type: 'task',
          isDuplicate: true
        },
        message: 'Task already created from this suggestion'
      })
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        userId,
        title: data.title,
        description: data.description || '',
        priority: data.priority || 'medium',
        status: 'PENDING',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        durationMin: data.durationMin || null
      }
    })

    // Log acceptance
    await suggestionService.logSuggestionResponse(userId, suggestionId, 'accepted', task.id)

    logger.info('Task created from suggestion', { userId, taskId: task.id, suggestionId })

    res.json({
      success: true,
      data: {
        id: task.id,
        type: 'task'
      },
      message: 'Task created successfully'
    })
  } else if (type === 'event') {
    const existingEvent = await prisma.event.findFirst({
      where: {
        userId,
        title: data.title,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000)
        }
      }
    })

    if (existingEvent) {
      logger.info('Idempotent suggestion accept detected', { userId, suggestionId, existingId: existingEvent.id })
      return res.json({
        success: true,
        data: {
          id: existingEvent.id,
          type: 'event',
          isDuplicate: true
        },
        message: 'Event already created from this suggestion'
      })
    }

    // Create event
    const startTime = data.startTime ? new Date(data.startTime) : new Date()
    const endTime = data.endTime ? new Date(data.endTime) : new Date(startTime.getTime() + (data.durationMin || 60) * 60 * 1000)

    const event = await prisma.event.create({
      data: {
        userId,
        title: data.title,
        description: data.description || '',
        startsAt: startTime,
        endsAt: endTime
      }
    })

    // Log acceptance
    await suggestionService.logSuggestionResponse(userId, suggestionId, 'accepted', event.id)

    logger.info('Event created from suggestion', { userId, eventId: event.id, suggestionId })

    res.json({
      success: true,
      data: {
        id: event.id,
        type: 'event'
      },
      message: 'Event created successfully'
    })
  } else {
    throw createError(400, 'Invalid type. Must be "task" or "event"')
  }
}))

// POST /reject - Reject a suggestion
router.post('/reject', authenticateToken, asyncHandler(async (req: any, res) => {
  const userId = req.user.id
  const { suggestionId } = req.body

  if (!suggestionId) {
    throw createError(400, 'suggestionId is required')
  }

  // Log rejection
  await suggestionService.logSuggestionResponse(userId, suggestionId, 'rejected')

  logger.info('Suggestion rejected', { userId, suggestionId })

  res.json({
    success: true,
    message: 'Suggestion rejected'
  })
}))

export default router
