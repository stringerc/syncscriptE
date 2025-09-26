import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { Priority, TaskStatus } from '../types';
import GamificationService from '../services/gamificationService';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  dueDate: z.string().datetime().optional(),
  estimatedDuration: z.number().min(0).optional(),
  energyRequired: z.number().min(1).max(10).nullish(),
  budgetImpact: z.number().optional(),
  notes: z.string().nullish(),
  location: z.string().nullish(),
  tags: z.string().optional(),
  subtasks: z.array(z.object({
    title: z.string().min(1, 'Subtask title is required'),
    order: z.number().default(0)
  })).default([])
});

const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.nativeEnum(TaskStatus).optional(),
  actualDuration: z.number().positive().optional(),
  scheduledAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional()
});

const querySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  tags: z.string().optional(), // comma-separated tags
  search: z.string().optional(),
  eventId: z.string().optional(), // filter by event ID
  sortBy: z.enum(['createdAt', 'dueDate', 'priority', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeDeleted: z.union([z.string(), z.boolean()]).optional().transform(val => {
    if (typeof val === 'boolean') return val;
    return val === 'true';
  }).default(false) // include deleted tasks
});

// Get all tasks with filtering and pagination
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const query = querySchema.parse(req.query);
  const { page, limit, status, priority, tags, search, eventId, sortBy, sortOrder, includeDeleted } = query;

  const skip = (page - 1) * limit;
  const tagArray = tags ? tags.split(',').map(t => t.trim()) : undefined;

  const where: any = {
    userId: req.user!.id
  };

  // Exclude deleted tasks by default
  if (!includeDeleted) {
    where.deletedAt = null;
  }

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (eventId) where.eventId = eventId;
  if (tagArray && tagArray.length > 0) {
    where.tags = { hasSome: tagArray };
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        subtasks: { orderBy: { order: 'asc' } }
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit
    }),
    prisma.task.count({ where })
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  });
}));

// Get deleted tasks (must come before /:id route)
router.get('/deleted', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const tasks = await prisma.task.findMany({
    where: {
      userId: req.user!.id,
      deletedAt: { not: null }
    },
    include: {
      subtasks: { orderBy: { order: 'asc' } }
    },
    orderBy: { deletedAt: 'desc' } // Most recently deleted first
  });

  res.json({
    success: true,
    data: tasks
  });
}));

// Get task by ID
router.get('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const task = await prisma.task.findFirst({
    where: {
      id,
      userId: req.user!.id
    },
    include: {
      subtasks: { orderBy: { order: 'asc' } }
    }
  });

  if (!task) {
    throw createError('Task not found', 404);
  }

  res.json({
    success: true,
    data: task
  });
}));

// Create new task
router.post('/', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const taskData = createTaskSchema.parse(req.body);

  const task = await prisma.task.create({
    data: {
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      estimatedDuration: taskData.estimatedDuration,
      energyRequired: taskData.energyRequired,
      budgetImpact: taskData.budgetImpact,
      userId: req.user!.id,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      tags: taskData.tags || null,
      subtasks: {
        create: taskData.subtasks.map((subtask, index) => ({
          title: subtask.title,
          order: index
        }))
      }
    },
    include: {
      subtasks: { orderBy: { order: 'asc' } }
    }
  });

  // Trigger gamification event
  try {
    await GamificationService.processEvent({
      userId: req.user!.id,
      type: 'task_created',
      data: {
        taskId: task.id,
        priority: task.priority,
        estimatedDuration: task.estimatedDuration
      }
    });
  } catch (error) {
    logger.error('Gamification event failed:', error);
    // Don't fail the task creation if gamification fails
  }

  logger.info('Task created', { userId: req.user!.id, taskId: task.id });

  res.status(201).json({
    success: true,
    data: task,
    message: 'Task created successfully'
  });
}));

// Update task
router.put('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const updateData = updateTaskSchema.parse(req.body);

  // Check if task exists and belongs to user
  const existingTask = await prisma.task.findFirst({
    where: {
      id,
      userId: req.user!.id
    }
  });

  if (!existingTask) {
    throw createError('Task not found', 404);
  }

  // Prepare update data
  const data: any = { ...updateData };
  if (data.dueDate) data.dueDate = new Date(data.dueDate);
  if (data.scheduledAt) data.scheduledAt = new Date(data.scheduledAt);
  if (data.completedAt) data.completedAt = new Date(data.completedAt);

  // Update subtasks if provided
  if (updateData.subtasks) {
    // Delete existing subtasks
    await prisma.subtask.deleteMany({
      where: { taskId: id }
    });

    // Create new subtasks
    data.subtasks = {
      create: updateData.subtasks.map((subtask, index) => ({
        ...subtask,
        order: index
      }))
    };
  }

  const task = await prisma.task.update({
    where: { id },
    data,
    include: {
      subtasks: { orderBy: { order: 'asc' } }
    }
  });

  logger.info('Task updated', { userId: req.user!.id, taskId: task.id });

  res.json({
    success: true,
    data: task,
    message: 'Task updated successfully'
  });
}));


