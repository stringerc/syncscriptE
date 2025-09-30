import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import { asyncHandler, createError } from '../middleware/errorHandler'
import { analyticsService, AnalyticsEventType } from '../services/analyticsService'

const router = Router()

// POST /event - Log an analytics event
router.post('/event', authenticateToken, asyncHandler(async (req: any, res) => {
  const userId = req.user.id
  const { eventType, eventData, metadata } = req.body

  if (!eventType) {
    throw createError(400, 'Event type is required')
  }

  await analyticsService.logEvent(userId, eventType as AnalyticsEventType, eventData, metadata)

  res.json({
    success: true,
    message: 'Event logged successfully'
  })
}))

// GET /events - Get user's analytics events
router.get('/events', authenticateToken, asyncHandler(async (req: any, res) => {
  const userId = req.user.id
  const { eventType, startDate, endDate, limit } = req.query

  const events = await analyticsService.getUserAnalytics(
    userId,
    eventType as AnalyticsEventType,
    startDate ? new Date(startDate) : undefined,
    endDate ? new Date(endDate) : undefined,
    limit ? parseInt(limit) : 100
  )

  res.json({
    success: true,
    data: events
  })
}))

// GET /counts - Get event counts by type
router.get('/counts', authenticateToken, asyncHandler(async (req: any, res) => {
  const userId = req.user.id
  const { startDate, endDate } = req.query

  const counts = await analyticsService.getEventCounts(
    userId,
    startDate ? new Date(startDate) : undefined,
    endDate ? new Date(endDate) : undefined
  )

  res.json({
    success: true,
    data: counts
  })
}))

// GET /funnel - Get conversion funnel data
router.get('/funnel', authenticateToken, asyncHandler(async (req: any, res) => {
  const userId = req.user.id
  const { fromEvent, toEvent, startDate, endDate } = req.query

  if (!fromEvent || !toEvent) {
    throw createError(400, 'fromEvent and toEvent are required')
  }

  const funnel = await analyticsService.getFunnelConversion(
    userId,
    fromEvent as AnalyticsEventType,
    toEvent as AnalyticsEventType,
    startDate ? new Date(startDate) : undefined,
    endDate ? new Date(endDate) : undefined
  )

  res.json({
    success: true,
    data: funnel
  })
}))

export default router
