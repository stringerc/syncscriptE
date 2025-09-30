import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

export interface FeatureFlags {
  // AI Features
  askAI: boolean
  
  // Productivity Features
  focusLock: boolean
  mic: boolean
  priorityHierarchy: boolean
  templates: boolean
  pinnedEvents: boolean
  
  // Calendar Integrations
  googleCalendar: boolean
  outlookCalendar: boolean
  appleCalendar: boolean
  
  // Social Features
  friends: boolean
  
  // Marketplace
  shareScript: boolean
  
  // Energy & Gamification
  energyHUD: boolean
  energyGraph: boolean
}

export class FeatureFlagService {
  private static instance: FeatureFlagService
  private cache = new Map<string, { flags: FeatureFlags; expiry: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService()
    }
    return FeatureFlagService.instance
  }

  /**
   * Get feature flags for a user
   * Uses caching to reduce database load
   */
  async getUserFlags(userId: string): Promise<FeatureFlags> {
    try {
      // Check cache first
      const cached = this.cache.get(userId)
      if (cached && cached.expiry > Date.now()) {
        return cached.flags
      }

      // Fetch from database
      let userFlags = await prisma.userFeatureFlags.findUnique({
        where: { userId }
      })

      // Create default flags if none exist
      if (!userFlags) {
        userFlags = await prisma.userFeatureFlags.create({
          data: { userId }
        })
      }

      const flags: FeatureFlags = {
        askAI: userFlags.askAI,
        focusLock: userFlags.focusLock,
        mic: userFlags.mic,
        priorityHierarchy: userFlags.priorityHierarchy,
        templates: userFlags.templates,
        pinnedEvents: userFlags.pinnedEvents,
        googleCalendar: userFlags.googleCalendar,
        outlookCalendar: userFlags.outlookCalendar,
        appleCalendar: userFlags.appleCalendar,
        friends: userFlags.friends,
        shareScript: userFlags.shareScript,
        energyHUD: userFlags.energyHUD,
        energyGraph: userFlags.energyGraph
      }

      // Cache the result
      this.cache.set(userId, {
        flags,
        expiry: Date.now() + this.CACHE_TTL
      })

      return flags
    } catch (error) {
      logger.error('Error fetching user flags', { userId, error: error.message })
      // Return all flags as false on error
      return this.getDefaultFlags()
    }
  }

  /**
   * Update feature flags for a user
   * Invalidates cache
   */
  async updateUserFlags(userId: string, updates: Partial<FeatureFlags>): Promise<FeatureFlags> {
    try {
      // Ensure flags exist
      await prisma.userFeatureFlags.upsert({
        where: { userId },
        create: { userId, ...updates },
        update: updates
      })

      // Invalidate cache
      this.cache.delete(userId)

      // Return updated flags
      return await this.getUserFlags(userId)
    } catch (error) {
      logger.error('Error updating user flags', { userId, updates, error: error.message })
      throw error
    }
  }

  /**
   * Check if a specific flag is enabled for a user
   */
  async isFlagEnabled(userId: string, flagName: keyof FeatureFlags): Promise<boolean> {
    const flags = await this.getUserFlags(userId)
    return flags[flagName]
  }

  /**
   * Enable a feature for a user
   */
  async enableFlag(userId: string, flagName: keyof FeatureFlags): Promise<void> {
    await this.updateUserFlags(userId, { [flagName]: true })
    logger.info('Feature flag enabled', { userId, flagName })
  }

  /**
   * Disable a feature for a user
   */
  async disableFlag(userId: string, flagName: keyof FeatureFlags): Promise<void> {
    await this.updateUserFlags(userId, { [flagName]: false })
    logger.info('Feature flag disabled', { userId, flagName })
  }

  /**
   * Get default flags (all disabled)
   */
  private getDefaultFlags(): FeatureFlags {
    return {
      askAI: false,
      focusLock: false,
      mic: false,
      priorityHierarchy: false,
      templates: false,
      pinnedEvents: false,
      googleCalendar: false,
      outlookCalendar: false,
      appleCalendar: false,
      friends: false,
      shareScript: false,
      energyHUD: false,
      energyGraph: false
    }
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache(userId?: string): void {
    if (userId) {
      this.cache.delete(userId)
    } else {
      this.cache.clear()
    }
  }
}

export const featureFlagService = FeatureFlagService.getInstance()
