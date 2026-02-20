/**
 * EnergyContext - App-wide Energy State Management (v2.0)
 * 
 * Phase 2.0: Integrated Phases 3-5 (Resonance, Decay, Predictions, Adaptive Difficulty)
 * Provides energy state and actions to all components.
 * Ensures energy updates propagate everywhere immediately.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  EnergyState,
  EnergySource,
  createInitialEnergyState,
  addEnergy,
  resetEnergyIfNeeded,
  toggleDisplayMode,
  applyDecay,
  getTaskEnergyValue,
  getGoalEnergyValue,
  getMilestoneEnergyValue,
  getStepEnergyValue,
  getAchievementEnergyValue,
  getHealthEnergyValue,
} from '../utils/energy-system';
import { Task, Priority } from '../types/task';
import { toast } from 'sonner@2.0.3';

interface EnergyContextType {
  energy: EnergyState;
  
  // Actions (updated to accept resonance)
  completeTask: (taskId: string, taskTitle: string, priority: 'low' | 'medium' | 'high', resonance?: number) => void;
  completeGoal: (goalId: string, goalTitle: string, size: 'small' | 'medium' | 'large', resonance?: number) => void;
  completeMilestone: (milestoneId: string, milestoneTitle: string, resonance?: number) => void;
  completeStep: (stepId: string, stepTitle: string, resonance?: number) => void;
  unlockAchievement: (achievementId: string, achievementTitle: string, tier: 'bronze' | 'silver' | 'gold' | 'platinum') => void;
  logHealthAction: (action: 'hydration' | 'steps' | 'workout' | 'sleep', title?: string) => void;
  
  // Display mode toggle
  toggleMode: () => void;
  
  // Utility
  refreshEnergy: () => void;
  
  // Awards energy with resonance - used by calendar events
  awardEnergy: (params: { source: EnergySource; baseEnergy?: number; eventDuration?: number; title: string; itemId?: string; resonance?: number }) => void;
}

const EnergyContext = createContext<EnergyContextType | undefined>(undefined);

export function EnergyProvider({ children }: { children: React.ReactNode }) {
  const [energy, setEnergy] = useState<EnergyState>(() => {
    // Load from localStorage if available
    const stored = localStorage.getItem('syncscript_energy');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const state = {
          ...parsed,
          lastReset: parsed.lastReset ? new Date(parsed.lastReset) : new Date(),
          lastActivity: parsed.lastActivity ? new Date(parsed.lastActivity) : new Date(), // Convert lastActivity with fallback
          entries: parsed.entries ? parsed.entries.map((e: any) => ({
            ...e,
            timestamp: new Date(e.timestamp),
          })) : [],
        };
        
        // Validate that dates are actually valid
        if (isNaN(state.lastReset.getTime()) || isNaN(state.lastActivity.getTime())) {
          console.warn('Invalid dates in stored energy, resetting to initial state');
          localStorage.removeItem('syncscript_energy');
          return createInitialEnergyState();
        }
        
        return state;
      } catch (e) {
        console.error('Failed to parse stored energy:', e);
        localStorage.removeItem('syncscript_energy'); // Clear corrupted data
      }
    }
    return createInitialEnergyState();
  });

  // Save to localStorage whenever energy changes
  useEffect(() => {
    localStorage.setItem('syncscript_energy', JSON.stringify(energy));
  }, [energy]);

  // Check for midnight reset
  useEffect(() => {
    const checkReset = () => {
      setEnergy(prev => resetEnergyIfNeeded(prev));
    };

    // Check every minute
    const interval = setInterval(checkReset, 60000);
    
    // Check immediately
    checkReset();

    return () => clearInterval(interval);
  }, []);

  // Apply inactivity decay (mock)
  useEffect(() => {
    const applyDecayInterval = setInterval(() => {
      setEnergy(prev => applyDecay(prev, 1)); // Decay 1 hour worth
    }, 3600000); // Every hour

    return () => clearInterval(applyDecayInterval);
  }, []);

  const completeTask = useCallback((taskId: string, taskTitle: string, priority: 'low' | 'medium' | 'high', resonance?: number) => {
    const baseEnergy = getTaskEnergyValue(priority);
    
    // Calculate actual energy with resonance
    let actualEnergy = baseEnergy;
    let multiplier = 1.0;
    if (resonance !== undefined) {
      if (resonance >= 90) multiplier = 2.0;
      else if (resonance >= 80) multiplier = 1.5;
      else if (resonance >= 60) multiplier = 1.2;
      else if (resonance >= 40) multiplier = 1.0;
      else if (resonance >= 20) multiplier = 0.8;
      else multiplier = 0.6;
      actualEnergy = Math.floor(baseEnergy * multiplier);
    }
    
    console.log('⚡ EnergyContext.completeTask called:', {
      taskId,
      taskTitle,
      priority,
      baseEnergy,
      resonance,
      multiplier,
      actualEnergy
    });
    
    setEnergy(prev => {
      console.log('⚡ Current energy before update:', prev.totalEnergy, 'points');
      const newState = addEnergy(prev, 'tasks', baseEnergy, taskTitle, taskId, resonance);
      console.log('⚡ New energy after update:', newState.totalEnergy, 'points (+' + (newState.totalEnergy - prev.totalEnergy) + ')');
      return newState;
    });
    
    // Show resonance feedback
    let resonanceFeedback = '';
    if (multiplier >= 1.5) {
      resonanceFeedback = ' 🔥 High resonance bonus!';
    } else if (multiplier >= 1.2) {
      resonanceFeedback = ' 💫 Good resonance!';
    } else if (multiplier < 1.0) {
      resonanceFeedback = ' ⚠️ Low resonance.';
    }
    
    // DON'T show duplicate toast - TasksContext already shows one
    // toast.success('Task completed!', {
    //   description: `+${actualEnergy} energy from "${taskTitle}"${resonanceFeedback}`,
    // });
  }, []);

  const completeGoal = useCallback((goalId: string, goalTitle: string, size: 'small' | 'medium' | 'large', resonance?: number) => {
    const energyGained = getGoalEnergyValue(size);
    setEnergy(prev => addEnergy(prev, 'goals', energyGained, goalTitle, goalId, resonance));
    
    toast.success('Goal completed!', {
      description: `+${energyGained} energy from "${goalTitle}"`,
    });
  }, []);

  const completeMilestone = useCallback((milestoneId: string, milestoneTitle: string, resonance?: number) => {
    const energyGained = getMilestoneEnergyValue();
    setEnergy(prev => addEnergy(prev, 'milestones', energyGained, milestoneTitle, milestoneId, resonance));
    
    toast.success('Milestone reached!', {
      description: `+${energyGained} energy from "${milestoneTitle}"`,
    });
  }, []);

  const completeStep = useCallback((stepId: string, stepTitle: string, resonance?: number) => {
    const energyGained = getStepEnergyValue();
    setEnergy(prev => addEnergy(prev, 'steps', energyGained, stepTitle, stepId, resonance));
    
    toast.success('Step completed!', {
      description: `+${energyGained} energy from "${stepTitle}"`,
    });
  }, []);

  const unlockAchievement = useCallback((
    achievementId: string,
    achievementTitle: string,
    tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  ) => {
    const energyGained = getAchievementEnergyValue(tier);
    setEnergy(prev => addEnergy(prev, 'achievements', energyGained, achievementTitle, achievementId));
    
    toast.success('Achievement unlocked!', {
      description: `+${energyGained} energy from "${achievementTitle}"`,
    });
  }, []);

  const logHealthAction = useCallback((
    action: 'hydration' | 'steps' | 'workout' | 'sleep',
    title?: string
  ) => {
    const energyGained = getHealthEnergyValue(action);
    const actionTitles = {
      hydration: 'Logged hydration',
      steps: 'Logged steps',
      workout: 'Completed workout',
      sleep: 'Logged sleep',
    };
    
    setEnergy(prev => addEnergy(prev, 'health', energyGained, title || actionTitles[action]));
    
    toast.success('Health action logged!', {
      description: `+${energyGained} energy from ${actionTitles[action]}`,
    });

    import('../components/onboarding/OnboardingChecklist').then(m => m.checklistTracking.completeItem('energy')).catch(() => {});
    localStorage.setItem('syncscript_has_logged_energy', 'true');
  }, []);

  const toggleMode = useCallback(() => {
    setEnergy(prev => toggleDisplayMode(prev));
    
    const newMode = energy.displayMode === 'points' ? 'aura' : 'points';
    toast.info(`Switched to ${newMode} mode`, {
      description: newMode === 'aura' 
        ? 'Ring glow increases with each 100% completion' 
        : 'Ring segments show energy by source',
    });
  }, [energy.displayMode]);

  const refreshEnergy = useCallback(() => {
    setEnergy(prev => resetEnergyIfNeeded(prev));
  }, []);

  const awardEnergy = useCallback((params: { source: EnergySource; baseEnergy?: number; eventDuration?: number; title: string; itemId?: string; resonance?: number }) => {
    const { source, baseEnergy, eventDuration, title, itemId, resonance } = params;
    const energyGained = baseEnergy || 0;
    setEnergy(prev => addEnergy(prev, source, energyGained, title, itemId, resonance));
    
    toast.success('Energy awarded!', {
      description: `+${energyGained} energy from "${title}"`,
    });
  }, []);

  const value: EnergyContextType = {
    energy,
    completeTask,
    completeGoal,
    completeMilestone,
    completeStep,
    unlockAchievement,
    logHealthAction,
    toggleMode,
    refreshEnergy,
    awardEnergy,
  };

  return (
    <EnergyContext.Provider value={value}>
      {children}
    </EnergyContext.Provider>
  );
}

export function useEnergy() {
  const context = useContext(EnergyContext);
  if (!context) {
    throw new Error('useEnergy must be used within EnergyProvider');
  }
  return context;
}