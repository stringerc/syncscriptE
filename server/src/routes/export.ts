import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { exportService } from '../services/exportService';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';

const router = Router();

/**
 * Create a new export job
 */
router.post('/create', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const exportOptions = req.body;

  // Validate export options
  if (!exportOptions.exportType || !exportOptions.scope || !exportOptions.audiencePreset) {
    throw createError('Missing required export options', 400);
  }

  const exportJob = await exportService.createExportJob(userId, exportOptions);

  // Record analytics
  await exportService.recordExportAnalytics(
    userId,
    exportJob.id,
    'export_started',
    { exportType: exportOptions.exportType, scope: exportOptions.scope },
    {
      exportType: exportOptions.exportType,
      scope: JSON.stringify(exportOptions.scope),
      audiencePreset: exportOptions.audiencePreset,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    }
  );

  res.json({
    success: true,
    data: { exportJob }
  });
}));

/**
 * Get export job by ID
 */
router.get('/job/:jobId', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { jobId } = req.params;

  const exportJob = await exportService.getExportJob(jobId, userId);
  if (!exportJob) {
    throw createError('Export job not found', 404);
  }

  res.json({
    success: true,
    data: { exportJob }
  });
}));

/**
 * Get user's export jobs
 */
router.get('/jobs', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { limit = 50 } = req.query;

  const exportJobs = await exportService.getUserExportJobs(userId, Number(limit));

  res.json({
    success: true,
    data: { exportJobs }
  });
}));

/**
 * Delete export job
 */
router.delete('/job/:jobId', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { jobId } = req.params;

  await exportService.deleteExportJob(jobId, userId);

  res.json({
    success: true,
    message: 'Export job deleted successfully'
  });
}));

/**
 * Get export templates
 */
router.get('/templates', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  const templates = await exportService.getExportTemplates(userId);

  res.json({
    success: true,
    data: { templates }
  });
}));

/**
 * Create export template
 */
router.post('/templates', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const templateData = req.body;

  const template = await exportService.createExportTemplate(userId, templateData);

  res.json({
    success: true,
    data: { template }
  });
}));

/**
 * Preview export (without generating file)
 */
router.post('/preview', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { exportType, scope, audiencePreset, sections } = req.body;

  // This would generate a preview of the export without creating the actual file
  // For now, we'll return mock preview data
  const previewData = {
    exportType,
    scope,
    audiencePreset,
    sections,
    estimatedSize: 50000,
    estimatedTime: '2-3 minutes',
    preview: {
      title: 'Export Preview',
      description: 'This is a preview of your export',
      sections: sections || ['Overview', 'Tasks', 'Events', 'Budget'],
      redactions: ['PII', 'Internal Notes'],
      format: exportType.toUpperCase()
    }
  };

  res.json({
    success: true,
    data: { preview: previewData }
  });
}));

/**
 * Generate export file
 */
router.post('/generate', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { jobId } = req.body;

  if (!jobId) {
    throw createError('Job ID is required', 400);
  }

  // Start processing the export job
  exportService.processExportJob(jobId).catch(error => {
    logger.error(`Error processing export job ${jobId}:`, error);
  });

  res.json({
    success: true,
    message: 'Export generation started',
    data: { jobId }
  });
}));

/**
 * Download export file
 */
router.get('/download/:jobId', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { jobId } = req.params;

  const exportJob = await exportService.getExportJob(jobId, userId);
  if (!exportJob) {
    throw createError('Export job not found', 404);
  }

  if (exportJob.status !== 'completed') {
    throw createError('Export job not completed yet', 400);
  }

  if (!exportJob.downloadUrl) {
    throw createError('Download URL not available', 404);
  }

  // Record download analytics
  await exportService.recordExportAnalytics(
    userId,
    jobId,
    'export_downloaded',
    { downloadUrl: exportJob.downloadUrl },
    {
      exportType: exportJob.exportType,
      scope: exportJob.scope,
      audiencePreset: exportJob.audiencePreset,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    }
  );

  // Redirect to download URL or serve file directly
  res.redirect(exportJob.downloadUrl);
}));

/**
 * Get share link info
 */
