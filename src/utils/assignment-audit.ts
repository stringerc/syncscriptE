import type { UserRole } from '../types/unified-types';
import type { AssignmentPolicyDecision } from './assignment-policy';

export interface AssignmentAuditEntry {
  id: string;
  timestamp: string;
  actorId?: string;
  actorName?: string;
  actorRole?: UserRole;
  targetName?: string;
  targetRole?: string;
  resourceType: 'task' | 'milestone' | 'step';
  resourceId: string;
  action: 'assign' | 'unassign' | 'reassign';
  allowed: boolean;
  reasonCode?: string;
  message?: string;
}

const STORAGE_KEY = 'syncscript_assignment_audit_v1';
const MAX_ENTRIES = 500;

export function recordAssignmentAudit(
  base: Omit<AssignmentAuditEntry, 'id' | 'timestamp' | 'allowed' | 'reasonCode' | 'message'>,
  decision: AssignmentPolicyDecision,
): AssignmentAuditEntry {
  const entry: AssignmentAuditEntry = {
    id: `assignment-audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...base,
    allowed: decision.allowed,
    reasonCode: decision.reasonCode,
    message: decision.message,
  };

  try {
    const existingRaw = localStorage.getItem(STORAGE_KEY);
    const existing = existingRaw ? (JSON.parse(existingRaw) as AssignmentAuditEntry[]) : [];
    const next = [entry, ...existing].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Do not block UX if storage is unavailable.
  }

  return entry;
}

export function getAssignmentAuditEntries(): AssignmentAuditEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AssignmentAuditEntry[]) : [];
  } catch {
    return [];
  }
}
