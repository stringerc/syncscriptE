import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface BudgetLineItemInput {
  id?: string;
  name: string;
  url?: string;
  qty: number;
  unitPriceCents: number;
  categoryId?: string;
  notes?: string;
  isActual?: boolean;
}

export interface TaskBudgetInput {
  mode: 'total' | 'lines';
  taxCents?: number;
  shippingCents?: number;
  estimatedCents?: number;
  actualCents?: number;
  includeInEvent?: boolean;
  lineItems?: BudgetLineItemInput[];
}

export interface EventBudgetItemInput {
    name: string;
  url?: string;
  estimatedCents: number;
  actualCents?: number;
  categoryId?: string;
  notes?: string;
}

export interface BudgetTotals {
  estimatedCents: number;
  actualCents: number;
  varianceCents: number;
  variancePercentage: number;
}

export interface TaskBudgetTotals extends BudgetTotals {
  taskId: string;
  mode: string;
  includeInEvent: boolean;
  lineItemsCount: number;
}

export interface EventBudgetTotals extends BudgetTotals {
  eventId: string;
  capCents?: number;
  isOverCap: boolean;
  overCapAmount: number;
  tasksCount: number;
  eventItemsCount: number;
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    estimatedCents: number;
    actualCents: number;
    varianceCents: number;
  }>;
}

export class BudgetService {
  /**
   * Create or update task budget
   */
  static async upsertTaskBudget(
    taskId: string,
    userId: string,
    data: TaskBudgetInput
  ): Promise<TaskBudgetTotals> {
    try {
      logger.info('🔍 BudgetService.upsertTaskBudget called', {
        taskId,
        userId,
        data,
        estimatedCents: data.estimatedCents
      });

      // Verify task ownership
      const task = await prisma.task.findFirst({
        where: { id: taskId, userId }
      });

      if (!task) {
        throw new Error('Task not found or access denied');
      }

      // Upsert task budget
      const taskBudget = await prisma.taskBudget.upsert({
        where: { taskId },
        update: {
          mode: data.mode,
          taxCents: data.taxCents || 0,
          shippingCents: data.shippingCents || 0,
          estimatedCents: data.estimatedCents || 0,
          actualCents: data.actualCents,
          includeInEvent: data.includeInEvent ?? true,
        },
        create: {
          taskId,
          mode: data.mode,
          taxCents: data.taxCents || 0,
          shippingCents: data.shippingCents || 0,
          estimatedCents: data.estimatedCents || 0,
          actualCents: data.actualCents,
          includeInEvent: data.includeInEvent ?? true,
        },
      });

      // Handle line items if mode is 'lines'
      if (data.mode === 'lines' && data.lineItems) {
        // Delete existing line items
        await prisma.budgetLineItem.deleteMany({
          where: { taskBudgetId: taskBudget.id }
        });

        // Create new line items
        for (const item of data.lineItems) {
          await prisma.budgetLineItem.create({
            data: {
              taskBudgetId: taskBudget.id,
              name: item.name,
              url: item.url,
              qty: item.qty,
              unitPriceCents: item.unitPriceCents,
              categoryId: item.categoryId,
              notes: item.notes,
              isActual: item.isActual || false,
            },
          });
        }
      }

      // Calculate and return totals
      return await this.calculateTaskBudgetTotals(taskId);
    } catch (error) {
      logger.error('Error upserting task budget:', error);
      throw error;
    }
  }

