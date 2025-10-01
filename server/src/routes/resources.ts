import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth'
import { asyncHandler, createError } from '../middleware/errorHandler'
import { logger } from '../utils/logger'
import { projectResourceService } from '../services/projectResourceService'
import multer from 'multer'

const router = Router()
const prisma = new PrismaClient()

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, PDFs, and documents
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
    }
  }
})

// GET /tasks/:id/resources - Get all resources for a task
router.get('/tasks/:id/resources', authenticateToken, asyncHandler(async (req: any, res) => {
  const { id } = req.params
  const userId = req.user.id

  // Verify task belongs to user
  const task = await prisma.task.findFirst({
    where: { id, userId },
    include: {
      resourceSet: {
        include: {
          resources: {
            orderBy: [
              { isSelected: 'desc' }, // Selected resource first
              { createdAt: 'desc' }
            ]
          }
        }
      }
    }
  })

  if (!task) {
    throw createError(404, 'Task not found')
  }

  const resources = task.resourceSet?.resources || []
  
  logger.info(`📎 GET /tasks/${id}/resources - Found ${resources.length} resources`, {
    taskId: id,
    resourceSetId: task.resourceSet?.id,
    resourceCount: resources.length,
    resourceIds: resources.map(r => r.id),
    resourceTitles: resources.map(r => r.title)
  })
  
  res.json({
    success: true,
    data: {
      resourceSetId: task.resourceSet?.id,
      selectedResourceId: task.resourceSet?.selectedResourceId,
      resources: resources.map(resource => ({
        id: resource.id,
        kind: resource.kind,
        urlOrKey: resource.urlOrKey,
        title: resource.title,
        previewImage: resource.previewImage,
        domain: resource.domain,
        merchant: resource.merchant,
        priceCents: resource.priceCents,
        note: resource.note,
        tags: JSON.parse(resource.tags || '[]'),
        isSelected: resource.isSelected,
        createdAt: resource.createdAt,
        updatedAt: resource.updatedAt
      }))
    }
  })
}))

