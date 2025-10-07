import { Router } from 'express';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { metricsService } from '../services/metricsService';

const router = Router();

interface TelemetryEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

interface TelemetryRequest {
  events: TelemetryEvent[];
}

/**
 * POST /telemetry
 * Receive client-side telemetry events and convert to metrics
 */
router.post('/', asyncHandler(async (req, res) => {
  try {
    const { events }: TelemetryRequest = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'Events must be an array' });
    }

    // Process each event
    for (const event of events) {
      if (!event.event) {
        continue;
      }

      // Convert telemetry events to metrics
      switch (event.event) {
        case 'ui.new_shell.rendered':
          metricsService.recordFeatureUsed(`ui.new_shell.rendered.${event.properties?.variant || 'unknown'}`);
          break;

        case 'ui.nav.click':
          metricsService.recordFeatureUsed(`ui.nav.click.${event.properties?.item || 'unknown'}`);
          break;

        case 'ui.search.opened':
          metricsService.recordFeatureUsed('ui.search.opened');
          break;

        default:
          // Generic feature usage tracking
          if (event.event.startsWith('ui.')) {
            metricsService.recordFeatureUsed(event.event);
          }
      }
    }

    logger.debug('Telemetry events processed', { 
      count: events.length,
      events: events.map(e => e.event)
    });

    res.json({ success: true, processed: events.length });
  } catch (error) {
    logger.error('Error processing telemetry events:', error);
    res.status(500).json({ error: 'Failed to process telemetry events' });
  }
}));

export default router;
