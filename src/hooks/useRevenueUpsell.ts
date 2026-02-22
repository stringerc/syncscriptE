/**
 * Revenue Upsell Hook - Small Improvement Batch 3
 * 
 * A small but high-impact improvement that adds smart contextual upsells
 * right when users are experiencing value from the app.
 * 
 * Revenue Focus: Direct upsell trigger during high-value moments
 */

import { useState, useEffect, useCallback } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/AuthContext';

interface RevenueUpsellEvent {
  type: 'energy_achievement' | 'task_milestone' | 'streak_broken' | 'time_saved';
  context: any;
  suggestedPlan: 'pro' | 'team' | 'enterprise';
  discountCode?: string;
  urgencyMultiplier: number;
}

interface UseRevenueUpsellReturn {
  triggerUpsell: (event: RevenueUpsellEvent) => void;
  dismissUpsell: () => void;
  isUpsellVisible: boolean;
  currentUpsell: RevenueUpsellEvent | null;
}

export function useRevenueUpsell(): UseRevenueUpsellReturn {
  const { access, createCheckout } = useSubscription();
  const { user } = useAuth();
  
  const [isUpsellVisible, setIsUpsellVisible] = useState(false);
  const [currentUpsell, setCurrentUpsell] = useState<RevenueUpsellEvent | null>(null);
  const [lastUpsellTime, setLastUpsellTime] = useState<number>(0);

  // Revenue tracking helper
  const trackRevenueEvent = useCallback((eventType: string, value: any) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventType, {
        value,
        user_id: user?.id,
        subscription_type: access.accessType,
      });
    }
    
    console.log(`[Revenue] ${eventType}:`, value);
  }, [user?.id, access.accessType]);

  const triggerUpsell = useCallback((event: RevenueUpsellEvent) => {
    // Skip if user already has paid plan or recently seen upsell
    if (access.accessType !== 'free_lite') return;
    
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000; // 24 hours
    
    if (now - lastUpsellTime < cooldown) {
      console.log('[Revenue] Upsell cooldown active');
      return;
    }

    // Revenue scoring based on event urgency
    const shouldTrigger = calculateRevenueUrgency(event);
    
    if (shouldTrigger) {
      setCurrentUpsell(event);
      setIsUpsellVisible(true);
      setLastUpsellTime(now);
      
      // Track impression
      trackRevenueEvent('upsell_shown', {
        type: event.type,
        plan: event.suggestedPlan,
        multiplier: event.urgencyMultiplier,
        timestamp: now,
      });
    }
  }, [access.accessType, lastUpsellTime, trackRevenueEvent]);

  const dismissUpsell = useCallback(() => {
    setIsUpsellVisible(false);
    setCurrentUpsell(null);
    
    trackRevenueEvent('upsell_dismissed', {
      type: currentUpsell?.type,
      timestamp: Date.now(),
    });
  }, [currentUpsell?.type, trackRevenueEvent]);

  const calculateRevenueUrgency = (event: RevenueUpsellEvent): boolean => {
    const baseScore = event.urgencyMultiplier;
    
    // Revenue optimization: higher urgency = more likely to convert
    switch (event.type) {
      case 'energy_achievement':
        return baseScore > 0.8 && event.context.energyLevel > 8;
      case 'task_milestone':
        return event.context.completedTasks >= 5;
      case 'streak_broken':
        return baseScore > 1.2; // High urgency after streak loss
      case 'time_saved':
        return event.context.timeSavedHours >= 1; // Significant time saved
      default:
        return baseScore > 1.0;
    }
  };

  return {
    triggerUpsell,
    dismissUpsell,
    isUpsellVisible,
    currentUpsell,
  };
}

// Export for immediate use in energy tracking
export const useEnergyRevenue = () => {
  const { triggerUpsell } = useRevenueUpsell();
  
  return {
    triggerEnergyAchievement: (energyLevel: number) => {
      triggerUpsell({
        type: 'energy_achievement',
        context: { energyLevel, timestamp: Date.now() },
        suggestedPlan: 'pro',
        discountCode: 'ENERGY10',
        urgencyMultiplier: energyLevel / 10, // 0.8-1.0 range
      });
    }
  };
};