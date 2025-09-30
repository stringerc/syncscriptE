import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import { asyncHandler, createError } from '../middleware/errorHandler'
import { scriptsService } from '../services/scriptsService'
import { logger } from '../utils/logger'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// POST /from-event - Create script from event
router.post('/from-event', authenticateToken, asyncHandler(async (req: any, res) => {
  const userId = req.user.id
  const { eventId, title, description } = req.body

  if (!eventId || !title) {
    throw createError(400, 'eventId and title are required')
  }

  const script = await scriptsService.createFromEvent(userId, eventId, title, description)

  // Log analytics
  const { analyticsService } = await import('../services/analyticsService')
  await analyticsService.logEvent(userId, 'template_save', { 
    scriptId: script.id,
    sourceEventId: eventId
  })

  res.json({
    success: true,
    data: script,
    message: script.containsPII 
      ? 'Script created with PII warning - review before publishing'
      : 'Script created successfully'
  })
}))

// GET / - Get user's scripts
router.get('/', authenticateToken, asyncHandler(async (req: any, res) => {
  const userId = req.user.id
  const { status, category } = req.query

  const where: any = {
    OR: [
      { userId },
      { isPublic: true }
    ]
  }

  if (status) where.status = status
  if (category) where.category = category

  const scripts = await prisma.script.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: { applications: true }
      }
    }
  })

  res.json({
    success: true,
    data: scripts
  })
}))

// GET /:scriptId - Get script details
router.get('/:scriptId', authenticateToken, asyncHandler(async (req: any, res) => {
  const userId = req.user.id
  const { scriptId } = req.params

  const script = await prisma.script.findFirst({
    where: {
      id: scriptId,
      OR: [
        { userId },
        { isPublic: true }
      ]
    },
    include: {
      applications: {
        orderBy: { appliedAt: 'desc' },
        take: 10
      }
    }
  })

  if (!script) {
    throw createError(404, 'Script not found')
  }

  res.json({
    success: true,
    data: script
  })
}))

// PUT /:scriptId - Update script
router.put('/:scriptId', authenticateToken, asyncHandler(async (req: any, res) => {
  const userId = req.user.id
  const { scriptId } = req.params
  const { title, description, manifest, variables, category } = req.body

  // Verify ownership
  const script = await prisma.script.findFirst({
    where: { id: scriptId, userId }
  })

  if (!script) {
    throw createError(404, 'Script not found or access denied')
  }

  // Check for PII if manifest is being updated
  let containsPII = script.containsPII
  if (manifest) {
    containsPII = scriptsService['checkForPII'](manifest)
  }

  // Update script
  const updated = await prisma.script.update({
    where: { id: scriptId },
    data: {
      title: title || script.title,
      description: description !== undefined ? description : script.description,
      manifest: manifest || script.manifest,
      variables: variables !== undefined ? variables : script.variables,
      category: category !== undefined ? category : script.category,
      containsPII,
      version: manifest ? script.version + 1 : script.version
    }
  })

  res.json({
    success: true,
    data: updated
  })
}))

// POST /:scriptId/publish - Publish script
router.post('/:scriptId/publish', authenticateToken, asyncHandler(async (req: any, res) => {
  const userId = req.user.id
  const { scriptId } = req.params

  const script = await prisma.script.findFirst({
    where: { id: scriptId, userId }
  })

  if (!script) {
    throw createError(404, 'Script not found')
  }

  if (script.containsPII) {
    throw createError(400, 'Cannot publish script containing PII. Please review and remove sensitive data.')
  }

  await prisma.script.update({
    where: { id: scriptId },
    data: { status: 'PUBLISHED' }
  })

  // Log analytics
  const { analyticsService } = await import('../services/analyticsService')
  await analyticsService.logEvent(userId, 'template_publish', { scriptId })

  res.json({
    success: true,
    message: 'Script published successfully'
  })
}))

// POST /:scriptId/apply - Apply script to event
router.post('/:scriptId/apply', authenticateToken, asyncHandler(async (req: any, res) => {
  const userId = req.user.id
  const { scriptId } = req.params
  const { eventId, variableValues } = req.body

  if (!eventId) {
    throw createError(400, 'eventId is required')
  }

  const result = await scriptsService.applyScript(userId, scriptId, eventId, variableValues)

  // Log analytics
  const { analyticsService } = await import('../services/analyticsService')
  await analyticsService.logEvent(userId, 'template_apply', { 
    scriptId,
    eventId,
    isDuplicate: result.isDuplicate
  })

  res.json({
    success: true,
    data: result,
    message: result.isDuplicate 
      ? 'Script already applied to this event'
      : `Script applied! ${result.generatedTasks.length} tasks created.`
  })
}))

// POST /applications/:applicationId/confirm - Confirm application
router.post('/applications/:applicationId/confirm', authenticateToken, asyncHandler(async (req: any, res) => {
  const { applicationId } = req.params

  await scriptsService.confirmApplication(applicationId)

  res.json({
    success: true,
    message: 'Application confirmed'
  })
}))

// DELETE /:scriptId - Delete script
router.delete('/:scriptId', authenticateToken, asyncHandler(async (req: any, res) => {
  const userId = req.user.id
  const { scriptId } = req.params

  const script = await prisma.script.findFirst({
    where: { id: scriptId, userId }
  })

  if (!script) {
    throw createError(404, 'Script not found')
  }

  await prisma.script.delete({
    where: { id: scriptId }
  })

  res.json({
    success: true,
    message: 'Script deleted'
  })
}))

export default router
