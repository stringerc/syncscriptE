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
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/google-calendar'
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
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/google-calendar'
    );

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
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
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/google-calendar'
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
      return response.data.items || [];
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
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: options.timeMin || new Date().toISOString(),
        timeMax: options.timeMax,
        maxResults: options.maxResults || 100,
        singleEvents: options.singleEvents !== false,
        orderBy: options.orderBy || 'startTime'
      });

      return response.data.items || [];
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
      // Get events from Google Calendar
      const googleEvents = await this.getEvents(calendarId, {
        timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
        timeMax: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Next year
        maxResults: 1000
      });

      for (const googleEvent of googleEvents) {
        try {
          // Skip all-day events for now (they have different date format)
          if (googleEvent.start.date || googleEvent.end.date) {
            continue;
          }

          const startTime = new Date(googleEvent.start.dateTime);
          const endTime = new Date(googleEvent.end.dateTime);

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
            isAllDay: false
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
}
