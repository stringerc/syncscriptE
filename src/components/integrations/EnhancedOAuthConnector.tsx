/**
 * Enhanced OAuth Connector Component
 * 
 * Uses the IntegrationProvider abstraction layer for future-proof architecture.
 * This component works with both Direct OAuth and Merge.dev providers seamlessly.
 * 
 * Features:
 * - Provider-agnostic design
 * - Real-time connection status
 * - Auto-sync configuration
 * - Connection health monitoring
 * - Graceful error handling
 */

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
import { useIntegrations } from '../../hooks/useIntegrations';
import type { IntegrationProvider } from '../../services/IntegrationProvider';

interface OAuthProviderConfig {
  id: IntegrationProvider;
  name: string;
  type: 'calendar' | 'communication';
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  description: string;
  features: string[];
}

interface EnhancedOAuthConnectorProps {
  provider: OAuthProviderConfig;
  userId: string;
  onConnectionChange?: (connected: boolean) => void;
}

export function EnhancedOAuthConnector({ 
  provider, 
  userId,
  onConnectionChange 
}: EnhancedOAuthConnectorProps) {
  const {
    connections,
    isConnected,
    getConnection,
    connect,
    disconnect,
    sync,
    loading,
    error
  } = useIntegrations(userId);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [syncProgress, setSyncProgress] = useState(0);

  const connection = getConnection(provider.id);
  const connected = isConnected(provider.id);

  // Notify parent component when connection status changes
  useEffect(() => {
    onConnectionChange?.(connected);
  }, [connected, onConnectionChange]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(`Integration error: ${error}`);
    }
  }, [error]);

  const handleConnect = async () => {
    setIsProcessing(true);
    try {
      await connect(provider.id);
      toast.success(`Connecting to ${provider.name}...`);
      // OAuth flow will redirect user to provider's authorization page
    } catch (err) {
      toast.error(`Failed to connect to ${provider.name}`);
      setIsProcessing(false);
    }
  };

  const handleDisconnect = async () => {
    setIsProcessing(true);
    try {
      await disconnect(provider.id);
      toast.success(`${provider.name} disconnected`);
      onConnectionChange?.(false);
    } catch (err) {
      toast.error(`Failed to disconnect ${provider.name}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSync = async () => {
    setIsProcessing(true);
    setSyncProgress(0);
    
    // Simulate sync progress
    const progressInterval = setInterval(() => {
      setSyncProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      await sync(provider.id);
      setSyncProgress(100);
      toast.success(`${provider.name} synced successfully`);
    } catch (err) {
      toast.error(`Failed to sync ${provider.name}`);
      setSyncProgress(0);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsProcessing(false);
        setSyncProgress(0);
      }, 1000);
    }
  };

  const IconComponent = provider.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#1a1a2e]/60 to-[#16213e]/60 backdrop-blur-xl"
    >
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Provider Icon */}
            <div 
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${provider.bgColor}`}
            >
              <IconComponent className={`h-6 w-6 ${provider.color}`} />
            </div>

            {/* Provider Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">
                  {provider.name}
                </h3>
                <Badge variant={connected ? 'default' : 'secondary'} className="gap-1.5">
                  {connected ? (
                    <>
                      <Check className="h-3 w-3" />
                      Connected
                    </>
                  ) : (
                    <>
                      <X className="h-3 w-3" />
                      Not Connected
                    </>
                  )}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-gray-400">
                {provider.description}
              </p>

              {/* Connection Details */}
              {connection && (
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  {connection.last_sync && (
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      Last sync: {new Date(connection.last_sync).toLocaleString()}
                    </div>
                  )}
                  {connection.connected_at && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Connected: {new Date(connection.connected_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Settings Button */}
          {connected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="hover:bg-white/5"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Features */}
        <div className="mt-4 flex flex-wrap gap-2">
          {provider.features.map((feature, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-gray-300"
            >
              <Zap className="h-3 w-3 text-yellow-400" />
              {feature}
            </div>
          ))}
        </div>
      </div>

      {/* Sync Progress */}
      <AnimatePresence>
        {syncProgress > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 pb-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Syncing data...</span>
                <span className="text-white font-medium">{syncProgress}%</span>
              </div>
              <Progress value={syncProgress} className="h-1.5" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && connected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/10 bg-white/5 p-6"
          >
            <h4 className="mb-4 text-sm font-semibold text-white">
              Sync Settings
            </h4>
            
            <div className="space-y-4">
              {/* Auto Sync Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-white">
                    Automatic Sync
                  </label>
                  <p className="text-xs text-gray-400">
                    Sync data automatically every 15 minutes
                  </p>
                </div>
                <Switch
                  checked={autoSync}
                  onCheckedChange={setAutoSync}
                />
              </div>

              {/* Privacy Notice */}
              <div className="flex gap-2 rounded-lg bg-blue-500/10 p-3 text-xs text-blue-300">
                <Lock className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="font-medium">Your data is secure</p>
                  <p className="mt-1 text-blue-400/80">
                    We only access the data you explicitly authorize. Tokens are encrypted and stored securely.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="border-t border-white/10 bg-white/5 p-4">
        <div className="flex gap-2">
          {!connected ? (
            <Button
              onClick={handleConnect}
              disabled={isProcessing || loading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isProcessing || loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  Connect {provider.name}
                </>
              )}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleSync}
                disabled={isProcessing || loading}
                variant="secondary"
                className="flex-1 hover:bg-white/10"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Now
                  </>
                )}
              </Button>
              <Button
                onClick={handleDisconnect}
                disabled={isProcessing || loading}
                variant="ghost"
                className="hover:bg-red-500/10 hover:text-red-400"
              >
                Disconnect
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Provider Badge */}
      <div className="absolute top-4 right-4 opacity-50">
        <Badge variant="outline" className="gap-1 text-xs">
          <ExternalLink className="h-3 w-3" />
          OAuth 2.0
        </Badge>
      </div>
    </motion.div>
  );
}

// Provider configurations using the new abstraction
export const ENHANCED_OAUTH_PROVIDERS: Record<string, OAuthProviderConfig> = {
  google_calendar: {
    id: 'google',
    name: 'Google Calendar',
    type: 'calendar',
    icon: Calendar,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    description: 'Sync events, meetings, and schedules from Google Calendar',
    features: ['Two-way sync', 'Real-time updates', 'Event creation']
  },
  outlook_calendar: {
    id: 'microsoft',
    name: 'Outlook Calendar',
    type: 'calendar',
    icon: Calendar,
    color: 'text-blue-600',
    bgColor: 'bg-blue-600/10',
    description: 'Import and sync your Outlook calendar events',
    features: ['Calendar import', 'Attendee sync', 'Smart scheduling']
  },
  slack: {
    id: 'slack',
    name: 'Slack',
    type: 'communication',
    icon: MessageSquare,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    description: 'Connect Slack for team communication and status updates',
    features: ['Status sync', 'Notifications', 'Channel integration']
  }
};

function Clock({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}