// POST /tasks/:id/resources/url - Add URL resource to task
router.post('/tasks/:id/resources/url', authenticateToken, asyncHandler(async (req: any, res) => {
  const { id } = req.params
  const { url, title, note, tags = [] } = req.body
  const userId = req.user.id

  if (!url) {
    throw createError(400, 'URL is required')
  }

  // Verify task belongs to user
  const task = await prisma.task.findFirst({
    where: { id, userId },
    include: { resourceSet: true }
  })

  if (!task) {
    throw createError(404, 'Task not found')
  }

  // Create or get resource set
  let resourceSet = task.resourceSet
  if (!resourceSet) {
    resourceSet = await prisma.resourceSet.create({
      data: { taskId: id }
    })
  }

  // Import URL unfurl service
  const { urlUnfurlService } = await import('../services/urlUnfurlService')
  
  // Ensure URL has protocol
  let fullUrl = url
  if (!url.match(/^https?:\/\//i)) {
    fullUrl = `https://${url}`
  }

  // Unfurl the URL to get metadata and preview image
  const unfurledData = await urlUnfurlService.unfurlUrl(fullUrl)
  
  const domain = unfurledData?.domain || null
  const previewImage = unfurledData?.image || null
  const suggestedTitle = unfurledData?.title || title || domain || 'Untitled'
  const merchant = unfurledData?.siteName || null
  const priceCents = unfurledData?.price || null

  // Check for duplicate URL in this resource set
  const existingResource = await prisma.resource.findFirst({
    where: {
      resourceSetId: resourceSet.id,
      urlOrKey: fullUrl
    }
  })

  if (existingResource) {
    throw createError(409, 'This URL already exists in the resource set')
  }

  // Create the resource with unfurled data
  const resource = await prisma.resource.create({
    data: {
      resourceSetId: resourceSet.id,
      kind: 'url',
      urlOrKey: fullUrl,
      title: title || suggestedTitle,
      previewImage,
      domain,
      merchant,
      priceCents,
      note,
      tags: JSON.stringify(tags),
      createdById: userId
    }
  })

  logger.info('URL resource created with preview', { 
    resourceId: resource.id, 
    domain, 
    hasPreview: !!previewImage,
    title: resource.title 
  })

  // Auto-sync to project if task belongs to a project
  try {
    const projectItem = await prisma.projectItem.findFirst({
      where: { itemId: id, itemType: 'task' },
      include: { project: true }
    })

    if (projectItem) {
      await projectResourceService.addResourceFromTask(
        projectItem.projectId,
        id,
        resource.id,
        userId
      )
      logger.info('Resource auto-synced to project', { 
        projectId: projectItem.projectId, 
        taskId: id, 
        resourceId: resource.id 
      })
    }
  } catch (error) {
    // Don't fail the resource creation if project sync fails
    logger.error('Failed to auto-sync resource to project', { 
      taskId: id, 
      resourceId: resource.id, 
      error: error.message 
    })
  }

  res.json({
    success: true,
    data: {
      id: resource.id,
      kind: resource.kind,
      urlOrKey: resource.urlOrKey,
      title: resource.title,
      previewImage: resource.previewImage,
      domain: resource.domain,
      merchant: resource.merchant,
      priceCents: resource.priceCents,
      note: resource.note,
      tags: JSON.parse(resource.tags || '[]'),
      isSelected: resource.isSelected,
      createdAt: resource.createdAt
    }
  })
}))

// POST /tasks/:id/resources/note - Add note resource to task
router.post('/tasks/:id/resources/note', authenticateToken, asyncHandler(async (req: any, res) => {
  const { id } = req.params
  const { note, title, tags = [] } = req.body
  const userId = req.user.id

  if (!note) {
    throw createError(400, 'Note content is required')
  }

  // Verify task belongs to user
  const task = await prisma.task.findFirst({
    where: { id, userId },
    include: { resourceSet: true }
  })

  if (!task) {
    throw createError(404, 'Task not found')
  }

  // Create or get resource set
  let resourceSet = task.resourceSet
  if (!resourceSet) {
    resourceSet = await prisma.resourceSet.create({
      data: { taskId: id }
    })
  }

  // Create the resource
  const resource = await prisma.resource.create({
    data: {
      resourceSetId: resourceSet.id,
      kind: 'note',
      title: title || 'Note',
      note,
      tags: JSON.stringify(tags),
      createdById: userId
    }
  })

  // Auto-sync to project if task belongs to a project
  try {
    const projectItem = await prisma.projectItem.findFirst({
      where: { itemId: id, itemType: 'task' },
      include: { project: true }
    })

    if (projectItem) {
      await projectResourceService.addResourceFromTask(
        projectItem.projectId,
        id,
        resource.id,
        userId
      )
      logger.info('Note resource auto-synced to project', { 
        projectId: projectItem.projectId, 
        taskId: id, 
        resourceId: resource.id 
      })
    }
  } catch (error) {
    logger.error('Failed to auto-sync note resource to project', { 
      taskId: id, 
      resourceId: resource.id, 
      error: error.message 
    })
  }

  res.json({
    success: true,
    data: {
      id: resource.id,
      kind: resource.kind,
      title: resource.title,
      note: resource.note,
      tags: JSON.parse(resource.tags || '[]'),
      isSelected: resource.isSelected,
      createdAt: resource.createdAt
    }
  })
}))

// POST /tasks/:id/resources/upload - Add file resource to task
router.post('/tasks/:id/resources/upload', authenticateToken, upload.single('file'), asyncHandler(async (req: any, res) => {
  const { id } = req.params
  const userId = req.user.id

  // Verify task belongs to user
  const task = await prisma.task.findFirst({
    where: { id, userId },
    include: { resourceSet: true }
  })

  if (!task) {
    throw createError(404, 'Task not found')
  }

  // Create or get resource set
  let resourceSet = task.resourceSet
  if (!resourceSet) {
    resourceSet = await prisma.resourceSet.create({
      data: { taskId: id }
    })
  }

  const file = req.file
  if (!file) {
    throw createError(400, 'No file provided')
  }

  try {
    // Determine file type
    let kind = 'file'
    if (file.mimetype.startsWith('image/')) {
      kind = 'image'
    }

    // Create the resource
    const resource = await prisma.resource.create({
      data: {
        resourceSetId: resourceSet.id,
        kind,
        urlOrKey: file.buffer.toString('base64'), // Store file as base64 for now
        title: req.body.title || file.originalname,
        previewImage: kind === 'image' ? file.buffer.toString('base64') : null,
        createdById: userId
      }
    })

    // Auto-sync to project if task belongs to a project
    try {
      const projectItem = await prisma.projectItem.findFirst({
        where: { itemId: id, itemType: 'task' },
        include: { project: true }
      })

      if (projectItem) {
        await projectResourceService.addResourceFromTask(
          projectItem.projectId,
          id,
          resource.id,
          userId
        )
        logger.info('File resource auto-synced to project', { 
          projectId: projectItem.projectId, 
          taskId: id, 
          resourceId: resource.id 
        })
      }
    } catch (error) {
      logger.error('Failed to auto-sync file resource to project', { 
        taskId: id, 
        resourceId: resource.id, 
        error: error.message 
      })
    }

    res.json({
      success: true,
      data: {
        id: resource.id,
        kind: resource.kind,
        urlOrKey: resource.urlOrKey,
        title: resource.title,
        previewImage: resource.previewImage,
        isSelected: resource.isSelected,
        createdAt: resource.createdAt
      }
    })
  } catch (error) {
    logger.error('Error creating file resource:', error)
    throw createError(500, 'Failed to create file resource')
  }
}))

// POST /resourceSets/:id/select - Select a resource as the primary choice
router.post('/resourceSets/:id/select', authenticateToken, asyncHandler(async (req: any, res) => {
  const { id } = req.params
  const { resourceId, reason } = req.body
  const userId = req.user.id

  if (!resourceId) {
    throw createError(400, 'Resource ID is required')
  }

  // Verify resource set exists and user has access
  const resourceSet = await prisma.resourceSet.findFirst({
    where: { id },
    include: {
      resources: true,
      task: { select: { userId: true } },
      event: { select: { userId: true } }
    }
  })

  if (!resourceSet) {
    throw createError(404, 'Resource set not found')
  }

  // Check if user owns the task or event
  const isOwner = (resourceSet.task?.userId === userId) || (resourceSet.event?.userId === userId)
  if (!isOwner) {
    throw createError(403, 'Access denied')
  }

  // Verify resource exists in this set
  const resource = resourceSet.resources.find(r => r.id === resourceId)
  if (!resource) {
    throw createError(404, 'Resource not found in this set')
  }

  // Update all resources to unselected
  await prisma.resource.updateMany({
    where: { resourceSetId: id },
    data: { isSelected: false }
  })

  // Select the new resource
  await prisma.resource.update({
    where: { id: resourceId },
    data: { isSelected: true }
  })

  // Update resource set
  await prisma.resourceSet.update({
    where: { id },
    data: { selectedResourceId: resourceId }
  })

  // Log the decision
  await prisma.decisionLog.create({
    data: {
      resourceSetId: id,
      selectedResourceId: resourceId,
      reason
    }
  })

  res.json({
    success: true,
    data: {
      selectedResourceId: resourceId,
      reason
    }
  })
}))

// POST /resourceSets/:id/unselect - Unselect all resources
router.post('/resourceSets/:id/unselect', authenticateToken, asyncHandler(async (req: any, res) => {
  const { id } = req.params
  const userId = req.user.id

  // Verify resource set exists and user has access
  const resourceSet = await prisma.resourceSet.findFirst({
    where: { id },
    include: {
      task: { select: { userId: true } },
      event: { select: { userId: true } }
    }
  })

  if (!resourceSet) {
    throw createError(404, 'Resource set not found')
  }

  // Check if user owns the task or event
  const isOwner = (resourceSet.task?.userId === userId) || (resourceSet.event?.userId === userId)
  if (!isOwner) {
    throw createError(403, 'Access denied')
  }

  // Unselect all resources
  await prisma.resource.updateMany({
    where: { resourceSetId: id },
    data: { isSelected: false }
  })

  // Update resource set
  await prisma.resourceSet.update({
    where: { id },
    data: { selectedResourceId: null }
  })

  res.json({
    success: true,
    data: {
      selectedResourceId: null
    }
  })
}))

// PATCH /resources/:id - Update a resource
router.patch('/resources/:id', authenticateToken, asyncHandler(async (req: any, res) => {
  const { id } = req.params
  const { title, note, tags, urlOrKey } = req.body
  const userId = req.user.id

  // Verify resource exists and user has access
  const resource = await prisma.resource.findFirst({
    where: { id, createdById: userId },
    include: {
      resourceSet: {
        include: {
          task: { select: { userId: true } },
          event: { select: { userId: true } }
        }
      }
    }
  })

  if (!resource) {
    throw createError(404, 'Resource not found')
  }

  // Check if user owns the task or event
  const isOwner = (resource.resourceSet.task?.userId === userId) || (resource.resourceSet.event?.userId === userId)
  if (!isOwner) {
    throw createError(403, 'Access denied')
  }

  // Update resource
  const updatedResource = await prisma.resource.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(note !== undefined && { note }),
      ...(tags !== undefined && { tags: JSON.stringify(tags) }),
      ...(urlOrKey !== undefined && { urlOrKey })
    }
  })

  res.json({
    success: true,
    data: {
      id: updatedResource.id,
      kind: updatedResource.kind,
      urlOrKey: updatedResource.urlOrKey,
      title: updatedResource.title,
      note: updatedResource.note,
      tags: JSON.parse(updatedResource.tags || '[]'),
      isSelected: updatedResource.isSelected,
      updatedAt: updatedResource.updatedAt
    }
  })
}))

