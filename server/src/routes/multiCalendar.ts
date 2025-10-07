import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * GET /api/multi-calendar/providers
 * Get all available calendar providers
 */
router.get('/providers', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const providers = [
      {
        id: 'google',
        name: 'Google Calendar',
        status: 'connected',
        color: '#4285F4',
        icon: 'google'
      },
      {
        id: 'outlook',
        name: 'Outlook Calendar',
        status: 'available',
        color: '#0078D4',
        icon: 'outlook'
      },
      {
        id: 'apple',
        name: 'Apple Calendar',
        status: 'available',
        color: '#000000',
        icon: 'apple'
      }
    ];

    res.json({
      success: true,
      data: { providers }
    });
  } catch (error: any) {
    logger.error('Failed to fetch calendar providers', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch calendar providers'
    });
  }
});

/**
 * GET /api/multi-calendar/events
 * Get events from all connected calendars
 */
router.get('/events', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { start, end } = req.query;
    
    // Mock data for now - replace with actual calendar integration
    const events = [
      {
        id: '1',
        title: 'Team Meeting',
        start: new Date().toISOString(),
        end: new Date(Date.now() + 3600000).toISOString(),
        provider: 'google',
        calendar: 'primary'
      }
    ];

    res.json({
      success: true,
      data: { events }
    });
  } catch (error: any) {
    logger.error('Failed to fetch multi-calendar events', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events'
    });
  }
});

export default router;
