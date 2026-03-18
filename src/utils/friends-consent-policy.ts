export const FRIENDS_CONSENT_POLICY_VERSION = 'EX-049-v1';
export const FRIENDS_CONSENT_AUDIT_STORAGE_KEY = 'syncscript_friends_consent_audit_v1';

export type FriendConsentAction =
  | 'request_friend'
  | 'approve_request'
  | 'deny_request'
  | 'block_user'
  | 'unblock_user'
  | 'revoke_friend';

export type FriendConsentState = 'none' | 'pending_outbound' | 'pending_inbound' | 'friends' | 'blocked';

export interface FriendConsentInput {
  action: FriendConsentAction;
  actorId?: string;
  targetId?: string;
  currentState: FriendConsentState;
}

export interface FriendConsentDecision {
  allowed: boolean;
  nextState: FriendConsentState;
  reasonCode:
    | 'allowed'
    | 'deny_missing_identity'
    | 'deny_self_target'
    | 'deny_invalid_transition'
    | 'deny_default';
  message: string;
}

export interface FriendConsentAuditEntry {
  id: string;
  timestamp: string;
  policyVersion: string;
  actorId: string;
  targetId: string;
  action: FriendConsentAction;
  previousState: FriendConsentState;
  nextState: FriendConsentState;
  allowed: boolean;
  reasonCode: FriendConsentDecision['reasonCode'];
}

const DENY_BY_DEFAULT: FriendConsentDecision = {
  allowed: false,
  nextState: 'none',
  reasonCode: 'deny_default',
  message: 'Friend consent action blocked by policy (deny-by-default).',
};

function allow(nextState: FriendConsentState, message: string): FriendConsentDecision {
  return {
    allowed: true,
    nextState,
    reasonCode: 'allowed',
    message,
  };
}

function deny(reasonCode: FriendConsentDecision['reasonCode'], message: string, currentState: FriendConsentState): FriendConsentDecision {
  return {
    allowed: false,
    nextState: currentState,
    reasonCode,
    message,
  };
}

export function evaluateFriendConsentPolicy(input: FriendConsentInput): FriendConsentDecision {
  if (!input.actorId || !input.targetId) {
    return deny('deny_missing_identity', 'Friend consent action blocked: missing actor/target identity.', input.currentState);
  }
  if (input.actorId === input.targetId) {
    return deny('deny_self_target', 'Friend consent action blocked: self-target operations are not allowed.', input.currentState);
  }

  switch (input.action) {
    case 'request_friend': {
      if (input.currentState === 'none') return allow('pending_outbound', 'Friend request created.');
      if (input.currentState === 'pending_inbound') return allow('friends', 'Inbound request accepted via reciprocal request.');
      return deny('deny_invalid_transition', 'Cannot request friendship from the current state.', input.currentState);
    }
    case 'approve_request': {
      if (input.currentState === 'pending_inbound') return allow('friends', 'Friend request approved.');
      return deny('deny_invalid_transition', 'No inbound request available to approve.', input.currentState);
    }
    case 'deny_request': {
      if (input.currentState === 'pending_inbound') return allow('none', 'Friend request denied.');
      return deny('deny_invalid_transition', 'No inbound request available to deny.', input.currentState);
    }
    case 'block_user': {
      if (input.currentState !== 'blocked') return allow('blocked', 'User blocked.');
      return deny('deny_invalid_transition', 'User is already blocked.', input.currentState);
    }
    case 'unblock_user': {
      if (input.currentState === 'blocked') return allow('none', 'User unblocked.');
      return deny('deny_invalid_transition', 'Only blocked users can be unblocked.', input.currentState);
    }
    case 'revoke_friend': {
      if (input.currentState === 'friends') return allow('none', 'Friend relationship revoked.');
      return deny('deny_invalid_transition', 'No active friendship to revoke.', input.currentState);
    }
    default:
      return DENY_BY_DEFAULT;
  }
}

export function createFriendConsentAuditEntry(input: FriendConsentInput, decision: FriendConsentDecision): FriendConsentAuditEntry {
  return {
    id: `friend-consent-audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    policyVersion: FRIENDS_CONSENT_POLICY_VERSION,
    actorId: String(input.actorId || ''),
    targetId: String(input.targetId || ''),
    action: input.action,
    previousState: input.currentState,
    nextState: decision.nextState,
    allowed: decision.allowed,
    reasonCode: decision.reasonCode,
  };
}

function readAuditEntries(): FriendConsentAuditEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FRIENDS_CONSENT_AUDIT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordFriendConsentAudit(entry: FriendConsentAuditEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const current = readAuditEntries();
    const next = [entry, ...current].slice(0, 500);
    window.localStorage.setItem(FRIENDS_CONSENT_AUDIT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Do not block UX if storage is unavailable.
  }
}

export function getFriendConsentAuditEntries(): FriendConsentAuditEntry[] {
  return readAuditEntries();
}
