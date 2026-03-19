import type { WorkstreamFlowCheckpoint, WorkstreamFlowDocument } from '../types/workstream-flow';

const FLOW_STORE_KEY = 'syncscript:workstream-flow:v1';
const FLOW_UPDATED_EVENT = 'syncscript:workstream-flow-updated';
const CHECKPOINT_LIMIT = 12;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readStore(): Record<string, WorkstreamFlowDocument> {
  if (typeof window === 'undefined') return {};
  return safeParse<Record<string, WorkstreamFlowDocument>>(window.localStorage.getItem(FLOW_STORE_KEY), {});
}

function writeStore(next: Record<string, WorkstreamFlowDocument>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FLOW_STORE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(FLOW_UPDATED_EVENT));
  } catch {
    // non-blocking
  }
}

export function getWorkstreamFlowDocument(projectId: string): WorkstreamFlowDocument | null {
  const key = String(projectId || '').trim();
  if (!key) return null;
  return readStore()[key] || null;
}

export function upsertWorkstreamFlowDocument(doc: WorkstreamFlowDocument) {
  const key = String(doc?.projectId || '').trim();
  if (!key) return;
  const next = readStore();
  const existing = next[key];
  next[key] = {
    ...existing,
    ...doc,
    checkpoints: doc.checkpoints ?? existing?.checkpoints ?? [],
    updatedAt: new Date().toISOString(),
  };
  writeStore(next);
}

export function saveWorkstreamFlowCheckpoint(projectId: string, input: { label: string; doc: WorkstreamFlowDocument }) {
  const key = String(projectId || '').trim();
  if (!key) return;
  const next = readStore();
  const prior = next[key] || input.doc;
  const checkpoint: WorkstreamFlowCheckpoint = {
    id: `cp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    label: String(input.label || 'Checkpoint').trim() || 'Checkpoint',
    createdAt: new Date().toISOString(),
    nodes: input.doc.nodes,
    edges: input.doc.edges,
    viewport: input.doc.viewport,
  };
  const checkpoints = [checkpoint, ...(prior.checkpoints || [])].slice(0, CHECKPOINT_LIMIT);
  next[key] = {
    ...prior,
    ...input.doc,
    checkpoints,
    updatedAt: new Date().toISOString(),
  };
  writeStore(next);
}

export function listWorkstreamFlowCheckpoints(projectId: string): WorkstreamFlowCheckpoint[] {
  const key = String(projectId || '').trim();
  if (!key) return [];
  const doc = readStore()[key];
  return doc?.checkpoints || [];
}

export function restoreWorkstreamFlowCheckpoint(projectId: string, checkpointId: string): WorkstreamFlowDocument | null {
  const key = String(projectId || '').trim();
  if (!key) return null;
  const next = readStore();
  const doc = next[key];
  if (!doc) return null;
  const checkpoint = (doc.checkpoints || []).find((item) => item.id === checkpointId);
  if (!checkpoint) return null;
  const restored: WorkstreamFlowDocument = {
    ...doc,
    nodes: checkpoint.nodes,
    edges: checkpoint.edges,
    viewport: checkpoint.viewport,
    updatedAt: new Date().toISOString(),
  };
  next[key] = restored;
  writeStore(next);
  return restored;
}

export function getWorkstreamFlowUpdatedEventName() {
  return FLOW_UPDATED_EVENT;
}
