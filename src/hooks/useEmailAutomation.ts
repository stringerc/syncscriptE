// =====================================================================
// EMAIL AUTOMATION HOOK
// Automatically trigger behavioral emails based on user activity
// =====================================================================

import { useEffect, useCallback } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface EmailAutomationOptions {
  userEmail: string | null;
  isGuest?: boolean;
}

export function useEmailAutomation({ userEmail, isGuest = false }: EmailAutomationOptions) {
  
  // Update subscriber metadata (goals, tasks, energy, last login)
  const updateMetadata = useCallback(async (metadata: {
    goals_completed?: number;
    tasks_completed?: number;
    current_streak?: number;
    energy_points?: number;
    last_login?: string;
  }) => {
    if (!userEmail || isGuest) return;
    
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/email/subscriber/${encodeURIComponent(userEmail)}/metadata`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ metadata })
        }
      );
    } catch (error) {
      console.warn('[Email Automation] Failed to update metadata:', error);
    }
  }, [userEmail, isGuest]);

  // Trigger goal completion email
  const triggerGoalCompletion = useCallback(async (goalData: {
    goalName?: string;
    energyAwarded?: number;
    totalEnergy?: number;
  }) => {
    if (!userEmail || isGuest) return;
    
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/email/trigger/goal-completion`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: userEmail,
            ...goalData
          })
        }
      );
      
      console.log('[Email Automation] Goal completion email triggered');
    } catch (error) {
      console.warn('[Email Automation] Failed to trigger goal completion:', error);
    }
  }, [userEmail, isGuest]);

  // Update metadata on mount (track last login)
  useEffect(() => {
    if (userEmail && !isGuest) {
      updateMetadata({
        last_login: new Date().toISOString()
      });
    }
  }, [userEmail, isGuest, updateMetadata]);

  return {
    updateMetadata,
    triggerGoalCompletion
  };
}