// DELETE /resources/:id - Delete a resource
router.delete('/resources/:id', authenticateToken, asyncHandler(async (req: any, res) => {
  const { id } = req.params
  const userId = req.user.id

  // Verify resource exists and user has access
  const resource = await prisma.resource.findFirst({
    where: { id, createdById: userId },
    include: {
      resourceSet: {
        include: {
          task: { select: { userId: true } },
          event: { select: { userId: true } }
        }
      }
    }
  })

  if (!resource) {
    throw createError(404, 'Resource not found')
  }

  // Check if user owns the task or event
  const isOwner = (resource.resourceSet.task?.userId === userId) || (resource.resourceSet.event?.userId === userId)
  if (!isOwner) {
    throw createError(403, 'Access denied')
  }

  // Delete the resource
  await prisma.resource.delete({
    where: { id }
  })

  // If this was the selected resource, update the resource set
  if (resource.isSelected) {
    const resourceSet = await prisma.resourceSet.findUnique({
      where: { id: resource.resourceSetId },
      include: { resources: true }
    })

    if (resourceSet) {
      const nextSelected = resourceSet.resources.find(r => r.id !== id)
      await prisma.resourceSet.update({
        where: { id: resource.resourceSetId },
        data: {
          selectedResourceId: nextSelected?.id || null
        }
      })

      if (nextSelected) {
        await prisma.resource.update({
          where: { id: nextSelected.id },
          data: { isSelected: true }
        })
      }
    }
  }

  res.json({
    success: true,
    message: 'Resource deleted successfully'
  })
}))

