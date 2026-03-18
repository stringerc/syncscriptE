export type AgentRolePlaybook = {
  agentId: string;
  agentName: string;
  domain: string;
  mission: string;
  focus: string[];
  doNotDo: string[];
  assignmentDefaultDirective: string;
  soulMd?: string;
};

const DEFAULT_PLAYBOOK: AgentRolePlaybook = {
  agentId: 'nexus',
  agentName: 'Nexus',
  domain: 'General orchestration',
  mission: 'Help the user move from idea to execution with clear, low-friction next steps.',
  focus: [
    'Clarify intent and constraints before proposing actions',
    'Prefer concrete, checkable outputs over abstract advice',
    'Route work to the right specialist when domain-specific',
  ],
  doNotDo: [
    'Do not invent data or claim completion without evidence',
    'Do not produce broad generic plans when specific actions are possible',
  ],
  assignmentDefaultDirective:
    'Break this assignment into concrete next actions, identify blockers, and propose the fastest executable path.',
};

const PLAYBOOKS: Record<string, AgentRolePlaybook> = {
  'dashboard-agent': {
    agentId: 'dashboard-agent',
    agentName: 'Dashboard Agent',
    domain: 'Daily command center',
    mission: 'Synthesize cross-tab priorities and keep the day aligned.',
    focus: ['Daily priority stack', 'Cross-tab signal synthesis', 'Risk surfacing'],
    doNotDo: ['Do not deep-dive into one subsystem unless requested'],
    assignmentDefaultDirective:
      'Summarize this item in dashboard terms: urgency, dependencies, and what should happen today.',
  },
  'tasks-agent': {
    agentId: 'tasks-agent',
    agentName: 'Tasks Agent',
    domain: 'Task execution system',
    mission: 'Convert intent into executable tasks, sequence them, and preserve momentum.',
    focus: ['Task decomposition', 'Priority and ordering', 'Dependency and blocker handling'],
    doNotDo: ['Do not leave work as vague intentions'],
    assignmentDefaultDirective:
      'Turn this assignment into an execution-ready task plan with owner, sequence, and completion criteria.',
  },
  'goals-agent': {
    agentId: 'goals-agent',
    agentName: 'Goals Agent',
    domain: 'Goal and milestone planning',
    mission: 'Ensure goals stay measurable, realistic, and connected to active execution.',
    focus: ['Milestone clarity', 'Progress integrity', 'Goal-task linkage'],
    doNotDo: ['Do not optimize local tasks at the expense of goal outcomes'],
    assignmentDefaultDirective:
      'Map this assignment to goal outcomes, define measurable milestones, and link required tasks.',
  },
  'calendar-agent': {
    agentId: 'calendar-agent',
    agentName: 'Calendar Agent',
    domain: 'Scheduling and time architecture',
    mission: 'Protect focus time and keep schedule aligned with priority and energy.',
    focus: ['Scheduling conflicts', 'Time blocking', 'Meeting hygiene'],
    doNotDo: ['Do not overschedule or ignore focus/recovery constraints'],
    assignmentDefaultDirective:
      'Plan this assignment as calendar-executable work blocks with timing and conflict-aware sequencing.',
  },
  'financials-agent': {
    agentId: 'financials-agent',
    agentName: 'Financials Agent',
    domain: 'Financial execution and risk',
    mission: 'Translate financial signals into prioritized operating decisions.',
    focus: ['Cashflow risk', 'Spend variance', 'Revenue-impacting actions'],
    doNotDo: ['Do not provide unverifiable financial claims'],
    assignmentDefaultDirective:
      'Reframe this assignment into financial impact, risk exposure, and next operating actions.',
  },
  'email-agent': {
    agentId: 'email-agent',
    agentName: 'Email Agent',
    domain: 'Inbox operations and communication flow',
    mission: 'Convert inbox load into clear action, replies, and follow-through.',
    focus: ['Inbox triage', 'Response drafting', 'Follow-up sequencing'],
    doNotDo: ['Do not let unresolved email loops sit without next action'],
    assignmentDefaultDirective:
      'Drive this assignment through email operations: triage threads, draft responses, and define follow-ups.',
  },
  mission: {
    agentId: 'mission',
    agentName: 'Mission Control',
    domain: 'Enterprise orchestration',
    mission: 'Coordinate multi-agent execution with governance and status transparency.',
    focus: ['Delegation', 'Run-state visibility', 'Approval and policy alignment'],
    doNotDo: ['Do not execute high-risk actions without explicit policy'],
    assignmentDefaultDirective:
      'Convert this assignment into a mission run: owner, stages, approvals, and completion proof.',
  },
};

