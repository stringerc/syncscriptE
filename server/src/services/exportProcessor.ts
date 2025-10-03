import { ExportOptions, ExportJob, exportService } from '../services/exportService';
import { pdfExportHandler } from './pdfExportHandler';
import { csvExportHandler } from './csvExportHandler';
import { icsExportHandler } from './icsExportHandler';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

export class ExportProcessor {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Process export job
   */
  async processExportJob(jobId: string): Promise<void> {
    try {
      logger.info(`Starting export job processing: ${jobId}`);

      // Get export job
      const exportJob = await this.prisma.exportJob.findUnique({
        where: { id: jobId }
      });

      if (!exportJob) {
        throw new Error('Export job not found');
      }

      // Update status to processing
      await exportService.updateExportJobStatus(jobId, 'processing', 10);

      // Parse options
      const options: ExportOptions = JSON.parse(exportJob.options);

      // Generate export based on type
      let exportBuffer: Buffer;
      let fileName: string;
      let mimeType: string;

      switch (exportJob.exportType) {
        case 'pdf':
          exportBuffer = await pdfExportHandler.generatePDF(exportJob, options);
          fileName = `${this.generateFileName(exportJob)}.pdf`;
          mimeType = 'application/pdf';
          break;
        case 'csv':
          exportBuffer = await csvExportHandler.generateCSV(exportJob, options);
          fileName = `${this.generateFileName(exportJob)}.csv`;
          mimeType = 'text/csv';
          break;
        case 'xlsx':
          exportBuffer = await csvExportHandler.generateXLSX(exportJob, options);
          fileName = `${this.generateFileName(exportJob)}.xlsx`;
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'ics':
          exportBuffer = await icsExportHandler.generateICS(exportJob, options);
          fileName = `${this.generateFileName(exportJob)}.ics`;
          mimeType = 'text/calendar';
          break;
        case 'docx':
          // TODO: Implement DOCX export
          throw new Error('DOCX export not yet implemented');
        case 'pptx':
          // TODO: Implement PPTX export
          throw new Error('PPTX export not yet implemented');
        case 'html':
          // TODO: Implement HTML export
          throw new Error('HTML export not yet implemented');
        case 'json':
          // TODO: Implement JSON export
          throw new Error('JSON export not yet implemented');
        default:
          throw new Error(`Unsupported export type: ${exportJob.exportType}`);
      }

      // Update progress
      await exportService.updateExportJobStatus(jobId, 'processing', 80);

      // Store file and generate URLs
      const { downloadUrl, shareUrl, sharePasscode } = await this.storeExportFile(
        exportJob,
        exportBuffer,
        fileName,
        mimeType,
        options
      );

      // Update job with final results
      await exportService.updateExportJobStatus(
        jobId,
        'completed',
        100,
        undefined,
        downloadUrl,
        shareUrl,
        sharePasscode,
        exportBuffer.length
      );

      logger.info(`Export job ${jobId} completed successfully`);
    } catch (error) {
      logger.error(`Error processing export job ${jobId}:`, error);
      await exportService.updateExportJobStatus(jobId, 'failed', undefined, error.message);
    }
  }

  /**
   * Generate file name based on export job
   */
  private generateFileName(exportJob: ExportJob): string {
    const scope = JSON.parse(exportJob.scope);
    const timestamp = new Date().toISOString().split('T')[0];
    
    let baseName: string;
    switch (scope.type) {
      case 'project':
        baseName = `project-${scope.id}`;
        break;
      case 'event':
        baseName = `event-${scope.id}`;
        break;
      case 'script':
        baseName = `script-${scope.id}`;
        break;
      case 'timeframe':
        baseName = `export-${scope.range}`;
        break;
      default:
        baseName = `export-${exportJob.id}`;
    }

    return `${baseName}-${timestamp}`;
  }

