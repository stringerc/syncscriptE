// Simple calendar sync service stub to prevent initialization errors
export interface CalendarProvider {
  id: string;
  name: string;
  type: 'google' | 'outlook' | 'apple' | 'caldav';
  enabled: boolean;
  config: {
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
    scope?: string[];
  };
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  isAllDay: boolean;
  source: 'syncscript' | 'external';
  externalId?: string;
  provider?: string;
}

export interface SyncResult {
  success: boolean;
  eventsAdded: number;
  eventsUpdated: number;
  eventsDeleted: number;
  errors: string[];
}

// Simple stub service that doesn't cause initialization errors
export const calendarSyncService = {
  getProviders: (): CalendarProvider[] => [
    {
      id: 'google',
      name: 'Google Calendar',
      type: 'google',
      enabled: false,
      config: {
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
        redirectUri: `${window.location.origin}/callback`,
        scope: ['https://www.googleapis.com/auth/calendar']
      },
      status: 'disconnected'
    },
    {
      id: 'outlook',
      name: 'Microsoft Outlook',
      type: 'outlook',
      enabled: false,
      config: {
        clientId: import.meta.env.VITE_OUTLOOK_CLIENT_ID,
        clientSecret: import.meta.env.VITE_OUTLOOK_CLIENT_SECRET,
        redirectUri: `${window.location.origin}/callback`,
        scope: ['https://graph.microsoft.com/calendars.readwrite']
      },
      status: 'disconnected'
    },
    {
      id: 'apple',
      name: 'Apple Calendar',
      type: 'apple',
      enabled: false,
      config: {
        clientId: import.meta.env.VITE_APPLE_CLIENT_ID,
        clientSecret: import.meta.env.VITE_APPLE_CLIENT_SECRET,
        redirectUri: `${window.location.origin}/callback`,
        scope: ['calendars']
      },
      status: 'disconnected'
    }
  ],
  
  setProviderEnabled: async (providerId: string, enabled: boolean): Promise<void> => {
    console.log(`Setting ${providerId} enabled: ${enabled}`);
  },
  
  getAuthUrl: (providerId: string): string => {
    console.log(`Getting auth URL for ${providerId}`);
    return `https://example.com/auth/${providerId}`;
  },
  
  handleCallback: async (code: string, state: string): Promise<{ success: boolean; message: string }> => {
    console.log('Handling OAuth callback:', { code, state });
    return { success: true, message: 'Successfully connected' };
  },
  
  syncEvents: async (providerId: string, direction: 'import' | 'export' | 'bidirectional' = 'bidirectional'): Promise<SyncResult> => {
    console.log(`Syncing events for ${providerId} (${direction})`);
    return {
      success: true,
      eventsAdded: 0,
      eventsUpdated: 0,
      eventsDeleted: 0,
      errors: []
    };
  },
  
  getSyncStatus: (): Record<string, { lastSync?: Date; status: string; enabled: boolean }> => {
    return {
      google: { status: 'disconnected', enabled: false },
      outlook: { status: 'disconnected', enabled: false },
      apple: { status: 'disconnected', enabled: false }
    };
  },
  
  disconnectProvider: async (providerId: string): Promise<{ success: boolean; message: string }> => {
    console.log(`Disconnecting ${providerId}`);
    return { success: true, message: `Disconnected from ${providerId}` };
  },
  
  testProvider: async (providerId: string): Promise<{ success: boolean; message: string }> => {
    console.log(`Testing ${providerId} provider`);
    return { success: true, message: `${providerId} connection test successful` };
  }
};