import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { Priority, TaskStatus } from '../types';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  dueDate: z.string().datetime().optional(),
  estimatedDuration: z.number().min(0).optional(),
  energyRequired: z.number().min(1).max(10).optional(),
  budgetImpact: z.number().optional(),
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
  sortBy: z.enum(['createdAt', 'dueDate', 'priority', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Get all tasks with filtering and pagination
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const query = querySchema.parse(req.query);
  const { page, limit, status, priority, tags, search, sortBy, sortOrder } = query;

  const skip = (page - 1) * limit;
  const tagArray = tags ? tags.split(',').map(t => t.trim()) : undefined;

  const where: any = {
    userId: req.user!.id
  };

  if (status) where.status = status;
  if (priority) where.priority = priority;
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
      ...taskData,
      userId: req.user!.id,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      tags: taskData.tags || null,
      subtasks: {
        create: taskData.subtasks.map((subtask, index) => ({
          ...subtask,
          order: index
        }))
      }
    },
    include: {
      subtasks: { orderBy: { order: 'asc' } }
    }
  });

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

// Delete task
router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const task = await prisma.task.findFirst({
    where: {
      id,
      userId: req.user!.id
    }
  });

  if (!task) {
    throw createError('Task not found', 404);
  }

  await prisma.task.delete({
    where: { id }
  });

  logger.info('Task deleted', { userId: req.user!.id, taskId: id });

  res.json({
    success: true,
    message: 'Task deleted successfully'
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

  logger.info('Task completed', { userId: req.user!.id, taskId: id });

  res.json({
    success: true,
    data: updatedTask,
    message: 'Task completed successfully'
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

// Delete task
router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
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

  await prisma.task.delete({
    where: {
      id,
      userId: req.user!.id
    }
  });

  logger.info('Task deleted', { userId: req.user!.id, taskId: id });

  res.json({
    success: true,
    message: 'Task deleted successfully'
  });
}));

export default router;
