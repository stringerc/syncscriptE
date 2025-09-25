import axios from 'axios'
import { logger } from '../utils/logger'

interface WeatherData {
  temperature: number
  condition: string
  description: string
  humidity: number
  windSpeed: number
  location: string
  timestamp: Date
  emoji?: string
}

interface LocationData {
  city: string
  country: string
  latitude: number
  longitude: number
}

class WeatherService {
  private apiKey: string
  private baseUrl = 'https://api.openweathermap.org/data/2.5'

  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || ''
    if (!this.apiKey) {
      logger.warn('OpenWeather API key not configured')
    }
  }

  /**
   * Get current weather for a location
   */
  async getCurrentWeather(location: string): Promise<WeatherData | null> {
    if (!this.apiKey) {
      logger.error('OpenWeather API key not configured')
      return null
    }

    try {
      // First, get coordinates for the location
      const coords = await this.getLocationCoordinates(location)
      if (!coords) {
        logger.error('Could not get coordinates for location', { location })
        return null
      }

      // Get weather data
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          lat: coords.latitude,
          lon: coords.longitude,
          appid: this.apiKey,
          units: 'imperial' // Use Fahrenheit
        }
      })

      const data = response.data
      return {
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        location: `${data.name}, ${data.sys.country}`,
        timestamp: new Date(),
        emoji: this.getWeatherEmoji(data.weather[0].main)
      }
    } catch (error) {
      logger.error('Failed to get weather data', { error, location })
      return null
    }
  }

  /**
   * Get weather emoji based on condition
   */
  getWeatherEmoji(condition: string): string {
    const conditionLower = condition.toLowerCase()
    
    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
      return '☀️'
    } else if (conditionLower.includes('cloud')) {
      return '☁️'
    } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
      return '🌧️'
    } else if (conditionLower.includes('thunderstorm') || conditionLower.includes('storm')) {
      return '⛈️'
    } else if (conditionLower.includes('snow')) {
      return '❄️'
    } else if (conditionLower.includes('mist') || conditionLower.includes('fog')) {
      return '🌫️'
    } else if (conditionLower.includes('wind')) {
      return '💨'
    } else {
      return '🌤️'
    }
  }

  /**
   * Get weather for a specific time and location
   */
  async getWeatherForTime(location: string, targetTime: Date): Promise<WeatherData | null> {
    logger.info('Getting weather for time', { location, targetTime })
    
    if (!this.apiKey) {
      logger.error('OpenWeather API key not configured')
      return null
    }

    try {
      // Try to get coordinates for the location
      const coords = await this.getLocationCoordinates(location)
      if (!coords) {
        logger.error('Could not get coordinates for location', { location })
        return null
      }

      // Get forecast data
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          lat: coords.latitude,
          lon: coords.longitude,
          appid: this.apiKey,
          units: 'imperial'
        }
      })

      // Find the closest forecast to the target time
      const forecasts = response.data.list
      const targetTimestamp = targetTime.getTime()
      
      let closestForecast = forecasts[0]
      let minDiff = Math.abs(new Date(closestForecast.dt * 1000).getTime() - targetTimestamp)
      
      for (const forecast of forecasts) {
        const forecastTime = new Date(forecast.dt * 1000).getTime()
        const diff = Math.abs(forecastTime - targetTimestamp)
        
        if (diff < minDiff) {
          minDiff = diff
          closestForecast = forecast
        }
      }

      const weather = {
        temperature: Math.round(closestForecast.main.temp),
        condition: closestForecast.weather[0].main,
        description: closestForecast.weather[0].description,
        humidity: closestForecast.main.humidity,
        windSpeed: closestForecast.wind.speed,
        location: `${response.data.city.name}, ${response.data.city.country}`,
        timestamp: new Date(closestForecast.dt * 1000),
        emoji: this.getWeatherEmoji(closestForecast.weather[0].main)
      }

      logger.info('Successfully got weather data', { 
        location, 
        condition: weather.condition, 
        emoji: weather.emoji,
        temperature: weather.temperature 
      })

      return weather
    } catch (error) {
      logger.error('Failed to get weather for specific time', { error, location, targetTime })
      return null
    }
  }

  /**
   * Get weather forecast for a location
   */
  async getWeatherForecast(location: string, days: number = 5): Promise<WeatherData[] | null> {
    if (!this.apiKey) {
      logger.error('OpenWeather API key not configured')
      return null
    }

    try {
      const coords = await this.getLocationCoordinates(location)
      if (!coords) {
        logger.error('Could not get coordinates for location', { location })
        return null
      }

      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          lat: coords.latitude,
          lon: coords.longitude,
          appid: this.apiKey,
          units: 'imperial',
          cnt: days * 8 // 8 forecasts per day (every 3 hours)
        }
      })

      const forecasts = response.data.list.map((item: any) => ({
        temperature: Math.round(item.main.temp),
        condition: item.weather[0].main,
        description: item.weather[0].description,
        humidity: item.main.humidity,
        windSpeed: item.wind.speed,
        location: `${response.data.city.name}, ${response.data.city.country}`,
        timestamp: new Date(item.dt * 1000),
        emoji: this.getWeatherEmoji(item.weather[0].main)
      }))

      return forecasts
    } catch (error) {
      logger.error('Failed to get weather forecast', { error, location })
      return null
    }
  }

  /**
   * Get coordinates for a location string
   */
  private async getLocationCoordinates(location: string): Promise<LocationData | null> {
    try {
      // Try different location formats
      const locationVariations = [
        location,
        location.split(',')[0], // Just the city part
        location.replace(/[0-9]/g, '').trim(), // Remove numbers (addresses)
        location.split(' ')[0] // Just first word
      ].filter(Boolean)

      for (const loc of locationVariations) {
        try {
          const response = await axios.get(`${this.baseUrl}/weather`, {
            params: {
              q: loc,
              appid: this.apiKey
            }
          })

          return {
            city: response.data.name,
            country: response.data.sys.country,
            latitude: response.data.coord.lat,
            longitude: response.data.coord.lon
          }
        } catch (err) {
          // Try next variation
          continue
        }
      }

      // If all variations fail, try a default city
      logger.warn('All location variations failed, trying default city', { location })
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          q: 'New York',
          appid: this.apiKey
        }
      })

      return {
        city: response.data.name,
        country: response.data.sys.country,
        latitude: response.data.coord.lat,
        longitude: response.data.coord.lon
      }
    } catch (error) {
      logger.error('Failed to get location coordinates', { error, location })
      return null
    }
  }

  /**
   * Check if weather is suitable for outdoor activities
   */
  isWeatherSuitableForOutdoor(weather: WeatherData): boolean {
    const unsuitableConditions = ['Rain', 'Snow', 'Thunderstorm', 'Drizzle', 'Mist', 'Fog']
    const unsuitableConditionsLower = unsuitableConditions.map(c => c.toLowerCase())
    
    return !unsuitableConditionsLower.includes(weather.condition.toLowerCase()) &&
           weather.temperature >= 32 && // Above freezing
           weather.temperature <= 95 && // Below dangerous heat
           weather.windSpeed <= 25 // Not too windy
  }

  /**
   * Get weather-based task suggestions
   */
  getWeatherBasedSuggestions(weather: WeatherData): string[] {
    const suggestions: string[] = []

    if (this.isWeatherSuitableForOutdoor(weather)) {
      if (weather.temperature >= 70 && weather.temperature <= 85) {
        suggestions.push('Perfect weather for outdoor activities!')
        suggestions.push('Great day for walking, running, or outdoor meetings')
      } else if (weather.temperature < 50) {
        suggestions.push('Cool weather - consider indoor activities or bundle up for outdoor tasks')
      } else if (weather.temperature > 85) {
        suggestions.push('Hot weather - stay hydrated and consider indoor activities during peak heat')
      }
    } else {
      suggestions.push('Weather not ideal for outdoor activities')
      suggestions.push('Consider indoor tasks or reschedule outdoor activities')
    }

    if (weather.condition.toLowerCase().includes('rain')) {
      suggestions.push('Rainy day - perfect for indoor productivity tasks')
      suggestions.push('Consider catching up on reading, planning, or administrative work')
    }

    if (weather.windSpeed > 15) {
      suggestions.push('Windy conditions - avoid outdoor activities that require precision')
    }

    return suggestions
  }

  /**
   * Get location-based travel time estimate (mock implementation)
   * In a real implementation, you'd use Google Maps API or similar
   */
  async getTravelTime(fromLocation: string, toLocation: string): Promise<number | null> {
    // Mock implementation - in reality you'd use Google Maps API
    // For now, return a random estimate based on location similarity
    if (fromLocation.toLowerCase().includes(toLocation.toLowerCase()) || 
        toLocation.toLowerCase().includes(fromLocation.toLowerCase())) {
      return 15 // Same area
    }
    
    return 45 // Different areas - 45 minutes average
  }
}

export const weatherService = new WeatherService()
export { WeatherData, LocationData }
