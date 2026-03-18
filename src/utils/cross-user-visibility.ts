export type CollaborationVisibilityScope =
  | 'private'
  | 'friends'
  | 'team'
  | 'workspace'
  | 'public';

export interface VisibilityMatrixInput {
  actorUserId?: string;
  ownerUserId?: string;
  scope: CollaborationVisibilityScope;
  teamMemberIds?: string[];
  workspaceMemberIds?: string[];
  friendPairs?: Array<{ a: string; b: string }>;
  explicitAllowUserIds?: string[];
  explicitDenyUserIds?: string[];
}

export interface VisibilityMatrixDecision {
  visible: boolean;
  reasonCode:
    | 'allow_owner'
    | 'allow_public'
    | 'allow_workspace_member'
    | 'allow_team_member'
    | 'allow_friend'
    | 'allow_explicit_allow'
    | 'deny_explicit_deny'
    | 'deny_missing_actor'
    | 'deny_missing_owner'
    | 'deny_private_non_owner'
    | 'deny_not_friend'
    | 'deny_not_team_member'
    | 'deny_not_workspace_member'
    | 'deny_default';
}

function normalizeId(value?: string): string {
  return String(value || '').trim().toLowerCase();
}

function toIdSet(values?: string[]): Set<string> {
  return new Set((values || []).map((value) => normalizeId(value)).filter(Boolean));
}

function areFriends(
  actorId: string,
  ownerId: string,
  friendPairs?: Array<{ a: string; b: string }>,
): boolean {
  if (!actorId || !ownerId || actorId === ownerId) return false;
  return (friendPairs || []).some((pair) => {
    const a = normalizeId(pair?.a);
    const b = normalizeId(pair?.b);
    return (a === actorId && b === ownerId) || (a === ownerId && b === actorId);
  });
}

export function evaluateCrossUserVisibilityMatrix(input: VisibilityMatrixInput): VisibilityMatrixDecision {
  const actorId = normalizeId(input.actorUserId);
  const ownerId = normalizeId(input.ownerUserId);
  const allowSet = toIdSet(input.explicitAllowUserIds);
  const denySet = toIdSet(input.explicitDenyUserIds);

  if (!actorId) return { visible: false, reasonCode: 'deny_missing_actor' };
  if (!ownerId) return { visible: false, reasonCode: 'deny_missing_owner' };
  if (actorId === ownerId) return { visible: true, reasonCode: 'allow_owner' };
  if (denySet.has(actorId)) return { visible: false, reasonCode: 'deny_explicit_deny' };
  if (allowSet.has(actorId)) return { visible: true, reasonCode: 'allow_explicit_allow' };

  if (input.scope === 'public') {
    return { visible: true, reasonCode: 'allow_public' };
  }

  if (input.scope === 'workspace') {
    return toIdSet(input.workspaceMemberIds).has(actorId)
      ? { visible: true, reasonCode: 'allow_workspace_member' }
      : { visible: false, reasonCode: 'deny_not_workspace_member' };
  }

  if (input.scope === 'team') {
    return toIdSet(input.teamMemberIds).has(actorId)
      ? { visible: true, reasonCode: 'allow_team_member' }
      : { visible: false, reasonCode: 'deny_not_team_member' };
  }

  if (input.scope === 'friends') {
    return areFriends(actorId, ownerId, input.friendPairs)
      ? { visible: true, reasonCode: 'allow_friend' }
      : { visible: false, reasonCode: 'deny_not_friend' };
  }

  if (input.scope === 'private') {
    return { visible: false, reasonCode: 'deny_private_non_owner' };
  }

  return { visible: false, reasonCode: 'deny_default' };
}
