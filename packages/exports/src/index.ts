/**
 * Exports Domain - Public API
 * 
 * This package contains the export and sharing domain logic:
 * - Export job management
 * - Document generation
 * - Sharing and permissions
 * - Export templates
 * - Analytics and tracking
 */

import { BaseEntity, UserContext, DomainError } from '@syncscript/shared-kernel'

// Export job domain
export interface ExportJob extends BaseEntity {
  userId: string
  exportType: 'pdf' | 'csv' | 'xlsx' | 'ics' | 'json' | 'markdown' | 'docx' | 'pptx'
  scope: ExportScope
  audiencePreset: 'owner' | 'team' | 'vendor' | 'attendee' | 'personal'
  template?: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: number
  fileUrl?: string
  fileSize?: number
  expiresAt?: Date
  downloadCount: number
  errorMessage?: string
  metadata: ExportMetadata
}

export interface ExportScope {
  type: 'task' | 'tasks' | 'event' | 'events' | 'project' | 'script'
  id: string
  ids?: string[]
  filters?: Record<string, any>
}

export interface ExportMetadata {
  sections?: string[]
  customFields?: Record<string, any>
  branding?: {
    logo?: string
    colors?: Record<string, string>
    companyName?: string
  }
  redaction?: {
    sensitiveFields: string[]
    replaceWith: string
  }
}

export interface CreateExportJobRequest {
  exportType: 'pdf' | 'csv' | 'xlsx' | 'ics' | 'json' | 'markdown' | 'docx' | 'pptx'
  scope: ExportScope
  audiencePreset: 'owner' | 'team' | 'vendor' | 'attendee' | 'personal'
  template?: string
  metadata?: ExportMetadata
  expiresInHours?: number
}

// Export templates
export interface ExportTemplate extends BaseEntity {
  name: string
  description: string
  exportType: string
  templateData: string
  isPublic: boolean
  isSystem: boolean
  usageCount: number
  lastUsedAt?: Date
  userId: string
  category: string
  tags: string[]
}

export interface CreateExportTemplateRequest {
  name: string
  description: string
  exportType: string
  templateData: string
  isPublic?: boolean
  category: string
  tags?: string[]
}

// Document generation
export interface DocumentTemplate {
  id: string
  name: string
  description: string
  icon: string
  availableFor: string[]
  sections: string[]
  defaultAudience: string
}

export interface GeneratedDocument {
  content: string
  format: string
  size: number
  metadata: {
    pageCount?: number
    wordCount?: number
    generatedAt: Date
    template: string
  }
}

// Sharing and permissions
export interface ExportShare extends BaseEntity {
  exportJobId: string
  sharedBy: string
  sharedWith: string[]
  permissions: 'view' | 'download' | 'admin'
  passcode?: string
  expiresAt?: Date
  isPublic: boolean
  accessCount: number
  lastAccessedAt?: Date
}

export interface CreateExportShareRequest {
  exportJobId: string
  userIds?: string[]
  permissions: 'view' | 'download' | 'admin'
  passcode?: string
  expiresInHours?: number
  isPublic?: boolean
}

// Export analytics
export interface ExportAnalytics extends BaseEntity {
  userId?: string
  exportJobId?: string
  eventType: 'export_started' | 'export_completed' | 'export_downloaded' | 'share_viewed' | 'share_downloaded'
  eventData: string
  exportType?: string
  scope?: string
  audiencePreset?: string
  userAgent?: string
  ipAddress?: string
  referrer?: string
}

// Export formats and options
export interface ExportFormat {
  id: string
  name: string
  description: string
  mimeType: string
  fileExtension: string
  maxSize: number
  supportedScopes: string[]
  requiresTemplate: boolean
}

export interface AudiencePreset {
  id: string
  name: string
  description: string
  redactionRules: RedactionRule[]
  includedSections: string[]
  excludedSections: string[]
}

