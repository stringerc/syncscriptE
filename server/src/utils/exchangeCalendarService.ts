import axios from 'axios';
import { logger } from './logger';
import { CalendarEvent, CalendarCredentials, CalendarProviderService } from './calendarService';

export interface ExchangeCalendarEvent {
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
  isAllDay?: boolean;
  showAs?: string;
  sensitivity?: string;
  importance?: string;
}

export class ExchangeCalendarService implements CalendarProviderService {
  private accessToken: string;
  private refreshToken: string;
  private readonly baseUrl = 'https://graph.microsoft.com/v1.0';

  constructor(credentials: CalendarCredentials) {
    this.accessToken = credentials.accessToken;
    this.refreshToken = credentials.refreshToken!;
  }

  private async makeRequest(method: string, endpoint: string, data?: any) {
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
      logger.error(`Exchange Graph API request failed:`, error);
      
      // Handle token refresh
      if (error.response?.status === 401) {
        try {
          await this.refreshToken();
          // Retry the request with new token
          const retryResponse = await axios({
            method,
            url,
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            data,
          });
          return retryResponse.data;
        } catch (refreshError) {
          logger.error('Failed to refresh Exchange token:', refreshError);
          throw new Error('Failed to refresh Exchange access token');
        }
      }
      
      throw error;
    }
  }

  async getEvents(timeMin?: string, timeMax?: string): Promise<CalendarEvent[]> {
    try {
      // Get user's calendars first
      const calendarsResponse = await this.makeRequest('GET', '/me/calendars');
      const calendars = calendarsResponse.value || [];
      
      const allEvents: CalendarEvent[] = [];
      
      // Fetch events from each calendar
      for (const calendar of calendars) {
        try {
          let endpoint = `/me/calendars/${calendar.id}/events`;
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
          
          const eventsResponse = await this.makeRequest('GET', endpoint);
          const events = eventsResponse.value || [];
          
          // Convert Exchange events to our standard format
          const convertedEvents = events.map((event: ExchangeCalendarEvent) => 
            this.convertExchangeEventToCalendarEvent(event)
          );
          
          allEvents.push(...convertedEvents);
        } catch (error) {
          logger.error(`Error fetching events from Exchange calendar ${calendar.name}:`, error);
          // Continue with other calendars
        }
      }
      
      return allEvents;
    } catch (error) {
      logger.error('Error fetching Exchange events:', error);
      throw new Error('Failed to fetch Exchange calendar events');
    }
  }

  async createEvent(event: CalendarEvent): Promise<CalendarEvent> {
    try {
      // Convert our event format to Exchange format
      const exchangeEvent = this.convertCalendarEventToExchange(event);
      
      // Create in the primary calendar
      const response = await this.makeRequest('POST', '/me/events', exchangeEvent);
      
      return this.convertExchangeEventToCalendarEvent(response);
    } catch (error) {
      logger.error('Error creating Exchange event:', error);
      throw new Error('Failed to create Exchange calendar event');
    }
  }

  async updateEvent(eventId: string, event: CalendarEvent): Promise<CalendarEvent> {
    try {
      // Convert our event format to Exchange format
      const exchangeEvent = this.convertCalendarEventToExchange(event);
      
      const response = await this.makeRequest('PATCH', `/me/events/${eventId}`, exchangeEvent);
      
      return this.convertExchangeEventToCalendarEvent(response);
    } catch (error) {
      logger.error('Error updating Exchange event:', error);
      throw new Error('Failed to update Exchange calendar event');
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.makeRequest('DELETE', `/me/events/${eventId}`);
    } catch (error) {
      logger.error('Error deleting Exchange event:', error);
      throw new Error('Failed to delete Exchange calendar event');
    }
  }

  async refreshToken(): Promise<CalendarCredentials> {
    try {
      // Exchange uses the same OAuth flow as Outlook
      const response = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        client_id: process.env.OUTLOOK_CLIENT_ID,
        client_secret: process.env.OUTLOOK_CLIENT_SECRET,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token',
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;

      return {
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        expiresAt: new Date(Date.now() + response.data.expires_in * 1000)
      };
    } catch (error) {
      logger.error('Error refreshing Exchange token:', error);
      throw new Error('Failed to refresh Exchange access token');
    }
  }

  private convertExchangeEventToCalendarEvent(exchangeEvent: ExchangeCalendarEvent): CalendarEvent {
    return {
      id: exchangeEvent.id,
      summary: exchangeEvent.subject,
      description: exchangeEvent.body?.content,
      start: {
        dateTime: exchangeEvent.start.dateTime,
        timeZone: exchangeEvent.start.timeZone
      },
      end: {
        dateTime: exchangeEvent.end.dateTime,
        timeZone: exchangeEvent.end.timeZone
      },
      location: exchangeEvent.location?.displayName,
      attendees: exchangeEvent.attendees?.map(attendee => ({
        email: attendee.emailAddress.address,
        responseStatus: attendee.status.response
      }))
    };
  }

  private convertCalendarEventToExchange(event: CalendarEvent): ExchangeCalendarEvent {
    return {
      subject: event.summary,
      body: event.description ? {
        content: event.description,
        contentType: 'text'
      } : undefined,
      start: {
        dateTime: event.start.dateTime!,
        timeZone: event.start.timeZone || 'UTC'
      },
      end: {
        dateTime: event.end.dateTime!,
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
      }))
    };
  }
}
