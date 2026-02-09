/**
 * Integration Provider Abstraction Layer
 * 
 * This abstraction allows seamless migration from direct OAuth to Merge.dev
 * without changing any consuming code.
 * 
 * MIGRATION PATH:
 * 1. MVP Phase: Use DirectOAuthProvider (current implementation)
 * 2. Scale Phase: Swap to MergeDevProvider (when you need 10+ integrations)
 * 
 * To migrate: Simply change INTEGRATION_PROVIDER in environment variables
 */

export type IntegrationProvider = 'google' | 'microsoft' | 'slack';
export type IntegrationType = 'calendar' | 'tasks' | 'messaging';

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  scope?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: string[];
  provider: IntegrationProvider;
  external_id: string;
  metadata?: Record<string, any>;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  assignee?: string;
  provider: IntegrationProvider;
  external_id: string;
  metadata?: Record<string, any>;
}

export interface IntegrationConnection {
  id: string;
  user_id: string;
  provider: IntegrationProvider;
  type: IntegrationType;
  connected_at: string;
  last_sync?: string;
  is_active: boolean;
  metadata?: Record<string, any>;
}

/**
 * Base interface that all integration providers must implement
 * This ensures compatibility whether using Direct OAuth or Merge.dev
 */
export interface IIntegrationService {
  // OAuth Flow
  getAuthUrl(provider: IntegrationProvider, state: string): Promise<string>;
  handleCallback(provider: IntegrationProvider, code: string, state: string): Promise<OAuthTokens>;
  refreshToken(provider: IntegrationProvider, refreshToken: string): Promise<OAuthTokens>;
  revokeAccess(provider: IntegrationProvider, userId: string): Promise<void>;

