import { Router } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import { weatherService } from '../services/weatherService'
import { locationService } from '../services/locationService'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { logger } from '../utils/logger'

const router = Router()
const prisma = new PrismaClient()

// Validation schemas
const updateLocationSchema = z.object({
  currentLocation: z.string().optional(),
  homeLocation: z.string().optional(),
  workLocation: z.string().optional()
})

const suggestLocationsSchema = z.object({
  taskTitle: z.string().min(1, 'Task title is required'),
  taskDescription: z.string().optional(),
  availableLocations: z.array(z.string()).optional()
})

// Update user locations
router.put('/update', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id
  const { currentLocation, homeLocation, workLocation } = updateLocationSchema.parse(req.body)

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      currentLocation,
      homeLocation,
      workLocation
    },
    select: {
      id: true,
      currentLocation: true,
      homeLocation: true,
      workLocation: true
    }
  })

  logger.info('User locations updated', { userId, locations: { currentLocation, homeLocation, workLocation } })

  res.json({
    success: true,
    data: updatedUser,
    message: 'Locations updated successfully'
  })
}))

// Test weather API
router.get('/weather/test', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const testWeather = await weatherService.getCurrentWeather('New York')
    res.json({
      success: true,
      data: testWeather,
      message: 'Weather API test successful'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Weather API test failed',
      details: error
    })
  }
}))

// Get current weather for user's location
router.get('/weather/current', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id
  const { location } = req.query

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentLocation: true, homeLocation: true, workLocation: true }
  })

  const targetLocation = (location as string) || user?.currentLocation || user?.homeLocation || 'New York'
  if (!targetLocation) {
    return res.status(400).json({
      success: false,
      error: 'No location specified and user has no default location set'
    })
  }

  const weather = await weatherService.getCurrentWeather(targetLocation)
  if (!weather) {
    return res.status(404).json({
      success: false,
      error: 'Weather data not available for this location'
    })
  }

  res.json({
    success: true,
    data: {
      weather,
      location: targetLocation,
      suggestions: weatherService.getWeatherBasedSuggestions(weather)
    },
    message: `Current weather for ${targetLocation}`
  })
}))

// Get weather forecast
router.get('/weather/forecast', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id
  const { location, days = '5' } = req.query

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentLocation: true, homeLocation: true, workLocation: true }
  })

  const targetLocation = (location as string) || user?.currentLocation || user?.homeLocation
  if (!targetLocation) {
    return res.status(400).json({
      success: false,
      error: 'No location specified and user has no default location set'
    })
  }

  const forecast = await weatherService.getWeatherForecast(targetLocation, parseInt(days as string))
  if (!forecast) {
    return res.status(404).json({
      success: false,
      error: 'Weather forecast not available for this location'
    })
  }

  res.json({
    success: true,
    data: {
      forecast,
      location: targetLocation,
      days: parseInt(days as string)
    },
    message: `${days}-day weather forecast for ${targetLocation}`
  })
}))

// Suggest optimal locations for a task
router.post('/suggest', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id
  const { taskTitle, taskDescription, availableLocations } = suggestLocationsSchema.parse(req.body)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentLocation: true, homeLocation: true, workLocation: true }
  })

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    })
  }

  const suggestions = await locationService.suggestOptimalLocations(
    taskTitle,
    taskDescription || '',
    {
      currentLocation: user.currentLocation || undefined,
      homeLocation: user.homeLocation || undefined,
      workLocation: user.workLocation || undefined
    },
    availableLocations
  )

  res.json({
    success: true,
    data: {
      suggestions,
      taskTitle,
      taskDescription
    },
    message: `Location suggestions for "${taskTitle}"`
  })
}))

// Get location-based task suggestions
router.get('/suggestions', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentLocation: true, homeLocation: true, workLocation: true }
  })

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    })
  }

  const suggestions = await locationService.getLocationBasedSuggestions({
    currentLocation: user.currentLocation || undefined,
    homeLocation: user.homeLocation || undefined,
    workLocation: user.workLocation || undefined
  })

  res.json({
    success: true,
    data: {
      suggestions,
      userLocations: {
        currentLocation: user.currentLocation,
        homeLocation: user.homeLocation,
        workLocation: user.workLocation
      }
    },
    message: 'Location-based suggestions'
  })
}))

// Get weather for events
router.post('/events/weather', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id
  const { events } = req.body

  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Events array is required'
    })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentLocation: true, homeLocation: true, workLocation: true }
  })

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    })
  }

  const eventsWithWeather = []

  for (const event of events) {
    try {
      const location = event.location || user.currentLocation || user.homeLocation
      if (!location) {
        eventsWithWeather.push({
          eventId: event.id,
          weather: null,
          error: 'No location available'
        })
        continue
      }

      const weather = await weatherService.getWeatherForTime(location, new Date(event.startTime))
      
      // Provide fallback weather data if API fails
      const fallbackWeather = {
        emoji: '🌤️', // Default weather emoji
        temperature: 72, // Default temperature
        condition: 'Unknown',
        description: 'Weather data unavailable'
      }
      
      eventsWithWeather.push({
        eventId: event.id,
        weather: weather ? {
          emoji: weather.emoji,
          temperature: weather.temperature,
          condition: weather.condition,
          description: weather.description
        } : fallbackWeather,
        error: weather ? null : 'Using fallback weather data'
      })
    } catch (error) {
      logger.error('Error getting weather for event', { error, eventId: event.id })
      eventsWithWeather.push({
        eventId: event.id,
        weather: {
          emoji: '🌤️',
          temperature: 72,
          condition: 'Unknown',
          description: 'Weather data unavailable'
        },
        error: 'Failed to get weather data'
      })
    }
  }

  res.json({
    success: true,
    data: {
      eventsWithWeather
    },
    message: `Weather data for ${events.length} events`
  })
}))

// Optimize task order by location
router.post('/optimize-tasks', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id
  const { taskIds } = req.body

  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Task IDs array is required'
    })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentLocation: true, homeLocation: true, workLocation: true }
  })

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    })
  }

  const tasks = await prisma.task.findMany({
    where: {
      id: { in: taskIds },
      userId: userId
    },
    select: {
      id: true,
      title: true,
      location: true,
      estimatedDuration: true
    }
  })

  if (tasks.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'No tasks found'
    })
  }

  const optimizedOrder = await locationService.optimizeTaskOrderByLocation(
    tasks,
    {
      currentLocation: user.currentLocation || undefined,
      homeLocation: user.homeLocation || undefined,
      workLocation: user.workLocation || undefined
    }
  )

  res.json({
    success: true,
    data: {
      optimizedOrder,
      totalTasks: tasks.length
    },
    message: `Optimized order for ${tasks.length} tasks based on location`
  })
}))

export default router