// GET /events/:id/assets - Get all resources for an event (grouped by task)
router.get('/events/:id/assets', authenticateToken, asyncHandler(async (req: any, res) => {
  const { id } = req.params
  const userId = req.user.id

  // Verify event belongs to user
  const event = await prisma.event.findFirst({
    where: { id, userId },
    include: {
      preparationTasks: {
        include: {
          resourceSet: {
            include: {
              resources: {
                orderBy: [
                  { isSelected: 'desc' },
                  { createdAt: 'desc' }
                ]
              }
            }
          }
        }
      },
      resourceSet: {
        include: {
          resources: {
            orderBy: [
              { isSelected: 'desc' },
              { createdAt: 'desc' }
            ]
          }
        }
      }
    }
  })

  if (!event) {
    throw createError(404, 'Event not found')
  }

  const assets = []

  // Add event-level resources
  if (event.resourceSet?.resources.length) {
    assets.push({
      type: 'event',
      taskId: null,
      taskTitle: event.title,
      resources: event.resourceSet.resources.map(resource => ({
        id: resource.id,
        kind: resource.kind,
        urlOrKey: resource.urlOrKey,
        title: resource.title,
        previewImage: resource.previewImage,
        domain: resource.domain,
        merchant: resource.merchant,
        priceCents: resource.priceCents,
        note: resource.note,
        tags: JSON.parse(resource.tags || '[]'),
        isSelected: resource.isSelected,
        createdAt: resource.createdAt
      }))
    })
  }

  // Add task-level resources
  event.preparationTasks.forEach(task => {
    if (task.resourceSet?.resources.length) {
      assets.push({
        type: 'task',
        taskId: task.id,
        taskTitle: task.title,
        resources: task.resourceSet.resources.map(resource => ({
          id: resource.id,
          kind: resource.kind,
          urlOrKey: resource.urlOrKey,
          title: resource.title,
          previewImage: resource.previewImage,
          domain: resource.domain,
          merchant: resource.merchant,
          priceCents: resource.priceCents,
          note: resource.note,
          tags: JSON.parse(resource.tags || '[]'),
          isSelected: resource.isSelected,
          createdAt: resource.createdAt
        }))
      })
    }
  })

  res.json({
    success: true,
    data: {
      eventId: event.id,
      eventTitle: event.title,
      assets
    }
  })
}))

