export type WorkstreamFlowNodeKind = 'task' | 'event';

export interface WorkstreamFlowAssignee {
  id?: string;
  name: string;
  avatar?: string;
  role?: string;
}

export interface WorkstreamFlowStep {
  id: string;
  title: string;
  completed?: boolean;
  promoted?: boolean;
  promotedToTaskId?: string;
  assignees?: WorkstreamFlowAssignee[];
  resources?: unknown[];
}

export interface WorkstreamFlowMilestone {
  id: string;
  title: string;
  completed?: boolean;
  promoted?: boolean;
  promotedToTaskId?: string;
  assignees?: WorkstreamFlowAssignee[];
  resources?: unknown[];
  steps?: WorkstreamFlowStep[];
}

export interface WorkstreamFlowIntegrationBinding {
  connectorId: string;
  connectorName: string;
  provider: 'native' | 'universal' | 'community' | string;
  accountId?: string;
  accountLabel?: string;
  authType?: 'oauth2' | 'api_key' | 'none' | string;
  scopes?: string[];
  connectionStatus?: 'healthy' | 'expiring' | 'error' | 'disconnected' | string;
  category?: string;
  status?: 'connected' | 'pending' | 'error' | string;
  mode?: 'simple' | 'advanced' | string;
  scope?: 'task' | 'milestone' | 'step' | string;
  attachedAt?: string;
}

export interface WorkstreamFlowLayout {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface WorkstreamFlowNodeData {
  taskId: string;
  title: string;
  status: string;
  completed: boolean;
  priority?: string;
  dueDate?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  assignees?: WorkstreamFlowAssignee[];
  milestones?: WorkstreamFlowMilestone[];
  integrations?: string[];
  integrationBindings?: WorkstreamFlowIntegrationBinding[];
  goalId?: string;
  goalTitle?: string;
  ownerMode?: 'human_only' | 'collaborative' | 'agent_only' | string;
  createdByType?: 'human' | 'agent' | string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical' | string;
  lineage?: {
    parentTaskId?: string;
    sourceNodeId?: string;
    sourceEntityType?: 'task' | 'milestone' | 'step' | string;
    sourceEntityId?: string;
    sourceEntityTitle?: string;
  };
  promotedLineageKeys?: string[];
  compactView?: boolean;
  projectId?: string;
  nodeKind: WorkstreamFlowNodeKind;
}

export interface WorkstreamFlowNode {
  id: string;
  type: 'eventNode';
  position: {
    x: number;
    y: number;
  };
  data: WorkstreamFlowNodeData;
}

export type WorkstreamFlowEdgeKind = 'hierarchy' | 'dependency' | 'custom';

export interface WorkstreamFlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  data?: {
    kind: WorkstreamFlowEdgeKind;
  };
}

export interface WorkstreamFlowViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface WorkstreamFlowDocument {
  version: 1;
  projectId: string;
  nodes: WorkstreamFlowNode[];
  edges: WorkstreamFlowEdge[];
  viewport?: WorkstreamFlowViewport;
  checkpoints?: WorkstreamFlowCheckpoint[];
  updatedAt: string;
}

export interface WorkstreamFlowCheckpoint {
  id: string;
  label: string;
  createdAt: string;
  nodes: WorkstreamFlowNode[];
  edges: WorkstreamFlowEdge[];
  viewport?: WorkstreamFlowViewport;
}