  /**
   * Calculate task budget totals
   */
  static async calculateTaskBudgetTotals(taskId: string): Promise<TaskBudgetTotals> {
    const taskBudget = await prisma.taskBudget.findUnique({
      where: { taskId },
      include: {
        lineItems: {
          include: { category: true }
        }
      }
    });

    if (!taskBudget) {
      throw new Error('Task budget not found');
    }

    let estimatedCents = 0;
    let actualCents = 0;

    if (taskBudget.mode === 'total') {
      estimatedCents = taskBudget.estimatedCents + taskBudget.taxCents + taskBudget.shippingCents;
      actualCents = taskBudget.actualCents || 0; // Don't default to estimatedCents
    } else if (taskBudget.mode === 'lines') {
      // Calculate from line items
      const lineItemTotals = taskBudget.lineItems.reduce(
        (acc, item) => {
          const itemTotal = item.qty * item.unitPriceCents;
          acc.estimated += itemTotal;
          if (item.isActual) {
            acc.actual += itemTotal;
          }
          return acc;
        },
        { estimated: 0, actual: 0 }
      );

      // If there are line items, use their totals; otherwise use the saved estimatedCents
      if (taskBudget.lineItems.length > 0) {
        estimatedCents = lineItemTotals.estimated + taskBudget.taxCents + taskBudget.shippingCents;
        actualCents = lineItemTotals.actual + taskBudget.taxCents + taskBudget.shippingCents;
      } else {
        // No line items, use the saved estimatedCents from the database
        estimatedCents = taskBudget.estimatedCents + taskBudget.taxCents + taskBudget.shippingCents;
        actualCents = taskBudget.actualCents || 0; // Don't default to estimatedCents
      }
    }

    const varianceCents = actualCents - estimatedCents;
    const variancePercentage = estimatedCents > 0 ? (varianceCents / estimatedCents) * 100 : 0;

    return {
      taskId,
      mode: taskBudget.mode,
      includeInEvent: taskBudget.includeInEvent,
      lineItemsCount: taskBudget.lineItems.length,
      estimatedCents,
      actualCents,
      varianceCents,
      variancePercentage,
    };
  }

  /**
   * Create or update event budget envelope
   */
  static async upsertEventBudgetEnvelope(
    eventId: string,
    userId: string,
    capCents?: number,
    currency: string = 'USD'
  ): Promise<void> {
    // Verify event ownership
    const event = await prisma.event.findFirst({
      where: { id: eventId, userId }
    });

    if (!event) {
      throw new Error('Event not found or access denied');
    }

    await prisma.budgetEnvelope.upsert({
      where: { eventId },
      update: {
        capCents,
        currency,
      },
      create: {
        eventId,
        capCents,
        currency,
      },
    });
  }

  /**
   * Add event-level budget item
   */
  static async addEventBudgetItem(
    eventId: string,
    userId: string,
    data: EventBudgetItemInput
  ): Promise<void> {
    // Verify event ownership
    const event = await prisma.event.findFirst({
      where: { id: eventId, userId }
    });

    if (!event) {
      throw new Error('Event not found or access denied');
    }

    await prisma.eventBudgetItem.create({
      data: {
        eventId,
        name: data.name,
        url: data.url,
        estimatedCents: data.estimatedCents,
        actualCents: data.actualCents,
        categoryId: data.categoryId,
        notes: data.notes,
      },
    });
  }

