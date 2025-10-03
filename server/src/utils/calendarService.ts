import { logger } from './logger';
import { GoogleCalendarService } from './googleCalendarService';
import { OutlookCalendarService } from './outlookCalendarService';
import { ExchangeCalendarService } from './exchangeCalendarService';
import { ICloudCalendarService } from './iCloudCalendarService';

export interface CalendarEvent {
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
  provider?: string; // "google", "outlook", "icloud"
  externalId?: string; // ID from the external calendar system
}

export interface CalendarCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export type CalendarProvider = 'google' | 'outlook' | 'exchange' | 'icloud';

export interface CalendarProviderService {
  getEvents(timeMin?: string, timeMax?: string): Promise<CalendarEvent[]>;
  createEvent(event: CalendarEvent): Promise<CalendarEvent>;
  updateEvent(eventId: string, event: CalendarEvent): Promise<CalendarEvent>;
  deleteEvent(eventId: string): Promise<void>;
  refreshToken(): Promise<CalendarCredentials>;
}

export class MultiCalendarService {
  private providers: Map<CalendarProvider, CalendarProviderService> = new Map();

  constructor(credentials: Map<CalendarProvider, CalendarCredentials>) {
    // Initialize Google Calendar service
    if (credentials.has('google')) {
      this.providers.set('google', new GoogleCalendarService(credentials.get('google')!));
    }

    // Initialize Outlook Calendar service
    if (credentials.has('outlook')) {
      this.providers.set('outlook', new OutlookCalendarService(credentials.get('outlook')!));
    }

    // Initialize Exchange Calendar service
    if (credentials.has('exchange')) {
      this.providers.set('exchange', new ExchangeCalendarService(credentials.get('exchange')!));
    }

    // Initialize iCloud Calendar service
    if (credentials.has('icloud')) {
      this.providers.set('icloud', new ICloudCalendarService(credentials.get('icloud')!));
    }
  }

  /**
   * Get events from all connected calendar providers
   */
  async getAllEvents(timeMin?: string, timeMax?: string): Promise<CalendarEvent[]> {
    const allEvents: CalendarEvent[] = [];
    
    for (const [provider, service] of this.providers) {
      try {
        logger.info(`Fetching events from ${provider} calendar`);
        const events = await service.getEvents(timeMin, timeMax);
        
        // Add provider information to each event
        const eventsWithProvider = events.map(event => ({
          ...event,
          provider,
          externalId: event.id
        }));
        
        allEvents.push(...eventsWithProvider);
        logger.info(`Retrieved ${events.length} events from ${provider}`);
      } catch (error) {
        logger.error(`Error fetching events from ${provider}:`, error);
        // Continue with other providers even if one fails
      }
    }
    
    return allEvents;
  }

  /**
   * Get events from a specific provider
   */
  async getEventsFromProvider(provider: CalendarProvider, timeMin?: string, timeMax?: string): Promise<CalendarEvent[]> {
    const service = this.providers.get(provider);
    if (!service) {
      throw new Error(`Calendar provider ${provider} not configured`);
    }

    const events = await service.getEvents(timeMin, timeMax);
    return events.map(event => ({
      ...event,
      provider,
      externalId: event.id
    }));
  }

  /**
   * Create an event in a specific provider
   */
  async createEventInProvider(provider: CalendarProvider, event: CalendarEvent): Promise<CalendarEvent> {
    const service = this.providers.get(provider);
    if (!service) {
      throw new Error(`Calendar provider ${provider} not configured`);
    }

    const createdEvent = await service.createEvent(event);
    return {
      ...createdEvent,
      provider,
      externalId: createdEvent.id
    };
  }

  /**
   * Update an event in a specific provider
   */
  async updateEventInProvider(provider: CalendarProvider, eventId: string, event: CalendarEvent): Promise<CalendarEvent> {
    const service = this.providers.get(provider);
    if (!service) {
      throw new Error(`Calendar provider ${provider} not configured`);
    }

    const updatedEvent = await service.updateEvent(eventId, event);
    return {
      ...updatedEvent,
      provider,
      externalId: updatedEvent.id
    };
  }

  /**
   * Delete an event from a specific provider
   */
  async deleteEventFromProvider(provider: CalendarProvider, eventId: string): Promise<void> {
    const service = this.providers.get(provider);
    if (!service) {
      throw new Error(`Calendar provider ${provider} not configured`);
    }

    await service.deleteEvent(eventId);
  }

  /**
   * Refresh tokens for all providers
   */
  async refreshAllTokens(): Promise<Map<CalendarProvider, CalendarCredentials>> {
    const refreshedCredentials = new Map<CalendarProvider, CalendarCredentials>();
    
    for (const [provider, service] of this.providers) {
      try {
        logger.info(`Refreshing token for ${provider} calendar`);
        const credentials = await service.refreshToken();
        refreshedCredentials.set(provider, credentials);
        logger.info(`Successfully refreshed token for ${provider}`);
      } catch (error) {
        logger.error(`Error refreshing token for ${provider}:`, error);
        // Continue with other providers even if one fails
      }
    }
    
    return refreshedCredentials;
  }

  /**
   * Get list of connected providers
   */
  getConnectedProviders(): CalendarProvider[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a provider is connected
   */
  isProviderConnected(provider: CalendarProvider): boolean {
    return this.providers.has(provider);
  }
}
