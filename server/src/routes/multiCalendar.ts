import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { MultiCalendarService, CalendarProvider } from '../utils/calendarService';
import { createError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

/**
 * Get all connected calendar providers for a user
 */
router.get('/providers', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  
  const integrations = await prisma.calendarIntegration.findMany({
    where: { userId, isActive: true },
    select: {
      id: true,
      provider: true,
      createdAt: true,
      expiresAt: true
    }
  });

  res.json({
    success: true,
    data: {
      providers: integrations.map(integration => ({
        id: integration.id,
        provider: integration.provider,
        connectedAt: integration.createdAt,
        expiresAt: integration.expiresAt
      }))
    }
  });
}));

/**
 * Get events from all connected calendar providers
 */
router.get('/events', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { timeMin, timeMax } = req.query;

  // Get all active calendar integrations
  const integrations = await prisma.calendarIntegration.findMany({
    where: { userId, isActive: true }
  });

  if (integrations.length === 0) {
    return res.json({
      success: true,
      data: { events: [] }
    });
  }

  // Create credentials map for MultiCalendarService
  const credentialsMap = new Map();
  for (const integration of integrations) {
    credentialsMap.set(integration.provider as CalendarProvider, {
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken,
      expiresAt: integration.expiresAt
    });
  }

  // Initialize multi-calendar service
  const calendarService = new MultiCalendarService(credentialsMap);
  
  try {
    const events = await calendarService.getAllEvents(
      timeMin as string,
      timeMax as string
    );

    res.json({
      success: true,
      data: { events }
    });
  } catch (error) {
    logger.error('Error fetching multi-calendar events:', error);
    throw createError('Failed to fetch calendar events', 500);
  }
}));

/**
 * Get events from a specific provider
 */
router.get('/events/:provider', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { provider } = req.params;
  const { timeMin, timeMax } = req.query;

  // Get integration for specific provider
  const integration = await prisma.calendarIntegration.findFirst({
    where: { 
      userId, 
      provider: provider as CalendarProvider,
      isActive: true 
    }
  });

  if (!integration) {
    throw createError(`Calendar provider ${provider} not connected`, 404);
  }

  // Create credentials map for MultiCalendarService
  const credentialsMap = new Map();
  credentialsMap.set(provider as CalendarProvider, {
    accessToken: integration.accessToken,
    refreshToken: integration.refreshToken,
    expiresAt: integration.expiresAt
  });

  // Initialize multi-calendar service
  const calendarService = new MultiCalendarService(credentialsMap);
  
  try {
    const events = await calendarService.getEventsFromProvider(
      provider as CalendarProvider,
      timeMin as string,
      timeMax as string
    );

    res.json({
      success: true,
      data: { events }
    });
  } catch (error) {
    logger.error(`Error fetching ${provider} events:`, error);
    throw createError(`Failed to fetch ${provider} calendar events`, 500);
  }
}));

/**
 * Create an event in a specific provider
 */
router.post('/events/:provider', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { provider } = req.params;
  const eventData = req.body;

  // Get integration for specific provider
  const integration = await prisma.calendarIntegration.findFirst({
    where: { 
      userId, 
      provider: provider as CalendarProvider,
      isActive: true 
    }
  });

  if (!integration) {
    throw createError(`Calendar provider ${provider} not connected`, 404);
  }

  // Create credentials map for MultiCalendarService
  const credentialsMap = new Map();
  credentialsMap.set(provider as CalendarProvider, {
    accessToken: integration.accessToken,
    refreshToken: integration.refreshToken,
    expiresAt: integration.expiresAt
  });

  // Initialize multi-calendar service
  const calendarService = new MultiCalendarService(credentialsMap);
  
  try {
    const event = await calendarService.createEventInProvider(
      provider as CalendarProvider,
      eventData
    );

    res.json({
      success: true,
      data: { event }
    });
  } catch (error) {
    logger.error(`Error creating ${provider} event:`, error);
    throw createError(`Failed to create ${provider} calendar event`, 500);
  }
}));

