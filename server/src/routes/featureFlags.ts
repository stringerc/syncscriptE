import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import { asyncHandler, createError } from '../middleware/errorHandler'
import { featureFlagService } from '../services/featureFlagService'
import { logger } from '../utils/logger'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// GET /flags - Get current user's feature flags
router.get('/flags', authenticateToken, asyncHandler(async (req: any, res) => {
  const userId = req.user.id
  
  const flags = await featureFlagService.getUserFlags(userId)
  
  res.json({
    success: true,
    data: flags
  })
}))

// PATCH /flags - Update current user's feature flags
router.patch('/flags', authenticateToken, asyncHandler(async (req: any, res) => {
  const userId = req.user.id
  const updates = req.body
  
  // Validate updates only contain valid flag names
  const validFlags = [
    'askAI', 'focusLock', 'mic', 'priorityHierarchy', 'templates', 'pinnedEvents',
    'googleCalendar', 'outlookCalendar', 'appleCalendar', 'friends', 'shareScript',
    'energyHUD', 'energyGraph'
  ]
  
  const invalidKeys = Object.keys(updates).filter(key => !validFlags.includes(key))
  if (invalidKeys.length > 0) {
    throw createError(400, `Invalid flag names: ${invalidKeys.join(', ')}`)
  }
  
  const flags = await featureFlagService.updateUserFlags(userId, updates)
  
  logger.info('User updated feature flags', { userId, updates })
  
  res.json({
    success: true,
    data: flags
  })
}))

// GET /flags/:userId - Admin endpoint to get any user's flags
router.get('/flags/:userId', authenticateToken, asyncHandler(async (req: any, res) => {
  const adminId = req.user.id
  const { userId } = req.params
  
  // TODO: Add admin role check here
  // For now, we'll log the access
  logger.warn('Admin accessed user flags', { adminId, targetUserId: userId })
  
  const flags = await featureFlagService.getUserFlags(userId)
  
  res.json({
    success: true,
    data: flags
  })
}))

// PATCH /flags/:userId - Admin endpoint to override any user's flags
router.patch('/flags/:userId', authenticateToken, asyncHandler(async (req: any, res) => {
  const adminId = req.user.id
  const { userId } = req.params
  const updates = req.body
  
  // TODO: Add admin role check here
  
  // Get current flags for audit
  const beforeFlags = await featureFlagService.getUserFlags(userId)
  
  // Update flags
  const afterFlags = await featureFlagService.updateUserFlags(userId, updates)
  
  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'flag_override',
      targetType: 'user',
      targetId: userId,
      beforeState: JSON.stringify(beforeFlags),
      afterState: JSON.stringify(afterFlags),
      reason: req.body.reason || 'Admin override',
      ipAddress: req.ip
    }
  })
  
  logger.warn('Admin overrode user flags', { adminId, targetUserId: userId, updates })
  
  res.json({
    success: true,
    data: afterFlags
  })
}))

// POST /flags/clear-cache - Clear feature flag cache (admin only)
router.post('/flags/clear-cache', authenticateToken, asyncHandler(async (req: any, res) => {
  const adminId = req.user.id
  const { userId } = req.body
  
  // TODO: Add admin role check
  
  featureFlagService.clearCache(userId)
  
  logger.info('Feature flag cache cleared', { adminId, targetUserId: userId })
  
  res.json({
    success: true,
    message: userId ? `Cache cleared for user ${userId}` : 'All cache cleared'
  })
}))

export default router
