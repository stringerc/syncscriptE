import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Mail,
  Smartphone,
  Apple
} from 'lucide-react';
import { OutlookCalendarIntegration } from '@/components/OutlookCalendarIntegration';
import { AppleCalendarIntegration } from '@/components/AppleCalendarIntegration';

interface CalendarProvider {
  id: string;
  provider: 'google' | 'outlook' | 'exchange' | 'icloud';
  connectedAt: string;
  expiresAt?: string;
}

interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  provider?: string;
  externalId?: string;
}

const MultiCalendarPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showICloudModal, setShowICloudModal] = useState(false);
  const [iCloudCredentials, setICloudCredentials] = useState({
    username: '',
    appPassword: ''
  });

  // Fetch connected providers
  const { data: providersData, isLoading: providersLoading } = useQuery({
    queryKey: ['multi-calendar-providers'],
    queryFn: async () => {
      const response = await api.get('/multi-calendar/providers');
      return response.data;
    },
    retry: 1
  });

  // Fetch events from all providers
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['multi-calendar-events'],
    queryFn: async () => {
      const response = await api.get('/multi-calendar/events');
      return response.data;
    },
    retry: 1
  });

  // Get Outlook OAuth URL
  const { data: outlookAuthData } = useQuery({
    queryKey: ['outlook-auth-url'],
    queryFn: async () => {
      const response = await api.get('/outlook-calendar/auth-url');
      return response.data;
    },
    enabled: false
  });

  // Connect iCloud calendar
  const connectICloudMutation = useMutation({
    mutationFn: async (credentials: { username: string; appPassword: string }) => {
      const response = await api.post('/icloud-calendar/connect', credentials);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate queries to refresh the connection status
      queryClient.invalidateQueries({ queryKey: ['multi-calendar-providers'] });
      queryClient.invalidateQueries({ queryKey: ['multi-calendar-events'] });
      
      // Close modal and clear credentials
      setShowICloudModal(false);
      setICloudCredentials({ username: '', appPassword: '' });
      
      // Show success message
      toast({
        title: "Connected Successfully",
        description: "iCloud Calendar connected successfully. You can now sync events from your iCloud Calendar.",
        variant: "default"
      });
      
      // Force a small delay to ensure the UI updates
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['multi-calendar-providers'] });
      }, 500);
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.response?.data?.error || "Failed to connect iCloud calendar",
        variant: "destructive"
      });
    }
  });

  // Connect Outlook calendar
  const connectOutlookMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get('/outlook-calendar/auth-url');
      return response.data;
    },
    onSuccess: (data) => {
      if (data.data.authUrl) {
        window.location.href = data.data.authUrl;
      } else {
        toast({
          title: "Already Connected",
          description: "Outlook calendar is already connected",
          variant: "default"
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.response?.data?.error || "Failed to connect Outlook calendar",
        variant: "destructive"
      });
    }
  });

  // Connect Exchange calendar
  const connectExchangeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get('/exchange-calendar/auth-url');
      return response.data;
    },
    onSuccess: (data) => {
      if (data.data.authUrl) {
        window.location.href = data.data.authUrl;
      } else {
        toast({
          title: "Already Connected",
          description: "Exchange calendar is already connected",
          variant: "default"
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.response?.data?.error || "Failed to connect Exchange calendar",
        variant: "destructive"
      });
    }
  });

  // Disconnect provider
  const disconnectMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await api.delete(`/multi-calendar/providers/${provider}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['multi-calendar-providers'] });
      queryClient.invalidateQueries({ queryKey: ['multi-calendar-events'] });
      toast({
        title: "Disconnected",
        description: "Calendar provider disconnected successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Disconnect Failed",
        description: error.response?.data?.error || "Failed to disconnect calendar provider",
        variant: "destructive"
      });
    }
  });

  // Refresh tokens
  const refreshTokensMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/multi-calendar/refresh-tokens');
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Tokens Refreshed",
        description: `Refreshed tokens for ${data.data.refreshedProviders.length} providers`,
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Refresh Failed",
        description: error.response?.data?.error || "Failed to refresh tokens",
        variant: "destructive"
      });
    }
  });

  const providers: CalendarProvider[] = providersData?.data?.providers || [];
  const events: CalendarEvent[] = eventsData?.data?.events || [];

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return <Mail className="h-5 w-5 text-blue-500" />;
      case 'outlook':
        return <Mail className="h-5 w-5 text-blue-600" />;
      case 'exchange':
        return <Mail className="h-5 w-5 text-purple-600" />;
      case 'icloud':
        return <Smartphone className="h-5 w-5 text-gray-600" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'Google Calendar';
      case 'outlook':
        return 'Outlook Calendar';
      case 'exchange':
        return 'Exchange/Office 365';
      case 'icloud':
        return 'iCloud Calendar';
      default:
        return provider;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'bg-blue-100 text-blue-800';
      case 'outlook':
        return 'bg-blue-100 text-blue-800';
      case 'exchange':
        return 'bg-purple-100 text-purple-800';
      case 'icloud':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isProviderConnected = (provider: string) => {
    return providers.some(p => p.provider === provider);
  };

  const handleConnectProvider = (provider: string) => {
    switch (provider) {
      case 'outlook':
        connectOutlookMutation.mutate();
        break;
      case 'exchange':
        connectExchangeMutation.mutate();
        break;
      case 'google':
        // Redirect to existing Google OAuth flow
        window.location.href = '/google-calendar';
        break;
      case 'icloud':
        setShowICloudModal(true);
        break;
    }
  };

  const handleDisconnectProvider = (provider: string) => {
    disconnectMutation.mutate(provider);
  };

  const handleRefreshTokens = () => {
    refreshTokensMutation.mutate();
  };

  const upcomingEvents = events
    .filter(event => {
      const startTime = event.start.dateTime || event.start.date;
      return startTime && new Date(startTime) > new Date();
    })
    .sort((a, b) => {
      const aTime = new Date(a.start.dateTime || a.start.date!);
      const bTime = new Date(b.start.dateTime || b.start.date!);
      return aTime.getTime() - bTime.getTime();
    })
    .slice(0, 5);

  return (
    <div className="container mx-auto p-6 space-y-8 animate-fade-in">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Calendar className="w-10 h-10" />
              Multi-Calendar Integration
            </h1>
            <p className="text-white/90 text-lg">
              Connect and manage multiple calendar providers • {providers.length} connected • {events.length} events
            </p>
          </div>
          <Button
            onClick={handleRefreshTokens}
            disabled={refreshTokensMutation.isPending}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white text-lg px-6 py-6 shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${refreshTokensMutation.isPending ? 'animate-spin' : ''}`} />
            Refresh Tokens
          </Button>
        </div>
      </div>

      {/* Apple Calendar Integration Section */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <Smartphone className="h-5 w-5 mr-2" />
            Apple Calendar Integration
          </CardTitle>
          <CardDescription className="text-blue-700">
            Choose one of these options to sync events with your Apple Calendar (iPhone, iPad, Mac)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* iCloud Calendar Option */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm">
                  <Smartphone className="h-4 w-4 mr-2 text-gray-600" />
                  Direct iCloud Connection
                </CardTitle>
                <CardDescription className="text-xs">
                  Connect directly to your iCloud Calendar using app-specific password
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {isProviderConnected('icloud') ? (
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Connected to iCloud
                    </div>
                    <Button 
                      onClick={() => handleDisconnectProvider('icloud')}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Disconnect iCloud
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Requires app-specific password from Apple ID settings
                    </p>
                    <Button 
                      onClick={() => setShowICloudModal(true)}
                      className="w-full"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Connect iCloud
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Exchange/Office 365 Option */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2 text-purple-600" />
                  Exchange/Office 365
                </CardTitle>
                <CardDescription className="text-xs">
                  Connect via Exchange/Office 365 (if your Apple Calendar is synced with Exchange)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {isProviderConnected('exchange') ? (
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Connected to Exchange
                    </div>
                    <Button 
                      onClick={() => handleDisconnectProvider('exchange')}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Disconnect Exchange
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      OAuth-based connection via Microsoft Graph API
                    </p>
                    <Button 
                      onClick={() => handleConnectProvider('exchange')}
                      className="w-full"
                      size="sm"
                      disabled={connectExchangeMutation.isPending}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Connect Exchange
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-4 p-3 bg-blue-100 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> If your Apple Calendar is already synced with Exchange/Office 365 at work, 
              connecting Exchange will automatically sync events to your Apple devices. Otherwise, use the direct 
              iCloud connection for personal Apple calendars.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Other Calendar Providers */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Other Calendar Providers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Google Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-blue-500 mr-2" />
                  <span>Google Calendar</span>
                </div>
                <Badge variant={isProviderConnected('google') ? "default" : "secondary"}>
                  {isProviderConnected('google') ? "Connected" : "Not Connected"}
                </Badge>
              </CardTitle>
              <CardDescription>
                {isProviderConnected('google') ? (
                  <span className="space-y-1 block">
                    <span className="block">Connected on {new Date(providers.find(p => p.provider === 'google')?.connectedAt || '').toLocaleDateString()}</span>
                    {providers.find(p => p.provider === 'google')?.expiresAt && (
                      <span className="text-xs text-muted-foreground block">
                        Expires: {new Date(providers.find(p => p.provider === 'google')?.expiresAt || '').toLocaleDateString()}
                      </span>
                    )}
                  </span>
                ) : (
                  <span>Connect your Google Calendar to sync events</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isProviderConnected('google') ? (
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Successfully connected
                  </div>
                  <Button 
                    onClick={() => handleDisconnectProvider('google')}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Connect your Google Calendar to sync events
                  </p>
                  <Button 
                    onClick={() => handleConnectProvider('google')}
                    className="w-full"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Connect Google Calendar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Outlook Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-blue-600 mr-2" />
                  <span>Outlook Calendar</span>
                </div>
                <Badge variant={isProviderConnected('outlook') ? "default" : "secondary"}>
                  {isProviderConnected('outlook') ? "Connected" : "Not Connected"}
                </Badge>
              </CardTitle>
              <CardDescription>
                {isProviderConnected('outlook') ? (
                  <span className="space-y-1 block">
                    <span className="block">Connected on {new Date(providers.find(p => p.provider === 'outlook')?.connectedAt || '').toLocaleDateString()}</span>
                    {providers.find(p => p.provider === 'outlook')?.expiresAt && (
                      <span className="text-xs text-muted-foreground block">
                        Expires: {new Date(providers.find(p => p.provider === 'outlook')?.expiresAt || '').toLocaleDateString()}
                      </span>
                    )}
                  </span>
                ) : (
                  <span>Connect your Outlook Calendar to sync events</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isProviderConnected('outlook') ? (
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Successfully connected
                  </div>
                  <Button 
                    onClick={() => handleDisconnectProvider('outlook')}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Connect your Outlook Calendar to sync events
                  </p>
                  <Button 
                    onClick={() => handleConnectProvider('outlook')}
                    className="w-full"
                    size="sm"
                    disabled={connectOutlookMutation.isPending}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Connect Outlook Calendar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Calendar Integrations */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Enhanced Calendar Integrations</h2>
        <p className="text-muted-foreground">
          Advanced calendar integrations with improved OAuth flows and ICS feed support
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OutlookCalendarIntegration
            onConnected={() => {
              console.log('Outlook Calendar connected via enhanced integration');
              // Refresh the providers list
              queryClient.invalidateQueries({ queryKey: ['calendar-providers'] });
            }}
            onDisconnected={() => {
              console.log('Outlook Calendar disconnected via enhanced integration');
              // Refresh the providers list
              queryClient.invalidateQueries({ queryKey: ['calendar-providers'] });
            }}
          />
          
          <AppleCalendarIntegration
            onConnected={() => {
              console.log('Apple Calendar connected via enhanced integration');
              // Refresh the providers list
              queryClient.invalidateQueries({ queryKey: ['calendar-providers'] });
            }}
            onDisconnected={() => {
              console.log('Apple Calendar disconnected via enhanced integration');
              // Refresh the providers list
              queryClient.invalidateQueries({ queryKey: ['calendar-providers'] });
            }}
          />
        </div>
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Upcoming Events
            </CardTitle>
            <CardDescription>
              Events from all connected calendar providers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event, index) => (
                <div key={event.id || index}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{event.summary}</h4>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {event.description}
                        </p>
                      )}
                      <div className="flex items-center mt-2 space-x-4 text-sm text-muted-foreground">
                        <span>
                          {new Date(event.start.dateTime || event.start.date!).toLocaleString()}
                        </span>
                        {event.location && (
                          <span>{event.location}</span>
                        )}
                        {event.provider && (
                          <Badge variant="outline" className="text-xs">
                            {getProviderName(event.provider)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {index < upcomingEvents.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            How to connect each calendar provider
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Apple Calendar Integration</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Choose one of these options to sync events with your Apple Calendar:
            </p>
            <div className="ml-4 space-y-2">
              <div>
                <strong className="text-sm">Direct iCloud Connection:</strong>
                <p className="text-xs text-muted-foreground ml-2">
                  Connect directly to your iCloud Calendar using an app-specific password. Best for personal Apple calendars.
                </p>
              </div>
              <div>
                <strong className="text-sm">Exchange/Office 365:</strong>
                <p className="text-xs text-muted-foreground ml-2">
                  Connect via Exchange if your Apple Calendar is already synced with Exchange/Office 365 at work.
                </p>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Google Calendar</h4>
            <p className="text-sm text-muted-foreground">
              Click "Connect Google Calendar" to authorize SyncScript to access your Google Calendar events.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Outlook Calendar</h4>
            <p className="text-sm text-muted-foreground">
              Click "Connect Outlook Calendar" to authorize SyncScript to access your Microsoft Outlook calendar events.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* iCloud Connection Modal */}
      {showICloudModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Smartphone className="h-5 w-5 mr-2" />
                Connect iCloud Calendar
              </CardTitle>
              <CardDescription>
                <div className="space-y-2">
                  <p>Connect your iCloud Calendar to sync events with your Apple Calendar (iPhone, iPad, Mac).</p>
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-sm text-blue-800">
                      <strong>📱 Apple Calendar Integration:</strong> This will sync events directly to your Apple Calendar app on all your devices.
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      You'll need to create an app-specific password in your Apple ID settings - this is a one-time setup.
                    </p>
                  </div>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Apple ID Username</label>
                  <input
                    type="email"
                    value={iCloudCredentials.username}
                    onChange={(e) => setICloudCredentials(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="your.email@icloud.com"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">App-Specific Password</label>
                  <input
                    type="password"
                    value={iCloudCredentials.appPassword}
                    onChange={(e) => setICloudCredentials(prev => ({ ...prev, appPassword: e.target.value }))}
                    placeholder="Enter your app-specific password"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-600">
                      Don't have an app-specific password? 
                      <a 
                        href="https://appleid.apple.com/account/manage" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline ml-1"
                      >
                        Create one here
                      </a>
                    </p>
                    <p className="text-xs text-gray-500">
                      • Go to Apple ID settings → Sign-In and Security → App-Specific Passwords
                    </p>
                    <p className="text-xs text-gray-500">
                      • Generate a password for "SyncScript Calendar Sync"
                    </p>
                  </div>
                </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => connectICloudMutation.mutate(iCloudCredentials)}
                  disabled={connectICloudMutation.isPending || !iCloudCredentials.username || !iCloudCredentials.appPassword}
                  className="flex-1"
                >
                  {connectICloudMutation.isPending ? 'Connecting...' : 'Connect'}
                </Button>
                <Button
                  onClick={() => setShowICloudModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MultiCalendarPage;
