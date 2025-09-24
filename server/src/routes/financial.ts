import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createAccountSchema = z.object({
  plaidItemId: z.string().min(1, 'Plaid item ID is required'),
  accountId: z.string().min(1, 'Account ID is required'),
  accountName: z.string().min(1, 'Account name is required'),
  accountType: z.string().min(1, 'Account type is required'),
  balance: z.number().optional()
});

const updateAccountSchema = z.object({
  accountName: z.string().min(1).optional(),
  isActive: z.boolean().optional()
});

// Get all financial accounts
router.get('/accounts', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const accounts = await prisma.financialAccount.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: accounts
  });
}));

// Get account by ID
router.get('/accounts/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const account = await prisma.financialAccount.findFirst({
    where: {
      id,
      userId: req.user!.id
    }
  });

  if (!account) {
    throw createError('Account not found', 404);
  }

  res.json({
    success: true,
    data: account
  });
}));

// Create new financial account
router.post('/accounts', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const accountData = createAccountSchema.parse(req.body);

  const account = await prisma.financialAccount.create({
    data: {
      ...accountData,
      userId: req.user!.id
    }
  });

  logger.info('Financial account created', { userId: req.user!.id, accountId: account.id });

  res.status(201).json({
    success: true,
    data: account,
    message: 'Account created successfully'
  });
}));

// Update financial account
router.put('/accounts/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const updateData = updateAccountSchema.parse(req.body);

  const account = await prisma.financialAccount.findFirst({
    where: {
      id,
      userId: req.user!.id
    }
  });

  if (!account) {
    throw createError('Account not found', 404);
  }

  const updatedAccount = await prisma.financialAccount.update({
    where: { id },
    data: updateData
  });

  logger.info('Financial account updated', { userId: req.user!.id, accountId: account.id });

  res.json({
    success: true,
    data: updatedAccount,
    message: 'Account updated successfully'
  });
}));

// Delete financial account
router.delete('/accounts/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const account = await prisma.financialAccount.findFirst({
    where: {
      id,
      userId: req.user!.id
    }
  });

  if (!account) {
    throw createError('Account not found', 404);
  }

  await prisma.financialAccount.delete({
    where: { id }
  });

  logger.info('Financial account deleted', { userId: req.user!.id, accountId: id });

  res.json({
    success: true,
    message: 'Account deleted successfully'
  });
}));

// Get budget status
router.get('/budget-status', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { period = 'month' } = req.query;

  // Get all active accounts
  const accounts = await prisma.financialAccount.findMany({
    where: {
      userId: req.user!.id,
      isActive: true
    }
  });

  // Calculate total balance
  const totalBalance = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);

  // Get tasks and events with budget impact for the period
  const startDate = new Date();
  if (period === 'month') {
    startDate.setDate(1); // First day of month
  } else if (period === 'week') {
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek); // Start of week
  }

  const [tasksWithBudget, eventsWithBudget] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId: req.user!.id,
        createdAt: { gte: startDate },
        budgetImpact: { not: null }
      },
      select: {
        budgetImpact: true,
        status: true
      }
    }),
    prisma.event.findMany({
      where: {
        userId: req.user!.id,
        startTime: { gte: startDate },
        budgetImpact: { not: null }
      },
      select: {
        budgetImpact: true
      }
    })
  ]);

  // Calculate spending
  const spentOnTasks = tasksWithBudget
    .filter(task => task.status === 'COMPLETED')
    .reduce((sum, task) => sum + (task.budgetImpact || 0), 0);

  const spentOnEvents = eventsWithBudget
    .reduce((sum, event) => sum + (event.budgetImpact || 0), 0);

  const totalSpent = spentOnTasks + spentOnEvents;

  // Get upcoming expenses
  const upcomingTasks = tasksWithBudget
    .filter(task => task.status !== 'COMPLETED')
    .reduce((sum, task) => sum + (task.budgetImpact || 0), 0);

  const upcomingEvents = eventsWithBudget
    .reduce((sum, event) => sum + (event.budgetImpact || 0), 0);

  const upcomingExpenses = upcomingTasks + upcomingEvents;

  // Simple budget calculation (this could be enhanced with user-defined budgets)
  const monthlyBudget = totalBalance * 0.1; // Assume 10% of balance as monthly budget
  const remainingBudget = monthlyBudget - totalSpent;

  // Generate alerts
  const alerts = [];
  if (remainingBudget < 0) {
    alerts.push({
      type: 'overspend',
      message: `You've exceeded your budget by $${Math.abs(remainingBudget).toFixed(2)}`,
      amount: Math.abs(remainingBudget),
      severity: 'high'
    });
  } else if (remainingBudget < monthlyBudget * 0.2) {
    alerts.push({
      type: 'low_budget',
      message: `You have $${remainingBudget.toFixed(2)} remaining in your budget`,
      amount: remainingBudget,
      severity: 'medium'
    });
  }

  if (upcomingExpenses > remainingBudget) {
    alerts.push({
      type: 'upcoming_expense',
      message: `Upcoming expenses ($${upcomingExpenses.toFixed(2)}) exceed remaining budget`,
      amount: upcomingExpenses,
      severity: 'medium'
    });
  }

  const budgetStatus = {
    totalBalance,
    monthlyBudget,
    spentThisMonth: totalSpent,
    remainingBudget,
    upcomingExpenses,
    alerts,
    period: period as string
  };

  res.json({
    success: true,
    data: budgetStatus
  });
}));

