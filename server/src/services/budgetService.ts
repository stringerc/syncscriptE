import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface CreateBudgetInput {
  name: string;
  description?: string;
  period: 'WEEKLY' | 'MONTHLY' | 'ANNUAL';
  startDate: Date;
  endDate?: Date;
  totalIncome?: number;
  totalBudget: number;
  categories: Array<{
    name: string;
    description?: string;
    budgetedAmount: number;
    icon?: string;
    color?: string;
    categoryType?: 'EXPENSE' | 'INCOME' | 'SAVINGS';
  }>;
  rolloverEnabled?: boolean;
}

export interface BudgetStatus {
  budget: any;
  totalIncome: number;
  totalBudgeted: number;
  totalSpent: number;
  remainingBudget: number;
  percentageUsed: number;
  categories: Array<{
    id: string;
    name: string;
    budgeted: number;
    spent: number;
    remaining: number;
    percentageUsed: number;
    status: 'on_track' | 'warning' | 'overspent';
  }>;
  projectedEndOfPeriod?: number;
  daysRemaining?: number;
}

export class BudgetService {
  private static instance: BudgetService;

  static getInstance(): BudgetService {
    if (!BudgetService.instance) {
      BudgetService.instance = new BudgetService();
    }
    return BudgetService.instance;
  }

  /**
   * Create a new budget with categories
   */
  async createBudget(userId: string, input: CreateBudgetInput): Promise<any> {
    try {
      logger.info('Creating budget', { userId, budgetName: input.name });

      // Calculate end date if not provided
      let endDate = input.endDate;
      if (!endDate) {
        endDate = new Date(input.startDate);
        switch (input.period) {
          case 'WEEKLY':
            endDate.setDate(endDate.getDate() + 7);
            break;
          case 'MONTHLY':
            endDate.setMonth(endDate.getMonth() + 1);
            break;
          case 'ANNUAL':
            endDate.setFullYear(endDate.getFullYear() + 1);
            break;
        }
      }

      const budget = await prisma.budget.create({
        data: {
          userId,
          name: input.name,
          description: input.description,
          period: input.period,
          startDate: input.startDate,
          endDate,
          totalIncome: input.totalIncome,
          totalBudget: input.totalBudget,
          rolloverEnabled: input.rolloverEnabled || false,
          categories: {
            create: input.categories.map((cat, index) => ({
              name: cat.name,
              description: cat.description,
              budgetedAmount: cat.budgetedAmount,
              icon: cat.icon,
              color: cat.color,
              categoryType: cat.categoryType || 'EXPENSE',
              order: index
            }))
          }
        },
        include: {
          categories: true
        }
      });

      // Create default alerts
      await this.createDefaultAlerts(budget.id, userId);

      logger.info('Budget created successfully', { budgetId: budget.id, userId });
      return budget;
    } catch (error: any) {
      logger.error('Failed to create budget', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Create default alerts for a budget
   */
  private async createDefaultAlerts(budgetId: string, userId: string): Promise<void> {
    const defaultAlerts = [
      {
        alertType: 'APPROACHING_LIMIT',
        threshold: 75,
        categoryName: null // Overall budget
      },
      {
        alertType: 'APPROACHING_LIMIT',
        threshold: 90,
        categoryName: null
      },
      {
        alertType: 'OVERSPEND',
        threshold: 100,
        categoryName: null
      }
    ];

    await prisma.budgetAlert.createMany({
      data: defaultAlerts.map(alert => ({
        budgetId,
        userId,
        ...alert
      }))
    });
  }

  /**
   * Get budget status for a specific period
   */
  async getBudgetStatus(budgetId: string, userId: string, date?: Date): Promise<BudgetStatus> {
    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, userId },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!budget) {
      throw new Error('Budget not found');
    }

    const checkDate = date || new Date();

    // Calculate totals
    const totalBudgeted = budget.categories.reduce((sum, cat) => sum + cat.budgetedAmount, 0);
    const totalSpent = budget.categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
    const remainingBudget = totalBudgeted - totalSpent;
    const percentageUsed = (totalSpent / totalBudgeted) * 100;

    // Calculate days remaining
    const daysRemaining = budget.endDate
      ? Math.ceil((budget.endDate.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

    // Calculate projected spending
    let projectedEndOfPeriod: number | undefined;
    if (daysRemaining && daysRemaining > 0) {
      const daysSinceStart = Math.ceil((checkDate.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24));
      const dailyAverage = totalSpent / Math.max(daysSinceStart, 1);
      const totalDays = Math.ceil((budget.endDate!.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24));
      projectedEndOfPeriod = dailyAverage * totalDays;
    }

    // Format categories
    const categories = budget.categories.map(cat => {
      const spent = cat.spentAmount;
      const budgeted = cat.budgetedAmount;
      const remaining = budgeted - spent;
      const percentageUsed = (spent / budgeted) * 100;

      let status: 'on_track' | 'warning' | 'overspent';
      if (percentageUsed >= 100) {
        status = 'overspent';
      } else if (percentageUsed >= 75) {
        status = 'warning';
      } else {
        status = 'on_track';
      }

      return {
        id: cat.id,
        name: cat.name,
        budgeted,
        spent,
        remaining,
        percentageUsed,
        status
      };
    });

    return {
      budget,
      totalIncome: budget.totalIncome || 0,
      totalBudgeted,
      totalSpent,
      remainingBudget,
      percentageUsed,
      categories,
      projectedEndOfPeriod,
      daysRemaining
    };
  }

  /**
   * Get all budgets for a user
   */
  async getUserBudgets(userId: string, includeInactive: boolean = false): Promise<any[]> {
    const where: any = { userId };
    if (!includeInactive) {
      where.isActive = true;
    }

    return prisma.budget.findMany({
      where,
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { alerts: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Update budget
   */
  async updateBudget(
    budgetId: string,
    userId: string,
    updates: Partial<CreateBudgetInput>
  ): Promise<any> {
    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, userId }
    });

    if (!budget) {
      throw new Error('Budget not found');
    }

    return prisma.budget.update({
      where: { id: budgetId },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.totalIncome !== undefined && { totalIncome: updates.totalIncome }),
        ...(updates.totalBudget && { totalBudget: updates.totalBudget }),
        ...(updates.rolloverEnabled !== undefined && { rolloverEnabled: updates.rolloverEnabled })
      },
      include: {
        categories: true
      }
    });
  }

  /**
   * Add category to budget
   */
  async addCategory(
    budgetId: string,
    userId: string,
    category: {
      name: string;
      description?: string;
      budgetedAmount: number;
      icon?: string;
      color?: string;
      categoryType?: 'EXPENSE' | 'INCOME' | 'SAVINGS';
    }
  ): Promise<any> {
    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, userId },
      include: { categories: true }
    });