router.get('/share/:jobId', asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { passcode } = req.query;

  // This endpoint doesn't require authentication as it's for sharing
  const exportJob = await exportService.getExportJob(jobId, ''); // We'll need to modify this
  if (!exportJob) {
    throw createError('Export job not found', 404);
  }

  if (exportJob.status !== 'completed') {
    throw createError('Export job not completed yet', 400);
  }

  if (!exportJob.shareUrl) {
    throw createError('Share URL not available', 404);
  }

  // Check passcode if required
  if (exportJob.sharePasscode && exportJob.sharePasscode !== passcode) {
    throw createError('Invalid passcode', 401);
  }

  // Record share view analytics
  await exportService.recordExportAnalytics(
    exportJob.userId,
    jobId,
    'share_viewed',
    { shareUrl: exportJob.shareUrl },
    {
      exportType: exportJob.exportType,
      scope: exportJob.scope,
      audiencePreset: exportJob.audiencePreset,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      referrer: req.get('Referer')
    }
  );

  res.json({
    success: true,
    data: {
      exportJob: {
        id: exportJob.id,
        exportType: exportJob.exportType,
        createdAt: exportJob.createdAt,
        expiresAt: exportJob.expiresAt,
        shareUrl: exportJob.shareUrl
      }
    }
  });
}));

/**
 * Revoke share link
 */
router.delete('/share/:jobId', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { jobId } = req.params;

  const exportJob = await exportService.getExportJob(jobId, userId);
  if (!exportJob) {
    throw createError('Export job not found', 404);
  }

  // Clear share URL and passcode
  await exportService.updateExportJobStatus(
    jobId,
    exportJob.status,
    exportJob.progress,
    exportJob.errorMessage,
    exportJob.downloadUrl,
    undefined, // Clear shareUrl
    undefined  // Clear sharePasscode
  );

  res.json({
    success: true,
    message: 'Share link revoked successfully'
  });
}));

/**
 * Get export analytics
 */
router.get('/analytics', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { startDate, endDate, exportType } = req.query;

  // This would fetch analytics data for the user's exports
  // For now, we'll return mock analytics
  const analytics = {
    totalExports: 25,
    exportsByType: {
      pdf: 10,
      docx: 8,
      csv: 5,
      ics: 2
    },
    exportsByAudience: {
      owner: 15,
      team: 6,
      vendor: 3,
      attendee: 1
    },
    recentActivity: [
      {
        date: new Date().toISOString(),
        type: 'pdf',
        audience: 'team',
        downloads: 3
      }
    ]
  };

  res.json({
    success: true,
    data: { analytics }
  });
}));

/**
 * Export single task
 */
router.post('/task/:taskId', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { taskId } = req.params;
  const { preset, format, options = {} } = req.body;

  // Validate required fields
  if (!preset || !format) {
    throw createError('Missing required fields: preset, format', 400);
  }

  // Create export options for single task
  const exportOptions = {
    exportType: format,
    scope: {
      type: 'task',
      id: taskId
    },
    audiencePreset: preset,
    redactionSettings: {
      hidePII: preset === 'vendor' || preset === 'attendee',
      hideBudgetNumbers: preset === 'attendee',
      hideInternalNotes: preset === 'vendor' || preset === 'attendee',
      hideRestrictedItems: true,
      watermark: preset !== 'owner',
      passcodeProtect: preset === 'vendor',
      expireShareLink: preset === 'vendor'
    },
    deliveryOptions: {
      download: true,
      email: false,
      shareLink: preset === 'vendor',
      pushToCloud: false,
      calendarSubscribe: false
    },
    ...options
  };

  const exportJob = await exportService.createExportJob(userId, exportOptions);

  res.json({
    success: true,
    data: { exportJob }
  });
}));

/**
 * Export selected tasks
 */
router.post('/tasks', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { taskIds, preset, format, options = {}, groupBy } = req.body;

  // Validate required fields
  if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
    throw createError('Missing or invalid taskIds array', 400);
  }
  if (!preset || !format) {
    throw createError('Missing required fields: preset, format', 400);
  }

  // Create export options for selected tasks
  const exportOptions = {
    exportType: format,
    scope: {
      type: 'tasks',
      ids: taskIds,
      groupBy: groupBy || 'event'
    },
    audiencePreset: preset,
    redactionSettings: {
      hidePII: preset === 'vendor' || preset === 'attendee',
      hideBudgetNumbers: preset === 'attendee',
      hideInternalNotes: preset === 'vendor' || preset === 'attendee',
      hideRestrictedItems: true,
      watermark: preset !== 'owner',
      passcodeProtect: preset === 'vendor',
      expireShareLink: preset === 'vendor'
    },
    deliveryOptions: {
      download: true,
      email: false,
      shareLink: preset === 'vendor',
      pushToCloud: false,
      calendarSubscribe: false
    },
    ...options
  };

  const exportJob = await exportService.createExportJob(userId, exportOptions);

  res.json({
    success: true,
    data: { exportJob }
  });
}));

export default router;
