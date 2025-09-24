import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, ExternalLink, RefreshCw, Sync, Trash2, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
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
  const [authUrl, setAuthUrl] = useState<string>('')
  const [selectedCalendar, setSelectedCalendar] = useState<string>('primary')
  const [syncDirection, setSyncDirection] = useState<'from_google' | 'to_google' | 'bidirectional'>('from_google')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch Google Calendar integration status
  const { data: statusData, isLoading: statusLoading } = useQuery<GoogleCalendarStatus>({
    queryKey: ['google-calendar-status'],
    queryFn: async () => {
      const response = await api.get('/google-calendar/status')
      return response.data.data
    }
  })

  // Fetch Google Calendar auth URL
  const { data: authData, isLoading: authLoading } = useQuery({
    queryKey: ['google-calendar-auth-url'],
    queryFn: async () => {
      const response = await api.get('/google-calendar/auth-url')
      return response.data.data.authUrl
    },
    enabled: !statusData?.connected
  })

  // Fetch Google Calendar calendars
  const { data: calendarsData, isLoading: calendarsLoading } = useQuery<GoogleCalendar[]>({
    queryKey: ['google-calendar-calendars'],
    queryFn: async () => {
      const response = await api.get('/google-calendar/calendars')
      return response.data.data
    },
    enabled: statusData?.connected
  })

  // Fetch Google Calendar events
  const { data: eventsData, isLoading: eventsLoading, refetch: refetchEvents } = useQuery<GoogleCalendarEvent[]>({
    queryKey: ['google-calendar-events', selectedCalendar],
    queryFn: async () => {
      const response = await api.get(`/google-calendar/events?calendarId=${selectedCalendar}&maxResults=50`)
      return response.data.data
    },
    enabled: statusData?.connected
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
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] })
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

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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
          {!statusData?.connected ? (
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
                  <p className="font-medium">Connected since</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(statusData.integration?.createdAt || '').toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refreshTokensMutation.mutate()}
                    disabled={refreshTokensMutation.isPending}
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

      {/* Calendar Selection and Sync */}
      {statusData?.connected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sync className="w-5 h-5" />
              <span>Calendar Sync</span>
            </CardTitle>
            <CardDescription>
              Choose a calendar and sync direction to synchronize events
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Calendar</label>
                <select
                  value={selectedCalendar}
                  onChange={(e) => setSelectedCalendar(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  disabled={calendarsLoading}
                >
                  {calendarsData?.map((calendar) => (
                    <option key={calendar.id} value={calendar.id}>
                      {calendar.summary} {calendar.primary && '(Primary)'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Sync Direction</label>
                <select
                  value={syncDirection}
                  onChange={(e) => setSyncDirection(e.target.value as any)}
                  className="w-full p-2 border rounded-md"
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
              <Sync className="w-4 h-4 mr-2" />
              {syncMutation.isPending ? 'Syncing...' : 'Sync Calendar'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Google Calendar Events */}
      {statusData?.connected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Google Calendar Events</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchEvents()}
                disabled={eventsLoading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </CardTitle>
            <CardDescription>
              Events from your selected Google Calendar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : eventsData && eventsData.length > 0 ? (
              <div className="space-y-3">
                {eventsData.map((event) => (
                  <div key={event.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{event.summary || 'Untitled Event'}</h3>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                          <span>
                            {isAllDay(event) ? 'All Day' : formatDateTime(event.start.dateTime)}
                          </span>
                          {event.location && (
                            <span>📍 {event.location}</span>
                          )}
                        </div>
                      </div>
                      {isAllDay(event) && (
                        <Badge variant="secondary">All Day</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No events found in this calendar</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
