import express from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const router = express.Router()

/**
 * GET /api/feature-flags/flags
 * Get feature flags for the user
 */
router.get('/flags', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Return mock feature flags for now
    res.json({
      success: true,
      data: {
        flags: {
          brief: false,
          endDay: false,
          financial: false,
          outlookCalendar: false,
          appleCalendar: false,
          energyAnalysis: false,
          notifications: false
        }
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feature flags'
    })
  }
})

export default router