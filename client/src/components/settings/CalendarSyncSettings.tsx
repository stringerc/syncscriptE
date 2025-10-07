import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { calendarSyncService, CalendarProvider } from '@/services/calendarSyncService';
import { 
  Calendar, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock,
  Settings,
  TestTube
} from 'lucide-react';

export function CalendarSyncSettings() {
  const { toast } = useToast();
  const [providers, setProviders] = useState<CalendarProvider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncResults, setSyncResults] = useState<Record<string, any>>({});
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  useEffect(() => {
    loadCalendarSettings();
  }, []);

  const loadCalendarSettings = () => {
    const calendarProviders = calendarSyncService.getProviders();
    setProviders(calendarProviders);
    
    // Load saved provider settings
    const savedProviders = localStorage.getItem('syncscript-calendar-providers');
    if (savedProviders) {
      try {
        const parsed = JSON.parse(savedProviders);
        setProviders(parsed);
      } catch (error) {
        console.error('Failed to load calendar provider settings:', error);
      }
    }
  };

  const handleProviderToggle = async (providerId: string, enabled: boolean) => {
    setIsLoading(true);
    try {
      await calendarSyncService.setProviderEnabled(providerId, enabled);
      loadCalendarSettings();
      
      toast({
        title: enabled ? 'Provider Enabled' : 'Provider Disabled',
        description: `Calendar sync for ${providers.find(p => p.id === providerId)?.name} has been ${enabled ? 'enabled' : 'disabled'}`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update provider settings',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectProvider = async (providerId: string) => {
    try {
      const authUrl = calendarSyncService.getAuthUrl(providerId);
      window.open(authUrl, '_blank', 'width=600,height=600');
      
      toast({
        title: 'Authorization Required',
        description: 'Please complete the authorization in the popup window',
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to start authorization',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  const handleDisconnectProvider = async (providerId: string) => {
    setIsLoading(true);
    try {
      const result = await calendarSyncService.disconnectProvider(providerId);
      loadCalendarSettings();
      
      toast({
        title: result.success ? 'Disconnected' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to disconnect provider',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncProvider = async (providerId: string) => {
    setIsLoading(true);
    try {
      const result = await calendarSyncService.syncEvents(providerId);
      setSyncResults(prev => ({
        ...prev,
        [providerId]: result
      }));
      
      toast({
        title: result.success ? 'Sync Completed' : 'Sync Failed',
        description: result.success 
          ? `Added ${result.eventsAdded}, Updated ${result.eventsUpdated}, Deleted ${result.eventsDeleted} events`
          : result.errors.join(', '),
        variant: result.success ? 'default' : 'destructive',
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: 'Sync Error',
        description: 'Failed to sync calendar',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestProvider = async (providerId: string) => {
    setIsLoading(true);
    try {
      const result = await calendarSyncService.testProvider(providerId);
      setTestResults(prev => ({
        ...prev,
        [providerId]: result
      }));
      
      toast({
        title: result.success ? 'Test Successful' : 'Test Failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: 'Test Error',
        description: 'Failed to test calendar provider',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Calendar Sync Integration
          </CardTitle>
          <CardDescription>
            Connect and sync with external calendar providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {providers.map((provider) => (
              <Card key={provider.id} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{provider.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(provider.status)}
                          <Badge className={getStatusColor(provider.status)}>
                            {provider.status}
                          </Badge>
                          {provider.lastSync && (
                            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                              <Clock className="w-3 h-3" />
                              Last sync: {provider.lastSync.toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {testResults[provider.id] && (
                        <div className="flex items-center gap-1">
                          {testResults[provider.id].success ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {testResults[provider.id].success ? 'Working' : 'Failed'}
                          </span>
                        </div>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestProvider(provider.id)}
                        disabled={isLoading || !provider.config.clientId}
                      >
                        <TestTube className="w-4 h-4 mr-1" />
                        Test
                      </Button>
                      
                      {provider.status === 'connected' ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSyncProvider(provider.id)}
                            disabled={isLoading}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Sync
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnectProvider(provider.id)}
                            disabled={isLoading}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleConnectProvider(provider.id)}
                          disabled={isLoading || !provider.config.clientId}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Connect
                        </Button>
                      )}
                      
                      <Switch
                        checked={provider.enabled}
                        onCheckedChange={(enabled) => handleProviderToggle(provider.id, enabled)}
                        disabled={isLoading || !provider.config.clientId}
                      />
                    </div>
                  </div>
                  
                  {syncResults[provider.id] && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Last Sync Results:</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-semibold text-green-600 dark:text-green-400">
                            +{syncResults[provider.id].eventsAdded}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">Added</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-blue-600 dark:text-blue-400">
                            ~{syncResults[provider.id].eventsUpdated}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">Updated</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-red-600 dark:text-red-400">
                            -{syncResults[provider.id].eventsDeleted}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">Deleted</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {provider.config.clientId && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-sm">
                        <strong>Configuration:</strong>
                        <ul className="mt-1 space-y-1 text-gray-600 dark:text-gray-400">
                          <li>• Client ID: {provider.config.clientId ? 'Configured' : 'Not configured'}</li>
                          <li>• Redirect URI: {provider.config.redirectUri}</li>
                          <li>• Scopes: {provider.config.scope?.join(', ')}</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mt-6">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Calendar Provider Setup
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                To enable calendar sync, configure OAuth credentials in your environment variables:
                VITE_GOOGLE_CLIENT_ID, VITE_OUTLOOK_CLIENT_ID, or VITE_APPLE_CLIENT_ID
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
