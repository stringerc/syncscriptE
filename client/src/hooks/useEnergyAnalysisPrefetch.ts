import { useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

interface EnergyAnalysis {
  energyAnalysis: {
    currentEnergyAssessment: string
    optimalEnergyWindows: Array<{
      timeRange: string
      energyLevel: number
      recommendedTaskTypes: string[]
      reasoning: string
    }>
    energyPatterns: {
      morningEnergy: number
      afternoonEnergy: number
      eveningEnergy: number
      peakHours: string[]
      lowEnergyHours: string[]
    }
  }
  schedulingRecommendations: Array<{
    taskId: string
    taskTitle: string
    suggestedTime: string
    reasoning: string
    energyMatch: string
    alternativeTimes: string[]
  }>
  energyOptimizationTips: string[]
  adaptiveSuggestions: {
    shouldReschedule: boolean
    rescheduleReason: string
    energyBoostSuggestions: string[]
    taskModifications: string[]
  }
}

export const useEnergyAnalysisPrefetch = () => {
  const queryClient = useQueryClient()

  const prefetchEnergyAnalysis = async () => {
    try {
      // Prefetch energy analysis data
      await queryClient.prefetchQuery({
        queryKey: ['energy-analysis'],
        queryFn: async () => {
          const response = await api.post('/ai/energy-analysis')
          return response.data.data || response.data
        },
        staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
        cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
      })
    } catch (error) {
      // Silently fail prefetch - don't show errors for background operations
      console.debug('Energy analysis prefetch failed:', error)
    }
  }

  return { prefetchEnergyAnalysis }
}
