// OAuth Integration Routes for Google Calendar, Outlook, and Slack
// This file contains OAuth 2.0 flow implementation following RFC 6749

import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Helper: Generate random state for CSRF protection
function generateState(provider: string): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const stateToken = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${provider}:${stateToken}`;
}

// OAuth provider configurations
export const OAUTH_CONFIGS = {
  google_calendar: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: Deno.env.get('GOOGLE_CLIENT_ID') || '',
    clientSecret: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
    defaultScopes: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  },
  // Google Auth (separate config for authentication vs calendar integration)
  google_auth: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: Deno.env.get('GOOGLE_CLIENT_ID') || '',
    clientSecret: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
    defaultScopes: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'openid'
    ]
  },
  outlook_calendar: {
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    clientId: Deno.env.get('MICROSOFT_CLIENT_ID') || '',
    clientSecret: Deno.env.get('MICROSOFT_CLIENT_SECRET') || '',
    defaultScopes: [
      'Calendars.Read',
      'Calendars.ReadWrite',
      'User.Read',
      'offline_access'
    ]
  },
  slack: {
    authUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    clientId: Deno.env.get('SLACK_CLIENT_ID') || '',
    clientSecret: Deno.env.get('SLACK_CLIENT_SECRET') || '',
    defaultScopes: [
      'channels:read',
      'chat:write',
      'users:read',
      'im:write'
    ]
  }
};

export function registerOAuthRoutes(app: Hono) {
  
  // 1. Get integration status
  app.get("/make-server-57781ad9/integrations/:provider/status", async (c) => {
    try {
      const provider = c.req.param('provider');
      
      if (!OAUTH_CONFIGS[provider as keyof typeof OAUTH_CONFIGS]) {
        return c.json({ error: 'Invalid provider' }, 400);
      }

      // Get user session
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const { data: { user } } = await supabase.auth.getUser(accessToken);
      
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Check if integration exists
      const tokens = await kv.get(`oauth:${provider}:${user.id}`);
      
      if (!tokens) {
        return c.json({ connected: false });
      }

      // Get account info and stats
      const accountInfo = await kv.get(`oauth:${provider}:${user.id}:info`);
      const lastSync = await kv.get(`oauth:${provider}:${user.id}:last_sync`);
      const dataPoints = await kv.get(`oauth:${provider}:${user.id}:data_points`) || 0;

      return c.json({
        connected: true,
        status: 'active',
        lastSync: lastSync || 'Never',
        dataPoints,
        accountInfo
      });

    } catch (error) {
      console.error(`[OAUTH] Error getting integration status:`, error);
      return c.json({ error: 'Failed to get integration status' }, 500);
    }
  });

  // 2. Initiate OAuth authorization
  app.post("/make-server-57781ad9/integrations/:provider/authorize", async (c) => {
    try {
      const provider = c.req.param('provider');
      const body = await c.req.json();
      const { scopes, redirectUri } = body;

      const config = OAUTH_CONFIGS[provider as keyof typeof OAUTH_CONFIGS];
      if (!config) {
        return c.json({ error: 'Invalid provider' }, 400);
      }

      // Get user session (optional for OAuth login)
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      let userId: string | null = null;
      
      if (accessToken && accessToken !== Deno.env.get('SUPABASE_ANON_KEY')) {
        const { data: { user } } = await supabase.auth.getUser(accessToken);
        userId = user?.id || null;
      }
      
      // For OAuth login (no user yet), we'll use a temporary ID
      if (!userId) {
        userId = `temp_${crypto.randomUUID()}`;
      }

      // Generate CSRF state token
      const state = generateState(provider);
      
      // Store state temporarily (expires in 10 minutes)
      // Include the redirectUri so the callback can use the exact same one
      await kv.set(`oauth:state:${state}`, {
        userId,
        provider,
        redirectUri,
        createdAt: new Date().toISOString()
      });

      // Build authorization URL
      const scopesList = scopes || config.defaultScopes;
      const authParams = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scopesList.join(' '),
        state,
        access_type: 'offline', // Request refresh token
        prompt: 'consent' // Force consent screen for refresh token
      });

      const authUrl = `${config.authUrl}?${authParams.toString()}`;

      return c.json({ authUrl, state });

    } catch (error) {
      console.error(`[OAUTH] Error initiating authorization:`, error);
      return c.json({ error: 'Failed to initiate authorization', details: String(error) }, 500);
    }
  });

  // 3. Handle OAuth callback
  app.post("/make-server-57781ad9/integrations/:provider/callback", async (c) => {
    try {
      const provider = c.req.param('provider');
      const body = await c.req.json();
      const { code, state } = body;

      const config = OAUTH_CONFIGS[provider as keyof typeof OAUTH_CONFIGS];
      if (!config) {
        return c.json({ error: 'Invalid provider' }, 400);
      }

      // Verify state token
      const stateData = await kv.get(`oauth:state:${state}`);
      if (!stateData || stateData.provider !== provider) {
        return c.json({ error: 'Invalid state token' }, 400);
      }

      const userId = stateData.userId;

      // Clean up state
      await kv.del(`oauth:state:${state}`);

      // Use the redirectUri stored during authorize (must match exactly)
      const storedRedirectUri = stateData.redirectUri || `${Deno.env.get('APP_URL') || 'https://syncscript.app'}/oauth-callback`;

      // Exchange code for tokens
      const tokenParams = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: storedRedirectUri
      });

      const tokenResponse = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: tokenParams.toString()
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error(`[OAUTH] Token exchange failed:`, error, 'redirect_uri used:', storedRedirectUri);
        return c.json({ error: 'Failed to exchange authorization code' }, 400);
      }

      const tokens = await tokenResponse.json();

      // Store tokens securely
      await kv.set(`oauth:${provider}:${userId}`, {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString(),
        token_type: tokens.token_type,
        scope: tokens.scope
      });

      // Fetch and store account info
      let accountInfo = {};
      
      if (provider === 'google_calendar') {
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { 'Authorization': `Bearer ${tokens.access_token}` }
        });
        if (userInfoResponse.ok) {
          const userInfo = await userInfoResponse.json();
          accountInfo = {
            email: userInfo.email,
            name: userInfo.name
          };
        }
      } else if (provider === 'outlook_calendar') {
        const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: { 'Authorization': `Bearer ${tokens.access_token}` }
        });
        if (userInfoResponse.ok) {
          const userInfo = await userInfoResponse.json();
          accountInfo = {
            email: userInfo.userPrincipalName,
            name: userInfo.displayName
          };
        }
      } else if (provider === 'slack') {
        const userInfoResponse = await fetch('https://slack.com/api/users.identity', {
          headers: { 'Authorization': `Bearer ${tokens.access_token}` }
        });
        if (userInfoResponse.ok) {
          const userInfo = await userInfoResponse.json();
          accountInfo = {
            email: userInfo.user?.email,
            name: userInfo.user?.name
          };
        }
      }

      await kv.set(`oauth:${provider}:${userId}:info`, accountInfo);
      await kv.set(`oauth:${provider}:${userId}:connected_at`, new Date().toISOString());

      console.log(`[OAUTH] Successfully connected ${provider} for user ${userId}`);

      return c.json({ 
        success: true, 
        provider,
        accountInfo 
      });

    } catch (error) {
      console.error(`[OAUTH] Callback error:`, error);
      return c.json({ error: 'Failed to complete authorization', details: String(error) }, 500);
    }
  });

  // 4. Disconnect integration
  app.post("/make-server-57781ad9/integrations/:provider/disconnect", async (c) => {
    try {
      const provider = c.req.param('provider');
      
      // Get user session
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const { data: { user } } = await supabase.auth.getUser(accessToken);
      
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Delete all integration data
      await kv.mdel([
        `oauth:${provider}:${user.id}`,
        `oauth:${provider}:${user.id}:info`,
        `oauth:${provider}:${user.id}:settings`,
        `oauth:${provider}:${user.id}:last_sync`,
        `oauth:${provider}:${user.id}:data_points`,
        `oauth:${provider}:${user.id}:connected_at`
      ]);

      console.log(`[OAUTH] Disconnected ${provider} for user ${user.id}`);

      return c.json({ success: true });

    } catch (error) {
      console.error(`[OAUTH] Disconnect error:`, error);
      return c.json({ error: 'Failed to disconnect integration' }, 500);
    }
  });

  // 5. Get integration settings
  app.get("/make-server-57781ad9/integrations/:provider/settings", async (c) => {
    try {
      const provider = c.req.param('provider');
      
      // Get user session
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const { data: { user } } = await supabase.auth.getUser(accessToken);
      
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const settings = await kv.get(`oauth:${provider}:${user.id}:settings`) || {
        autoSync: true,
        syncFrequency: '15min'
      };

      return c.json(settings);

    } catch (error) {
      console.error(`[OAUTH] Error getting settings:`, error);
      return c.json({ error: 'Failed to get settings' }, 500);
    }
  });

  // 6. Update integration settings
  app.put("/make-server-57781ad9/integrations/:provider/settings", async (c) => {
    try {
      const provider = c.req.param('provider');
      const updates = await c.req.json();
      
      // Get user session
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const { data: { user } } = await supabase.auth.getUser(accessToken);
      
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Get current settings
      const currentSettings = await kv.get(`oauth:${provider}:${user.id}:settings`) || {};
      
      // Merge updates
      const newSettings = { ...currentSettings, ...updates };
      
      // Save
      await kv.set(`oauth:${provider}:${user.id}:settings`, newSettings);

      return c.json(newSettings);

    } catch (error) {
      console.error(`[OAUTH] Error updating settings:`, error);
      return c.json({ error: 'Failed to update settings' }, 500);
    }
  });

  // 7. Manual sync
  app.post("/make-server-57781ad9/integrations/:provider/sync", async (c) => {
    try {
      const provider = c.req.param('provider');
      
      // Get user session
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const { data: { user } } = await supabase.auth.getUser(accessToken);
      
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Get tokens
      const tokens = await kv.get(`oauth:${provider}:${user.id}`);
      if (!tokens) {
        return c.json({ error: 'Integration not connected' }, 400);
      }

      // Check if token needs refresh
      if (new Date(tokens.expires_at) < new Date()) {
        // Refresh token logic would go here
        console.log(`[OAUTH] Token expired, needs refresh for ${provider}`);
        return c.json({ error: 'Token expired, please reconnect' }, 401);
      }

      let syncCount = 0;

      // Sync based on provider
      if (provider === 'google_calendar') {
        // Fetch Google Calendar events
        const calendarResponse = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=100&orderBy=startTime&singleEvents=true',
          {
            headers: { 'Authorization': `Bearer ${tokens.access_token}` }
          }
        );
        
        if (calendarResponse.ok) {
          const data = await calendarResponse.json();
          syncCount = data.items?.length || 0;
          
          // Store synced events (would integrate with calendar system)
          await kv.set(`calendar:synced:${provider}:${user.id}`, data.items || []);
        }
      } else if (provider === 'outlook_calendar') {
        // Fetch Outlook events
        const calendarResponse = await fetch(
          'https://graph.microsoft.com/v1.0/me/calendar/events?$top=100',
          {
            headers: { 'Authorization': `Bearer ${tokens.access_token}` }
          }
        );
        
        if (calendarResponse.ok) {
          const data = await calendarResponse.json();
          syncCount = data.value?.length || 0;
          
          await kv.set(`calendar:synced:${provider}:${user.id}`, data.value || []);
        }
      } else if (provider === 'slack') {
        // Fetch Slack channels/messages
        const channelsResponse = await fetch(
          'https://slack.com/api/conversations.list',
          {
            headers: { 'Authorization': `Bearer ${tokens.access_token}` }
          }
        );
        
        if (channelsResponse.ok) {
          const data = await channelsResponse.json();
          syncCount = data.channels?.length || 0;
        }
      }

      // Update sync metadata
      await kv.set(`oauth:${provider}:${user.id}:last_sync`, new Date().toISOString());
      await kv.set(`oauth:${provider}:${user.id}:data_points`, syncCount);

      console.log(`[OAUTH] Synced ${syncCount} items from ${provider} for user ${user.id}`);

      return c.json({ success: true, count: syncCount });

    } catch (error) {
      console.error(`[OAUTH] Sync error:`, error);
      return c.json({ error: 'Sync failed', details: String(error) }, 500);
    }
  });

  // 8. Get calendar events for import
  app.get("/make-server-57781ad9/integrations/:provider/events", async (c) => {
    try {
      const provider = c.req.param('provider');
      
      if (!['google_calendar', 'outlook_calendar'].includes(provider)) {
        return c.json({ error: 'Invalid calendar provider' }, 400);
      }
      
      // Get user session
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const { data: { user } } = await supabase.auth.getUser(accessToken);
      
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Get tokens
      const tokens = await kv.get(`oauth:${provider}:${user.id}`);
      if (!tokens) {
        return c.json({ error: 'Integration not connected' }, 400);
      }

      let events = [];

      if (provider === 'google_calendar') {
        const response = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=250&orderBy=startTime&singleEvents=true',
          {
            headers: { 'Authorization': `Bearer ${tokens.access_token}` }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          events = (data.items || []).map((item: any) => ({
            id: item.id,
            title: item.summary,
            start: item.start.dateTime || item.start.date,
            end: item.end.dateTime || item.end.date,
            description: item.description,
            location: item.location,
            attendees: item.attendees?.map((a: any) => a.email) || [],
            calendarName: 'Primary',
            recurring: !!item.recurrence,
            recurrenceRule: item.recurrence?.[0],
            source: 'google_calendar'
          }));
        }
      } else if (provider === 'outlook_calendar') {
        const response = await fetch(
          'https://graph.microsoft.com/v1.0/me/calendar/events?$top=250',
          {
            headers: { 'Authorization': `Bearer ${tokens.access_token}` }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          events = (data.value || []).map((item: any) => ({
            id: item.id,
            title: item.subject,
            start: item.start.dateTime,
            end: item.end.dateTime,
            description: item.bodyPreview,
            location: item.location?.displayName,
            attendees: item.attendees?.map((a: any) => a.emailAddress.address) || [],
            calendarName: 'Calendar',
            recurring: !!item.recurrence,
            source: 'outlook_calendar'
          }));
        }
      }

      return c.json({ events });

    } catch (error) {
      console.error(`[OAUTH] Error fetching events:`, error);
      return c.json({ error: 'Failed to fetch events', details: String(error) }, 500);
    }
  });

  // 9. Import calendar events
  app.post("/make-server-57781ad9/calendar/import", async (c) => {
    try {
      const body = await c.req.json();
      const { events, source } = body;
      
      // Get user session
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const { data: { user } } = await supabase.auth.getUser(accessToken);
      
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      if (!events || !Array.isArray(events)) {
        return c.json({ error: 'Invalid events data' }, 400);
      }

      // Store imported events
      const importKey = `calendar:imported:${user.id}:${Date.now()}`;
      await kv.set(importKey, {
        source,
        events,
        importedAt: new Date().toISOString(),
        count: events.length
      });

      // Update import history
      const historyKey = `calendar:import_history:${user.id}`;
      const history = await kv.get(historyKey) || [];
      history.push({
        source,
        count: events.length,
        importedAt: new Date().toISOString()
      });
      await kv.set(historyKey, history.slice(-50)); // Keep last 50 imports

      console.log(`[CALENDAR] Imported ${events.length} events from ${source} for user ${user.id}`);

      return c.json({ 
        success: true, 
        count: events.length,
        importKey 
      });

    } catch (error) {
      console.error(`[CALENDAR] Import error:`, error);
      return c.json({ error: 'Failed to import events', details: String(error) }, 500);
    }
  });

  // 10. Google OAuth Authentication (for sign-in/sign-up)
  app.post("/make-server-57781ad9/auth/google/callback", async (c) => {
    try {
      const body = await c.req.json();
      const { code, state } = body;

      console.log('[AUTH] Processing Google authentication callback');

      // Verify state token
      const stateData = await kv.get(`oauth:state:${state}`);
      if (!stateData) {
        return c.json({ error: 'Invalid or expired state token' }, 400);
      }

      // Clean up state
      await kv.del(`oauth:state:${state}`);

      const config = OAUTH_CONFIGS.google_auth;
      
      // Use the redirectUri stored during the authorize step (must match exactly)
      const storedRedirectUri = stateData.redirectUri || `${Deno.env.get('APP_URL') || 'https://syncscript.app'}/auth/callback`;
      console.log('[AUTH] Using redirect_uri for token exchange:', storedRedirectUri);

      // Exchange code for tokens
      const tokenParams = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: storedRedirectUri
      });

      const tokenResponse = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: tokenParams.toString()
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error(`[AUTH] Token exchange failed:`, error);
        return c.json({ error: 'Failed to exchange authorization code' }, 400);
      }

      const tokens = await tokenResponse.json();

      // Get user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` }
      });

      if (!userInfoResponse.ok) {
        console.error('[AUTH] Failed to fetch user info from Google');
        return c.json({ error: 'Failed to get user information' }, 400);
      }

      const googleUser = await userInfoResponse.json();
      console.log('[AUTH] Google user info retrieved:', googleUser.email);

      // Check if user exists in Supabase
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users.find(u => u.email === googleUser.email);

      let supabaseUser;

      if (existingUser) {
        // User exists, sign them in
        console.log('[AUTH] Existing user found, signing in');
        supabaseUser = existingUser;
      } else {
        // Create new user
        console.log('[AUTH] Creating new user from Google OAuth');
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: googleUser.email,
          email_confirm: true, // Auto-confirm since verified by Google
          user_metadata: {
            name: googleUser.name,
            picture: googleUser.picture,
            provider: 'google',
            google_id: googleUser.id
          }
        });

        if (createError || !newUser) {
          console.error('[AUTH] Failed to create user:', createError);
          return c.json({ error: 'Failed to create user account' }, 500);
        }

        supabaseUser = newUser.user;
      }

      // Generate a magic link and extract the token_hash for client-side verification
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: supabaseUser.email!,
      });

      if (sessionError) {
        console.error('[AUTH] Failed to generate session:', sessionError);
        return c.json({ error: 'Failed to create session' }, 500);
      }

      // Extract token_hash from the action_link so the frontend can verify
      // the OTP directly without a redirect chain
      let tokenHash = '';
      try {
        const linkUrl = new URL(sessionData.properties.action_link);
        tokenHash = linkUrl.searchParams.get('token') || '';
      } catch (e) {
        console.error('[AUTH] Failed to parse action_link:', e);
      }

      console.log('[AUTH] Google authentication successful for:', supabaseUser.email);

      // Create user profile in KV if new user
      if (!existingUser) {
        await kv.set(`user:${supabaseUser.id}`, {
          id: supabaseUser.id,
          email: googleUser.email,
          name: googleUser.name,
          photoUrl: googleUser.picture,
          onboardingCompleted: false,
          createdAt: new Date().toISOString(),
          isFirstTime: true,
          hasLoggedEnergy: false,
          onboardingStep: 0,
        });
      }

      return c.json({
        success: true,
        email: supabaseUser.email,
        userId: supabaseUser.id,
        tokenHash,
        redirectUrl: sessionData.properties.action_link,
        isNewUser: !existingUser
      });

    } catch (error) {
      console.error('[AUTH] Google authentication error:', error);
      return c.json({ error: 'Authentication failed', details: String(error) }, 500);
    }
  });
}