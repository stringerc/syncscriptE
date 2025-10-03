// Timezone utilities for location-based timezone detection

export interface TimezoneInfo {
  timezone: string
  offset: string
  name: string
}

// Get timezone from coordinates using browser's Intl API
export const getTimezoneFromCoordinates = async (lat: number, lon: number): Promise<TimezoneInfo | null> => {
  try {
    // Use the browser's built-in timezone detection
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    
    // Get timezone offset
    const now = new Date()
    const offset = now.getTimezoneOffset()
    const offsetHours = Math.abs(offset) / 60
    const offsetSign = offset <= 0 ? '+' : '-'
    const offsetString = `UTC${offsetSign}${offsetHours.toString().padStart(2, '0')}:00`
    
    return {
      timezone,
      offset: offsetString,
      name: timezone
    }
  } catch (error) {
    console.error('Error detecting timezone:', error)
    return null
  }
}

// Alternative: Use a timezone API service (more accurate for coordinates)
export const getTimezoneFromCoordinatesAPI = async (lat: number, lon: number): Promise<TimezoneInfo | null> => {
  try {
    // Using timezone API service
    const response = await fetch(`https://api.timezonedb.com/v2.1/get-time-zone?key=demo&format=json&by=position&lat=${lat}&lng=${lon}`)
    
    if (!response.ok) {
      throw new Error('Timezone API request failed')
    }
    
    const data = await response.json()
    
    if (data.status === 'OK') {
      return {
        timezone: data.zoneName,
        offset: data.gmtOffset,
        name: data.zoneName
      }
    }
    
    return null
  } catch (error) {
    console.error('Error fetching timezone from API:', error)
    // Fallback to browser detection
    return getTimezoneFromCoordinates(lat, lon)
  }
}

// Get timezone from user's current location
export const getCurrentTimezone = async (): Promise<TimezoneInfo | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const timezoneInfo = await getTimezoneFromCoordinates(latitude, longitude)
        resolve(timezoneInfo)
      },
      (error) => {
        console.error('Error getting location for timezone:', error)
        // Fallback to browser's timezone
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        resolve({
          timezone,
          offset: 'UTC+00:00',
          name: timezone
        })
      }
    )
  })
}

// Format timezone for display
export const formatTimezone = (timezone: string): string => {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'longOffset'
    })
    
    const parts = formatter.formatToParts(now)
    const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value || timezone
    
    return `${timezone} (${timeZoneName})`
  } catch (error) {
    return timezone
  }
}
