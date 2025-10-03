import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { BudgetService } from '../services/budgetService';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * Get task budget
 */
router.get('/tasks/:taskId', authenticateToken, asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user!.id;

  try {
    // Get task budget details first
    const taskBudget = await prisma.taskBudget.findUnique({
      where: { taskId },
      include: {
        lineItems: {
          include: { category: true }
        }
      }
    });

    // If no budget exists, return empty structure
    if (!taskBudget) {
      return res.json({
        success: true,
        data: {
          totals: {
            taskId,
            mode: 'total',
            includeInEvent: true,
            lineItemsCount: 0,
            estimatedCents: 0,
            actualCents: 0,
            varianceCents: 0,
            variancePercentage: 0,
          },
          budget: null,
        }
      });
    }

    // Calculate totals if budget exists
    const totals = await BudgetService.calculateTaskBudgetTotals(taskId);

    res.json({
      success: true,
      data: {
        totals,
        budget: taskBudget,
      }
    });
  } catch (error: any) {
    logger.error('Error fetching task budget:', error);
    throw createError(error.message || 'Failed to fetch task budget', 500);
  }
}));

/**
 * Create or update task budget
 */
router.put('/tasks/:taskId', authenticateToken, asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user!.id;
  const budgetData = req.body;

  try {
    const totals = await BudgetService.upsertTaskBudget(taskId, userId, budgetData);
    
    // Get the updated budget details to return complete structure
    const taskBudget = await prisma.taskBudget.findUnique({
      where: { taskId },
      include: {
        lineItems: {
          include: { category: true }
        }
      }
    });
    
    res.json({
      success: true,
      data: {
        totals,
        budget: taskBudget,
      }
    });
  } catch (error: any) {
    logger.error('Error upserting task budget:', error);
    throw createError(error.message || 'Failed to save task budget', 500);
  }
}));

/**
 * Update task budget line items
 */
router.post('/tasks/:taskId/budget/lines', authenticateToken, asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user!.id;
  const { lineItems } = req.body;

  try {
    const totals = await BudgetService.upsertTaskBudget(taskId, userId, {
      mode: 'lines',
      lineItems,
    });
    
    // Get the updated budget details to return complete structure
    const taskBudget = await prisma.taskBudget.findUnique({
      where: { taskId },
      include: {
        lineItems: {
          include: { category: true }
        }
      }
    });
    
    res.json({
      success: true,
      data: {
        totals,
        budget: taskBudget,
      }
    });
  } catch (error: any) {
    logger.error('Error updating task budget lines:', error);
    throw createError(error.message || 'Failed to update budget lines', 500);
  }
}));

/**
 * Set task budget actual amounts
 */
router.post('/tasks/:taskId/budget/actual', authenticateToken, asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user!.id;
  const { actualCents, lineItemActuals } = req.body;

  try {
    // Update task budget actual
    if (actualCents !== undefined) {
      await prisma.taskBudget.updateMany({
        where: { taskId },
        data: { actualCents }
      });
    }

    // Update line item actuals
    if (lineItemActuals) {
      for (const { id, isActual } of lineItemActuals) {
        await prisma.budgetLineItem.updateMany({
          where: { id },
          data: { isActual }
        });
      }
    }

    const totals = await BudgetService.calculateTaskBudgetTotals(taskId);
    
    // Get the updated budget details to return complete structure
    const taskBudget = await prisma.taskBudget.findUnique({
      where: { taskId },
      include: {
        lineItems: {
          include: { category: true }
        }
      }
    });
    
    res.json({
      success: true,
      data: {
        totals,
        budget: taskBudget,
      }
    });
  } catch (error: any) {
    logger.error('Error setting task budget actuals:', error);
    throw createError(error.message || 'Failed to set actual amounts', 500);
  }
}));

/**
 * Toggle task budget include in event
 */
router.patch('/tasks/:taskId/budget/include', authenticateToken, asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user!.id;
  const { includeInEvent } = req.body;

  try {
    await prisma.taskBudget.updateMany({
      where: { taskId },
      data: { includeInEvent }
    });

    const totals = await BudgetService.calculateTaskBudgetTotals(taskId);
    
    res.json({
      success: true,
      data: { totals }
    });
  } catch (error: any) {
    logger.error('Error toggling task budget include:', error);
    throw createError(error.message || 'Failed to update include setting', 500);
  }
}));

