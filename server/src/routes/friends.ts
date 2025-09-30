import express from 'express'
import { friendsService } from '../services/friendsService'
import { auth } from '../middleware/auth'
import rateLimit from 'express-rate-limit'

const router = express.Router()

// Rate limiting for friend requests (10 requests per hour per user)
const friendRequestRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many friend requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.userId || req.ip
})

/**
 * GET /api/friends
 * Get user's friends list
 */
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user!.userId
    const friends = await friendsService.getFriends(userId)
    
    res.json({
      success: true,
      data: { friends }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/friends/requests
 * Get pending friend requests (sent and received)
 */
router.get('/requests', auth, async (req, res) => {
  try {
    const userId = req.user!.userId
    const requests = await friendsService.getPendingRequests(userId)
    
    res.json({
      success: true,
      data: requests
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/friends/request
 * Send a friend request
 */
router.post('/request', auth, friendRequestRateLimit, async (req, res) => {
  try {
    const userId = req.user!.userId
    const { email, message } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      })
    }

    const friendship = await friendsService.sendFriendRequest(userId, email, message)
    
    res.json({
      success: true,
      data: { friendship },
      message: friendship.status === 'accepted' 
        ? 'Friend request auto-accepted!' 
        : 'Friend request sent successfully'
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/friends/respond
 * Respond to a friend request (accept/decline/block)
 */
router.post('/respond', auth, async (req, res) => {
  try {
    const userId = req.user!.userId
    const { friendshipId, action } = req.body

    if (!friendshipId || !action) {
      return res.status(400).json({
        success: false,
        error: 'friendshipId and action are required'
      })
    }

    if (!['accept', 'decline', 'block'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'action must be accept, decline, or block'
      })
    }

    const result = await friendsService.respondToFriendRequest(friendshipId, userId, action)
    
    res.json({
      success: true,
      data: result,
      message: `Friend request ${action}ed successfully`
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * DELETE /api/friends/:friendshipId
 * Remove a friend
 */
router.delete('/:friendshipId', auth, async (req, res) => {
  try {
    const userId = req.user!.userId
    const { friendshipId } = req.params

    await friendsService.removeFriend(userId, friendshipId)
    
    res.json({
      success: true,
      message: 'Friend removed successfully'
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/friends/block
 * Block a user
 */
router.post('/block', auth, async (req, res) => {
  try {
    const userId = req.user!.userId
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      })
    }

    await friendsService.blockUser(userId, email)
    
    res.json({
      success: true,
      message: 'User blocked successfully'
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/friends/prefs
 * Get friend preferences
 */
router.get('/prefs', auth, async (req, res) => {
  try {
    const userId = req.user!.userId
    const prefs = await friendsService.getFriendPrefs(userId)
    
    res.json({
      success: true,
      data: prefs
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * PATCH /api/friends/prefs
 * Update friend preferences
 */
router.patch('/prefs', auth, async (req, res) => {
  try {
    const userId = req.user!.userId
    const { showFriends, showFriendEmblems, showFriendEnergy } = req.body

    const prefs = await friendsService.updateFriendPrefs(userId, {
      showFriends,
      showFriendEmblems,
      showFriendEnergy
    })
    
    res.json({
      success: true,
      data: prefs,
      message: 'Friend preferences updated successfully'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/friends/privacy
 * Get privacy settings
 */
router.get('/privacy', auth, async (req, res) => {
  try {
    const userId = req.user!.userId
    const settings = await friendsService.getPrivacySettings(userId)
    
    res.json({
      success: true,
      data: settings
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * PATCH /api/friends/privacy
 * Update privacy settings
 */
router.patch('/privacy', auth, async (req, res) => {
  try {
    const userId = req.user!.userId
    const { hideMyEmblems, hideLastActive, hideMyEnergyFrom } = req.body

    const settings = await friendsService.updatePrivacySettings(userId, {
      hideMyEmblems,
      hideLastActive,
      hideMyEnergyFrom
    })
    
    res.json({
      success: true,
      data: settings,
      message: 'Privacy settings updated successfully'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router
