import { buildRoutePrefix, normalizeRouteContext, type AIRouteContext, type DomainTab } from './ai-route';

type AgentRoute = {
  id: string;
  name: string;
  tab: DomainTab;
};

export interface AgentRoutingDecision {
  route: AIRouteContext;
  agent: AgentRoute;
  confidence: number;
  reason: string;
}

const AGENT_BY_ALIAS: Record<string, AgentRoute> = {
  nexus: { id: 'nexus', name: 'Nexus', tab: 'ai' },
  ai: { id: 'nexus', name: 'Nexus', tab: 'ai' },
  email: { id: 'email-agent', name: 'Email Agent', tab: 'email' },
  financials: { id: 'financials-agent', name: 'Financials Agent', tab: 'financials' },
  finance: { id: 'financials-agent', name: 'Financials Agent', tab: 'financials' },
  calendar: { id: 'calendar-agent', name: 'Calendar Agent', tab: 'calendar' },
  tasks: { id: 'tasks-agent', name: 'Tasks Agent', tab: 'tasks' },
  goals: { id: 'goals-agent', name: 'Goals Agent', tab: 'goals' },
  mission: { id: 'mission', name: 'Mission Control', tab: 'enterprise' },
  enterprise: { id: 'mission', name: 'Mission Control', tab: 'enterprise' },
};

const KEYWORD_RULES: Array<{ pattern: RegExp; agent: AgentRoute; confidence: number; reason: string }> = [
  {
    pattern: /\b(email|inbox|reply|outlook|gmail)\b/i,
    agent: AGENT_BY_ALIAS.email,
    confidence: 0.86,
    reason: 'Detected email domain intent.',
  },
  {
    pattern: /\b(calendar|schedule|meeting|timeline)\b/i,
    agent: AGENT_BY_ALIAS.calendar,
    confidence: 0.82,
    reason: 'Detected calendar/scheduling intent.',
  },
  {
    pattern: /\b(financial|budget|invoice|revenue|cash flow|expense)\b/i,
    agent: AGENT_BY_ALIAS.financials,
    confidence: 0.84,
    reason: 'Detected financial planning intent.',
  },
  {
    pattern: /\b(task|todo|action item|priority)\b/i,
    agent: AGENT_BY_ALIAS.tasks,
    confidence: 0.78,
    reason: 'Detected task execution intent.',
  },
  {
    pattern: /\b(goal|milestone|objective|okrs?)\b/i,
    agent: AGENT_BY_ALIAS.goals,
    confidence: 0.78,
    reason: 'Detected goal progress intent.',
  },
  {
    pattern: /\b(mission|runbook|operator|team ops|approval)\b/i,
    agent: AGENT_BY_ALIAS.mission,
    confidence: 0.8,
    reason: 'Detected mission-control intent.',
  },
];

function resolveMentionAgent(message: string): AgentRoute | null {
  const mention = message.match(/@([a-z0-9_-]{2,24})/i)?.[1]?.toLowerCase();
  if (!mention) return null;
  return AGENT_BY_ALIAS[mention] || null;
}

export function routeAgentRequest(message: string, routeContext: AIRouteContext | null | undefined): AgentRoutingDecision {
  const base = normalizeRouteContext(routeContext) || normalizeRouteContext({ domainTab: 'ai', agentId: 'nexus' });
  const fallback: AgentRoute = {
    id: base?.agentId || 'nexus',
    name: base?.agentName || 'Nexus',
    tab: base?.domainTab || 'ai',
  };
  if (!base) {
    return {
      route: { domainTab: fallback.tab, agentId: fallback.id, agentName: fallback.name, source: 'in-app' },
      agent: fallback,
      confidence: 0.5,
      reason: 'Fallback routing (no route context).',
    };
  }

  const mentionAgent = resolveMentionAgent(message);
  if (mentionAgent) {
    return {
      route: normalizeRouteContext({
        ...base,
        domainTab: mentionAgent.tab,
        agentId: mentionAgent.id,
        agentName: mentionAgent.name,
      }) || base,
      agent: mentionAgent,
      confidence: 0.98,
      reason: `Mention-routed via @${mentionAgent.name.toLowerCase().replace(/\s+/g, '-')}.`,
    };
  }

  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(message)) {
      return {
        route: normalizeRouteContext({
          ...base,
          domainTab: rule.agent.tab,
          agentId: rule.agent.id,
          agentName: rule.agent.name,
        }) || base,
        agent: rule.agent,
        confidence: rule.confidence,
        reason: rule.reason,
      };
    }
  }

  return {
    route: base,
    agent: fallback,
    confidence: 0.62,
    reason: 'No strong signal found; staying on current agent.',
  };
}

export function buildAgentRoutedPrompt(message: string, decision: AgentRoutingDecision): string {
  return `${buildRoutePrefix(decision.route)}
Agent routing decision: agentId="${decision.agent.id}" agentName="${decision.agent.name}" confidence="${decision.confidence.toFixed(2)}" reason="${decision.reason}"
User request: ${message}`;
}