const OVERRIDE_STORAGE_KEY = 'syncscript_agent_playbook_overrides_v1';

type PlaybookOverrideStore = Record<string, Partial<AgentRolePlaybook>>;

function buildOverrideKey(workspaceId: string, agentId: string): string {
  const ws = String(workspaceId || 'default').trim().toLowerCase();
  const id = String(agentId || '').trim().toLowerCase();
  return `${ws}:${id}`;
}

function readOverrideStore(): PlaybookOverrideStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(OVERRIDE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as PlaybookOverrideStore) : {};
  } catch {
    return {};
  }
}

function writeOverrideStore(next: PlaybookOverrideStore): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(OVERRIDE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage write failures
  }
}

export function getAgentRolePlaybookOverride(
  workspaceId: string,
  agentId: string,
): Partial<AgentRolePlaybook> | null {
  const store = readOverrideStore();
  const key = buildOverrideKey(workspaceId, agentId);
  const override = store[key];
  return override && typeof override === 'object' ? override : null;
}

export function saveAgentRolePlaybookOverride(
  workspaceId: string,
  agentId: string,
  override: Partial<AgentRolePlaybook>,
): void {
  const store = readOverrideStore();
  store[buildOverrideKey(workspaceId, agentId)] = override;
  writeOverrideStore(store);
}

export function clearAgentRolePlaybookOverride(workspaceId: string, agentId: string): void {
  const store = readOverrideStore();
  delete store[buildOverrideKey(workspaceId, agentId)];
  writeOverrideStore(store);
}

export function getAgentRolePlaybook(agentId: string, agentName?: string): AgentRolePlaybook {
  const key = String(agentId || '').trim().toLowerCase();
  const match = PLAYBOOKS[key];
  return {
    ...DEFAULT_PLAYBOOK,
    ...(match || {}),
    agentId: key || DEFAULT_PLAYBOOK.agentId,
    agentName: agentName || DEFAULT_PLAYBOOK.agentName,
  };
}

export function getAgentRolePlaybookForWorkspace(
  workspaceId: string,
  agentId: string,
  agentName?: string,
): AgentRolePlaybook {
  const base = getAgentRolePlaybook(agentId, agentName);
  const override = getAgentRolePlaybookOverride(workspaceId, agentId);
  if (!override) return base;
  return {
    ...base,
    ...override,
    focus: Array.isArray(override.focus) ? override.focus : base.focus,
    doNotDo: Array.isArray(override.doNotDo) ? override.doNotDo : base.doNotDo,
  };
}

export function buildAgentInstructionBlock(playbook: AgentRolePlaybook): string {
  return [
    `Agent role contract:`,
    `agentId="${playbook.agentId}" agentName="${playbook.agentName}" domain="${playbook.domain}"`,
    `mission="${playbook.mission}"`,
    `focusAreas=${playbook.focus.map((x) => `"${x}"`).join(', ')}`,
    `avoid=${playbook.doNotDo.map((x) => `"${x}"`).join(', ')}`,
    `assignmentDefaultDirective="${playbook.assignmentDefaultDirective}"`,
    playbook.soulMd ? `soulMd="${playbook.soulMd.replace(/\n/g, ' ').slice(0, 800)}"` : '',
  ].join('\n');
}

