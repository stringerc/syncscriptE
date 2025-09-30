import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import { asyncHandler, createError } from '../middleware/errorHandler'
import { schedulingService } from '../services/schedulingService'
import { logger } from '../utils/logger'

const router = Router()

// GET /events/:eventId/analysis - Analyze event scheduling
router.get('/events/:eventId/analysis', authenticateToken, asyncHandler(async (req: any, res) => {
  const { eventId } = req.params
  const userId = req.user.id

  // Verify event ownership
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  
  const event = await prisma.event.findFirst({
    where: { id: eventId, userId }
  })

  if (!event) {
    throw createError(404, 'Event not found')
  }

  const analysis = await schedulingService.analyzeEventScheduling(eventId)

  res.json({
    success: true,
    data: analysis
  })
}))

// POST /conflicts/:conflictId/fix - Apply suggested fix for a conflict
router.post('/conflicts/:conflictId/fix', authenticateToken, asyncHandler(async (req: any, res) => {
  const { conflictId } = req.params
  const { conflict } = req.body

  if (!conflict) {
    throw createError(400, 'Conflict data is required')
  }

  const success = await schedulingService.applyFix(conflict)

  if (!success) {
    throw createError(500, 'Failed to apply fix')
  }

  res.json({
    success: true,
    message: 'Fix applied successfully'
  })
}))

// POST /tasks/:taskId/dependencies - Set task dependencies
router.post('/tasks/:taskId/dependencies', authenticateToken, asyncHandler(async (req: any, res) => {
  const { taskId } = req.params
  const { dependencies } = req.body
  const userId = req.user.id

  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()

  // Verify task ownership
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId }
  })

  if (!task) {
    throw createError(404, 'Task not found')
  }

  // Update dependencies
  await prisma.task.update({
    where: { id: taskId },
    data: { dependencies: JSON.stringify(dependencies) }
  })

  logger.info('Task dependencies updated', { taskId, dependencies })

  res.json({
    success: true,
    message: 'Dependencies updated'
  })
}))

// POST /tasks/:taskId/store-hours - Set store hours constraint
router.post('/tasks/:taskId/store-hours', authenticateToken, asyncHandler(async (req: any, res) => {
  const { taskId } = req.params
  const { storeHours } = req.body
  const userId = req.user.id

  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()

  // Verify task ownership
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId }
  })

  if (!task) {
    throw createError(404, 'Task not found')
  }

  // Update store hours
  await prisma.task.update({
    where: { id: taskId },
    data: { storeHours: JSON.stringify(storeHours) }
  })

  logger.info('Task store hours updated', { taskId, storeHours })

  res.json({
    success: true,
    message: 'Store hours updated'
  })
}))

export default router
