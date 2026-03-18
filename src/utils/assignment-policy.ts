import type { UserRole } from '../types/unified-types';

export const ASSIGNMENT_POLICY_VERSION = 'EX-033-EX-034-v1';

export type AssignmentAction = 'assign' | 'unassign' | 'reassign';
export type AssignmentTargetRole = UserRole | 'agent';

export interface AssignmentPolicyInput {
  action: AssignmentAction;
  actorRole?: UserRole;
  actorId?: string;
  targetId?: string;
  targetRole?: AssignmentTargetRole;
  isSelfAssignment?: boolean;
  allowSelfAssignForCollaborator?: boolean;
  allowAgentAssignment?: boolean;
}

export interface AssignmentPolicyDecision {
  allowed: boolean;
  reasonCode:
    | 'allowed'
    | 'deny_missing_actor_role'
    | 'deny_viewer'
    | 'deny_collaborator_non_self'
    | 'deny_collaborator_reassign'
    | 'deny_collaborator_self_assign_disabled'
    | 'deny_agent_assignment_disabled'
    | 'deny_admin_target_creator'
    | 'deny_default';
  message: string;
}

const DENY_BY_DEFAULT: AssignmentPolicyDecision = {
  allowed: false,
  reasonCode: 'deny_default',
  message: 'Assignment blocked by policy (deny-by-default).',
};

export function evaluateAssignmentPolicy(input: AssignmentPolicyInput): AssignmentPolicyDecision {
  const actorRole = input.actorRole;
  const targetRole = input.targetRole || 'collaborator';
  const allowSelfAssignForCollaborator = input.allowSelfAssignForCollaborator !== false;
  const allowAgentAssignment = input.allowAgentAssignment !== false;

  // Deny-by-default on missing identity context.
  if (!actorRole) {
    return {
      allowed: false,
      reasonCode: 'deny_missing_actor_role',
      message: 'Assignment blocked: missing actor role.',
    };
  }

  if (actorRole === 'viewer') {
    return {
      allowed: false,
      reasonCode: 'deny_viewer',
      message: 'Viewers cannot manage assignees.',
    };
  }

  // Creator has full assignment authority.
  if (actorRole === 'creator') {
    return {
      allowed: true,
      reasonCode: 'allowed',
      message: 'Creator assignment allowed.',
    };
  }

  // Admin can manage assignees but cannot mutate creator assignment state.
  if (actorRole === 'admin') {
    if (targetRole === 'creator') {
      return {
        allowed: false,
        reasonCode: 'deny_admin_target_creator',
        message: 'Admins cannot change creator assignment state.',
      };
    }
    return {
      allowed: true,
      reasonCode: 'allowed',
      message: 'Admin assignment allowed.',
    };
  }

  // Collaborator rules: self-only and no reassign.
  const isSelf =
    input.isSelfAssignment ||
    (Boolean(input.actorId) && Boolean(input.targetId) && input.actorId === input.targetId);

  if (actorRole === 'collaborator' && input.action === 'reassign') {
    return {
      allowed: false,
      reasonCode: 'deny_collaborator_reassign',
      message: 'Collaborators cannot reassign other collaborators.',
    };
  }

  if (actorRole === 'collaborator' && !isSelf) {
    return {
      allowed: false,
      reasonCode: 'deny_collaborator_non_self',
      message: 'Collaborators can only manage their own assignment state.',
    };
  }

  if (actorRole === 'collaborator' && !allowSelfAssignForCollaborator) {
    return {
      allowed: false,
      reasonCode: 'deny_collaborator_self_assign_disabled',
      message: 'Self-assignment is disabled for collaborators.',
    };
  }

  if (targetRole === 'agent' && !allowAgentAssignment) {
    return {
      allowed: false,
      reasonCode: 'deny_agent_assignment_disabled',
      message: 'Agent assignment is currently disabled by policy.',
    };
  }

  if (actorRole === 'collaborator') {
    return {
      allowed: true,
      reasonCode: 'allowed',
      message: 'Collaborator self-assignment allowed.',
    };
  }

  return DENY_BY_DEFAULT;
}