  /**
   * Calculate event budget totals
   */
  static async calculateEventBudgetTotals(eventId: string): Promise<EventBudgetTotals> {
    // Get event budget envelope
    const envelope = await prisma.budgetEnvelope.findUnique({
      where: { eventId }
    });

    // Get all task budgets for this event
    const taskBudgets = await prisma.taskBudget.findMany({
      where: {
        task: { eventId },
        includeInEvent: true
      },
      include: {
        lineItems: {
          include: { category: true }
        }
      }
    });

    // Get event-level budget items
    const eventItems = await prisma.eventBudgetItem.findMany({
      where: { eventId },
      include: { category: true }
    });

    // Calculate totals
    let estimatedCents = 0;
    let actualCents = 0;
    const categoryTotals = new Map<string, { name: string; estimated: number; actual: number }>();

    // Add task budget totals
    for (const taskBudget of taskBudgets) {
      const taskTotals = await this.calculateTaskBudgetTotals(taskBudget.taskId);
      estimatedCents += taskTotals.estimatedCents;
      actualCents += taskTotals.actualCents;

      // Add to category totals
      for (const lineItem of taskBudget.lineItems) {
        if (lineItem.categoryId) {
          const categoryId = lineItem.categoryId;
          const categoryName = lineItem.category?.name || 'Uncategorized';
          const itemTotal = lineItem.qty * lineItem.unitPriceCents;

          if (!categoryTotals.has(categoryId)) {
            categoryTotals.set(categoryId, { name: categoryName, estimated: 0, actual: 0 });
          }

          const categoryTotal = categoryTotals.get(categoryId)!;
          categoryTotal.estimated += itemTotal;
          if (lineItem.isActual) {
            categoryTotal.actual += itemTotal;
          }
        }
      }
    }

    // Add event item totals
    for (const eventItem of eventItems) {
      estimatedCents += eventItem.estimatedCents;
      actualCents += eventItem.actualCents || eventItem.estimatedCents;

      // Add to category totals
      if (eventItem.categoryId) {
        const categoryId = eventItem.categoryId;
        const categoryName = eventItem.category?.name || 'Uncategorized';

        if (!categoryTotals.has(categoryId)) {
          categoryTotals.set(categoryId, { name: categoryName, estimated: 0, actual: 0 });
        }

        const categoryTotal = categoryTotals.get(categoryId)!;
        categoryTotal.estimated += eventItem.estimatedCents;
        categoryTotal.actual += eventItem.actualCents || eventItem.estimatedCents;
      }
    }

    const varianceCents = actualCents - estimatedCents;
    const variancePercentage = estimatedCents > 0 ? (varianceCents / estimatedCents) * 100 : 0;

    const capCents = envelope?.capCents;
    const isOverCap = capCents ? actualCents > capCents : false;
    const overCapAmount = capCents ? Math.max(0, actualCents - capCents) : 0;

            return {
      eventId,
      capCents,
      isOverCap,
      overCapAmount,
      tasksCount: taskBudgets.length,
      eventItemsCount: eventItems.length,
      estimatedCents,
      actualCents,
      varianceCents,
      variancePercentage,
      byCategory: Array.from(categoryTotals.entries()).map(([categoryId, totals]) => ({
        categoryId,
        categoryName: totals.name,
        estimatedCents: totals.estimated,
        actualCents: totals.actual,
        varianceCents: totals.actual - totals.estimated,
      })),
    };
  }

  /**
   * Parse budget line items from text
   */
  static parseBudgetList(text: string): BudgetLineItemInput[] {
    const lines = text.split('\n').filter(line => line.trim());
    const items: BudgetLineItemInput[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Pattern 1: "2 x Masking Tape - 3.49"
      const pattern1 = /^\s*(\d+)\s*[xX*]\s*(.+?)\s*[-–]\s*\$?([\d,]+(?:\.\d{1,2})?)/;
      const match1 = trimmedLine.match(pattern1);
      if (match1) {
        items.push({
          name: match1[2].trim(),
          qty: parseInt(match1[1]),
          unitPriceCents: Math.round(parseFloat(match1[3].replace(',', '')) * 100),
        });
        continue;
      }

      // Pattern 2: "Paper Cups | 50 | 4.99 | https://..."
      const pattern2 = /^\s*(.+?)\s*[|]\s*(\d+)\s*[|]\s*\$?([\d,]+(?:\.\d{1,2})?)(?:\s*[|]\s*(https?:\/\/\S+))?/;
      const match2 = trimmedLine.match(pattern2);
      if (match2) {
        items.push({
          name: match2[1].trim(),
          qty: parseInt(match2[2]),
          unitPriceCents: Math.round(parseFloat(match2[3].replace(',', '')) * 100),
          url: match2[4]?.trim(),
        });
        continue;
      }

      // Pattern 3: URL only
      const pattern3 = /^(https?:\/\/\S+)/;
      const match3 = trimmedLine.match(pattern3);
      if (match3) {
        items.push({
          name: '(link)',
          qty: 1,
          unitPriceCents: 0,
          url: match3[1],
        });
        continue;
      }

      // If no pattern matches, treat as name only
      items.push({
        name: trimmedLine,
        qty: 1,
        unitPriceCents: 0,
      });
    }

    return items;
  }

  /**
   * Get budget categories for a project
   */
  static async getBudgetCategories(userId: string, projectId?: string): Promise<any[]> {
    return await prisma.budgetCategory.findMany({
      where: {
        OR: [
          { budget: { userId } },
          { projectId },
        ],
        isActive: true,
      },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Create budget category
   */
  static async createBudgetCategory(
    userId: string,
    name: string,
    projectId?: string,
    color?: string,
    icon?: string
  ): Promise<any> {
    return await prisma.budgetCategory.create({
      data: {
        name,
        budgetedAmount: 0,
        spentAmount: 0,
        projectId,
        color,
        icon,
        order: 0,
      },
    });
  }
}