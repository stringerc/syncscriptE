import { ExportOptions, ExportJob } from '../services/exportService';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

export interface CSVExportData {
  headers: string[];
  rows: any[][];
  metadata: {
    title: string;
    generatedAt: string;
    generatedBy: string;
    recordCount: number;
  };
}

export class CSVExportHandler {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Generate CSV export
   */
  async generateCSV(exportJob: ExportJob, options: ExportOptions): Promise<Buffer> {
    try {
      logger.info(`Generating CSV export for job ${exportJob.id}`);

      // Fetch data based on scope
      const data = await this.fetchExportData(exportJob, options);

      // Apply redactions
      const redactedData = this.applyRedactions(data, options);

      // Convert to CSV
      const csvContent = this.convertToCSV(redactedData);

      logger.info(`CSV export generated successfully for job ${exportJob.id}`);
      return Buffer.from(csvContent, 'utf-8');
    } catch (error) {
      logger.error(`Error generating CSV export for job ${exportJob.id}:`, error);
      throw error;
    }
  }

  /**
   * Generate XLSX export
   */
  async generateXLSX(exportJob: ExportJob, options: ExportOptions): Promise<Buffer> {
    try {
      logger.info(`Generating XLSX export for job ${exportJob.id}`);

      // Fetch data based on scope
      const data = await this.fetchExportData(exportJob, options);

      // Apply redactions
      const redactedData = this.applyRedactions(data, options);

      // Convert to XLSX
      const xlsxBuffer = await this.convertToXLSX(redactedData);

      logger.info(`XLSX export generated successfully for job ${exportJob.id}`);
      return xlsxBuffer;
    } catch (error) {
      logger.error(`Error generating XLSX export for job ${exportJob.id}:`, error);
      throw error;
    }
  }

  /**
   * Fetch data based on export scope
   */
  private async fetchExportData(exportJob: ExportJob, options: ExportOptions): Promise<CSVExportData> {
    const scope = JSON.parse(exportJob.scope);
    const userId = exportJob.userId;

    switch (scope.type) {
      case 'project':
        return await this.fetchProjectData(scope.id, userId);
      case 'event':
        return await this.fetchEventData(scope.id, userId);
      case 'script':
        return await this.fetchScriptData(scope.id, userId);
      case 'timeframe':
        return await this.fetchTimeframeData(scope.range, userId);
      default:
        throw new Error(`Unsupported scope type: ${scope.type}`);
    }
  }

  /**
   * Fetch project data
   */
  private async fetchProjectData(projectId: string, userId: string): Promise<CSVExportData> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const tasks = await this.prisma.task.findMany({
      where: { projectId, userId },
      include: {
        taskBudget: {
          include: {
            lineItems: true
          }
        }
      }
    });

    const events = await this.prisma.event.findMany({
      where: { projectId, userId },
      include: {
        budgetEnvelope: {
          include: {
            eventItems: true
          }
        }
      }
    });