// GET /me/resources - Get all resources for the current user
router.get('/me/resources', authenticateToken, asyncHandler(async (req: any, res) => {
  const userId = req.user.id
  const { 
    page = 1, 
    limit = 50, 
    kind, 
    tags, 
    domain, 
    selectedOnly,
    search 
  } = req.query

  const skip = (page - 1) * limit

  const where: any = {
    createdById: userId
  }

  // Apply filters
  if (kind) {
    where.kind = kind
  }

  if (selectedOnly === 'true') {
    where.isSelected = true
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { note: { contains: search } },
      { domain: { contains: search } }
    ]
  }

  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags]
    where.tags = {
      hasSome: tagArray
    }
  }

  if (domain) {
    where.domain = domain
  }

  const [resources, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      include: {
        resourceSet: {
          include: {
            task: {
              select: { id: true, title: true }
            },
            event: {
              select: { id: true, title: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.resource.count({ where })
  ])

  const formattedResources = resources.map(resource => ({
    id: resource.id,
    kind: resource.kind,
    urlOrKey: resource.urlOrKey,
    title: resource.title,
    previewImage: resource.previewImage,
    domain: resource.domain,
    merchant: resource.merchant,
    priceCents: resource.priceCents,
    note: resource.note,
    tags: JSON.parse(resource.tags || '[]'),
    isSelected: resource.isSelected,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
    taskTitle: resource.resourceSet.task?.title,
    eventTitle: resource.resourceSet.event?.title
  }))

  res.json({
    success: true,
    data: {
      resources: formattedResources,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
}))

export default router
