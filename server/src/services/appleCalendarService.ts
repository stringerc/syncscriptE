import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'
import axios from 'axios'
import { calendarSyncService } from './calendarSyncService'

const prisma = new PrismaClient()

interface ICSEvent {
  uid: string
  summary: string
  description?: string
  dtstart: string
  dtend: string
  location?: string
  rrule?: string
  recurrenceId?: string
  timezone?: string
}

export class AppleCalendarService {
  private static instance: AppleCalendarService
  private readonly REFRESH_INTERVAL = 30 * 60 * 1000 // 30 minutes

  static getInstance(): AppleCalendarService {
    if (!AppleCalendarService.instance) {
      AppleCalendarService.instance = new AppleCalendarService()
    }
    return AppleCalendarService.instance
  }

  /**
   * Subscribe to ICS feed (read-only)
   */
  async subscribeToICSFeed(userId: string, icsUrl: string): Promise<any> {
    try {
      // Hash URL for storage (security)
      const crypto = require('crypto')
      const urlHash = crypto.createHash('sha256').update(icsUrl).digest('hex')

      // Create account record
      const account = await prisma.externalCalendarAccount.create({
        data: {
          userId,
          provider: 'apple',
          accountId: urlHash,
          status: 'CONNECTED',
          scopes: JSON.stringify(['read-only'])
        }
      })

      logger.info('Apple Calendar ICS feed subscribed', { userId, urlHash: urlHash.substring(0, 8) })

      // Initial sync
      await this.refreshICSFeed(userId, account.id, icsUrl)

      return account
    } catch (error: any) {
      logger.error('Failed to subscribe to ICS feed', { error: error.message })
      throw error
    }
  }

  /**
   * Refresh ICS feed and sync events
   */
  async refreshICSFeed(userId: string, accountId: string, icsUrl: string): Promise<any> {
    try {
      // Fetch ICS file
      const response = await axios.get(icsUrl, {
        timeout: 10000,
        headers: { 'User-Agent': 'SyncScript/1.0' }
      })

      const icsData = response.data

      // Parse ICS
      const events = this.parseICS(icsData)

      let created = 0
      let updated = 0

      // Process each event
      for (const icsEvent of events) {
        try {
          await this.processICSEvent(userId, accountId, icsEvent)
          created++
        } catch (error) {
          logger.error('Failed to process ICS event', { error, uid: icsEvent.uid })
        }
      }

      // Update last sync time
      await prisma.externalCalendarAccount.update({
        where: { id: accountId },
        data: { lastSyncAt: new Date() }
      })

      logger.info('ICS feed refreshed', { userId, accountId, created })

      return { created, updated }
    } catch (error: any) {
      logger.error('Failed to refresh ICS feed', { error: error.message })
      throw error
    }
  }

  /**
   * Parse ICS file
   */
  private parseICS(icsData: string): ICSEvent[] {
    const events: ICSEvent[] = []
    const lines = icsData.split(/\r?\n/)
    
    let currentEvent: Partial<ICSEvent> = {}
    let inEvent = false

    for (const line of lines) {
      const trimmed = line.trim()

      if (trimmed === 'BEGIN:VEVENT') {
        inEvent = true
        currentEvent = {}
      } else if (trimmed === 'END:VEVENT') {
        if (currentEvent.uid && currentEvent.dtstart && currentEvent.dtend) {
          events.push(currentEvent as ICSEvent)
        }
        inEvent = false
        currentEvent = {}
      } else if (inEvent) {
        const [key, ...valueParts] = trimmed.split(':')
        const value = valueParts.join(':')

        if (key.startsWith('UID')) currentEvent.uid = value
        else if (key.startsWith('SUMMARY')) currentEvent.summary = value
        else if (key.startsWith('DESCRIPTION')) currentEvent.description = value
        else if (key.startsWith('DTSTART')) {
          // Extract timezone if present
          const tzMatch = key.match(/TZID=([^:;]+)/)
          currentEvent.timezone = tzMatch ? tzMatch[1] : 'UTC'
          currentEvent.dtstart = value
        }
        else if (key.startsWith('DTEND')) currentEvent.dtend = value
        else if (key.startsWith('LOCATION')) currentEvent.location = value
        else if (key.startsWith('RRULE')) currentEvent.rrule = value
        else if (key.startsWith('RECURRENCE-ID')) currentEvent.recurrenceId = value
      }
    }

    return events
  }

  /**
   * Process ICS event
   */
  private async processICSEvent(
    userId: string,
    accountId: string,
    icsEvent: ICSEvent
  ): Promise<void> {
    // Check duplicate by UID
    const isDuplicate = await calendarSyncService.checkDuplicate(
      'apple',
      'default',
      icsEvent.uid
    )

    if (isDuplicate) return

    // Parse datetime
    const startTime = this.parseICSDateTime(icsEvent.dtstart, icsEvent.timezone)
    const endTime = this.parseICSDateTime(icsEvent.dtend, icsEvent.timezone)

    // Create canonical event
    const canonicalEvent = await prisma.event.create({
      data: {
        userId,
        title: icsEvent.summary || 'Untitled',
        description: icsEvent.description,
        startTime,
        endTime,
        location: icsEvent.location,
        calendarProvider: 'apple'
      }
    })

    // Create link
    const clientEventKey = calendarSyncService.generateClientEventKey(
      'apple',
      'default',
      { summary: icsEvent.summary, start: startTime, end: endTime }
    )

    await prisma.externalCalendarLink.create({
      data: {
        accountId,
        provider: 'apple',
        calendarId: 'default',
        providerEventId: icsEvent.uid,
        clientEventKey,
        canonicalEventId: canonicalEvent.id,
        recurrenceId: icsEvent.recurrenceId,
        lastMutator: 'provider',
        lastSyncedAt: new Date()
      }
    })

    logger.info('Apple ICS event synced', { uid: icsEvent.uid })
  }

  /**
   * Parse ICS datetime to Date object
   */
  private parseICSDateTime(icsDate: string, timezone?: string): Date {
    // ICS format: YYYYMMDDTHHMMSS or YYYYMMDD
    if (icsDate.includes('T')) {
      // DateTime
      const year = parseInt(icsDate.substring(0, 4))
      const month = parseInt(icsDate.substring(4, 6)) - 1
      const day = parseInt(icsDate.substring(6, 8))
      const hour = parseInt(icsDate.substring(9, 11))
      const minute = parseInt(icsDate.substring(11, 13))
      const second = parseInt(icsDate.substring(13, 15))

      const date = new Date(year, month, day, hour, minute, second)
      
      // TODO: Apply timezone offset
      return date
    } else {
      // Date only (all-day)
      const year = parseInt(icsDate.substring(0, 4))
      const month = parseInt(icsDate.substring(4, 6)) - 1
      const day = parseInt(icsDate.substring(6, 8))
      
      return new Date(year, month, day)
    }
  }

  /**
   * Schedule periodic refresh
   */
  schedulePeriodicRefresh(userId: string, accountId: string, icsUrl: string): void {
    setInterval(async () => {
      try {
        await this.refreshICSFeed(userId, accountId, icsUrl)
        logger.info('Scheduled ICS refresh completed', { userId, accountId })
      } catch (error) {
        logger.error('Scheduled ICS refresh failed', { error })
      }
    }, this.REFRESH_INTERVAL)

    logger.info('Periodic ICS refresh scheduled', { userId, interval: '30 minutes' })
  }
}

export const appleCalendarService = AppleCalendarService.getInstance()
