import puppeteer from 'puppeteer';

export interface PDFExportData {
  title: string;
  description?: string;
  sections: {
    name: string;
    content: any[];
  }[];
  metadata: {
    generatedAt: string;
    generatedBy: string;
    version: string;
  };
  styling: {
    theme: 'light' | 'dark';
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
    fonts: {
      heading: string;
      body: string;
    };
  };
}

export class PDFExportHandler {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Generate PDF export
   */
  async generatePDF(exportJob: ExportJob, options: ExportOptions): Promise<Buffer> {
    try {
      logger.info(`Generating PDF export for job ${exportJob.id}`);

      // Fetch data based on scope
      const data = await this.fetchExportData(exportJob, options);

      // Apply redactions based on audience preset
      const redactedData = this.applyRedactions(data, options);

      // Generate PDF content
      const pdfContent = await this.generatePDFContent(redactedData, options);

      // Convert to PDF buffer
      const pdfBuffer = await this.convertToPDF(pdfContent, options);

      logger.info(`PDF export generated successfully for job ${exportJob.id}`);
      return pdfBuffer;
    } catch (error) {
      logger.error(`Error generating PDF export for job ${exportJob.id}:`, error);
      throw error;
    }
  }

  /**
   * Fetch data based on export scope
   */
  private async fetchExportData(exportJob: ExportJob, options: ExportOptions): Promise<PDFExportData> {
    const scope = JSON.parse(exportJob.scope);
    const userId = exportJob.userId;

    let data: PDFExportData = {
      title: 'Export',
      sections: [],
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: userId,
        version: '1.0'
      },
      styling: {
        theme: 'light',
        colors: {
          primary: '#3B82F6',
          secondary: '#6B7280',
          accent: '#10B981'
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter'
        }
      }
    };

    switch (scope.type) {
      case 'project':
        data = await this.fetchProjectData(scope.id, userId);
        break;
      case 'event':
        data = await this.fetchEventData(scope.id, userId);
        break;
      case 'script':
        data = await this.fetchScriptData(scope.id, userId);
        break;
      case 'timeframe':
        data = await this.fetchTimeframeData(scope.range, userId);
        break;
      default:
        throw new Error(`Unsupported scope type: ${scope.type}`);
    }

