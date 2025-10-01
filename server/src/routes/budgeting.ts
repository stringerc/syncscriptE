import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { transactionService } from '../services/transactionService';
import { budgetService } from '../services/budgetService';
import { forecastingService } from '../services/forecastingService';
import { budgetAlertService } from '../services/budgetAlertService';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// ============================================================
// TRANSACTION ROUTES
// ============================================================

// POST /api/budgeting/transactions/sync - Sync transactions from Plaid
router.post('/transactions/sync', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { startDate, endDate, accountIds } = req.body;

  const result = await transactionService.syncTransactions(
    userId,
    new Date(startDate || Date.now() - 30 * 24 * 60 * 60 * 1000), // Default: last 30 days
    new Date(endDate || Date.now()),
    accountIds
  );

  res.json({
    success: true,
    data: result,
    message: `Synced ${result.created} new transactions, updated ${result.updated}`
  });
}));

// GET /api/budgeting/transactions - Get user transactions with filtering
router.get('/transactions', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const {
    startDate,
    endDate,
    category,
    merchantName,
    minAmount,
    maxAmount,
    linkedEventId,
    linkedProjectId,
    page = '1',
    limit = '50'
  } = req.query;

  const filters: any = {};
  if (startDate) filters.startDate = new Date(startDate as string);
  if (endDate) filters.endDate = new Date(endDate as string);
  if (category) filters.category = category as string;
  if (merchantName) filters.merchantName = merchantName as string;
  if (minAmount) filters.minAmount = parseFloat(minAmount as string);
  if (maxAmount) filters.maxAmount = parseFloat(maxAmount as string);
  if (linkedEventId) filters.linkedEventId = linkedEventId as string;
  if (linkedProjectId) filters.linkedProjectId = linkedProjectId as string;

  const result = await transactionService.getTransactions(
    userId,
    filters,
    parseInt(page as string),
    parseInt(limit as string)
  );

  res.json({
    success: true,
    data: result
  });
}));

// PATCH /api/budgeting/transactions/:id/category - Update transaction category
router.patch('/transactions/:id/category', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { category, subcategory } = req.body;

  await transactionService.updateTransactionCategory(id, userId, category, subcategory);

  res.json({
    success: true,
    message: 'Transaction category updated'
  });
}));

// POST /api/budgeting/transactions/:id/link - Link transaction to event/project
router.post('/transactions/:id/link', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { linkedId, type } = req.body;

  if (!['event', 'project'].includes(type)) {
    return res.status(400).json({
      success: false,
      error: 'Type must be either "event" or "project"'
    });
  }

  await transactionService.linkTransaction(id, userId, linkedId, type);

  res.json({
    success: true,
    message: `Transaction linked to ${type}`
  });
}));

// POST /api/budgeting/transactions/detect-recurring - Detect recurring transactions
router.post('/transactions/detect-recurring', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  await transactionService.detectRecurringTransactions(userId);

  res.json({
    success: true,
    message: 'Recurring transaction detection complete'
  });
}));

// ============================================================
// BUDGET ROUTES
// ============================================================

// POST /api/budgeting/budgets - Create new budget
router.post('/budgets', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  
  const schema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    period: z.enum(['WEEKLY', 'MONTHLY', 'ANNUAL']),
    startDate: z.string(),
    endDate: z.string().optional(),
    totalIncome: z.number().optional(),
    totalBudget: z.number(),
    rolloverEnabled: z.boolean().optional(),
    categories: z.array(z.object({
      name: z.string(),
      description: z.string().optional(),
      budgetedAmount: z.number(),
      icon: z.string().optional(),
      color: z.string().optional(),
      categoryType: z.enum(['EXPENSE', 'INCOME', 'SAVINGS']).optional()
    }))
  });

  const data = schema.parse(req.body);

  const budget = await budgetService.createBudget(userId, {
    ...data,
    startDate: new Date(data.startDate),
    endDate: data.endDate ? new Date(data.endDate) : undefined
  });

  res.status(201).json({
    success: true,
    data: { budget },
    message: 'Budget created successfully'
  });
}));

// GET /api/budgeting/budgets - Get all user budgets
router.get('/budgets', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const includeInactive = req.query.includeInactive === 'true';

  const budgets = await budgetService.getUserBudgets(userId, includeInactive);

  res.json({
    success: true,
    data: { budgets }
  });
}));

// GET /api/budgeting/budgets/:id - Get budget details
router.get('/budgets/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const status = await budgetService.getBudgetStatus(id, userId);

  res.json({
    success: true,
    data: status
  });
}));

// PUT /api/budgeting/budgets/:id - Update budget
router.put('/budgets/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const budget = await budgetService.updateBudget(id, userId, req.body);

  res.json({
    success: true,
    data: { budget },
    message: 'Budget updated successfully'
  });
}));

// POST /api/budgeting/budgets/:id/rollover - Rollover budget to next period
router.post('/budgets/:id/rollover', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const newBudget = await budgetService.rolloverBudget(id, userId);

  res.json({
    success: true,
    data: { budget: newBudget },
    message: 'Budget rolled over to next period'
  });
}));

// GET /api/budgeting/budgets/:id/comparison - Get budget comparison
router.get('/budgets/:id/comparison', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const comparison = await budgetService.getBudgetComparison(userId, id);

  res.json({
    success: true,
    data: { comparison }
  });
}));

// POST /api/budgeting/budgets/:id/share - Share budget with users
router.post('/budgets/:id/share', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { userIds } = req.body;

  if (!Array.isArray(userIds)) {
    return res.status(400).json({
      success: false,
      error: 'userIds must be an array'
    });
  }

  const budget = await budgetService.shareBudget(id, userId, userIds);

  res.json({
    success: true,
    data: { budget },
    message: 'Budget shared successfully'
  });
}));

