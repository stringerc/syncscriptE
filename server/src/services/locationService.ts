import { logger } from '../utils/logger'
import { weatherService, WeatherData } from './weatherService'

interface LocationSuggestion {
  location: string
  weather?: WeatherData
  travelTime?: number
  suitability: 'excellent' | 'good' | 'fair' | 'poor'
  reasoning: string
}

class LocationService {
  /**
   * Suggest optimal locations for tasks based on weather and user preferences
   */
  async suggestOptimalLocations(
    taskTitle: string,
    taskDescription: string,
    userLocations: {
      currentLocation?: string
      homeLocation?: string
      workLocation?: string
    },
    availableLocations: string[] = []
  ): Promise<LocationSuggestion[]> {
    const suggestions: LocationSuggestion[] = []
    
    // Default locations if none provided
    const defaultLocations = [
      userLocations.homeLocation || 'Home',
      userLocations.workLocation || 'Office',
      userLocations.currentLocation || 'Current Location'
    ].filter(Boolean)

    const locations = availableLocations.length > 0 ? availableLocations : defaultLocations

    for (const location of locations) {
      try {
        const weather = await weatherService.getCurrentWeather(location)
        const suitability = this.assessLocationSuitability(taskTitle, taskDescription, location, weather)
        
        suggestions.push({
          location,
          weather,
          suitability: suitability.level,
          reasoning: suitability.reasoning
        })
      } catch (error) {
        logger.error('Error assessing location', { error, location })
        suggestions.push({
          location,
          suitability: 'fair',
          reasoning: 'Unable to assess weather conditions for this location'
        })
      }
    }

    // Sort by suitability
    return suggestions.sort((a, b) => {
      const order = { excellent: 4, good: 3, fair: 2, poor: 1 }
      return order[b.suitability] - order[a.suitability]
    })
  }

  /**
   * Assess how suitable a location is for a specific task
   */
  private assessLocationSuitability(
    taskTitle: string,
    taskDescription: string,
    location: string,
    weather?: WeatherData
  ): { level: 'excellent' | 'good' | 'fair' | 'poor', reasoning: string } {
    const taskText = `${taskTitle} ${taskDescription || ''}`.toLowerCase()
    
    // Check if task requires outdoor activities
    const outdoorKeywords = ['walk', 'run', 'exercise', 'outdoor', 'park', 'garden', 'hiking', 'cycling', 'sports']
    const isOutdoorTask = outdoorKeywords.some(keyword => taskText.includes(keyword))
    
    // Check if task requires indoor activities
    const indoorKeywords = ['work', 'meeting', 'study', 'read', 'write', 'computer', 'office', 'home', 'indoor']
    const isIndoorTask = indoorKeywords.some(keyword => taskText.includes(keyword))

    if (isOutdoorTask && weather) {
      if (weatherService.isWeatherSuitableForOutdoor(weather)) {
        if (weather.temperature >= 65 && weather.temperature <= 80) {
          return {
            level: 'excellent',
            reasoning: `Perfect weather for outdoor activities: ${weather.temperature}°F, ${weather.description}`
          }
        } else {
          return {
            level: 'good',
            reasoning: `Good weather for outdoor activities: ${weather.temperature}°F, ${weather.description}`
          }
        }
      } else {
        return {
          level: 'poor',
          reasoning: `Weather not suitable for outdoor activities: ${weather.temperature}°F, ${weather.description}`
        }
      }
    }

    if (isIndoorTask) {
      if (weather && !weatherService.isWeatherSuitableForOutdoor(weather)) {
        return {
          level: 'excellent',
          reasoning: `Perfect for indoor activities - weather is ${weather.description}`
        }
      } else {
        return {
          level: 'good',
          reasoning: 'Good location for indoor activities'
        }
      }
    }

    // Default assessment
    if (weather) {
      return {
        level: 'good',
        reasoning: `Weather conditions: ${weather.temperature}°F, ${weather.description}`
      }
    }

    return {
      level: 'fair',
      reasoning: 'Location assessment unavailable'
    }
  }

  /**
   * Get location-based task suggestions
   */
  async getLocationBasedSuggestions(
    userLocations: {
      currentLocation?: string
      homeLocation?: string
      workLocation?: string
    }
  ): Promise<string[]> {
    const suggestions: string[] = []
    
    try {
      // Get weather for current location
      const currentWeather = userLocations.currentLocation 
        ? await weatherService.getCurrentWeather(userLocations.currentLocation)
        : null

      if (currentWeather) {
        const weatherSuggestions = weatherService.getWeatherBasedSuggestions(currentWeather)
        suggestions.push(...weatherSuggestions)
      }

      // Add location-specific suggestions
      if (userLocations.homeLocation && userLocations.workLocation) {
        suggestions.push('Consider grouping tasks by location to minimize travel time')
        suggestions.push('Plan your day to optimize travel between home and work')
      }

      if (userLocations.currentLocation) {
        suggestions.push(`Current location: ${userLocations.currentLocation}`)
      }

    } catch (error) {
      logger.error('Error getting location-based suggestions', { error })
    }

    return suggestions
  }

  /**
   * Calculate optimal task ordering based on location
   */
  async optimizeTaskOrderByLocation(
    tasks: Array<{ id: string, title: string, location?: string, estimatedDuration?: number }>,
    userLocations: {
      currentLocation?: string
      homeLocation?: string
      workLocation?: string
    }
  ): Promise<Array<{ taskId: string, suggestedOrder: number, reasoning: string }>> {
    const optimizedTasks = []

    // Group tasks by location
    const tasksByLocation = tasks.reduce((acc, task) => {
      const location = task.location || 'Unknown'
      if (!acc[location]) acc[location] = []
      acc[location].push(task)
      return acc
    }, {} as Record<string, typeof tasks>)

    let order = 1
    const results = []

    // Prioritize locations based on user preferences
    const locationPriority = [
      userLocations.currentLocation,
      userLocations.homeLocation,
      userLocations.workLocation
    ].filter(Boolean)

    // Process tasks by location priority
    for (const location of locationPriority) {
      if (tasksByLocation[location]) {
        for (const task of tasksByLocation[location]) {
          results.push({
            taskId: task.id,
            suggestedOrder: order++,
            reasoning: `Grouped with other tasks at ${location}`
          })
        }
      }
    }

    // Process remaining tasks
    for (const [location, locationTasks] of Object.entries(tasksByLocation)) {
      if (!locationPriority.includes(location)) {
        for (const task of locationTasks) {
          results.push({
            taskId: task.id,
            suggestedOrder: order++,
            reasoning: `Task at ${location}`
          })
        }
      }
    }

    return results
  }
}

export const locationService = new LocationService()
export { LocationSuggestion }
