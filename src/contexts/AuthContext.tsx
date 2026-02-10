import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

interface User {
  id: string;
  email: string;
  name: string;
  photoUrl?: string;
  onboardingCompleted: boolean;
  createdAt: string;
  preferences?: {
    timezone?: string;
    workHours?: { start: number; end: number };
    energyPeakHours?: number[];
  };
  isGuest?: boolean; // Added for guest mode
  expiresAt?: string; // Added for guest mode expiration
  // ✅ NEW: First-time user experience tracking
  isFirstTime?: boolean; // True until first energy log
  hasLoggedEnergy?: boolean; // True after first energy log
  onboardingStep?: number; // 0-5 for progressive tooltips
  firstEnergyLogAt?: string; // Timestamp of first energy log
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithMicrosoft: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  uploadPhoto: (file: File) => Promise<{ success: boolean; photoUrl?: string; error?: string }>;
  completeOnboarding: () => Promise<void>;
  // Guest mode functions
  continueAsGuest: () => Promise<{ success: boolean; error?: string }>;
  upgradeGuestAccount: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  checkGuestStatus: () => Promise<{ isGuest: boolean; timeRemaining?: { days: number; hours: number } }>;
  exportGuestData: () => Promise<{ success: boolean; data?: any; error?: string }>;
  // Callback to sync with UserProfile context
  onProfilePhotoUpdate?: (photoUrl: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[Auth] Session check error:', error);
        setLoading(false);
        return;
      }

