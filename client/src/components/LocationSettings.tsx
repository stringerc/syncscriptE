import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MapPin, Home, Briefcase, Navigation } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface LocationData {
  currentLocation?: string
  homeLocation?: string
  workLocation?: string
}

interface WeatherData {
  temperature: number
  condition: string
  description: string
  humidity: number
  windSpeed: number
  location: string
  timestamp: string
}

export function LocationSettings() {
  const [locations, setLocations] = useState<LocationData>({})
  const queryClient = useQueryClient()

  // Fetch user locations
  const { data: userData } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await api.get('/user/profile')
      return response.data.data
    }
  })

  // Fetch current weather
  const { data: weatherData, isLoading: weatherLoading } = useQuery({
    queryKey: ['weather-current', locations.currentLocation],
    queryFn: async () => {
      const response = await api.get('/location/weather/current', {
        params: { location: locations.currentLocation }
      })
      return response.data.data
    },
    enabled: !!locations.currentLocation
  })

  // Update locations mutation
  const updateLocationsMutation = useMutation({
    mutationFn: async (locationData: LocationData) => {
      const response = await api.put('/location/update', locationData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      toast({
        title: "Locations Updated",
        description: "Your location preferences have been saved successfully."
      })
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.response?.data?.error || "Failed to update locations",
        variant: "destructive"
      })
    }
  })

  // Get location suggestions mutation
  const getSuggestionsMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get('/location/suggestions')
      return response.data.data
    },
    onSuccess: (data) => {
      toast({
        title: "Location Suggestions",
        description: data.suggestions.join(' • ')
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to get suggestions",
        variant: "destructive"
      })
    }
  })

  const handleLocationChange = (field: keyof LocationData, value: string) => {
    setLocations(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveLocations = () => {
    updateLocationsMutation.mutate(locations)
  }

  const handleGetSuggestions = () => {
    getSuggestionsMutation.mutate()
  }

  // Initialize locations from user data
  React.useEffect(() => {
    if (userData) {
      setLocations({
        currentLocation: userData.currentLocation || '',
        homeLocation: userData.homeLocation || '',
        workLocation: userData.workLocation || ''
      })
    }
  }, [userData])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Location Settings</span>
          </CardTitle>
          <CardDescription>
            Set your locations to get weather-aware task suggestions and location-based planning.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current-location" className="flex items-center space-x-2">
                <Navigation className="w-4 h-4" />
                <span>Current Location</span>
              </Label>
              <Input
                id="current-location"
                placeholder="e.g., New York, NY"
                value={locations.currentLocation || ''}
                onChange={(e) => handleLocationChange('currentLocation', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="home-location" className="flex items-center space-x-2">
                <Home className="w-4 h-4" />
                <span>Home Location</span>
              </Label>
              <Input
                id="home-location"
                placeholder="e.g., Brooklyn, NY"
                value={locations.homeLocation || ''}
                onChange={(e) => handleLocationChange('homeLocation', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="work-location" className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4" />
                <span>Work Location</span>
              </Label>
              <Input
                id="work-location"
                placeholder="e.g., Manhattan, NY"
                value={locations.workLocation || ''}
                onChange={(e) => handleLocationChange('workLocation', e.target.value)}
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <Button 
              onClick={handleSaveLocations}
              disabled={updateLocationsMutation.isPending}
            >
              {updateLocationsMutation.isPending ? 'Saving...' : 'Save Locations'}
            </Button>
            <Button 
              variant="outline"
              onClick={handleGetSuggestions}
              disabled={getSuggestionsMutation.isPending}
            >
              {getSuggestionsMutation.isPending ? 'Loading...' : 'Get Suggestions'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weather Display */}
      {weatherData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Current Weather</span>
            </CardTitle>
            <CardDescription>
              Weather conditions for {weatherData.location}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weatherLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{weatherData.weather.temperature}°F</div>
                    <div className="text-lg text-muted-foreground capitalize">
                      {weatherData.weather.description}
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>Humidity: {weatherData.weather.humidity}%</div>
                    <div>Wind: {weatherData.weather.windSpeed} mph</div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Weather-Based Suggestions:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {weatherData.suggestions.map((suggestion: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-primary">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
