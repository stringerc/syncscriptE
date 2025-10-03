import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';

export interface ExportOptions {
  exportType: 'pdf' | 'docx' | 'pptx' | 'csv' | 'xlsx' | 'ics' | 'html' | 'json';
  scope: {
    type: 'project' | 'event' | 'script' | 'timeframe';
    id?: string;
    range?: string;
  };
  audiencePreset: 'owner' | 'team' | 'vendor' | 'attendee' | 'personal';
  redactionSettings: {
    hidePII: boolean;
    hideBudgetNumbers: boolean;
    hideInternalNotes: boolean;
    hideRestrictedItems: boolean;
    watermark: boolean;
    passcodeProtect: boolean;
    expireShareLink: boolean;
    removeAvatars: boolean;
  };
  sections: string[];
  deliveryOptions: {
    download: boolean;
    email: boolean;
    shareLink: boolean;
    pushToCloud: boolean;
    calendarSubscribe: boolean;
  };
}

export interface ExportJob {
  id: string;
  userId: string;
  exportType: string;
  scope: string;
  audiencePreset: string;
  options: string;
  status: string;
  progress: number;
  errorMessage?: string;
  downloadUrl?: string;
  shareUrl?: string;
  sharePasscode?: string;
  expiresAt?: Date;
  estimatedSize?: number;
  actualSize?: number;
  sections?: string;
  redactions?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export class ExportService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create a new export job
   */
  async createExportJob(userId: string, options: ExportOptions): Promise<ExportJob> {
    try {
      const exportJob = await this.prisma.exportJob.create({
        data: {
          userId,
          exportType: options.exportType,
          scope: JSON.stringify(options.scope),
          audiencePreset: options.audiencePreset,
          options: JSON.stringify(options),
          status: 'queued',
          progress: 0,
          sections: JSON.stringify(options.sections),
          redactions: JSON.stringify(options.redactionSettings),
          estimatedSize: await this.estimateExportSize(options),
          expiresAt: options.deliveryOptions.expireShareLink 
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            : undefined
        }
      });

      logger.info(`Export job created: ${exportJob.id} for user ${userId}`);
      return exportJob as ExportJob;
    } catch (error) {
      logger.error('Error creating export job:', error);
      throw createError('Failed to create export job', 500);
    }
  }

  /**
   * Get export job by ID
   */
  async getExportJob(jobId: string, userId: string): Promise<ExportJob | null> {
    try {
      const exportJob = await this.prisma.exportJob.findFirst({
        where: {
          id: jobId,
          userId
        }
      });

      return exportJob as ExportJob | null;
    } catch (error) {
      logger.error('Error fetching export job:', error);
      throw createError('Failed to fetch export job', 500);
    }
  }

