import { projectId, publicAnonKey } from '../utils/supabase/info';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/openclaw`;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${publicAnonKey}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!response.ok) {
    throw new Error(`Mission API failed (${response.status})`);
  }
  return response.json();
}

export interface MissionPolicy {
  requireCriticalApproval: boolean;
  emergencyLockdown: boolean;
  spendCapUsd: number;
  allowedActions: string[];
  deniedActions: string[];
}

export interface MissionNode {
  id: string;
  title: string;
  status: string;
  riskClass: 'low' | 'medium' | 'high';
  executionRail: 'safe_auto' | 'guarded';
  approvalRequired: boolean;
  output?: Record<string, unknown>;
}

export interface MissionRecord {
  id: string;
  title: string;
  objective: string;
  command: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  nodes: MissionNode[];
  delegationStatus?: 'requested' | 'planned' | 'running' | 'completed' | 'failed' | 'cancelled';
  delegationHistory?: Array<{
    from: 'requested' | 'planned' | 'running' | 'completed' | 'failed' | 'cancelled' | null;
    to: 'requested' | 'planned' | 'running' | 'completed' | 'failed' | 'cancelled';
    trigger: string;
    at: string;
    reason?: string;
  }>;
}

export interface MissionToolErrorEnvelope {
  code: string;
  message: string;
  retryable: boolean;
}

export interface MissionToolCallRecord {
  id: string;
  tool: string;
  idempotencyKey: string;
  args: Record<string, unknown>;
  status: 'queued' | 'running' | 'completed' | 'failed';
  startedAt: string;
  finishedAt?: string;
  error?: MissionToolErrorEnvelope;
}

export interface MissionRuntimeContract {
  contractVersion: 'v1';
  missionId: string;
  runId: string;
  intent: string;
  planSteps: Array<{
    nodeId: string;
    title: string;
    status: string;
    approvalRequired: boolean;
  }>;
  currentStep: { nodeId: string; title: string; status: string } | null;
  status: string;
  toolCalls: MissionToolCallRecord[];
  artifacts: Array<Record<string, unknown>>;
  approvals: Array<{
    approvalId: string;
    nodeId: string;
    status: string;
    action: string;
    riskClass: string;
    createdAt: string;
    resolvedAt?: string;
  }>;
  delegationLifecycle: {
    status: 'requested' | 'planned' | 'running' | 'completed' | 'failed' | 'cancelled';
    history: Array<{
      from: 'requested' | 'planned' | 'running' | 'completed' | 'failed' | 'cancelled' | null;
      to: 'requested' | 'planned' | 'running' | 'completed' | 'failed' | 'cancelled';
      trigger: string;
      at: string;
      reason?: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LayeredMemoryItem {
  id: string;
  content: string;
  type: string;
  layer: 'thought_memory' | 'goal_memory' | 'execution_memory';
  timestamp: number;
  importance: number;
  tags: string[];
  relatedMemories: string[];
}

export interface LayeredMemorySnapshot {
  layer: 'all' | 'thought_memory' | 'goal_memory' | 'execution_memory';
  memories: LayeredMemoryItem[];
  grouped: {
    thought_memory: LayeredMemoryItem[];
    goal_memory: LayeredMemoryItem[];
    execution_memory: LayeredMemoryItem[];
  };
  counts: {
    total: number;
    thought_memory: number;
    goal_memory: number;
    execution_memory: number;
  };
  promotionState: {
    cooldownUntil: number | null;
    lastDeclinedAt: number | null;
    lastDeclinedReason: string | null;
  };
}

export interface ApprovalRecord {
  id: string;
  missionId: string;
  nodeId: string;
  action: string;
  riskClass: 'low' | 'medium' | 'high';
  status: string;
  createdAt: string;
}

export interface CameraRecord {
  cameraId: string;
  label: string;
  provider: 'rtsp' | 'onvif' | 'homekit' | 'api';
  status: 'active' | 'paused';
  streamUrl: string;
}

export interface SceneEvent {
  id: string;
  cameraId: string;
  eventType: string;
  confidence: number;
  dialogue: string;
  status: string;
  createdAt: string;
}

export async function getMissionPolicy(userId: string, workspaceId: string): Promise<MissionPolicy> {
  const json = await request<{ success: boolean; policy: MissionPolicy }>(
    `/missions/policy?userId=${encodeURIComponent(userId)}&workspaceId=${encodeURIComponent(workspaceId)}`
  );
  return json.policy;
}

export async function updateMissionPolicy(userId: string, workspaceId: string, patch: Partial<MissionPolicy>): Promise<MissionPolicy> {
  const json = await request<{ success: boolean; policy: MissionPolicy }>('/missions/policy', {
    method: 'POST',
    body: JSON.stringify({ userId, workspaceId, ...patch }),
  });
  return json.policy;
}

export async function createMission(input: {
  userId: string;
  workspaceId: string;
  title: string;
  objective: string;
  command: string;
}): Promise<MissionRecord> {
  const json = await request<{ success: boolean; mission: MissionRecord }>('/missions/create', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return json.mission;
}

export async function createMissionWithRuntime(input: {
  userId: string;
  workspaceId: string;
  title: string;
  objective: string;
  command: string;
}): Promise<{ mission: MissionRecord; runtime: MissionRuntimeContract | null }> {
  const json = await request<{ success: boolean; mission: MissionRecord; runtime?: MissionRuntimeContract }>('/missions/create', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return { mission: json.mission, runtime: json.runtime || null };
}

export async function listMissions(userId: string, workspaceId: string): Promise<MissionRecord[]> {
  const json = await request<{ success: boolean; missions: MissionRecord[] }>(
    `/missions/list?userId=${encodeURIComponent(userId)}&workspaceId=${encodeURIComponent(workspaceId)}`
  );
  return Array.isArray(json.missions) ? json.missions : [];
}

export async function listMissionRuntimes(
  userId: string,
  workspaceId: string
): Promise<{ missions: MissionRecord[]; runtimes: MissionRuntimeContract[] }> {
  const json = await request<{ success: boolean; missions: MissionRecord[]; runtimes?: MissionRuntimeContract[] }>(
    `/missions/list?userId=${encodeURIComponent(userId)}&workspaceId=${encodeURIComponent(workspaceId)}`
  );
  return {
    missions: Array.isArray(json.missions) ? json.missions : [],
    runtimes: Array.isArray(json.runtimes) ? json.runtimes : [],
  };
}

export async function advanceMissionNode(input: {
  userId: string;
  workspaceId: string;
  missionId: string;
  nodeId: string;
  nextStatus: string;
  output?: Record<string, unknown>;
}): Promise<MissionRecord> {
  const json = await request<{ success: boolean; mission: MissionRecord }>('/missions/advance', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return json.mission;
}

export async function advanceMissionNodeWithRuntime(input: {
  userId: string;
  workspaceId: string;
  missionId: string;
  nodeId: string;
  nextStatus: string;
  output?: Record<string, unknown>;
  approvalToken?: string;
}): Promise<{ mission: MissionRecord; runtime: MissionRuntimeContract | null; approvalRequired: boolean }> {
  const json = await request<{ success: boolean; mission: MissionRecord; runtime?: MissionRuntimeContract; approvalRequired?: boolean }>('/missions/advance', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return {
    mission: json.mission,
    runtime: json.runtime || null,
    approvalRequired: Boolean(json.approvalRequired),
  };
}

export async function transitionMissionDelegationStatus(input: {
  userId: string;
  workspaceId: string;
  missionId: string;
  targetStatus: 'requested' | 'planned' | 'running' | 'completed' | 'failed' | 'cancelled';
  trigger?: string;
  reason?: string;
}): Promise<{ mission: MissionRecord; runtime: MissionRuntimeContract | null }> {
  const json = await request<{ success: boolean; mission: MissionRecord; runtime?: MissionRuntimeContract }>(
    '/missions/delegation/transition',
    {
      method: 'POST',
      body: JSON.stringify(input),
    }
  );
  return {
    mission: json.mission,
    runtime: json.runtime || null,
  };
}

export async function listPendingApprovals(userId: string, workspaceId: string): Promise<ApprovalRecord[]> {
  const json = await request<{ success: boolean; approvals: ApprovalRecord[] }>(
    `/approvals/pending?userId=${encodeURIComponent(userId)}&workspaceId=${encodeURIComponent(workspaceId)}`
  );
  return Array.isArray(json.approvals) ? json.approvals : [];
}

export async function respondToApproval(input: {
  userId: string;
  workspaceId: string;
  approvalId: string;
  response: 'approve' | 'deny' | 'rollback';
  deviceLabel?: string;
}): Promise<void> {
  await request('/approvals/respond', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function registerExecutor(input: {
  userId: string;
  workspaceId: string;
  executorId?: string;
  label: string;
  publicKey?: string;
  capabilities?: string[];
}): Promise<{ executorId: string; leaseToken: string }> {
  const json = await request<{ success: boolean; executor: { executorId: string; leaseToken: string } }>('/executor/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return json.executor;
}

export async function registerCamera(input: {
  userId: string;
  workspaceId: string;
  provider: 'rtsp' | 'onvif' | 'homekit' | 'api';
  label: string;
  streamUrl: string;
  secretHint?: string;
}): Promise<CameraRecord> {
  const json = await request<{ success: boolean; camera: CameraRecord }>('/camera/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return json.camera;
}

export async function listCameras(userId: string, workspaceId: string): Promise<CameraRecord[]> {
  const json = await request<{ success: boolean; cameras: CameraRecord[] }>(
    `/camera/list?userId=${encodeURIComponent(userId)}&workspaceId=${encodeURIComponent(workspaceId)}`
  );
  return Array.isArray(json.cameras) ? json.cameras : [];
}

export async function openCameraLiveSession(userId: string, workspaceId: string, cameraId: string): Promise<{ streamUrl: string; token: string }> {
  const json = await request<{ success: boolean; liveSession: { streamUrl: string; token: string } }>('/camera/live-session', {
    method: 'POST',
    body: JSON.stringify({ userId, workspaceId, cameraId }),
  });
  return json.liveSession;
}

export async function createSceneEvent(input: {
  userId: string;
  workspaceId: string;
  cameraId: string;
  eventType: string;
  confidence?: number;
  dialogue?: string;
}): Promise<SceneEvent> {
  const json = await request<{ success: boolean; event: SceneEvent }>('/camera/scene-event', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return json.event;
}

export async function listSceneEvents(userId: string, workspaceId: string): Promise<SceneEvent[]> {
  const json = await request<{ success: boolean; events: SceneEvent[] }>(
    `/camera/scene-event/list?userId=${encodeURIComponent(userId)}&workspaceId=${encodeURIComponent(workspaceId)}`
  );
  return Array.isArray(json.events) ? json.events : [];
}

export async function respondToSceneEvent(input: {
  userId: string;
  workspaceId: string;
  eventId: string;
  response: 'yes' | 'no' | 'ignore';
}): Promise<{ secureRecordingSaved: boolean; message: string }> {
  const json = await request<{ success: boolean; secureRecordingSaved: boolean; message: string }>('/camera/scene-event/respond', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return { secureRecordingSaved: Boolean(json.secureRecordingSaved), message: String(json.message || '') };
}

export async function getLayeredMemorySnapshot(input: {
  userId: string;
  layer?: 'all' | 'thought_memory' | 'goal_memory' | 'execution_memory';
  limit?: number;
}): Promise<LayeredMemorySnapshot> {
  const json = await request<{ success: boolean; data: LayeredMemorySnapshot }>('/memory/layered', {
    method: 'POST',
    body: JSON.stringify({
      userId: input.userId,
      layer: input.layer || 'all',
      limit: Math.max(1, Math.min(input.limit || 24, 100)),
    }),
  });
  return json.data;
}
