import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { metricsService } from '../services/metricsService';

const router = Router();

/**
 * POST /api/admin/feature-flag-kill
 * Kill a feature flag when SLOs are breached
 */
router.post('/feature-flag-kill', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { featureFlag, reason } = req.body;
  const userId = req.user?.id;

  if (!featureFlag || !reason) {
    return res.status(400).json({
      success: false,
      error: 'featureFlag and reason are required'
    });
  }

  // Only allow admin users to kill feature flags (check email for now)
  const adminEmails = ['admin@syncscript.com', 'christopher@syncscript.com'];
  if (!req.user?.email || !adminEmails.includes(req.user.email)) {
    return res.status(403).json({
      success: false,
      error: 'Only admin users can kill feature flags'
    });
  }

  try {
    // Log the feature flag kill
    logger.warn('Feature flag killed due to SLO breach', {
      featureFlag,
      reason,
      killedBy: userId,
      timestamp: new Date().toISOString()
    });

    // Record metrics
    metricsService.recordFeatureUsed(`flag_killed_${featureFlag}`);

    // In a real implementation, this would:
    // 1. Update the feature flag in the database to disabled
    // 2. Notify all connected clients to refresh their flags
    // 3. Send alerts to the team
    // 4. Create an incident ticket

    // For now, we'll just log and return success
    res.json({
      success: true,
      message: `Feature flag '${featureFlag}' has been killed due to: ${reason}`,
      data: {
        featureFlag,
        reason,
        killedBy: userId,
        killedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error killing feature flag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to kill feature flag'
    });
  }
}));

/**
 * GET /api/admin/feature-flag-status
 * Get current status of all feature flags
 */
router.get('/feature-flag-status', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  // Only allow admin users (check email for now)
  const adminEmails = ['admin@syncscript.com', 'christopher@syncscript.com'];
  if (!req.user?.email || !adminEmails.includes(req.user.email)) {
    return res.status(403).json({
      success: false,
      error: 'Only admin users can view feature flag status'
    });
  }

  try {
    // In a real implementation, this would fetch from the database
    const featureFlags = {
      new_ui: { enabled: true, lastModified: new Date().toISOString() },
      energy_engine: { enabled: true, lastModified: new Date().toISOString() },
      export_v2: { enabled: true, lastModified: new Date().toISOString() },
      calendar_sync: { enabled: true, lastModified: new Date().toISOString() }
    };

    res.json({
      success: true,
      data: featureFlags
    });

  } catch (error) {
    logger.error('Error fetching feature flag status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feature flag status'
    });
  }
}));

export default router;
