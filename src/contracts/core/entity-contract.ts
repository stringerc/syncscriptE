export type ContractEntityKind =
  | 'task'
  | 'goal'
  | 'project'
  | 'event'
  | 'milestone'
  | 'step'
  | 'agent'
  | 'human'
  | 'team'
  | 'integration_account'
  | 'integration_binding'
  | 'mission_run'
  | 'financial_account'
  | 'financial_posting'
  | 'financial_recommendation'
  | 'policy_decision'
  | 'optimization_result'
  | 'resonance_snapshot';

export interface ContractEntityIdentity {
  entityKind: ContractEntityKind;
  entityId: string;
  workspaceId: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export function buildEntityRef(entityKind: ContractEntityKind, entityId: string): string {
  return `${entityKind}:${entityId}`;
}

export function assertValidEntityIdentity(identity: ContractEntityIdentity): string[] {
  const errors: string[] = [];
  if (!identity.entityKind) errors.push('Missing entityKind');
  if (!identity.entityId?.trim()) errors.push('Missing entityId');
  if (!identity.workspaceId?.trim()) errors.push('Missing workspaceId');
  if (!Number.isFinite(identity.version) || identity.version < 1) errors.push('Invalid version');
  if (!identity.createdAt) errors.push('Missing createdAt');
  if (!identity.updatedAt) errors.push('Missing updatedAt');
  return errors;
}