export interface RedactionRule {
  field: string
  action: 'hide' | 'replace' | 'mask'
  replacement?: string
  condition?: string
}

// Domain services (interfaces only - implementations in server)
export interface ExportJobService {
  createJob(userId: string, request: CreateExportJobRequest): Promise<ExportJob>
  getJob(userId: string, jobId: string): Promise<ExportJob>
  getJobs(userId: string, filters?: { status?: string; exportType?: string }): Promise<ExportJob[]>
  updateJobStatus(jobId: string, status: string, progress?: number, errorMessage?: string): Promise<ExportJob>
  deleteJob(userId: string, jobId: string): Promise<void>
  downloadJob(userId: string, jobId: string): Promise<{ url: string; filename: string }>
}

export interface ExportTemplateService {
  createTemplate(userId: string, request: CreateExportTemplateRequest): Promise<ExportTemplate>
  updateTemplate(userId: string, templateId: string, request: Partial<CreateExportTemplateRequest>): Promise<ExportTemplate>
  deleteTemplate(userId: string, templateId: string): Promise<void>
  getTemplates(userId: string, filters?: { exportType?: string; isPublic?: boolean }): Promise<ExportTemplate[]>
  getTemplate(userId: string, templateId: string): Promise<ExportTemplate>
  useTemplate(userId: string, templateId: string): Promise<ExportTemplate>
}

export interface DocumentGenerationService {
  generateDocument(job: ExportJob, data: any): Promise<GeneratedDocument>
  getAvailableTemplates(exportType: string, scope: ExportScope): Promise<DocumentTemplate[]>
  previewDocument(template: string, data: any, options: ExportMetadata): Promise<GeneratedDocument>
  validateTemplate(template: string, exportType: string): Promise<{ valid: boolean; errors: string[] }>
}

export interface ExportSharingService {
  createShare(userId: string, request: CreateExportShareRequest): Promise<ExportShare>
  updateShare(userId: string, shareId: string, updates: Partial<CreateExportShareRequest>): Promise<ExportShare>
  deleteShare(userId: string, shareId: string): Promise<void>
  getShares(userId: string, exportJobId?: string): Promise<ExportShare[]>
  getShare(shareId: string, passcode?: string): Promise<ExportShare>
  accessShare(shareId: string, passcode?: string, userAgent?: string, ipAddress?: string): Promise<ExportShare>
}

export interface ExportAnalyticsService {
  trackEvent(event: Omit<ExportAnalytics, 'id' | 'createdAt'>): Promise<ExportAnalytics>
  getAnalytics(userId: string, filters?: { startDate?: Date; endDate?: Date; eventType?: string }): Promise<ExportAnalytics[]>
  getExportStats(userId: string, period: { startDate: Date; endDate: Date }): Promise<{
    totalExports: number
    totalDownloads: number
    popularFormats: Array<{ format: string; count: number }>
    popularTemplates: Array<{ template: string; count: number }>
  }>
}

// Domain errors
export class ExportJobNotFoundError extends DomainError {
  constructor(jobId: string) {
    super(`Export job with id ${jobId} not found`, 'EXPORT_JOB_NOT_FOUND', { jobId })
  }
}

export class ExportTemplateNotFoundError extends DomainError {
  constructor(templateId: string) {
    super(`Export template with id ${templateId} not found`, 'EXPORT_TEMPLATE_NOT_FOUND', { templateId })
  }
}

export class ExportGenerationError extends DomainError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'EXPORT_GENERATION_ERROR', context)
  }
}

export class ExportShareNotFoundError extends DomainError {
  constructor(shareId: string) {
    super(`Export share with id ${shareId} not found`, 'EXPORT_SHARE_NOT_FOUND', { shareId })
  }
}

export class ExportAccessDeniedError extends DomainError {
  constructor(shareId: string, reason: string) {
    super(`Access denied to export share ${shareId}: ${reason}`, 'EXPORT_ACCESS_DENIED', { shareId, reason })
  }
}