  /**
   * Store export file and generate URLs
   */
  private async storeExportFile(
    exportJob: ExportJob,
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    options: ExportOptions
  ): Promise<{ downloadUrl: string; shareUrl?: string; sharePasscode?: string }> {
    try {
      // In a real implementation, this would upload to cloud storage (S3, etc.)
      // For now, we'll generate mock URLs
      const baseUrl = process.env.EXPORT_BASE_URL || 'https://exports.syncscript.com';
      const downloadUrl = `${baseUrl}/download/${exportJob.id}`;
      
      let shareUrl: string | undefined;
      let sharePasscode: string | undefined;

      // Generate share URL if requested
      if (options.deliveryOptions.shareLink) {
        shareUrl = `${baseUrl}/share/${exportJob.id}`;
        
        // Generate passcode if required
        if (options.redactionSettings.passcodeProtect) {
          sharePasscode = this.generatePasscode();
        }
      }

      // In a real implementation, you would:
      // 1. Upload the buffer to cloud storage
      // 2. Generate signed URLs for download
      // 3. Store metadata in database
      // 4. Set up expiration if needed

      logger.info(`Export file stored: ${fileName} (${buffer.length} bytes)`);

      return {
        downloadUrl,
        shareUrl,
        sharePasscode
      };
    } catch (error) {
      logger.error('Error storing export file:', error);
      throw error;
    }
  }

  /**
   * Generate a random passcode
   */
  private generatePasscode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Process all queued export jobs
   */
  async processQueuedJobs(): Promise<void> {
    try {
      const queuedJobs = await this.prisma.exportJob.findMany({
        where: {
          status: 'queued'
        },
        orderBy: {
          createdAt: 'asc'
        },
        take: 10 // Process up to 10 jobs at a time
      });

      logger.info(`Found ${queuedJobs.length} queued export jobs`);

      // Process jobs in parallel (with concurrency limit)
      const concurrencyLimit = 3;
      const chunks = [];
      for (let i = 0; i < queuedJobs.length; i += concurrencyLimit) {
        chunks.push(queuedJobs.slice(i, i + concurrencyLimit));
      }

      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(job => this.processExportJob(job.id))
        );
      }

      logger.info(`Processed ${queuedJobs.length} export jobs`);
    } catch (error) {
      logger.error('Error processing queued export jobs:', error);
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
        // Delete the actual file from storage
        // In a real implementation, this would delete from cloud storage
        
        // Delete the job record
        await this.prisma.exportJob.delete({
          where: { id: job.id }
        });
      }

      logger.info(`Cleaned up ${expiredJobs.length} expired export jobs`);
    } catch (error) {
      logger.error('Error cleaning up expired export jobs:', error);
    }
  }

  /**
   * Get export job statistics
   */
  async getExportStats(userId?: string): Promise<any> {
    try {
      const whereClause = userId ? { userId } : {};

      const stats = await this.prisma.exportJob.groupBy({
        by: ['exportType', 'status'],
        where: whereClause,
        _count: {
          id: true
        }
      });

      const totalExports = await this.prisma.exportJob.count({
        where: whereClause
      });

      const recentExports = await this.prisma.exportJob.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc'
        },
        take: 10,
        select: {
          id: true,
          exportType: true,
          status: true,
          createdAt: true,
          completedAt: true
        }
      });

      return {
        totalExports,
        exportsByType: stats.reduce((acc, stat) => {
          if (!acc[stat.exportType]) {
            acc[stat.exportType] = 0;
          }
          acc[stat.exportType] += stat._count.id;
          return acc;
        }, {} as Record<string, number>),
        exportsByStatus: stats.reduce((acc, stat) => {
          if (!acc[stat.status]) {
            acc[stat.status] = 0;
          }
          acc[stat.status] += stat._count.id;
          return acc;
        }, {} as Record<string, number>),
        recentExports
      };
    } catch (error) {
      logger.error('Error getting export stats:', error);
      throw error;
    }
  }
}

export const exportProcessor = new ExportProcessor();
