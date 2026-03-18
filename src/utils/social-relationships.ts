export type SocialRelationshipType = 'friend' | 'teammate' | 'collaborative';
export type SocialRelationshipStatus =
  | 'pending_outbound'
  | 'pending_inbound'
  | 'connected'
  | 'blocked';

export interface SocialRelationship {
  id: string;
  actorId: string;
  targetKey: string;
  targetLabel: string;
  targetEmail?: string;
  type: SocialRelationshipType;
  status: SocialRelationshipStatus;
  createdAt: string;
  updatedAt: string;
}

interface SocialRelationshipStore {
  version: string;
  records: SocialRelationship[];
}

const STORE_KEY = 'syncscript_social_relationships_v1';
const STORE_VERSION = 'v1';

function nowIso() {
  return new Date().toISOString();
}

function normalizeTargetKey(targetLabel: string, targetEmail?: string) {
  const base = (targetEmail || targetLabel).trim().toLowerCase();
  return base.replace(/\s+/g, ' ');
}

function loadStore(): SocialRelationshipStore {
  if (typeof window === 'undefined') {
    return { version: STORE_VERSION, records: [] };
  }
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return { version: STORE_VERSION, records: [] };
    const parsed = JSON.parse(raw);
    const records = Array.isArray(parsed?.records) ? parsed.records : [];
    return { version: STORE_VERSION, records };
  } catch {
    return { version: STORE_VERSION, records: [] };
  }
}

function saveStore(store: SocialRelationshipStore) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // Best effort local persistence only.
  }
}

function upsertRecord(next: SocialRelationship) {
  const store = loadStore();
  const idx = store.records.findIndex((record) => record.id === next.id);
  if (idx >= 0) {
    store.records[idx] = next;
  } else {
    store.records.unshift(next);
  }
  saveStore(store);
}

function deleteRecord(id: string) {
  const store = loadStore();
  store.records = store.records.filter((record) => record.id !== id);
  saveStore(store);
}

export function listSocialRelationships(actorId: string, type: SocialRelationshipType): SocialRelationship[] {
  const store = loadStore();
  return store.records
    .filter((record) => record.actorId === actorId && record.type === type)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function createSocialInvite(input: {
  actorId: string;
  type: SocialRelationshipType;
  targetLabel: string;
  targetEmail?: string;
}): { ok: true; record: SocialRelationship } | { ok: false; message: string } {
  const targetLabel = input.targetLabel.trim();
  const targetEmail = input.targetEmail?.trim() || undefined;
  if (!input.actorId) return { ok: false, message: 'Missing user identity.' };
  if (!targetLabel) return { ok: false, message: 'Enter a name to send an invite.' };

  const targetKey = normalizeTargetKey(targetLabel, targetEmail);
  if (!targetKey) return { ok: false, message: 'Invalid invite target.' };
  if (targetKey === String(input.actorId).toLowerCase()) {
    return { ok: false, message: 'You cannot invite yourself.' };
  }

  const existing = listSocialRelationships(input.actorId, input.type).find(
    (record) => record.targetKey === targetKey && record.status !== 'blocked',
  );
  if (existing) {
    if (existing.status === 'connected') {
      return { ok: false, message: `${targetLabel} is already connected.` };
    }
    if (existing.status === 'pending_outbound') {
      return { ok: false, message: `Invite already pending for ${targetLabel}.` };
    }
    if (existing.status === 'pending_inbound') {
      return transitionSocialRelationship(existing.id, 'accept');
    }
  }

  const record: SocialRelationship = {
    id: `social-rel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    actorId: input.actorId,
    targetKey,
    targetLabel,
    targetEmail,
    type: input.type,
    status: 'pending_outbound',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  upsertRecord(record);
  return { ok: true, record };
}

export type SocialTransitionAction = 'accept' | 'decline' | 'cancel' | 'block' | 'unblock' | 'revoke';

export function transitionSocialRelationship(
  id: string,
  action: SocialTransitionAction,
): { ok: true; record: SocialRelationship } | { ok: false; message: string } {
  const store = loadStore();
  const record = store.records.find((entry) => entry.id === id);
  if (!record) return { ok: false, message: 'Relationship not found.' };

  let nextStatus: SocialRelationshipStatus | null = null;
  let shouldDelete = false;

  if (action === 'accept' && record.status === 'pending_inbound') nextStatus = 'connected';
  if (action === 'decline' && record.status === 'pending_inbound') shouldDelete = true;
  if (action === 'cancel' && record.status === 'pending_outbound') shouldDelete = true;
  if (action === 'revoke' && record.status === 'connected') shouldDelete = true;
  if (action === 'block' && record.status !== 'blocked') nextStatus = 'blocked';
  if (action === 'unblock' && record.status === 'blocked') shouldDelete = true;

  if (!nextStatus && !shouldDelete) {
    return { ok: false, message: 'This action is not allowed for the current state.' };
  }

  if (shouldDelete) {
    deleteRecord(record.id);
    return {
      ok: true,
      record: {
        ...record,
        status: record.status,
        updatedAt: nowIso(),
      },
    };
  }

  const updated: SocialRelationship = {
    ...record,
    status: nextStatus || record.status,
    updatedAt: nowIso(),
  };
  upsertRecord(updated);
  return { ok: true, record: updated };
}
