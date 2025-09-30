import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import { asyncHandler, createError } from '../middleware/errorHandler'
import { priorityService } from '../services/priorityService'
import { logger } from '../utils/logger'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// POST /events/:eventId/recompute - Recompute priorities for event
router.post('/events/:eventId/recompute', authenticateToken, asyncHandler(async (req: any, res) => {
  const { eventId } = req.params
  const userId = req.user.id

  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: { id: eventId, userId }
  })

  if (!event) {
    throw createError(404, 'Event not found')
  }

  const result = await priorityService.recomputeEventPriorities(eventId)

  // Log analytics
  const { analyticsService } = await import('../services/analyticsService')
  await analyticsService.logEvent(userId, 'priority_recompute', {
    eventId,
    tasksUpdated: result.tasksUpdated,
    computeTime: result.computeTime
  })

  res.json({
    success: true,
    data: result,
    message: `Priorities updated for ${result.tasksUpdated} tasks in ${result.computeTime}ms`
  })
}))

// POST /tasks/:taskId/lock - Lock task priority (manual override)
router.post('/tasks/:taskId/lock', authenticateToken, asyncHandler(async (req: any, res) => {
  const { taskId } = req.params
  const { priority } = req.body
  const userId = req.user.id

  if (!priority) {
    throw createError(400, 'priority is required')
  }

  // Verify task ownership
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId }
  })

  if (!task) {
    throw createError(404, 'Task not found')
  }

  await priorityService.lockTaskPriority(taskId, priority)

  // Log analytics
  const { analyticsService } = await import('../services/analyticsService')
  await analyticsService.logEvent(userId, 'priority_manual_override', {
    taskId,
    priority
  })

  res.json({
    success: true,
    message: 'Task priority locked'
  })
}))

// POST /tasks/:taskId/unlock - Unlock task priority
router.post('/tasks/:taskId/unlock', authenticateToken, asyncHandler(async (req: any, res) => {
  const { taskId } = req.params
  const userId = req.user.id

  // Verify task ownership
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId }
  })

  if (!task) {
    throw createError(404, 'Task not found')
  }

  await priorityService.unlockTaskPriority(taskId)

  res.json({
    success: true,
    message: 'Task priority unlocked'
  })
}))

// GET /tasks/:taskId/wsjf - Calculate WSJF score
router.get('/tasks/:taskId/wsjf', authenticateToken, asyncHandler(async (req: any, res) => {
  const { taskId } = req.params
  const userId = req.user.id

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId }
  })

  if (!task) {
    throw createError(404, 'Task not found')
  }

  const wsjf = priorityService.calculateWSJF(task)

  res.json({
    success: true,
    data: { wsjf, taskId }
  })
}))

export default router
