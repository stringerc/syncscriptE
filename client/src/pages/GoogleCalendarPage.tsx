import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, ExternalLink, RefreshCw, Trash2, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'

interface Calendar {
  id: string
  summary: string
  description?: string
  timeZone?: string
  accessRole?: string
  backgroundColor?: string
  foregroundColor?: string
  selected?: boolean
  primary?: boolean
}

interface Event {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  calendarId?: string
  calendarProvider?: string
  isAllDay?: boolean
  date?: string
  location?: string
}

export function GoogleCalendarPage() {
  console.log('🚀 GoogleCalendarPage: Component loaded - Google Calendar Events section COMPLETELY REMOVED');
  
  const [authUrl, setAuthUrl] = useState<string>('')
  const [selectedCalendar, setSelectedCalendar] = useState<string>('primary')
  const [syncDirection, setSyncDirection] = useState<'from_google' | 'to_google' | 'bidirectional'>('from_google')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [recentlySyncedEvents, setRecentlySyncedEvents] = useState<any[]>([])
  const [showHolidays, setShowHolidays] = useState(true)
  const { toast } = useToast()
  const { user, token } = useAuthStore()
  const queryClient = useQueryClient()

  // Fetch Google Calendar status
  const { data: statusData, isLoading: statusLoading, error: statusError } = useQuery({
    queryKey: ['google-calendar-status'],
    queryFn: async () => {
      const response = await api.get('/google-calendar/status')
      return response.data
    },
    enabled: !!user && !!token,
    retry: 1
  })

  // Fetch user profile for holiday preference
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await api.get('/user/profile')
      return response.data
    },
    enabled: !!user && !!token
  })

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/google-calendar/sync', {
        direction: syncDirection,
        calendarId: selectedCalendar
      })
      return response.data
    },
    onSuccess: (data) => {
      setLastUpdated(new Date())
      setRecentlySyncedEvents(data.data?.createdEvents || [])
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({
        title: "Sync Successful",
        description: `Synced ${data.data?.created || 0} events from Google Calendar`
      })
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.response?.data?.message || "Failed to sync with Google Calendar",
        variant: "destructive"
      })
    }
  })

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
              Retry
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

      {/* Calendar Sync */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar Sync</CardTitle>
          <CardDescription>
            Sync events between your Google Calendar and SyncScript
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!statusData?.data?.connected ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">Connect Google Calendar</h3>
              <p className="text-muted-foreground mb-4">
                Connect your Google Calendar to start syncing events
              </p>
              <Button
                onClick={() => {
                  window.location.href = authUrl
                }}
                disabled={!authUrl}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Connect Google Calendar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Connected to Google Calendar</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.location.href = authUrl
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Reconnect
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Calendar</label>
                  <select
                    value={selectedCalendar}
                    onChange={(e) => setSelectedCalendar(e.target.value)}
                    className="w-full p-2 border rounded-md text-black"
                  >
                    <option value="primary">Primary Calendar</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Sync Direction</label>
                  <select
                    value={syncDirection}
                    onChange={(e) => setSyncDirection(e.target.value as any)}
                    className="w-full p-2 border rounded-md text-black"
                  >
                    <option value="from_google">From Google to SyncScript</option>
                    <option value="to_google">From SyncScript to Google</option>
                    <option value="bidirectional">Bidirectional Sync</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  className="flex-1"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                  {syncMutation.isPending ? 'Syncing...' : 'Sync Now'}
                </Button>
              </div>

              {lastUpdated && (
                <p className="text-sm text-muted-foreground">
                  Last synced: {lastUpdated.toLocaleString()}
                </p>
              )}

              {/* Recently Synced Events */}
              {recentlySyncedEvents.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Recently Synced Events</h3>
                  <div className="space-y-2">
                    {recentlySyncedEvents.map((event, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-white">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-blue-900">{event.title}</h4>
                          <div className="text-sm text-gray-500">
                            {event.startTime ? new Date(event.startTime).toLocaleString() : 'All Day'}
                            {event.endTime && (
                              <span> - {new Date(event.endTime).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2 mt-3">
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
                        // Move to previously synced logic
                      }}
                    >
                      Move to Previously Synced
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}