/**
 * Get event budget envelope
 */
router.get('/events/:eventId/envelope', authenticateToken, asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user!.id;

  try {
    // Verify event ownership
    const event = await prisma.event.findFirst({
      where: { id: eventId, userId }
    });

    if (!event) {
      throw createError('Event not found or access denied', 404);
    }

    // Get or create budget envelope
    let envelope = await prisma.budgetEnvelope.findUnique({
      where: { eventId },
      include: {
        eventItems: {
          include: { category: true }
        }
      }
    });

    if (!envelope) {
      // Create default envelope if it doesn't exist
      envelope = await prisma.budgetEnvelope.create({
        data: {
          eventId,
          currency: 'USD',
          capCents: null
        },
        include: {
          eventItems: {
            include: { category: true }
          }
        }
      });
    }

    const totals = await BudgetService.calculateEventBudgetTotals(eventId);
    
    res.json({
      success: true,
      data: {
        envelope,
        totals
      }
    });
  } catch (error: any) {
    logger.error('Error fetching event budget envelope:', error);
    throw createError(error.message || 'Failed to fetch event budget envelope', 500);
  }
}));

/**
 * Get event budget rollup
 */
router.get('/events/:eventId/budget/rollup', authenticateToken, asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user!.id;

  try {
    const totals = await BudgetService.calculateEventBudgetTotals(eventId);
    
    res.json({
      success: true,
      data: { totals }
    });
  } catch (error: any) {
    logger.error('Error fetching event budget rollup:', error);
    throw createError(error.message || 'Failed to fetch event budget', 500);
  }
}));

/**
 * Add event budget item
 */
router.post('/events/:eventId/budget/items', authenticateToken, asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user!.id;
  const itemData = req.body;

  try {
    await BudgetService.addEventBudgetItem(eventId, userId, itemData);
    const totals = await BudgetService.calculateEventBudgetTotals(eventId);
    
    res.json({
      success: true,
      data: { totals }
    });
  } catch (error: any) {
    logger.error('Error adding event budget item:', error);
    throw createError(error.message || 'Failed to add budget item', 500);
  }
}));

/**
 * Update event budget item
 */
router.patch('/events/:eventId/budget/items/:itemId', authenticateToken, asyncHandler(async (req, res) => {
  const { eventId, itemId } = req.params;
  const userId = req.user!.id;
  const updateData = req.body;

  try {
    // Verify event ownership
    const event = await prisma.event.findFirst({
      where: { id: eventId, userId }
    });

    if (!event) {
      throw createError('Event not found or access denied', 404);
    }

    await prisma.eventBudgetItem.updateMany({
      where: { id: itemId, eventId },
      data: updateData
    });

    const totals = await BudgetService.calculateEventBudgetTotals(eventId);
    
    res.json({
      success: true,
      data: { totals }
    });
  } catch (error: any) {
    logger.error('Error updating event budget item:', error);
    throw createError(error.message || 'Failed to update budget item', 500);
  }
}));

/**
 * Delete event budget item
 */
router.delete('/events/:eventId/budget/items/:itemId', authenticateToken, asyncHandler(async (req, res) => {
  const { eventId, itemId } = req.params;
  const userId = req.user!.id;

  try {
    // Verify event ownership
    const event = await prisma.event.findFirst({
      where: { id: eventId, userId }
    });

    if (!event) {
      throw createError('Event not found or access denied', 404);
    }

    await prisma.eventBudgetItem.deleteMany({
      where: { id: itemId, eventId }
    });

    const totals = await BudgetService.calculateEventBudgetTotals(eventId);
    
    res.json({
      success: true,
      data: { totals }
    });
  } catch (error: any) {
    logger.error('Error deleting event budget item:', error);
    throw createError(error.message || 'Failed to delete budget item', 500);
  }
}));

/**
 * Set event budget cap
 */
