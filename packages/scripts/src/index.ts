/**
 * Scripts Domain - Public API
 * 
 * This package contains the scripts and templates domain logic:
 * - Script creation and management
 * - Template library
 * - Script application to events
 * - Script sharing and collaboration
 */

import { BaseEntity, UserContext, DomainError } from '@syncscript/shared-kernel'
import { Task, Event, CreateTaskRequest, CreateEventRequest } from '@syncscript/planning-core'

// Script domain
export interface Script extends BaseEntity {
  title: string
  description?: string
  category: string
  tags: string[]
  manifest: ScriptManifest
  isPublic: boolean
  isSystem: boolean
  userId: string
  applyCount: number
  lastUsedAt?: Date
}

export interface ScriptManifest {
  tasks: ScriptTask[]
  events: ScriptEvent[]
  metadata: {
    estimatedDuration?: number
    difficulty: 'easy' | 'medium' | 'hard'
    requiredResources?: string[]
    prerequisites?: string[]
  }
}

export interface ScriptTask {
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  estimatedDuration?: number
  dependencies?: string[]
  category?: string
}

export interface ScriptEvent {
  title: string
  description?: string
  duration: number
  location?: string
  isAllDay?: boolean
  dependencies?: string[]
}

export interface CreateScriptRequest {
  title: string
  description?: string
  category: string
  tags?: string[]
  manifest: ScriptManifest
  isPublic?: boolean
}

export interface UpdateScriptRequest {
  title?: string
  description?: string
  category?: string
  tags?: string[]
  manifest?: ScriptManifest
  isPublic?: boolean
}

// Script application
export interface ScriptApplication extends BaseEntity {
  scriptId: string
  eventId: string
  userId: string
  appliedAt: Date
  status: 'pending' | 'applied' | 'failed'
  tasksCreated: number
  eventsCreated: number
  errors?: string[]
}

export interface ApplyScriptRequest {
  scriptId: string
  eventId: string
  customizations?: {
    tasks?: Partial<ScriptTask>[]
    events?: Partial<ScriptEvent>[]
  }
  startDate?: Date
}

export interface ApplyScriptResult {
  application: ScriptApplication
  createdTasks: Task[]
  createdEvents: Event[]
  conflicts: string[]
}

// Template library
export interface Template extends BaseEntity {
  name: string
  description: string
  category: string
  tags: string[]
  content: string
  isPublic: boolean
  isSystem: boolean
  usageCount: number
  rating?: number
  userId: string
}

export interface CreateTemplateRequest {
  name: string
  description: string
  category: string
  tags?: string[]
  content: string
  isPublic?: boolean
}

// Script sharing
export interface ScriptShare extends BaseEntity {
  scriptId: string
  sharedBy: string
  sharedWith: string[]
  permissions: 'view' | 'edit' | 'admin'
  expiresAt?: Date
  isPublic: boolean
}

export interface ShareScriptRequest {
  scriptId: string
  userIds?: string[]
  permissions: 'view' | 'edit' | 'admin'
  expiresAt?: Date
  isPublic?: boolean
}

// Domain services (interfaces only - implementations in server)
export interface ScriptService {
  createScript(userId: string, request: CreateScriptRequest): Promise<Script>
  updateScript(userId: string, scriptId: string, request: UpdateScriptRequest): Promise<Script>
  deleteScript(userId: string, scriptId: string): Promise<void>
  getScripts(userId: string, filters?: { category?: string; isPublic?: boolean }): Promise<Script[]>
  getScript(userId: string, scriptId: string): Promise<Script>
  duplicateScript(userId: string, scriptId: string, newTitle: string): Promise<Script>
}

export interface ScriptApplicationService {
  applyScript(userId: string, request: ApplyScriptRequest): Promise<ApplyScriptResult>
  getApplications(userId: string, scriptId?: string): Promise<ScriptApplication[]>
  getApplication(userId: string, applicationId: string): Promise<ScriptApplication>
}

export interface TemplateService {
  createTemplate(userId: string, request: CreateTemplateRequest): Promise<Template>
  updateTemplate(userId: string, templateId: string, request: Partial<CreateTemplateRequest>): Promise<Template>
  deleteTemplate(userId: string, templateId: string): Promise<void>
  getTemplates(userId: string, filters?: { category?: string; isPublic?: boolean }): Promise<Template[]>
  getTemplate(userId: string, templateId: string): Promise<Template>
  useTemplate(userId: string, templateId: string): Promise<Template>
}

export interface ScriptSharingService {
  shareScript(userId: string, request: ShareScriptRequest): Promise<ScriptShare>
  unshareScript(userId: string, scriptId: string, targetUserId?: string): Promise<void>
  getSharedScripts(userId: string): Promise<Script[]>
  getScriptShares(userId: string, scriptId: string): Promise<ScriptShare[]>
}

// Domain errors
export class ScriptNotFoundError extends DomainError {
  constructor(scriptId: string) {
    super(`Script with id ${scriptId} not found`, 'SCRIPT_NOT_FOUND', { scriptId })
  }
}

export class ScriptApplicationError extends DomainError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'SCRIPT_APPLICATION_ERROR', context)
  }
}

export class TemplateNotFoundError extends DomainError {
  constructor(templateId: string) {
    super(`Template with id ${templateId} not found`, 'TEMPLATE_NOT_FOUND', { templateId })
  }
}

export class ScriptSharingError extends DomainError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'SCRIPT_SHARING_ERROR', context)
  }
}