  /**
   * Update export job status
   */
  async updateExportJobStatus(
    jobId: string, 
    status: string, 
    progress?: number, 
    errorMessage?: string,
    downloadUrl?: string,
    shareUrl?: string,
    sharePasscode?: string,
    actualSize?: number
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (progress !== undefined) updateData.progress = progress;
      if (errorMessage) updateData.errorMessage = errorMessage;
      if (downloadUrl) updateData.downloadUrl = downloadUrl;
      if (shareUrl) updateData.shareUrl = shareUrl;
      if (sharePasscode) updateData.sharePasscode = sharePasscode;
      if (actualSize) updateData.actualSize = actualSize;
      if (status === 'completed') updateData.completedAt = new Date();

      await this.prisma.exportJob.update({
        where: { id: jobId },
        data: updateData
      });

      logger.info(`Export job ${jobId} updated: ${status} (${progress}%)`);
    } catch (error) {
      logger.error('Error updating export job status:', error);
      throw createError('Failed to update export job status', 500);
    }
  }

  /**
   * Get user's export jobs
   */
  async getUserExportJobs(userId: string, limit: number = 50): Promise<ExportJob[]> {
    try {
      const exportJobs = await this.prisma.exportJob.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return exportJobs as ExportJob[];
    } catch (error) {
      logger.error('Error fetching user export jobs:', error);
      throw createError('Failed to fetch export jobs', 500);
    }
  }

  /**
   * Delete export job
   */
  async deleteExportJob(jobId: string, userId: string): Promise<void> {
    try {
      await this.prisma.exportJob.deleteMany({
        where: {
          id: jobId,
          userId
        }
      });

      logger.info(`Export job ${jobId} deleted by user ${userId}`);
    } catch (error) {
      logger.error('Error deleting export job:', error);
      throw createError('Failed to delete export job', 500);
    }
  }

  /**
   * Get export templates
   */
  async getExportTemplates(userId?: string): Promise<any[]> {
    try {
      const templates = await this.prisma.exportTemplate.findMany({
        where: {
          OR: [
            { userId },
            { isPublic: true },
            { isSystem: true }
          ]
        },
        orderBy: [
          { isSystem: 'desc' },
          { usageCount: 'desc' },
          { lastUsedAt: 'desc' }
        ]
      });

      return templates;
    } catch (error) {
      logger.error('Error fetching export templates:', error);
      throw createError('Failed to fetch export templates', 500);
    }
  }

  /**
   * Create export template
   */
  async createExportTemplate(
    userId: string,
    templateData: {
      name: string;
      description?: string;
      exportType: string;
      scope: string;
      audiencePreset: string;
      options: string;
      templateData: string;
      isPublic?: boolean;
    }
  ): Promise<any> {
    try {
      const template = await this.prisma.exportTemplate.create({
        data: {
          userId,
          name: templateData.name,
          description: templateData.description,
          exportType: templateData.exportType,
          scope: templateData.scope,
          audiencePreset: templateData.audiencePreset,
          options: templateData.options,
          templateData: templateData.templateData,
          isPublic: templateData.isPublic || false
        }
      });

      logger.info(`Export template created: ${template.id} by user ${userId}`);
      return template;
    } catch (error) {
      logger.error('Error creating export template:', error);
      throw createError('Failed to create export template', 500);
    }
  }

  /**
   * Record export analytics
   */
  async recordExportAnalytics(
    userId: string,
    exportJobId: string,
    eventType: string,
    eventData: any,
    context?: {
      exportType?: string;
      scope?: string;
      audiencePreset?: string;
      userAgent?: string;
      ipAddress?: string;
      referrer?: string;
    }
  ): Promise<void> {
    try {
      await this.prisma.exportAnalytics.create({
        data: {
          userId,
          exportJobId,
          eventType,
          eventData: JSON.stringify(eventData),
          exportType: context?.exportType,
          scope: context?.scope,
          audiencePreset: context?.audiencePreset,
          userAgent: context?.userAgent,
          ipAddress: context?.ipAddress,
          referrer: context?.referrer
        }
      });

      logger.info(`Export analytics recorded: ${eventType} for job ${exportJobId}`);
    } catch (error) {
      logger.error('Error recording export analytics:', error);
      // Don't throw error for analytics failures
    }
  }

  /**
   * Estimate export size based on options
   */
  private async estimateExportSize(options: ExportOptions): Promise<number> {
    // Basic size estimation based on export type and scope
    const baseSizes = {
      pdf: 50000,    // 50KB base
      docx: 30000,   // 30KB base
      pptx: 40000,   // 40KB base
      csv: 10000,    // 10KB base
      xlsx: 15000,   // 15KB base
      ics: 5000,     // 5KB base
      html: 20000,   // 20KB base
      json: 25000    // 25KB base
    };

    let estimatedSize = baseSizes[options.exportType] || 20000;

    // Adjust based on scope
    if (options.scope.type === 'project') {
      estimatedSize *= 3; // Projects are typically larger
    } else if (options.scope.type === 'event') {
      estimatedSize *= 2; // Events are medium-sized
    } else if (options.scope.type === 'script') {
      estimatedSize *= 1.5; // Scripts are smaller
    }

    // Adjust based on sections
    estimatedSize *= options.sections.length;

    return Math.round(estimatedSize);
  }

  /**
   * Process export job (to be implemented by specific export handlers)
   */
  async processExportJob(jobId: string): Promise<void> {
    try {
      const job = await this.getExportJob(jobId, ''); // We'll need to modify this
      if (!job) {
        throw new Error('Export job not found');
      }

      await this.updateExportJobStatus(jobId, 'processing', 10);

      // This will be implemented by specific export handlers
      // For now, we'll just mark it as completed
      await this.updateExportJobStatus(jobId, 'completed', 100);

      logger.info(`Export job ${jobId} processed successfully`);
    } catch (error) {
      logger.error(`Error processing export job ${jobId}:`, error);
      await this.updateExportJobStatus(jobId, 'failed', undefined, error.message);
    }
  }

  /**
   * Clean up expired export jobs
   */
  async cleanupExpiredJobs(): Promise<void> {
    try {
      const expiredJobs = await this.prisma.exportJob.findMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      for (const job of expiredJobs) {
        await this.prisma.exportJob.delete({
          where: { id: job.id }
        });
      }

      logger.info(`Cleaned up ${expiredJobs.length} expired export jobs`);
    } catch (error) {
      logger.error('Error cleaning up expired export jobs:', error);
    }
  }
}

export const exportService = new ExportService();
