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
          new_ui: true, // Modern UI shell
          cmd_palette: true, // Command palette
          askAI: true, // AI search and suggestions
          focusLock: true, // Focus lock feature
          mic: true, // Speech-to-text
          priorityHierarchy: true, // Priority system
          templates: true, // Script templates
          pinnedEvents: true, // Pinned events
          googleCalendar: true, // Google Calendar integration
          outlookCalendar: true, // Outlook integration
          appleCalendar: true, // Apple Calendar integration
          friends: true, // Social features
          shareScript: true, // Script sharing
          energyHUD: true, // Energy display
          energyGraph: true, // Energy analytics
          make_it_real: true // Auto-Plan & Place (APL) feature
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