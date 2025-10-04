import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { OutlookCalendarService } from '../services/outlookCalendarService';
import { PrismaClient } from '@prisma/client';
import { getCurrentTraceContext, logWithTrace } from '../services/traceService';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/outlook-calendar/auth-url
 * Get Outlook OAuth authorization URL
 */
router.get('/auth-url', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { redirectUri } = req.query;

  const traceContext = getCurrentTraceContext();
  logWithTrace('info', 'Outlook auth URL requested', { userId });

  try {
    const outlookService = OutlookCalendarService.getInstance();
    const authUrl = outlookService.getAuthUrl(redirectUri as string);

    res.json({
      success: true,
      data: {
        authUrl,
        redirectUri: redirectUri || process.env.MICROSOFT_REDIRECT_URI
      }
    });

  } catch (error) {
    logWithTrace('error', 'Error getting Outlook auth URL', { 
      userId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw createError('Failed to get Outlook authorization URL', 500);
  }
}));

/**
 * POST /api/outlook-calendar/callback
 * Handle Outlook OAuth callback and store tokens
 */
router.post('/callback', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { code, redirectUri } = req.body;

  if (!code) {
    throw createError('Authorization code is required', 400);
  }

  const traceContext = getCurrentTraceContext();
  logWithTrace('info', 'Outlook OAuth callback received', { userId });

  try {
    const outlookService = OutlookCalendarService.getInstance();
    const tokens = await outlookService.getTokensFromCode(code, redirectUri);

    // Store tokens in database
    const account = await prisma.externalCalendarAccount.upsert({
      where: {
        userId_provider: {
          userId,
          provider: 'outlook'
        }
      },
      create: {
        userId,
        provider: 'outlook',
        accountId: tokens.user_id || 'outlook_user',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        status: 'CONNECTED',
        scopes: JSON.stringify(['Calendars.ReadWrite', 'User.Read'])
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        status: 'CONNECTED',
        lastSyncAt: new Date()
      }
    });

    logWithTrace('info', 'Outlook account connected successfully', { 
      userId, 
      accountId: account.id 
    });

    res.json({
      success: true,
      data: {
        message: 'Outlook Calendar connected successfully',
        accountId: account.id
      }
    });

  } catch (error) {
    logWithTrace('error', 'Error handling Outlook OAuth callback', { 
      userId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw createError('Failed to connect Outlook Calendar', 500);
  }
}));

/**
 * GET /api/outlook-calendar/calendars
 * Get user's Outlook calendars
 */
router.get('/calendars', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const traceContext = getCurrentTraceContext();
  logWithTrace('info', 'Outlook calendars requested', { userId });

  try {
    // Get user's Outlook account
    const account = await prisma.externalCalendarAccount.findFirst({
      where: {
        userId,
        provider: 'outlook',
        status: 'CONNECTED'
      }
    });

    if (!account) {
      throw createError('Outlook Calendar not connected', 404);
    }

    const outlookService = OutlookCalendarService.getInstance();
    const calendars = await outlookService.getCalendars(account.accessToken);

    res.json({
      success: true,
      data: {
        calendars,
        accountId: account.id
      }
    });

  } catch (error) {
    logWithTrace('error', 'Error getting Outlook calendars', { 
      userId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw createError('Failed to get Outlook calendars', 500);
  }
}));

/**
 * POST /api/outlook-calendar/events
 * Create an event in Outlook Calendar
 */
router.post('/events', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { calendarId, event } = req.body;

  if (!calendarId || !event) {
    throw createError('Calendar ID and event data are required', 400);
  }

  const traceContext = getCurrentTraceContext();
  logWithTrace('info', 'Creating Outlook event', { userId, calendarId });

  try {
    // Get user's Outlook account
    const account = await prisma.externalCalendarAccount.findFirst({
      where: {
        userId,
        provider: 'outlook',
        status: 'CONNECTED'
      }
    });

    if (!account) {
      throw createError('Outlook Calendar not connected', 404);
    }

    const outlookService = OutlookCalendarService.getInstance();
    const createdEvent = await outlookService.createEvent(account.accessToken, calendarId, event);

    logWithTrace('info', 'Outlook event created successfully', { 
      userId, 
      calendarId, 
      eventId: createdEvent.id 
    });

    res.json({
      success: true,
      data: {
        event: createdEvent,
        message: 'Event created in Outlook Calendar'
      }
    });

  } catch (error) {
    logWithTrace('error', 'Error creating Outlook event', { 
      userId, 
      calendarId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw createError('Failed to create Outlook event', 500);
  }
}));

/**
 * DELETE /api/outlook-calendar/disconnect
 * Disconnect Outlook Calendar
 */
router.delete('/disconnect', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const traceContext = getCurrentTraceContext();
  logWithTrace('info', 'Disconnecting Outlook Calendar', { userId });

  try {
    // Remove Outlook account
    await prisma.externalCalendarAccount.deleteMany({
      where: {
        userId,
        provider: 'outlook'
      }
    });

    logWithTrace('info', 'Outlook Calendar disconnected successfully', { userId });

    res.json({
      success: true,
      data: {
        message: 'Outlook Calendar disconnected successfully'
      }
    });

  } catch (error) {
    logWithTrace('error', 'Error disconnecting Outlook Calendar', { 
      userId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw createError('Failed to disconnect Outlook Calendar', 500);
  }
}));

/**
 * GET /api/outlook-calendar/status
 * Get Outlook Calendar connection status
 */
router.get('/status', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  try {
    const account = await prisma.externalCalendarAccount.findFirst({
      where: {
        userId,
        provider: 'outlook',
        status: 'CONNECTED'
      },
      select: {
        id: true,
        status: true,
        lastSyncAt: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: {
        connected: !!account,
        account: account || null
      }
    });

  } catch (error) {
    logger.error('Error getting Outlook Calendar status:', error);
    throw createError('Failed to get Outlook Calendar status', 500);
  }
}));

export default router;