router.patch('/events/:eventId/budget/cap', authenticateToken, asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user!.id;
  const { capCents, currency } = req.body;

  try {
    await BudgetService.upsertEventBudgetEnvelope(eventId, userId, capCents, currency);
    const totals = await BudgetService.calculateEventBudgetTotals(eventId);
    
    res.json({
      success: true,
      data: { totals }
    });
  } catch (error: any) {
    logger.error('Error setting event budget cap:', error);
    throw createError(error.message || 'Failed to set budget cap', 500);
  }
}));

/**
 * Parse budget list from text
 */
router.post('/budget/parse-list', authenticateToken, asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    throw createError('Text is required', 400);
  }

  try {
    const parsedItems = BudgetService.parseBudgetList(text);
    
    res.json({
      success: true,
      data: { items: parsedItems }
    });
  } catch (error: any) {
    logger.error('Error parsing budget list:', error);
    throw createError(error.message || 'Failed to parse budget list', 500);
  }
}));

/**
 * Get budget categories
 */
router.get('/categories', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { projectId } = req.query;

  try {
    const categories = await BudgetService.getBudgetCategories(userId, projectId as string);
    
    res.json({
      success: true,
      data: { categories }
    });
  } catch (error: any) {
    logger.error('Error fetching budget categories:', error);
    throw createError(error.message || 'Failed to fetch budget categories', 500);
  }
}));

/**
 * Create budget category
 */
router.post('/categories', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { name, projectId, color, icon } = req.body;

  if (!name) {
    throw createError('Category name is required', 400);
  }

  try {
    const category = await BudgetService.createBudgetCategory(userId, name, projectId, color, icon);
    
    res.json({
      success: true,
      data: { category }
    });
  } catch (error: any) {
    logger.error('Error creating budget category:', error);
    throw createError(error.message || 'Failed to create budget category', 500);
  }
}));

/**
 * Create line item for task budget
 */
router.post('/tasks/:taskId/line-items', authenticateToken, asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user!.id;
  const lineItemData = req.body;

  try {
    // Ensure task budget exists
    let taskBudget = await prisma.taskBudget.findUnique({
      where: { taskId }
    });

    if (!taskBudget) {
      // Create task budget if it doesn't exist
      taskBudget = await prisma.taskBudget.create({
        data: {
          taskId,
          mode: 'lines',
          estimatedCents: 0,
          taxCents: 0,
          shippingCents: 0
        }
      });
    }

    // Create line item
    const lineItem = await prisma.budgetLineItem.create({
      data: {
        taskBudgetId: taskBudget.id,
        name: lineItemData.name,
        url: lineItemData.url,
        qty: lineItemData.qty || 1,
        unitPriceCents: Math.round((lineItemData.unitPriceCents || 0) * 100),
        categoryId: lineItemData.categoryId,
        notes: lineItemData.notes,
        isActual: lineItemData.isActual || false
      },
      include: {
        category: true
      }
    });

    res.status(201).json({
      success: true,
      data: { lineItem }
    });
  } catch (error: any) {
    logger.error('Error creating line item:', error);
    throw createError(error.message || 'Failed to create line item', 500);
  }
}));

/**
 * Update line item
 */
router.put('/line-items/:itemId', authenticateToken, asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const userId = req.user!.id;
  const updateData = req.body;

  try {
    const lineItem = await prisma.budgetLineItem.update({
      where: { id: itemId },
      data: {
        name: updateData.name,
        url: updateData.url,
        qty: updateData.qty,
        unitPriceCents: updateData.unitPriceCents ? Math.round(updateData.unitPriceCents * 100) : undefined,
        categoryId: updateData.categoryId,
        notes: updateData.notes,
        isActual: updateData.isActual
      },
      include: {
        category: true
      }
    });

    res.json({
      success: true,
      data: { lineItem }
    });
  } catch (error: any) {
    logger.error('Error updating line item:', error);
    throw createError(error.message || 'Failed to update line item', 500);
  }
}));

/**
 * Delete line item
 */
router.delete('/line-items/:itemId', authenticateToken, asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const userId = req.user!.id;

  try {
    await prisma.budgetLineItem.delete({
      where: { id: itemId }
    });

    res.json({
      success: true,
      message: 'Line item deleted successfully'
    });
  } catch (error: any) {
    logger.error('Error deleting line item:', error);
    throw createError(error.message || 'Failed to delete line item', 500);
  }
}));

export default router;
