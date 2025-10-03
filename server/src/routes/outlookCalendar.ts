import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import axios from 'axios';

const router = Router();
const prisma = new PrismaClient();

/**
 * Get Outlook OAuth authorization URL
 */
router.get('/auth-url', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  
  // Check if user already has an active Outlook integration
  const existingIntegration = await prisma.calendarIntegration.findFirst({
    where: { 
      userId, 
      provider: 'outlook',
      isActive: true 
    }
  });

  if (existingIntegration) {
    return res.json({
      success: true,
      data: {
        authUrl: null,
        message: 'Outlook calendar is already connected'
      }
    });
  }

  const clientId = process.env.OUTLOOK_CLIENT_ID;
  const redirectUri = process.env.OUTLOOK_REDIRECT_URI || 'http://localhost:3000/auth/outlook/callback';
  
  if (!clientId) {
    throw createError('Outlook client ID not configured', 500);
  }

  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
    `client_id=${clientId}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent('https://graph.microsoft.com/Calendars.ReadWrite offline_access')}&` +
    `response_mode=query&` +
    `state=${userId}`;

  res.json({
    success: true,
    data: { authUrl }
  });
}));

/**
 * Handle Outlook OAuth callback
 */
router.post('/auth/callback', authenticateToken, asyncHandler(async (req, res) => {
  const { code } = req.body;
  const userId = req.user!.id;

  if (!code) {
    throw createError('Authorization code is required', 400);
  }

  logger.info('Outlook OAuth callback received', { 
    codeLength: code.length,
    codePrefix: code.substring(0, 10) + '...',
    userId,
    timestamp: new Date().toISOString()
  });

  try {
    // Exchange code for tokens
    const credentials = await getTokensFromCode(code);
    
    // Get user info from Microsoft Graph
    const userInfo = await getUserInfo(credentials.accessToken);
    
    logger.info('Outlook user info', {
      email: userInfo.mail || userInfo.userPrincipalName,
      name: userInfo.displayName,
      userId
    });

    // Check if user already exists and has Outlook linked
    const existingUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: userInfo.mail || userInfo.userPrincipalName },
          { id: userId }
        ]
      }
    });

    if (existingUser && existingUser.id !== userId) {
      throw createError('This Outlook account is already linked to another SyncScript account', 400);
    }

    // Create or update calendar integration
    const integration = await prisma.calendarIntegration.upsert({
      where: {
        userId_provider: {
          userId,
          provider: 'outlook'
        }
      },
      update: {
        accessToken: credentials.accessToken,
        refreshToken: credentials.refreshToken,
        expiresAt: credentials.expiresAt,
        isActive: true
      },
      create: {
        userId,
        provider: 'outlook',
        accessToken: credentials.accessToken,
        refreshToken: credentials.refreshToken,
        expiresAt: credentials.expiresAt,
        isActive: true
      }
    });

    logger.info('Outlook calendar integration created/updated', {
      integrationId: integration.id,
      userId,
      expiresAt: credentials.expiresAt
    });

    res.json({
      success: true,
      data: {
        user: {
          id: existingUser?.id || userId,
          email: existingUser?.email || userInfo.mail || userInfo.userPrincipalName,
          name: existingUser?.name || userInfo.displayName
        },
        token: 'outlook-integrated', // We don't need a JWT token for calendar integration
        integration: {
          id: integration.id,
          provider: 'outlook',
          connectedAt: integration.createdAt
        }
      }
    });

  } catch (error: any) {
    logger.error('Error handling Outlook OAuth callback:', error);
    throw createError('Failed to connect Outlook calendar', 500);
  }
}));

/**
 * Exchange authorization code for access and refresh tokens
 */
async function getTokensFromCode(code: string) {
  const clientId = process.env.OUTLOOK_CLIENT_ID;
  const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
  const redirectUri = process.env.OUTLOOK_REDIRECT_URI || 'http://localhost:3000/auth/outlook/callback';

  if (!clientId || !clientSecret) {
    throw new Error('Outlook OAuth credentials not configured');
  }

  try {
    const response = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      scope: 'https://graph.microsoft.com/Calendars.ReadWrite offline_access'
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in } = response.data;
    
    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(Date.now() + expires_in * 1000)
    };
  } catch (error: any) {
    logger.error('Error exchanging Outlook code for tokens:', error);
    throw new Error('Failed to exchange authorization code for tokens');
  }
}

/**
 * Get user information from Microsoft Graph
 */
async function getUserInfo(accessToken: string) {
  try {
    const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error: any) {
    logger.error('Error getting Outlook user info:', error);
    throw new Error('Failed to get user information from Microsoft Graph');
  }
}

export default router;
