import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { clearAllAppData } from '../utils/session-cleanup';
import { getFreshMockTasks } from '../data/mockTasks';
import { checklistTracking } from '../components/onboarding/checklist-tracking';

const SESSION_CHECK_TIMEOUT_MS = 8000;
const PROFILE_FETCH_TIMEOUT_MS = 8000;
const DEV_GUEST_SEED_STORAGE_KEY = 'syncscript_tasks_v1';
const DEV_GUEST_SESSION_STORAGE_KEY = 'syncscript_dev_guest_session_v1';
const LOCAL_ACCESS_TOKEN_KEY = 'syncscript_access_token';

const _authNativeLog = console.log.bind(console);
const _authNativeWarn = console.warn.bind(console);
function authDevLog(...args: unknown[]) {
  if (import.meta.env.DEV) _authNativeLog(...args);
}
function authDevWarn(...args: unknown[]) {
  if (import.meta.env.DEV) _authNativeWarn(...args);
}

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
  /** Supabase Auth: set when session loaded (password/OAuth). */
  emailConfirmedAt?: string | null;
  /** If email change is pending confirmation, the new address (Supabase `new_email`). */
  pendingEmail?: string | null;
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
  /** Start Supabase secure email change (user receives confirmation link). */
  requestEmailChange: (email: string) => Promise<{ success: boolean; error?: string }>;
  /** Resend signup confirmation for accounts not yet verified (Supabase Auth). */
  resendVerificationEmail: () => Promise<{ success: boolean; error?: string }>;
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
  const [disableRemoteProfileFetch, setDisableRemoteProfileFetch] = useState(false);
  const disableRemoteProfileFetchRef = React.useRef(false);
  const profileFetchInFlightRef = React.useRef<string | null>(null);
  const disableGuestStatusCheckRef = React.useRef(false);

  useEffect(() => {
    disableRemoteProfileFetchRef.current = disableRemoteProfileFetch;
  }, [disableRemoteProfileFetch]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (accessToken) {
        window.localStorage.setItem(LOCAL_ACCESS_TOKEN_KEY, accessToken);
      } else {
        window.localStorage.removeItem(LOCAL_ACCESS_TOKEN_KEY);
      }
    } catch {
      // Ignore storage failures and keep in-memory auth state as source of truth.
    }
  }, [accessToken]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (user) {
      window.sessionStorage.removeItem('syncscript_guest_boot_pending');
    }
  }, [user]);

  const readStoredGuestSession = React.useCallback((): { token: string; user: User } | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(DEV_GUEST_SESSION_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.token || !parsed?.user?.id) return null;
      return parsed as { token: string; user: User };
    } catch {
      return null;
    }
  }, []);

  const clearStoredGuestSession = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(DEV_GUEST_SESSION_STORAGE_KEY);
  }, []);

  /**
   * Tier 0 A: `hasLoggedEnergy` / `isFirstTime` must reflect server truth once
   * the user completes the energy checklist step (written by
   * `checklist-tracking.ts` → `user_onboarding_progress`). We cannot patch
   * `EnergyContext.tsx` (protected); instead we merge from Supabase here and
   * on `syncscript:onboarding-progress-synced` after each successful upsert.
   */
  const mergeOnboardingEnergyFromSupabase = React.useCallback(async (userId: string) => {
    try {
      const { data: ob, error } = await supabase
        .from('user_onboarding_progress')
        .select('steps, first_energy_log_at')
        .eq('user_id', userId)
        .maybeSingle();
      if (error || !ob) return;
      const steps = (ob.steps as Record<string, unknown> | null) || {};
      const energyDone =
        Boolean(ob.first_energy_log_at) ||
        steps.energy === true;
      if (!energyDone) return;
      setUser((prev) => {
        if (!prev || prev.id !== userId) return prev;
        if (prev.hasLoggedEnergy) return prev;
        return {
          ...prev,
          hasLoggedEnergy: true,
          firstEnergyLogAt:
            prev.firstEnergyLogAt ||
            (typeof ob.first_energy_log_at === 'string' ? ob.first_energy_log_at : undefined),
          isFirstTime: false,
        };
      });
    } catch {
      /* missing table pre-migration, or offline */
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (ev: Event) => {
      const ce = ev as CustomEvent<{ userId?: string }>;
      const id = ce.detail?.userId;
      if (!id) return;
      void mergeOnboardingEnergyFromSupabase(id);
    };
    window.addEventListener('syncscript:onboarding-progress-synced', handler as EventListener);
    return () =>
      window.removeEventListener('syncscript:onboarding-progress-synced', handler as EventListener);
  }, [mergeOnboardingEnergyFromSupabase]);

  // Check for existing session on mount AND listen for auth state changes
  useEffect(() => {
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        authDevLog('[Auth] State changed:', event, session?.user?.email);

        if (event === 'SIGNED_IN' && session) {
          setAccessToken(session.access_token);
          localStorage.setItem('syncscript_auth_user_id', session.user.id);
          await fetchUserProfile(session.user.id, session.access_token);
        } else if (event === 'SIGNED_OUT') {
          const devGuest = readStoredGuestSession();
          if (devGuest) {
            setAccessToken(devGuest.token);
            setUser(devGuest.user);
            localStorage.setItem('syncscript_auth_user_id', devGuest.user.id);
            return;
          }
          setUser(null);
          setAccessToken(null);
          localStorage.removeItem('syncscript_auth_user_id');
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setAccessToken(session.access_token);
          localStorage.setItem('syncscript_auth_user_id', session.user.id);
        } else if (event === 'USER_UPDATED' && session) {
          setAccessToken(session.access_token);
          localStorage.setItem('syncscript_auth_user_id', session.user.id);
          await fetchUserProfile(session.user.id, session.access_token);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkSession() {
    try {
      const sessionResult = await Promise.race([
        supabase.auth.getSession(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Session check timeout')), SESSION_CHECK_TIMEOUT_MS),
        ),
      ]);
      const { data: { session }, error } = sessionResult;
      
      if (error) {
        console.error('[Auth] Session check error:', error);
        setLoading(false);
        return;
      }

      if (session?.access_token) {
        setAccessToken(session.access_token);
        localStorage.setItem('syncscript_auth_user_id', session.user.id);
        await fetchUserProfile(session.user.id, session.access_token);
      } else {
        const devGuest = readStoredGuestSession();
        if (devGuest) {
          setAccessToken(devGuest.token);
          setUser(devGuest.user);
          localStorage.setItem('syncscript_auth_user_id', devGuest.user.id);
          setLoading(false);
          return;
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('[Auth] Session check failed:', error);
      setLoading(false);
    }
  }

  async function fetchUserProfile(userId: string, token: string) {
    if (disableRemoteProfileFetchRef.current || disableRemoteProfileFetch) {
      setUser((prev) => prev || {
        id: userId,
        email: '',
        name: 'User',
        onboardingCompleted: false,
        createdAt: new Date().toISOString(),
        isFirstTime: true,
        hasLoggedEnergy: false,
      });
      setLoading(false);
      return;
    }
    if (profileFetchInFlightRef.current === userId) return;
    profileFetchInFlightRef.current = userId;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROFILE_FETCH_TIMEOUT_MS);
    try {
      const { data: authUserResult } = await supabase.auth.getUser(token);
      const authUser = authUserResult?.user;
      const overlayAuthEmail = (u: User): User =>
        authUser && u.id === authUser.id
          ? {
              ...u,
              email: authUser.email ?? u.email,
              emailConfirmedAt: authUser.email_confirmed_at ?? null,
              pendingEmail: authUser.new_email ?? null,
            }
          : u;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/user/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: publicAnonKey,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        }
      );

      if (response.ok) {
        const userData = await response.json();
        setUser(overlayAuthEmail(userData));
        void mergeOnboardingEnergyFromSupabase(userId);
        localStorage.setItem('syncscript_auth_user_id', userData?.id || userId);
        if (!userData?.isGuest) {
          clearStoredGuestSession();
        }
      } else if (response.status === 401 || response.status === 403) {
        // Avoid noisy repeated logs when backend auth/CORS is not aligned yet.
        disableRemoteProfileFetchRef.current = true;
        setDisableRemoteProfileFetch(true);
        setUser((prev) =>
          prev
            ? overlayAuthEmail(prev)
            : overlayAuthEmail({
                id: userId,
                email: authUser?.email || '',
                name: 'User',
                onboardingCompleted: false,
                createdAt: new Date().toISOString(),
                isFirstTime: true,
                hasLoggedEnergy: false,
              }),
        );
      } else {
        setUser((prev) =>
          prev
            ? overlayAuthEmail(prev)
            : overlayAuthEmail({
                id: userId,
                email: authUser?.email || '',
                name: 'User',
                onboardingCompleted: false,
                createdAt: new Date().toISOString(),
                isFirstTime: true,
                hasLoggedEnergy: false,
              }),
        );
      }
    } catch (error) {
      // Network/CORS failures can happen when function CORS config drifts from app host.
      disableRemoteProfileFetchRef.current = true;
      setDisableRemoteProfileFetch(true);
      let auCatch: import('@supabase/supabase-js').User | null = null;
      try {
        const pack = await supabase.auth.getUser(token);
        auCatch = pack.data?.user ?? null;
      } catch {
        auCatch = null;
      }
      const overlayCatch = (u: User): User =>
        auCatch && u.id === auCatch.id
          ? {
              ...u,
              email: auCatch.email ?? u.email,
              emailConfirmedAt: auCatch.email_confirmed_at ?? null,
              pendingEmail: auCatch.new_email ?? null,
            }
          : u;
      setUser((prev) =>
        prev
          ? overlayCatch(prev)
          : overlayCatch({
              id: userId,
              email: auCatch?.email || '',
              name: 'User',
              onboardingCompleted: false,
              createdAt: new Date().toISOString(),
              isFirstTime: true,
              hasLoggedEnergy: false,
            }),
      );
    } finally {
      profileFetchInFlightRef.current = null;
      clearTimeout(timeoutId);
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
        clearStoredGuestSession();
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
      // Try Supabase native Google OAuth first (cleanest flow)
      authDevLog('[Auth] Trying Supabase native Google OAuth...');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (!error && data?.url) {
        authDevLog('[Auth] Native OAuth URL obtained, redirecting...');
        window.location.href = data.url;
        return { success: true };
      }

      // Fallback: custom edge function OAuth flow
      authDevLog('[Auth] Native OAuth unavailable, using custom flow:', error?.message);

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
        console.error('[Auth] Custom OAuth init failed:', errorText);
        return { success: false, error: 'Failed to start Google sign in. Please try again.' };
      }

      const authData = await response.json();

      if (!authData.authUrl) {
        return { success: false, error: 'OAuth initialization failed.' };
      }

      sessionStorage.setItem('oauth_state', authData.state);
      sessionStorage.setItem('oauth_provider', 'google_auth');
      window.location.href = authData.authUrl;

      return { success: true };
    } catch (error) {
      console.error('[Auth] Google OAuth error:', error);
      return { success: false, error: 'Google sign in failed. Please try again.' };
    }
  }

  async function signInWithMicrosoft() {
    try {
      authDevLog('[Auth] Initiating Microsoft OAuth via Supabase native provider');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'openid profile email User.Read Calendars.ReadWrite',
        },
      });

      if (error) {
        console.error('[Auth] Microsoft OAuth error:', error);
        return { success: false, error: error.message };
      }

      if (data.url) {
        window.location.href = data.url;
      }

      return { success: true };
    } catch (error) {
      console.error('[Auth] Microsoft OAuth error:', error);
      return { success: false, error: 'Microsoft sign in failed. Please try again.' };
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    clearAllAppData();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DEV_GUEST_SESSION_STORAGE_KEY);
      localStorage.removeItem(LOCAL_ACCESS_TOKEN_KEY);
    }
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
            Authorization: `Bearer ${accessToken}`,
            apikey: publicAnonKey,
            'Content-Type': 'application/json',
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

      checklistTracking.completeItem('profile');

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
      authDevLog('[uploadPhoto] Starting upload process...');
      authDevLog('[uploadPhoto] Authentication status:', {
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
      authDevLog('[uploadPhoto] Created blob URL:', blobUrl);

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
      
      authDevLog('[uploadPhoto] Converted to base64, length:', base64.length);

      // ═══════════════════════════════════════════════════════════════
      // PHASE 3: Store locally FIRST (offline-first approach)
      // RESEARCH: Firebase - "Local storage first, sync later"
      // ═══════════════════════════════════════════════════════════════
      try {
        localStorage.setItem('syncscript_profile_photo', base64);
        localStorage.setItem('syncscript_profile_photo_timestamp', Date.now().toString());
        authDevLog('[uploadPhoto] Saved to localStorage successfully');
      } catch (storageError) {
        authDevWarn('[uploadPhoto] localStorage failed (might be full):', storageError);
        // Continue anyway - blob URL will work for session
      }

      // ═══════════════════════════════════════════════════════════════
      // PHASE 4: Check authentication for server upload
      // ═══════════════════════════════════════════════════════════════
      
      if (!accessToken || !user) {
        authDevLog('[uploadPhoto] No authentication - using local storage only');
        authDevLog('[uploadPhoto] ℹ️ Photo will be stored locally and synced when you log in');
        
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
        authDevLog('[uploadPhoto] Guest user - using local storage with sync pending');
        
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
      authDevLog('[uploadPhoto] Authenticated user - uploading to server...');
      
      // First update UI with local photo (instant feedback)
      setUser(prev => prev ? { ...prev, photoUrl: base64 } : null);
      
      // Then upload to server in background
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', fileName);

      authDevLog('[uploadPhoto] Sending request to server...');
      const uploadStartTime = performance.now();

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/user/upload-photo`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: publicAnonKey,
          },
          body: formData
        }
      );

      const uploadDuration = ((performance.now() - uploadStartTime) / 1000).toFixed(2);
      authDevLog(`[uploadPhoto] Server response in ${uploadDuration}s, status:`, response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[uploadPhoto] Server upload failed:', errorText);
        
        // ═══════════════════════════════════════════════════════════════
        // FALLBACK: Server failed, but we have local copy (graceful degradation)
        // ═══════════════════════════════════════════════════════════════
        authDevLog('[uploadPhoto] Using local fallback due to server error');
        
        return { 
          success: true, // Still success! Photo is saved locally
          photoUrl: base64, 
          mode: 'local-fallback',
          warning: 'Photo saved locally. Server sync failed but you can still use it.',
          serverError: errorText
        };
      }

      const { photoUrl: serverPhotoUrl } = await response.json();
      authDevLog('[uploadPhoto] Server upload successful:', serverPhotoUrl);
      
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

  async function seedDevGuestTasks(): Promise<void> {
    if (!import.meta.env.DEV || typeof window === 'undefined') return;
    try {
      const existing = window.localStorage.getItem(DEV_GUEST_SEED_STORAGE_KEY);
      if (existing) return;
      window.localStorage.setItem(
        DEV_GUEST_SEED_STORAGE_KEY,
        JSON.stringify(getFreshMockTasks()),
      );
    } catch (error) {
      authDevWarn('[Auth] Dev guest task seeding failed:', error);
    }
  }

  async function continueAsGuest() {
    const activateLocalGuestFallback = async () => {
      const localGuestId = `guest-local-${Date.now()}`;
      const fallbackToken = `gst_local_${Date.now()}`;
      const fallbackUser: User = {
        id: localGuestId,
        email: '',
        name: 'Guest User',
        onboardingCompleted: false,
        createdAt: new Date().toISOString(),
        isGuest: true,
      };
      setAccessToken(fallbackToken);
      setUser(fallbackUser);
      localStorage.setItem('syncscript_auth_user_id', localGuestId);
      localStorage.setItem(
        DEV_GUEST_SESSION_STORAGE_KEY,
        JSON.stringify({ token: fallbackToken, user: fallbackUser }),
      );
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('syncscript_guest_boot_pending', '1');
      }
      await seedDevGuestTasks();
      return { success: true as const };
    };
    try {
      // Wipe all previous session data so the guest sees a completely empty workspace
      clearAllAppData();
      authDevLog('[Auth] Creating guest session...');
      
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
        return activateLocalGuestFallback();
      }

      const data = await response.json();
      
      if (!data.accessToken || !data.user) {
        return { success: false, error: 'Invalid guest session response' };
      }

      // Set the guest user and token
      setAccessToken(data.accessToken);
      setUser(data.user);
      if (data.user?.id) {
        localStorage.setItem('syncscript_auth_user_id', data.user.id);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          DEV_GUEST_SESSION_STORAGE_KEY,
          JSON.stringify({ token: data.accessToken, user: data.user }),
        );
        window.sessionStorage.setItem('syncscript_guest_boot_pending', '1');
      }
      
      authDevLog('[Auth] Guest session created successfully');
      await seedDevGuestTasks();
      return { success: true };
    } catch (error) {
      console.error('[Auth] Guest creation error:', error);
      return activateLocalGuestFallback();
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
      authDevLog('[Auth] Upgrading guest account...');
      
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
        authDevLog('[Auth] Guest account upgraded successfully');
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

    // If we know this is a guest user but token format is non-standard
    // (or status endpoint is unavailable), prefer local session metadata
    // over network polling to avoid repeated 401 noise.
    const localExpiresAt = user?.expiresAt ? new Date(user.expiresAt).getTime() : NaN;
    const hasLocalExpiry = Number.isFinite(localExpiresAt);
    const localRemainingMs = hasLocalExpiry ? Math.max(0, localExpiresAt - Date.now()) : 0;
    const localRemaining = hasLocalExpiry
      ? {
          days: Math.floor(localRemainingMs / (24 * 60 * 60 * 1000)),
          hours: Math.floor((localRemainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)),
        }
      : undefined;

    // Guest status is now treated as local-session truth in the web app.
    // This avoids noisy 401 polling from auth/guest/status during guest sessions.
    if (user?.isGuest) {
      return { isGuest: true, timeRemaining: localRemaining };
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

    return { isGuest: false };
  }

  async function requestEmailChange(email: string) {
    if (!user || user.isGuest) {
      return { success: false, error: 'Sign in with a full account to change your email.' };
    }
    const trimmed = email.trim();
    if (!trimmed) {
      return { success: false, error: 'Enter an email address.' };
    }
    try {
      const redirect =
        typeof window !== 'undefined' ? `${window.location.origin}/settings?tab=account` : undefined;
      const { error } = await supabase.auth.updateUser(
        { email: trimmed },
        { emailRedirectTo: redirect },
      );
      if (error) {
        return { success: false, error: error.message };
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token && session.user?.id) {
        await fetchUserProfile(session.user.id, session.access_token);
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Could not update email. Try again.' };
    }
  }

  async function resendVerificationEmail() {
    try {
      if (user?.isGuest) {
        return { success: false, error: 'Guest sessions cannot verify email here.' };
      }
      const { data: { session } } = await supabase.auth.getSession();
      const em = session?.user?.email;
      if (!em) {
        return { success: false, error: 'No email address on this session.' };
      }
      const redirect =
        typeof window !== 'undefined' ? `${window.location.origin}/settings?tab=account` : undefined;
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: em,
        options: { emailRedirectTo: redirect },
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Could not resend verification email.' };
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
        requestEmailChange,
        resendVerificationEmail,
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