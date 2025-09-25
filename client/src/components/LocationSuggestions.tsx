import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Cloud, Sun, CloudRain, Wind, Thermometer } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface LocationSuggestion {
  location: string
  weather?: {
    temperature: number
    condition: string
    description: string
    humidity: number
    windSpeed: number
    location: string
    timestamp: string
  }
  suitability: 'excellent' | 'good' | 'fair' | 'poor'
  reasoning: string
}

interface LocationSuggestionsProps {
  onLocationSelect?: (location: string) => void
  selectedLocation?: string
}

export function LocationSuggestions({ onLocationSelect, selectedLocation }: LocationSuggestionsProps) {
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [availableLocations, setAvailableLocations] = useState<string[]>([])

  // Get location suggestions mutation
  const getSuggestionsMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/location/suggest', {
        taskTitle,
        taskDescription,
        availableLocations: availableLocations.length > 0 ? availableLocations : undefined
      })
      return response.data.data
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to get location suggestions",
        variant: "destructive"
      })
    }
  })

  const handleGetSuggestions = () => {
    if (!taskTitle.trim()) {
      toast({
        title: "Task Title Required",
        description: "Please enter a task title to get location suggestions",
        variant: "destructive"
      })
      return
    }
    getSuggestionsMutation.mutate()
  }

  const handleLocationSelect = (location: string) => {
    if (onLocationSelect) {
      onLocationSelect(location)
    }
  }

  const getSuitabilityColor = (suitability: string) => {
    switch (suitability) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200'
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'poor': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getWeatherIcon = (condition: string) => {
    const conditionLower = condition.toLowerCase()
    if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
      return <CloudRain className="w-4 h-4" />
    } else if (conditionLower.includes('cloud')) {
      return <Cloud className="w-4 h-4" />
    } else if (conditionLower.includes('sun') || conditionLower.includes('clear')) {
      return <Sun className="w-4 h-4" />
    } else {
      return <Wind className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Location Suggestions</span>
          </CardTitle>
          <CardDescription>
            Get AI-powered location suggestions based on your task and current weather conditions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Task Title</Label>
            <Input
              id="task-title"
              placeholder="e.g., Go for a run, Have a meeting, Study"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Task Description (Optional)</Label>
            <Textarea
              id="task-description"
              placeholder="Additional details about the task..."
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="available-locations">Available Locations (Optional)</Label>
            <Input
              id="available-locations"
              placeholder="e.g., Home, Office, Park (comma-separated)"
              value={availableLocations.join(', ')}
              onChange={(e) => setAvailableLocations(e.target.value.split(',').map(l => l.trim()).filter(Boolean))}
            />
          </div>

          <Button 
            onClick={handleGetSuggestions}
            disabled={getSuggestionsMutation.isPending || !taskTitle.trim()}
            className="w-full"
          >
            {getSuggestionsMutation.isPending ? 'Getting Suggestions...' : 'Get Location Suggestions'}
          </Button>
        </CardContent>
      </Card>

      {/* Suggestions Results */}
      {getSuggestionsMutation.data && (
        <Card>
          <CardHeader>
            <CardTitle>Suggested Locations</CardTitle>
            <CardDescription>
              Locations ranked by suitability for "{getSuggestionsMutation.data.taskTitle}"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getSuggestionsMutation.data.suggestions.map((suggestion: LocationSuggestion, index: number) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedLocation === suggestion.location 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleLocationSelect(suggestion.location)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{suggestion.location}</span>
                    </div>
                    <Badge className={getSuitabilityColor(suggestion.suitability)}>
                      {suggestion.suitability}
                    </Badge>
                  </div>

                  {suggestion.weather && (
                    <div className="flex items-center space-x-4 mb-2 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        {getWeatherIcon(suggestion.weather.condition)}
                        <span>{suggestion.weather.temperature}°F</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Thermometer className="w-3 h-3" />
                        <span>{suggestion.weather.humidity}% humidity</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Wind className="w-3 h-3" />
                        <span>{suggestion.weather.windSpeed} mph</span>
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground">{suggestion.reasoning}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
