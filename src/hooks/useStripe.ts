/**
 * Stripe Integration Hook
 * 
 * Production-ready React hook for Stripe subscription management.
 * Handles all payment operations with error handling and loading states.
 */

import { useState, useEffect, useCallback } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export interface PricingPlan {
  name: string;
  price_id: string;
  amount: number;
  interval: string;
  features: string[];
}

export interface Subscription {
  id: string;
  status: string;
  plan: string;
  current_period_end: number;
  cancel_at_period_end: boolean;
  trial_end?: number;
}

export interface UsageData {
  usage: {
    tasks_created: number;
    api_calls: number;
    storage_mb: number;
  };
  limits: {
    tasks: number;
    api_calls: number;
    storage_mb: number;
  };
  subscription_status: string;
}

export function useStripe(userId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Record<string, PricingPlan>>({});

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/stripe`;

  // Load pricing plans
  useEffect(() => {
    loadPricing();
  }, []);

  // Load user's subscription
  useEffect(() => {
    if (userId) {
      loadSubscription();
    }
  }, [userId]);

  const loadPricing = async () => {
    try {
      const response = await fetch(`${baseUrl}/pricing`);
      if (!response.ok) throw new Error('Failed to load pricing');
      
      const data = await response.json();
      setPlans(data.plans);
    } catch (err) {
      console.error('Error loading pricing:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pricing');
    }
  };

  const loadSubscription = async () => {
    try {
      const response = await fetch(`${baseUrl}/subscription/${userId}`);
      if (!response.ok) throw new Error('Failed to load subscription');
      
      const data = await response.json();
      setSubscription(data.subscription);
    } catch (err) {
      console.error('Error loading subscription:', err);
      // Don't set error - user might not have subscription
    }
  };

  const createCheckoutSession = async (
    planId: string,
    email: string,
    successUrl?: string,
    cancelUrl?: string
  ): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          plan_id: planId,
          user_id: userId,
          email,
          success_url: successUrl,
          cancel_url: cancelUrl
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const data = await response.json();
      return data.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create checkout session';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ user_id: userId })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      await loadSubscription(); // Refresh subscription data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel subscription';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reactivateSubscription = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/reactivate-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ user_id: userId })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reactivate subscription');
      }

      await loadSubscription(); // Refresh subscription data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reactivate subscription';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async (newPlanId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/update-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          user_id: userId,
          new_plan_id: newPlanId
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update subscription');
      }

      await loadSubscription(); // Refresh subscription data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update subscription';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async (returnUrl?: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          user_id: userId,
          return_url: returnUrl
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to open customer portal');
      }

      const data = await response.json();
      window.location.href = data.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to open customer portal';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getUsage = async (): Promise<UsageData> => {
    try {
      const response = await fetch(`${baseUrl}/usage/${userId}`);
      if (!response.ok) throw new Error('Failed to load usage');
      
      return await response.json();
    } catch (err) {
      console.error('Error loading usage:', err);
      throw err;
    }
  };

  return {
    // State
    loading,
    error,
    subscription,
    plans,
    
    // Methods
    createCheckoutSession,
    cancelSubscription,
    reactivateSubscription,
    updateSubscription,
    openCustomerPortal,
    getUsage,
    refresh: loadSubscription
  };
}
