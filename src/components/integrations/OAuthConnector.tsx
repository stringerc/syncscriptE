import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Link2, Check, X, AlertCircle, RefreshCw, Settings, Loader2,
  Calendar, MessageSquare, ExternalLink, Lock, Zap, Activity
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Switch } from '../ui/switch';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface OAuthProvider {
  id: string;
  name: string;
  type: 'calendar' | 'communication';
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  description: string;
  scopes: string[];
  features: string[];
}

interface ConnectionStatus {
  connected: boolean;
  lastSync?: string;
  status?: 'active' | 'syncing' | 'warning' | 'error';
  dataPoints?: number;
  accountInfo?: {
    email?: string;
    name?: string;
  };
}

interface OAuthConnectorProps {
  provider: OAuthProvider;
  onConnectionChange?: (connected: boolean) => void;
}

export function OAuthConnector({ provider, onConnectionChange }: OAuthConnectorProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>({ connected: false });
  const [showSettings, setShowSettings] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [syncFrequency, setSyncFrequency] = useState<'realtime' | '5min' | '15min' | '1hour'>('15min');

  // Load connection status on mount
  useEffect(() => {
    loadConnectionStatus();
  }, [provider.id]);

  // Listen for OAuth callback
  useEffect(() => {
    const handleOAuthCallback = (event: MessageEvent) => {
      if (event.data?.type === 'oauth-callback' && event.data?.provider === provider.id) {
        if (event.data.success) {
          toast.success(`${provider.name} connected successfully!`);
          loadConnectionStatus();
          onConnectionChange?.(true);
        } else {
          toast.error(`Failed to connect ${provider.name}: ${event.data.error}`);
        }
        setIsConnecting(false);
      }
    };

    window.addEventListener('message', handleOAuthCallback);
    return () => window.removeEventListener('message', handleOAuthCallback);
  }, [provider.id, provider.name, onConnectionChange]);

  const loadConnectionStatus = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/integrations/${provider.id}/status`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        
        // Load settings if connected
        if (data.connected) {
          const settingsResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/integrations/${provider.id}/settings`,
            {
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
              }
            }
          );
          
          if (settingsResponse.ok) {
            const settings = await settingsResponse.json();
            setAutoSync(settings.autoSync ?? true);
            setSyncFrequency(settings.syncFrequency ?? '15min');
          }
        }
      }
    } catch (error) {
      console.error(`Failed to load ${provider.name} connection status:`, error);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Request OAuth authorization URL
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/integrations/${provider.id}/authorize`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            scopes: provider.scopes,
            redirectUri: `${window.location.origin}/oauth-callback`
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get authorization URL');
      }

      const { authUrl, state } = await response.json();

      // Store state for verification
      sessionStorage.setItem(`oauth-state-${provider.id}`, state);

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      window.open(
        authUrl,
        `${provider.name} OAuth`,
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      toast.info(`Opening ${provider.name} authorization...`);
    } catch (error) {
      console.error(`Failed to initiate ${provider.name} OAuth:`, error);
      toast.error(`Failed to connect to ${provider.name}`);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm(`Are you sure you want to disconnect ${provider.name}? All synced data will be preserved, but automatic syncing will stop.`)) {
      return;
    }

    setIsDisconnecting(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/integrations/${provider.id}/disconnect`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to disconnect integration');
      }

      setStatus({ connected: false });
      toast.success(`${provider.name} disconnected successfully`);
      onConnectionChange?.(false);
    } catch (error) {
      console.error(`Failed to disconnect ${provider.name}:`, error);
      toast.error(`Failed to disconnect ${provider.name}`);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSync = async () => {
    try {
      toast.info(`Syncing ${provider.name}...`);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/integrations/${provider.id}/sync`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const result = await response.json();
      toast.success(`Synced ${result.count || 0} items from ${provider.name}`);
      loadConnectionStatus();
    } catch (error) {
      console.error(`Failed to sync ${provider.name}:`, error);
      toast.error(`Failed to sync ${provider.name}`);
    }
  };

  const handleSettingsChange = async (key: string, value: any) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/integrations/${provider.id}/settings`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ [key]: value })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      toast.success('Settings updated');
      
      if (key === 'autoSync') setAutoSync(value);
      if (key === 'syncFrequency') setSyncFrequency(value);
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const getStatusBadge = () => {
    if (!status.connected) {
      return <Badge variant="secondary" className="bg-gray-800 text-gray-400">Disconnected</Badge>;
    }

    switch (status.status) {
      case 'active':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Active</Badge>;
      case 'syncing':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" /> Syncing
        </Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Warning
        </Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 flex items-center gap-1">
          <X className="w-3 h-3" /> Error
        </Badge>;
      default:
        return <Badge variant="secondary">Connected</Badge>;
    }
  };

  const getSyncFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'realtime': return 'Real-time (webhook)';
      case '5min': return 'Every 5 minutes';
      case '15min': return 'Every 15 minutes';
      case '1hour': return 'Every hour';
      default: return freq;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${provider.bgColor}`}>
            <provider.icon className={`w-6 h-6 ${provider.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-white">{provider.name}</h3>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-gray-400">{provider.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status.connected && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSync}
                className="text-gray-400 hover:text-white"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="text-gray-400 hover:text-white"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </>
          )}
          
          {status.connected ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Disconnect
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleConnect}
              disabled={isConnecting}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isConnecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Link2 className="w-4 h-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Connection info */}
      {status.connected && status.accountInfo && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-gray-800/50 rounded-lg">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-gray-300">
            Connected as <span className="text-white font-medium">{status.accountInfo.email || status.accountInfo.name}</span>
          </span>
        </div>
      )}

      {/* Features */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 uppercase mb-2 font-semibold">Features</p>
        <div className="flex flex-wrap gap-2">
          {provider.features.map((feature, idx) => (
            <Badge key={idx} variant="outline" className="bg-gray-800/50 text-gray-300 border-gray-700">
              {feature}
            </Badge>
          ))}
        </div>
      </div>

      {/* Stats */}
      {status.connected && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-800/30 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Last Sync</div>
            <div className="text-sm text-white font-medium">{status.lastSync || 'Never'}</div>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Data Points</div>
            <div className="text-sm text-white font-medium">{status.dataPoints?.toLocaleString() || 0}</div>
          </div>
        </div>
      )}

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && status.connected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-800 pt-4 mt-4 space-y-4"
          >
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Sync Settings
            </h4>

            {/* Auto-sync toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Auto-sync</p>
                <p className="text-xs text-gray-500">Automatically sync data in the background</p>
              </div>
              <Switch
                checked={autoSync}
                onCheckedChange={(checked) => handleSettingsChange('autoSync', checked)}
              />
            </div>

            {/* Sync frequency */}
            {autoSync && (
              <div>
                <p className="text-sm text-white mb-2">Sync Frequency</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['realtime', '5min', '15min', '1hour'] as const).map((freq) => (
                    <button
                      key={freq}
                      onClick={() => handleSettingsChange('syncFrequency', freq)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        syncFrequency === freq
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {getSyncFrequencyLabel(freq)}
                    </button>
                  ))}
                </div>
                {syncFrequency === 'realtime' && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-yellow-400" />
                    Real-time sync uses webhooks for instant updates
                  </p>
                )}
              </div>
            )}

            {/* Advanced options */}
            <div className="pt-2 border-t border-gray-800">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-gray-400 hover:text-white"
                onClick={() => window.open(`https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/integrations/${provider.id}/permissions`, '_blank')}
              >
                <Lock className="w-4 h-4 mr-2" />
                Manage Permissions
                <ExternalLink className="w-3 h-3 ml-auto" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Predefined providers
export const OAUTH_PROVIDERS: Record<string, OAuthProvider> = {
  google_calendar: {
    id: 'google_calendar',
    name: 'Google Calendar',
    type: 'calendar',
    icon: Calendar,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    description: 'Sync events and tasks with Google Calendar',
    scopes: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events'
    ],
    features: ['Two-way sync', 'Event creation', 'Reminders', 'Attendees']
  },
  outlook_calendar: {
    id: 'outlook_calendar',
    name: 'Outlook Calendar',
    type: 'calendar',
    icon: Calendar,
    color: 'text-blue-600',
    bgColor: 'bg-blue-600/10',
    description: 'Sync events with Microsoft Outlook',
    scopes: [
      'Calendars.Read',
      'Calendars.ReadWrite',
      'offline_access'
    ],
    features: ['Two-way sync', 'Event creation', 'Categories', 'Recurring events']
  },
  slack: {
    id: 'slack',
    name: 'Slack',
    type: 'communication',
    icon: MessageSquare,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    description: 'Team communication and notifications',
    scopes: [
      'channels:read',
      'chat:write',
      'users:read',
      'im:write'
    ],
    features: ['Status sync', 'Notifications', 'Task creation', 'Reminders']
  }
};