    return {
      headers: [
        'Type',
        'Title',
        'Description',
        'Status',
        'Priority',
        'Start Date',
        'End Date',
        'Location',
        'Budget Estimated',
        'Budget Actual',
        'Created At',
        'Updated At'
      ],
      rows: [
        // Project row
        [
          'Project',
          project.title,
          project.description || '',
          project.status,
          '',
          '',
          '',
          '',
          '',
          '',
          project.createdAt.toISOString(),
          project.updatedAt.toISOString()
        ],
        // Task rows
        ...tasks.map(task => [
          'Task',
          task.title,
          task.description || '',
          task.status,
          task.priority,
          task.dueDate ? task.dueDate.toISOString() : '',
          '',
          '',
          task.taskBudget ? (task.taskBudget.estimatedCents / 100).toFixed(2) : '',
          task.taskBudget && task.taskBudget.actualCents ? (task.taskBudget.actualCents / 100).toFixed(2) : '',
          task.createdAt.toISOString(),
          task.updatedAt.toISOString()
        ]),
        // Event rows
        ...events.map(event => [
          'Event',
          event.title,
          event.description || '',
          '',
          '',
          event.startTime.toISOString(),
          event.endTime.toISOString(),
          event.location || '',
          event.budgetEnvelope ? (event.budgetEnvelope.capCents ? (event.budgetEnvelope.capCents / 100).toFixed(2) : '') : '',
          '',
          event.createdAt.toISOString(),
          event.updatedAt.toISOString()
        ])
      ],
      metadata: {
        title: project.title,
        generatedAt: new Date().toISOString(),
        generatedBy: userId,
        recordCount: 1 + tasks.length + events.length
      }
    };
  }

  /**
   * Fetch event data
   */
  private async fetchEventData(eventId: string, userId: string): Promise<CSVExportData> {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, userId },
      include: {
        budgetEnvelope: {
          include: {
            eventItems: true
          }
        }
      }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const tasks = await this.prisma.task.findMany({
      where: { eventId, userId },
      include: {
        taskBudget: {
          include: {
            lineItems: true
          }
        }
      }
    });

    return {
      headers: [
        'Type',
        'Title',
        'Description',
        'Status',
        'Priority',
        'Due Date',
        'Budget Estimated',
        'Budget Actual',
        'Created At',
        'Updated At'
      ],
      rows: [
        // Event row
        [
          'Event',
          event.title,
          event.description || '',
          '',
          '',
          '',
          event.budgetEnvelope ? (event.budgetEnvelope.capCents ? (event.budgetEnvelope.capCents / 100).toFixed(2) : '') : '',
          '',
          event.createdAt.toISOString(),
          event.updatedAt.toISOString()
        ],
        // Task rows
        ...tasks.map(task => [
          'Task',
          task.title,
          task.description || '',
          task.status,
          task.priority,
          task.dueDate ? task.dueDate.toISOString() : '',
          task.taskBudget ? (task.taskBudget.estimatedCents / 100).toFixed(2) : '',
          task.taskBudget && task.taskBudget.actualCents ? (task.taskBudget.actualCents / 100).toFixed(2) : '',
          task.createdAt.toISOString(),
          task.updatedAt.toISOString()
        ])
      ],
      metadata: {
        title: event.title,
        generatedAt: new Date().toISOString(),
        generatedBy: userId,
        recordCount: 1 + tasks.length
      }
    };
  }

  /**
   * Fetch script data
   */
  private async fetchScriptData(scriptId: string, userId: string): Promise<CSVExportData> {
    const script = await this.prisma.userScript.findFirst({
      where: { id: scriptId, userId }
    });

    if (!script) {
      throw new Error('Script not found');
    }

    return {
      headers: [
        'Title',
        'Description',
        'Category',
        'Content',
        'Created At',
        'Updated At'
      ],
      rows: [
        [
          script.title,
          script.description || '',
          script.category || '',
          script.content || '',
          script.createdAt.toISOString(),
          script.updatedAt.toISOString()
        ]
      ],
      metadata: {
        title: script.title,
        generatedAt: new Date().toISOString(),
        generatedBy: userId,
        recordCount: 1
      }
    };
  }

  /**
   * Fetch timeframe data
   */
  private async fetchTimeframeData(range: string, userId: string): Promise<CSVExportData> {
    const [startDate, endDate] = range.split(' to ').map(date => new Date(date));

    const tasks = await this.prisma.task.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        taskBudget: true
      }
    });

    const events = await this.prisma.event.findMany({
      where: {
        userId,
        startTime: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        budgetEnvelope: true
      }
    });

    return {
      headers: [
        'Type',
        'Title',
        'Description',
        'Status',
        'Priority',
        'Start Date',
        'End Date',
        'Location',
        'Budget Estimated',
        'Budget Actual',
        'Created At',
        'Updated At'
      ],
      rows: [
        // Task rows
        ...tasks.map(task => [
          'Task',
          task.title,
          task.description || '',
          task.status,
          task.priority,
          task.dueDate ? task.dueDate.toISOString() : '',
          '',
          '',
          task.taskBudget ? (task.taskBudget.estimatedCents / 100).toFixed(2) : '',
          task.taskBudget && task.taskBudget.actualCents ? (task.taskBudget.actualCents / 100).toFixed(2) : '',
          task.createdAt.toISOString(),
          task.updatedAt.toISOString()
        ]),
        // Event rows
        ...events.map(event => [
          'Event',
          event.title,
          event.description || '',
          '',
          '',
          event.startTime.toISOString(),
          event.endTime.toISOString(),
          event.location || '',
          event.budgetEnvelope ? (event.budgetEnvelope.capCents ? (event.budgetEnvelope.capCents / 100).toFixed(2) : '') : '',
          '',
          event.createdAt.toISOString(),
          event.updatedAt.toISOString()
        ])
      ],
      metadata: {
        title: `Export for ${range}`,
        generatedAt: new Date().toISOString(),
        generatedBy: userId,
        recordCount: tasks.length + events.length
      }
    };
  }

  /**
   * Apply redactions based on audience preset
   */
  private applyRedactions(data: CSVExportData, options: ExportOptions): CSVExportData {
    const redactedData = { ...data };

    // Apply redactions based on audience preset
    switch (options.audiencePreset) {
      case 'vendor':
        // Hide internal notes and PII
        redactedData.rows = redactedData.rows.map(row => {
          const newRow = [...row];
          // Hide description column (index 2) for vendor exports
          if (newRow[0] === 'Task' && options.redactionSettings.hideInternalNotes) {
            newRow[2] = '[Internal notes hidden]';
          }
          return newRow;
        });
        break;
      case 'attendee':
        // Hide budget information
        redactedData.rows = redactedData.rows.map(row => {
          const newRow = [...row];
          // Clear budget columns (indices 8 and 9)
          newRow[8] = '';
          newRow[9] = '';
          return newRow;
        });
        break;
      case 'personal':
        // No redactions for personal use
        break;
      default:
        // Apply standard redactions
        if (options.redactionSettings.hidePII) {
          // Hide PII logic here
        }
        if (options.redactionSettings.hideBudgetNumbers) {
          // Hide budget numbers logic here
        }
        break;
    }

    return redactedData;
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: CSVExportData): string {
    const csvRows: string[] = [];

    // Add headers
    csvRows.push(data.headers.map(header => this.escapeCSVField(header)).join(','));

    // Add data rows
    data.rows.forEach(row => {
      csvRows.push(row.map(field => this.escapeCSVField(field)).join(','));
    });

    // Add metadata as comments
    csvRows.push('');
    csvRows.push(`# Generated: ${data.metadata.generatedAt}`);
    csvRows.push(`# Generated by: ${data.metadata.generatedBy}`);
    csvRows.push(`# Record count: ${data.metadata.recordCount}`);

    return csvRows.join('\n');
  }

  /**
   * Convert data to XLSX format
   */
  private async convertToXLSX(data: CSVExportData): Promise<Buffer> {
    // This would use a library like 'xlsx' to create an Excel file
    // For now, we'll return a mock XLSX buffer
    const mockXLSX = Buffer.from('Mock XLSX content - this would be actual Excel data');
    return mockXLSX;
  }

  /**
   * Escape CSV field to handle commas, quotes, and newlines
   */
  private escapeCSVField(field: any): string {
    if (field === null || field === undefined) {
      return '';
    }

    const fieldStr = String(field);
    
    // If field contains comma, quote, or newline, wrap in quotes and escape quotes
    if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
      return `"${fieldStr.replace(/"/g, '""')}"`;
    }
    
    return fieldStr;
  }
}

export const csvExportHandler = new CSVExportHandler();
