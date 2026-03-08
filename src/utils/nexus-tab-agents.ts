import type { DomainTab } from './ai-route';

export type NexusTabAgent = {
  id: string;
  name: string;
  tabLabel: string;
  domainTab: DomainTab;
  role: string;
  discordScope?: 'tab' | 'enterprise';
  discordParentId?: 'dashboard' | 'tasks' | 'goals' | 'calendar' | 'financials' | 'email' | 'enterprise';
};

export const NEXUS_TAB_AGENTS: NexusTabAgent[] = [
  {
    id: 'dashboard-agent',
    name: 'Dashboard Agent',
    tabLabel: 'Dashboard',
    domainTab: 'dashboard',
    role: 'Cross-view command center and daily synthesis',
    discordScope: 'tab',
    discordParentId: 'dashboard',
  },
  {
    id: 'tasks-agent',
    name: 'Tasks Agent',
    tabLabel: 'Tasks',
    domainTab: 'tasks',
    role: 'Execution planning, prioritization, and backlog flow',
    discordScope: 'tab',
    discordParentId: 'tasks',
  },
  {
    id: 'calendar-agent',
    name: 'Calendar Agent',
    tabLabel: 'Calendar',
    domainTab: 'calendar',
    role: 'Schedule optimization and time conflict handling',
    discordScope: 'tab',
    discordParentId: 'calendar',
  },
  {
    id: 'financials-agent',
    name: 'Financials Agent',
    tabLabel: 'Financials',
    domainTab: 'financials',
    role: 'Revenue, expenses, runway, and planning intelligence',
    discordScope: 'tab',
    discordParentId: 'financials',
  },
  {
    id: 'email-agent',
    name: 'Email Agent',
    tabLabel: 'Email',
    domainTab: 'email',
    role: 'Inbox triage, response drafting, and follow-up sequencing',
    discordScope: 'tab',
    discordParentId: 'email',
  },
  {
    id: 'energy-agent',
    name: 'Energy Agent',
    tabLabel: 'Energy',
    domainTab: 'ai',
    role: 'Performance pacing, workload energy alignment, and recovery',
    discordScope: 'enterprise',
    discordParentId: 'enterprise',
  },
  {
    id: 'resonance-agent',
    name: 'Resonance Agent',
    tabLabel: 'Resonance Engine',
    domainTab: 'ai',
    role: 'Focus quality and cognitive-state guidance',
    discordScope: 'enterprise',
    discordParentId: 'enterprise',
  },
  {
    id: 'team-agent',
    name: 'Team Agent',
    tabLabel: 'Team',
    domainTab: 'ai',
    role: 'Delegation clarity, ownership, and collaboration health',
    discordScope: 'enterprise',
    discordParentId: 'enterprise',
  },
  {
    id: 'scripts-agent',
    name: 'Scripts Agent',
    tabLabel: 'Scripts & Templates',
    domainTab: 'ai',
    role: 'Reusable workflows and template optimization',
    discordScope: 'enterprise',
    discordParentId: 'enterprise',
  },
  {
    id: 'analytics-agent',
    name: 'Analytics Agent',
    tabLabel: 'Analytics',
    domainTab: 'ai',
    role: 'KPI interpretation, trend analysis, and anomalies',
    discordScope: 'enterprise',
    discordParentId: 'enterprise',
  },
  {
    id: 'mission',
    name: 'Mission Control',
    tabLabel: 'Enterprise',
    domainTab: 'enterprise',
    role: 'Enterprise operations, governance, and mission orchestration',
    discordScope: 'tab',
    discordParentId: 'enterprise',
  },
  {
    id: 'mission-cockpit-agent',
    name: 'Mission Cockpit Agent',
    tabLabel: 'Mission Cockpit',
    domainTab: 'enterprise',
    role: 'Run lifecycle visibility and command execution',
    discordScope: 'enterprise',
    discordParentId: 'enterprise',
  },
];
