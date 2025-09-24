import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, ExternalLink, RefreshCw, Sync, Trash2, Plus } from 'lucide-react'
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
  email?: string
  lastSynced?: string
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

export function GoogleCalendarPageFixed() {
  const [authUrl, setAuthUrl] = useState<string>('')
  const [selectedCalendar, setSelectedCalendar] = useState<string>('primary')
  const [syncDirection, setSyncDirection] = useState<'from_google' | 'to_google' | 'bidirectional'>('from_google')
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user, token } = useAuthStore()

  console.log('GoogleCalendarPageFixed rendering...', { 
    user: !!user, 
    token: !!token,
    userEmail: user?.email 
  })

  // Check if user is authenticated first
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

  // Fetch Google Calendar integration status
  const { data: statusData, isLoading: statusLoading, error: statusError } = useQuery<GoogleCalendarStatus>({
    queryKey: ['google-calendar-status'],
    queryFn: async () => {
      console.log('Fetching Google Calendar status...')
      const response = await api.get('/google-calendar/status')
      console.log('Google Calendar status response:', response.data)
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
      console.log('Fetching Google Calendar auth URL...')
      const response = await api.get('/google-calendar/auth-url')
      console.log('Google Calendar auth URL response:', response.data)
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
      console.log('Fetching Google Calendar calendars...')
      const response = await api.get('/google-calendar/calendars')
      console.log('Google Calendar calendars response:', response.data)
      return response.data.data
    },
    enabled: !!user && !!token && statusData?.connected && !statusError,
    retry: false,
    refetchOnWindowFocus: false
  })

  // Fetch Google Calendar events
  const { data: eventsData, isLoading: eventsLoading, refetch: refetchEvents, error: eventsError } = useQuery<GoogleCalendarEvent[]>({
    queryKey: ['google-calendar-events', selectedCalendar],
    queryFn: async () => {
      console.log('Fetching Google Calendar events for calendar:', selectedCalendar)
      const response = await api.get(`/google-calendar/events?calendarId=${selectedCalendar}&maxResults=50`)
      console.log('Google Calendar events response:', response.data)
      return response.data.data
    },
    enabled: !!user && !!token && statusData?.connected && !statusError,
    retry: false,
    refetchOnWindowFocus: false
  })

  // Connect Google Calendar mutation
  const connectMutation = useMutation({
    mutationFn: async (code: string) => {
      console.log('Connecting Google Calendar with code:', code)
      const response = await api.post('/google-calendar/auth/callback', { code })
      console.log('Google Calendar connection response:', response.data)
      return response.data
    },
    onSuccess: () => {
      toast({
        title: 'Google Calendar Connected!',
        description: 'Your Google Calendar has been successfully integrated.',
      })
      queryClient.invalidateQueries({ queryKey: ['google-calendar-status'] })
      queryClient.invalidateQueries({ queryKey: ['google-calendar-calendars'] })
      queryClient.invalidateQueries({ queryKey: ['google-calendar-auth-url'] })
    },
    onError: (error: any) => {
      console.error('Google Calendar connection error:', error)
      toast({
        title: 'Connection Failed',
        description: error.response?.data?.error || 'Failed to connect Google Calendar.',
        variant: 'destructive',
      })
    },
  })

  // Sync Google Calendar mutation
  const syncMutation = useMutation({
    mutationFn: async (direction: 'from_google' | 'to_google' | 'bidirectional') => {
      console.log('Syncing Google Calendar with direction:', direction)
      const response = await api.post('/google-calendar/sync', { direction })
      console.log('Google Calendar sync response:', response.data)
      return response.data
    },
    onSuccess: () => {
      toast({
        title: 'Sync Completed!',
        description: 'Google Calendar synchronization completed successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
    },
    onError: (error: any) => {
      console.error('Google Calendar sync error:', error)
      toast({
        title: 'Sync Failed',
        description: error.response?.data?.error || 'Failed to sync Google Calendar.',
        variant: 'destructive',
      })
    },
  })

  // Disconnect Google Calendar mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      console.log('Disconnecting Google Calendar...')
      const response = await api.delete('/google-calendar/disconnect')
      console.log('Google Calendar disconnect response:', response.data)
      return response.data
    },
    onSuccess: () => {
      toast({
        title: 'Google Calendar Disconnected',
        description: 'Your Google Calendar integration has been removed.',
      })
      queryClient.invalidateQueries({ queryKey: ['google-calendar-status'] })
      queryClient.invalidateQueries({ queryKey: ['google-calendar-calendars'] })
      queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] })
    },
    onError: (error: any) => {
      console.error('Google Calendar disconnect error:', error)
      toast({
        title: 'Disconnect Failed',
        description: error.response?.data?.error || 'Failed to disconnect Google Calendar.',
        variant: 'destructive',
      })
    },
  })

  useEffect(() => {
    if (authData) {
      setAuthUrl(authData)
    }
  }, [authData])

  // Debug logging
  useEffect(() => {
    console.log('GoogleCalendarPageFixed Debug:', {
      user: !!user,
      token: !!token,
      statusLoading,
      statusError,
      statusData,
      authLoading,
      authError,
      authData
    })
  }, [user, token, statusLoading, statusError, statusData, authLoading, authError, authData])

  const handleConnect = () => {
    if (authUrl) {
      window.open(authUrl, '_blank', 'width=500,height=600')
    }
  }

  const handleSync = () => {
    syncMutation.mutate(syncDirection)
  }

  const handleDisconnect = () => {
    disconnectMutation.mutate()
  }

  const isAllDay = (event: GoogleCalendarEvent) => {
    return !event.start.dateTime && !event.end.dateTime
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
        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['google-calendar-status'] })}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh Status
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            Connection Status
            <Badge 
              variant={statusData?.connected ? 'default' : 'destructive'} 
              className="ml-2"
            >
              {statusData?.connected ? 'Connected' : 'Not Connected'}
            </Badge>
          </CardTitle>
          <CardDescription>
            {statusData?.connected 
              ? `Connected to Google Calendar as ${statusData.email}. Last synced: ${statusData.lastSynced ? new Date(statusData.lastSynced).toLocaleString() : 'Never'}`
              : "Connect your Google Calendar to enable synchronization"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!statusData?.connected ? (
            <div className="space-y-4">
              <Button 
                onClick={handleConnect}
                disabled={authLoading || !authUrl}
                className="w-full"
              >
                {authLoading ? 'Getting Auth URL...' : 'Connect Google Calendar'}
              </Button>
              {authError && (
                <p className="text-sm text-red-500">
                  Error fetching auth URL: {authError.message}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Button 
                  onClick={handleSync}
                  disabled={syncMutation.isPending}
                  variant="outline"
                >
                  <Sync className="w-4 h-4 mr-2" />
                  {syncMutation.isPending ? 'Syncing...' : 'Sync Now'}
                </Button>
                <Button 
                  onClick={handleDisconnect}
                  disabled={disconnectMutation.isPending}
                  variant="destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
                </Button>
              </div>
              
              {calendarsData && calendarsData.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Calendar:</label>
                  <select 
                    value={selectedCalendar} 
                    onChange={(e) => setSelectedCalendar(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    {calendarsData.map((calendar) => (
                      <option key={calendar.id} value={calendar.id}>
                        {calendar.summary} {calendar.primary && '(Primary)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {eventsData && eventsData.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Recent Events:</h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {eventsData.slice(0, 10).map((event) => (
                      <div key={event.id} className="p-2 border rounded-md">
                        <div className="font-medium">{event.summary}</div>
                        {event.start.dateTime && (
                          <div className="text-sm text-gray-600">
                            {new Date(event.start.dateTime).toLocaleString()}
                          </div>
                        )}
                        {event.location && (
                          <div className="text-sm text-gray-500">{event.location}</div>
                        )}
                      </div>
                    ))}
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
