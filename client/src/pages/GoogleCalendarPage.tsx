import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, ExternalLink, RefreshCw, Trash2, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'

interface GoogleCalendarIntegration {
  id: string
  createdAt: string
  expiresAt?: string
}

interface GoogleCalendarStatus {
  connected: boolean
  integration?: GoogleCalendarIntegration
}

interface GoogleCalendar {
  id: string
  summary: string
  description?: string
  primary?: boolean
  accessRole: string
}

interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
  }
  end: {
    dateTime?: string
    date?: string
  }
  location?: string
}

export function GoogleCalendarPage() {
  console.log('🚀 GoogleCalendarPage: Component loaded');
  
  const [authUrl, setAuthUrl] = useState<string>('')
  const [selectedCalendar, setSelectedCalendar] = useState<string>('primary')
  const [syncDirection, setSyncDirection] = useState<'from_google' | 'to_google' | 'bidirectional'>('from_google')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [timeRange, setTimeRange] = useState<'3months' | '6months' | '1year' | '2years'>('1year')
  const [showPastEvents, setShowPastEvents] = useState(false)
  const [recentlySyncedEvents, setRecentlySyncedEvents] = useState<any[]>([])
  const [showHolidays, setShowHolidays] = useState(true)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user, token } = useAuthStore()

  // Helper function to calculate time range
  const getTimeRange = (range: string, includePast = false) => {
    const now = new Date()
    const timeMin = includePast ? new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString() : now.toISOString() // Include past year if needed
    
    let timeMax: Date
    switch (range) {
      case '3months':
        timeMax = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // 3 months
        break
      case '6months':
        timeMax = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000) // 6 months
        break
      case '1year':
        timeMax = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 year
        break
      case '2years':
        timeMax = new Date(now.getTime() + 730 * 24 * 60 * 60 * 1000) // 2 years
        break
      default:
        timeMax = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 year default
    }
    
    return { timeMin, timeMax: timeMax.toISOString() }
  }

  // Fetch user profile to get holiday preference
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await api.get('/user/profile')
      return response.data.data
    },
    enabled: !!user && !!token,
    retry: false,
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      if (data.showHolidays !== undefined) {
        setShowHolidays(data.showHolidays)
      }
    }
  })

  // Fetch Google Calendar integration status
  const { data: statusData, isLoading: statusLoading, error: statusError } = useQuery<GoogleCalendarStatus>({
    queryKey: ['google-calendar-status'],
    queryFn: async () => {
      const response = await api.get('/google-calendar/status')
      return response.data.data
    },
    enabled: !!user && !!token,
    retry: false,
    refetchOnWindowFocus: false
  })

  // Fetch Google Calendar auth URL
  const { data: authData, isLoading: authLoading, error: authError } = useQuery({
    queryKey: ['google-calendar-auth-url'],
    queryFn: async () => {
      const response = await api.get('/google-calendar/auth-url')
      return response.data.data.authUrl
    },
    enabled: !!user && !!token && !statusData?.connected && !statusError,
    retry: false,
    refetchOnWindowFocus: false
  })

  // Fetch Google Calendar calendars
  const { data: calendarsData, isLoading: calendarsLoading, error: calendarsError } = useQuery<GoogleCalendar[]>({
    queryKey: ['google-calendar-calendars'],
    queryFn: async () => {
      const response = await api.get('/google-calendar/calendars')
      return response.data.data
    },
    enabled: !!user && !!token && statusData?.connected && !statusError,
    retry: false,
    refetchOnWindowFocus: false
  })

  // Fetch Google Calendar events from all calendars
  const { data: eventsData, isLoading: eventsLoading, refetch: refetchEvents, error: eventsError } = useQuery<GoogleCalendarEvent[]>({
    queryKey: ['google-calendar-events-all'],
    queryFn: async () => {
      const allEvents = []
      const { timeMin, timeMax } = getTimeRange(timeRange, true) // Get time range including past events
      
      // Only get events from local database (synced events)
      try {
        const localEventsResponse = await api.get(`/calendar?includePast=true`)
        const localEvents = localEventsResponse.data.events || []
        
        // Add local events with proper formatting
        allEvents.push(...localEvents.map(event => ({
          id: event.id,
          title: event.title,
          start: {
            dateTime: event.startTime,
            date: event.startTime.split('T')[0] // Extract date part for all-day events
          },
          end: {
            dateTime: event.endTime,
            date: event.endTime.split('T')[0]
          },
          calendarId: event.calendarProvider === 'google' ? 'google' : 'local',
          description: event.description,
          location: event.location
        })))
        
        console.log('🎉 Added local events:', localEvents.length, 'events')
        console.log('🎉 Local events details:', localEvents.map(event => ({ 
          title: event.title, 
          startTime: event.startTime,
          isFuture: new Date(event.startTime) >= new Date(),
          calendarProvider: event.calendarProvider
        })))
        console.log('🎉 Google Calendar Events Query - Raw API Response:', localEventsResponse.data)
        console.log('🎉 Google Calendar Events Query - Events Array:', localEvents)
        console.log('🎉 Google Calendar Events Query - Google Events:', localEvents.filter(e => e.calendarProvider === 'google'))
      } catch (error) {
        console.error('❌ Error fetching local events:', error)
      }
      
      // Sort events by start time
      const sortedEvents = allEvents.sort((a, b) => {
        const aTime = a.start?.dateTime || a.start?.date
        const bTime = b.start?.dateTime || b.start?.date
        return new Date(aTime).getTime() - new Date(bTime).getTime()
      })
      
      // Remove duplicates based on title and start time
      const uniqueEvents = sortedEvents.filter((event, index, array) => {
        return array.findIndex(e => {
          // Compare title (case insensitive)
          const titleMatch = e.title?.toLowerCase() === event.title?.toLowerCase()
          
          // Compare start time (handle both dateTime and date formats)
          const eventStartTime = event.start?.dateTime || event.start?.date
          const eStartTime = e.start?.dateTime || e.start?.date
          const timeMatch = eventStartTime === eStartTime
          
          return titleMatch && timeMatch
        }) === index
      })
      
      console.log('🎉 All events combined and sorted:', sortedEvents.length, 'events')
      console.log('🎉 Event details for debugging:')
      sortedEvents.forEach((event, index) => {
        console.log(`  ${index}: "${event.title}" - ${event.start?.dateTime || event.start?.date}`)
      })
      
      console.log('🎉 Unique events after deduplication:', uniqueEvents.length, 'events')
      console.log('🎉 Removed', sortedEvents.length - uniqueEvents.length, 'duplicates')
      return uniqueEvents
    },
    enabled: !!user && !!token,
    retry: false,
    refetchOnWindowFocus: false,
    onSuccess: () => {
      setLastUpdated(new Date())
    }
  })

  // Connect Google Calendar mutation
  const connectMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await api.post('/google-calendar/auth/callback', { code })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-status'] })
      queryClient.invalidateQueries({ queryKey: ['google-calendar-calendars'] })
      toast({
        title: "Success!",
        description: "Google Calendar connected successfully."
      })
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.response?.data?.error || "Failed to connect Google Calendar",
        variant: "destructive"
      })
    }
  })

  // Disconnect Google Calendar mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete('/google-calendar/disconnect')
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-status'] })
      queryClient.invalidateQueries({ queryKey: ['google-calendar-calendars'] })
      queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] })
      toast({
        title: "Disconnected",
        description: "Google Calendar has been disconnected."
      })
    },
    onError: (error: any) => {
      toast({
        title: "Disconnection Failed",
        description: error.response?.data?.error || "Failed to disconnect Google Calendar",
        variant: "destructive"
      })
    }
  })

  // Sync events mutation
  const syncMutation = useMutation({
    mutationFn: async ({ calendarId, direction }: { calendarId: string; direction: string }) => {
      const response = await api.post('/google-calendar/sync', { calendarId, direction })
      return response.data
    },
    onSuccess: (data) => {
      // Store recently synced events for display
      const syncedEvents = [
        ...(data.data.createdEvents || []),
        ...(data.data.updatedEvents || [])
      ]
      setRecentlySyncedEvents(syncedEvents)
      
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] })
      queryClient.invalidateQueries({ queryKey: ['google-calendar-events-all'] })
      queryClient.refetchQueries({ queryKey: ['google-calendar-events-all'] })
      toast({
        title: "Sync Complete",
        description: `Synced ${data.data.stats.created} new events, updated ${data.data.stats.updated} events.`
      })
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.response?.data?.error || "Failed to sync calendar",
        variant: "destructive"
      })
    }
  })

  // Subscribe to holiday calendar mutation
  const subscribeHolidayMutation = useMutation({
    mutationFn: async (calendarId: string) => {
      const response = await api.post('/google-calendar/subscribe-holiday', { calendarId })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-calendars'] })
      toast({
        title: "Success!",
        description: "Holiday calendar subscribed successfully."
      })
    },
    onError: (error: any) => {
      toast({
        title: "Subscription Failed",
        description: error.response?.data?.error || "Failed to subscribe to holiday calendar",
        variant: "destructive"
      })
    }
  })

  // Refresh tokens mutation
  const refreshTokensMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/google-calendar/refresh-tokens')
      return response.data
    },
    onSuccess: () => {
      toast({
        title: "Tokens Refreshed",
        description: "Google Calendar tokens have been refreshed successfully."
      })
    },
    onError: (error: any) => {
      toast({
        title: "Token Refresh Failed",
        description: error.response?.data?.error || "Failed to refresh tokens",
        variant: "destructive"
      })
    }
  })

  useEffect(() => {
    if (authData) {
      setAuthUrl(authData)
    }
  }, [authData])

  // Debug logging
  useEffect(() => {
    console.log('🔍 GoogleCalendarPage Debug:', {
      user: !!user,
      token: !!token,
      statusLoading,
      statusError,
      statusData,
      connected: statusData?.connected,
      calendarsData: calendarsData?.length || 0
    })
  }, [user, token, statusLoading, statusError, statusData, calendarsData])

  const handleConnect = () => {
    if (authUrl) {
      window.open(authUrl, '_blank', 'width=500,height=600')
    }
  }

  const handleSync = () => {
    syncMutation.mutate({
      calendarId: selectedCalendar,
      direction: syncDirection
    })
  }

  // Update holiday preference when toggle changes
  const updateHolidayPreference = async (showHolidays: boolean) => {
    try {
      await api.put('/user/profile', { showHolidays })
      setShowHolidays(showHolidays)
      
      // Invalidate calendar queries to update dashboard
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['user-dashboard'] })
      
      toast({
        title: "Preference Updated",
        description: `Holiday events ${showHolidays ? 'enabled' : 'disabled'}`
      })
    } catch (error) {
      console.error('Failed to update holiday preference:', error)
      toast({
        title: "Update Failed",
        description: "Failed to update holiday preference",
        variant: "destructive"
      })
    }
  }

  const formatDateTime = (dateTime?: string, date?: string) => {
    if (dateTime) {
      return new Date(dateTime).toLocaleString()
    } else if (date) {
      return new Date(date).toLocaleDateString()
    }
    return 'No time specified'
  }

  const isAllDay = (event: GoogleCalendarEvent) => {
    return !event.start.dateTime && !event.end.dateTime
  }

  // Check if user is authenticated
  if (!user || !token) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Google Calendar Integration</h1>
            <p className="text-muted-foreground">
              Connect and sync your Google Calendar with SyncScript
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-medium text-yellow-900 mb-2">Authentication Required</h3>
            <p className="text-yellow-700 mb-4">
              Please log in to access Google Calendar integration.
            </p>
            <Button 
              onClick={() => window.location.href = '/auth'}
              variant="outline"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (statusError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Google Calendar Integration</h1>
            <p className="text-muted-foreground">
              Connect and sync your Google Calendar with SyncScript
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-red-900 mb-2">Connection Error</h3>
            <p className="text-red-700 mb-4">
              Unable to connect to Google Calendar service. Please check your authentication.
            </p>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Retry Connection
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Google Calendar Integration</h1>
          <p className="text-muted-foreground">
            Connect and sync your Google Calendar with SyncScript
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-8 h-8 text-primary" />
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Connection Status</span>
            {statusData?.connected && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                Connected
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {statusData?.connected 
              ? "Your Google Calendar is connected and ready to sync"
              : "Connect your Google Calendar to enable synchronization"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!statusData?.connected || statusData === undefined ? (
            <div className="space-y-4">
              <Button 
                onClick={handleConnect}
                disabled={authLoading || !authUrl}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {authLoading ? 'Generating Auth URL...' : 'Connect Google Calendar'}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                You'll be redirected to Google to authorize SyncScript access to your calendar
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Last updated</p>
                  <p className="text-sm text-muted-foreground">
                    {lastUpdated ? lastUpdated.toLocaleString() : 'Never'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      refreshTokensMutation.mutate()
                      setLastUpdated(new Date())
                    }}
                    disabled={refreshTokensMutation.isPending}
                    title="Refresh authentication tokens to ensure continued access to Google Calendar"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Tokens
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => disconnectMutation.mutate()}
                    disabled={disconnectMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Holiday Calendar Subscription - Always Visible for Debugging */}
      <Card className="border-2 border-green-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Holiday Calendars</span>
            <Badge variant="secondary" className="ml-2">ALWAYS VISIBLE</Badge>
          </CardTitle>
            <CardDescription>
              Subscribe to holiday calendars to automatically import holidays into your calendar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">US Holidays</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Major holidays and observances (conflicts with US Official Holidays)
                </p>
                <Button
                  onClick={() => subscribeHolidayMutation.mutate('en.usa#holiday@group.v.calendar.google.com')}
                  disabled={subscribeHolidayMutation.isPending || calendarsData?.some(cal => cal.id === 'en.usa#holiday@group.v.calendar.google.com') || calendarsData?.some(cal => cal.id === 'en.usa.official#holiday@group.v.calendar.google.com')}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {calendarsData?.some(cal => cal.id === 'en.usa#holiday@group.v.calendar.google.com') ? 'Subscribed' : 
                   calendarsData?.some(cal => cal.id === 'en.usa.official#holiday@group.v.calendar.google.com') ? 'Disabled (conflict)' : 'Subscribe'}
                </Button>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">US Official Holidays</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Official federal holidays only (conflicts with US Holidays)
                </p>
                <Button
                  onClick={() => subscribeHolidayMutation.mutate('en.usa.official#holiday@group.v.calendar.google.com')}
                  disabled={subscribeHolidayMutation.isPending || calendarsData?.some(cal => cal.id === 'en.usa.official#holiday@group.v.calendar.google.com') || calendarsData?.some(cal => cal.id === 'en.usa#holiday@group.v.calendar.google.com')}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {calendarsData?.some(cal => cal.id === 'en.usa.official#holiday@group.v.calendar.google.com') ? 'Subscribed' : 
                   calendarsData?.some(cal => cal.id === 'en.usa#holiday@group.v.calendar.google.com') ? 'Disabled (conflict)' : 'Subscribe'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>


      {/* Calendar Selection and Sync */}
      {statusData?.connected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <RefreshCw className="w-5 h-5" />
              <span>Calendar Sync</span>
            </CardTitle>
            <CardDescription>
              Choose a calendar and sync direction to synchronize events. 
              <br />
              <strong>To import holidays:</strong> First subscribe to holiday calendars above, then select "US Holidays" or "US Official Holidays" from the dropdown below, choose "From Google Calendar", and click "Sync Calendar".
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Calendar</label>
                <select
                  value={selectedCalendar}
                  onChange={(e) => setSelectedCalendar(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background text-foreground"
                  disabled={calendarsLoading}
                >
                  {calendarsLoading ? (
                    <option>Loading calendars...</option>
                  ) : calendarsData && calendarsData.length > 0 ? (
                    calendarsData.map((calendar) => (
                      <option key={calendar.id} value={calendar.id}>
                        {calendar.summary} {calendar.primary && '(Primary)'}
                      </option>
                    ))
                  ) : (
                    <option>No calendars available</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Sync Direction</label>
                <select
                  value={syncDirection}
                  onChange={(e) => setSyncDirection(e.target.value as any)}
                  className="w-full p-2 border rounded-md bg-background text-foreground"
                >
                  <option value="from_google">From Google Calendar</option>
                  <option value="to_google">To Google Calendar</option>
                  <option value="bidirectional">Bidirectional</option>
                </select>
              </div>
            </div>
            <Button
              onClick={handleSync}
              disabled={syncMutation.isPending}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {syncMutation.isPending ? 'Syncing...' : 'Sync Calendar'}
            </Button>
            
            <Button
              onClick={() => {
                fetch('/api/google-calendar/cleanup-duplicates', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                })
                .then(res => res.json())
                .then(data => {
                  if (data.success) {
                    toast({
                      title: "Cleanup Complete",
                      description: `Removed ${data.data.deletedCount} duplicate events`,
                    });
                    queryClient.invalidateQueries({ queryKey: ['calendar'] });
                  } else {
                    toast({
                      title: "Cleanup Failed",
                      description: data.message || "Failed to clean up duplicates",
                      variant: "destructive"
                    });
                  }
                })
                .catch(error => {
                  toast({
                    title: "Cleanup Failed",
                    description: "Failed to clean up duplicates",
                    variant: "destructive"
                  });
                });
              }}
              variant="outline"
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clean Up Duplicates
            </Button>

            {/* Recently Synced Events */}
            {recentlySyncedEvents.length > 0 && (
              <div className="mt-6 p-4 border-2 border-blue-500 rounded-lg bg-blue-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-blue-900 flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4" />
                    <span>Recently Synced Events</span>
                    <Badge variant="secondary" className="ml-2">{recentlySyncedEvents.length} events</Badge>
                  </h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRecentlySyncedEvents([])}
                    >
                      Clear List
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Move recently synced events to previously synced
                        setRecentlySyncedEvents([])
                        toast({
                          title: "Moved to Previously Synced",
                          description: "Events have been moved to the previously synced section"
                        })
                      }}
                    >
                      Move to Previously Synced
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {recentlySyncedEvents.map((event, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-900">{event.title}</h4>
                          <div className="text-sm text-blue-700 mt-1">
                            <span>
                              {event.startTime ? new Date(event.startTime).toLocaleString() : 'All Day'}
                            </span>
                            {event.endTime && (
                              <span> - {new Date(event.endTime).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        <Badge variant="default" className="bg-blue-100 text-blue-800">
                          Synced
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Google Calendar Events */}
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Google Calendar Events</span>
              <div className="flex items-center gap-2">
                <Button
                  variant={showHolidays ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateHolidayPreference(!showHolidays)}
                  title={showHolidays ? "Hide holiday events" : "Show holiday events"}
                >
                  {showHolidays ? "Hide Holidays" : "Show Holidays"}
                </Button>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as '3months' | '6months' | '1year' | '2years')}
                  className="px-2 py-1 text-sm border rounded-md bg-background text-foreground"
                  title="Select how far into the future to fetch events"
                >
                  <option value="3months">Next 3 months</option>
                  <option value="6months">Next 6 months</option>
                  <option value="1year">Next year</option>
                  <option value="2years">Next 2 years</option>
                </select>
                <Button
                  variant={showPastEvents ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowPastEvents(!showPastEvents)}
                  title={showPastEvents ? "Hide past events" : "Show past events"}
                >
                  {showPastEvents ? "Hide Past" : "Show Past"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Invalidate and refetch the events query
                    queryClient.invalidateQueries({ queryKey: ['google-calendar-events-all'] })
                    refetchEvents()
                    setLastUpdated(new Date())
                  }}
                  disabled={eventsLoading}
                  title="Refresh events from Google Calendar to show the latest changes"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Synced events from your Google Calendar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : eventsData && eventsData.length > 0 ? (
              (() => {
                const now = new Date()
                let filteredEvents = showPastEvents 
                  ? eventsData 
                  : eventsData.filter(event => {
                      const eventTime = new Date(event.start?.dateTime || event.start?.date)
                      return eventTime >= now
                    })
                
                // Filter out holiday events if showHolidays is false
                if (!showHolidays) {
                  filteredEvents = filteredEvents.filter(event => event.calendarId !== 'holiday')
                }
                
                if (filteredEvents.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No events found</p>
                      <p className="text-sm mt-2">
                        {!showPastEvents && eventsData.some(event => {
                          const eventTime = new Date(event.start?.dateTime || event.start?.date)
                          return eventTime < now
                        }) && (
                          <>
                            Past events are hidden. <button 
                              onClick={() => setShowPastEvents(true)}
                              className="text-primary hover:underline"
                            >
                              Show past events
                            </button>
                          </>
                        )}
                        {!showHolidays && eventsData.some(event => event.calendarId === 'holiday') && (
                          <>
                            {!showPastEvents && ' • '}
                            Holiday events are hidden. <button 
                              onClick={() => setShowHolidays(true)}
                              className="text-primary hover:underline"
                            >
                              Show holidays
                            </button>
                          </>
                        )}
                      </p>
                    </div>
                  )
                }
                
                return (
                  <div className="space-y-3">
                    {filteredEvents.map((event) => (
                      <div key={event.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium">{event.title || event.summary || 'Untitled Event'}</h3>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {event.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                              <span>
                                {isAllDay(event) ? (
                                  <span>
                                    All Day • {new Date(event.start.dateTime || event.start.date).toLocaleDateString()}
                                  </span>
                                ) : (
                                  formatDateTime(event.start.dateTime)
                                )}
                              </span>
                              {event.location && (
                                <span>📍 {event.location}</span>
                              )}
                              <Badge 
                                variant={
                                  event.calendarId === 'holiday' ? 'default' : 
                                  event.calendarId === 'google' ? 'default' :
                                  event.calendarId === 'local' ? 'secondary' : 'outline'
                                } 
                                className="text-xs"
                              >
                                {event.calendarId === 'holiday' ? 'Holiday' : 
                                 event.calendarId === 'google' ? 'G' :
                                 event.calendarId === 'local' ? 'Synced' : 'Primary'}
                              </Badge>
                            </div>
                          </div>
                          {isAllDay(event) && (
                            <Badge variant="secondary">All Day</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No events found in this calendar</p>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  )
}
