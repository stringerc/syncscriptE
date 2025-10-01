import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface ProjectResourceFolder {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  parentFolderId?: string;
  order: number;
  visibility: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectResource {
  id: string;
  projectId: string;
  folderId?: string;
  originalResourceId?: string;
  kind: string;
  urlOrKey?: string;
  title?: string;
  previewImage?: string;
  domain?: string;
  merchant?: string;
  priceCents?: number;
  note?: string;
  tags: string;
  sourceTaskId?: string;
  sourceEventId?: string;
  addedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ProjectResourceService {
  private static instance: ProjectResourceService;

  static getInstance(): ProjectResourceService {
    if (!ProjectResourceService.instance) {
      ProjectResourceService.instance = new ProjectResourceService();
    }
    return ProjectResourceService.instance;
  }

  /**
   * Create default resource folder for a project
   */
  async createDefaultFolder(projectId: string): Promise<ProjectResourceFolder> {
    try {
      const folder = await prisma.projectResourceFolder.create({
        data: {
          projectId,
          name: 'Project Resources',
          description: 'All resources related to this project',
          order: 0,
          visibility: 'project'
        }
      });

      logger.info('Created default resource folder for project', { projectId, folderId: folder.id });
      return folder;
    } catch (error) {
      logger.error('Failed to create default resource folder', { projectId, error });
      throw error;
    }
  }

  /**
   * Get all resource folders for a project
   */
  async getProjectFolders(projectId: string): Promise<ProjectResourceFolder[]> {
    try {
      const folders = await prisma.projectResourceFolder.findMany({
        where: { projectId },
        orderBy: [{ parentFolderId: 'asc' }, { order: 'asc' }, { name: 'asc' }]
      });

      return folders;
    } catch (error) {
      logger.error('Failed to get project folders', { projectId, error });
      throw error;
    }
  }

  /**
   * Get all resources for a project (optionally filtered by folder)
   */
  async getProjectResources(projectId: string, folderId?: string): Promise<ProjectResource[]> {
    try {
      const where: any = { projectId };
      if (folderId) {
        where.folderId = folderId;
      }

      const resources = await prisma.projectResource.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          folder: true,
          addedByUser: {
            select: { id: true, name: true, email: true, avatar: true }
          }
        }
      });

      return resources;
    } catch (error) {
      logger.error('Failed to get project resources', { projectId, folderId, error });
      throw error;
    }
  }

  /**
   * Add a resource from a task/event to the project
   */
  async addResourceFromTask(
    projectId: string, 
    taskId: string, 
    resourceId: string, 
    addedBy: string,
    folderId?: string
  ): Promise<ProjectResource> {
    try {
      // Get the original resource
      const originalResource = await prisma.resource.findUnique({
        where: { id: resourceId }
      });

      if (!originalResource) {
        throw new Error('Original resource not found');
      }

      // Create project resource (copy of original)
      const projectResource = await prisma.projectResource.create({
        data: {
          projectId,
          folderId,
          originalResourceId: resourceId,
          kind: originalResource.kind,
          urlOrKey: originalResource.urlOrKey,
          title: originalResource.title,
          previewImage: originalResource.previewImage,
          domain: originalResource.domain,
          merchant: originalResource.merchant,
          priceCents: originalResource.priceCents,
          note: originalResource.note,
          tags: originalResource.tags,
          sourceTaskId: taskId,
          addedBy
        },
        include: {
          folder: true,
          addedByUser: {
            select: { id: true, name: true, email: true, avatar: true }
          }
        }
      });

      logger.info('Added resource from task to project', { 
        projectId, 
        taskId, 
        resourceId, 
        projectResourceId: projectResource.id 
      });

      return projectResource;
    } catch (error) {
      logger.error('Failed to add resource from task', { projectId, taskId, resourceId, error });
      throw error;
    }
  }

  /**
   * Add a resource from an event to the project
   */
  async addResourceFromEvent(
    projectId: string, 
    eventId: string, 
    resourceId: string, 
    addedBy: string,
    folderId?: string
  ): Promise<ProjectResource> {
    try {
      // Get the original resource
      const originalResource = await prisma.resource.findUnique({
        where: { id: resourceId }
      });

      if (!originalResource) {
        throw new Error('Original resource not found');
      }

      // Create project resource (copy of original)
      const projectResource = await prisma.projectResource.create({
        data: {
          projectId,
          folderId,
          originalResourceId: resourceId,
          kind: originalResource.kind,
          urlOrKey: originalResource.urlOrKey,
          title: originalResource.title,
          previewImage: originalResource.previewImage,
          domain: originalResource.domain,
          merchant: originalResource.merchant,
          priceCents: originalResource.priceCents,
          note: originalResource.note,
          tags: originalResource.tags,
          sourceEventId: eventId,
          addedBy
        },
        include: {
          folder: true,
          addedByUser: {
            select: { id: true, name: true, email: true, avatar: true }
          }
        }
      });

      logger.info('Added resource from event to project', { 
        projectId, 
        eventId, 
        resourceId, 
        projectResourceId: projectResource.id 
      });

      return projectResource;
    } catch (error) {
      logger.error('Failed to add resource from event', { projectId, eventId, resourceId, error });
      throw error;
    }
  }

  /**
   * Create a new resource folder
   */
  async createFolder(
    projectId: string, 
    name: string, 
    description?: string, 
    parentFolderId?: string
  ): Promise<ProjectResourceFolder> {
    try {
      // Get the next order number for this parent folder
      const maxOrder = await prisma.projectResourceFolder.findFirst({
        where: { 
          projectId, 
          parentFolderId: parentFolderId || null 
        },
        orderBy: { order: 'desc' },
        select: { order: true }
      });

      const folder = await prisma.projectResourceFolder.create({
        data: {
          projectId,
          name,
          description,
          parentFolderId,
          order: (maxOrder?.order || 0) + 1,
          visibility: 'project'
        }
      });

      logger.info('Created resource folder', { projectId, folderId: folder.id, name });
      return folder;
    } catch (error) {
      logger.error('Failed to create resource folder', { projectId, name, error });
      throw error;
    }
  }

  /**
   * Move a resource to a different folder
   */
  async moveResourceToFolder(
    resourceId: string, 
    folderId?: string
  ): Promise<ProjectResource> {
    try {
      const resource = await prisma.projectResource.update({
        where: { id: resourceId },
        data: { folderId },
        include: {
          folder: true,
          addedByUser: {
            select: { id: true, name: true, email: true, avatar: true }
          }
        }
      });

      logger.info('Moved resource to folder', { resourceId, folderId });
      return resource;
    } catch (error) {
      logger.error('Failed to move resource to folder', { resourceId, folderId, error });
      throw error;
    }
  }

  /**
   * Delete a project resource
   */
  async deleteResource(resourceId: string): Promise<void> {
    try {
      await prisma.projectResource.delete({
        where: { id: resourceId }
      });

      logger.info('Deleted project resource', { resourceId });
    } catch (error) {
      logger.error('Failed to delete project resource', { resourceId, error });
      throw error;
    }
  }

  /**
   * Get resources from tasks/events that can be added to project
   */
  async getAvailableResourcesForProject(projectId: string): Promise<any[]> {
    try {
      // Get all tasks and events in this project
      const projectItems = await prisma.projectItem.findMany({
        where: { projectId },
        select: { itemId: true, itemType: true }
      });

      const taskIds = projectItems
        .filter(item => item.itemType === 'task')
        .map(item => item.itemId);
      
      const eventIds = projectItems
        .filter(item => item.itemType === 'event')
        .map(item => item.itemId);

      // Get all resources from these tasks and events
      const resources = await prisma.resource.findMany({
        where: {
          OR: [
            { resourceSet: { taskId: { in: taskIds } } },
            { resourceSet: { eventId: { in: eventIds } } }
          ]
        },
        include: {
          resourceSet: {
            include: {
              task: { select: { id: true, title: true } },
              event: { select: { id: true, title: true } }
            }
          }
        }
      });

      return resources;
    } catch (error) {
      logger.error('Failed to get available resources for project', { projectId, error });
      throw error;
    }
  }
}

export const projectResourceService = ProjectResourceService.getInstance();
