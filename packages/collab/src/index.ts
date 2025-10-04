/**
 * Collaboration Domain - Public API
 * 
 * This package contains the collaboration and sharing domain logic:
 * - Project management
 * - Team collaboration
 * - Resource sharing
 * - Permissions and access control
 * - Activity tracking
 */

import { BaseEntity, UserContext, DomainError } from '@syncscript/shared-kernel'

// Project domain
export interface Project extends BaseEntity {
  name: string
  description?: string
  category: string
  status: 'planning' | 'active' | 'completed' | 'cancelled'
  startDate?: Date
  endDate?: Date
  ownerId: string
  isPublic: boolean
  visibility: 'private' | 'team' | 'public'
  members: ProjectMember[]
  resources: ProjectResource[]
  assignments: Assignment[]
}

export interface ProjectMember extends BaseEntity {
  projectId: string
  userId: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  joinedAt: Date
  permissions: ProjectPermissions
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

export interface ProjectPermissions {
  canEdit: boolean
  canDelete: boolean
  canInvite: boolean
  canManageResources: boolean
  canViewAnalytics: boolean
  canExport: boolean
}

export interface CreateProjectRequest {
  name: string
  description?: string
  category: string
  startDate?: Date
  endDate?: Date
  isPublic?: boolean
  visibility?: 'private' | 'team' | 'public'
}

export interface UpdateProjectRequest {
  name?: string
  description?: string
  category?: string
  status?: 'planning' | 'active' | 'completed' | 'cancelled'
  startDate?: Date
  endDate?: Date
  isPublic?: boolean
  visibility?: 'private' | 'team' | 'public'
}

// Resource management
export interface ProjectResource extends BaseEntity {
  projectId: string
  name: string
  description?: string
  type: 'file' | 'link' | 'template' | 'script' | 'budget'
  url?: string
  fileSize?: number
  mimeType?: string
  addedBy: string
  isPublic: boolean
  tags: string[]
  metadata: Record<string, any>
}

export interface CreateResourceRequest {
  name: string
  description?: string
  type: 'file' | 'link' | 'template' | 'script' | 'budget'
  url?: string
  isPublic?: boolean
  tags?: string[]
  metadata?: Record<string, any>
}

// Assignment management
export interface Assignment extends BaseEntity {
  projectId: string
  assignedTo: string
  assignedBy: string
  title: string
  description?: string
  type: 'task' | 'event' | 'resource' | 'review'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  dueDate?: Date
  completedAt?: Date
  metadata: Record<string, any>
}

export interface CreateAssignmentRequest {
  assignedTo: string
  title: string
  description?: string
  type: 'task' | 'event' | 'resource' | 'review'
  priority?: 'low' | 'medium' | 'high'
  dueDate?: Date
  metadata?: Record<string, any>
}

// Invitations
export interface ProjectInvitation extends BaseEntity {
  projectId: string
  invitedBy: string
  invitedEmail: string
  role: 'admin' | 'editor' | 'viewer'
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  expiresAt: Date
  acceptedAt?: Date
  declinedAt?: Date
  message?: string
}

export interface CreateInvitationRequest {
  invitedEmail: string
  role: 'admin' | 'editor' | 'viewer'
  message?: string
  expiresInHours?: number
}

// Activity tracking
export interface ProjectActivity extends BaseEntity {
  projectId: string
  userId: string
  type: 'created' | 'updated' | 'deleted' | 'member_added' | 'member_removed' | 'resource_added' | 'assignment_created' | 'assignment_completed'
  description: string
  metadata: Record<string, any>
  targetId?: string
  targetType?: string
}

// Collaboration features
export interface CollaborationSettings extends BaseEntity {
  projectId: string
  allowComments: boolean
  allowReactions: boolean
  allowNotifications: boolean
  defaultRole: 'editor' | 'viewer'
  requireApproval: boolean
  autoArchive: boolean
  archiveAfterDays?: number
}

export interface Comment extends BaseEntity {
  projectId: string
  userId: string
  content: string
  targetId: string
  targetType: 'project' | 'resource' | 'assignment'
  parentId?: string
  isResolved: boolean
  reactions: CommentReaction[]
}

export interface CommentReaction extends BaseEntity {
  commentId: string
  userId: string
  type: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry'
}

// Domain services (interfaces only - implementations in server)
export interface ProjectService {
  createProject(userId: string, request: CreateProjectRequest): Promise<Project>
  updateProject(userId: string, projectId: string, request: UpdateProjectRequest): Promise<Project>
  deleteProject(userId: string, projectId: string): Promise<void>
  getProjects(userId: string, filters?: { status?: string; visibility?: string }): Promise<Project[]>
  getProject(userId: string, projectId: string): Promise<Project>
  duplicateProject(userId: string, projectId: string, newName: string): Promise<Project>
}

export interface ProjectMemberService {
  addMember(userId: string, projectId: string, memberId: string, role: string): Promise<ProjectMember>
  updateMemberRole(userId: string, projectId: string, memberId: string, role: string): Promise<ProjectMember>
  removeMember(userId: string, projectId: string, memberId: string): Promise<void>
  getMembers(userId: string, projectId: string): Promise<ProjectMember[]>
  getMember(userId: string, projectId: string, memberId: string): Promise<ProjectMember>
}

export interface ProjectResourceService {
  addResource(userId: string, projectId: string, request: CreateResourceRequest): Promise<ProjectResource>
  updateResource(userId: string, projectId: string, resourceId: string, request: Partial<CreateResourceRequest>): Promise<ProjectResource>
  deleteResource(userId: string, projectId: string, resourceId: string): Promise<void>
  getResources(userId: string, projectId: string, filters?: { type?: string; isPublic?: boolean }): Promise<ProjectResource[]>
  getResource(userId: string, projectId: string, resourceId: string): Promise<ProjectResource>
}

export interface AssignmentService {
  createAssignment(userId: string, projectId: string, request: CreateAssignmentRequest): Promise<Assignment>
  updateAssignment(userId: string, projectId: string, assignmentId: string, request: Partial<CreateAssignmentRequest>): Promise<Assignment>
  completeAssignment(userId: string, projectId: string, assignmentId: string): Promise<Assignment>
  deleteAssignment(userId: string, projectId: string, assignmentId: string): Promise<void>
  getAssignments(userId: string, projectId: string, filters?: { status?: string; assignedTo?: string }): Promise<Assignment[]>
  getAssignment(userId: string, projectId: string, assignmentId: string): Promise<Assignment>
}

export interface InvitationService {
  createInvitation(userId: string, projectId: string, request: CreateInvitationRequest): Promise<ProjectInvitation>
  acceptInvitation(invitationId: string, userId: string): Promise<ProjectInvitation>
  declineInvitation(invitationId: string, userId: string): Promise<ProjectInvitation>
  cancelInvitation(userId: string, invitationId: string): Promise<void>
  getInvitations(userId: string, projectId?: string): Promise<ProjectInvitation[]>
  getInvitation(invitationId: string): Promise<ProjectInvitation>
}

export interface ActivityService {
  logActivity(projectId: string, userId: string, type: string, description: string, metadata?: Record<string, any>, targetId?: string, targetType?: string): Promise<ProjectActivity>
  getActivities(userId: string, projectId: string, filters?: { type?: string; userId?: string }): Promise<ProjectActivity[]>
  getActivity(userId: string, activityId: string): Promise<ProjectActivity>
}

export interface CommentService {
  createComment(userId: string, projectId: string, content: string, targetId: string, targetType: string, parentId?: string): Promise<Comment>
  updateComment(userId: string, commentId: string, content: string): Promise<Comment>
  deleteComment(userId: string, commentId: string): Promise<void>
  getComments(userId: string, projectId: string, targetId: string, targetType: string): Promise<Comment[]>
  addReaction(userId: string, commentId: string, type: string): Promise<CommentReaction>
  removeReaction(userId: string, commentId: string, type: string): Promise<void>
}

// Domain errors
export class ProjectNotFoundError extends DomainError {
  constructor(projectId: string) {
    super(`Project with id ${projectId} not found`, 'PROJECT_NOT_FOUND', { projectId })
  }
}

export class ProjectAccessDeniedError extends DomainError {
  constructor(projectId: string, userId: string, action: string) {
    super(`Access denied to project ${projectId} for user ${userId} to perform ${action}`, 'PROJECT_ACCESS_DENIED', { projectId, userId, action })
  }
}

export class ProjectMemberNotFoundError extends DomainError {
  constructor(projectId: string, userId: string) {
    super(`User ${userId} is not a member of project ${projectId}`, 'PROJECT_MEMBER_NOT_FOUND', { projectId, userId })
  }
}

export class ResourceNotFoundError extends DomainError {
  constructor(resourceId: string) {
    super(`Resource with id ${resourceId} not found`, 'RESOURCE_NOT_FOUND', { resourceId })
  }
}

export class AssignmentNotFoundError extends DomainError {
  constructor(assignmentId: string) {
    super(`Assignment with id ${assignmentId} not found`, 'ASSIGNMENT_NOT_FOUND', { assignmentId })
  }
}

export class InvitationNotFoundError extends DomainError {
  constructor(invitationId: string) {
    super(`Invitation with id ${invitationId} not found`, 'INVITATION_NOT_FOUND', { invitationId })
  }
}

export class InvitationExpiredError extends DomainError {
  constructor(invitationId: string) {
    super(`Invitation ${invitationId} has expired`, 'INVITATION_EXPIRED', { invitationId })
  }
}
