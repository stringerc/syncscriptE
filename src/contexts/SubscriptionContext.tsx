/**
 * Subscription Context
 * 
 * Manages user access: subscription, free trial, or beta code.
 * Checks access status on login and caches it locally.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

type AccessType = 'beta' | 'subscription' | 'trial' | 'free_trial' | 'reverse_trial' | 'free_lite' | 'free' | 'none';

interface FreeTierLimits {
  tasksPerDay: number;
  calendarIntegrations: number;
  scriptsLimit: number;
  aiAssistant: boolean;
  voiceCalls: boolean;
  customScripts: boolean;
  teamMembers: number;
  marketplace: boolean;
}

const LITE_TIER_LIMITS: FreeTierLimits = {
  tasksPerDay: 5,
  calendarIntegrations: 1,
  scriptsLimit: 3,
  aiAssistant: false,
  voiceCalls: false,
  customScripts: false,
  teamMembers: 1,
  marketplace: false,
};

interface AccessStatus {
  hasAccess: boolean;
  accessType: AccessType;
  plan?: string;
  memberNumber?: number;
  trialEnd?: string;
  daysRemaining?: number;
  expiresAt?: string | null;
  limits?: FreeTierLimits;
  reverseTrialActive?: boolean;
}

interface SubscriptionContextType {
  access: AccessStatus;
  loading: boolean;
  checkAccess: () => Promise<void>;
  redeemBetaCode: (code: string) => Promise<{ success: boolean; message: string }>;
  startTrial: () => Promise<{ success: boolean; daysRemaining?: number }>;
  createCheckout: (planId: string) => Promise<string | null>;
}

const DEFAULT_ACCESS: AccessStatus = {
  hasAccess: false,
  accessType: 'none',
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/stripe`;

function headers() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`,
  };
}

function initReverseTrialLocally(userId: string): AccessStatus {
  const storageKey = `syncscript_reverse_trial_start_${userId}`;
  let startDate = localStorage.getItem(storageKey);
  if (!startDate) {
    startDate = new Date().toISOString();
    localStorage.setItem(storageKey, startDate);
  }

  const elapsed = Date.now() - new Date(startDate).getTime();
  const daysElapsed = Math.floor(elapsed / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, 14 - daysElapsed);

  if (daysRemaining > 0) {
    return {
      hasAccess: true,
      accessType: 'reverse_trial',
      plan: 'professional',
      daysRemaining,
      reverseTrialActive: true,
    };
  }

  // Trial expired — downgrade to Lite free tier (keeps user in ecosystem)
  return {
    hasAccess: true,
    accessType: 'free_lite',
    limits: LITE_TIER_LIMITS,
    reverseTrialActive: false,
    daysRemaining: 0,
  };
}

export { LITE_TIER_LIMITS };

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [access, setAccess] = useState<AccessStatus>(DEFAULT_ACCESS);
  const [loading, setLoading] = useState(true);

  const checkAccess = useCallback(async () => {
    if (!user?.id) {
      setAccess(DEFAULT_ACCESS);
      setLoading(false);
      return;
    }

    // Guest users get the reverse trial experience (full Professional for 14 days)
    if (user.isGuest) {
      setAccess({
        hasAccess: true,
        accessType: 'reverse_trial',
        plan: 'professional',
        daysRemaining: 14,
        reverseTrialActive: true,
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/access/${user.id}`, { headers: headers() });
      if (response.ok) {
        const data = await response.json();
        setAccess(data);

        if (data.accessType === 'beta' && data.memberNumber) {
          console.log(`[Subscription] Beta Tester #${data.memberNumber} — full Professional access`);
        }
      } else {
        // API error — start reverse trial to avoid blocking new users
        const reverseTrialData = initReverseTrialLocally(user.id);
        setAccess(reverseTrialData);
      }
    } catch {
      // Network error — check localStorage cache, fall back to reverse trial
      const cached = localStorage.getItem(`syncscript_access_${user.id}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.accessType === 'reverse_trial' && parsed.daysRemaining !== undefined && parsed.daysRemaining <= 0) {
            setAccess({
              hasAccess: true,
              accessType: 'free_lite',
              limits: LITE_TIER_LIMITS,
              reverseTrialActive: false,
            });
          } else {
            setAccess(parsed);
          }
        } catch {
          const reverseTrialData = initReverseTrialLocally(user.id);
          setAccess(reverseTrialData);
        }
      } else {
        const reverseTrialData = initReverseTrialLocally(user.id);
        setAccess(reverseTrialData);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.isGuest]);

  // Cache access status locally
  useEffect(() => {
    if (user?.id && access.accessType !== 'none') {
      localStorage.setItem(`syncscript_access_${user.id}`, JSON.stringify(access));
    }
  }, [user?.id, access]);

  // Check access on login/user change
  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const redeemBetaCode = useCallback(async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!user?.id) return { success: false, message: 'Not logged in' };

    try {
      const response = await fetch(`${baseUrl}/redeem-beta-code`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ code, user_id: user.id, email: user.email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await checkAccess(); // Refresh access status
        return { success: true, message: data.message };
      }

      return { success: false, message: data.error || 'Failed to redeem code' };
    } catch {
      return { success: false, message: 'Network error. Please try again.' };
    }
  }, [user?.id, user?.email, checkAccess]);

  const startTrial = useCallback(async (): Promise<{ success: boolean; daysRemaining?: number }> => {
    if (!user?.id) return { success: false };

    try {
      const response = await fetch(`${baseUrl}/start-trial`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ user_id: user.id }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await checkAccess();
        return { success: true, daysRemaining: data.daysRemaining };
      }

      return { success: false };
    } catch {
      return { success: false };
    }
  }, [user?.id, checkAccess]);

  const createCheckout = useCallback(async (planId: string): Promise<string | null> => {
    if (!user?.id || !user?.email) return null;

    try {
      // Check if user has a beta coupon
      const couponId = localStorage.getItem(`syncscript_beta_coupon_${user.id}`);

      const response = await fetch(`${baseUrl}/create-checkout-session`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          plan_id: planId,
          user_id: user.id,
          email: user.email,
          success_url: `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/pricing`,
        }),
      });

      const data = await response.json();
      return data.url || null;
    } catch {
      return null;
    }
  }, [user?.id, user?.email]);

  return (
    <SubscriptionContext.Provider value={{ access, loading, checkAccess, redeemBetaCode, startTrial, createCheckout }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
