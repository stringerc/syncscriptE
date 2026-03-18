import {
  buildThreadContextBindingContract,
  type ThreadContextType,
} from './thread-context-binding';

export type DomainTab =
  | 'dashboard'
  | 'tasks'
  | 'goals'
  | 'calendar'
  | 'financials'
  | 'email'
  | 'enterprise'
  | 'ai';

export interface AIRouteContext {
  type?: string;
  domainTab?: DomainTab;
  workspaceId?: string;
  enterpriseId?: string;
  agentId?: string;
  agentName?: string;
  teamName?: string;
  projectId?: string;
  goalId?: string;
  taskId?: string;
  workstreamId?: string;
  contextType?: ThreadContextType;
  threadId?: string;
  source?: 'in-app' | 'discord' | 'api';
}

const DEFAULT_TAB_AGENT: Record<DomainTab, { id: string; name: string }> = {
  dashboard: { id: 'nexus', name: 'Nexus' },
  tasks: { id: 'tasks-agent', name: 'Tasks Agent' },
  goals: { id: 'goals-agent', name: 'Goals Agent' },
  calendar: { id: 'calendar-agent', name: 'Calendar Agent' },
  financials: { id: 'financials-agent', name: 'Financials Agent' },
  email: { id: 'email-agent', name: 'Email Agent' },
  enterprise: { id: 'mission', name: 'Mission Control' },
  ai: { id: 'nexus', name: 'Nexus' },
};

export function resolveDefaultAgentForTab(tab: DomainTab): { id: string; name: string } {
  return DEFAULT_TAB_AGENT[tab] || DEFAULT_TAB_AGENT.dashboard;
}

function inferContextType(route: AIRouteContext): ThreadContextType {
  if (route.contextType) return route.contextType;
  if (route.workstreamId) return 'workstream';
  if (route.taskId) return 'task';
  if (route.goalId) return 'goal';
  if (route.projectId) return 'project';
  return 'general';
}

export function normalizeRouteContext(route: AIRouteContext | null | undefined): AIRouteContext | null {
  if (!route) return null;
  const domainTab = route.domainTab || 'dashboard';
  const defaultAgent = resolveDefaultAgentForTab(domainTab);
  const workspaceId = route.workspaceId || 'default';
  const agentId = route.agentId || defaultAgent.id;
  const contextType = inferContextType(route);
  const bindingSeed = route.threadId || `${agentId}:${workspaceId}`;
  const bindingContract = buildThreadContextBindingContract({
    threadId: bindingSeed,
    contextType,
    projectId: route.projectId,
    goalId: route.goalId,
    taskId: route.taskId,
    workstreamId: route.workstreamId,
  });
  const bindingContextType = bindingContract.decision.allowed ? bindingContract.contextType : 'general';
  const fallbackThreadId = `${agentId}:${workspaceId}:${bindingContract.bindingKey}`;
  return {
    ...route,
    domainTab,
    workspaceId,
    source: route.source || 'in-app',
    agentId,
    agentName: route.agentName || defaultAgent.name,
    contextType: bindingContextType,
    threadId: route.threadId || fallbackThreadId,
  };
}

export function buildRoutePrefix(route: AIRouteContext | null | undefined): string {
  const normalized = normalizeRouteContext(route);
  if (!normalized) return '';
  return [
    `Route this request in SyncScript context:`,
    `tab="${normalized.domainTab}"`,
    `agentId="${normalized.agentId}"`,
    `agentName="${normalized.agentName}"`,
    `workspaceId="${normalized.workspaceId}"`,
    normalized.enterpriseId ? `enterpriseId="${normalized.enterpriseId}"` : '',
    normalized.projectId ? `projectId="${normalized.projectId}"` : '',
    normalized.goalId ? `goalId="${normalized.goalId}"` : '',
    normalized.taskId ? `taskId="${normalized.taskId}"` : '',
    normalized.workstreamId ? `workstreamId="${normalized.workstreamId}"` : '',
    normalized.contextType ? `contextType="${normalized.contextType}"` : '',
    normalized.threadId ? `threadId="${normalized.threadId}"` : '',
    normalized.teamName ? `teamName="${normalized.teamName}"` : '',
    `source="${normalized.source}"`,
  ]
    .filter(Boolean)
    .join(' ');
}

