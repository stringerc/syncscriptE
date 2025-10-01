import express from 'express';
import { projectResourceService } from '../services/projectResourceService';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * GET /api/projects/:projectId/resources/folders
 * Get all resource folders for a project
 */
router.get('/:projectId/resources/folders', authenticateToken, asyncHandler(async (req: any, res) => {
  const { projectId } = req.params;
  const userId = req.user!.id;

  // TODO: Check if user has access to this project
  const folders = await projectResourceService.getProjectFolders(projectId);

  res.json({
    success: true,
    data: { folders }
  });
}));

/**
 * GET /api/projects/:projectId/resources
 * Get all resources for a project (optionally filtered by folder)
 */
router.get('/:projectId/resources', authenticateToken, asyncHandler(async (req: any, res) => {
  const { projectId } = req.params;
  const { folderId } = req.query;
  const userId = req.user!.id;

  // TODO: Check if user has access to this project
  const resources = await projectResourceService.getProjectResources(
    projectId, 
    folderId as string
  );

  res.json({
    success: true,
    data: { resources }
  });
}));

/**
 * GET /api/projects/:projectId/resources/available
 * Get resources from tasks/events that can be added to project
 */
router.get('/:projectId/resources/available', authenticateToken, asyncHandler(async (req: any, res) => {
  const { projectId } = req.params;
  const userId = req.user!.id;

  // TODO: Check if user has access to this project
  const availableResources = await projectResourceService.getAvailableResourcesForProject(projectId);

  res.json({
    success: true,
    data: { availableResources }
  });
}));

/**
 * POST /api/projects/:projectId/resources/folders
 * Create a new resource folder
 */
router.post('/:projectId/resources/folders', authenticateToken, asyncHandler(async (req: any, res) => {
  const { projectId } = req.params;
  const { name, description, parentFolderId } = req.body;
  const userId = req.user!.id;

  if (!name) {
    return res.status(400).json({
      success: false,
      error: 'Folder name is required'
    });
  }

  // TODO: Check if user has access to this project
  const folder = await projectResourceService.createFolder(
    projectId, 
    name, 
    description, 
    parentFolderId
  );

  res.json({
    success: true,
    data: { folder },
    message: 'Folder created successfully'
  });
}));

/**
 * POST /api/projects/:projectId/resources/add-from-task
 * Add a resource from a task to the project
 */
router.post('/:projectId/resources/add-from-task', authenticateToken, asyncHandler(async (req: any, res) => {
  const { projectId } = req.params;
  const { taskId, resourceId, folderId } = req.body;
  const userId = req.user!.id;

  if (!taskId || !resourceId) {
    return res.status(400).json({
      success: false,
      error: 'Task ID and Resource ID are required'
    });
  }

  // TODO: Check if user has access to this project and task
  const projectResource = await projectResourceService.addResourceFromTask(
    projectId,
    taskId,
    resourceId,
    userId,
    folderId
  );

  res.json({
    success: true,
    data: { resource: projectResource },
    message: 'Resource added to project successfully'
  });
}));

/**
 * POST /api/projects/:projectId/resources/add-from-event
 * Add a resource from an event to the project
 */
router.post('/:projectId/resources/add-from-event', authenticateToken, asyncHandler(async (req: any, res) => {
  const { projectId } = req.params;
  const { eventId, resourceId, folderId } = req.body;
  const userId = req.user!.id;

  if (!eventId || !resourceId) {
    return res.status(400).json({
      success: false,
      error: 'Event ID and Resource ID are required'
    });
  }

  // TODO: Check if user has access to this project and event
  const projectResource = await projectResourceService.addResourceFromEvent(
    projectId,
    eventId,
    resourceId,
    userId,
    folderId
  );

  res.json({
    success: true,
    data: { resource: projectResource },
    message: 'Resource added to project successfully'
  });
}));

/**
 * PATCH /api/projects/:projectId/resources/:resourceId/move
 * Move a resource to a different folder
 */
router.patch('/:projectId/resources/:resourceId/move', authenticateToken, asyncHandler(async (req: any, res) => {
  const { projectId, resourceId } = req.params;
  const { folderId } = req.body;
  const userId = req.user!.id;

  // TODO: Check if user has access to this project
  const resource = await projectResourceService.moveResourceToFolder(resourceId, folderId);

  res.json({
    success: true,
    data: { resource },
    message: 'Resource moved successfully'
  });
}));

/**
 * DELETE /api/projects/:projectId/resources/:resourceId
 * Delete a project resource
 */
router.delete('/:projectId/resources/:resourceId', authenticateToken, asyncHandler(async (req: any, res) => {
  const { projectId, resourceId } = req.params;
  const userId = req.user!.id;

  // TODO: Check if user has access to this project
  await projectResourceService.deleteResource(resourceId);

  res.json({
    success: true,
    message: 'Resource deleted successfully'
  });
}));

export default router;
