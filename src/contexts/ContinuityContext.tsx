import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useAuth } from './AuthContext';
import { useAIInsightsRouting } from './AIInsightsRoutingContext';
import { buildAgentDeepLink, buildRoutePrefix, normalizeRouteContext, routeContextFromUrl } from '../utils/ai-route';
import { buildAppSchemeLink } from '../utils/native-link';
import { listQueuedOps, markOpAcked, markOpFailed, markOpSent, pruneAckedOps, queueOpLog } from '../pwa/offline-oplog';
import { nativeBridge } from '../native/ios-watch-scaffold';
import type { ContinuityEnvelope } from '../native/continuity-contracts';
import { getHeartbeatIntervalMs, shouldRunHeartbeatTick } from '../utils/perf-heartbeat';

interface ContinuityState {
  activeRouteKey: string;
  lastSeenAt: string;
  deviceLabel: string;
  activeDevices: Array<{ deviceLabel: string; routeKey: string; seenAt: string }>;
}

interface ContinuitySecurityPolicy {
  requireTrustedDeviceForHandoff: boolean;
  requireCriticalApproval: boolean;
  trustedDevices: string[];
  watchProfile: 'generic' | 'series3';
}

interface ContinuityContextValue {
  continuity: ContinuityState;
  securityPolicy: ContinuitySecurityPolicy;
  createHandoffLink: () => Promise<string | null>;
  createWatchQuickActions: () => Promise<Array<{ id: string; title: string; deepLink: string; routeKey: string }>>;
  updateSecurityPolicy: (patch: Partial<ContinuitySecurityPolicy>) => Promise<void>;
  trustCurrentDevice: (trusted: boolean) => Promise<void>;
  queueAgentAction: (payload: { routeKey: string; prompt: string }) => Promise<void>;
}

const ContinuityContext = createContext<ContinuityContextValue | null>(null);

const BROADCAST_KEY = 'syncscript-continuity';
const DEVICE_LABEL_KEY = 'syncscript-device-label';

