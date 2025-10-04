import { Router } from 'express';
import { metricsService } from '../services/metricsService';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /metrics
 * Expose Prometheus metrics
 * Admin-only in staging, public in prod via allowlist
 */
router.get('/', asyncHandler(async (req, res) => {
  try {
    const metrics = await metricsService.getMetrics();
    
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
    
    logger.debug('Metrics endpoint accessed', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    logger.error('Error generating metrics:', error);
    res.status(500).send('Error generating metrics');
  }
}));

export default router;
