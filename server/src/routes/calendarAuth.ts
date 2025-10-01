import express from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { GoogleCalendarService } from '../utils/googleCalendarService';
import { outlookCalendarService } from '../services/outlookCalendarService';
import { appleCalendarService } from '../services/appleCalendarServiceEnhanced';

const router = express.Router();

// ============================================================
// GOOGLE CALENDAR AUTH
// ============================================================

// GET /api/calendar-auth/google/url - Get Google OAuth URL
router.get('/google/url', asyncHandler(async (req, res) => {
  try {
    const authUrl = GoogleCalendarService.getAuthUrl();
    
    res.json({
      success: true,
      data: { authUrl },
      message: 'Google Calendar auth URL generated'
    });
  } catch (error: any) {
    logger.error('Error generating Google auth URL:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate auth URL'
    });
  }
}));

// GET /api/calendar-auth/google/callback - Handle Google OAuth callback (redirect from Google)
router.get('/google/callback', asyncHandler(async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    logger.error('Google OAuth error:', error);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/google-callback?error=${encodeURIComponent(error as string)}`);
  }

  if (!code) {
    logger.error('No authorization code received');
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/google-callback?error=no_code`);
  }

  try {
    const credentials = await GoogleCalendarService.getTokensFromCode(code as string);
    
    // Save to database
    // TODO: Implement saveGoogleConnection method
    
    logger.info('Google Calendar connected successfully');
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/google-callback?success=true`);
  } catch (error: any) {
    logger.error('Google Calendar callback error:', error);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/google-callback?error=${encodeURIComponent(error.message || 'connection_failed')}`);
  }
}));

// POST /api/calendar-auth/google/callback - Handle Google OAuth callback (for frontend processing)

// ============================================================
// OUTLOOK CALENDAR AUTH
// ============================================================

// GET /api/calendar-auth/outlook/url - Get Outlook OAuth URL
router.get('/outlook/url', asyncHandler(async (req, res) => {
  try {
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/outlook-callback';
    const authUrl = await outlookCalendarService.getAuthUrl(redirectUri);
    
    res.json({
      success: true,
      data: { authUrl },
      message: 'Outlook Calendar auth URL generated'
    });
  } catch (error: any) {
    logger.error('Error generating Outlook auth URL:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Outlook Calendar not configured. Set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET in .env'
    });
  }
}));

// POST /api/calendar-auth/outlook/callback - Handle Outlook OAuth callback
router.post('/outlook/callback', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { code } = req.body;

  if (!code) {
    throw createError(400, 'Authorization code is required');
  }

  try {
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/outlook-callback';
    const tokens = await outlookCalendarService.getTokensFromCode(code, redirectUri);
    
    // Extract user info from token
    const userInfo = tokens.account || { id: tokens.uniqueId, email: tokens.username };
    
    // Save connection
    await outlookCalendarService.saveConnection(userId, tokens, userInfo);
    
    res.json({
      success: true,
      message: 'Outlook Calendar connected successfully'
    });
  } catch (error: any) {
    logger.error('Outlook Calendar callback error:', error);
    throw createError(500, 'Failed to connect Outlook Calendar');
  }
}));

// ============================================================
// APPLE CALENDAR AUTH
// ============================================================

// GET /api/calendar-auth/apple/url - Get Apple OAuth URL
router.get('/apple/url', asyncHandler(async (req, res) => {
  try {
    const redirectUri = process.env.APPLE_REDIRECT_URI || 'http://localhost:3000/apple-callback';
    const authUrl = appleCalendarService.getAuthUrl(redirectUri);
    
    res.json({
      success: true,
      data: { authUrl },
      message: 'Apple Calendar auth URL generated'
    });
  } catch (error: any) {
    logger.error('Error generating Apple auth URL:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Apple Calendar not configured. Set APPLE_CLIENT_ID, APPLE_TEAM_ID, and APPLE_CLIENT_SECRET in .env'
    });
  }
}));

// POST /api/calendar-auth/apple/callback - Handle Apple OAuth callback
router.post('/apple/callback', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { code, id_token } = req.body;

  if (!code) {
    throw createError(400, 'Authorization code is required');
  }

  try {
    const redirectUri = process.env.APPLE_REDIRECT_URI || 'http://localhost:3000/apple-callback';
    const tokens = await appleCalendarService.getTokensFromCode(code, redirectUri);
    
    // Decode id_token to get user info (JWT)
    const userInfo = JSON.parse(Buffer.from(id_token.split('.')[1], 'base64').toString());
    
    // Save connection
    await appleCalendarService.saveConnection(userId, tokens, userInfo);
    
    res.json({
      success: true,
      message: 'Apple Calendar connected successfully'
    });
  } catch (error: any) {
    logger.error('Apple Calendar callback error:', error);
    throw createError(500, 'Failed to connect Apple Calendar');
  }
}));

export default router;

