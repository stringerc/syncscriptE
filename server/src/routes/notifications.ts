import express from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const router = express.Router()

/**
 * GET /api/notifications
 * Get user's notifications
 */
router.get('/', async (req, res) => {
  try {
    // Return empty notifications for now
    res.json({
      success: true,
      data: {
        notifications: [],
        unreadCount: 0
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    })
  }
})

export default router