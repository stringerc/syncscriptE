import { budgetAlertService } from '../services/budgetAlertService';
import { logger } from '../utils/logger';

/**
 * Monitor budgets and trigger alerts
 * Runs every hour
 */
export async function monitorBudgets() {
  logger.info('Starting budget monitoring job...');

  try {
    await budgetAlertService.checkAllAlerts();
    logger.info('Budget monitoring job completed successfully');
  } catch (error) {
    logger.error('Budget monitoring job failed', { error });
  }
}

// Run every hour
export function startBudgetMonitoring() {
  // Run immediately on startup
  monitorBudgets();
  
  // Then every hour
  setInterval(monitorBudgets, 60 * 60 * 1000);
  
  logger.info('Budget monitoring job scheduled (every hour)');
}

