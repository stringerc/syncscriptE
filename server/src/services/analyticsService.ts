import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

export type AnalyticsEventType = 
  // Task events
  | 'task_create' | 'task_complete' | 'task_delete' | 'task_update'
  // Suggestion events
  | 'suggestion_shown' | 'suggestion_accepted' | 'suggestion_rejected'
  // Challenge events
  | 'challenge_start' | 'challenge_pause' | 'challenge_resume' | 'challenge_complete' | 'challenge_fail'
  // Focus events
  | 'focus_lock_enter' | 'focus_lock_exit' | 'focus_lock_break'
  // Search events
  | 'search_query' | 'search_result_click'
  // Calendar events
  | 'calendar_write' | 'calendar_sync' | 'calendar_event_create'
  // Template events
  | 'template_save' | 'template_apply' | 'template_share'
  // Social events
  | 'friend_request' | 'friend_accept' | 'friend_block'
  // Event management
  | 'event_pin' | 'event_unpin'
  // Priority events
  | 'priority_recompute' | 'priority_manual_override'
  // Feedback events
  | 'feedback_submitted' | 'feedback_screenshot_attached'
  // Energy events
  | 'energy_level_change' | 'energy_conversion'

export interface AnalyticsEventData {
  [key: string]: any
}

export interface AnalyticsMetadata {
  userAgent?: string
  viewport?: { width: number; height: number }
  url?: string
  flags?: any
  consoleErrors?: string[]
  [key: string]: any
}

export class AnalyticsService {
  private static instance: AnalyticsService
  private eventQueue: any[] = []
  private flushInterval: NodeJS.Timeout | null = null
  private readonly FLUSH_INTERVAL = 10000 // 10 seconds
  private readonly MAX_QUEUE_SIZE = 100

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
      AnalyticsService.instance.startFlushInterval()
    }
    return AnalyticsService.instance
  }

  /**
   * Log an analytics event
   * Events are queued and flushed periodically for performance
   */
  async logEvent(
    userId: string,
    eventType: AnalyticsEventType,
    eventData?: AnalyticsEventData,
    metadata?: AnalyticsMetadata
  ): Promise<void> {
    const event = {
      userId,
      eventType,
      eventData: eventData ? JSON.stringify(eventData) : '{}',
      metadata: metadata ? JSON.stringify(metadata) : null
    }

    this.eventQueue.push(event)

    // Flush immediately if queue is full
    if (this.eventQueue.length >= this.MAX_QUEUE_SIZE) {
      await this.flushQueue()
    }
  }

  /**
   * Flush queued events to database
   */
  private async flushQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return

    const events = [...this.eventQueue]
    this.eventQueue = []

    try {
      await prisma.analyticsEvent.createMany({
        data: events
      })
      
      logger.info('Analytics events flushed', { count: events.length })
    } catch (error) {
      logger.error('Failed to flush analytics events', { 
        count: events.length, 
        error: error.message 
      })
      
      // Re-queue events on failure (with limit to prevent infinite growth)
      if (this.eventQueue.length < this.MAX_QUEUE_SIZE) {
        this.eventQueue.unshift(...events.slice(0, this.MAX_QUEUE_SIZE - this.eventQueue.length))
      }
    }
  }

  /**
   * Start periodic flush interval
   */
  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flushQueue()
    }, this.FLUSH_INTERVAL)
  }

  /**
   * Stop flush interval and flush remaining events
   */
  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    await this.flushQueue()
  }

  /**
   * Get analytics data for a user
   */
  async getUserAnalytics(
    userId: string,
    eventType?: AnalyticsEventType,
    startDate?: Date,
    endDate?: Date,
    limit = 100
  ): Promise<any[]> {
    const where: any = { userId }
    
    if (eventType) {
      where.eventType = eventType
    }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    return await prisma.analyticsEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }

  /**
   * Get event counts grouped by type
   */
  async getEventCounts(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Record<string, number>> {
    const where: any = { userId }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    const events = await prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      where,
      _count: {
        eventType: true
      }
    })

    const counts: Record<string, number> = {}
    events.forEach(event => {
      counts[event.eventType] = event._count.eventType
    })

    return counts
  }

  /**
   * Get conversion funnel data
   * Example: suggestion_shown -> suggestion_accepted
   */
  async getFunnelConversion(
    userId: string,
    fromEvent: AnalyticsEventType,
    toEvent: AnalyticsEventType,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ shown: number; converted: number; rate: number }> {
    const where: any = { userId }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    const shown = await prisma.analyticsEvent.count({
      where: { ...where, eventType: fromEvent }
    })

    const converted = await prisma.analyticsEvent.count({
      where: { ...where, eventType: toEvent }
    })

    const rate = shown > 0 ? (converted / shown) * 100 : 0

    return { shown, converted, rate }
  }
}

export const analyticsService = AnalyticsService.getInstance()

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  await analyticsService.shutdown()
})
