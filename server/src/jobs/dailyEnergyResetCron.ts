import { logger } from '../utils/logger';
import { resetAllUsersEnergy } from '../services/dailyEnergyResetService';
import { withCronLock } from '../services/cronLockService';

/**
 * Run the daily energy reset job
 * This should be called every 5 minutes to catch users in different timezones
 */
export async function runDailyEnergyResetJob(): Promise<void> {
  await withCronLock(
    'daily-energy-reset',
    async () => {
      const startTime = Date.now();
      
      try {
        logger.info('🌅 Starting daily energy reset job...');
        
        const result = await resetAllUsersEnergy();
        
        const duration = Date.now() - startTime;
        logger.info('✅ Daily energy reset job completed', {
          duration: `${duration}ms`,
          processed: result.processed,
          reset: result.reset,
          errors: result.errors
        });
        
        // Alert if there were errors
        if (result.errors > 0) {
          logger.error('⚠️ Daily energy reset job had errors', {
            errors: result.errors,
            processed: result.processed
          });
        }
        
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error('💥 Daily energy reset job failed', {
          duration: `${duration}ms`,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
      }
    },
    30, // 30 minute lock duration
    {
      jobType: 'energy-reset',
      version: '1.0'
    }
  );
}

/**
 * Start the cron job (runs every 5 minutes)
 */
export function startDailyEnergyResetCron(): NodeJS.Timeout {
  logger.info('🕐 Starting daily energy reset cron job (every 5 minutes)');
  
  // Run immediately on start
  runDailyEnergyResetJob().catch(error => {
    logger.error('Error in initial energy reset job', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  });
  
  // Then run every 5 minutes
  return setInterval(async () => {
    try {
      await runDailyEnergyResetJob();
    } catch (error) {
      logger.error('Error in scheduled energy reset job', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }, 5 * 60 * 1000); // 5 minutes
}

/**
 * Stop the cron job
 */
export function stopDailyEnergyResetCron(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId);
  logger.info('🛑 Daily energy reset cron job stopped');
}