function getDeviceLabel(): string {
  try {
    const cached = localStorage.getItem(DEVICE_LABEL_KEY);
    if (cached) return cached;
  } catch {
    // ignore
  }
  const candidate = `${navigator.platform || 'web'}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    localStorage.setItem(DEVICE_LABEL_KEY, candidate);
  } catch {
    // ignore
  }
  return candidate;
}

export function ContinuityProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, accessToken } = useAuth();
  const { routeContext } = useAIInsightsRouting();
  const deviceLabelRef = useRef(getDeviceLabel());
  const channelRef = useRef<BroadcastChannel | null>(null);
  const realtimeRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient(`https://${projectId}.supabase.co`, publicAnonKey));

  const initialRoute = normalizeRouteContext(routeContext || routeContextFromUrl(location.pathname, location.search));
  const [continuity, setContinuity] = useState<ContinuityState>({
    activeRouteKey: buildRoutePrefix(initialRoute),
    lastSeenAt: new Date().toISOString(),
    deviceLabel: deviceLabelRef.current,
    activeDevices: [],
  });
  const [securityPolicy, setSecurityPolicy] = useState<ContinuitySecurityPolicy>({
    requireTrustedDeviceForHandoff: false,
    requireCriticalApproval: true,
    trustedDevices: [],
    watchProfile: 'generic',
  });
  const isGuestSession = Boolean(
    user?.isGuest
    || String(accessToken || '').startsWith('gst_')
    || String(user?.id || '').startsWith('guest_'),
  );

  const setContinuityState = useCallback((nextRouteKey: string) => {
    const next: ContinuityState = {
      activeRouteKey: nextRouteKey,
      lastSeenAt: new Date().toISOString(),
      deviceLabel: deviceLabelRef.current,
      activeDevices: [],
    };
    setContinuity(next);
    try {
      localStorage.setItem(BROADCAST_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    channelRef.current?.postMessage(next);
    const channel = realtimeRef.current;
    if (channel) {
      void channel.send({
        type: 'broadcast',
        event: 'route-update',
        payload: next,
      });
    }
  }, []);

  useEffect(() => {
    channelRef.current = new BroadcastChannel(BROADCAST_KEY);
    const onMessage = (event: MessageEvent<ContinuityState>) => {
      const incoming = event.data;
      if (!incoming?.activeRouteKey) return;
      if (incoming.deviceLabel === deviceLabelRef.current) return;
      setContinuity((prev) => (
        incoming.lastSeenAt > prev.lastSeenAt ? { ...prev, ...incoming } : prev
      ));
    };
    channelRef.current.addEventListener('message', onMessage);
    return () => {
      channelRef.current?.removeEventListener('message', onMessage);
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!user?.id || isGuestSession) return;
    const channel = supabaseRef.current.channel(`continuity:${user.id}`, {
      config: {
        broadcast: { self: false },
      },
    });
    realtimeRef.current = channel;
    channel.on('broadcast', { event: 'route-update' }, ({ payload }) => {
      const incoming = payload as ContinuityState;
      if (!incoming?.activeRouteKey || incoming.deviceLabel === deviceLabelRef.current) return;
      setContinuity((prev) => (incoming.lastSeenAt > prev.lastSeenAt ? { ...prev, ...incoming } : prev));
    });
    channel.subscribe();
    return () => {
      realtimeRef.current = null;
      void channel.unsubscribe();
    };
  }, [isGuestSession, user?.id]);

  useEffect(() => {
    const current = normalizeRouteContext(routeContext || routeContextFromUrl(location.pathname, location.search));
    setContinuityState(buildRoutePrefix(current));
  }, [location.pathname, location.search, routeContext, setContinuityState]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!shouldRunHeartbeatTick()) return;
      setContinuity((prev) => ({ ...prev, lastSeenAt: new Date().toISOString() }));
    }, getHeartbeatIntervalMs('local'));
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user?.id || isGuestSession) return;
    const heartbeat = async () => {
      if (!shouldRunHeartbeatTick({ requireOnline: true })) return;
      const token = accessToken || publicAnonKey;
      try {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/openclaw/continuity/presence`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            workspaceId: 'default',
            routeKey: continuity.activeRouteKey,
            deviceLabel: deviceLabelRef.current,
          }),
        });
        if (!response.ok) return;
        const json = await response.json();
        const devices = Array.isArray(json?.devices) ? json.devices : [];
        setContinuity((prev) => ({ ...prev, activeDevices: devices.slice(-10) }));
      } catch {
        // ignore transient heartbeat errors
      }
    };
    void heartbeat();
    const timer = window.setInterval(() => {
      void heartbeat();
    }, getHeartbeatIntervalMs('presence'));

    const onVisibilityChange = () => {
      if (shouldRunHeartbeatTick({ requireOnline: true })) {
        void heartbeat();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [accessToken, continuity.activeRouteKey, isGuestSession, user?.id]);

  useEffect(() => {
    if (!user?.id || isGuestSession) return;
    const loadPolicy = async () => {
      const token = accessToken || publicAnonKey;
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/openclaw/continuity/security-policy?userId=${encodeURIComponent(user.id)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );
        if (!response.ok) return;
        const json = await response.json();
        const policy = json?.policy;
        if (!policy || typeof policy !== 'object') return;
        setSecurityPolicy({
          requireTrustedDeviceForHandoff: Boolean(policy.requireTrustedDeviceForHandoff),
          requireCriticalApproval: Boolean(policy.requireCriticalApproval),
          trustedDevices: Array.isArray(policy.trustedDevices) ? policy.trustedDevices.map((value: unknown) => String(value || '')) : [],
          watchProfile: policy.watchProfile === 'series3' ? 'series3' : 'generic',
        });
      } catch {
        // ignore policy fetch issues
      }
    };
    void loadPolicy();
  }, [accessToken, isGuestSession, user?.id]);

  const createHandoffLink = useCallback(async (): Promise<string | null> => {
    if (!user?.id) return null;
    const token = accessToken || publicAnonKey;
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/openclaw/continuity/handoff-token`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        deviceLabel: deviceLabelRef.current,
        routeKey: continuity.activeRouteKey,
      }),
    });
    if (!response.ok) return null;
    const json = await response.json();
    const tokenValue = String(json?.token || '');
    if (!tokenValue) return null;
    return `${window.location.origin}/handoff/${tokenValue}`;
  }, [accessToken, continuity.activeRouteKey, user?.id]);

  const createWatchQuickActions = useCallback(async () => {
    const handoff = await createHandoffLink();
    if (!handoff) return [];
    const currentRoute = routeContextFromUrl(location.pathname, location.search);
    const continueLinkWeb = buildAgentDeepLink(currentRoute, window.location.origin);
    const smartEventLinkWeb = `${window.location.origin}/enterprise?composer=smart-event&workspace=default&surface=watch-quick-path`;
    const continueLink = buildAppSchemeLink(continueLinkWeb, window.location.origin);
    const handoffAppLink = buildAppSchemeLink(handoff, window.location.origin);
    const smartEventLink = buildAppSchemeLink(smartEventLinkWeb, window.location.origin);
    const actions = [
      {
        id: 'continue-agent',
        title: 'Continue Agent',
        deepLink: handoffAppLink,
        routeKey: continuity.activeRouteKey,
      },
      {
        id: 'capture-task',
        title: 'Capture Task',
        deepLink: `${continueLink}&watch_action=capture-task`,
        routeKey: continuity.activeRouteKey,
      },
      ...(securityPolicy.watchProfile === 'series3'
        ? []
        : [{
        id: 'schedule-smart-event',
        title: 'Schedule Smart Event',
        deepLink: smartEventLink,
        routeKey: continuity.activeRouteKey,
      }]),
    ];
    await nativeBridge.registerWatchQuickActions(actions);
    return actions;
  }, [continuity.activeRouteKey, createHandoffLink, location.pathname, location.search, securityPolicy.watchProfile]);

  useEffect(() => {
    const parsed = routeContextFromUrl(location.pathname, location.search);
    const envelope: ContinuityEnvelope = {
      version: '2026-02-27',
      workspaceId: parsed.workspaceId || 'default',
      routeKey: continuity.activeRouteKey,
      threadId: parsed.threadId || `${parsed.agentId || 'nexus'}:${parsed.workspaceId || 'default'}`,
      agentId: parsed.agentId || 'nexus',
      sourceSurface: 'web',
      timestamp: new Date().toISOString(),
    };
    void nativeBridge.publishContinuityEnvelope(envelope);
  }, [continuity.activeRouteKey, location.pathname, location.search]);

  const ingestOpToServer = useCallback(async (item: {
    id: string;
    idempotencyKey: string;
    entity: string;
    routeKey: string;
    payload: Record<string, unknown>;
  }) => {
    if (!user?.id) throw new Error('User is not authenticated');
    const token = accessToken || publicAnonKey;
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/openclaw/continuity/oplog/ingest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        opId: item.id,
        idempotencyKey: item.idempotencyKey,
        entity: item.entity,
        routeKey: item.routeKey,
        payload: item.payload,
      }),
    });
    if (!response.ok) {
      throw new Error(`Server rejected op (${response.status})`);
    }
    const json = await response.json();
    if (!json?.success) {
      throw new Error(String(json?.error || 'Op ingest failed'));
    }
  }, [accessToken, user?.id]);

  const updateSecurityPolicy = useCallback(async (patch: Partial<ContinuitySecurityPolicy>) => {
    if (!user?.id) return;
    const token = accessToken || publicAnonKey;
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/openclaw/continuity/security-policy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        ...patch,
      }),
    });
    if (!response.ok) {
      throw new Error(`Could not update continuity security policy (${response.status})`);
    }
    const json = await response.json();
    const policy = json?.policy;
    setSecurityPolicy({
      requireTrustedDeviceForHandoff: Boolean(policy?.requireTrustedDeviceForHandoff),
      requireCriticalApproval: Boolean(policy?.requireCriticalApproval),
      trustedDevices: Array.isArray(policy?.trustedDevices) ? policy.trustedDevices.map((value: unknown) => String(value || '')) : [],
      watchProfile: policy?.watchProfile === 'series3' ? 'series3' : 'generic',
    });
  }, [accessToken, user?.id]);

  const trustCurrentDevice = useCallback(async (trusted: boolean) => {
    if (!user?.id) return;
    const token = accessToken || publicAnonKey;
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/openclaw/continuity/device-trust`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        deviceLabel: deviceLabelRef.current,
        trust: trusted,
      }),
    });
    if (!response.ok) {
      throw new Error(`Could not update trusted device list (${response.status})`);
    }
    const json = await response.json();
    const policy = json?.policy;
    setSecurityPolicy({
      requireTrustedDeviceForHandoff: Boolean(policy?.requireTrustedDeviceForHandoff),
      requireCriticalApproval: Boolean(policy?.requireCriticalApproval),
      trustedDevices: Array.isArray(policy?.trustedDevices) ? policy.trustedDevices.map((value: unknown) => String(value || '')) : [],
      watchProfile: policy?.watchProfile === 'series3' ? 'series3' : 'generic',
    });
  }, [accessToken, user?.id]);

  const queueAgentAction = useCallback(async (payload: { routeKey: string; prompt: string }) => {
    const op = await queueOpLog({
      entity: 'agent-chat',
      routeKey: payload.routeKey,
      idempotencyKey: crypto.randomUUID(),
      payload: { prompt: payload.prompt },
    });
    if (!navigator.onLine) return;
    try {
      await markOpSent(op.id);
      await ingestOpToServer(op);
      await markOpAcked(op.id);
    } catch (error: any) {
      await markOpFailed(op.id, String(error?.message || 'queue failure'));
    }
  }, [ingestOpToServer]);

  useEffect(() => {
    const flush = async () => {
      if (!navigator.onLine) return;
      const queued = await listQueuedOps(50);
      for (const item of queued) {
        try {
          await markOpSent(item.id);
          await ingestOpToServer(item);
          await markOpAcked(item.id);
        } catch (error: any) {
          await markOpFailed(item.id, String(error?.message || 'replay failure'));
        }
      }
      await pruneAckedOps();
    };
    void flush();
    window.addEventListener('online', flush);
    return () => window.removeEventListener('online', flush);
  }, [ingestOpToServer]);

  const value = useMemo<ContinuityContextValue>(() => ({
    continuity,
    securityPolicy,
    createHandoffLink,
    createWatchQuickActions,
    updateSecurityPolicy,
    trustCurrentDevice,
    queueAgentAction,
  }), [continuity, securityPolicy, createHandoffLink, createWatchQuickActions, updateSecurityPolicy, trustCurrentDevice, queueAgentAction]);

  return (
    <ContinuityContext.Provider value={value}>
      {children}
    </ContinuityContext.Provider>
  );
}

export function useContinuity(): ContinuityContextValue {
  const value = useContext(ContinuityContext);
  if (!value) throw new Error('useContinuity must be used inside ContinuityProvider');
  return value;
}
