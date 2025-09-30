import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import { asyncHandler, createError } from '../middleware/errorHandler'
import { logger } from '../utils/logger'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// GET /export - Export all user data as JSON
router.get('/export', authenticateToken, asyncHandler(async (req: any, res) => {
  const userId = req.user.id

  logger.info('User data export requested', { userId })

  // Fetch all user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tasks: true,
      events: true,
      conversations: true,
      notifications: true,
      achievements: true,
      streaks: true,
      userStats: true,
      badges: true,
      points: true,
      resources: true,
      energyPoints: true,
      dailyChallenges: true,
      energyConversions: true,
      energyEmblems: true,
      energyProfile: true,
      settings: true,
      featureFlags: true,
      analyticsEvents: {
        take: 1000, // Limit to last 1000 events
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!user) {
    throw createError(404, 'User not found')
  }

  // Remove sensitive fields
  const { password, emailVerificationToken, passwordResetToken, ...userData } = user

  // Log the export
  await prisma.analyticsEvent.create({
    data: {
      userId,
      eventType: 'data_export',
      eventData: JSON.stringify({ format: 'json' }),
      metadata: JSON.stringify({ ip: req.ip, userAgent: req.get('User-Agent') })
    }
  })

  res.json({
    success: true,
    data: userData,
    exportedAt: new Date().toISOString(),
    version: '1.0'
  })
}))

// POST /delete-account - Delete user account and all associated data
router.post('/delete-account', authenticateToken, asyncHandler(async (req: any, res) => {
  const userId = req.user.id
  const { confirmation } = req.body

  if (confirmation !== 'DELETE MY ACCOUNT') {
    throw createError(400, 'Invalid confirmation. Please type "DELETE MY ACCOUNT" to confirm.')
  }

  logger.warn('User account deletion requested', { userId })

  // Create audit log before deletion
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'account_delete',
      targetType: 'user',
      targetId: userId,
      reason: 'User requested account deletion',
      ipAddress: req.ip
    }
  })

  // Delete user (cascade will handle related data)
  await prisma.user.delete({
    where: { id: userId }
  })

  logger.info('User account deleted', { userId })

  res.json({
    success: true,
    message: 'Account and all associated data have been permanently deleted'
  })
}))

// GET /download-data - Download user data as CSV
router.get('/download-data', authenticateToken, asyncHandler(async (req: any, res) => {
  const userId = req.user.id

  logger.info('User data download requested', { userId })

  // Fetch user tasks for CSV export
  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  })

  // Convert to CSV
  const csvHeaders = 'ID,Title,Description,Status,Priority,Due Date,Created At\n'
  const csvRows = tasks.map(task => {
    return `"${task.id}","${task.title}","${task.description || ''}","${task.status}","${task.priority}","${task.dueDate || ''}","${task.createdAt}"`
  }).join('\n')

  const csv = csvHeaders + csvRows

  // Log the download
  await prisma.analyticsEvent.create({
    data: {
      userId,
      eventType: 'data_export',
      eventData: JSON.stringify({ format: 'csv', recordCount: tasks.length }),
      metadata: JSON.stringify({ ip: req.ip, userAgent: req.get('User-Agent') })
    }
  })

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="syncscript-tasks-${new Date().toISOString()}.csv"`)
  res.send(csv)
}))

export default router