// Get spending analytics
router.get('/analytics', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { period = '30' } = req.query;
  const daysNumber = parseInt(period as string);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysNumber);

  const [taskSpending, eventSpending] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId: req.user!.id,
        createdAt: { gte: startDate },
        budgetImpact: { not: null },
        status: 'COMPLETED'
      },
      select: {
        budgetImpact: true,
        createdAt: true,
        tags: true
      }
    }),
    prisma.event.findMany({
      where: {
        userId: req.user!.id,
        startTime: { gte: startDate },
        budgetImpact: { not: null }
      },
      select: {
        budgetImpact: true,
        startTime: true
      }
    })
  ]);

  // Calculate daily spending
  const dailySpending: { [key: string]: number } = {};
  
  taskSpending.forEach(task => {
    const date = task.createdAt.toISOString().split('T')[0];
    dailySpending[date] = (dailySpending[date] || 0) + (task.budgetImpact || 0);
  });

  eventSpending.forEach(event => {
    const date = event.startTime.toISOString().split('T')[0];
    dailySpending[date] = (dailySpending[date] || 0) + (event.budgetImpact || 0);
  });

  // Calculate spending by category (using tags)
  const categorySpending: { [key: string]: number } = {};
  taskSpending.forEach(task => {
    if (task.tags.length === 0) {
      categorySpending['uncategorized'] = (categorySpending['uncategorized'] || 0) + (task.budgetImpact || 0);
    } else {
      task.tags.forEach(tag => {
        categorySpending[tag] = (categorySpending[tag] || 0) + (task.budgetImpact || 0);
      });
    }
  });

  const analytics = {
    totalSpent: Object.values(dailySpending).reduce((sum, amount) => sum + amount, 0),
    dailySpending: Object.entries(dailySpending).map(([date, amount]) => ({
      date,
      amount
    })),
    categorySpending: Object.entries(categorySpending).map(([category, amount]) => ({
      category,
      amount
    })),
    averageDailySpending: Object.values(dailySpending).reduce((sum, amount) => sum + amount, 0) / daysNumber,
    period: `${daysNumber} days`
  };

  res.json({
    success: true,
    data: analytics
  });
}));

// Get budget recommendations
router.get('/recommendations', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  // Get recent spending patterns
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [recentTasks, recentEvents, accounts] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId: req.user!.id,
        createdAt: { gte: thirtyDaysAgo },
        budgetImpact: { not: null }
      },
      select: {
        budgetImpact: true,
        tags: true,
        status: true
      }
    }),
    prisma.event.findMany({
      where: {
        userId: req.user!.id,
        startTime: { gte: thirtyDaysAgo },
        budgetImpact: { not: null }
      },
      select: {
        budgetImpact: true
      }
    }),
    prisma.financialAccount.findMany({
      where: {
        userId: req.user!.id,
        isActive: true
      }
    })
  ]);

  const totalBalance = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
  const totalSpent = [...recentTasks, ...recentEvents]
    .reduce((sum, item) => sum + (item.budgetImpact || 0), 0);

  const recommendations = [];

  // Spending rate analysis
  const dailySpendingRate = totalSpent / 30;
  const monthlyProjection = dailySpendingRate * 30;
  const yearlyProjection = dailySpendingRate * 365;

  if (monthlyProjection > totalBalance * 0.1) {
    recommendations.push({
      type: 'spending_rate',
      title: 'High Spending Rate',
      message: `Your current spending rate would deplete your balance in ${Math.round(totalBalance / dailySpendingRate)} days`,
      severity: 'high',
      action: 'Consider reducing discretionary spending'
    });
  }

  // Category analysis
  const categorySpending: { [key: string]: number } = {};
  recentTasks.forEach(task => {
    if (task.tags.length === 0) {
      categorySpending['uncategorized'] = (categorySpending['uncategorized'] || 0) + (task.budgetImpact || 0);
    } else {
      task.tags.forEach(tag => {
        categorySpending[tag] = (categorySpending[tag] || 0) + (task.budgetImpact || 0);
      });
    }
  });

  const topCategory = Object.entries(categorySpending)
    .sort(([,a], [,b]) => b - a)[0];

  if (topCategory && topCategory[1] > totalSpent * 0.4) {
    recommendations.push({
      type: 'category_focus',
      title: 'High Category Spending',
      message: `${topCategory[0]} accounts for ${Math.round((topCategory[1] / totalSpent) * 100)}% of your spending`,
      severity: 'medium',
      action: 'Review spending in this category'
    });
  }

  // Emergency fund recommendation
  if (totalBalance < totalSpent * 3) {
    recommendations.push({
      type: 'emergency_fund',
      title: 'Emergency Fund',
      message: 'Consider building an emergency fund of 3-6 months of expenses',
      severity: 'medium',
      action: 'Set aside money for unexpected expenses'
    });
  }

  res.json({
    success: true,
    data: {
      recommendations,
      summary: {
        totalBalance,
        totalSpent,
        dailySpendingRate,
        monthlyProjection,
        yearlyProjection
      }
    }
  });
}));

export default router;
