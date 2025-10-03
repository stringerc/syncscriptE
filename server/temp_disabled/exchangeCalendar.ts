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
 * Get Exchange OAuth URL
 */
router.get('/auth-url', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  
  // Check if already connected
  const existingIntegration = await prisma.calendarIntegration.findFirst({
    where: { userId, provider: 'exchange', isActive: true }
  });

  if (existingIntegration) {
    return res.json({
      success: true,
      data: {
        message: 'Exchange Calendar is already connected',
        alreadyConnected: true
      }
    });
  }

  // Generate OAuth URL for Exchange/Office 365
  const clientId = process.env.OUTLOOK_CLIENT_ID;
  const redirectUri = process.env.OUTLOOK_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    throw createError('Exchange Calendar configuration missing', 500);
  }

  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
    `client_id=${clientId}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent('https://graph.microsoft.com/Calendars.ReadWrite offline_access')}&` +
    `response_mode=query&` +
    `state=${userId}`;

  logger.info(`Exchange OAuth URL generated for user ${userId}`);

  res.json({
    success: true,
    data: {
      authUrl,
      message: 'Redirect to this URL to authorize Exchange Calendar access'
    }
  });
}));

/**
 * Handle Exchange OAuth callback
 */
router.post('/auth/login-callback', asyncHandler(async (req, res) => {
  const { code, state } = req.body;

  if (!code || !state) {
    throw createError('Authorization code and state are required', 400);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      client_id: process.env.OUTLOOK_CLIENT_ID,
      client_secret: process.env.OUTLOOK_CLIENT_SECRET,
      code,
      redirect_uri: process.env.OUTLOOK_REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Get user info from Microsoft Graph
    const userResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const userInfo = userResponse.data;

    // Store the integration
    const integration = await prisma.calendarIntegration.upsert({
      where: {
        userId_provider: {
          userId: state,
          provider: 'exchange'
        }
      },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(Date.now() + expires_in * 1000),
        isActive: true
      },
      create: {
        userId: state,
        provider: 'exchange',
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(Date.now() + expires_in * 1000),
        isActive: true
      }
    });

    logger.info(`Exchange Calendar connected for user ${state}`);

    res.json({
      success: true,
      data: {
        user: {
          id: state,
          email: userInfo.mail || userInfo.userPrincipalName,
          name: userInfo.displayName
        },
        token: access_token,
        message: 'Exchange Calendar connected successfully'
      }
    });

  } catch (error: any) {
    logger.error('Error handling Exchange OAuth callback:', error);
    
    if (error.response?.data?.error === 'invalid_grant') {
      throw createError('Invalid or expired authorization code', 400);
    }
    
    throw createError('Failed to connect Exchange Calendar', 500);
  }
}));

/**
 * Disconnect Exchange Calendar
 */
router.delete('/disconnect', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  await prisma.calendarIntegration.updateMany({
    where: { userId, provider: 'exchange' },
    data: { isActive: false }
  });

  logger.info(`Exchange Calendar disconnected for user ${userId}`);
  res.json({ success: true, message: 'Exchange Calendar disconnected successfully' });
}));

/**
 * Get Exchange Calendar events
 */
router.get('/events', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { timeMin, timeMax } = req.query;

  const integration = await prisma.calendarIntegration.findFirst({
    where: { userId, provider: 'exchange', isActive: true }
  });

  if (!integration) {
    throw createError('Exchange Calendar not connected', 404);
  }

  try {
    // Use the same Microsoft Graph API as Outlook
    const { ExchangeCalendarService } = await import('../utils/exchangeCalendarService');
    
    const exchangeService = new ExchangeCalendarService({
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken || undefined,
      expiresAt: integration.expiresAt || undefined
    });

    const events = await exchangeService.getEvents(timeMin as string, timeMax as string);

    res.json({ success: true, data: { events } });
  } catch (error: any) {
    logger.error('Error fetching Exchange events:', error);
    throw createError('Failed to fetch Exchange calendar events', 500);
  }
}));

/**
 * Create an event in Exchange Calendar
 */
router.post('/events', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const eventData = req.body;

  const integration = await prisma.calendarIntegration.findFirst({
    where: { userId, provider: 'exchange', isActive: true }
  });

  if (!integration) {
    throw createError('Exchange Calendar not connected', 404);
  }

  try {
    const { ExchangeCalendarService } = await import('../utils/exchangeCalendarService');
    
    const exchangeService = new ExchangeCalendarService({
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken || undefined,
      expiresAt: integration.expiresAt || undefined
    });

    const createdEvent = await exchangeService.createEvent(eventData);

    res.status(201).json({ success: true, data: { event: createdEvent } });
  } catch (error: any) {
    logger.error('Error creating Exchange event:', error);
    throw createError('Failed to create Exchange calendar event', 500);
  }
}));

/**
 * Update an event in Exchange Calendar
 */
router.put('/events/:id', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const eventId = req.params.id;
  const eventData = req.body;

  const integration = await prisma.calendarIntegration.findFirst({
    where: { userId, provider: 'exchange', isActive: true }
  });

  if (!integration) {
    throw createError('Exchange Calendar not connected', 404);
  }

  try {
    const { ExchangeCalendarService } = await import('../utils/exchangeCalendarService');
    
    const exchangeService = new ExchangeCalendarService({
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken || undefined,
      expiresAt: integration.expiresAt || undefined
    });

    const updatedEvent = await exchangeService.updateEvent(eventId, eventData);

    res.json({ success: true, data: { event: updatedEvent } });
  } catch (error: any) {
    logger.error('Error updating Exchange event:', error);
    throw createError('Failed to update Exchange calendar event', 500);
  }
}));

/**
 * Delete an event from Exchange Calendar
 */
router.delete('/events/:id', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const eventId = req.params.id;

  const integration = await prisma.calendarIntegration.findFirst({
    where: { userId, provider: 'exchange', isActive: true }
  });

  if (!integration) {
    throw createError('Exchange Calendar not connected', 404);
  }

  try {
    const { ExchangeCalendarService } = await import('../utils/exchangeCalendarService');
    
    const exchangeService = new ExchangeCalendarService({
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken || undefined,
      expiresAt: integration.expiresAt || undefined
    });

    await exchangeService.deleteEvent(eventId);

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting Exchange event:', error);
    throw createError('Failed to delete Exchange calendar event', 500);
  }
}));

export default router;
