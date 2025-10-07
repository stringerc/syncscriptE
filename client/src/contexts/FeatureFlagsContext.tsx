import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

export interface FeatureFlags {
  // UI Shell
  new_ui: boolean
  cmd_palette: boolean
  
  // AI Features
  askAI: boolean
  
  // Productivity Features
  focusLock: boolean
  mic: boolean
  priorityHierarchy: boolean
  templates: boolean
  pinnedEvents: boolean
  
  // Calendar Integrations
  googleCalendar: boolean
  outlookCalendar: boolean
  appleCalendar: boolean
  
  // Social Features
  friends: boolean
  
  // Marketplace
  shareScript: boolean
  
  // Energy & Achievements
  energyHUD: boolean
  energyGraph: boolean
  
  // APL (Auto-Plan & Place)
  make_it_real: boolean
}

interface FeatureFlagsContextType {
  flags: FeatureFlags
  isLoading: boolean
  updateFlags: (updates: Partial<FeatureFlags>) => Promise<void>
  isFlagEnabled: (flagName: keyof FeatureFlags) => boolean
}

// Check URL parameters for feature flag overrides (for testing)
const getUrlFlagOverrides = (): Partial<FeatureFlags> => {
  const urlParams = new URLSearchParams(window.location.search);
  const overrides: Partial<FeatureFlags> = {};
  
  // Check for new_ui flag
  if (urlParams.get('new_ui') === 'true') {
    overrides.new_ui = true;
  }
  
  // Check for make_it_real flag
  if (urlParams.get('make_it_real') === 'true') {
    overrides.make_it_real = true;
  }
  
  return overrides;
};

const defaultFlags: FeatureFlags = {
  new_ui: true, // Enable new UI shell by default
  cmd_palette: false,
  askAI: false,
  focusLock: false,
  mic: false,
  priorityHierarchy: false,
  templates: false,
  pinnedEvents: false,
  googleCalendar: false,
  outlookCalendar: false,
  appleCalendar: false,
  friends: false,
  shareScript: false,
  energyHUD: false,
  energyGraph: false,
  make_it_real: false
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType>({
  flags: defaultFlags,
  isLoading: false,
  updateFlags: async () => {},
  isFlagEnabled: () => false
})

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // Fetch feature flags
  const { data: flagsData, isLoading } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      try {
        const response = await api.get('/feature-flags/flags')
        return response.data.data
      } catch (error) {
        // Silently fail - feature flags default to false
        console.log('ℹ️ Feature flags unavailable (using defaults)');
        return DEFAULT_FLAGS;
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false // Don't retry on failure
  })

  // Update flags mutation
  const updateFlagsMutation = useMutation({
    mutationFn: async (updates: Partial<FeatureFlags>) => {
      const response = await api.patch('/feature-flags/flags', updates)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] })
    }
  })

  // Apply URL overrides to flags (for testing)
  const urlOverrides = getUrlFlagOverrides();
  const flags = { ...(flagsData || defaultFlags), ...urlOverrides }

  const updateFlags = async (updates: Partial<FeatureFlags>) => {
    await updateFlagsMutation.mutateAsync(updates)
  }

  const isFlagEnabled = (flagName: keyof FeatureFlags): boolean => {
    return flags[flagName] || false
  }

  return (
    <FeatureFlagsContext.Provider value={{ flags, isLoading, updateFlags, isFlagEnabled }}>
      {children}
    </FeatureFlagsContext.Provider>
  )
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext)
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider')
  }
  return context
}