    if (!budget) {
      throw new Error('Budget not found');
    }

    const maxOrder = budget.categories.reduce((max, cat) => Math.max(max, cat.order), -1);

    return prisma.budgetCategory.create({
      data: {
        budgetId,
        name: category.name,
        description: category.description,
        budgetedAmount: category.budgetedAmount,
        icon: category.icon,
        color: category.color,
        categoryType: category.categoryType || 'EXPENSE',
        order: maxOrder + 1
      }
    });
  }

  /**
   * Update budget category
   */
  async updateCategory(
    categoryId: string,
    userId: string,
    updates: {
      name?: string;
      description?: string;
      budgetedAmount?: number;
      icon?: string;
      color?: string;
    }
  ): Promise<any> {
    const category = await prisma.budgetCategory.findFirst({
      where: {
        id: categoryId,
        budget: { userId }
      }
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return prisma.budgetCategory.update({
      where: { id: categoryId },
      data: updates
    });
  }

  /**
   * Delete budget category
   */
  async deleteCategory(categoryId: string, userId: string): Promise<void> {
    const category = await prisma.budgetCategory.findFirst({
      where: {
        id: categoryId,
        budget: { userId }
      }
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // Soft delete - mark as inactive
    await prisma.budgetCategory.update({
      where: { id: categoryId },
      data: { isActive: false }
    });
  }

  /**
   * Rollover budget to next period
   */
  async rolloverBudget(budgetId: string, userId: string): Promise<any> {
    const currentBudget = await prisma.budget.findFirst({
      where: { id: budgetId, userId },
      include: { categories: true }
    });

    if (!currentBudget) {
      throw new Error('Budget not found');
    }

    // Calculate new dates
    const newStartDate = currentBudget.endDate || new Date();
    const newEndDate = new Date(newStartDate);

    switch (currentBudget.period) {
      case 'WEEKLY':
        newEndDate.setDate(newEndDate.getDate() + 7);
        break;
      case 'MONTHLY':
        newEndDate.setMonth(newEndDate.getMonth() + 1);
        break;
      case 'ANNUAL':
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        break;
    }

    // Create new budget
    const newBudget = await prisma.budget.create({
      data: {
        userId,
        name: currentBudget.name,
        description: currentBudget.description,
        period: currentBudget.period,
        startDate: newStartDate,
        endDate: newEndDate,
        totalIncome: currentBudget.totalIncome,
        totalBudget: currentBudget.totalBudget,
        rolloverEnabled: currentBudget.rolloverEnabled,
        categories: {
          create: currentBudget.categories.map((cat, index) => {
            // Calculate rollover amount if enabled
            const rolloverAmount = currentBudget.rolloverEnabled
              ? Math.max(0, cat.budgetedAmount - cat.spentAmount)
              : 0;

            return {
              name: cat.name,
              description: cat.description,
              budgetedAmount: cat.budgetedAmount + rolloverAmount,
              icon: cat.icon,
              color: cat.color,
              categoryType: cat.categoryType,
              order: index,
              spentAmount: 0 // Reset spent amount
            };
          })
        }
      },
      include: {
        categories: true
      }
    });

    // Mark old budget as inactive
    await prisma.budget.update({
      where: { id: budgetId },
      data: { isActive: false }
    });

    // Create default alerts for new budget
    await this.createDefaultAlerts(newBudget.id, userId);

    // Create snapshot of old budget
    await this.createSnapshot(budgetId);

    logger.info('Budget rolled over successfully', { oldBudgetId: budgetId, newBudgetId: newBudget.id });
    return newBudget;
  }

  /**
   * Create budget snapshot
   */
  async createSnapshot(budgetId: string): Promise<void> {
    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
      include: { categories: true }
    });

    if (!budget) {
      throw new Error('Budget not found');
    }

    const totalIncome = budget.totalIncome || 0;
    const totalExpenses = budget.categories
      .filter(cat => cat.categoryType === 'EXPENSE')
      .reduce((sum, cat) => sum + cat.spentAmount, 0);
    const totalSavings = budget.categories
      .filter(cat => cat.categoryType === 'SAVINGS')
      .reduce((sum, cat) => sum + cat.spentAmount, 0);

    const categoryData = budget.categories.map(cat => ({
      name: cat.name,
      budgeted: cat.budgetedAmount,
      spent: cat.spentAmount,
      remaining: cat.budgetedAmount - cat.spentAmount,
      type: cat.categoryType
    }));

    await prisma.budgetSnapshot.create({
      data: {
        userId: budget.userId,
        budgetId: budget.id,
        snapshotDate: new Date(),
        periodStart: budget.startDate,
        periodEnd: budget.endDate || new Date(),
        totalIncome,
        totalExpenses,
        totalSavings,
        netCashflow: totalIncome - totalExpenses - totalSavings,
        categoryData: JSON.stringify(categoryData),
        vsBudget: (totalExpenses / budget.totalBudget) * 100
      }
    });
  }

  /**
   * Share budget with other users
   */
  async shareBudget(budgetId: string, userId: string, sharedUserIds: string[]): Promise<any> {
    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, userId }
    });

    if (!budget) {
      throw new Error('Budget not found');
    }

    return prisma.budget.update({
      where: { id: budgetId },
      data: {
        isShared: true,
        sharedWith: JSON.stringify(sharedUserIds)
      }
    });
  }

  /**
   * Get personal spending breakdown for shared budget
   */
  async getPersonalBreakdown(budgetId: string, userId: string): Promise<any> {
    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
      include: { categories: true }
    });

    if (!budget) {
      throw new Error('Budget not found');
    }

    // Get all transactions for this budget period
    const transactions = await prisma.transaction.findMany({
      where: {
        budgetCategoryId: { in: budget.categories.map(c => c.id) },
        date: {
          gte: budget.startDate,
          lte: budget.endDate || new Date()
        }
      }
    });

    // Calculate personal spending
    const myTransactions = transactions.filter(tx => tx.userId === userId);
    const myTotal = myTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const totalSpending = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    // Category breakdown
    const categoryBreakdown = budget.categories.map(cat => {
      const catTransactions = myTransactions.filter(tx => tx.budgetCategoryId === cat.id);
      const mySpending = catTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      
      return {
        name: cat.name,
        mySpending,
        totalSpending: cat.spentAmount,
        myPercentage: cat.spentAmount > 0 ? (mySpending / cat.spentAmount) * 100 : 0
      };
    });

    return {
      userId,
      budgetId,
      myTotal,
      totalSpending,
      myPercentage: totalSpending > 0 ? (myTotal / totalSpending) * 100 : 0,
      categoryBreakdown
    };
  }

  /**
   * Get budget comparison data
   */
  async getBudgetComparison(userId: string, currentBudgetId: string): Promise<any> {
    const currentBudget = await prisma.budget.findFirst({
      where: { id: currentBudgetId, userId },
      include: { categories: true }
    });

    if (!currentBudget) {
      throw new Error('Budget not found');
    }

    // Get previous budget of same period
    const previousBudget = await prisma.budget.findFirst({
      where: {
        userId,
        period: currentBudget.period,
        endDate: { lt: currentBudget.startDate },
        isActive: false
      },
      orderBy: { endDate: 'desc' },
      include: { categories: true }
    });

    if (!previousBudget) {
      return null;
    }

    const currentTotal = currentBudget.categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
    const previousTotal = previousBudget.categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
    const change = ((currentTotal - previousTotal) / previousTotal) * 100;

    return {
      current: {
        budgetId: currentBudget.id,
        total: currentTotal,
        period: `${currentBudget.startDate.toLocaleDateString()} - ${currentBudget.endDate?.toLocaleDateString()}`
      },
      previous: {
        budgetId: previousBudget.id,
        total: previousTotal,
        period: `${previousBudget.startDate.toLocaleDateString()} - ${previousBudget.endDate?.toLocaleDateString()}`
      },
      change,
      trend: change > 0 ? 'increased' : change < 0 ? 'decreased' : 'unchanged'
    };
  }
}

export const budgetService = BudgetService.getInstance();

