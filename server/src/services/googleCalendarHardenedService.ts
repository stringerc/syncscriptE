import { google } from 'googleapis'
import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'
import { calendarSyncService } from './calendarSyncService'

const prisma = new PrismaClient()

export class GoogleCalendarHardenedService {
  private static instance: GoogleCalendarHardenedService
  private oauth2Client: any

  static getInstance(): GoogleCalendarHardenedService {
    if (!GoogleCalendarHardenedService.instance) {
      GoogleCalendarHardenedService.instance = new GoogleCalendarHardenedService()
      GoogleCalendarHardenedService.instance.initializeOAuth()
    }
    return GoogleCalendarHardenedService.instance
  }

  private initializeOAuth() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )
  }

  /**
   * Sync events with delta sync (incremental)
   */
  async deltaSyncEvents(userId: string, accountId: string): Promise<any> {
    try {
      // Get account with sync token
      const account = await prisma.externalCalendarAccount.findFirst({
        where: { userId, provider: 'google', id: accountId }
      })

      if (!account) {
        throw new Error('Google Calendar account not found')
      }

      // Set credentials
      this.oauth2Client.setCredentials({
        access_token: account.accessToken,
        refresh_token: account.refreshToken
      })

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

      // Use delta sync if we have a sync token
      const listParams: any = {
        calendarId: 'primary',
        singleEvents: false, // Get recurring events
        maxResults: 100
      }

      if (account.syncToken) {
        listParams.syncToken = account.syncToken
      } else {
        listParams.timeMin = new Date().toISOString()
      }

      const response = await calendar.events.list(listParams)

      const events = response.data.items || []
      const newSyncToken = response.data.nextSyncToken

      let created = 0
      let updated = 0
      const conflicts: any[] = []
      const errors: any[] = []

      // Process each event
      for (const providerEvent of events) {
        try {
          await calendarSyncService.retryWithBackoff(async () => {
            await this.processGoogleEvent(userId, accountId, providerEvent, conflicts)
          })
          
          if (providerEvent.status === 'confirmed') {
            created++
          } else {
            updated++
          }
        } catch (error: any) {
          logger.error('Failed to process Google event', { error: error.message, eventId: providerEvent.id })
          errors.push({ eventId: providerEvent.id, error: error.message })
        }
      }

      // Update sync token
      await prisma.externalCalendarAccount.update({
        where: { id: accountId },
        data: {
          syncToken: newSyncToken,
          lastSyncAt: new Date()
        }
      })

      logger.info('Google delta sync completed', {
        userId,
        accountId,
        created,
        updated,
        conflicts: conflicts.length,
        errors: errors.length
      })

      return {
        created,
        updated,
        conflicts,
        errors,
        syncToken: newSyncToken
      }
    } catch (error: any) {
      logger.error('Google delta sync failed', { error: error.message, userId })
      throw error
    }
  }

  /**
   * Process individual Google Calendar event
   */
  private async processGoogleEvent(
    userId: string,
    accountId: string,
    providerEvent: any,
    conflicts: any[]
  ): Promise<void> {
    // Generate client event key for deduplication
    const clientEventKey = calendarSyncService.generateClientEventKey(
      'google',
      'primary',
      {
        summary: providerEvent.summary,
        start: providerEvent.start?.dateTime || providerEvent.start?.date,
        end: providerEvent.end?.dateTime || providerEvent.end?.date
      }
    )

    // Check for duplicate
    const isDuplicate = await calendarSyncService.checkDuplicate(
      'google',
      'primary',
      providerEvent.id
    )

    if (isDuplicate) {
      logger.info('Duplicate Google event detected, skipping', { eventId: providerEvent.id })
      return
    }

    // Parse times
    const startTime = new Date(providerEvent.start?.dateTime || providerEvent.start?.date)
    const endTime = new Date(providerEvent.end?.dateTime || providerEvent.end?.date)

    // Create canonical event
    const canonicalEvent = await prisma.event.create({
      data: {
        userId,
        title: providerEvent.summary || 'Untitled Event',
        description: providerEvent.description,
        startTime,
        endTime,
        location: providerEvent.location,
        isAllDay: !!providerEvent.start?.date,
        calendarEventId: providerEvent.id,
        calendarProvider: 'google'
      }
    })

    // Create external calendar link
    await prisma.externalCalendarLink.create({
      data: {
        accountId,
        provider: 'google',
        calendarId: 'primary',
        providerEventId: providerEvent.id,
        etag: providerEvent.etag,
        clientEventKey,
        canonicalEventId: canonicalEvent.id,
        seriesMasterId: providerEvent.recurringEventId,
        lastMutator: 'provider',
        lastSyncedAt: new Date()
      }
    })

    logger.info('Google event synced', {
      providerEventId: providerEvent.id,
      canonicalEventId: canonicalEvent.id
    })
  }

  /**
   * Write event to Google Calendar with idempotency
   */
  async writeEventToGoogle(
    userId: string,
    accountId: string,
    canonicalEvent: any,
    idempotencyKey: string
  ): Promise<any> {
    try {
      // Check if already written
      const existing = await prisma.externalCalendarLink.findFirst({
        where: {
          canonicalEventId: canonicalEvent.id,
          provider: 'google'
        }
      })

      if (existing) {
        logger.info('Event already synced to Google, skipping', { eventId: canonicalEvent.id })
        return { isDuplicate: true, providerEventId: existing.providerEventId }
      }

      const account = await prisma.externalCalendarAccount.findFirst({
        where: { id: accountId, userId, provider: 'google' }
      })

      if (!account) {
        throw new Error('Google Calendar account not found')
      }

      this.oauth2Client.setCredentials({
        access_token: account.accessToken,
        refresh_token: account.refreshToken
      })

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

      // Create event with idempotency key
      const eventData = {
        summary: canonicalEvent.title,
        description: canonicalEvent.description,
        location: canonicalEvent.location,
        start: {
          dateTime: new Date(canonicalEvent.startTime).toISOString(),
          timeZone: 'America/New_York' // TODO: User timezone
        },
        end: {
          dateTime: new Date(canonicalEvent.endTime).toISOString(),
          timeZone: 'America/New_York'
        }
      }

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: eventData,
        conferenceDataVersion: 1
      })

      const providerEvent = response.data

      // Create link
      const clientEventKey = calendarSyncService.generateClientEventKey('google', 'primary', eventData)
      
      await prisma.externalCalendarLink.create({
        data: {
          accountId,
          provider: 'google',
          calendarId: 'primary',
          providerEventId: providerEvent.id!,
          etag: providerEvent.etag,
          clientEventKey,
          canonicalEventId: canonicalEvent.id,
          lastMutator: 'user',
          lastSyncedAt: new Date()
        }
      })

      logger.info('Event written to Google Calendar', {
        canonicalEventId: canonicalEvent.id,
        providerEventId: providerEvent.id
      })

      return {
        isDuplicate: false,
        providerEventId: providerEvent.id,
        etag: providerEvent.etag
      }
    } catch (error: any) {
      logger.error('Failed to write to Google Calendar', { error: error.message, eventId: canonicalEvent.id })
      throw error
    }
  }

  /**
   * Update Google Calendar event with ETag validation
   */
  async updateGoogleEvent(
    linkId: string,
    updates: any,
    expectedETag: string
  ): Promise<any> {
    // Validate ETag first
    const isValid = await calendarSyncService.validateETag(linkId, expectedETag)

    if (!isValid) {
      throw new Error('ETag mismatch - event was modified. Please refresh and try again.')
    }

    // Proceed with update
    const link = await prisma.externalCalendarLink.findUnique({
      where: { id: linkId },
      include: { account: true }
    })

    if (!link) {
      throw new Error('Calendar link not found')
    }

    this.oauth2Client.setCredentials({
      access_token: link.account.accessToken,
      refresh_token: link.account.refreshToken
    })

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

    const response = await calendar.events.update({
      calendarId: link.calendarId,
      eventId: link.providerEventId,
      requestBody: updates
    })

    // Update ETag
    await prisma.externalCalendarLink.update({
      where: { id: linkId },
      data: {
        etag: response.data.etag,
        version: { increment: 1 },
        lastMutator: 'user',
        lastSyncedAt: new Date()
      }
    })

    return response.data
  }
}

export const googleCalendarHardenedService = GoogleCalendarHardenedService.getInstance()
