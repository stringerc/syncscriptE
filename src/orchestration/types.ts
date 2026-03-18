export type OrchestrationProvider = 'openclaw' | 'perplexity' | 'openai' | 'anthropic';
export type MissionStatus =
  | 'queued'
  | 'running'
  | 'waiting_approval'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'rolled_back';
export type MissionNodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'blocked' | 'skipped';
export type RiskClass = 'low' | 'medium' | 'high';
export type ExecutionRail = 'safe_auto' | 'guarded';

export interface BudgetCaps {
  maxRuntimeMinutes: number;
  maxActions: number;
  maxSpendUsd?: number;
}

export interface SuccessCheck {
  id: string;
  label: string;
  required: boolean;
  method: 'artifact' | 'test' | 'assertion' | 'human_review';
}

export interface StopCondition {
  id: string;
  label: string;
  trigger: 'error_rate' | 'budget' | 'manual_kill' | 'security_policy' | 'timeout';
  threshold?: number;
}

export interface MissionNodeArtifact {
  diffSummary?: string;
  testReport?: string;
  runLog?: string;
  screenshotOrVideoUrl?: string;
  confidenceScore?: number;
  riskSummary?: string;
  solverType?: string;
  solverVersion?: string;
  runtimeMs?: number;
  reproducibilityToken?: string;
  replayPassed?: boolean;
  replayMismatchDetails?: string;
}

export interface MissionNode {
  id: string;
  title: string;
  kind: 'plan' | 'code' | 'test' | 'review' | 'deploy' | 'camera' | 'notify' | 'optimize' | 'custom';
  status: MissionNodeStatus;
  riskClass: RiskClass;
  executionRail: ExecutionRail;
  dependsOn: string[];
  approvalRequired: boolean;
  startedAt?: string;
  completedAt?: string;
  output?: MissionNodeArtifact;
}

export interface Mission {
  id: string;
  userId: string;
  workspaceId: string;
  title: string;
  objective: string;
  status: MissionStatus;
  createdAt: string;
  updatedAt: string;
  budget: BudgetCaps;
  successChecks: SuccessCheck[];
  stopConditions: StopCondition[];
  nodes: MissionNode[];
  metadata?: Record<string, unknown>;
}

export interface OrchestrationContext {
  userId: string;
  workspaceId?: string;
  routedAgentId?: string;
  routedAgentName?: string;
  projectId?: string;
  currentPage?: string;
  mode?: 'chat' | 'run';
}

export interface OrchestrationRequest {
  message: string;
  context: OrchestrationContext;
}

export interface OrchestrationStep {
  id: string;
  type: 'research' | 'plan' | 'task' | 'calendar' | 'email' | 'memory' | 'approval';
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface OrchestrationResponse {
  provider: OrchestrationProvider;
  content: string;
  actionId: string;
  projectId?: string;
  mission?: Mission;
  steps?: OrchestrationStep[];
  metadata?: Record<string, unknown>;
}

export interface OrchestrationAdapter {
  provider: OrchestrationProvider;
  isAvailable: () => boolean;
  execute: (request: OrchestrationRequest) => Promise<OrchestrationResponse>;
}
