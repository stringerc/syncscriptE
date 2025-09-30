import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

export interface FeatureFlags {
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
  
  // Energy & Gamification
  energyHUD: boolean
  energyGraph: boolean
}

interface FeatureFlagsContextType {
  flags: FeatureFlags
  isLoading: boolean
  updateFlags: (updates: Partial<FeatureFlags>) => Promise<void>
  isFlagEnabled: (flagName: keyof FeatureFlags) => boolean
}

const defaultFlags: FeatureFlags = {
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
  energyGraph: false
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
      const response = await api.get('/feature-flags/flags')
      return response.data.data
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
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

  const flags = flagsData || defaultFlags

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
