import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'
import crypto from 'crypto'

const prisma = new PrismaClient()

export interface SyncConflict {
  id: string
  type: 'overlap' | 'write_contention' | 'etag_mismatch'
  ourEvent: any
  theirEvent: any
  suggestedActions: ConflictAction[]
}

export interface ConflictAction {
  action: 'keep_both' | 'move_mine' | 'cancel' | 'take_theirs'
  description: string
  newStartTime?: Date
}

export interface SyncResult {
  created: number
  updated: number
  conflicts: SyncConflict[]
  errors: any[]
  syncToken?: string
}

export class CalendarSyncService {
  private static instance: CalendarSyncService
  private deadLetterQueue: any[] = []
  private readonly MAX_RETRIES = 3
  private readonly BASE_DELAY = 1000

  static getInstance(): CalendarSyncService {
    if (!CalendarSyncService.instance) {
      CalendarSyncService.instance = new CalendarSyncService()
    }
    return CalendarSyncService.instance
  }

  /**
   * Generate idempotency key for calendar write
   */
  generateIdempotencyKey(
    canonicalEventId: string,
    start: Date,
    end: Date,
    lastMutator: string,
    version: number
  ): string {
    const data = `${canonicalEventId}|${start.toISOString()}|${end.toISOString()}|${lastMutator}|${version}`
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  /**
   * Generate client event key for deduplication
   */
  generateClientEventKey(
    provider: string,
    calendarId: string,
    eventData: any
  ): string {
    const data = `${provider}|${calendarId}|${eventData.summary}|${eventData.start}|${eventData.end}`
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  /**
   * Check for duplicate event
   */
  async checkDuplicate(
    provider: string,
    calendarId: string,
    providerEventId: string
  ): Promise<boolean> {
    const existing = await prisma.externalCalendarLink.findUnique({
      where: {
        provider_calendarId_providerEventId: {
          provider,
          calendarId,
          providerEventId
        }
      }
    })

    return !!existing
  }

  /**
   * Validate ETag before write
   */
  async validateETag(linkId: string, expectedETag: string): Promise<boolean> {
    const link = await prisma.externalCalendarLink.findUnique({
      where: { id: linkId }
    })

    return link?.etag === expectedETag
  }

  /**
   * Detect calendar conflicts
   */
  async detectConflicts(
    userId: string,
    newEvent: any,
    providerEvents: any[]
  ): Promise<SyncConflict[]> {
    const conflicts: SyncConflict[] = []

    const newStart = new Date(newEvent.startTime)
    const newEnd = new Date(newEvent.endTime)

    // Check for overlaps with existing events
    const existingEvents = await prisma.event.findMany({
      where: {
        userId,
        OR: [
          {
            startTime: { lte: newEnd },
            endTime: { gte: newStart }
          }
        ]
      }
    })

    for (const existing of existingEvents) {
      if (existing.id === newEvent.id) continue

      const existingStart = new Date(existing.startTime)
      const existingEnd = new Date(existing.endTime)

      // Check overlap
      if (newStart < existingEnd && existingStart < newEnd) {
        // Find next available slot
        const nextSlot = new Date(existingEnd)
        nextSlot.setMinutes(nextSlot.getMinutes() + 15) // 15 min buffer

        conflicts.push({
          id: `conflict-${newEvent.id}-${existing.id}`,
          type: 'overlap',
          ourEvent: newEvent,
          theirEvent: existing,
          suggestedActions: [
            {
              action: 'keep_both',
              description: 'Keep both events (schedule will show overlap)'
            },
            {
              action: 'move_mine',
              description: `Move new event to ${nextSlot.toLocaleTimeString()}`,
              newStartTime: nextSlot
            },
            {
              action: 'cancel',
              description: 'Cancel creating this event'
            }
          ]
        })
      }
    }

    return conflicts
  }

  /**
   * Retry with exponential backoff and jitter
   */
  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries = this.MAX_RETRIES,
    attempt = 0
  ): Promise<T> {
    try {
      return await fn()
    } catch (error: any) {
      if (attempt >= retries) {
        // Add to dead letter queue
        this.deadLetterQueue.push({
          error: error.message,
          timestamp: new Date(),
          attempts: attempt + 1
        })
        throw error
      }

      // Calculate delay with jitter
      const baseDelay = this.BASE_DELAY * Math.pow(2, attempt)
      const jitter = Math.random() * 0.3 * baseDelay
      const delay = baseDelay + jitter

      logger.warn('Retry attempt', {
        attempt: attempt + 1,
        maxRetries: retries,
        delay,
        error: error.message
      })

      await new Promise(resolve => setTimeout(resolve, delay))
      return this.retryWithBackoff(fn, retries, attempt + 1)
    }
  }

  /**
   * Get dead letter queue
   */
  getDeadLetterQueue(): any[] {
    return [...this.deadLetterQueue]
  }

  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue(): void {
    this.deadLetterQueue = []
  }

  /**
   * Normalize timezone to IANA
   */
  normalizeTimezone(tz: string): string {
    // Common timezone mappings
    const tzMap: Record<string, string> = {
      'EST': 'America/New_York',
      'PST': 'America/Los_Angeles',
      'CST': 'America/Chicago',
      'MST': 'America/Denver'
    }

    return tzMap[tz] || tz
  }

  /**
   * Parse recurring event
   */
  parseRecurrence(recurrenceRule: string): any {
    // Simple RRULE parsing
    const parts = recurrenceRule.split(';')
    const parsed: any = {}

    for (const part of parts) {
      const [key, value] = part.split('=')
      parsed[key] = value
    }

    return parsed
  }
}

export const calendarSyncService = CalendarSyncService.getInstance()
