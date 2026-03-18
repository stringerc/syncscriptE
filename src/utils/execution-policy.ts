export type WorkOwnerMode = 'human_only' | 'agent_only' | 'collaborative';
export type WorkRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ExecutionPolicyInput {
  ownerMode: WorkOwnerMode;
  riskLevel?: WorkRiskLevel;
  hasHumanAssignee?: boolean;
  hasAgentAssignee?: boolean;
  usesExternalAgent?: boolean;
}

export interface ExecutionPolicySummary {
  mode: WorkOwnerMode;
  autoCompletes: boolean;
  requiresHumanConfirmation: boolean;
  shouldShowRiskFlag: boolean;
  recommendation?: string;
}

export function evaluateExecutionPolicy(input: ExecutionPolicyInput): ExecutionPolicySummary {
  const mode = input.ownerMode;
  const riskLevel = input.riskLevel ?? 'low';
  const hasAgentAssignee = Boolean(input.hasAgentAssignee);
  const usesExternalAgent = Boolean(input.usesExternalAgent);

  if (mode === 'agent_only') {
    return {
      mode,
      autoCompletes: hasAgentAssignee,
      requiresHumanConfirmation: false,
      shouldShowRiskFlag: riskLevel === 'high' || riskLevel === 'critical',
      recommendation:
        riskLevel === 'high' || riskLevel === 'critical'
          ? 'High-risk action: add yourself as a collaborator if you want a human checkpoint.'
          : undefined,
    };
  }

  if (mode === 'collaborative') {
    // Product rule: collaborative defaults to human confirmation.
    // Exception: externally shared/borrowed agents may run without local human confirm.
    const bypassHumanConfirm = usesExternalAgent && hasAgentAssignee;
    return {
      mode,
      autoCompletes: false,
      requiresHumanConfirmation: !bypassHumanConfirm,
      shouldShowRiskFlag: riskLevel === 'high' || riskLevel === 'critical',
      recommendation: bypassHumanConfirm
        ? 'External agent execution enabled for this collaborative item.'
        : 'Human confirmation required before completion.',
    };
  }

  return {
    mode: 'human_only',
    autoCompletes: false,
    requiresHumanConfirmation: false,
    shouldShowRiskFlag: false,
  };
}
