import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { plaidService } from './plaidService';

const prisma = new PrismaClient();

export interface TransactionInput {
  amount: number;
  description: string;
  date: Date;
  merchantName?: string;
  category?: string;
  subcategory?: string;
}

export interface EnrichedTransaction {
  merchantName: string;
  category: string;
  subcategory?: string;
  confidence: number;
  logo?: string;
}

export interface TransactionFilters {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  merchantName?: string;
  minAmount?: number;
  maxAmount?: number;
  linkedEventId?: string;
  linkedProjectId?: string;
}

export class TransactionService {
  private static instance: TransactionService;

  static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService();
    }
    return TransactionService.instance;
  }

  /**
   * Sync transactions from Plaid for a user
   */
  async syncTransactions(
    userId: string,
    startDate: Date,
    endDate: Date,
    accountIds?: string[]
  ): Promise<{ created: number; updated: number; errors: any[] }> {
    try {
      logger.info('Syncing transactions from Plaid', { userId, startDate, endDate });

      // Get user's financial accounts
      let accounts = await prisma.financialAccount.findMany({
        where: {
          userId,
          isActive: true,
          ...(accountIds && { id: { in: accountIds } })
        }
      });

      if (accounts.length === 0) {
        logger.warn('No active financial accounts found for user', { userId });
        return { created: 0, updated: 0, errors: [] };
      }

      let created = 0;
      let updated = 0;
      const errors: any[] = [];

      // Fetch transactions from Plaid for each account
      for (const account of accounts) {
        try {
          // Use existing plaidService to get transactions
          const plaidTransactions = await plaidService.getTransactions(
            account.plaidItemId,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          );

          // Process each transaction
          for (const plaidTx of plaidTransactions) {
            try {
              // Check if transaction already exists
              const existing = await prisma.transaction.findFirst({
                where: {
                  userId,
                  transactionId: plaidTx.transaction_id
                }
              });

              const transactionData = {
                userId,
                financialAccountId: account.id,
                amount: plaidTx.amount,
                description: plaidTx.name || plaidTx.merchant_name || 'Unknown',
                date: new Date(plaidTx.date),
                pending: plaidTx.pending,
                transactionId: plaidTx.transaction_id,
                merchantName: plaidTx.merchant_name,
                category: plaidTx.category ? plaidTx.category[0] : null,
                subcategory: plaidTx.category && plaidTx.category.length > 1 ? plaidTx.category[1] : null,
                confidence: 0.8, // Plaid's categorization is generally reliable
              };

              if (existing) {
                // Update existing transaction
                await prisma.transaction.update({
                  where: { id: existing.id },
                  data: transactionData
                });
                updated++;
              } else {
                // Create new transaction and categorize
                const newTransaction = await prisma.transaction.create({
                  data: transactionData
                });
                created++;

                // Auto-categorize and update budget
                await this.categorizeTransaction(newTransaction.id);
              }
            } catch (txError) {
              logger.error('Error processing transaction', { txError, plaidTx });
              errors.push({ transaction: plaidTx.transaction_id, error: txError });
            }
          }
        } catch (accountError) {
          logger.error('Error syncing account', { accountId: account.id, accountError });
          errors.push({ account: account.id, error: accountError });
        }
      }

      logger.info('Transaction sync complete', { userId, created, updated, errors: errors.length });
      return { created, updated, errors };
    } catch (error: any) {
      logger.error('Failed to sync transactions', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Auto-categorize a transaction using rules and ML
   */
  async categorizeTransaction(transactionId: string): Promise<void> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { user: true }
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Skip if user has manually categorized
      if (transaction.userCategorized) {
        return;
      }

      // Step 1: Check user-defined rules (highest priority)
      const matchedRule = await this.findMatchingRule(transaction);
      if (matchedRule) {
        await prisma.transaction.update({
          where: { id: transactionId },
          data: {
            category: matchedRule.assignCategory,
            subcategory: matchedRule.assignSubcategory,
            userRuleId: matchedRule.id,
            confidence: 1.0 // User rules are 100% confident
          }
        });

        // Update rule usage count
        await prisma.categorizationRule.update({
          where: { id: matchedRule.id },
          data: { timesApplied: { increment: 1 } }
        });

        await this.updateBudgetSpending(transactionId);
        return;
      }

      // Step 2: Use Plaid's categorization if available
      if (transaction.category && transaction.confidence && transaction.confidence > 0.7) {
        await this.updateBudgetSpending(transactionId);
        return;
      }

      // Step 3: Use default categorization based on merchant or description
      const defaultCategory = this.getDefaultCategory(transaction);
      if (defaultCategory) {
        await prisma.transaction.update({
          where: { id: transactionId },
          data: {
            category: defaultCategory.category,
            subcategory: defaultCategory.subcategory,
            confidence: 0.6
          }
        });

        await this.updateBudgetSpending(transactionId);
      }
    } catch (error: any) {
      logger.error('Failed to categorize transaction', { transactionId, error: error.message });
    }
  }

  /**
   * Find matching categorization rule for transaction
   */
  private async findMatchingRule(transaction: any): Promise<any> {
    const rules = await prisma.categorizationRule.findMany({
      where: {
        userId: transaction.userId,
        isActive: true
      },
      orderBy: { priority: 'desc' }
    });

    for (const rule of rules) {
      let matches = false;
      const matchValue = rule.matchValue.toLowerCase();

      switch (rule.matchType) {
        case 'MERCHANT':
          if (transaction.merchantName) {
            matches = this.applyOperator(
              transaction.merchantName.toLowerCase(),
              matchValue,
              rule.matchOperator
            );
          }
          break;

        case 'DESCRIPTION':
          matches = this.applyOperator(
            transaction.description.toLowerCase(),
            matchValue,
            rule.matchOperator
          );
          break;

        case 'KEYWORD':
          const text = `${transaction.description} ${transaction.merchantName || ''}`.toLowerCase();
          matches = text.includes(matchValue);
          break;

        case 'AMOUNT_RANGE':
          // matchValue format: "min-max" e.g., "10-50"
          const [min, max] = matchValue.split('-').map(parseFloat);
          matches = transaction.amount >= min && transaction.amount <= max;
          break;
      }

      if (matches) {
        return rule;
      }
    }

    return null;
  }

  /**
   * Apply string matching operator
   */
  private applyOperator(text: string, pattern: string, operator: string): boolean {
    switch (operator) {
      case 'CONTAINS':
        return text.includes(pattern);
      case 'EQUALS':
        return text === pattern;
      case 'STARTS_WITH':
        return text.startsWith(pattern);
      case 'REGEX':
        try {
          return new RegExp(pattern).test(text);
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  /**
   * Get default category based on keywords
   */
  private getDefaultCategory(transaction: any): { category: string; subcategory?: string } | null {
    const text = `${transaction.description} ${transaction.merchantName || ''}`.toLowerCase();

    // Food & Dining
    if (text.match(/restaurant|cafe|coffee|starbucks|mcdonalds|pizza|burger/)) {
      return { category: 'Food & Dining', subcategory: 'Restaurants' };
    }
    if (text.match(/grocery|supermarket|whole foods|trader joe|safeway/)) {
      return { category: 'Food & Dining', subcategory: 'Groceries' };
    }

    // Transportation
    if (text.match(/uber|lyft|taxi|gas|fuel|shell|chevron|exxon/)) {
      return { category: 'Transportation', subcategory: 'Gas & Fuel' };
    }
    if (text.match(/parking|toll/)) {
      return { category: 'Transportation', subcategory: 'Parking' };
    }

    // Shopping
    if (text.match(/amazon|walmart|target|costco|shopping/)) {
      return { category: 'Shopping', subcategory: 'General' };
    }

    // Entertainment
    if (text.match(/netflix|spotify|hulu|disney|movie|theater/)) {
      return { category: 'Entertainment', subcategory: 'Streaming' };
    }

    // Bills & Utilities
    if (text.match(/electric|water|gas bill|internet|comcast|att|verizon/)) {
      return { category: 'Bills & Utilities', subcategory: 'Utilities' };
    }
    if (text.match(/insurance|premium/)) {
      return { category: 'Bills & Utilities', subcategory: 'Insurance' };
    }

    // Default
    return { category: 'Uncategorized' };
  }

  /**
   * Update budget spending when transaction is categorized
   */
  private async updateBudgetSpending(transactionId: string): Promise<void> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId }
      });

      if (!transaction || !transaction.category) {
        return;
      }

      // Find active budget for user
      const budget = await prisma.budget.findFirst({
        where: {
          userId: transaction.userId,
          isActive: true,
          startDate: { lte: transaction.date },
          OR: [
            { endDate: { gte: transaction.date } },
            { endDate: null }
          ]
        },
        include: { categories: true }
      });

      if (!budget) {
        return;
      }

      // Find matching budget category
      const budgetCategory = budget.categories.find(
        cat => cat.name.toLowerCase() === transaction.category!.toLowerCase()
      );

      if (budgetCategory) {
        // Update transaction to link to budget category
        await prisma.transaction.update({
          where: { id: transactionId },
          data: { budgetCategoryId: budgetCategory.id }
        });

        // Update spent amount in category
        await prisma.budgetCategory.update({
          where: { id: budgetCategory.id },
          data: {
            spentAmount: {
              increment: Math.abs(transaction.amount)
            }
          }
        });

        // Check if alerts should be triggered
        await this.checkBudgetAlerts(budget.id, budgetCategory.id);
      }
    } catch (error: any) {
      logger.error('Failed to update budget spending', { transactionId, error: error.message });
    }
  }

  /**
   * Check if budget alerts should be triggered
   */
  private async checkBudgetAlerts(budgetId: string, categoryId: string): Promise<void> {
    const category = await prisma.budgetCategory.findUnique({
      where: { id: categoryId }
    });

    if (!category) return;

    const percentage = (category.spentAmount / category.budgetedAmount) * 100;

    // Get relevant alerts
    const alerts = await prisma.budgetAlert.findMany({
      where: {
        budgetId,
        isActive: true,
        OR: [
          { categoryName: category.name },
          { categoryName: null } // Overall budget alerts
        ]
      }
    });

    for (const alert of alerts) {
      if (alert.threshold && percentage >= alert.threshold) {
        // Trigger alert (will be handled by notification service)
        await prisma.budgetAlert.update({
          where: { id: alert.id },
          data: {
            lastTriggered: new Date(),
            triggerCount: { increment: 1 }
          }
        });

        // Create notification
        await prisma.notification.create({
          data: {
            userId: alert.userId,
            type: 'BUDGET_ALERT',
            title: `Budget Alert: ${category.name}`,
            message: `You've spent ${percentage.toFixed(0)}% of your ${category.name} budget ($${category.spentAmount.toFixed(2)} / $${category.budgetedAmount.toFixed(2)})`,
            priority: percentage >= 100 ? 'high' : 'medium',
            actionUrl: `/financial?category=${category.id}`,
            metadata: JSON.stringify({
              budgetId,
              categoryId,
              percentage,
              amountOver: category.spentAmount - category.budgetedAmount
            })
          }
        });
      }
    }
  }

  /**
   * Get transactions with filtering
   */
  async getTransactions(
    userId: string,
    filters: TransactionFilters = {},
    page: number = 1,
    limit: number = 50
  ): Promise<{ transactions: any[]; total: number; page: number; pages: number }> {
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      ...(filters.startDate && { date: { gte: filters.startDate } }),
      ...(filters.endDate && { date: { lte: filters.endDate } }),
      ...(filters.category && { category: filters.category }),
      ...(filters.merchantName && { merchantName: { contains: filters.merchantName } }),
      ...(filters.minAmount && { amount: { gte: filters.minAmount } }),
      ...(filters.maxAmount && { amount: { lte: filters.maxAmount } }),
      ...(filters.linkedEventId && { linkedEventId: filters.linkedEventId }),
      ...(filters.linkedProjectId && { linkedProjectId: filters.linkedProjectId })
    };

    if (filters.startDate && filters.endDate) {
      where.date = { gte: filters.startDate, lte: filters.endDate };
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          financialAccount: true,
          budgetCategory: true
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit
      }),
      prisma.transaction.count({ where })
    ]);

    return {
      transactions,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Update transaction category manually
   */
  async updateTransactionCategory(
    transactionId: string,
    userId: string,
    category: string,
    subcategory?: string
  ): Promise<void> {
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId }
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Remove from old budget category if exists
    if (transaction.budgetCategoryId) {
      const oldCategory = await prisma.budgetCategory.findUnique({
        where: { id: transaction.budgetCategoryId }
      });
      if (oldCategory) {
        await prisma.budgetCategory.update({
          where: { id: oldCategory.id },
          data: {
            spentAmount: {
              decrement: Math.abs(transaction.amount)
            }
          }
        });
      }
    }

    // Update transaction
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        category,
        subcategory,
        userCategorized: true,
        confidence: 1.0,
        budgetCategoryId: null // Will be set by updateBudgetSpending
      }
    });

    // Update budget spending with new category
    await this.updateBudgetSpending(transactionId);
  }

  /**
   * Link transaction to event or project
   */
  async linkTransaction(
    transactionId: string,
    userId: string,
    linkedId: string,
    type: 'event' | 'project'
  ): Promise<void> {
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId }
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        ...(type === 'event' && { linkedEventId: linkedId }),
        ...(type === 'project' && { linkedProjectId: linkedId })
      }
    });
  }

  /**
   * Detect recurring transactions
   */
  async detectRecurringTransactions(userId: string): Promise<void> {
    try {
      // Get transactions from last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: sixMonthsAgo }
        },
        orderBy: { date: 'desc' }
      });

      // Group by merchant name
      const groupedByMerchant = transactions.reduce((acc, tx) => {
        const key = tx.merchantName || tx.description;
        if (!acc[key]) acc[key] = [];
        acc[key].push(tx);
        return acc;
      }, {} as Record<string, any[]>);

      // Analyze each merchant group
      for (const [merchantName, txs] of Object.entries(groupedByMerchant)) {
        if (txs.length < 3) continue; // Need at least 3 occurrences

        // Calculate average time between transactions
        const sortedTxs = txs.sort((a, b) => a.date.getTime() - b.date.getTime());
        const intervals: number[] = [];

        for (let i = 1; i < sortedTxs.length; i++) {
          const daysDiff = Math.floor(
            (sortedTxs[i].date.getTime() - sortedTxs[i - 1].date.getTime()) / (1000 * 60 * 60 * 24)
          );
          intervals.push(daysDiff);
        }

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((acc, val) => acc + Math.pow(val - avgInterval, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);

        // If variance is low, it's likely recurring
        const confidence = Math.max(0, 1 - (stdDev / avgInterval));

        if (confidence > 0.7) {
          const frequency = this.determineFrequency(avgInterval);
          const avgAmount = txs.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) / txs.length;

          // Check if already exists
          const existing = await prisma.recurringTransaction.findFirst({
            where: {
              userId,
              merchantName
            }
          });

          const nextDate = new Date(sortedTxs[sortedTxs.length - 1].date);
          nextDate.setDate(nextDate.getDate() + avgInterval);

          if (existing) {
            await prisma.recurringTransaction.update({
              where: { id: existing.id },
              data: {
                averageAmount: avgAmount,
                frequency,
                lastSeen: sortedTxs[sortedTxs.length - 1].date,
                occurrenceCount: txs.length,
                confidence,
                nextExpectedDate: nextDate,
                nextExpectedAmount: avgAmount
              }
            });
          } else {
            await prisma.recurringTransaction.create({
              data: {
                userId,
                merchantName,
                category: txs[0].category || 'Uncategorized',
                averageAmount: avgAmount,
                frequency,
                firstSeen: sortedTxs[0].date,
                lastSeen: sortedTxs[sortedTxs.length - 1].date,
                occurrenceCount: txs.length,
                confidence,
                nextExpectedDate: nextDate,
                nextExpectedAmount: avgAmount
              }
            });
          }

          // Mark transactions as recurring
          await prisma.transaction.updateMany({
            where: {
              id: { in: txs.map(tx => tx.id) }
            },
            data: { isRecurring: true }
          });
        }
      }

      logger.info('Recurring transaction detection complete', { userId });
    } catch (error: any) {
      logger.error('Failed to detect recurring transactions', { userId, error: error.message });
    }
  }

  /**
   * Determine frequency from average interval
   */
  private determineFrequency(avgInterval: number): string {
    if (avgInterval <= 8) return 'WEEKLY';
    if (avgInterval <= 16) return 'BIWEEKLY';
    if (avgInterval <= 35) return 'MONTHLY';
    if (avgInterval <= 100) return 'QUARTERLY';
    return 'ANNUAL';
  }
}

export const transactionService = TransactionService.getInstance();

