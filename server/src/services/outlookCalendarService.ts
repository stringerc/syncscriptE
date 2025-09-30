import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'
import axios from 'axios'
import { calendarSyncService } from './calendarSyncService'

const prisma = new PrismaClient()

export class OutlookCalendarService {
  private static instance: OutlookCalendarService
  private readonly GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0'

  static getInstance(): OutlookCalendarService {
    if (!OutlookCalendarService.instance) {
      OutlookCalendarService.instance = new OutlookCalendarService()
    }
    return OutlookCalendarService.instance
  }

  /**
   * Get OAuth URL for Microsoft Graph
   */
  getAuthUrl(userId: string): string {
    const clientId = process.env.OUTLOOK_CLIENT_ID
    const redirectUri = process.env.OUTLOOK_REDIRECT_URI
    const scopes = 'Calendars.ReadWrite offline_access'
    
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `state=${userId}`
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string, userId: string): Promise<any> {
    try {
      const response = await axios.post(
        'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        new URLSearchParams({
          client_id: process.env.OUTLOOK_CLIENT_ID!,
          client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
          code,
          redirect_uri: process.env.OUTLOOK_REDIRECT_URI!,
          grant_type: 'authorization_code'
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      )

      const { access_token, refresh_token, expires_in } = response.data

      // Get user profile to get email
      const profileResponse = await axios.get(`${this.GRAPH_ENDPOINT}/me`, {
        headers: { Authorization: `Bearer ${access_token}` }
      })

      const email = profileResponse.data.mail || profileResponse.data.userPrincipalName

      // Store account
      const account = await prisma.externalCalendarAccount.create({
        data: {
          userId,
          provider: 'outlook',
          accountId: profileResponse.data.id,
          email,
          accessToken: access_token,
          refreshToken: refresh_token,
          tokenExpiry: new Date(Date.now() + expires_in * 1000),
          scopes: JSON.stringify(['Calendars.ReadWrite']),
          status: 'CONNECTED'
        }
      })

      logger.info('Outlook account connected', { userId, email })

      return account
    } catch (error: any) {
      logger.error('Failed to exchange Outlook code', { error: error.message })
      throw error
    }
  }

  /**
   * Delta sync with Microsoft Graph
   */
  async deltaSyncEvents(userId: string, accountId: string): Promise<any> {
    try {
      const account = await prisma.externalCalendarAccount.findFirst({
        where: { userId, provider: 'outlook', id: accountId }
      })

      if (!account) {
        throw new Error('Outlook account not found')
      }

      // Refresh token if needed
      if (account.tokenExpiry && new Date() >= account.tokenExpiry) {
        await this.refreshAccessToken(accountId)
      }

      // Delta query
      const deltaUrl = account.syncToken 
        ? `${this.GRAPH_ENDPOINT}/me/calendar/events/delta?$deltatoken=${account.syncToken}`
        : `${this.GRAPH_ENDPOINT}/me/calendar/events/delta`

      const response = await axios.get(deltaUrl, {
        headers: { Authorization: `Bearer ${account.accessToken}` }
      })

      const events = response.data.value || []
      const deltaLink = response.data['@odata.deltaLink']
      const newDeltaToken = deltaLink ? new URL(deltaLink).searchParams.get('$deltatoken') : null

      let created = 0
      let updated = 0
      const conflicts: any[] = []

      // Process events
      for (const providerEvent of events) {
        try {
          await calendarSyncService.retryWithBackoff(async () => {
            await this.processOutlookEvent(userId, accountId, providerEvent, conflicts)
          })
          created++
        } catch (error) {
          logger.error('Failed to process Outlook event', { error, eventId: providerEvent.id })
        }
      }

      // Update delta token
      await prisma.externalCalendarAccount.update({
        where: { id: accountId },
        data: {
          syncToken: newDeltaToken,
          lastSyncAt: new Date()
        }
      })

      logger.info('Outlook delta sync completed', { userId, created, conflicts: conflicts.length })

      return { created, updated, conflicts }
    } catch (error: any) {
      logger.error('Outlook delta sync failed', { error: error.message })
      throw error
    }
  }

  /**
   * Process Outlook event
   */
  private async processOutlookEvent(
    userId: string,
    accountId: string,
    providerEvent: any,
    conflicts: any[]
  ): Promise<void> {
    // Check duplicate
    const isDuplicate = await calendarSyncService.checkDuplicate(
      'outlook',
      providerEvent.parentFolderId || 'default',
      providerEvent.id
    )

    if (isDuplicate) return

    // Parse recurrence
    const isRecurring = !!providerEvent.recurrence
    const seriesMasterId = providerEvent.seriesMasterId

    // Create canonical event
    const canonicalEvent = await prisma.event.create({
      data: {
        userId,
        title: providerEvent.subject || 'Untitled',
        description: providerEvent.bodyPreview,
        startTime: new Date(providerEvent.start.dateTime),
        endTime: new Date(providerEvent.end.dateTime),
        location: providerEvent.location?.displayName,
        isAllDay: providerEvent.isAllDay,
        calendarEventId: providerEvent.id,
        calendarProvider: 'outlook'
      }
    })

    // Create link
    const clientEventKey = calendarSyncService.generateClientEventKey(
      'outlook',
      providerEvent.parentFolderId || 'default',
      {
        summary: providerEvent.subject,
        start: providerEvent.start.dateTime,
        end: providerEvent.end.dateTime
      }
    )

    await prisma.externalCalendarLink.create({
      data: {
        accountId,
        provider: 'outlook',
        calendarId: providerEvent.parentFolderId || 'default',
        providerEventId: providerEvent.id,
        etag: providerEvent['@odata.etag'],
        clientEventKey,
        canonicalEventId: canonicalEvent.id,
        seriesMasterId,
        lastMutator: 'provider',
        lastSyncedAt: new Date()
      }
    })

    logger.info('Outlook event synced', { providerEventId: providerEvent.id })
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(accountId: string): Promise<void> {
    const account = await prisma.externalCalendarAccount.findUnique({
      where: { id: accountId }
    })

    if (!account) return

    const response = await axios.post(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      new URLSearchParams({
        client_id: process.env.OUTLOOK_CLIENT_ID!,
        client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
        refresh_token: account.refreshToken!,
        grant_type: 'refresh_token'
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    await prisma.externalCalendarAccount.update({
      where: { id: accountId },
      data: {
        accessToken: response.data.access_token,
        tokenExpiry: new Date(Date.now() + response.data.expires_in * 1000)
      }
    })
  }

  /**
   * Setup webhook for change notifications
   */
  async setupWebhook(userId: string, accountId: string): Promise<void> {
    const account = await prisma.externalCalendarAccount.findFirst({
      where: { id: accountId, userId }
    })

    if (!account) throw new Error('Account not found')

    const webhookUrl = `${process.env.BACKEND_URL}/api/webhooks/outlook`
    
    const response = await axios.post(
      `${this.GRAPH_ENDPOINT}/subscriptions`,
      {
        changeType: 'created,updated,deleted',
        notificationUrl: webhookUrl,
        resource: '/me/calendar/events',
        expirationDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
        clientState: accountId
      },
      { headers: { Authorization: `Bearer ${account.accessToken}` } }
    )

    logger.info('Outlook webhook created', { userId, subscriptionId: response.data.id })
  }
}

export const outlookCalendarService = OutlookCalendarService.getInstance()
