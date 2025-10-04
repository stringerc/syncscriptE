import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, CheckCircle, XCircle, RefreshCw, Calendar, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface OutlookCalendarIntegrationProps {
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export const OutlookCalendarIntegration: React.FC<OutlookCalendarIntegrationProps> = ({
  onConnected,
  onDisconnected
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Check connection status
  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['outlook-calendar-status'],
    queryFn: async () => {
      const response = await api.get('/outlook-calendar/status');
      return response.data.data;
    },
    staleTime: 30 * 1000,
  });

  const isConnected = statusData?.connected || false;
  const account = statusData?.account;

  // Connect to Outlook
  const connectMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get('/outlook-calendar/auth-url');
      return response.data.data;
    },
    onSuccess: (data) => {
      // Open OAuth flow in new window
      const authWindow = window.open(
        data.authUrl,
        'outlook-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Listen for the OAuth callback
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'OUTLOOK_OAUTH_SUCCESS') {
          authWindow?.close();
          window.removeEventListener('message', handleMessage);
          
          // Handle the callback
          try {
            await api.post('/outlook-calendar/callback', {
              code: event.data.code,
              redirectUri: data.redirectUri
            });
            
            toast({
              title: "Outlook Calendar Connected!",
              description: "Your Outlook Calendar has been successfully connected.",
            });
            
            queryClient.invalidateQueries({ queryKey: ['outlook-calendar-status'] });
            onConnected?.();
          } catch (error: any) {
            toast({
              title: "Connection Failed",
              description: error.response?.data?.error || "Failed to connect Outlook Calendar",
              variant: "destructive",
            });
          }
        } else if (event.data.type === 'OUTLOOK_OAUTH_ERROR') {
          authWindow?.close();
          window.removeEventListener('message', handleMessage);
          
          toast({
            title: "Connection Failed",
            description: event.data.error || "Failed to connect Outlook Calendar",
            variant: "destructive",
          });
        }
      };

      window.addEventListener('message', handleMessage);
      
      // Clean up listener if window is closed manually
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
        }
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.response?.data?.error || "Failed to get Outlook authorization URL",
        variant: "destructive",
      });
    },
  });

  // Disconnect from Outlook
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete('/outlook-calendar/disconnect');
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Outlook Calendar Disconnected",
        description: "Your Outlook Calendar has been disconnected.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['outlook-calendar-status'] });
      onDisconnected?.();
    },
    onError: (error: any) => {
      toast({
        title: "Disconnection Failed",
        description: error.response?.data?.error || "Failed to disconnect Outlook Calendar",
        variant: "destructive",
      });
    },
  });

  const handleConnect = () => {
    setIsConnecting(true);
    connectMutation.mutate();
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };

  if (statusLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <span>Checking Outlook Calendar status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <CardTitle>Outlook Calendar</CardTitle>
          </div>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Connected" : "Not Connected"}
          </Badge>
        </div>
        <CardDescription>
          Connect your Outlook Calendar to sync events and create new ones
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isConnected ? (
          <div className="space-y-3">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Outlook Calendar is connected and ready to sync.
                {account?.lastSyncAt && (
                  <span className="block text-sm text-muted-foreground mt-1">
                    Last synced: {new Date(account.lastSyncAt).toLocaleString()}
                  </span>
                )}
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
                className="flex-1"
              >
                {disconnectMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Disconnect
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => refetchStatus()}
                disabled={statusLoading}
              >
                <RefreshCw className={`h-4 w-4 ${statusLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                Connect your Outlook Calendar to automatically sync events and create new ones directly from SyncScript.
              </AlertDescription>
            </Alert>
            
            <Button
              onClick={handleConnect}
              disabled={connectMutation.isPending || isConnecting}
              className="w-full"
            >
              {connectMutation.isPending || isConnecting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect Outlook Calendar
                </>
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              You'll be redirected to Microsoft to authorize the connection
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
