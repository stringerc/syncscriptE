import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class BudgetAlertService {
  private static instance: BudgetAlertService;

  static getInstance(): BudgetAlertService {
    if (!BudgetAlertService.instance) {
      BudgetAlertService.instance = new BudgetAlertService();
    }
    return BudgetAlertService.instance;
  }

  /**
   * Check all alerts for all users
   * Called by cron job every hour
   */
  async checkAllAlerts(): Promise<void> {
    try {
      logger.info('Starting budget alert check for all users');

      const activeAlerts = await prisma.budgetAlert.findMany({
        where: { isActive: true },
        include: {
          budget: {
            include: { categories: true }
          }
        }
      });

      let alertsTriggered = 0;

      for (const alert of activeAlerts) {
        const triggered = await this.checkAlert(alert);
        if (triggered) alertsTriggered++;
      }

      logger.info('Budget alert check complete', { alertsTriggered });
    } catch (error: any) {
      logger.error('Failed to check alerts', { error: error.message });
    }
  }

  /**
   * Check specific alert
   */
  async checkAlert(alert: any): Promise<boolean> {
    try {
      const budget = alert.budget;
      
      // Check if we should trigger this alert
      let shouldTrigger = false;
      let message = '';
      let categoryData: any = null;

      switch (alert.alertType) {
        case 'OVERSPEND':
          categoryData = await this.checkOverspend(budget, alert.categoryName);
          if (categoryData && categoryData.percentageUsed >= (alert.threshold || 100)) {
            shouldTrigger = true;
            message = `You've spent ${categoryData.percentageUsed.toFixed(0)}% of your ${categoryData.name} budget ($${categoryData.spent.toFixed(2)} / $${categoryData.budgeted.toFixed(2)})`;
          }
          break;

        case 'APPROACHING_LIMIT':
          categoryData = await this.checkApproachingLimit(budget, alert.categoryName, alert.threshold);
          if (categoryData) {
            shouldTrigger = true;
            message = `Alert: You've used ${categoryData.percentageUsed.toFixed(0)}% of your ${categoryData.name || 'total'} budget`;
          }
          break;

        case 'LOW_BALANCE':
          const lowBalance = await this.checkLowBalance(alert.userId, alert.threshold);
          if (lowBalance) {
            shouldTrigger = true;
            message = `Low balance warning: ${lowBalance.accountName} has $${lowBalance.balance.toFixed(2)} remaining`;
          }
          break;

        case 'UNUSUAL_SPENDING':
          const anomalies = await this.checkUnusualSpending(alert.userId);
          if (anomalies.length > 0) {
            shouldTrigger = true;
            message = `Unusual spending detected: ${anomalies.length} transaction${anomalies.length > 1 ? 's' : ''} significantly above normal`;
          }
          break;

        case 'BILL_DUE':
          const upcomingBills = await this.checkUpcomingBills(alert.userId);
          if (upcomingBills.length > 0) {
            shouldTrigger = true;
            message = `${upcomingBills.length} bill${upcomingBills.length > 1 ? 's' : ''} due in the next 3 days`;
          }
          break;
      }

      if (shouldTrigger) {
        // Check if we already triggered recently (avoid spam)
        const hourAgo = new Date();
        hourAgo.setHours(hourAgo.getHours() - 1);

        if (alert.lastTriggered && alert.lastTriggered > hourAgo) {
          return false; // Already triggered in last hour
        }

        // Update alert
        await prisma.budgetAlert.update({
          where: { id: alert.id },
          data: {
            lastTriggered: new Date(),
            triggerCount: { increment: 1 }
          }
        });

        // Send notification
        await this.sendAlertNotification(alert, message, categoryData);

        return true;
      }

      return false;
    } catch (error: any) {
      logger.error('Failed to check alert', { alertId: alert.id, error: error.message });
      return false;
    }
  }

  /**
   * Check for overspend
   */
  private async checkOverspend(budget: any, categoryName?: string): Promise<any> {
    if (categoryName) {
      const category = budget.categories.find((c: any) => c.name === categoryName);
      if (!category) return null;

      const percentageUsed = (category.spentAmount / category.budgetedAmount) * 100;
      
      return {
        name: category.name,
        spent: category.spentAmount,
        budgeted: category.budgetedAmount,
        percentageUsed
      };
    } else {
      // Overall budget
      const totalSpent = budget.categories.reduce((sum: number, cat: any) => sum + cat.spentAmount, 0);
      const totalBudgeted = budget.totalBudget;
      const percentageUsed = (totalSpent / totalBudgeted) * 100;

      return {
        name: 'overall budget',
        spent: totalSpent,
        budgeted: totalBudgeted,
        percentageUsed
      };
    }
  }

  /**
   * Check for approaching limit
   */
  private async checkApproachingLimit(budget: any, categoryName: string | null, threshold: number | null): Promise<any> {
    const data = await this.checkOverspend(budget, categoryName || undefined);
    
    if (data && data.percentageUsed >= (threshold || 75)) {
      return data;
    }
    
    return null;
  }

  /**
   * Check for low account balance
   */
  private async checkLowBalance(userId: string, threshold: number | null): Promise<any> {
    const minBalance = threshold || 100;

    const account = await prisma.financialAccount.findFirst({
      where: {
        userId,
        isActive: true,
        balance: { lt: minBalance }
      },
      orderBy: { balance: 'asc' }
    });

    return account;
  }

  /**
   * Check for unusual spending
   */
  private async checkUnusualSpending(userId: string): Promise<any[]> {
    // Get last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: sevenDaysAgo }
      }
    });

    // Get 30-60 days ago for baseline
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const baselineTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
      }
    });

    // Calculate baseline average
    const baselineAvg = baselineTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) / 
                        Math.max(baselineTransactions.length, 1);

    // Find anomalies (2x or more than baseline)
    const anomalies = recentTransactions.filter(tx => Math.abs(tx.amount) > baselineAvg * 2);

    return anomalies;
  }

  /**
   * Check for upcoming bills
   */
  private async checkUpcomingBills(userId: string): Promise<any[]> {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const upcomingRecurring = await prisma.recurringTransaction.findMany({
      where: {
        userId,
        nextExpectedDate: {
          gte: new Date(),
          lte: threeDaysFromNow
        },
        reminderEnabled: true
      }
    });

    return upcomingRecurring;
  }

  /**
   * Send alert notification
   */
  private async sendAlertNotification(alert: any, message: string, categoryData: any): Promise<void> {
    try {
      const priority = alert.alertType === 'OVERSPEND' ? 'high' : 'medium';

      // Create in-app notification
      if (alert.notifyInApp) {
        await prisma.notification.create({
          data: {
            userId: alert.userId,
            type: 'BUDGET_ALERT',
            title: `Budget Alert: ${alert.alertType.replace('_', ' ')}`,
            message,
            priority,
            actionUrl: `/financial?tab=overview`,
            metadata: JSON.stringify({
              alertId: alert.id,
              alertType: alert.alertType,
              categoryData
            })
          }
        });
      }

      // TODO: Send email if alert.notifyEmail
      // TODO: Send push if alert.notifyPush

      logger.info('Alert notification sent', { alertId: alert.id, userId: alert.userId });
    } catch (error: any) {
      logger.error('Failed to send alert notification', { alertId: alert.id, error: error.message });
    }
  }
}

export const budgetAlertService = BudgetAlertService.getInstance();

