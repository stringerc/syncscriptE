import axios from 'axios';
import { logger } from './logger';
import { CalendarEvent, CalendarCredentials, CalendarProviderService } from './calendarService';

export interface OutlookCalendarEvent {
  id?: string;
  subject: string;
  body?: {
    content: string;
    contentType: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
  attendees?: Array<{
    emailAddress: {
      address: string;
      name?: string;
    };
    status: {
      response: string;
    };
  }>;
  reminderMinutesBeforeStart?: number;
}

export class OutlookCalendarService implements CalendarProviderService {
  private accessToken: string;
  private refreshTokenValue?: string;
  private expiresAt?: Date;
  private readonly baseUrl = 'https://graph.microsoft.com/v1.0';

  constructor(credentials: CalendarCredentials) {
    this.accessToken = credentials.accessToken;
    this.refreshTokenValue = credentials.refreshToken;
    this.expiresAt = credentials.expiresAt;
  }

  private async makeRequest(method: 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: string, data?: any) {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await axios({
        method,
        url,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        data,
      });
      
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Token expired, try to refresh
        await this.refreshToken();
        // Retry the request
        const response = await axios({
          method,
          url,
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          data,
        });
        return response.data;
      }
      throw error;
    }
  }

  async getEvents(timeMin?: string, timeMax?: string): Promise<CalendarEvent[]> {
    try {
      let endpoint = '/me/events';
      const params = new URLSearchParams();
      
      if (timeMin) {
        params.append('startDateTime', timeMin);
      }
      if (timeMax) {
        params.append('endDateTime', timeMax);
      }
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      const response = await this.makeRequest('GET', endpoint);
      const outlookEvents: OutlookCalendarEvent[] = response.value || [];
      
      return outlookEvents.map(this.convertOutlookEventToCalendarEvent);
    } catch (error) {
      logger.error('Error fetching Outlook events:', error);
      throw new Error('Failed to fetch Outlook calendar events');
    }
  }

  async createEvent(event: CalendarEvent): Promise<CalendarEvent> {
    try {
      const outlookEvent = this.convertCalendarEventToOutlook(event);
      const response = await this.makeRequest('POST', '/me/events', outlookEvent);
      
      return this.convertOutlookEventToCalendarEvent(response);
    } catch (error) {
      logger.error('Error creating Outlook event:', error);
      throw new Error('Failed to create Outlook calendar event');
    }
  }

  async updateEvent(eventId: string, event: CalendarEvent): Promise<CalendarEvent> {
    try {
      const outlookEvent = this.convertCalendarEventToOutlook(event);
      const response = await this.makeRequest('PATCH', `/me/events/${eventId}`, outlookEvent);
      
      return this.convertOutlookEventToCalendarEvent(response);
    } catch (error) {
      logger.error('Error updating Outlook event:', error);
      throw new Error('Failed to update Outlook calendar event');
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.makeRequest('DELETE', `/me/events/${eventId}`);
    } catch (error) {
      logger.error('Error deleting Outlook event:', error);
      throw new Error('Failed to delete Outlook calendar event');
    }
  }

  async refreshToken(): Promise<CalendarCredentials> {
    if (!this.refreshTokenValue) {
      throw new Error('No refresh token available for Outlook calendar');
    }

    try {
      const response = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        client_id: process.env.OUTLOOK_CLIENT_ID,
        client_secret: process.env.OUTLOOK_CLIENT_SECRET,
        refresh_token: this.refreshTokenValue,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/Calendars.ReadWrite'
      });

      const { access_token, refresh_token, expires_in } = response.data;
      
      this.accessToken = access_token;
      this.refreshTokenValue = refresh_token;
      this.expiresAt = new Date(Date.now() + expires_in * 1000);

      return {
        accessToken: this.accessToken,
        refreshToken: this.refreshTokenValue,
        expiresAt: this.expiresAt
      };
    } catch (error) {
      logger.error('Error refreshing Outlook token:', error);
      throw new Error('Failed to refresh Outlook calendar token');
    }
  }

  private convertOutlookEventToCalendarEvent(outlookEvent: OutlookCalendarEvent): CalendarEvent {
    return {
      id: outlookEvent.id,
      summary: outlookEvent.subject,
      description: outlookEvent.body?.content,
      start: {
        dateTime: outlookEvent.start.dateTime,
        timeZone: outlookEvent.start.timeZone
      },
      end: {
        dateTime: outlookEvent.end.dateTime,
        timeZone: outlookEvent.end.timeZone
      },
      location: outlookEvent.location?.displayName,
      attendees: outlookEvent.attendees?.map(attendee => ({
        email: attendee.emailAddress.address,
        responseStatus: attendee.status.response
      })),
      reminders: outlookEvent.reminderMinutesBeforeStart ? {
        useDefault: false,
        overrides: [{
          method: 'popup',
          minutes: outlookEvent.reminderMinutesBeforeStart
        }]
      } : undefined
    };
  }

  private convertCalendarEventToOutlook(event: CalendarEvent): OutlookCalendarEvent {
    return {
      subject: event.summary,
      body: event.description ? {
        content: event.description,
        contentType: 'text'
      } : undefined,
      start: {
        dateTime: event.start.dateTime || event.start.date!,
        timeZone: event.start.timeZone || 'UTC'
      },
      end: {
        dateTime: event.end.dateTime || event.end.date!,
        timeZone: event.end.timeZone || 'UTC'
      },
      location: event.location ? {
        displayName: event.location
      } : undefined,
      attendees: event.attendees?.map(attendee => ({
        emailAddress: {
          address: attendee.email,
          name: attendee.email
        },
        status: {
          response: attendee.responseStatus || 'none'
        }
      })),
      reminderMinutesBeforeStart: event.reminders?.overrides?.[0]?.minutes
    };
  }
}