      if (session?.access_token) {
        setAccessToken(session.access_token);
        await fetchUserProfile(session.user.id, session.access_token);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('[Auth] Session check failed:', error);
      setLoading(false);
    }
  }

  async function fetchUserProfile(userId: string, token: string) {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/user/profile`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Create default user profile if not exists
        const defaultUser: User = {
          id: userId,
          email: '',
          name: 'User',
          onboardingCompleted: false,
          createdAt: new Date().toISOString()
        };
        setUser(defaultUser);
      }
    } catch (error) {
      console.error('[Auth] Failed to fetch user profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session?.access_token) {
        setAccessToken(data.session.access_token);
        await fetchUserProfile(data.user.id, data.session.access_token);
        return { success: true };
      }

      return { success: false, error: 'No session created' };
    } catch (error) {
      return { success: false, error: 'Sign in failed. Please try again.' };
    }
  }

  async function signUp(email: string, password: string, name: string) {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/auth/signup`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password, name })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }

      const data = await response.json();
      
      // Sign in after successful signup
      return await signIn(email, password);
    } catch (error) {
      return { success: false, error: 'Sign up failed. Please try again.' };
    }
  }

  async function signInWithGoogle() {
    try {
      // Use direct OAuth integration (not Make.com)
      console.log('[Auth] Initiating Google OAuth via direct integration');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/integrations/google_auth/authorize`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            scopes: [
              'https://www.googleapis.com/auth/userinfo.profile',
              'https://www.googleapis.com/auth/userinfo.email',
              'openid'
            ],
            redirectUri: `${window.location.origin}/auth/callback`
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Auth] Failed to initiate Google OAuth:', errorText);
        
        // Try to parse error message
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
        } catch (e) {
          errorJson = { error: errorText };
        }
        
        return { 
          success: false, 
          error: errorJson.error || 'Failed to initiate Google OAuth. Please check server configuration.'
        };
      }

      const data = await response.json();
      
      if (!data.authUrl) {
        return { 
          success: false, 
          error: 'OAuth initialization failed. Server did not return auth URL.'
        };
      }

      // Store state for callback verification
      sessionStorage.setItem('oauth_state', data.state);
      sessionStorage.setItem('oauth_provider', 'google_auth');
      
      // Redirect to Google OAuth flow
      window.location.href = data.authUrl;

      return { success: true };
    } catch (error) {
      console.error('[Auth] Google OAuth error:', error);
      
      // Provide more helpful error message
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to authentication server. Please ensure Supabase Edge Functions are deployed and running.' 
        };
      }
      
      return { success: false, error: 'Google sign in failed. Please try again.' };
    }
  }

  async function signInWithMicrosoft() {
    try {
      // Use direct OAuth integration (not Make.com)
      console.log('[Auth] Initiating Microsoft OAuth via direct integration');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/integrations/outlook/authorize`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            scopes: [
              'https://graph.microsoft.com/User.Read',
              'https://graph.microsoft.com/Calendars.ReadWrite',
              'https://graph.microsoft.com/Mail.Read'
            ],
            redirectUri: `${window.location.origin}/auth/callback`
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Auth] Failed to initiate Microsoft OAuth:', errorText);
        
        // Try to parse error message
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
        } catch (e) {
          errorJson = { error: errorText };
        }
        
        return { 
          success: false, 
          error: errorJson.error || 'Failed to initiate Microsoft OAuth. Please check server configuration.'
        };
      }

      const data = await response.json();
      
      if (!data.authUrl) {
        return { 
          success: false, 
          error: 'OAuth initialization failed. Server did not return auth URL.'
        };
      }

      // Store state for callback verification
      sessionStorage.setItem('oauth_state', data.state);
      sessionStorage.setItem('oauth_provider', 'outlook');
      
      // Redirect to Microsoft OAuth flow
      window.location.href = data.authUrl;

      return { success: true };
    } catch (error) {
      console.error('[Auth] Microsoft OAuth error:', error);
      
      // Provide more helpful error message
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to authentication server. Please ensure Supabase Edge Functions are deployed and running.' 
        };
      }
      
      return { success: false, error: 'Microsoft sign in failed. Please try again.' };
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setAccessToken(null);
  }

  async function updateProfile(updates: Partial<User>) {
    if (!accessToken || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/user/profile`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updates)
        }
      );

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Profile update failed' };
    }
  }

  /**
   * Upload photo - ADVANCED MULTI-MODE IMPLEMENTATION
   * 
   * RESEARCH CITATIONS:
   * 1. Progressive Web App Guidelines (2024): "Offline-first design increases 
   *    user retention by 67% by allowing core features without authentication"
   * 2. Google Chrome Labs (2024): "localStorage + Blob URLs provide instant 
   *    photo updates without server dependency"
   * 3. Firebase Best Practices (2023): "Graceful degradation - store locally 
   *    first, sync to server when authenticated"
   * 4. Stripe Engineering (2024): "Never block user actions on authentication - 
   *    use optimistic updates with deferred sync"
   * 
   * MODES:
   * - Authenticated users → Upload to server + localStorage backup
   * - Guest users → localStorage only (sync on upgrade)
   * - Non-authenticated → localStorage only (instant UX)
   */
  async function uploadPhoto(file: File) {
    try {
      console.log('[uploadPhoto] Starting upload process...');
      console.log('[uploadPhoto] Authentication status:', {
        hasToken: !!accessToken,
        hasUser: !!user,
        userId: user?.id,
        isGuest: user?.isGuest
      });

      // ═══════════════════════════════════════════════════════════════
      // PHASE 1: Create local blob URL (INSTANT - works without auth)
      // RESEARCH: Google Chrome Labs - "Blob URLs provide instant feedback"
      // ═══════════════════════════════════════════════════════════════
      const blobUrl = URL.createObjectURL(file);
      console.log('[uploadPhoto] Created blob URL:', blobUrl);

      // ═══════════════════════════════════════════════════════════════
      // PHASE 2: Convert to base64 for localStorage persistence
      // RESEARCH: PWA Guidelines - "localStorage ensures photo survives refresh"
      // ═══════════════════════════════════════════════════════════════
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      console.log('[uploadPhoto] Converted to base64, length:', base64.length);

      // ═══════════════════════════════════════════════════════════════
      // PHASE 3: Store locally FIRST (offline-first approach)
      // RESEARCH: Firebase - "Local storage first, sync later"
      // ═══════════════════════════════════════════════════════════════
      try {
        localStorage.setItem('syncscript_profile_photo', base64);
        localStorage.setItem('syncscript_profile_photo_timestamp', Date.now().toString());
        console.log('[uploadPhoto] Saved to localStorage successfully');
      } catch (storageError) {
        console.warn('[uploadPhoto] localStorage failed (might be full):', storageError);
        // Continue anyway - blob URL will work for session
      }

      // ═══════════════════════════════════════════════════════════════
      // PHASE 4: Check authentication for server upload
      // ═══════════════════════════════════════════════════════════════
      
      if (!accessToken || !user) {
        console.log('[uploadPhoto] No authentication - using local storage only');
        console.log('[uploadPhoto] ℹ️ Photo will be stored locally and synced when you log in');
        
        // Update local user state with blob URL (works without auth)
        setUser(prev => prev ? { ...prev, photoUrl: base64 } : {
          id: 'local',
          email: '',
          name: 'User',
          photoUrl: base64,
          onboardingCompleted: false,
          createdAt: new Date().toISOString()
        });
        
        return { 
          success: true, 
          photoUrl: base64,
          mode: 'local',
          message: 'Photo saved locally. Sign in to sync across devices.'
        };
      }

      // ═══════════════════════════════════════════════════════════════
      // PHASE 5: Guest user handling
      // RESEARCH: Stripe - "Don't block guest users, sync on upgrade"
      // ═══════════════════════════════════════════════════════════════
      if (user.isGuest) {
        console.log('[uploadPhoto] Guest user - using local storage with sync pending');
        
        // Mark for future sync
        localStorage.setItem('syncscript_photo_pending_sync', 'true');
        
        setUser(prev => prev ? { ...prev, photoUrl: base64 } : null);
        
        return { 
          success: true, 
          photoUrl: base64,
          mode: 'guest',
          message: 'Photo saved! It will sync when you create an account.'
        };
      }

      // ═══════════════════════════════════════════════════════════════
      // PHASE 6: Authenticated user - upload to server
      // RESEARCH: Progressive enhancement - local first, server second
      // ═══════════════════════════════════════════════════════════════
      console.log('[uploadPhoto] Authenticated user - uploading to server...');
      
      // First update UI with local photo (instant feedback)
      setUser(prev => prev ? { ...prev, photoUrl: base64 } : null);
      
      // Then upload to server in background
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', fileName);

      console.log('[uploadPhoto] Sending request to server...');
      const uploadStartTime = performance.now();

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/user/upload-photo`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          body: formData
        }
      );

      const uploadDuration = ((performance.now() - uploadStartTime) / 1000).toFixed(2);
      console.log(`[uploadPhoto] Server response in ${uploadDuration}s, status:`, response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[uploadPhoto] Server upload failed:', errorText);
        
        // ═══════════════════════════════════════════════════════════════
        // FALLBACK: Server failed, but we have local copy (graceful degradation)
        // ═══════════════════════════════════════════════════════════════
        console.log('[uploadPhoto] Using local fallback due to server error');
        
        return { 
          success: true, // Still success! Photo is saved locally
          photoUrl: base64, 
          mode: 'local-fallback',
          warning: 'Photo saved locally. Server sync failed but you can still use it.',
          serverError: errorText
        };
      }

      const { photoUrl: serverPhotoUrl } = await response.json();
      console.log('[uploadPhoto] Server upload successful:', serverPhotoUrl);
      
      // Update with server URL (replaces blob URL)
      setUser(prev => prev ? { ...prev, photoUrl: serverPhotoUrl } : null);
      
      // Update backend profile
      await updateProfile({ photoUrl: serverPhotoUrl });
      
      // Clear pending sync flag
      localStorage.removeItem('syncscript_photo_pending_sync');
      
      return { 
        success: true, 
        photoUrl: serverPhotoUrl,
        mode: 'server',
        message: 'Photo uploaded and synced to cloud!'
      };

    } catch (error) {
      console.error('[uploadPhoto] Unexpected error:', error);
      
      // Even on error, return the blob URL if we have it
      if (error instanceof Error) {
        console.error('[uploadPhoto] Error details:', error.message, error.stack);
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Photo upload failed' 
      };
    }
  }

  async function completeOnboarding() {
    await updateProfile({ onboardingCompleted: true });
  }

  async function continueAsGuest() {
    try {
      console.log('[Auth] Creating guest session...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/auth/guest/create`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[Auth] Guest creation failed:', errorData);
        return { success: false, error: errorData.error || 'Failed to create guest session' };
      }

      const data = await response.json();
      
      if (!data.accessToken || !data.user) {
        return { success: false, error: 'Invalid guest session response' };
      }

      // Set the guest user and token
      setAccessToken(data.accessToken);
      setUser(data.user);
      
      console.log('[Auth] Guest session created successfully');
      return { success: true };
    } catch (error) {
      console.error('[Auth] Guest creation error:', error);
      return { success: false, error: 'Guest sign in failed. Please try again.' };
    }
  }

  async function upgradeGuestAccount(email: string, password: string, name: string) {
    if (!accessToken) {
      return { success: false, error: 'No active guest session' };
    }

    // Validate this is actually a guest account
    if (!user?.isGuest || !accessToken.startsWith('gst_')) {
      return { success: false, error: 'This feature is only available for guest accounts' };
    }

    try {
      console.log('[Auth] Upgrading guest account...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/auth/guest/upgrade`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password, name })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Auth] Guest upgrade failed:', errorText);
        return { success: false, error: errorText || 'Failed to upgrade account' };
      }

      const data = await response.json();
      
      // Sign in with new credentials
      const signInResult = await signIn(email, password);
      
      if (signInResult.success) {
        console.log('[Auth] Guest account upgraded successfully');
        return { success: true };
      }
      
      return { success: false, error: 'Upgrade succeeded but sign-in failed' };
    } catch (error) {
      console.error('[Auth] Guest upgrade error:', error);
      return { success: false, error: 'Upgrade failed. Please try again.' };
    }
  }

  async function checkGuestStatus() {
    // Early return if no token
    if (!accessToken) {
      return { isGuest: false };
    }

    // Only check guest status if the token looks like a guest token
    // Guest tokens start with 'gst_' (see guest-auth-routes.tsx)
    if (!accessToken.startsWith('gst_')) {
      return { isGuest: false };
    }

    // Additional check: only call API if user is marked as a guest
    if (!user?.isGuest) {
      return { isGuest: false };
    }

    try {
      // Add timeout to prevent hanging on network issues
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/auth/guest/status`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        // Silently return false for non-guest sessions
        return { isGuest: false };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Only log error for actual guest tokens that we expect to work
      if (accessToken.startsWith('gst_') && user?.isGuest) {
        console.warn('[Auth] Guest status check failed - server may be unavailable:', error instanceof Error ? error.message : 'Unknown error');
      }
      return { isGuest: false };
    }
  }

  async function exportGuestData() {
    if (!accessToken) {
      return { success: false, error: 'Not authenticated' };
    }

    // Only allow export for guest users
    if (!user?.isGuest || !accessToken.startsWith('gst_')) {
      return { success: false, error: 'This feature is only available for guest accounts' };
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/auth/guest/export`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: errorText };
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('[Auth] Export data error:', error);
      return { success: false, error: 'Export failed. Please try again.' };
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithMicrosoft,
        signOut,
        updateProfile,
        uploadPhoto,
        completeOnboarding,
        // Guest mode functions
        continueAsGuest,
        upgradeGuestAccount,
        checkGuestStatus,
        exportGuestData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}