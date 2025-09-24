import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, RefreshCw, Trash2, Clock, MapPin } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'

interface GoogleCalendarStatus {
  connected: boolean
  integration?: {
    id: string
    createdAt: string
    expiresAt?: string
  }
  email?: string
  lastSynced?: string
}

export function GoogleCalendarPageWorking() {
  const [authUrl, setAuthUrl] = useState<string>('')
  const [isOAuthCallback, setIsOAuthCallback] = useState(false)
  const [lastSyncResults, setLastSyncResults] = useState<any>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user, token } = useAuthStore()

  // Removed excessive debug logging for performance

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
      try {
        const response = await api.get('/google-calendar/status')
        return response.data.data
      } catch (error) {
        throw error
      }
    },
    enabled: !!user && !!token,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000 // 10 minutes
  })

  // Fetch Google Calendar auth URL
  const { data: authData, isLoading: authLoading, error: authError } = useQuery({
    queryKey: ['google-calendar-auth-url'],
    queryFn: async () => {
      try {
        const response = await api.get('/google-calendar/auth-url')
        return response.data.data.authUrl
      } catch (error) {
        throw error
      }
    },
    enabled: !!user && !!token && !statusData?.connected && !statusError,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 minutes (auth URL doesn't change often)
        gcTime: 15 * 60 * 1000 // 15 minutes
  })

  // Fetch recently synced events
  const { data: syncedEvents, isLoading: syncedEventsLoading, refetch: refetchSyncedEvents } = useQuery({
    queryKey: ['google-calendar-synced-events'],
    queryFn: async () => {
      try {
        const response = await api.get('/calendar')
        return response.data.data
      } catch (error) {
        throw error
      }
    },
    enabled: !!user && !!token && statusData?.connected,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 5 * 60 * 1000 // 5 minutes
  })

  // Connect Google Calendar mutation
  const connectMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await api.post('/google-calendar/auth/callback', { code })
      return response.data
    },
    onSuccess: () => {
      setIsOAuthCallback(false);
      toast({
        title: 'Google Calendar Connected!',
        description: 'Your Google Calendar has been successfully integrated.',
      })
      queryClient.invalidateQueries({ queryKey: ['google-calendar-status'] })
      queryClient.invalidateQueries({ queryKey: ['google-calendar-auth-url'] })
    },
    onError: (error: any) => {
      setIsOAuthCallback(false);
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
    mutationFn: async (direction: 'from_google' | 'to_google' | 'bidirectional' = 'from_google') => {
      const response = await api.post('/google-calendar/sync', { direction })
      return response.data
    },
    onSuccess: (data) => {
      const stats = data.data.stats;
      setLastSyncResults(stats); // Store results for detailed display
      
      let description = '';
      
      if (stats.created > 0) {
        description += `✅ Created ${stats.created} new events:\n`;
        stats.createdEvents?.forEach((event: any) => {
          const startTime = new Date(event.startTime).toLocaleString();
          description += `• ${event.title} (${startTime})\n`;
        });
      }
      
      if (stats.updated > 0) {
        description += `\n🔄 Updated ${stats.updated} events:\n`;
        stats.updatedEvents?.forEach((event: any) => {
          const startTime = new Date(event.startTime).toLocaleString();
          description += `• ${event.title} (${startTime})\n`;
        });
      }
      
      if (stats.errors > 0) {
        description += `\n❌ ${stats.errors} errors occurred during sync.`;
      }
      
      if (!description) {
        description = 'No changes needed - your calendars are already in sync!';
      }

      toast({
        title: 'Sync Completed!',
        description: description.trim(),
        duration: 8000, // Show longer for detailed info
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
      const response = await api.delete('/google-calendar/disconnect')
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

  // Delete individual event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await api.delete(`/calendar/${eventId}`)
      return response.data
    },
    onSuccess: () => {
      toast({
        title: 'Event Deleted',
        description: 'The synced event has been removed successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['google-calendar-synced-events'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
    onError: (error: any) => {
      console.error('Delete event error:', error)
      toast({
        title: 'Delete Failed',
        description: error.response?.data?.error || 'Failed to delete event.',
        variant: 'destructive',
      })
    },
  })

  // Clear all synced events mutation
  const clearAllEventsMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete('/calendar/clear-synced')
      return response.data
    },
    onSuccess: () => {
      toast({
        title: 'All Events Cleared',
        description: 'All synced events have been removed successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['google-calendar-synced-events'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
    onError: (error: any) => {
      console.error('Clear all events error:', error)
      toast({
        title: 'Clear Failed',
        description: error.response?.data?.error || 'Failed to clear all events.',
        variant: 'destructive',
      })
    },
  })

  useEffect(() => {
    if (authData) {
      setAuthUrl(authData)
    }
  }, [authData])

  // Removed debug logging for performance

  // Prevent navigation away during OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      // If we have an OAuth code, prevent any navigation away from this page
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (error) {
      console.error('OAuth error:', error);
      toast({
        title: 'Google Calendar Connection Failed',
        description: `Error: ${error}`,
        variant: 'destructive',
      });
      // Clear the error from the URL
      window.history.replaceState({}, document.title, '/google-calendar');
      return;
    }
    
    if (code && !statusData?.connected && !connectMutation.isPending) {
      setIsOAuthCallback(true);
      // Call the connect mutation
      connectMutation.mutate(code);
      // Clear the code from the URL but stay on the same page
      window.history.replaceState({}, document.title, '/google-calendar');
    }
  }, [statusData?.connected, connectMutation.isPending, toast]);

  const handleConnect = () => {
    if (authUrl) {
      // Redirect in the same window instead of opening a popup
      window.location.href = authUrl
    }
  }

  if (statusLoading || isOAuthCallback) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Google Calendar Integration</h1>
            <p className="text-muted-foreground">
              {isOAuthCallback ? 'Connecting to Google Calendar...' : 'Loading...'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              {isOAuthCallback ? 'Processing Google authorization...' : 'Loading Google Calendar status...'}
            </p>
          </div>
        </div>
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
        <Button variant="outline" onClick={() => window.location.reload()}>
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
              ? `✅ Google Calendar is connected! Full sync functionality will be available soon.`
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
                  onClick={() => syncMutation.mutate('from_google')}
                  disabled={syncMutation.isPending}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                  {syncMutation.isPending ? 'Syncing...' : 'Sync Now'}
                </Button>
                <Button 
                  onClick={() => {
                    if (confirm('Are you sure you want to disconnect Google Calendar? This will remove the integration.')) {
                      disconnectMutation.mutate()
                    }
                  }}
                  disabled={disconnectMutation.isPending}
                  variant="destructive"
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
                </Button>
              </div>
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800">
                  ✅ Google Calendar is connected! You can now sync events between Google Calendar and SyncScript.
                </p>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Click "Sync Now" to import events from Google Calendar</p>
                <p>• Events created in SyncScript can be synced to Google Calendar</p>
                <p>• Two-way sync keeps your calendars in perfect harmony</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {statusData?.connected && lastSyncResults && (
        <Card>
          <CardHeader>
            <CardTitle>Last Sync Results</CardTitle>
            <CardDescription>
              Detailed information about your most recent sync
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lastSyncResults.created > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-green-700 flex items-center">
                    ✅ Created {lastSyncResults.created} new events
                  </h4>
                  <div className="ml-4 space-y-1">
                    {lastSyncResults.createdEvents?.map((event: any, index: number) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        • <span className="font-medium">{event.title}</span> - {new Date(event.startTime).toLocaleString()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {lastSyncResults.updated > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-700 flex items-center">
                    🔄 Updated {lastSyncResults.updated} events
                  </h4>
                  <div className="ml-4 space-y-1">
                    {lastSyncResults.updatedEvents?.map((event: any, index: number) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        • <span className="font-medium">{event.title}</span> - {new Date(event.startTime).toLocaleString()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {lastSyncResults.errors > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-700 flex items-center">
                    ❌ {lastSyncResults.errors} errors occurred
                  </h4>
                  <p className="text-sm text-muted-foreground ml-4">
                    Some events could not be synced. Please try again or check your Google Calendar permissions.
                  </p>
                </div>
              )}
              
              {lastSyncResults.created === 0 && lastSyncResults.updated === 0 && lastSyncResults.errors === 0 && (
                <div className="text-center text-muted-foreground">
                  <p>✨ No changes needed - your calendars are already in sync!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {statusData?.connected && (
        <Card>
          <CardHeader>
            <CardTitle>Google Calendar Events</CardTitle>
            <CardDescription>
              View and manage your Google Calendar events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Button 
                  onClick={() => {
                    // Fetch recent events from Google Calendar
                    queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] })
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Events
                </Button>
                <Button 
                  onClick={() => {
                    // Show sync options
                    const direction = prompt('Choose sync direction:\n1. from_google (import from Google)\n2. to_google (export to Google)\n3. bidirectional (both ways)\n\nEnter 1, 2, or 3:')
                    if (direction === '1') syncMutation.mutate('from_google')
                    else if (direction === '2') syncMutation.mutate('to_google')
                    else if (direction === '3') syncMutation.mutate('bidirectional')
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Advanced Sync
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>• Use "Refresh Events" to fetch your latest Google Calendar events</p>
                <p>• Use "Advanced Sync" for specific sync directions</p>
                <p>• Events will appear in your main SyncScript calendar after syncing</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recently Synced Events Section */}
      {statusData?.connected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Recently Synced Events
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => refetchSyncedEvents()}
                  variant="outline"
                  size="sm"
                  disabled={syncedEventsLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncedEventsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                {syncedEvents && syncedEvents.length > 0 && (
                  <Button 
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete all ${syncedEvents.length} synced events? This action cannot be undone.`)) {
                        clearAllEventsMutation.mutate()
                      }
                    }}
                    variant="destructive"
                    size="sm"
                    disabled={clearAllEventsMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {clearAllEventsMutation.isPending ? 'Clearing...' : 'Clear All'}
                  </Button>
                )}
              </div>
            </CardTitle>
            <CardDescription>
              Manage events that were synced from Google Calendar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {syncedEventsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                <span className="text-muted-foreground">Loading synced events...</span>
              </div>
            ) : syncedEvents && syncedEvents.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Found {syncedEvents.length} synced event{syncedEvents.length !== 1 ? 's' : ''}
                </div>
                <div className="space-y-3">
                  {syncedEvents.map((event: any) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-foreground">{event.title}</h4>
                          {event.location && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="w-3 h-3 mr-1" />
                              {event.location}
                            </div>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                        )}
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(event.startTime).toLocaleString()} - {new Date(event.endTime).toLocaleString()}
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
                            deleteEventMutation.mutate(event.id)
                          }
                        }}
                        variant="outline"
                        size="sm"
                        disabled={deleteEventMutation.isPending}
                        className="ml-4"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No Synced Events</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Events synced from Google Calendar will appear here
                </p>
                <Button 
                  onClick={() => syncMutation.mutate('from_google')}
                  variant="outline"
                  disabled={syncMutation.isPending}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                  {syncMutation.isPending ? 'Syncing...' : 'Sync from Google Calendar'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