    return data;
  }

  /**
   * Fetch project data
   */
  private async fetchProjectData(projectId: string, userId: string): Promise<PDFExportData> {
    // Fetch project details
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Fetch related tasks
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

    // Fetch related events
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
      title: project.title,
      description: project.description,
      sections: [
        {
          name: 'Overview',
          content: [
            { type: 'text', content: `Project: ${project.title}` },
            { type: 'text', content: `Description: ${project.description || 'No description'}` },
            { type: 'text', content: `Status: ${project.status}` },
            { type: 'text', content: `Created: ${project.createdAt.toLocaleDateString()}` }
          ]
        },
        {
          name: 'Tasks',
          content: tasks.map(task => ({
            type: 'task',
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
            budget: task.taskBudget ? {
              estimated: task.taskBudget.estimatedCents / 100,
              actual: task.taskBudget.actualCents ? task.taskBudget.actualCents / 100 : null,
              lineItems: task.taskBudget.lineItems.map(item => ({
                name: item.name,
                qty: item.qty,
                unitPrice: item.unitPriceCents / 100,
                total: item.qty * item.unitPriceCents / 100
              }))
            } : null
          }))
        },
        {
          name: 'Events',
          content: events.map(event => ({
            type: 'event',
            title: event.title,
            description: event.description,
            startTime: event.startTime,
            endTime: event.endTime,
            location: event.location,
            budget: event.budgetEnvelope ? {
              cap: event.budgetEnvelope.capCents ? event.budgetEnvelope.capCents / 100 : null,
              items: event.budgetEnvelope.eventItems.map(item => ({
                name: item.name,
                estimated: item.estimatedCents / 100,
                actual: item.actualCents ? item.actualCents / 100 : null
              }))
            } : null
          }))
        }
      ],
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: userId,
        version: '1.0'
      },
      styling: {
        theme: 'light',
        colors: {
          primary: '#3B82F6',
          secondary: '#6B7280',
          accent: '#10B981'
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter'
        }
      }
    };
  }

  /**
   * Fetch event data
   */
  private async fetchEventData(eventId: string, userId: string): Promise<PDFExportData> {
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
      title: event.title,
      description: event.description,
      sections: [
        {
          name: 'Event Details',
          content: [
            { type: 'text', content: `Event: ${event.title}` },
            { type: 'text', content: `Description: ${event.description || 'No description'}` },
            { type: 'text', content: `Start: ${new Date(event.startTime).toLocaleString()}` },
            { type: 'text', content: `End: ${new Date(event.endTime).toLocaleString()}` },
            { type: 'text', content: `Location: ${event.location || 'No location'}` }
          ]
        },
        {
          name: 'Preparation Tasks',
          content: tasks.map(task => ({
            type: 'task',
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            budget: task.taskBudget ? {
              estimated: task.taskBudget.estimatedCents / 100,
              actual: task.taskBudget.actualCents ? task.taskBudget.actualCents / 100 : null
            } : null
          }))
        },
        {
          name: 'Budget',
          content: event.budgetEnvelope ? [
            { type: 'text', content: `Budget Cap: $${event.budgetEnvelope.capCents ? event.budgetEnvelope.capCents / 100 : 'No cap'}` },
            ...event.budgetEnvelope.eventItems.map(item => ({
              type: 'budget-item',
              name: item.name,
              estimated: item.estimatedCents / 100,
              actual: item.actualCents ? item.actualCents / 100 : null
            }))
          ] : [{ type: 'text', content: 'No budget information available' }]
        }
      ],
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: userId,
        version: '1.0'
      },
      styling: {
        theme: 'light',
        colors: {
          primary: '#3B82F6',
          secondary: '#6B7280',
          accent: '#10B981'
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter'
        }
      }
    };
  }

  /**
   * Fetch script data
   */
  private async fetchScriptData(scriptId: string, userId: string): Promise<PDFExportData> {
    const script = await this.prisma.userScript.findFirst({
      where: { id: scriptId, userId }
    });

    if (!script) {
      throw new Error('Script not found');
    }

    return {
      title: script.title,
      description: script.description,
      sections: [
        {
          name: 'Script Overview',
          content: [
            { type: 'text', content: `Script: ${script.title}` },
            { type: 'text', content: `Description: ${script.description || 'No description'}` },
            { type: 'text', content: `Category: ${script.category || 'Uncategorized'}` },
            { type: 'text', content: `Created: ${script.createdAt.toLocaleDateString()}` }
          ]
        },
        {
          name: 'Script Content',
          content: [
            { type: 'text', content: script.content || 'No content available' }
          ]
        }
      ],
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: userId,
        version: '1.0'
      },
      styling: {
        theme: 'light',
        colors: {
          primary: '#3B82F6',
          secondary: '#6B7280',
          accent: '#10B981'
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter'
        }
      }
    };
  }

  /**
   * Fetch timeframe data
   */
  private async fetchTimeframeData(range: string, userId: string): Promise<PDFExportData> {
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
      title: `Export for ${range}`,
      description: `Data export for the period ${range}`,
      sections: [
        {
          name: 'Tasks',
          content: tasks.map(task => ({
            type: 'task',
            title: task.title,
            status: task.status,
            priority: task.priority,
            budget: task.taskBudget ? {
              estimated: task.taskBudget.estimatedCents / 100,
              actual: task.taskBudget.actualCents ? task.taskBudget.actualCents / 100 : null
            } : null
          }))
        },
        {
          name: 'Events',
          content: events.map(event => ({
            type: 'event',
            title: event.title,
            startTime: event.startTime,
            endTime: event.endTime,
            location: event.location
          }))
        }
      ],
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: userId,
        version: '1.0'
      },
      styling: {
        theme: 'light',
        colors: {
          primary: '#3B82F6',
          secondary: '#6B7280',
          accent: '#10B981'
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter'
        }
      }
    };
  }

  /**
   * Apply redactions based on audience preset
   */
  private applyRedactions(data: PDFExportData, options: ExportOptions): PDFExportData {
    const redactedData = { ...data };

    // Apply redactions based on audience preset
    switch (options.audiencePreset) {
      case 'vendor':
        // Hide internal notes and PII
        redactedData.sections = redactedData.sections.map(section => ({
          ...section,
          content: section.content.map(item => {
            if (item.type === 'task' && options.redactionSettings.hideInternalNotes) {
              return { ...item, description: '[Internal notes hidden]' };
            }
            return item;
          })
        }));
        break;
      case 'attendee':
        // Hide budget information and internal details
        redactedData.sections = redactedData.sections.map(section => ({
          ...section,
          content: section.content.map(item => {
            if (item.type === 'task' || item.type === 'event') {
              return { ...item, budget: null };
            }
            return item;
          })
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
        if (options.redactionSettings.hideBudgetNumbers) {
          // Hide budget numbers logic here
        }
        break;
    }

    return redactedData;
  }

  /**
   * Generate PDF content
   */
  private async generatePDFContent(data: PDFExportData, options: ExportOptions): Promise<string> {
    const template = this.getPDFTemplate(data, options);
    return template;
  }

  /**
   * Get PDF template based on audience preset
   */
  private getPDFTemplate(data: PDFExportData, options: ExportOptions): string {
    switch (options.audiencePreset) {
      case 'owner':
        return this.getOwnerTemplate(data, options);
      case 'team':
        return this.getTeamTemplate(data, options);
      case 'vendor':
        return this.getVendorTemplate(data, options);
      case 'attendee':
        return this.getAttendeeTemplate(data, options);
      case 'personal':
        return this.getPersonalTemplate(data, options);
      default:
        return this.getDefaultTemplate(data, options);
    }
  }

  /**
   * Owner template - full access
   */
  private getOwnerTemplate(data: PDFExportData, options: ExportOptions): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${data.title} - Owner Export</title>
          <style>
            ${this.getBaseStyles()}
            ${this.getOwnerStyles()}
          </style>
        </head>
        <body>
          ${this.getHeader(data, options)}
          ${this.getOverviewSection(data)}
          ${this.getTasksSection(data)}
          ${this.getEventsSection(data)}
          ${this.getBudgetSection(data)}
          ${this.getTimelineSection(data)}
          ${this.getResourcesSection(data)}
          ${this.getFooter(data, options)}
        </body>
      </html>
    `;
  }

  /**
   * Team template - hide sensitive budget info
   */
  private getTeamTemplate(data: PDFExportData, options: ExportOptions): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${data.title} - Team Export</title>
          <style>
            ${this.getBaseStyles()}
            ${this.getTeamStyles()}
          </style>
        </head>
        <body>
          ${this.getHeader(data, options)}
          ${this.getOverviewSection(data)}
          ${this.getTasksSection(data, true)}
          ${this.getEventsSection(data)}
          ${this.getTimelineSection(data)}
          ${this.getResourcesSection(data)}
          ${this.getFooter(data, options)}
        </body>
      </html>
    `;
  }

  /**
   * Vendor template - hide internal notes and PII
   */
  private getVendorTemplate(data: PDFExportData, options: ExportOptions): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${data.title} - Vendor Export</title>
          <style>
            ${this.getBaseStyles()}
            ${this.getVendorStyles()}
          </style>
        </head>
        <body>
          ${this.getHeader(data, options)}
          ${this.getOverviewSection(data)}
          ${this.getTasksSection(data, true, true)}
          ${this.getEventsSection(data)}
          ${this.getTimelineSection(data)}
          ${this.getFooter(data, options)}
        </body>
      </html>
    `;
  }

  /**
   * Attendee template - public information only
   */
  private getAttendeeTemplate(data: PDFExportData, options: ExportOptions): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${data.title} - Attendee Export</title>
          <style>
            ${this.getBaseStyles()}
            ${this.getAttendeeStyles()}
          </style>
        </head>
        <body>
          ${this.getHeader(data, options)}
          ${this.getOverviewSection(data)}
          ${this.getEventsSection(data)}
          ${this.getTimelineSection(data)}
          ${this.getFooter(data, options)}
        </body>
      </html>
    `;
  }

  /**
   * Personal template - your personal copy
   */
  private getPersonalTemplate(data: PDFExportData, options: ExportOptions): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${data.title} - Personal Export</title>
          <style>
            ${this.getBaseStyles()}
            ${this.getPersonalStyles()}
          </style>
        </head>
        <body>
          ${this.getHeader(data, options)}
          ${this.getOverviewSection(data)}
          ${this.getTasksSection(data)}
          ${this.getEventsSection(data)}
          ${this.getBudgetSection(data)}
          ${this.getTimelineSection(data)}
          ${this.getResourcesSection(data)}
          ${this.getNotesSection(data)}
          ${this.getChecklistSection(data)}
          ${this.getFooter(data, options)}
        </body>
      </html>
    `;
  }

  /**
   * Default template
   */
  private getDefaultTemplate(data: PDFExportData, options: ExportOptions): string {
    return this.getOwnerTemplate(data, options);
  }

  /**
   * Base styles for all templates
   */
  private getBaseStyles(): string {
    return `
      body { 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
        margin: 0; 
        padding: 20px; 
        line-height: 1.6;
        color: #333;
      }
      h1 { 
        color: #1f2937; 
        font-size: 28px; 
        margin-bottom: 10px;
        border-bottom: 3px solid #3b82f6;
        padding-bottom: 10px;
      }
      h2 { 
        color: #374151; 
        font-size: 20px; 
        margin-top: 30px; 
        margin-bottom: 15px;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 5px;
      }
      h3 { 
        color: #4b5563; 
        font-size: 16px; 
        margin-top: 20px; 
        margin-bottom: 10px;
      }
      .section { 
        margin-bottom: 30px; 
        page-break-inside: avoid;
      }
      .task, .event { 
        margin-bottom: 15px; 
        padding: 15px; 
        border-left: 4px solid #3b82f6; 
        background-color: #f8fafc;
        border-radius: 0 8px 8px 0;
      }
      .budget { 
        background-color: #f0f9ff; 
        padding: 12px; 
        margin-top: 10px; 
        border-radius: 6px;
        border: 1px solid #e0f2fe;
      }
      .metadata { 
        background-color: #f9fafb; 
        padding: 15px; 
        border-radius: 8px; 
        margin-top: 30px;
        border: 1px solid #e5e7eb;
      }
      .status-badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
      }
      .status-completed { background-color: #dcfce7; color: #166534; }
      .status-pending { background-color: #fef3c7; color: #92400e; }
      .status-failed { background-color: #fee2e2; color: #991b1b; }
      .priority-high { color: #dc2626; font-weight: 600; }
      .priority-medium { color: #d97706; font-weight: 500; }
      .priority-low { color: #059669; font-weight: 500; }
      .timeline-item {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
        padding: 10px;
        background-color: #f8fafc;
        border-radius: 6px;
      }
      .timeline-time {
        font-weight: 600;
        color: #3b82f6;
        margin-right: 15px;
        min-width: 120px;
      }
      .timeline-content {
        flex: 1;
      }
      @media print {
        body { margin: 0; }
        .section { page-break-inside: avoid; }
      }
    `;
  }

  /**
   * Owner-specific styles
   */
  private getOwnerStyles(): string {
    return `
      .budget-details {
        background-color: #f0f9ff;
        border: 1px solid #e0f2fe;
        padding: 15px;
        border-radius: 8px;
        margin-top: 10px;
      }
      .budget-line-item {
        display: flex;
        justify-content: space-between;
        padding: 5px 0;
        border-bottom: 1px solid #e0f2fe;
      }
      .budget-line-item:last-child {
        border-bottom: none;
        font-weight: 600;
        border-top: 2px solid #3b82f6;
        margin-top: 10px;
        padding-top: 10px;
      }
    `;
  }

  /**
   * Team-specific styles
   */
  private getTeamStyles(): string {
    return `
      .budget-info {
        color: #6b7280;
        font-style: italic;
      }
    `;
  }

  /**
   * Vendor-specific styles
   */
  private getVendorStyles(): string {
    return `
      .internal-note {
        color: #6b7280;
        font-style: italic;
        background-color: #f9fafb;
        padding: 8px;
        border-radius: 4px;
        margin-top: 8px;
      }
    `;
  }

  /**
   * Attendee-specific styles
   */
  private getAttendeeStyles(): string {
    return `
      .public-info {
        background-color: #f0f9ff;
        padding: 15px;
        border-radius: 8px;
        border: 1px solid #e0f2fe;
      }
    `;
  }

  /**
   * Personal-specific styles
   */
  private getPersonalStyles(): string {
    return `
      .personal-note {
        background-color: #fef3c7;
        padding: 10px;
        border-radius: 6px;
        border-left: 4px solid #f59e0b;
        margin-top: 10px;
      }
      .checklist-item {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        padding: 8px;
        background-color: #f8fafc;
        border-radius: 4px;
      }
      .checklist-checkbox {
        margin-right: 10px;
        color: #3b82f6;
      }
    `;
  }

  /**
   * Generate header section
   */
  private getHeader(data: PDFExportData, options: ExportOptions): string {
    return `
      <div class="header">
        <h1>${data.title}</h1>
        ${data.description ? `<p class="description">${data.description}</p>` : ''}
        <div class="export-info">
          <p><strong>Export Type:</strong> ${options.exportType.toUpperCase()}</p>
          <p><strong>Audience:</strong> ${options.audiencePreset}</p>
          <p><strong>Generated:</strong> ${new Date(data.metadata.generatedAt).toLocaleString()}</p>
        </div>
      </div>
    `;
  }

  /**
   * Generate overview section
   */
  private getOverviewSection(data: PDFExportData): string {
    return `
      <div class="section">
        <h2>Overview</h2>
        <div class="overview-content">
          <p><strong>Title:</strong> ${data.title}</p>
          ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
          <p><strong>Generated:</strong> ${new Date(data.metadata.generatedAt).toLocaleString()}</p>
          <p><strong>Version:</strong> ${data.metadata.version}</p>
        </div>
      </div>
    `;
  }

  /**
   * Generate tasks section
   */
  private getTasksSection(data: PDFExportData, hideBudget: boolean = false, hideInternal: boolean = false): string {
    const tasks = data.sections.find(s => s.name === 'Tasks')?.content || [];
    if (tasks.length === 0) return '';

    return `
      <div class="section">
        <h2>Tasks</h2>
        ${tasks.map((task: any) => `
          <div class="task">
            <h3>${task.title}</h3>
            ${task.description && !hideInternal ? `<p>${task.description}</p>` : ''}
            ${hideInternal ? `<p class="internal-note">[Internal notes hidden]</p>` : ''}
            <p>
              <span class="status-badge status-${task.status?.toLowerCase()}">${task.status}</span>
              <span class="priority-${task.priority?.toLowerCase()}">Priority: ${task.priority}</span>
            </p>
            ${task.dueDate ? `<p><strong>Due:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>` : ''}
            ${task.budget && !hideBudget ? `
              <div class="budget">
                <p><strong>Budget:</strong> $${task.budget.estimated}${task.budget.actual ? ` (Actual: $${task.budget.actual})` : ''}</p>
                ${task.budget.lineItems ? `
                  <div class="budget-details">
                    <h4>Line Items:</h4>
                    ${task.budget.lineItems.map((item: any) => `
                      <div class="budget-line-item">
                        <span>${item.name} (${item.qty}x)</span>
                        <span>$${item.total}</span>
                      </div>
                    `).join('')}
                    <div class="budget-line-item">
                      <span><strong>Total</strong></span>
                      <span><strong>$${task.budget.estimated}</strong></span>
                    </div>
                  </div>
                ` : ''}
              </div>
            ` : ''}
            ${hideBudget && task.budget ? `<p class="budget-info">[Budget information hidden]</p>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Generate events section
   */
  private getEventsSection(data: PDFExportData): string {
    const events = data.sections.find(s => s.name === 'Events')?.content || [];
    if (events.length === 0) return '';

    return `
      <div class="section">
        <h2>Events</h2>
        ${events.map((event: any) => `
          <div class="event">
            <h3>${event.title}</h3>
            ${event.description ? `<p>${event.description}</p>` : ''}
            <p><strong>Time:</strong> ${new Date(event.startTime).toLocaleString()} - ${new Date(event.endTime).toLocaleString()}</p>
            ${event.location ? `<p><strong>Location:</strong> ${event.location}</p>` : ''}
            ${event.budget ? `
              <div class="budget">
                <p><strong>Budget Cap:</strong> $${event.budget.cap || 'No cap'}</p>
                ${event.budget.items ? `
                  <div class="budget-details">
                    <h4>Budget Items:</h4>
                    ${event.budget.items.map((item: any) => `
                      <div class="budget-line-item">
                        <span>${item.name}</span>
                        <span>$${item.estimated}${item.actual ? ` (Actual: $${item.actual})` : ''}</span>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Generate budget section
   */
  private getBudgetSection(data: PDFExportData): string {
    const budget = data.sections.find(s => s.name === 'Budget')?.content || [];
    if (budget.length === 0) return '';

    return `
      <div class="section">
        <h2>Budget Summary</h2>
        ${budget.map((item: any) => `
          <div class="budget">
            <h3>${item.name}</h3>
            <p><strong>Estimated:</strong> $${item.estimated}</p>
            ${item.actual ? `<p><strong>Actual:</strong> $${item.actual}</p>` : ''}
            ${item.notes ? `<p><strong>Notes:</strong> ${item.notes}</p>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Generate timeline section
   */
  private getTimelineSection(data: PDFExportData): string {
    // This would generate a timeline based on events and tasks
    return `
      <div class="section">
        <h2>Timeline</h2>
        <div class="timeline">
          <div class="timeline-item">
            <div class="timeline-time">9:00 AM</div>
            <div class="timeline-content">Event starts</div>
          </div>
          <div class="timeline-item">
            <div class="timeline-time">12:00 PM</div>
            <div class="timeline-content">Lunch break</div>
          </div>
          <div class="timeline-item">
            <div class="timeline-time">5:00 PM</div>
            <div class="timeline-content">Event ends</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate resources section
   */
  private getResourcesSection(data: PDFExportData): string {
    return `
      <div class="section">
        <h2>Resources</h2>
        <p>Resource information would be displayed here.</p>
      </div>
    `;
  }

  /**
   * Generate notes section
   */
  private getNotesSection(data: PDFExportData): string {
    return `
      <div class="section">
        <h2>Notes</h2>
        <div class="personal-note">
          <p>Personal notes and reminders would be displayed here.</p>
        </div>
      </div>
    `;
  }

  /**
   * Generate checklist section
   */
  private getChecklistSection(data: PDFExportData): string {
    return `
      <div class="section">
        <h2>Checklist</h2>
        <div class="checklist-item">
          <span class="checklist-checkbox">☐</span>
          <span>Task 1</span>
        </div>
        <div class="checklist-item">
          <span class="checklist-checkbox">☐</span>
          <span>Task 2</span>
        </div>
        <div class="checklist-item">
          <span class="checklist-checkbox">☑</span>
          <span>Task 3 (completed)</span>
        </div>
      </div>
    `;
  }

  /**
   * Generate footer section
   */
  private getFooter(data: PDFExportData, options: ExportOptions): string {
    return `
      <div class="metadata">
        <h2>Export Information</h2>
        <p><strong>Generated:</strong> ${new Date(data.metadata.generatedAt).toLocaleString()}</p>
        <p><strong>Generated by:</strong> ${data.metadata.generatedBy}</p>
        <p><strong>Version:</strong> ${data.metadata.version}</p>
        <p><strong>Export Type:</strong> ${options.exportType.toUpperCase()}</p>
        <p><strong>Audience:</strong> ${options.audiencePreset}</p>
        <p><strong>Generated by SyncScript</strong></p>
      </div>
    `;
  }

  /**
   * Convert HTML to PDF buffer
   */
  private async convertToPDF(htmlContent: string, options: ExportOptions): Promise<Buffer> {
    let browser;
    try {
      // Launch Puppeteer browser
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      
      // Set content and wait for it to load
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Generate PDF with options
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        displayHeaderFooter: true,
        headerTemplate: this.getHeaderTemplate(options),
        footerTemplate: this.getFooterTemplate(options)
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      logger.error('Error converting HTML to PDF:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Get header template for PDF
   */
  private getHeaderTemplate(options: ExportOptions): string {
    return `
      <div style="font-size: 10px; text-align: center; width: 100%; color: #666;">
        <span>${options.audiencePreset.toUpperCase()} EXPORT</span>
      </div>
    `;
  }

  /**
   * Get footer template for PDF
   */
  private getFooterTemplate(options: ExportOptions): string {
    return `
      <div style="font-size: 10px; text-align: center; width: 100%; color: #666;">
        <span>Generated by SyncScript • ${new Date().toLocaleDateString()}</span>
        <span style="margin-left: 20px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `;
  }
}

export const pdfExportHandler = new PDFExportHandler();
