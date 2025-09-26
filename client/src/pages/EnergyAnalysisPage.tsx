import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Loader2, Zap, Clock, TrendingUp, Lightbulb, Calendar, Target, Brain } from 'lucide-react'
import { toast } from '../hooks/use-toast'

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

const EnergyAnalysisPage: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const queryClient = useQueryClient()

  // Energy analysis query
  const { data: energyData, isLoading, error } = useQuery<EnergyAnalysis>({
    queryKey: ['energy-analysis'],
    queryFn: async () => {
      const response = await api.post('/ai/energy-analysis')
      return response.data.data
    },
    enabled: false // Only run when manually triggered
  })

  // Apply scheduling recommendations mutation
  const applyScheduleMutation = useMutation({
    mutationFn: async (recommendations: any[]) => {
      const response = await api.post('/ai/apply-energy-schedule', { recommendations })
      return response.data
    },
    onSuccess: (data) => {
      toast({
        title: "Schedule Applied",
        description: `Successfully scheduled ${data.data.totalScheduled} tasks based on energy optimization.`
      })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to apply energy-based scheduling",
        variant: "destructive"
      })
    }
  })

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      await queryClient.fetchQuery({ queryKey: ['energy-analysis'] })
    } catch (error) {
      console.error('Energy analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleApplySchedule = () => {
    if (energyData?.schedulingRecommendations) {
      applyScheduleMutation.mutate(energyData.schedulingRecommendations)
    }
  }

  const getEnergyColor = (level: number) => {
    if (level >= 8) return 'text-green-600 bg-green-100'
    if (level >= 6) return 'text-yellow-600 bg-yellow-100'
    if (level >= 4) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getEnergyIcon = (level: number) => {
    if (level >= 8) return <Zap className="w-4 h-4" />
    if (level >= 6) return <TrendingUp className="w-4 h-4" />
    if (level >= 4) return <Clock className="w-4 h-4" />
    return <Target className="w-4 h-4" />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8 text-blue-600" />
            Energy Adaptive Agent
          </h1>
          <p className="text-gray-600 mt-2">
            AI-powered energy analysis and optimal scheduling recommendations
          </p>
        </div>
        <Button 
          onClick={handleAnalyze} 
          disabled={isAnalyzing || isLoading}
          className="flex items-center gap-2"
        >
          {(isAnalyzing || isLoading) ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Brain className="w-4 h-4" />
          )}
          {isAnalyzing || isLoading ? 'Analyzing...' : 'Analyze Energy Patterns'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to analyze energy patterns. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {energyData && (
        <div className="space-y-6">
          {/* Current Energy Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Current Energy Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{energyData.energyAnalysis.currentEnergyAssessment}</p>
            </CardContent>
          </Card>

          {/* Energy Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Energy Patterns
              </CardTitle>
              <CardDescription>Your energy levels throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getEnergyColor(energyData.energyAnalysis.energyPatterns.morningEnergy)}`}>
                    {getEnergyIcon(energyData.energyAnalysis.energyPatterns.morningEnergy)}
                    Morning: {energyData.energyAnalysis.energyPatterns.morningEnergy}/10
                  </div>
                  <p className="text-xs text-gray-500 mt-1">6 AM - 12 PM</p>
                </div>
                <div className="text-center">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getEnergyColor(energyData.energyAnalysis.energyPatterns.afternoonEnergy)}`}>
                    {getEnergyIcon(energyData.energyAnalysis.energyPatterns.afternoonEnergy)}
                    Afternoon: {energyData.energyAnalysis.energyPatterns.afternoonEnergy}/10
                  </div>
                  <p className="text-xs text-gray-500 mt-1">12 PM - 6 PM</p>
                </div>
                <div className="text-center">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getEnergyColor(energyData.energyAnalysis.energyPatterns.eveningEnergy)}`}>
                    {getEnergyIcon(energyData.energyAnalysis.energyPatterns.eveningEnergy)}
                    Evening: {energyData.energyAnalysis.energyPatterns.eveningEnergy}/10
                  </div>
                  <p className="text-xs text-gray-500 mt-1">6 PM - 12 AM</p>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-green-700 mb-2">Peak Energy Hours</h4>
                  <div className="flex flex-wrap gap-1">
                    {energyData.energyAnalysis.energyPatterns.peakHours.map((hour, index) => (
                      <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                        {hour}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-red-700 mb-2">Low Energy Hours</h4>
                  <div className="flex flex-wrap gap-1">
                    {energyData.energyAnalysis.energyPatterns.lowEnergyHours.map((hour, index) => (
                      <Badge key={index} variant="secondary" className="bg-red-100 text-red-800">
                        {hour}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Optimal Energy Windows */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Optimal Energy Windows
              </CardTitle>
              <CardDescription>Best times for different types of work</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {energyData.energyAnalysis.optimalEnergyWindows.map((window, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{window.timeRange}</h4>
                      <Badge className={`${getEnergyColor(window.energyLevel)} border-0`}>
                        Energy: {window.energyLevel}/10
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{window.reasoning}</p>
                    <div className="flex flex-wrap gap-1">
                      {window.recommendedTaskTypes.map((type, typeIndex) => (
                        <Badge key={typeIndex} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Scheduling Recommendations */}
          {energyData.schedulingRecommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  Scheduling Recommendations
                </CardTitle>
                <CardDescription>AI-suggested optimal times for your pending tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {energyData.schedulingRecommendations.map((rec, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium">{rec.taskTitle}</h4>
                          <p className="text-sm text-gray-600">
                            Suggested: {new Date(rec.suggestedTime).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {rec.energyMatch}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rec.reasoning}</p>
                      {rec.alternativeTimes.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Alternative times:</p>
                          <div className="flex flex-wrap gap-1">
                            {rec.alternativeTimes.map((time, timeIndex) => (
                              <Badge key={timeIndex} variant="secondary" className="text-xs">
                                {time}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 flex gap-2">
                  <Button 
                    onClick={handleApplySchedule}
                    disabled={applyScheduleMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {applyScheduleMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Calendar className="w-4 h-4" />
                    )}
                    Apply All Recommendations
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Energy Optimization Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                Energy Optimization Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {energyData.energyOptimizationTips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Adaptive Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-600" />
                Adaptive Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {energyData.adaptiveSuggestions.shouldReschedule && (
                  <Alert>
                    <AlertDescription>
                      <strong>Reschedule Recommendation:</strong> {energyData.adaptiveSuggestions.rescheduleReason}
                    </AlertDescription>
                  </Alert>
                )}
                
                {energyData.adaptiveSuggestions.energyBoostSuggestions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-green-700 mb-2">Energy Boost Suggestions</h4>
                    <ul className="space-y-1">
                      {energyData.adaptiveSuggestions.energyBoostSuggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {energyData.adaptiveSuggestions.taskModifications.length > 0 && (
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2">Task Modifications</h4>
                    <ul className="space-y-1">
                      {energyData.adaptiveSuggestions.taskModifications.map((modification, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          {modification}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default EnergyAnalysisPage
