// Guest Authentication Routes
// Implements custom guest session system (no Supabase anonymous auth required)
// Research sources: Nielsen Norman Group, Baymard Institute, Figma/Notion patterns

import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!supabaseUrl || !supabaseKey) {
  console.error('[GuestAuth] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// Generate a unique guest ID
function generateGuestId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Generate a simple session token
function generateSessionToken(): string {
  return `gst_${Date.now()}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
}

export function registerGuestAuthRoutes(app: Hono) {
  
  // 1. Create guest session (custom implementation - no anonymous auth needed)
  app.post("/make-server-57781ad9/auth/guest/create", async (c) => {
    try {
      console.log('[Guest Auth] Creating custom guest session (no Supabase anonymous auth)');
      
      // Generate unique guest ID and session token
      const guestId = generateGuestId();
      const sessionToken = generateSessionToken();
      
      // Store guest metadata in KV store
      const guestData = {
        id: guestId,
        isGuest: true,
        sessionToken: sessionToken,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        lastActivity: new Date().toISOString()
      };

      await kv.set(`guest:${guestId}`, guestData);
      await kv.set(`guest_token:${sessionToken}`, { guestId, createdAt: new Date().toISOString() });

      // Initialize default guest profile
      const guestProfile = {
        id: guestId,
        email: '',
        name: 'Guest',
        isGuest: true,
        onboardingCompleted: false,
        createdAt: new Date().toISOString(),
        // ✅ FIRST-TIME USER EXPERIENCE FLAGS
        isFirstTime: true,
        hasLoggedEnergy: false,
        onboardingStep: 0
      };

      await kv.set(`user:${guestId}:profile`, guestProfile);

      console.log('[Guest Auth] Guest session created successfully:', guestId);

      return c.json({
        success: true,
        user: guestProfile,
        accessToken: sessionToken,
        expiresAt: guestData.expiresAt
      });
      
    } catch (error) {
      console.error('[Guest Auth] Error creating guest session:', error);
      return c.json({ 
        error: `Server error while creating guest session: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }, 500);
    }
  });

  // 2. Check guest session status
  app.get("/make-server-57781ad9/auth/guest/status", async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!accessToken) {
        return c.json({ error: 'No access token provided' }, 401);
      }

      const guestTokenData = await kv.get(`guest_token:${accessToken}`);
      
      if (!guestTokenData) {
        return c.json({ error: 'Invalid session' }, 401);
      }

      const guestId = guestTokenData.guestId;
      const guestData = await kv.get(`guest:${guestId}`);
      
      if (!guestData) {
        return c.json({ isGuest: false });
      }

      // Check if session is expired
      const expiresAt = new Date(guestData.expiresAt);
      const now = new Date();
      const isExpired = now > expiresAt;

      // Calculate time remaining
      const timeRemaining = Math.max(0, expiresAt.getTime() - now.getTime());
      const daysRemaining = Math.floor(timeRemaining / (24 * 60 * 60 * 1000));
      const hoursRemaining = Math.floor((timeRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

      return c.json({
        isGuest: true,
        userId: guestId,
        createdAt: guestData.createdAt,
        expiresAt: guestData.expiresAt,
        isExpired,
        timeRemaining: {
          days: daysRemaining,
          hours: hoursRemaining,
          total: timeRemaining
        }
      });
      
    } catch (error) {
      console.error('[Guest Auth] Error checking guest status:', error);
      return c.json({ 
        error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }, 500);
    }
  });

  // 3. Update guest last activity
  app.post("/make-server-57781ad9/auth/guest/activity", async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!accessToken) {
        return c.json({ error: 'No access token provided' }, 401);
      }

      const guestTokenData = await kv.get(`guest_token:${accessToken}`);
      
      if (!guestTokenData) {
        return c.json({ error: 'Invalid session' }, 401);
      }

      const guestId = guestTokenData.guestId;
      const guestData = await kv.get(`guest:${guestId}`);
      
      if (!guestData) {
        return c.json({ error: 'Not a guest session' }, 400);
      }

      // Update last activity timestamp
      guestData.lastActivity = new Date().toISOString();
      await kv.set(`guest:${guestId}`, guestData);

      return c.json({ success: true });
      
    } catch (error) {
      console.error('[Guest Auth] Error updating activity:', error);
      return c.json({ 
        error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }, 500);
    }
  });

  // 4. Upgrade guest to full account
  app.post("/make-server-57781ad9/auth/guest/upgrade", async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!accessToken) {
        return c.json({ error: 'No access token provided' }, 401);
      }

      const { email, password, name } = await c.req.json();

      if (!email || !password || !name) {
        return c.json({ error: 'Email, password, and name are required' }, 400);
      }

      // Get current guest user
      const guestTokenData = await kv.get(`guest_token:${accessToken}`);
      
      if (!guestTokenData) {
        return c.json({ error: 'Invalid guest session' }, 401);
      }

      const guestId = guestTokenData.guestId;

      // Check if this is actually a guest
      const guestData = await kv.get(`guest:${guestId}`);
      
      if (!guestData) {
        return c.json({ error: 'Not a guest session' }, 400);
      }

      // Create a new permanent Supabase user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          name: name,
          upgraded_from_guest: true,
          upgraded_at: new Date().toISOString(),
          previous_guest_id: guestId
        }
      });

      if (createError || !newUser.user) {
        console.error('[Guest Auth] Error creating permanent user:', createError);
        return c.json({ error: `Failed to upgrade account: ${createError?.message || 'Unknown error'}` }, 500);
      }

      const newUserId = newUser.user.id;

      // Get existing guest profile to preserve data
      const guestProfile = await kv.get(`user:${guestId}:profile`) || {};

      // Create updated profile for new user
      const updatedProfile = {
        ...guestProfile,
        id: newUserId,
        email: email,
        name: name,
        isGuest: false,
        upgradedAt: new Date().toISOString(),
        createdAt: guestData.createdAt
      };

      await kv.set(`user:${newUserId}:profile`, updatedProfile);

      // Store migration record
      await kv.set(`guest_migration:${guestId}`, {
        oldGuestId: guestId,
        newUserId: newUserId,
        migratedAt: new Date().toISOString()
      });

      // Clean up guest data
      await kv.del(`guest:${guestId}`);
      await kv.del(`guest_token:${accessToken}`);

      console.log('[Guest Auth] Guest upgraded successfully:', guestId, '->', newUserId);

      // Return new auth credentials
      return c.json({
        success: true,
        message: 'Account upgraded successfully! All your data has been saved. Please sign in with your new account.',
        user: updatedProfile,
        requiresSignIn: true
      });
      
    } catch (error) {
      console.error('[Guest Auth] Error upgrading guest account:', error);
      return c.json({ 
        error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }, 500);
    }
  });

  // 5. Export guest data (backup feature)
  app.get("/make-server-57781ad9/auth/guest/export", async (c) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!accessToken) {
        return c.json({ error: 'No access token provided' }, 401);
      }

      const guestTokenData = await kv.get(`guest_token:${accessToken}`);
      
      if (!guestTokenData) {
        return c.json({ error: 'Invalid session' }, 401);
      }

      const guestId = guestTokenData.guestId;

      // Gather all guest data from KV store
      const allKeys = await kv.getByPrefix(`user:${guestId}:`);
      const guestMetadata = await kv.get(`guest:${guestId}`);

      const exportData = {
        exportedAt: new Date().toISOString(),
        guestId: guestId,
        metadata: guestMetadata,
        data: allKeys
      };

      return c.json({
        success: true,
        data: exportData,
        message: 'Your data has been exported. Save this JSON file to import it later.'
      });
      
    } catch (error) {
      console.error('[Guest Auth] Error exporting guest data:', error);
      return c.json({ 
        error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }, 500);
    }
  });

  // 6. Clean up expired guest sessions (maintenance endpoint)
  app.post("/make-server-57781ad9/auth/guest/cleanup", async (c) => {
    try {
      // This should ideally be called by a cron job
      const allGuestSessions = await kv.getByPrefix('guest:');
      
      let cleanedCount = 0;
      const now = new Date();

      for (const session of allGuestSessions) {
        const expiresAt = new Date(session.expiresAt);
        
        if (now > expiresAt) {
          // Delete guest metadata
          await kv.del(`guest:${session.id}`);
          
          // Optionally delete user data (or archive it)
          // await kv.del(`user:${session.id}:profile`);
          
          cleanedCount++;
        }
      }

      return c.json({
        success: true,
        message: `Cleaned up ${cleanedCount} expired guest sessions`
      });
      
    } catch (error) {
      console.error('[Guest Auth] Error cleaning up guests:', error);
      return c.json({ 
        error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }, 500);
    }
  });
}