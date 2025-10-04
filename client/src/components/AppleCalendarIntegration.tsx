import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, CheckCircle, XCircle, RefreshCw, Calendar, Apple, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface AppleCalendarIntegrationProps {
  onConnected?: () => void;
  onDisconnected?: () => void;
}

interface Subscription {
  id: string;
  status: string;
  lastSyncAt?: string;
  createdAt: string;
  scopes: string[];
}

export const AppleCalendarIntegration: React.FC<AppleCalendarIntegrationProps> = ({
  onConnected,
  onDisconnected
}) => {
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [icsUrl, setIcsUrl] = useState('');
  const [calendarName, setCalendarName] = useState('');
  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Check connection status
  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['icloud-calendar-status'],
    queryFn: async () => {
      const response = await api.get('/icloud-calendar/status');
      return response.data.data;
    },
    staleTime: 30 * 1000,
  });

  // Get subscriptions
  const { data: subscriptionsData, isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = useQuery({
    queryKey: ['icloud-calendar-subscriptions'],
    queryFn: async () => {
      const response = await api.get('/icloud-calendar/subscriptions');
      return response.data.data;
    },
    enabled: statusData?.connected,
    staleTime: 30 * 1000,
  });

  const isConnected = statusData?.connected || false;
  const subscriptions: Subscription[] = subscriptionsData?.subscriptions || [];

  // Subscribe to ICS feed
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/icloud-calendar/subscribe', {
        icsUrl,
        calendarName: calendarName || 'Apple Calendar'
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Apple Calendar Connected!",
        description: "Successfully subscribed to your Apple/iCloud calendar.",
      });
      
      setIcsUrl('');
      setCalendarName('');
      setShowSubscribeDialog(false);
      queryClient.invalidateQueries({ queryKey: ['icloud-calendar-status'] });
      queryClient.invalidateQueries({ queryKey: ['icloud-calendar-subscriptions'] });
      onConnected?.();
    },
    onError: (error: any) => {
      toast({
        title: "Subscription Failed",
        description: error.response?.data?.error || "Failed to subscribe to Apple/iCloud calendar",
        variant: "destructive",
      });
    },
  });

  // Unsubscribe from ICS feed
  const unsubscribeMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const response = await api.delete(`/icloud-calendar/subscriptions/${subscriptionId}`);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Apple Calendar Disconnected",
        description: "Successfully unsubscribed from Apple/iCloud calendar.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['icloud-calendar-status'] });
      queryClient.invalidateQueries({ queryKey: ['icloud-calendar-subscriptions'] });
      onDisconnected?.();
    },
    onError: (error: any) => {
      toast({
        title: "Unsubscription Failed",
        description: error.response?.data?.error || "Failed to unsubscribe from Apple/iCloud calendar",
        variant: "destructive",
      });
    },
  });

  // Manual sync
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/icloud-calendar/sync');
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Sync Completed",
        description: `Synced ${data.data.syncedCalendars} calendars with ${data.data.totalEvents} events.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['icloud-calendar-subscriptions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.response?.data?.error || "Failed to sync Apple/iCloud calendar",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = () => {
    if (!icsUrl.trim()) {
      toast({
        title: "ICS URL Required",
        description: "Please enter a valid ICS URL",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubscribing(true);
    subscribeMutation.mutate();
  };

  const handleUnsubscribe = (subscriptionId: string) => {
    unsubscribeMutation.mutate(subscriptionId);
  };

  const handleSync = () => {
    syncMutation.mutate();
  };

  if (statusLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <span>Checking Apple Calendar status...</span>
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
            <Apple className="h-5 w-5 text-gray-600" />
            <CardTitle>Apple/iCloud Calendar</CardTitle>
          </div>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? `${subscriptions.length} Connected` : "Not Connected"}
          </Badge>
        </div>
        <CardDescription>
          Subscribe to your Apple/iCloud calendar ICS feeds to sync events
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isConnected ? (
          <div className="space-y-3">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Apple/iCloud Calendar is connected with {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}.
              </AlertDescription>
            </Alert>
            
            {/* Subscriptions List */}
            {subscriptionsLoading ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                <span>Loading subscriptions...</span>
              </div>
            ) : subscriptions.length > 0 ? (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Active Subscriptions:</h4>
                {subscriptions.map((subscription) => (
                  <div key={subscription.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">Apple Calendar</div>
                      <div className="text-xs text-muted-foreground">
                        Connected {new Date(subscription.createdAt).toLocaleDateString()}
                        {subscription.lastSyncAt && (
                          <span className="ml-2">
                            • Last sync: {new Date(subscription.lastSyncAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnsubscribe(subscription.id)}
                      disabled={unsubscribeMutation.isPending}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
            
            <div className="flex gap-2">
              <Dialog open={showSubscribeDialog} onOpenChange={setShowSubscribeDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Calendar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Subscribe to Apple/iCloud Calendar</DialogTitle>
                    <DialogDescription>
                      Enter the ICS URL of your Apple/iCloud calendar to sync events.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="calendarName">Calendar Name</Label>
                      <Input
                        id="calendarName"
                        value={calendarName}
                        onChange={(e) => setCalendarName(e.target.value)}
                        placeholder="My Apple Calendar"
                      />
                    </div>
                    <div>
                      <Label htmlFor="icsUrl">ICS URL</Label>
                      <Input
                        id="icsUrl"
                        value={icsUrl}
                        onChange={(e) => setIcsUrl(e.target.value)}
                        placeholder="https://p123-caldav.icloud.com/published/2/..."
                        type="url"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSubscribe}
                        disabled={subscribeMutation.isPending || isSubscribing}
                        className="flex-1"
                      >
                        {subscribeMutation.isPending || isSubscribing ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            Subscribing...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Subscribe
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowSubscribeDialog(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button
                variant="outline"
                onClick={handleSync}
                disabled={syncMutation.isPending}
              >
                <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                Subscribe to your Apple/iCloud calendar ICS feeds to automatically sync events.
                You'll need the ICS URL from your Apple/iCloud calendar settings.
              </AlertDescription>
            </Alert>
            
            <Dialog open={showSubscribeDialog} onOpenChange={setShowSubscribeDialog}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Subscribe to Apple/iCloud Calendar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Subscribe to Apple/iCloud Calendar</DialogTitle>
                  <DialogDescription>
                    Enter the ICS URL of your Apple/iCloud calendar to sync events.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="calendarName">Calendar Name</Label>
                    <Input
                      id="calendarName"
                      value={calendarName}
                      onChange={(e) => setCalendarName(e.target.value)}
                      placeholder="My Apple Calendar"
                    />
                  </div>
                  <div>
                    <Label htmlFor="icsUrl">ICS URL</Label>
                    <Input
                      id="icsUrl"
                      value={icsUrl}
                      onChange={(e) => setIcsUrl(e.target.value)}
                      placeholder="https://p123-caldav.icloud.com/published/2/..."
                      type="url"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubscribe}
                      disabled={subscribeMutation.isPending || isSubscribing}
                      className="flex-1"
                    >
                      {subscribeMutation.isPending || isSubscribing ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          Subscribing...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Subscribe
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowSubscribeDialog(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <p className="text-xs text-muted-foreground text-center">
              You'll need to get the ICS URL from your Apple/iCloud calendar settings
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
