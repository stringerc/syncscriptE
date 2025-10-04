/**
 * Energy-Gamification Adapter
 * 
 * This adapter handles communication between the Energy Engine and Gamification domains
 * without creating direct dependencies. It uses the event system for loose coupling.
 */

import { logger } from '../utils/logger'
import { publishEvent } from '../services/eventService'

/**
 * Adapter for energy-related gamification events
 * This prevents direct coupling between energy and gamification services
 */
export class EnergyGamificationAdapter {
  /**
   * Notify gamification system when energy points are earned
   */
  static async onEnergyPointsEarned(
    userId: string,
    amount: number,
    source: string,
    domain: string,
    description?: string
  ): Promise<void> {
    try {
      // Publish event instead of direct service call
      await publishEvent('EnergyPointsEarned', 'Energy', userId, {
        userId,
        amount,
        source,
        domain,
        description,
        earnedAt: new Date()
      })
      
      logger.info('Energy points earned event published', {
        userId,
        amount,
        source,
        domain
      })
    } catch (error) {
      logger.error('Failed to publish energy points earned event', {
        userId,
        amount,
        source,
        domain,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Notify gamification system when energy level changes
   */
  static async onEnergyLevelChanged(
    userId: string,
    oldLevel: number,
    newLevel: number,
    energyGained: number
  ): Promise<void> {
    try {
      await publishEvent('EnergyLevelChanged', 'Energy', userId, {
        userId,
        oldLevel,
        newLevel,
        energyGained,
        changedAt: new Date()
      })
      
      logger.info('Energy level changed event published', {
        userId,
        oldLevel,
        newLevel,
        energyGained
      })
    } catch (error) {
      logger.error('Failed to publish energy level changed event', {
        userId,
        oldLevel,
        newLevel,
        energyGained,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Notify gamification system when daily energy reset occurs
   */
  static async onDailyEnergyReset(
    userId: string,
    previousEnergy: number,
    previousEP: number,
    resetDate: Date
  ): Promise<void> {
    try {
      await publishEvent('DailyEnergyReset', 'Energy', userId, {
        userId,
        previousEnergy,
        previousEP,
        resetDate,
        resetAt: new Date()
      })
      
      logger.info('Daily energy reset event published', {
        userId,
        previousEnergy,
        previousEP,
        resetDate
      })
    } catch (error) {
      logger.error('Failed to publish daily energy reset event', {
        userId,
        previousEnergy,
        previousEP,
        resetDate,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

/**
 * Adapter for gamification-related energy events
 * This prevents direct coupling between gamification and energy services
 */
export class GamificationEnergyAdapter {
  /**
   * Request energy points for gamification activities
   */
  static async requestEnergyPoints(
    userId: string,
    amount: number,
    source: string,
    domain: string,
    description?: string
  ): Promise<void> {
    try {
      await publishEvent('GamificationEnergyRequest', 'Gamification', userId, {
        userId,
        amount,
        source,
        domain,
        description,
        requestedAt: new Date()
      })
      
      logger.info('Gamification energy request published', {
        userId,
        amount,
        source,
        domain
      })
    } catch (error) {
      logger.error('Failed to publish gamification energy request', {
        userId,
        amount,
        source,
        domain,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Notify energy system when achievements are unlocked
   */
  static async onAchievementUnlocked(
    userId: string,
    achievementId: string,
    achievementName: string,
    points: number
  ): Promise<void> {
    try {
      await publishEvent('AchievementUnlocked', 'Gamification', userId, {
        userId,
        achievementId,
        achievementName,
        points,
        unlockedAt: new Date()
      })
      
      logger.info('Achievement unlocked event published', {
        userId,
        achievementId,
        achievementName,
        points
      })
    } catch (error) {
      logger.error('Failed to publish achievement unlocked event', {
        userId,
        achievementId,
        achievementName,
        points,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}
