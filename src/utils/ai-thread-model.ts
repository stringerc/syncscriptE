import { normalizeRouteContext, type AIRouteContext } from './ai-route';

export type ChatThreadType = 'general' | 'project' | 'goal' | 'task' | 'workstream' | 'social';

export interface ChatThreadEnvelope {
  threadId: string;
  threadType: ChatThreadType;
  workspaceId: string;
  routeTab: string;
  agentId: string;
}

function inferThreadType(route: AIRouteContext, message: string): ChatThreadType {
  if (route.workstreamId) return 'workstream';
  if (route.taskId) return 'task';
  if (route.goalId) return 'goal';
  if (route.projectId) return 'project';
  if (/\b(friend|team|collab|social|handoff)\b/i.test(message)) return 'social';
  return 'general';
}

export function buildChatThreadEnvelope(
  message: string,
  routeContext: AIRouteContext | null | undefined,
): ChatThreadEnvelope {
  const normalized = normalizeRouteContext(routeContext) || {
    domainTab: 'ai',
    workspaceId: 'default',
    agentId: 'nexus',
    threadId: 'nexus:default',
  };
  return {
    threadId: normalized.threadId || `${normalized.agentId || 'nexus'}:${normalized.workspaceId || 'default'}`,
    threadType: inferThreadType(normalized, message),
    workspaceId: normalized.workspaceId || 'default',
    routeTab: normalized.domainTab || 'ai',
    agentId: normalized.agentId || 'nexus',
  };
}