export function routeContextFromPath(pathname: string): AIRouteContext {
  const path = pathname.toLowerCase();
  if (path.includes('/tasks') || path.includes('/goals')) return { domainTab: path.includes('/goals') ? 'goals' : 'tasks' };
  if (path.includes('/calendar')) return { domainTab: 'calendar' };
  if (path.includes('/financial')) return { domainTab: 'financials' };
  if (path.includes('/email')) return { domainTab: 'email' };
  if (path.includes('/enterprise')) return { domainTab: 'enterprise' };
  if (path.includes('/agents') || path.includes('/ai')) return { domainTab: 'ai' };
  return { domainTab: 'dashboard' };
}

function readQuotedField(routeKey: string, field: string): string | null {
  const pattern = new RegExp(`${field}="([^"]+)"`);
  const match = routeKey.match(pattern);
  return match?.[1] ? String(match[1]) : null;
}

export function routeContextFromRouteKey(routeKey: string): AIRouteContext | null {
  const raw = String(routeKey || '');
  if (!raw) return null;
  const domainTab = readQuotedField(raw, 'tab') as DomainTab | null;
  const agentId = readQuotedField(raw, 'agentId');
  const agentName = readQuotedField(raw, 'agentName');
  const workspaceId = readQuotedField(raw, 'workspaceId');
  const enterpriseId = readQuotedField(raw, 'enterpriseId');
  const projectId = readQuotedField(raw, 'projectId');
  const goalId = readQuotedField(raw, 'goalId');
  const taskId = readQuotedField(raw, 'taskId');
  const workstreamId = readQuotedField(raw, 'workstreamId');
  const contextType = readQuotedField(raw, 'contextType') as ThreadContextType | null;
  const threadId = readQuotedField(raw, 'threadId');
  const teamName = readQuotedField(raw, 'teamName');
  const source = (readQuotedField(raw, 'source') as AIRouteContext['source']) || 'in-app';
  return normalizeRouteContext({
    domainTab: (domainTab || 'dashboard') as DomainTab,
    agentId: agentId || undefined,
    agentName: agentName || undefined,
    workspaceId: workspaceId || undefined,
    enterpriseId: enterpriseId || undefined,
    projectId: projectId || undefined,
    goalId: goalId || undefined,
    taskId: taskId || undefined,
    workstreamId: workstreamId || undefined,
    contextType: contextType || undefined,
    threadId: threadId || undefined,
    teamName: teamName || undefined,
    source,
  });
}

export function routeContextFromUrl(pathname: string, search: string): AIRouteContext {
  const fallback = routeContextFromPath(pathname);
  const params = new URLSearchParams(search || '');
  const routeKey = params.get('routeKey');
  if (routeKey) {
    const parsed = routeContextFromRouteKey(routeKey);
    if (parsed) return parsed;
  }
  const tab = params.get('tab') as DomainTab | null;
  const agent = params.get('agent');
  const workspace = params.get('workspace');
  const source = params.get('surface');
  const thread = params.get('thread');
  const project = params.get('project');
  const goal = params.get('goal');
  const task = params.get('task');
  const workstream = params.get('workstream');
  const contextType = params.get('contextType') as ThreadContextType | null;
  const normalized = normalizeRouteContext({
    ...fallback,
    domainTab: tab || fallback.domainTab,
    agentId: agent || undefined,
    workspaceId: workspace || undefined,
    projectId: project || undefined,
    goalId: goal || undefined,
    taskId: task || undefined,
    workstreamId: workstream || undefined,
    contextType: contextType || undefined,
    threadId: thread || undefined,
    source: source === 'discord' || source === 'api' ? source : 'in-app',
  });
  return normalized || fallback;
}

export function buildAgentDeepLink(route: AIRouteContext | null | undefined, origin?: string): string {
  const normalized = normalizeRouteContext(route);
  if (!normalized) return '/agents';
  const params = new URLSearchParams();
  params.set('tab', normalized.domainTab || 'dashboard');
  params.set('agent', normalized.agentId || 'nexus');
  params.set('workspace', normalized.workspaceId || 'default');
  if (normalized.projectId) params.set('project', normalized.projectId);
  if (normalized.goalId) params.set('goal', normalized.goalId);
  if (normalized.taskId) params.set('task', normalized.taskId);
  if (normalized.workstreamId) params.set('workstream', normalized.workstreamId);
  if (normalized.contextType) params.set('contextType', normalized.contextType);
  params.set('thread', normalized.threadId || `${normalized.agentId || 'nexus'}:${normalized.workspaceId || 'default'}`);
  params.set('surface', normalized.source || 'in-app');
  const value = `/agents?${params.toString()}`;
  if (!origin) return value;
  return `${origin}${value}`;
}
