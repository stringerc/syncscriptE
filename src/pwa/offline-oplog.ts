import { openDB, type DBSchema } from 'idb';

export type OpLogEntity = 'agent-chat' | 'task' | 'goal' | 'smart-event' | 'presence' | 'handoff';

export interface OpLogItem {
  id: string;
  entity: OpLogEntity;
  routeKey: string;
  idempotencyKey: string;
  payload: Record<string, unknown>;
  createdAt: string;
  status: 'queued' | 'sent' | 'acked' | 'failed';
  attempts: number;
  lastError?: string;
}

interface SyncScriptOpLogDB extends DBSchema {
  opLog: {
    key: string;
    value: OpLogItem;
    indexes: {
      status: OpLogItem['status'];
      createdAt: string;
    };
  };
}

const DB_NAME = 'syncscript-oplog';
const DB_VERSION = 1;

const dbPromise = openDB<SyncScriptOpLogDB>(DB_NAME, DB_VERSION, {
  upgrade(db) {
    const store = db.createObjectStore('opLog', { keyPath: 'id' });
    store.createIndex('status', 'status');
    store.createIndex('createdAt', 'createdAt');
  },
});

export async function queueOpLog(item: Omit<OpLogItem, 'id' | 'createdAt' | 'status' | 'attempts'>): Promise<OpLogItem> {
  const op: OpLogItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: 'queued',
    attempts: 0,
  };
  const db = await dbPromise;
  await db.put('opLog', op);
  return op;
}

export async function listQueuedOps(limit = 100): Promise<OpLogItem[]> {
  const db = await dbPromise;
  const tx = db.transaction('opLog', 'readonly');
  const statusIndex = tx.store.index('status');
  const queued = await statusIndex.getAll('queued', limit);
  const failed = await statusIndex.getAll('failed', Math.max(0, limit - queued.length));
  return [...queued, ...failed].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(0, limit);
}

export async function markOpSent(id: string): Promise<void> {
  const db = await dbPromise;
  const existing = await db.get('opLog', id);
  if (!existing) return;
  await db.put('opLog', {
    ...existing,
    status: 'sent',
    attempts: existing.attempts + 1,
    lastError: undefined,
  });
}

export async function markOpAcked(id: string): Promise<void> {
  const db = await dbPromise;
  const existing = await db.get('opLog', id);
  if (!existing) return;
  await db.put('opLog', {
    ...existing,
    status: 'acked',
    lastError: undefined,
  });
}

export async function markOpFailed(id: string, error: string): Promise<void> {
  const db = await dbPromise;
  const existing = await db.get('opLog', id);
  if (!existing) return;
  await db.put('opLog', {
    ...existing,
    status: 'failed',
    attempts: existing.attempts + 1,
    lastError: error.slice(0, 200),
  });
}

export async function pruneAckedOps(maxAgeMs = 1000 * 60 * 60 * 24 * 14): Promise<number> {
  const db = await dbPromise;
  const all = await db.getAll('opLog');
  const now = Date.now();
  const deletions = all.filter((op) => {
    if (op.status !== 'acked') return false;
    const t = Date.parse(op.createdAt);
    return Number.isFinite(t) && now - t > maxAgeMs;
  });
  await Promise.all(deletions.map((op) => db.delete('opLog', op.id)));
  return deletions.length;
}