// Complete task
router.patch('/:id/complete', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { actualDuration } = req.body;

  const task = await prisma.task.findFirst({
    where: {
      id,
      userId: req.user!.id
    }
  });

  if (!task) {
    throw createError('Task not found', 404);
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      status: TaskStatus.COMPLETED,
      completedAt: new Date(),
      actualDuration: actualDuration || undefined
    },
    include: {
      subtasks: { orderBy: { order: 'asc' } }
    }
  });

  // Update all subtasks to completed
  await prisma.subtask.updateMany({
    where: { taskId: id },
    data: { completed: true }
  });

  // Trigger gamification event
  try {
    await GamificationService.processEvent({
      userId: req.user!.id,
      type: 'task_completed',
      data: {
        taskId: id,
        duration: actualDuration,
        priority: task.priority,
        completedAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Gamification event failed:', error);
    // Don't fail the task completion if gamification fails
  }

  logger.info('Task completed', { userId: req.user!.id, taskId: id });

  res.json({
    success: true,
    data: updatedTask,
    message: 'Task completed successfully'
  });
}));

// Update task status
router.patch('/:id/status', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Validate status
  if (!Object.values(TaskStatus).includes(status)) {
    throw createError('Invalid status', 400);
  }

  const task = await prisma.task.findFirst({
    where: {
      id,
      userId: req.user!.id
    }
  });

  if (!task) {
    throw createError('Task not found', 404);
  }

  const updateData: any = { status };
  
  // Set completedAt when marking as completed
  if (status === TaskStatus.COMPLETED) {
    updateData.completedAt = new Date();
  }
  
  // Clear completedAt when changing from completed to another status
  if (task.status === TaskStatus.COMPLETED && status !== TaskStatus.COMPLETED) {
    updateData.completedAt = null;
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: updateData,
    include: {
      subtasks: { orderBy: { order: 'asc' } }
    }
  });

  logger.info('Task status updated', { 
    userId: req.user!.id, 
    taskId: id, 
    oldStatus: task.status, 
    newStatus: status 
  });

  res.json({
    success: true,
    data: updatedTask,
    message: `Task status updated to ${status}`
  });
}));

// Get today's tasks
router.get('/today', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tasks = await prisma.task.findMany({
    where: {
      userId: req.user!.id,
      status: { not: TaskStatus.COMPLETED },
      OR: [
        { dueDate: { gte: today, lt: tomorrow } },
        { scheduledAt: { gte: today, lt: tomorrow } },
        { dueDate: null, scheduledAt: null } // Tasks without specific dates
      ]
    },
    include: {
      subtasks: { orderBy: { order: 'asc' } }
    },
    orderBy: [
      { priority: 'desc' },
      { dueDate: 'asc' },
      { createdAt: 'asc' }
    ]
  });

  res.json({
    success: true,
    data: tasks
  });
}));

// Get overdue tasks
router.get('/overdue', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const now = new Date();

  const tasks = await prisma.task.findMany({
    where: {
      userId: req.user!.id,
      status: { not: TaskStatus.COMPLETED },
      dueDate: { lt: now }
    },
    include: {
      subtasks: { orderBy: { order: 'asc' } }
    },
    orderBy: [
      { dueDate: 'asc' },
      { priority: 'desc' }
    ]
  });

  res.json({
    success: true,
    data: tasks
  });
}));

// Bulk update task priorities
router.patch('/bulk-priority', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { taskIds, priority } = req.body;

  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    throw createError('Task IDs array is required', 400);
  }

  if (!Object.values(Priority).includes(priority)) {
    throw createError('Invalid priority value', 400);
  }

  const result = await prisma.task.updateMany({
    where: {
      id: { in: taskIds },
      userId: req.user!.id
    },
    data: { priority }
  });

  logger.info('Bulk priority update', { 
    userId: req.user!.id, 
    taskCount: result.count,
    priority 
  });

  res.json({
    success: true,
    data: { updatedCount: result.count },
    message: `Updated priority for ${result.count} tasks`
  });
}));

// Soft delete task
router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const task = await prisma.task.findUnique({
    where: {
      id,
      userId: req.user!.id,
      deletedAt: null // Only find non-deleted tasks
    }
  });

  if (!task) {
    throw createError('Task not found', 404);
  }

  await prisma.task.update({
    where: {
      id,
      userId: req.user!.id
    },
    data: {
      deletedAt: new Date()
    }
  });

  logger.info('Task soft deleted', { userId: req.user!.id, taskId: id });

  res.json({
    success: true,
    message: 'Task deleted successfully'
  });
}));

// Restore deleted task
router.patch('/:id/restore', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const task = await prisma.task.findUnique({
    where: {
      id,
      userId: req.user!.id
    }
  });

  if (!task) {
    throw createError('Task not found', 404);
  }

  if (!task.deletedAt) {
    throw createError('Task is not deleted', 400);
  }

  await prisma.task.update({
    where: {
      id,
      userId: req.user!.id
    },
    data: {
      deletedAt: null
    }
  });

  logger.info('Task restored', { userId: req.user!.id, taskId: id });

  res.json({
    success: true,
    message: 'Task restored successfully'
  });
}));

export default router;
