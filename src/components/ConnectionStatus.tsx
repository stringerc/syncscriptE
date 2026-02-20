/**
 * ConnectionStatus - Shows service health in the sidebar
 * 
 * Displays a small indicator dot that shows:
 * - Green: All services connected (Supabase + OpenClaw)
 * - Yellow: Some services degraded (partial connectivity)
 * - Red: Offline mode (no backend connectivity)
 * 
 * Hovering shows details about each service.
 */

import { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { supabaseUrl } from '../utils/supabase/info';

type ServiceStatus = 'connected' | 'degraded' | 'offline';

interface ServiceHealth {
  supabase: ServiceStatus;
  ai: ServiceStatus;
  overall: ServiceStatus;
  lastChecked: Date;
}

const SUPABASE_URL = supabaseUrl;
const CHECK_INTERVAL = 60000; // Check every 60 seconds

export function ConnectionStatus() {
  const [health, setHealth] = useState<ServiceHealth>({
    supabase: 'connected',
    ai: 'degraded',
    overall: 'connected',
    lastChecked: new Date(),
  });
  const [showTooltip, setShowTooltip] = useState(false);

  const checkServices = useCallback(async () => {
    const newHealth: ServiceHealth = {
      supabase: 'offline',
      ai: 'offline',
      overall: 'offline',
      lastChecked: new Date(),
    };

    // Check Supabase health
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${SUPABASE_URL}/functions/v1/make-server-57781ad9/health`, {
        signal: controller.signal,
        method: 'GET',
      });
      clearTimeout(timeout);
      newHealth.supabase = response.ok ? 'connected' : 'degraded';
    } catch {
      // Check if we at least have internet
      newHealth.supabase = navigator.onLine ? 'degraded' : 'offline';
    }

    // Check AI service (OpenClaw bridge)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${SUPABASE_URL}/functions/v1/make-server-57781ad9/openclaw/health`, {
        signal: controller.signal,
        method: 'GET',
      });
      clearTimeout(timeout);
      newHealth.ai = response.ok ? 'connected' : 'degraded';
    } catch {
      newHealth.ai = navigator.onLine ? 'degraded' : 'offline';
    }

    // Calculate overall status
    if (newHealth.supabase === 'connected' && newHealth.ai === 'connected') {
      newHealth.overall = 'connected';
    } else if (newHealth.supabase === 'offline' && newHealth.ai === 'offline') {
      newHealth.overall = 'offline';
    } else {
      newHealth.overall = 'degraded';
    }

    setHealth(newHealth);
  }, []);

  // Check on mount and periodically
  useEffect(() => {
    checkServices();
    const interval = setInterval(checkServices, CHECK_INTERVAL);
    
    // Also listen for online/offline events
    const handleOnline = () => checkServices();
    const handleOffline = () => {
      setHealth(prev => ({
        ...prev,
        supabase: 'offline',
        ai: 'offline',
        overall: 'offline',
        lastChecked: new Date(),
      }));
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkServices]);

  const statusColors = {
    connected: 'bg-emerald-400',
    degraded: 'bg-yellow-400',
    offline: 'bg-red-400',
  };

  const statusLabels = {
    connected: 'All systems operational',
    degraded: 'Some services limited',
    offline: 'Offline mode',
  };

  const serviceLabel = (status: ServiceStatus) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'degraded': return 'Limited';
      case 'offline': return 'Offline';
    }
  };

  const StatusIcon = health.overall === 'connected' ? Wifi : 
                     health.overall === 'degraded' ? AlertTriangle : WifiOff;

  return (
    <div 
      className="relative flex items-center justify-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Status dot */}
      <div className="flex items-center gap-1.5 cursor-help">
        <div className={`w-2 h-2 rounded-full ${statusColors[health.overall]} ${health.overall === 'degraded' ? 'animate-pulse' : ''}`} />
        <span className="hidden lg:block text-[10px] text-gray-500">
          {health.overall === 'connected' ? 'Online' : health.overall === 'degraded' ? 'Limited' : 'Offline'}
        </span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[#1e2128] border border-gray-700 rounded-lg p-3 shadow-xl z-50">
          <div className="flex items-center gap-2 mb-2">
            <StatusIcon className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-medium text-white">{statusLabels[health.overall]}</span>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400">Backend</span>
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${statusColors[health.supabase]}`} />
                <span className="text-[10px] text-gray-300">{serviceLabel(health.supabase)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400">AI Engine</span>
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${statusColors[health.ai]}`} />
                <span className="text-[10px] text-gray-300">{serviceLabel(health.ai)}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-2 pt-2 border-t border-gray-700/50">
            <span className="text-[9px] text-gray-500">
              Last checked: {health.lastChecked.toLocaleTimeString()}
            </span>
          </div>
          
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="w-2 h-2 bg-[#1e2128] border-b border-r border-gray-700 rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
}