// GET /api/budgeting/budgets/:id/breakdown/me - Get personal spending breakdown
router.get('/budgets/:id/breakdown/me', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const breakdown = await budgetService.getPersonalBreakdown(id, userId);

  res.json({
    success: true,
    data: breakdown
  });
}));

// ============================================================
// CATEGORY ROUTES
// ============================================================

// POST /api/budgeting/budgets/:id/categories - Add category to budget
router.post('/budgets/:id/categories', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const schema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    budgetedAmount: z.number(),
    icon: z.string().optional(),
    color: z.string().optional(),
    categoryType: z.enum(['EXPENSE', 'INCOME', 'SAVINGS']).optional()
  });

  const data = schema.parse(req.body);

  const category = await budgetService.addCategory(id, userId, data);

  res.status(201).json({
    success: true,
    data: { category },
    message: 'Category added successfully'
  });
}));

// PUT /api/budgeting/categories/:id - Update budget category
router.put('/categories/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const category = await budgetService.updateCategory(id, userId, req.body);

  res.json({
    success: true,
    data: { category },
    message: 'Category updated successfully'
  });
}));

// DELETE /api/budgeting/categories/:id - Delete budget category
router.delete('/categories/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  await budgetService.deleteCategory(id, userId);

  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
}));

// ============================================================
// SAVINGS GOAL ROUTES
// ============================================================

// POST /api/budgeting/savings-goals - Create savings goal
router.post('/savings-goals', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const schema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    targetAmount: z.number(),
    currentAmount: z.number().optional(),
    targetDate: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    monthlyContribution: z.number().optional(),
    icon: z.string().optional(),
    color: z.string().optional()
  });

  const data = schema.parse(req.body);

  const goal = await prisma.savingsGoal.create({
    data: {
      userId,
      ...data,
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined
    }
  });

  res.status(201).json({
    success: true,
    data: { goal },
    message: 'Savings goal created successfully'
  });
}));

// GET /api/budgeting/savings-goals - Get all savings goals
router.get('/savings-goals', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const goals = await prisma.savingsGoal.findMany({
    where: { userId },
    orderBy: [
      { isCompleted: 'asc' },
      { priority: 'desc' },
      { targetDate: 'asc' }
    ]
  });

  res.json({
    success: true,
    data: { goals }
  });
}));

// PUT /api/budgeting/savings-goals/:id - Update savings goal
router.put('/savings-goals/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const goal = await prisma.savingsGoal.findFirst({
    where: { id, userId }
  });

  if (!goal) {
    return res.status(404).json({
      success: false,
      error: 'Savings goal not found'
    });
  }

  const updated = await prisma.savingsGoal.update({
    where: { id },
    data: {
      ...req.body,
      ...(req.body.targetDate && { targetDate: new Date(req.body.targetDate) })
    }
  });

  res.json({
    success: true,
    data: { goal: updated },
    message: 'Savings goal updated successfully'
  });
}));

// POST /api/budgeting/savings-goals/:id/contribute - Add contribution to goal
router.post('/savings-goals/:id/contribute', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { amount } = req.body;

  const goal = await prisma.savingsGoal.findFirst({
    where: { id, userId }
  });

  if (!goal) {
    return res.status(404).json({
      success: false,
      error: 'Savings goal not found'
    });
  }

  const newAmount = goal.currentAmount + amount;
  const isCompleted = newAmount >= goal.targetAmount;

  const updated = await prisma.savingsGoal.update({
    where: { id },
    data: {
      currentAmount: newAmount,
      ...(isCompleted && {
        isCompleted: true,
        completedAt: new Date()
      })
    }
  });

  // Send notification if goal completed
  if (isCompleted) {
    await prisma.notification.create({
      data: {
        userId,
        type: 'SAVINGS_GOAL_COMPLETE',
        title: '🎉 Savings Goal Achieved!',
        message: `Congratulations! You've reached your savings goal: ${goal.name}`,
        priority: 'high',
        actionUrl: '/financial?tab=goals'
      }
    });
  }

  res.json({
    success: true,
    data: { goal: updated },
    message: isCompleted ? 'Goal achieved!' : 'Contribution added successfully'
  });
}));

// DELETE /api/budgeting/savings-goals/:id - Delete savings goal
router.delete('/savings-goals/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const goal = await prisma.savingsGoal.findFirst({
    where: { id, userId }
  });

  if (!goal) {
    return res.status(404).json({
      success: false,
      error: 'Savings goal not found'
    });
  }

  await prisma.savingsGoal.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Savings goal deleted successfully'
  });
}));

// ============================================================
// FORECASTING & ANALYTICS ROUTES
// ============================================================

// GET /api/budgeting/budgets/:id/forecast - Get spending forecast
router.get('/budgets/:id/forecast', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const forecast = await forecastingService.generateForecast(userId, id);

  res.json({
    success: true,
    data: { forecast }
  });
}));

// GET /api/budgeting/anomalies - Detect unusual spending
router.get('/anomalies', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const anomalies = await forecastingService.detectAnomalies(userId);

  res.json({
    success: true,
    data: { anomalies }
  });
}));

// POST /api/budgeting/alerts/check - Manually trigger alert check
router.post('/alerts/check', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  // Get user's alerts and check them
  const alerts = await prisma.budgetAlert.findMany({
    where: { userId, isActive: true },
    include: {
      budget: {
        include: { categories: true }
      }
    }
  });

  let triggered = 0;
  for (const alert of alerts) {
    const result = await budgetAlertService.checkAlert(alert);
    if (result) triggered++;
  }

  res.json({
    success: true,
    data: { alertsTriggered: triggered },
    message: `Checked ${alerts.length} alerts, ${triggered} triggered`
  });
}));

export default router;

