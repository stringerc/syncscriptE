import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

type Role = 'owner' | 'admin' | 'editor' | 'contributor' | 'viewer'

// Permission matrix
const PERMISSIONS = {
  owner: ['read', 'write', 'delete', 'assign', 'invite', 'change_roles', 'change_privacy', 'archive', 'transfer'],
  admin: ['read', 'write', 'delete', 'assign', 'invite', 'change_roles', 'change_privacy'],
  editor: ['read', 'write', 'assign', 'apply_template'],
  contributor: ['read', 'write_own', 'complete', 'comment', 'attach', 'self_assign'],
  viewer: ['read']
}

export class ProjectsService {
  private static instance: ProjectsService

  static getInstance(): ProjectsService {
    if (!ProjectsService.instance) {
      ProjectsService.instance = new ProjectsService()
    }
    return ProjectsService.instance
  }

  /**
   * Check if user has permission
   */
  async hasPermission(userId: string, projectId: string, permission: string): Promise<boolean> {
    try {
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId, userId }
        }
      })

      if (!member || !member.acceptedAt) {
        return false // Not a member or hasn't accepted invite
      }

      const rolePermissions = PERMISSIONS[member.role as Role] || []
      return rolePermissions.includes(permission)
    } catch (error) {
      logger.error('Permission check failed', { error })
      return false
    }
  }

  /**
   * Create project
   */
  async createProject(userId: string, name: string, description?: string): Promise<any> {
    try {
      const project = await prisma.project.create({
        data: {
          name,
          description,
          ownerId: userId,
          members: {
            create: {
              userId,
              role: 'owner',
              acceptedAt: new Date()
            }
          }
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true, avatar: true }
          },
          members: true
        }
      })

      logger.info('Project created', { projectId: project.id, ownerId: userId })

      return project
    } catch (error: any) {
      logger.error('Failed to create project', { error: error.message })
      throw error
    }
  }

  /**
   * Invite user to project
   */
  async inviteToProject(
    projectId: string,
    inviterId: string,
    inviteeEmail: string,
    role: Role = 'contributor'
  ): Promise<any> {
    try {
      // Check inviter has permission
      const canInvite = await this.hasPermission(inviterId, projectId, 'invite')
      if (!canInvite) {
        throw new Error('You do not have permission to invite users')
      }

      // Find invitee
      const invitee = await prisma.user.findUnique({
        where: { email: inviteeEmail }
      })

      if (!invitee) {
        throw new Error('User not found')
      }

      // Check if already member
      const existing = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId, userId: invitee.id }
        }
      })

      if (existing) {
        if (existing.acceptedAt) {
          throw new Error('User is already a member')
        } else {
          throw new Error('Invite already pending')
        }
      }

      // Create invite
      const member = await prisma.projectMember.create({
        data: {
          projectId,
          userId: invitee.id,
          role,
          invitedBy: inviterId
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true }
          }
        }
      })

      // Audit log
      await this.logAudit(projectId, inviterId, 'INVITE_SENT', null, {
        inviteeId: invitee.id,
        role
      })

      logger.info('User invited to project', { projectId, inviteeId: invitee.id, role })

      return member
    } catch (error: any) {
      logger.error('Failed to invite user', { error: error.message })
      throw error
    }
  }

  /**
   * Accept/decline project invite
   */
  async respondToInvite(
    projectId: string,
    userId: string,
    accept: boolean
  ): Promise<any> {
    try {
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId, userId }
        }
      })

      if (!member) {
        throw new Error('Invite not found')
      }

      if (member.acceptedAt) {
        throw new Error('Invite already accepted')
      }

      if (accept) {
        const updated = await prisma.projectMember.update({
          where: {
            projectId_userId: { projectId, userId }
          },
          data: { acceptedAt: new Date() }
        })

        // Audit log
        await this.logAudit(projectId, userId, 'INVITE_ACCEPTED', null, { role: member.role })

        logger.info('Project invite accepted', { projectId, userId })

        return updated
      } else {
        await prisma.projectMember.delete({
          where: {
            projectId_userId: { projectId, userId }
          }
        })

        logger.info('Project invite declined', { projectId, userId })

        return { status: 'declined' }
      }
    } catch (error: any) {
      logger.error('Failed to respond to invite', { error: error.message })
      throw error
    }
  }

  /**
   * Change member role
   */
  async changeMemberRole(
    projectId: string,
    actorId: string,
    targetUserId: string,
    newRole: Role
  ): Promise<any> {
    try {
      // Check permission
      const canChangeRoles = await this.hasPermission(actorId, projectId, 'change_roles')
      if (!canChangeRoles) {
        throw new Error('You do not have permission to change roles')
      }

      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId, userId: targetUserId }
        }
      })

      if (!member) {
        throw new Error('Member not found')
      }

      const oldRole = member.role

      const updated = await prisma.projectMember.update({
        where: {
          projectId_userId: { projectId, userId: targetUserId }
        },
        data: { role: newRole }
      })

      // Audit log
      await this.logAudit(projectId, actorId, 'ROLE_CHANGED', 
        { userId: targetUserId, role: oldRole },
        { userId: targetUserId, role: newRole }
      )

      logger.info('Member role changed', { projectId, userId: targetUserId, oldRole, newRole })

      return updated
    } catch (error: any) {
      logger.error('Failed to change role', { error: error.message })
      throw error
    }
  }

  /**
   * Remove member from project
   */
  async removeMember(projectId: string, actorId: string, targetUserId: string): Promise<void> {
    try {
      // Check permission (owners can't be removed except by themselves)
      const canRemove = await this.hasPermission(actorId, projectId, 'invite')
      if (!canRemove && actorId !== targetUserId) {
        throw new Error('You do not have permission to remove members')
      }

      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId, userId: targetUserId }
        }
      })

      if (!member) {
        throw new Error('Member not found')
      }

      if (member.role === 'owner' && actorId !== targetUserId) {
        throw new Error('Cannot remove project owner')
      }

      await prisma.projectMember.delete({
        where: {
          projectId_userId: { projectId, userId: targetUserId }
        }
      })

      // Audit log
      await this.logAudit(projectId, actorId, 'MEMBER_REMOVED', 
        { userId: targetUserId, role: member.role },
        null
      )

      logger.info('Member removed from project', { projectId, userId: targetUserId })
    } catch (error: any) {
      logger.error('Failed to remove member', { error: error.message })
      throw error
    }
  }

  /**
   * Add item (event/task) to project
   */
  async addItemToProject(
    projectId: string,
    userId: string,
    itemId: string,
    itemType: 'event' | 'task',
    privacy: 'project' | 'restricted' = 'project'
  ): Promise<any> {
    try {
      // Check permission
      const canWrite = await this.hasPermission(userId, projectId, 'write')
      if (!canWrite) {
        throw new Error('You do not have permission to add items')
      }

      const item = await prisma.projectItem.create({
        data: {
          projectId,
          itemId,
          itemType,
          privacy,
          addedBy: userId
        }
      })

      // Audit log
      await this.logAudit(projectId, userId, 'ITEM_ADDED', null, {
        itemId,
        itemType,
        privacy
      })

      logger.info('Item added to project', { projectId, itemId, itemType })

      return item
    } catch (error: any) {
      logger.error('Failed to add item', { error: error.message })
      throw error
    }
  }

  /**
   * Assign user to item
   */
  async assignUser(
    itemId: string,
    itemType: 'event' | 'task',
    assignerId: string,
    assigneeId: string,
    role: 'owner' | 'assignee' | 'watcher' = 'assignee'
  ): Promise<any> {
    try {
      const assignment = await prisma.assignment.create({
        data: {
          itemId,
          itemType,
          userId: assigneeId,
          role,
          assignedBy: assignerId
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true }
          }
        }
      })

      logger.info('User assigned to item', { itemId, assigneeId, role })

      return assignment
    } catch (error: any) {
      logger.error('Failed to assign user', { error: error.message })
      throw error
    }
  }

  /**
   * Get project details with members
   */
  async getProject(projectId: string, userId: string): Promise<any> {
    try {
      // Check membership
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId, userId }
        }
      })

      if (!member || !member.acceptedAt) {
        throw new Error('You are not a member of this project')
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          owner: {
            select: { id: true, name: true, email: true, avatar: true }
          },
          members: {
            where: { acceptedAt: { not: null } },
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true }
              }
            }
          },
          items: true
        }
      })

      return project
    } catch (error: any) {
      logger.error('Failed to get project', { error: error.message })
      throw error
    }
  }

  /**
   * Get user's projects
   */
  async getUserProjects(userId: string): Promise<any[]> {
    try {
      const memberships = await prisma.projectMember.findMany({
        where: {
          userId,
          acceptedAt: { not: null }
        },
        include: {
          project: {
            include: {
              owner: {
                select: { id: true, name: true, email: true }
              },
              members: {
                where: { acceptedAt: { not: null } }
              }
            }
          }
        }
      })

      return memberships.map(m => ({
        ...m.project,
        myRole: m.role,
        memberCount: m.project.members.length
      }))
    } catch (error: any) {
      logger.error('Failed to get user projects', { error: error.message })
      throw error
    }
  }

  /**
   * Archive project
   */
  async archiveProject(projectId: string, userId: string): Promise<void> {
    try {
      const canArchive = await this.hasPermission(userId, projectId, 'archive')
      if (!canArchive) {
        throw new Error('Only project owners can archive')
      }

      await prisma.project.update({
        where: { id: projectId },
        data: { archivedAt: new Date() }
      })

      await this.logAudit(projectId, userId, 'PROJECT_ARCHIVED', null, null)

      logger.info('Project archived', { projectId, userId })
    } catch (error: any) {
      logger.error('Failed to archive project', { error: error.message })
      throw error
    }
  }

  /**
   * Log audit event
   */
  private async logAudit(
    projectId: string,
    actorId: string,
    action: string,
    before: any,
    after: any,
    itemId?: string
  ): Promise<void> {
    try {
      await prisma.projectAuditLog.create({
        data: {
          projectId,
          itemId,
          actorId,
          action,
          before: before ? JSON.stringify(before) : null,
          after: after ? JSON.stringify(after) : null
        }
      })
    } catch (error) {
      logger.error('Audit log failed', { error })
    }
  }

  /**
   * Get project audit trail
   */
  async getAuditTrail(projectId: string, userId: string, filters?: any): Promise<any[]> {
    try {
      // Check permission
      const canRead = await this.hasPermission(userId, projectId, 'read')
      if (!canRead) {
        throw new Error('You do not have permission to view audit trail')
      }

      const where: any = { projectId }
      
      if (filters?.itemId) {
        where.itemId = filters.itemId
      }
      
      if (filters?.actorId) {
        where.actorId = filters.actorId
      }

      const logs = await prisma.projectAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 100
      })

      // Hydrate with actor info
      const enriched = await Promise.all(
        logs.map(async (log) => {
          const actor = await prisma.user.findUnique({
            where: { id: log.actorId },
            select: { name: true, email: true, avatar: true }
          })

          return {
            ...log,
            actor,
            before: log.before ? JSON.parse(log.before) : null,
            after: log.after ? JSON.parse(log.after) : null
          }
        })
      )

      return enriched
    } catch (error: any) {
      logger.error('Failed to get audit trail', { error: error.message })
      throw error
    }
  }

  /**
   * Set provenance for item
   */
  async setProvenance(
    itemId: string,
    itemType: 'event' | 'task',
    sourceType: 'template' | 'promotion' | 'import' | 'fork',
    sourceRef: string,
    details: any
  ): Promise<void> {
    try {
      await prisma.provenance.upsert({
        where: { itemId },
        create: {
          itemId,
          itemType,
          sourceType,
          sourceRef,
          details: JSON.stringify(details)
        },
        update: {
          sourceType,
          sourceRef,
          details: JSON.stringify(details)
        }
      })

      logger.info('Provenance set', { itemId, sourceType })
    } catch (error: any) {
      logger.error('Failed to set provenance', { error: error.message })
    }
  }

  /**
   * Get provenance for item
   */
  async getProvenance(itemId: string): Promise<any> {
    try {
      const provenance = await prisma.provenance.findUnique({
        where: { itemId }
      })

      if (!provenance) {
        return null
      }

      return {
        ...provenance,
        details: JSON.parse(provenance.details)
      }
    } catch (error: any) {
      logger.error('Failed to get provenance', { error: error.message })
      return null
    }
  }
}

export const projectsService = ProjectsService.getInstance()