  // Calendar Operations
  getCalendarEvents(
    provider: IntegrationProvider,
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<CalendarEvent[]>;
  
  createCalendarEvent(
    provider: IntegrationProvider,
    userId: string,
    event: Partial<CalendarEvent>
  ): Promise<CalendarEvent>;

  updateCalendarEvent(
    provider: IntegrationProvider,
    userId: string,
    eventId: string,
    updates: Partial<CalendarEvent>
  ): Promise<CalendarEvent>;

  deleteCalendarEvent(
    provider: IntegrationProvider,
    userId: string,
    eventId: string
  ): Promise<void>;

  // Task Operations (for Slack, future Jira/Linear/Asana)
  getTasks(
    provider: IntegrationProvider,
    userId: string,
    filters?: { status?: string; assignee?: string }
  ): Promise<Task[]>;

  createTask(
    provider: IntegrationProvider,
    userId: string,
    task: Partial<Task>
  ): Promise<Task>;

  updateTask(
    provider: IntegrationProvider,
    userId: string,
    taskId: string,
    updates: Partial<Task>
  ): Promise<Task>;

  // Connection Management
  getConnections(userId: string): Promise<IntegrationConnection[]>;
  getConnection(userId: string, provider: IntegrationProvider): Promise<IntegrationConnection | null>;
  syncConnection(userId: string, provider: IntegrationProvider): Promise<void>;
}

/**
 * Factory function to get the appropriate integration service
 * based on environment configuration
 */
export function getIntegrationService(): IIntegrationService {
  const providerType = import.meta.env.VITE_INTEGRATION_PROVIDER || 'direct_oauth';
  
  switch (providerType) {
    case 'merge_dev':
      // Future: return new MergeDevProvider();
      throw new Error('Merge.dev provider not yet implemented. Coming in Scale Phase.');
    
    case 'direct_oauth':
    default:
      // Current: Use the existing direct OAuth implementation
      return new DirectOAuthProvider();
  }
}

/**
 * Direct OAuth Provider Implementation
 * Wraps your existing OAuth implementation with the standard interface
 */
class DirectOAuthProvider implements IIntegrationService {
  private baseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  async getAuthUrl(provider: IntegrationProvider, state: string): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/functions/v1/make-server-57781ad9/oauth/${provider}/auth-url`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get auth URL for ${provider}`);
    }
    
    const data = await response.json();
    return data.authUrl;
  }

  async handleCallback(
    provider: IntegrationProvider,
    code: string,
    state: string
  ): Promise<OAuthTokens> {
    const response = await fetch(
      `${this.baseUrl}/functions/v1/make-server-57781ad9/oauth/${provider}/callback`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, state })
      }
    );
    
    if (!response.ok) {
      throw new Error(`OAuth callback failed for ${provider}`);
    }
    
    return await response.json();
  }

  async refreshToken(provider: IntegrationProvider, refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch(
      `${this.baseUrl}/functions/v1/make-server-57781ad9/oauth/${provider}/refresh`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Token refresh failed for ${provider}`);
    }
    
    return await response.json();
  }

  async revokeAccess(provider: IntegrationProvider, userId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/functions/v1/make-server-57781ad9/oauth/${provider}/revoke`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ user_id: userId })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to revoke access for ${provider}`);
    }
  }

  async getCalendarEvents(
    provider: IntegrationProvider,
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<CalendarEvent[]> {
    const response = await fetch(
      `${this.baseUrl}/functions/v1/make-server-57781ad9/calendar/${provider}/events?` +
      `start_date=${startDate}&end_date=${endDate}`,
      {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch calendar events from ${provider}`);
    }
    
    const events = await response.json();
    return this.normalizeCalendarEvents(events, provider);
  }

  async createCalendarEvent(
    provider: IntegrationProvider,
    userId: string,
    event: Partial<CalendarEvent>
  ): Promise<CalendarEvent> {
    const response = await fetch(
      `${this.baseUrl}/functions/v1/make-server-57781ad9/calendar/${provider}/events`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(event)
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to create calendar event on ${provider}`);
    }
    
    return await response.json();
  }

  async updateCalendarEvent(
    provider: IntegrationProvider,
    userId: string,
    eventId: string,
    updates: Partial<CalendarEvent>
  ): Promise<CalendarEvent> {
    const response = await fetch(
      `${this.baseUrl}/functions/v1/make-server-57781ad9/calendar/${provider}/events/${eventId}`,
      {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(updates)
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to update calendar event on ${provider}`);
    }
    
    return await response.json();
  }

  async deleteCalendarEvent(
    provider: IntegrationProvider,
    userId: string,
    eventId: string
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/functions/v1/make-server-57781ad9/calendar/${provider}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to delete calendar event from ${provider}`);
    }
  }

  async getTasks(
    provider: IntegrationProvider,
    userId: string,
    filters?: { status?: string; assignee?: string }
  ): Promise<Task[]> {
    // Future implementation for Slack tasks, Jira, Linear, Asana
    return [];
  }

  async createTask(
    provider: IntegrationProvider,
    userId: string,
    task: Partial<Task>
  ): Promise<Task> {
    // Future implementation
    throw new Error('Task creation not yet implemented');
  }

  async updateTask(
    provider: IntegrationProvider,
    userId: string,
    taskId: string,
    updates: Partial<Task>
  ): Promise<Task> {
    // Future implementation
    throw new Error('Task updates not yet implemented');
  }

  async getConnections(userId: string): Promise<IntegrationConnection[]> {
    const response = await fetch(
      `${this.baseUrl}/functions/v1/make-server-57781ad9/oauth/connections`,
      {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch user connections');
    }
    
    return await response.json();
  }

  async getConnection(
    userId: string,
    provider: IntegrationProvider
  ): Promise<IntegrationConnection | null> {
    const connections = await this.getConnections(userId);
    return connections.find(c => c.provider === provider) || null;
  }

  async syncConnection(userId: string, provider: IntegrationProvider): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/functions/v1/make-server-57781ad9/oauth/${provider}/sync`,
      {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to sync ${provider} connection`);
    }
  }

  /**
   * Normalize calendar events from different providers into a standard format
   */
  private normalizeCalendarEvents(
    events: any[],
    provider: IntegrationProvider
  ): CalendarEvent[] {
    return events.map(event => {
      // Google Calendar format
      if (provider === 'google') {
        return {
          id: event.id,
          title: event.summary || 'Untitled Event',
          description: event.description,
          start_time: event.start.dateTime || event.start.date,
          end_time: event.end.dateTime || event.end.date,
          location: event.location,
          attendees: event.attendees?.map((a: any) => a.email) || [],
          provider: 'google',
          external_id: event.id,
          metadata: event
        };
      }
      
      // Microsoft Outlook format
      if (provider === 'microsoft') {
        return {
          id: event.id,
          title: event.subject || 'Untitled Event',
          description: event.bodyPreview,
          start_time: event.start.dateTime,
          end_time: event.end.dateTime,
          location: event.location?.displayName,
          attendees: event.attendees?.map((a: any) => a.emailAddress.address) || [],
          provider: 'microsoft',
          external_id: event.id,
          metadata: event
        };
      }
      
      // Slack format (if applicable)
      return {
        id: event.id,
        title: event.title || 'Untitled Event',
        description: event.description,
        start_time: event.start_time,
        end_time: event.end_time,
        provider: 'slack',
        external_id: event.id,
        metadata: event
      };
    });
  }
}

/**
 * Future: Merge.dev Provider Implementation
 * 
 * When you're ready to scale to 40+ integrations, implement this class:
 * 
 * class MergeDevProvider implements IIntegrationService {
 *   private apiKey = import.meta.env.VITE_MERGE_API_KEY;
 *   private baseUrl = 'https://api.merge.dev/api';
 *   
 *   // Implement all methods using Merge.dev's unified API
 *   // Benefits: 180+ integrations, automatic token refresh, webhooks
 * }
 * 
 * Migration is as simple as:
 * 1. Set VITE_INTEGRATION_PROVIDER=merge_dev
 * 2. Add VITE_MERGE_API_KEY to environment
 * 3. No code changes needed - same interface!
 */
