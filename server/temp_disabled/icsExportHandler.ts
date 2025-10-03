import { ExportOptions, ExportJob } from '../services/exportService';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

export interface ICSExportData {
  events: {
    uid: string;
    summary: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    status: string;
    created: Date;
    lastModified: Date;
  }[];
  metadata: {
    title: string;
    generatedAt: string;
    generatedBy: string;
    eventCount: number;
  };
}

export class ICSExportHandler {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Generate ICS export
   */
  async generateICS(exportJob: ExportJob, options: ExportOptions): Promise<Buffer> {
    try {
      logger.info(`Generating ICS export for job ${exportJob.id}`);

      // Fetch data based on scope
      const data = await this.fetchExportData(exportJob, options);

      // Apply redactions
      const redactedData = this.applyRedactions(data, options);

      // Convert to ICS format
      const icsContent = this.convertToICS(redactedData);

      logger.info(`ICS export generated successfully for job ${exportJob.id}`);
      return Buffer.from(icsContent, 'utf-8');
    } catch (error) {
      logger.error(`Error generating ICS export for job ${exportJob.id}:`, error);
      throw error;
    }
  }

  /**
   * Fetch data based on export scope
   */
  private async fetchExportData(exportJob: ExportJob, options: ExportOptions): Promise<ICSExportData> {
    const scope = JSON.parse(exportJob.scope);
    const userId = exportJob.userId;

    switch (scope.type) {
      case 'project':
        return await this.fetchProjectData(scope.id, userId);
      case 'event':
        return await this.fetchEventData(scope.id, userId);
      case 'timeframe':
        return await this.fetchTimeframeData(scope.range, userId);
      default:
        throw new Error(`Unsupported scope type for ICS export: ${scope.type}`);
    }
  }

  /**
   * Fetch project data
   */
  private async fetchProjectData(projectId: string, userId: string): Promise<ICSExportData> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const events = await this.prisma.event.findMany({
      where: { projectId, userId }
    });

    return {
      events: events.map(event => ({
        uid: event.id,
        summary: event.title,
        description: event.description || undefined,
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime),
        location: event.location || undefined,
        status: 'CONFIRMED',
        created: event.createdAt,
        lastModified: event.updatedAt
      })),
      metadata: {
        title: project.title,
        generatedAt: new Date().toISOString(),
        generatedBy: userId,
        eventCount: events.length
      }
    };
  }

  /**
   * Fetch event data
   */
  private async fetchEventData(eventId: string, userId: string): Promise<ICSExportData> {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, userId }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    return {
      events: [{
        uid: event.id,
        summary: event.title,
        description: event.description || undefined,
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime),
        location: event.location || undefined,
        status: 'CONFIRMED',
        created: event.createdAt,
        lastModified: event.updatedAt
      }],
      metadata: {
        title: event.title,
        generatedAt: new Date().toISOString(),
        generatedBy: userId,
        eventCount: 1
      }
    };
  }

  /**
   * Fetch timeframe data
   */
  private async fetchTimeframeData(range: string, userId: string): Promise<ICSExportData> {
    const [startDate, endDate] = range.split(' to ').map(date => new Date(date));

    const events = await this.prisma.event.findMany({
      where: {
        userId,
        startTime: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    return {
      events: events.map(event => ({
        uid: event.id,
        summary: event.title,
        description: event.description || undefined,
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime),
        location: event.location || undefined,
        status: 'CONFIRMED',
        created: event.createdAt,
        lastModified: event.updatedAt
      })),
      metadata: {
        title: `Export for ${range}`,
        generatedAt: new Date().toISOString(),
        generatedBy: userId,
        eventCount: events.length
      }
    };
  }

  /**
   * Apply redactions based on audience preset
   */
  private applyRedactions(data: ICSExportData, options: ExportOptions): ICSExportData {
    const redactedData = { ...data };

    // Apply redactions based on audience preset
    switch (options.audiencePreset) {
      case 'vendor':
        // Hide internal notes
        redactedData.events = redactedData.events.map(event => ({
          ...event,
          description: options.redactionSettings.hideInternalNotes ? '[Internal notes hidden]' : event.description
        }));
        break;
      case 'attendee':
        // Hide sensitive information
        redactedData.events = redactedData.events.map(event => ({
          ...event,
          description: '[Event details hidden]'
        }));
        break;
      case 'personal':
        // No redactions for personal use
        break;
      default:
        // Apply standard redactions
        if (options.redactionSettings.hidePII) {
          // Hide PII logic here
        }
        break;
    }

    return redactedData;
  }

  /**
   * Convert data to ICS format
   */
  private convertToICS(data: ICSExportData): string {
    const icsLines: string[] = [];

    // ICS header
    icsLines.push('BEGIN:VCALENDAR');
    icsLines.push('VERSION:2.0');
    icsLines.push('PRODID:-//SyncScript//SyncScript//EN');
    icsLines.push('CALSCALE:GREGORIAN');
    icsLines.push('METHOD:PUBLISH');

    // Add events
    data.events.forEach(event => {
      icsLines.push('BEGIN:VEVENT');
      icsLines.push(`UID:${event.uid}`);
      icsLines.push(`SUMMARY:${this.escapeICSField(event.summary)}`);
      
      if (event.description) {
        icsLines.push(`DESCRIPTION:${this.escapeICSField(event.description)}`);
      }
      
      icsLines.push(`DTSTART:${this.formatICSDateTime(event.startTime)}`);
      icsLines.push(`DTEND:${this.formatICSDateTime(event.endTime)}`);
      
      if (event.location) {
        icsLines.push(`LOCATION:${this.escapeICSField(event.location)}`);
      }
      
      icsLines.push(`STATUS:${event.status}`);
      icsLines.push(`CREATED:${this.formatICSDateTime(event.created)}`);
      icsLines.push(`LAST-MODIFIED:${this.formatICSDateTime(event.lastModified)}`);
      icsLines.push('END:VEVENT');
    });

    // ICS footer
    icsLines.push('END:VCALENDAR');

    return icsLines.join('\r\n');
  }

  /**
   * Format date/time for ICS format
   */
  private formatICSDateTime(date: Date): string {
    // Convert to UTC and format as YYYYMMDDTHHMMSSZ
    const utcDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
    return utcDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  /**
   * Escape ICS field to handle special characters
   */
  private escapeICSField(field: string): string {
    return field
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
  }
}

export const icsExportHandler = new ICSExportHandler();
