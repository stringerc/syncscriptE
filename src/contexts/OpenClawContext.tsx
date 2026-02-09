/**
 * OpenClawContext
 * 
 * App-wide context for OpenClaw AI gateway integration.
 * Provides connection state, configuration, and the chat interface
 * to all components in the tree.
 */

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import {
  loadOpenClawConfig,
  saveOpenClawConfig,
  isConfigValid,
  type OpenClawConfig,
} from '../config/openclaw';
import { OpenClawService, getOpenClawService } from '../services/openclaw-service';
import type { ConnectionStatus } from '../hooks/useOpenClaw';

interface OpenClawContextType {
  /** Current config */
  config: OpenClawConfig;
  /** Update config (persists to localStorage) */
  updateConfig: (updates: Partial<OpenClawConfig>) => void;
  /** Connection status */
  connectionStatus: ConnectionStatus;
  /** Last measured latency */
  latencyMs: number | null;
  /** Last error */
  error: string | null;
  /** Check gateway health */
  checkConnection: () => Promise<boolean>;
  /** Whether OpenClaw is ready to use */
  isAvailable: boolean;
  /** The service instance (for direct use in hooks) */
  service: OpenClawService | null;
}

const OpenClawContext = createContext<OpenClawContextType | undefined>(undefined);

export function OpenClawProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<OpenClawConfig>(loadOpenClawConfig);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [service, setService] = useState<OpenClawService | null>(null);

  // Initialize service when config changes
  useEffect(() => {
    if (isConfigValid(config) && config.enabled) {
      const svc = getOpenClawService(config);
      setService(svc);
    } else {
      setService(null);
      setConnectionStatus('disconnected');
    }
  }, [config]);

  // Auto-check connection on mount (if enabled)
  useEffect(() => {
    if (service && config.enabled) {
      checkConnection();
    }
  }, [service, config.enabled]);

  const updateConfig = useCallback((updates: Partial<OpenClawConfig>) => {
    const newConfig = saveOpenClawConfig(updates);
    setConfig(newConfig);
    setConnectionStatus('disconnected'); // Reset on config change
    setError(null);
  }, []);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!service || !config.enabled) {
      setConnectionStatus('disconnected');
      return false;
    }

    setConnectionStatus('connecting');
    setError(null);

    try {
      const result = await service.healthCheck();
      setLatencyMs(result.latencyMs);

      if (result.ok) {
        setConnectionStatus('connected');
        return true;
      } else {
        setConnectionStatus('error');
        setError(result.error ?? 'Connection failed');
        return false;
      }
    } catch (e) {
      setConnectionStatus('error');
      setError(e instanceof Error ? e.message : 'Connection failed');
      return false;
    }
  }, [service, config.enabled]);

  const isAvailable = connectionStatus === 'connected' && config.enabled;

  return (
    <OpenClawContext.Provider
      value={{
        config,
        updateConfig,
        connectionStatus,
        latencyMs,
        error,
        checkConnection,
        isAvailable,
        service,
      }}
    >
      {children}
    </OpenClawContext.Provider>
  );
}

export function useOpenClawContext() {
  const context = useContext(OpenClawContext);
  if (!context) {
    throw new Error('useOpenClawContext must be used within OpenClawProvider');
  }
  return context;
}
