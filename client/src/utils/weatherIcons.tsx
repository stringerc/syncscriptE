import React from 'react'

// Shared weather icon component - uses API-provided emojis with intelligent combining
export const getWeatherIcon = (condition: string, emoji?: string, eventTime?: Date) => {
  // Check if it's nighttime (between 6 PM and 6 AM) - use event time if provided
  const timeToCheck = eventTime || new Date()
  const currentHour = timeToCheck.getHours()
  const isNight = currentHour >= 18 || currentHour < 6
  
  // If we have an emoji from the API, process it to combine multiple emojis intelligently
  if (emoji) {
    let processedEmoji = emoji
    
    // Handle multiple emojis - use the primary weather condition emoji
    if (emoji.includes('🌙') && emoji.includes('☁️')) {
      processedEmoji = '☁️' // Cloudy night - use cloud emoji
    } else if (emoji.includes('🌙') && emoji.includes('🌧️')) {
      processedEmoji = '🌧️' // Rainy night - use rain emoji
    } else if (emoji.includes('🌙') && emoji.includes('⛈️')) {
      processedEmoji = '⛈️' // Stormy night - use storm emoji
    } else if (emoji.includes('🌙') && emoji.includes('❄️')) {
      processedEmoji = '❄️' // Snowy night - use snow emoji
    } else if (emoji.includes('🌙') && emoji.includes('🌫️')) {
      processedEmoji = '🌫️' // Foggy night - use fog emoji
    } else if (emoji.includes('🌙') && emoji.includes('☀️')) {
      processedEmoji = '☀️' // Sunny night (shouldn't happen, but fallback)
    } else if (emoji.includes('🌙')) {
      // For clear conditions with moon emoji, check if it's actually night
      if (condition?.toLowerCase().includes('clear') || condition?.toLowerCase().includes('sunny')) {
        processedEmoji = isNight ? '🌙' : '☀️'
      } else {
        processedEmoji = '🌙' // Just moon (clear night)
      }
    } else if (emoji.includes('☁️')) {
      processedEmoji = '☁️' // Just cloudy
    } else if (emoji.includes('☀️')) {
      // For clear conditions with sun emoji, check if it's actually day
      if (condition?.toLowerCase().includes('clear') || condition?.toLowerCase().includes('sunny')) {
        processedEmoji = isNight ? '🌙' : '☀️'
      } else {
        processedEmoji = '☀️' // Just sunny
      }
    } else if (emoji.includes('🌧️')) {
      processedEmoji = '🌧️' // Just rainy
    } else if (emoji.includes('⛈️')) {
      processedEmoji = '⛈️' // Just stormy
    } else if (emoji.includes('❄️')) {
      processedEmoji = '❄️' // Just snowy
    } else if (emoji.includes('🌫️')) {
      processedEmoji = '🌫️' // Just foggy
    }
    
    return (
      <div className="relative w-6 h-6 flex items-center justify-center text-lg">
        {processedEmoji}
      </div>
    )
  }
  
  // Fallback to condition-based emojis if no API emoji provided
  const conditionLower = condition?.toLowerCase() || ''
  
  if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
    // Check if it's nighttime (between 6 PM and 6 AM) - use event time if provided
    const timeToCheck = eventTime || new Date()
    const currentHour = timeToCheck.getHours()
    const isNight = currentHour >= 18 || currentHour < 6
    
    return (
      <div className="relative w-6 h-6 flex items-center justify-center text-lg">
        {isNight ? '🌙' : '☀️'}
      </div>
    )
  } else if (conditionLower.includes('mist') || conditionLower.includes('fog') || conditionLower.includes('haze') || conditionLower.includes('clouds')) {
    return (
      <div className="relative w-6 h-6 flex items-center justify-center text-lg">
        🌫️
      </div>
    )
  } else if (conditionLower.includes('cloud')) {
    return (
      <div className="relative w-6 h-6 flex items-center justify-center text-lg">
        ☁️
      </div>
    )
  } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
    return (
      <div className="relative w-6 h-6 flex items-center justify-center text-lg">
        🌧️
      </div>
    )
  } else if (conditionLower.includes('thunderstorm') || conditionLower.includes('storm')) {
    return (
      <div className="relative w-6 h-6 flex items-center justify-center text-lg">
        ⛈️
      </div>
    )
  } else if (conditionLower.includes('snow')) {
    return (
      <div className="relative w-6 h-6 flex items-center justify-center text-lg">
        ❄️
      </div>
    )
  } else if (conditionLower.includes('wind')) {
    return (
      <div className="relative w-6 h-6 flex items-center justify-center text-lg">
        💨
      </div>
    )
  } else {
    // Default sunny weather
    return (
      <div className="relative w-6 h-6 flex items-center justify-center text-lg">
        ☀️
      </div>
    )
  }
}