/**
 * Update an event in a specific provider
 */
router.put('/events/:provider/:eventId', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { provider, eventId } = req.params;
  const eventData = req.body;

  // Get integration for specific provider
  const integration = await prisma.calendarIntegration.findFirst({
    where: { 
      userId, 
      provider: provider as CalendarProvider,
      isActive: true 
    }
  });

  if (!integration) {
    throw createError(`Calendar provider ${provider} not connected`, 404);
  }

  // Create credentials map for MultiCalendarService
  const credentialsMap = new Map();
  credentialsMap.set(provider as CalendarProvider, {
    accessToken: integration.accessToken,
    refreshToken: integration.refreshToken,
    expiresAt: integration.expiresAt
  });

  // Initialize multi-calendar service
  const calendarService = new MultiCalendarService(credentialsMap);
  
  try {
    const event = await calendarService.updateEventInProvider(
      provider as CalendarProvider,
      eventId,
      eventData
    );

    res.json({
      success: true,
      data: { event }
    });
  } catch (error) {
    logger.error(`Error updating ${provider} event:`, error);
    throw createError(`Failed to update ${provider} calendar event`, 500);
  }
}));

/**
 * Delete an event from a specific provider
 */
router.delete('/events/:provider/:eventId', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { provider, eventId } = req.params;

  // Get integration for specific provider
  const integration = await prisma.calendarIntegration.findFirst({
    where: { 
      userId, 
      provider: provider as CalendarProvider,
      isActive: true 
    }
  });

  if (!integration) {
    throw createError(`Calendar provider ${provider} not connected`, 404);
  }

  // Create credentials map for MultiCalendarService
  const credentialsMap = new Map();
  credentialsMap.set(provider as CalendarProvider, {
    accessToken: integration.accessToken,
    refreshToken: integration.refreshToken,
    expiresAt: integration.expiresAt
  });

  // Initialize multi-calendar service
  const calendarService = new MultiCalendarService(credentialsMap);
  
  try {
    await calendarService.deleteEventFromProvider(
      provider as CalendarProvider,
      eventId
    );

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting ${provider} event:`, error);
    throw createError(`Failed to delete ${provider} calendar event`, 500);
  }
}));

/**
 * Disconnect a calendar provider
 */
router.delete('/providers/:provider', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { provider } = req.params;

  await prisma.calendarIntegration.updateMany({
    where: { 
      userId, 
      provider: provider as CalendarProvider 
    },
    data: { isActive: false }
  });

  res.json({
    success: true,
    message: `${provider} calendar disconnected successfully`
  });
}));

/**
 * Refresh tokens for all connected providers
 */
router.post('/refresh-tokens', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  // Get all active calendar integrations
  const integrations = await prisma.calendarIntegration.findMany({
    where: { userId, isActive: true }
  });

  if (integrations.length === 0) {
    return res.json({
      success: true,
      message: 'No calendar integrations to refresh'
    });
  }

  // Create credentials map for MultiCalendarService
  const credentialsMap = new Map();
  for (const integration of integrations) {
    credentialsMap.set(integration.provider as CalendarProvider, {
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken,
      expiresAt: integration.expiresAt
    });
  }

  // Initialize multi-calendar service
  const calendarService = new MultiCalendarService(credentialsMap);
  
  try {
    const refreshedCredentials = await calendarService.refreshAllTokens();

    // Update tokens in database
    for (const [provider, credentials] of refreshedCredentials) {
      await prisma.calendarIntegration.updateMany({
        where: { userId, provider },
        data: {
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken,
          expiresAt: credentials.expiresAt
        }
      });
    }

    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        refreshedProviders: Array.from(refreshedCredentials.keys())
      }
    });
  } catch (error) {
    logger.error('Error refreshing calendar tokens:', error);
    throw createError('Failed to refresh calendar tokens', 500);
  }
}));

export default router;
