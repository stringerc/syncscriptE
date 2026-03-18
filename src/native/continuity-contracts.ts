export type Surface = 'web' | 'mobile-pwa' | 'ios-shell' | 'watch-quick-path';

export interface ContinuityEnvelope {
  version: '2026-02-27';
  workspaceId: string;
  routeKey: string;
  threadId: string;
  agentId: string;
  sourceSurface: Surface;
  handoffToken?: string;
  timestamp: string;
}

export interface WatchQuickAction {
  id: 'continue-agent' | 'capture-task' | 'schedule-smart-event';
  title: string;
  deepLink: string;
  routeKey: string;
}

export interface SmartEventDraftContract {
  title: string;
  objective: string;
  stepCount: number;
  startAt: string;
  workspaceId: string;
}

export const NATIVE_CONTINUITY_ROUTES = {
  handoff: '/handoff/:token',
  agent: '/agents?agent=:agentId&workspace=:workspaceId&surface=:surface',
  smartEvent: '/enterprise?composer=smart-event&workspace=:workspaceId',
} as const;
