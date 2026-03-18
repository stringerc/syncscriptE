export type AgentGovernanceMode = 'system_locked' | 'managed_configurable' | 'workspace_owned';

export type AgentGovernanceProfile = {
  mode: AgentGovernanceMode;
  label: string;
  description: string;
  editableFields: Array<'domain' | 'mission' | 'focus' | 'doNotDo' | 'assignmentDefaultDirective' | 'soulMd'>;
};

export const AGENT_GOVERNANCE_PROFILES: Record<AgentGovernanceMode, AgentGovernanceProfile> = {
  system_locked: {
    mode: 'system_locked',
    label: 'System Locked',
    description: 'Managed by SyncScript core. Visible for transparency, not editable.',
    editableFields: [],
  },
  managed_configurable: {
    mode: 'managed_configurable',
    label: 'Managed Core',
    description: 'Core behavior is protected. You can tune execution directives and focus.',
    editableFields: ['mission', 'focus', 'assignmentDefaultDirective'],
  },
  workspace_owned: {
    mode: 'workspace_owned',
    label: 'Workspace Owned',
    description: 'Fully configurable for your enterprise operating model.',
    editableFields: ['domain', 'mission', 'focus', 'doNotDo', 'assignmentDefaultDirective', 'soulMd'],
  },
};

export function canEditGovernedField(
  mode: AgentGovernanceMode,
  field: AgentGovernanceProfile['editableFields'][number],
): boolean {
  return AGENT_GOVERNANCE_PROFILES[mode].editableFields.includes(field);
}
