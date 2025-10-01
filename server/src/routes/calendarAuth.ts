import express from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const router = express.Router()

/**
 * GET /api/calendar-auth/google/url
 * Get Google Calendar auth URL
 */
router.get('/google/url', async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = 'https://syncscript-e-qlwn-git-main-christopher-stringers-projects.vercel.app/google-callback'
    
    if (!clientId || clientId === 'placeholder') {
      return res.json({
        success: false,
        error: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID in environment variables.'
      })
    }
    
    // Google Calendar scopes - Updated for real OAuth
    const scopes = [
      'openid',
      'email', 
      'profile',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events'
    ].join(' ')
    
    const authUrl = `https://accounts.google.com/oauth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent`
    
    res.json({
      success: true,
      data: {
        authUrl
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get Google auth URL'
    })
  }
})

/**
 * POST /api/calendar-auth/google/callback
 * Handle Google Calendar OAuth callback
 */
router.post('/google/callback', async (req, res) => {
  try {
    const { code } = req.body
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code is required'
      })
    }
    
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = 'https://syncscript-e-qlwn-git-main-christopher-stringers-projects.vercel.app/google-callback'
    
    if (!clientId || !clientSecret || clientId === 'placeholder') {
      return res.status(500).json({
        success: false,
        error: 'Google OAuth not properly configured'
      })
    }
    
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Google token exchange failed:', errorData)
      return res.status(400).json({
        success: false,
        error: 'Failed to exchange authorization code for tokens'
      })
    }
    
    const tokens = await tokenResponse.json() as {
      access_token: string
      refresh_token?: string
      expires_in: number
      token_type: string
    }
    
    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    })
    
    if (!userResponse.ok) {
      return res.status(400).json({
        success: false,
        error: 'Failed to get user information from Google'
      })
    }
    
    const userInfo = await userResponse.json() as {
      id: string
      email: string
      name: string
      picture: string
    }
    
    res.json({
      success: true,
      data: {
        user: {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture
        },
        tokens: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString()
        }
      }
    })
  } catch (error: any) {
    console.error('Google callback error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to process Google callback'
    })
  }
})

/**
 * GET /api/calendar-auth/outlook/url
 * Get Outlook Calendar auth URL
 */
router.get('/outlook/url', async (req, res) => {
  try {
    res.json({
      success: false,
      error: 'Outlook Calendar integration coming soon'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get Outlook auth URL'
    })
  }
})

/**
 * GET /api/calendar-auth/apple/url
 * Get Apple Calendar auth URL
 */
router.get('/apple/url', async (req, res) => {
  try {
    res.json({
      success: false,
      error: 'Apple Calendar integration coming soon'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get Apple auth URL'
    })
  }
})

export default router