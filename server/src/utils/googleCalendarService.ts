import { google } from 'googleapis';
import { logger } from './logger';

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    responseStatus?: string;
  }>;
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

export interface GoogleCalendarCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export class GoogleCalendarService {
  private oauth2Client: any;
  private calendar: any;

  constructor(credentials: GoogleCalendarCredentials) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/google-callback'
    );

    this.oauth2Client.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
      expiry_date: credentials.expiresAt?.getTime()
    });

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Get authorization URL for OAuth flow
   */
  static getAuthUrl(): string {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/google-callback'
    );

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  static async getTokensFromCode(code: string): Promise<GoogleCalendarCredentials> {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/google-callback'
    );

    try {
      const { tokens } = await oauth2Client.getToken(code);
      
      return {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || undefined,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined
      };
    } catch (error) {
      logger.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Refresh access token if needed
   */
  async refreshTokenIfNeeded(): Promise<GoogleCalendarCredentials> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      return {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || this.oauth2Client.credentials.refresh_token,
        expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined
      };
    } catch (error) {
      logger.error('Error refreshing token:', error);
      throw new Error('Failed to refresh access token');
    }
  }


  /**
   * Get list of calendars
   */
  async getCalendars(): Promise<any[]> {
    try {
      const response = await this.calendar.calendarList.list();
      const calendars = response.data.items || [];
      
      logger.info('Fetched calendars from Google', { 
        totalCalendars: calendars.length,
        calendarIds: calendars.map(cal => cal.id)
      });
      
      return calendars;
    } catch (error) {
      logger.error('Error fetching calendars:', error);
      throw new Error('Failed to fetch calendars');
    }
  }

  /**
   * Get events from a specific calendar
   */
  async getEvents(calendarId: string = 'primary', options: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    singleEvents?: boolean;
    orderBy?: string;
  } = {}): Promise<any[]> {
    try {
      // The calendar ID is already properly formatted from the route
      // No need to encode again as it's already handled by the route
      
      const response = await this.calendar.events.list({
        calendarId: calendarId,
        timeMin: options.timeMin || new Date().toISOString(),
        timeMax: options.timeMax,
        maxResults: options.maxResults || 100,
        singleEvents: options.singleEvents !== false,
        orderBy: options.orderBy || 'startTime'
      });

      const events = response.data.items || [];
      
      // Log holiday events specifically
      if (calendarId.includes('holiday')) {
        logger.info('Fetched holiday events', { 
          calendarId, 
          eventCount: events.length,
          events: events.map(e => ({ title: e.summary, date: e.start?.date || e.start?.dateTime }))
        });
      }

      return events;
    } catch (error) {
      logger.error('Error fetching events:', error);
      throw new Error('Failed to fetch events');
    }
  }

  /**
   * Create a new event
   */
  async createEvent(calendarId: string = 'primary', event: GoogleCalendarEvent): Promise<any> {
    try {
      const response = await this.calendar.events.insert({
        calendarId,
        resource: event
      });

      logger.info('Google Calendar event created', { 
        eventId: response.data.id,
        calendarId 
      });

      return response.data;
    } catch (error) {
      logger.error('Error creating event:', error);
      throw new Error('Failed to create event in Google Calendar');
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(calendarId: string = 'primary', eventId: string, event: GoogleCalendarEvent): Promise<any> {
    try {
      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        resource: event
      });

      logger.info('Google Calendar event updated', { 
        eventId,
        calendarId 
      });

      return response.data;
    } catch (error) {
      logger.error('Error updating event:', error);
      throw new Error('Failed to update event in Google Calendar');
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(calendarId: string = 'primary', eventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId
      });

      logger.info('Google Calendar event deleted', { 
        eventId,
        calendarId 
      });
    } catch (error) {
      logger.error('Error deleting event:', error);
      throw new Error('Failed to delete event from Google Calendar');
    }
  }

  /**
   * Sync events from Google Calendar to local database
   */
  async syncEventsToLocal(calendarId: string = 'primary', userId: string, prisma: any): Promise<{
    created: number;
    updated: number;
    errors: number;
    createdEvents: Array<{ title: string; startTime: string; endTime: string }>;
    updatedEvents: Array<{ title: string; startTime: string; endTime: string }>;
  }> {
    const stats = { 
      created: 0, 
      updated: 0, 
      errors: 0,
      createdEvents: [] as Array<{ title: string; startTime: string; endTime: string }>,
      updatedEvents: [] as Array<{ title: string; startTime: string; endTime: string }>
    };

    try {
      // Get events from Google Calendar - only future events
      const googleEvents = await this.getEvents(calendarId, {
        timeMin: new Date().toISOString(), // Start from now (no past events)
        timeMax: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Next year
        maxResults: 1000
      });

      for (const googleEvent of googleEvents) {
        try {
          let startTime: Date;
          let endTime: Date;
          let isAllDay = false;

          // Handle all-day events (like holidays)
          if (googleEvent.start.date || googleEvent.end.date) {
            startTime = new Date(googleEvent.start.date + 'T00:00:00');
            endTime = new Date(googleEvent.end.date + 'T23:59:59');
            isAllDay = true;
          } else {
            startTime = new Date(googleEvent.start.dateTime);
            endTime = new Date(googleEvent.end.dateTime);
            isAllDay = false;
          }

          // Check if event already exists in local database
          const existingEvent = await prisma.event.findFirst({
            where: {
              userId,
              calendarEventId: googleEvent.id,
              calendarProvider: 'google'
            }
          });

          const eventData = {
            title: googleEvent.summary || 'Untitled Event',
            description: googleEvent.description,
            startTime,
            endTime,
            location: googleEvent.location,
            calendarEventId: googleEvent.id,
            calendarProvider: 'google',
            isAllDay
          };

          if (existingEvent) {
            // Update existing event
            await prisma.event.update({
              where: { id: existingEvent.id },
              data: eventData
            });
            stats.updated++;
            stats.updatedEvents.push({
              title: eventData.title,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString()
            });
          } else {
            // Create new event
            await prisma.event.create({
              data: {
                ...eventData,
                userId
              }
            });
            stats.created++;
            stats.createdEvents.push({
              title: eventData.title,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString()
            });
          }
        } catch (error) {
          logger.error('Error syncing individual event:', error);
          stats.errors++;
        }
      }

      // Clean up duplicate events (same title and start time)
      await this.cleanupDuplicateEvents(userId, prisma);

      logger.info('Google Calendar sync completed', { 
        userId, 
        calendarId, 
        stats 
      });

      return stats;
    } catch (error) {
      logger.error('Error syncing events from Google Calendar:', error);
      throw new Error('Failed to sync events from Google Calendar');
    }
  }

  /**
   * Clean up duplicate events
   */
  private async cleanupDuplicateEvents(userId: string, prisma: any): Promise<void> {
    try {
      // Find events with the same title and start time
      const duplicates = await prisma.$queryRaw`
        SELECT title, "startTime", COUNT(*) as count
        FROM "events"
        WHERE "userId" = ${userId}
        GROUP BY title, "startTime"
        HAVING COUNT(*) > 1
      `;

      for (const duplicate of duplicates) {
        // Keep the first event, delete the rest
        const events = await prisma.event.findMany({
          where: {
            userId,
            title: duplicate.title,
            startTime: new Date(duplicate.startTime)
          },
          orderBy: { createdAt: 'asc' }
        });

        // Delete all but the first one
        if (events.length > 1) {
          const idsToDelete = events.slice(1).map(e => e.id);
          await prisma.event.deleteMany({
            where: { id: { in: idsToDelete } }
          });
          
          logger.info('Cleaned up duplicate events', { 
            userId, 
            title: duplicate.title, 
            deletedCount: idsToDelete.length 
          });
        }
      }
    } catch (error) {
      logger.error('Error cleaning up duplicate events:', error);
    }
  }

  /**
   * Sync local events to Google Calendar
   */
  async syncLocalEventsToGoogle(events: any[], calendarId: string = 'primary'): Promise<{
    created: number;
    updated: number;
    errors: number;
  }> {
    const stats = { created: 0, updated: 0, errors: 0 };

    for (const event of events) {
      try {
        const googleEvent: GoogleCalendarEvent = {
          summary: event.title,
          description: event.description,
          start: {
            dateTime: event.startTime.toISOString(),
            timeZone: 'UTC'
          },
          end: {
            dateTime: event.endTime.toISOString(),
            timeZone: 'UTC'
          },
          location: event.location
        };

        if (event.calendarEventId) {
          // Update existing event
          await this.updateEvent(calendarId, event.calendarEventId, googleEvent);
          stats.updated++;
        } else {
          // Create new event
          const createdEvent = await this.createEvent(calendarId, googleEvent);
          
          // Update local event with Google Calendar event ID
          // Note: This would need to be handled by the calling function
          stats.created++;
        }
      } catch (error) {
        logger.error('Error syncing individual event to Google:', error);
        stats.errors++;
      }
    }

    return stats;
  }

  // Subscribe to a holiday calendar
  async subscribeToHolidayCalendar(calendarId: string): Promise<void> {
    try {
      await this.calendar.calendarList.insert({
        requestBody: {
          id: calendarId,
          selected: true,
          hidden: false
        }
      });
      
      logger.info('Successfully subscribed to holiday calendar', { calendarId });
    } catch (error) {
      logger.error('Error subscribing to holiday calendar:', error);
      throw error;
    }
  }

  // Get available holiday calendars
  async getAvailableHolidayCalendars(): Promise<Array<{ id: string; summary: string; description?: string }>> {
    try {
      // Common US holiday calendars
      const holidayCalendars = [
        {
          id: 'en.usa#holiday@group.v.calendar.google.com',
          summary: 'US Holidays',
          description: 'Major holidays in the United States'
        },
        {
          id: 'en.usa.official#holiday@group.v.calendar.google.com',
          summary: 'US Official Holidays',
          description: 'Official federal holidays in the United States'
        }
      ];

      return holidayCalendars;
    } catch (error) {
      logger.error('Error getting available holiday calendars:', error);
      throw error;
    }
  }

  static async getUserInfo(accessToken: string): Promise<{ id: string; email: string; name: string }> {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/google-callback'
    );

    oauth2Client.setCredentials({ access_token: accessToken });
    
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    
    return {
      id: data.id!,
      email: data.email!,
      name: data.name || data.email!
    };
  }
}
