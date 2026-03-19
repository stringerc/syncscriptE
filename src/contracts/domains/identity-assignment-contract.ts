import type { ContractEntityIdentity } from '../core/entity-contract';

export type IdentityType = 'human' | 'agent' | 'system';

export interface IdentityProfileContract extends ContractEntityIdentity {
  entityKind: 'human' | 'agent';
  displayName: string;
  identityType: IdentityType;
  avatar?: string;
  provider?: 'native' | 'github' | 'slack' | 'google' | 'facebook' | 'other';
  role?: string;
}

export interface AssignmentContract {
  assignmentId: string;
  entityKind: 'task' | 'goal' | 'event' | 'milestone' | 'step';
  entityId: string;
  identityId: string;
  assignedAt: string;
  assignedBy: string;
}

export function assertAssignmentShape(assignments: AssignmentContract[]): string[] {
  const errors: string[] = [];
  for (const assignment of assignments) {
    if (!assignment.entityId) errors.push('Assignment missing entityId');
    if (!assignment.identityId) errors.push('Assignment missing identityId');
    if (!assignment.assignedAt) errors.push('Assignment missing assignedAt');
  }
  return errors;
}
