import {
  evaluateFriendConsentPolicy,
  type FriendConsentAction,
  type FriendConsentDecision,
  type FriendConsentState,
} from './friends-consent-policy';

export const FRIENDS_CONSENT_STATE_STORAGE_KEY = 'syncscript_friends_consent_state_v1';

export interface FriendConsentStorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface FriendConsentStateStore {
  version: string;
  stateByTargetId: Record<string, FriendConsentState>;
  updatedAtIso: string;
}

const STORE_VERSION = 'EX-049-state-v1';

function createDefaultStorageAdapter(): FriendConsentStorageAdapter | null {
  if (typeof window === 'undefined') return null;
  return {
    getItem: (key: string) => window.localStorage.getItem(key),
    setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
  };
}

let storageAdapter: FriendConsentStorageAdapter | null = createDefaultStorageAdapter();

export function setFriendConsentStorageAdapter(adapter: FriendConsentStorageAdapter | null): void {
  storageAdapter = adapter;
}

function readFromStorage(key: string): string | null {
  try {
    return storageAdapter?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeToStorage(key: string, value: string): void {
  try {
    storageAdapter?.setItem(key, value);
  } catch {
    // Best effort only; never block UX on persistence failures.
  }
}

function createEmptyStore(): FriendConsentStateStore {
  return {
    version: STORE_VERSION,
    stateByTargetId: {},
    updatedAtIso: new Date().toISOString(),
  };
}

export function loadFriendConsentStateStore(): FriendConsentStateStore {
  try {
    const raw = readFromStorage(FRIENDS_CONSENT_STATE_STORAGE_KEY);
    if (!raw) return createEmptyStore();
    const parsed = JSON.parse(raw);
    const stateByTargetId =
      parsed && typeof parsed === 'object' && parsed.stateByTargetId && typeof parsed.stateByTargetId === 'object'
        ? parsed.stateByTargetId
        : {};
    return {
      version: STORE_VERSION,
      stateByTargetId,
      updatedAtIso: String(parsed?.updatedAtIso || new Date().toISOString()),
    };
  } catch {
    return createEmptyStore();
  }
}

export function saveFriendConsentStateStore(store: FriendConsentStateStore): void {
  writeToStorage(FRIENDS_CONSENT_STATE_STORAGE_KEY, JSON.stringify(store));
}

export function getPersistedFriendConsentState(targetId: string): FriendConsentState | null {
  const store = loadFriendConsentStateStore();
  return store.stateByTargetId[String(targetId || '')] || null;
}

export function getAllPersistedFriendConsentStates(): Record<string, FriendConsentState> {
  const store = loadFriendConsentStateStore();
  return store.stateByTargetId;
}

export function applyFriendConsentTransition(input: {
  actorId?: string;
  targetId?: string;
  action: FriendConsentAction;
  fallbackCurrentState: FriendConsentState;
}): {
  decision: FriendConsentDecision;
  previousState: FriendConsentState;
  persistedStore: FriendConsentStateStore;
} {
  const targetId = String(input.targetId || '');
  const store = loadFriendConsentStateStore();
  const previousState = (store.stateByTargetId[targetId] || input.fallbackCurrentState) as FriendConsentState;
  const decision = evaluateFriendConsentPolicy({
    action: input.action,
    actorId: input.actorId,
    targetId,
    currentState: previousState,
  });

  if (decision.allowed && targetId) {
    if (decision.nextState === 'none') {
      delete store.stateByTargetId[targetId];
    } else {
      store.stateByTargetId[targetId] = decision.nextState;
    }
    store.updatedAtIso = new Date().toISOString();
    saveFriendConsentStateStore(store);
  }

  return {
    decision,
    previousState,
    persistedStore: store,
  };
}
