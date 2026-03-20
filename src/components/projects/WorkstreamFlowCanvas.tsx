import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type Viewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toast } from 'sonner@2.0.3';
import { flushSync } from 'react-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { WorkstreamFlowNode } from './WorkstreamFlowNode';
import { useWorkstreamHistory } from '../../hooks/useWorkstreamHistory';
import { useAuth } from '../../contexts/AuthContext';
import { useTeam } from '../../contexts/TeamContext';
import { UserAvatar } from '../user/UserAvatar';
import { getTaskCardSurfaceClasses } from '../shared/TaskCardSurface';
import { autoLayoutWorkstream } from '../../utils/workstream-layout';
import { ArrowDownToLine, Clock3, Target, TrendingUp } from 'lucide-react';
import {
  getWorkstreamFlowDocument,
  listWorkstreamFlowCheckpoints,
  restoreWorkstreamFlowCheckpoint,
  saveWorkstreamFlowCheckpoint,
  upsertWorkstreamFlowDocument,
} from '../../utils/workstream-flow-store';
import { appendExecutionTrailEvent } from '../../utils/execution-trail';
import type {
  WorkstreamFlowAssignee,
  WorkstreamFlowCheckpoint,
  WorkstreamFlowDocument,
  WorkstreamFlowEdge,
  WorkstreamFlowIntegrationBinding,
  WorkstreamFlowMilestone,
  WorkstreamFlowStep,
  WorkstreamFlowNode as FlowNode,
} from '../../types/workstream-flow';
import { TaskDetailModal } from '../TaskDetailModal';
import {
  INTEGRATION_CONNECTORS,
  INTEGRATION_RECIPES,
  filterIntegrationConnectors,
  type IntegrationConnector,
  type IntegrationRecipe,
} from '../../utils/integration-catalog';
import {
  connectIntegrationAccount,
  connectIntegrationAccountRemote,
  disconnectIntegrationConnection,
  disconnectIntegrationConnectionRemote,
  listIntegrationConnections,
  listIntegrationConnectionsRemote,
  reconnectIntegrationConnection,
  reconnectIntegrationConnectionRemote,
  triggerIntegrationRefreshRemote,
  validateIntegrationConnection,
  validateIntegrationConnectionRemote,
  type IntegrationConnectionAccount,
} from '../../utils/integration-connection-store';
import { projectId as supabaseProjectId, publicAnonKey } from '../../utils/supabase/info';
import {
  recordTaskSurfaceSnapshot,
  SURFACE_PARITY_REFRESH_REQUEST_EVENT,
} from '../../contracts/projections/surface-parity-runtime';

type AnyTask = Record<string, any>;
const FLOW_TEMPLATE_MIME = 'application/x-syncscript-flow-template';
const TASK_MIME = 'task';
const SUPPORTED_DRAG_MIMES = [FLOW_TEMPLATE_MIME, TASK_MIME, 'text/plain'];
const WORKSTREAM_UI_PREFS_KEY = 'syncscript:workstream-ui-prefs:v1';
interface FlowTemplatePayload {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  tags?: string[];
  resources?: any[];
  assignees?: any[];
  goalId?: string;
  milestones?: any[];
  integrations?: string[];
  integrationBindings?: WorkstreamFlowIntegrationBinding[];
  lineage?: {
    parentTaskId?: string;
    sourceNodeId?: string;
    sourceEntityType?: 'task' | 'milestone' | 'step' | string;
    sourceEntityId?: string;
    sourceEntityTitle?: string;
  };
}

interface AssigneeOption {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  fallback?: string;
  role?: string;
  group?: 'agent' | 'teammate' | 'friend';
}

interface DetailAvatarAssignee {
  id?: string;
  name: string;
  image: string;
  fallback: string;
  collaboratorType?: 'human' | 'agent';
  isExternalAgent?: boolean;
  role?: string;
  progress?: number;
  animationType?: 'glow' | 'pulse' | 'heartbeat' | 'bounce' | 'wiggle' | 'shake';
}

const TOOLBAR_BUTTON_CLASS =
  'h-7 border-gray-700 bg-[#141923] text-gray-200 transition-colors duration-150 hover:border-gray-500 hover:bg-[#1a2130] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 disabled:opacity-50';
const TOOLBAR_PRIMARY_BUTTON_CLASS =
  'h-7 text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70';
const INTEGRATION_CATEGORY_FILTERS = ['all', 'communication', 'productivity', 'engineering', 'crm', 'finance', 'data', 'automation', 'ai', 'support'] as const;
const INTEGRATION_PROVIDER_FILTERS = ['all', 'native', 'universal', 'community'] as const;
const OAUTH_PROVIDER_BY_CONNECTOR: Record<string, string> = {
  'google-calendar': 'google_calendar',
  slack: 'slack',
  github: 'github',
};

function integrationHealthClass(health: string): string {
  if (health === 'healthy') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200';
  if (health === 'expiring') return 'border-amber-500/40 bg-amber-500/10 text-amber-200';
  if (health === 'error') return 'border-red-500/40 bg-red-500/10 text-red-200';
  return 'border-gray-600 bg-gray-800/40 text-gray-300';
}

function fallbackFromName(name: string): string {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((segment) => segment[0] || '')
    .join('')
    .toUpperCase();
}

function providerAvatarFromLabel(label: string): string {
  const lower = String(label || '').toLowerCase();
  const provider =
    lower.includes('github') ? 'github'
      : lower.includes('slack') ? 'slack'
        : lower.includes('facebook') ? 'facebook'
          : lower.includes('google') ? 'google'
            : lower.includes('agent') || lower.includes('ai') || lower.includes('bot') ? 'agent'
              : lower.includes('unassigned') ? 'none'
                : 'member';
  const palette =
    provider === 'github' ? ['#111827', '#d1d5db']
      : provider === 'slack' ? ['#4a154b', '#f4e7f6']
        : provider === 'facebook' ? ['#1877f2', '#e0ecff']
          : provider === 'google' ? ['#1a73e8', '#e8f0fe']
            : provider === 'agent' ? ['#0f766e', '#ccfbf1']
              : provider === 'none' ? ['#334155', '#e2e8f0']
                : ['#1e293b', '#e2e8f0'];
  const glyph =
    provider === 'github' ? 'GH'
      : provider === 'slack' ? 'SL'
        : provider === 'facebook' ? 'FB'
          : provider === 'google' ? 'GO'
            : provider === 'agent' ? 'AI'
              : provider === 'none' ? 'NA'
                : 'ME';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="${palette[0]}"/><text x="32" y="38" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="18" font-weight="700" fill="${palette[1]}">${glyph}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function hasSupportedDragType(event: DragEvent): boolean {
  const types = event.dataTransfer?.types;
  if (!types) return false;
  return SUPPORTED_DRAG_MIMES.some((mime) => types.includes(mime));
}

function readDragPayload(event: DragEvent): string {
  return (
    event.dataTransfer?.getData(FLOW_TEMPLATE_MIME) ||
    event.dataTransfer?.getData(TASK_MIME) ||
    event.dataTransfer?.getData('text/plain') ||
    ''
  );
}

interface AiPlanTask {
  title: string;
  description?: string;
  priority?: string;
  dependsOn?: number[];
}
type PlanningStyle = 'aggressive' | 'balanced' | 'lean';

interface WorkstreamFlowCanvasProps {
  tasks: AnyTask[];
  projectId: string;
  projectName?: string;
  createTask: (input: any) => Promise<any>;
  updateTask: (id: string, updates: any) => Promise<any>;
  deleteTask?: (id: string) => Promise<void>;
  onSelectTaskId?: (taskId: string | null) => void;
  initialTitle?: string;
  fullViewport?: boolean;
  startBlank?: boolean;
  onUpdateProjectName?: (nextName: string) => void;
  onSaveProject?: (snapshot: WorkstreamFlowDocument) => void;
  onToggleBlankStart?: (next: boolean) => void;
}

function parseTaskId(nodeId: string): string {
  return String(nodeId || '').replace(/^task:/, '');
}

function toFlowSnapshot(nodes: Node[], edges: Edge[], projectId: string, viewport?: Viewport): WorkstreamFlowDocument {
  return {
    version: 1,
    projectId,
    nodes: nodes.map((node) => ({
      id: node.id,
      type: 'eventNode',
      position: node.position,
      data: {
        taskId: String((node.data as any)?.taskId || parseTaskId(node.id)),
        title: String((node.data as any)?.title || 'Untitled task'),
        status: String((node.data as any)?.status || 'todo'),
        completed: Boolean((node.data as any)?.completed),
        priority: String((node.data as any)?.priority || ''),
        dueDate: String((node.data as any)?.dueDate || ''),
        assigneeName: String((node.data as any)?.assigneeName || ''),
        assigneeAvatar: String((node.data as any)?.assigneeAvatar || ''),
        assignees: Array.isArray((node.data as any)?.assignees) ? (node.data as any)?.assignees : [],
        milestones: normalizeMilestones(Array.isArray((node.data as any)?.milestones) ? (node.data as any)?.milestones : []),
        integrations: Array.isArray((node.data as any)?.integrations)
          ? (node.data as any).integrations.map((value: any) => String(value).trim()).filter(Boolean)
          : [],
        integrationBindings: Array.isArray((node.data as any)?.integrationBindings)
          ? (node.data as any).integrationBindings
              .map((binding: any) => ({
                connectorId: String(binding?.connectorId || '').trim(),
                connectorName: String(binding?.connectorName || '').trim(),
                provider: String(binding?.provider || 'native').trim(),
                accountId: String(binding?.accountId || '').trim() || undefined,
                accountLabel: String(binding?.accountLabel || '').trim() || undefined,
                authType: String(binding?.authType || 'oauth2').trim(),
                scopes: Array.isArray(binding?.scopes) ? binding.scopes.map((scope: any) => String(scope).trim()).filter(Boolean) : [],
                connectionStatus: String(binding?.connectionStatus || 'healthy').trim(),
                category: String(binding?.category || '').trim() || undefined,
                status: String(binding?.status || 'connected').trim(),
                mode: String(binding?.mode || 'simple').trim(),
                scope: String(binding?.scope || 'task').trim(),
                attachedAt: String(binding?.attachedAt || '').trim() || new Date().toISOString(),
              }))
              .filter((binding: WorkstreamFlowIntegrationBinding) => binding.connectorId && binding.connectorName)
          : [],
        goalId: String((node.data as any)?.goalId || ''),
        goalTitle: String((node.data as any)?.goalTitle || ''),
        ownerMode: String((node.data as any)?.ownerMode || 'human_only'),
        createdByType: String((node.data as any)?.createdByType || 'human'),
        riskLevel: String((node.data as any)?.riskLevel || 'low'),
        lineage:
          (node.data as any)?.lineage && typeof (node.data as any).lineage === 'object'
            ? {
                parentTaskId: String((node.data as any).lineage.parentTaskId || ''),
                sourceNodeId: String((node.data as any).lineage.sourceNodeId || ''),
                sourceEntityType: String((node.data as any).lineage.sourceEntityType || ''),
                sourceEntityId: String((node.data as any).lineage.sourceEntityId || ''),
                sourceEntityTitle: String((node.data as any).lineage.sourceEntityTitle || ''),
              }
            : undefined,
        promotedLineageKeys: Array.isArray((node.data as any)?.promotedLineageKeys)
          ? (node.data as any).promotedLineageKeys.map((value: any) => String(value).trim().toLowerCase()).filter(Boolean)
          : [],
        projectId,
        nodeKind: 'event',
      },
    })) as FlowNode[],
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      label: typeof edge.label === 'string' ? edge.label : undefined,
      data: edge.data as any,
    })) as WorkstreamFlowEdge[],
    viewport: viewport ? { x: viewport.x, y: viewport.y, zoom: viewport.zoom } : undefined,
    updatedAt: new Date().toISOString(),
  };
}

function toReactFlowNodes(nodes: FlowNode[]): Node[] {
  return nodes.map((node) => ({
    id: node.id,
    type: 'eventNode',
    position: node.position,
    data: node.data,
  }));
}

function toReactFlowEdges(edges: WorkstreamFlowEdge[]): Edge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type || 'smoothstep',
    label: edge.label,
    data: edge.data,
  }));
}

function shallowNodeListEqual(a: Node[], b: Node[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i];
    const right = b[i];
    if (
      left.id !== right.id ||
      left.type !== right.type ||
      left.position.x !== right.position.x ||
      left.position.y !== right.position.y
    ) {
      return false;
    }
  }
  return true;
}

function shallowEdgeListEqual(a: Edge[], b: Edge[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i];
    const right = b[i];
    if (left.id !== right.id || left.source !== right.source || left.target !== right.target || left.type !== right.type) {
      return false;
    }
  }
  return true;
}

function buildLineageFocusSet(rootNodeId: string, nodes: Node[], edges: Edge[]): Set<string> {
  const nodeIds = new Set(nodes.map((node) => node.id));
  if (!rootNodeId || !nodeIds.has(rootNodeId)) return new Set<string>();
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  for (const edge of edges) {
    const source = String(edge.source || '');
    const target = String(edge.target || '');
    if (!source || !target) continue;
    if (!outgoing.has(source)) outgoing.set(source, []);
    if (!incoming.has(target)) incoming.set(target, []);
    outgoing.get(source)?.push(target);
    incoming.get(target)?.push(source);
  }
  const visited = new Set<string>([rootNodeId]);
  const queue: string[] = [rootNodeId];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    const neighbors = [...(outgoing.get(current) || []), ...(incoming.get(current) || [])];
    for (const neighbor of neighbors) {
      if (!nodeIds.has(neighbor) || visited.has(neighbor)) continue;
      visited.add(neighbor);
      queue.push(neighbor);
    }
  }
  return visited;
}

function lineageKeyOf(lineage: any): string {
  if (!lineage || typeof lineage !== 'object') return '';
  return [
    String(lineage.sourceNodeId || '').trim().toLowerCase(),
    String(lineage.sourceEntityType || '').trim().toLowerCase(),
    String(lineage.sourceEntityId || '').trim().toLowerCase(),
    String(lineage.sourceEntityTitle || '').trim().toLowerCase(),
  ].join('|');
}

function lineageEntityKey(entityType: string, entityId: string, entityTitle: string): string {
  const type = String(entityType || '').trim().toLowerCase() || 'milestone';
  const id = String(entityId || '').trim().toLowerCase();
  const title = String(entityTitle || '').trim().toLowerCase();
  return `${type}:${id || title}`;
}

function getUiPrefs(projectId: string): { compactDerivedNodes?: boolean; focusedTaskId?: string | null } {
  try {
    const raw = window.localStorage.getItem(WORKSTREAM_UI_PREFS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, any>;
    const projectPrefs = parsed?.[projectId];
    if (!projectPrefs || typeof projectPrefs !== 'object') return {};
    return {
      compactDerivedNodes:
        typeof projectPrefs.compactDerivedNodes === 'boolean' ? projectPrefs.compactDerivedNodes : undefined,
      focusedTaskId:
        typeof projectPrefs.focusedTaskId === 'string' ? projectPrefs.focusedTaskId : projectPrefs.focusedTaskId === null ? null : undefined,
    };
  } catch {
    return {};
  }
}

function setUiPrefs(
  projectId: string,
  updates: { compactDerivedNodes?: boolean; focusedTaskId?: string | null },
): void {
  try {
    const raw = window.localStorage.getItem(WORKSTREAM_UI_PREFS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, any>) : {};
    const current = parsed?.[projectId] && typeof parsed[projectId] === 'object' ? parsed[projectId] : {};
    parsed[projectId] = {
      ...current,
      ...updates,
    };
    window.localStorage.setItem(WORKSTREAM_UI_PREFS_KEY, JSON.stringify(parsed));
  } catch {
    // non-blocking
  }
}

function getTaskMilestones(task: AnyTask): any[] {
  if (Array.isArray(task?.milestones)) return task.milestones;
  if (Array.isArray(task?.subtasks)) return task.subtasks;
  return [];
}

function normalizeIncomingTaskTemplate(input: Record<string, any>): FlowTemplatePayload {
  const milestones = Array.isArray(input?.milestones)
    ? input.milestones
    : Array.isArray(input?.subtasks)
      ? input.subtasks
      : [];
  const assignees = Array.isArray(input?.assignees)
    ? input.assignees
    : Array.isArray(input?.assignedTo)
      ? input.assignedTo
      : [];
  return {
    title: String(input?.title || 'Task').trim(),
    description: String(input?.description || '').trim() || undefined,
    priority: String(input?.priority || 'medium').trim().toLowerCase(),
    dueDate: String(input?.dueDate || '').trim() || undefined,
    tags: Array.isArray(input?.tags) ? input.tags : [],
    resources: Array.isArray(input?.resources) ? input.resources : [],
    assignees,
    goalId: input?.goalId ? String(input.goalId) : undefined,
    milestones,
    integrations: Array.isArray(input?.integrations)
      ? input.integrations.map((value: any) => String(value).trim()).filter(Boolean)
      : [],
    integrationBindings: Array.isArray(input?.integrationBindings)
      ? input.integrationBindings
          .map((binding: any) => ({
            connectorId: String(binding?.connectorId || '').trim(),
            connectorName: String(binding?.connectorName || '').trim(),
            provider: String(binding?.provider || 'native').trim(),
            accountId: String(binding?.accountId || '').trim() || undefined,
            accountLabel: String(binding?.accountLabel || '').trim() || undefined,
            authType: String(binding?.authType || 'oauth2').trim(),
            scopes: Array.isArray(binding?.scopes) ? binding.scopes.map((scope: any) => String(scope).trim()).filter(Boolean) : [],
            connectionStatus: String(binding?.connectionStatus || 'healthy').trim(),
            category: String(binding?.category || '').trim() || undefined,
            status: String(binding?.status || 'connected').trim(),
            mode: String(binding?.mode || 'simple').trim(),
            scope: String(binding?.scope || 'task').trim(),
            attachedAt: String(binding?.attachedAt || '').trim() || undefined,
          }))
          .filter((binding: WorkstreamFlowIntegrationBinding) => binding.connectorId && binding.connectorName)
      : [],
    lineage: input?.lineage && typeof input.lineage === 'object'
      ? {
          parentTaskId: input.lineage.parentTaskId ? String(input.lineage.parentTaskId) : undefined,
          sourceNodeId: input.lineage.sourceNodeId ? String(input.lineage.sourceNodeId) : undefined,
          sourceEntityType: input.lineage.sourceEntityType ? String(input.lineage.sourceEntityType) : undefined,
          sourceEntityId: input.lineage.sourceEntityId ? String(input.lineage.sourceEntityId) : undefined,
          sourceEntityTitle: input.lineage.sourceEntityTitle ? String(input.lineage.sourceEntityTitle) : undefined,
        }
      : undefined,
  };
}

function getPrimaryAssigneeName(task: AnyTask): string {
  const assignees = Array.isArray(task?.assignees) ? task.assignees : [];
  const first = assignees[0];
  if (!first) return '';
  if (typeof first === 'string') return first;
  return String(first?.name || first?.email || first?.id || '');
}

function getPrimaryAssigneeMeta(task: AnyTask): { name: string; avatar: string } {
  const assignees = Array.isArray(task?.assignees) ? task.assignees : [];
  const first = assignees[0];
  if (!first) return { name: '', avatar: '' };
  if (typeof first === 'string') return { name: first, avatar: '' };
  return {
    name: String(first?.name || first?.email || first?.id || ''),
    avatar: String(first?.avatar || first?.image || ''),
  };
}

function normalizeAssigneeList(input: any[]): WorkstreamFlowAssignee[] {
  return input
    .map((entry): WorkstreamFlowAssignee | null => {
      if (typeof entry === 'string') {
        const name = entry.trim();
        if (!name) return null;
        return { name, avatar: providerAvatarFromLabel(name) };
      }
      const name = String(entry?.name || entry?.email || entry?.id || entry?.userId || '').trim();
      if (!name) return null;
      return {
        id: String(entry?.id || entry?.userId || '').trim() || undefined,
        name,
        avatar: String(entry?.avatar || entry?.image || '').trim() || providerAvatarFromLabel(name),
        role: String(entry?.role || '').trim() || undefined,
      };
    })
    .filter((entry): entry is WorkstreamFlowAssignee => Boolean(entry?.name));
}

function normalizeMilestones(input: any[]): WorkstreamFlowMilestone[] {
  const source = Array.isArray(input) ? input : [];
  const milestones: WorkstreamFlowMilestone[] = [];
  for (let milestoneIndex = 0; milestoneIndex < source.length; milestoneIndex += 1) {
    const milestone = source[milestoneIndex];
    const title = String(milestone?.title || milestone?.name || '').trim();
    if (!title) continue;
    const stepSource = Array.isArray(milestone?.steps)
      ? milestone.steps
      : Array.isArray(milestone?.subtasks)
        ? milestone.subtasks
        : [];
    const steps: WorkstreamFlowMilestone['steps'] = [];
    for (let stepIndex = 0; stepIndex < stepSource.length; stepIndex += 1) {
      const step = stepSource[stepIndex];
      const stepTitle = String(step?.title || step?.name || '').trim();
      if (!stepTitle) continue;
      const stepAssignees = normalizeAssigneeList(
        Array.isArray(step?.assignees)
          ? step.assignees
          : Array.isArray(step?.assignedTo)
            ? step.assignedTo
            : step?.assignedTo
              ? [step.assignedTo]
              : [],
      );
      steps.push({
        id: String(step?.id || `step-${milestoneIndex}-${stepIndex}`),
        title: stepTitle,
        completed: Boolean(step?.completed),
        promoted: Boolean(step?.promoted),
        promotedToTaskId: String(step?.promotedToTaskId || '').trim() || undefined,
        assignees: stepAssignees,
        resources: Array.isArray(step?.resources) ? step.resources : [],
      });
    }
    const milestoneAssignees = normalizeAssigneeList(
      Array.isArray(milestone?.assignees)
        ? milestone.assignees
        : Array.isArray(milestone?.assignedTo)
          ? milestone.assignedTo
          : milestone?.assignedTo
            ? [milestone.assignedTo]
            : [],
    );
    milestones.push({
      id: String(milestone?.id || `milestone-${milestoneIndex}`),
      title,
      completed: Boolean(milestone?.completed),
      promoted: Boolean(milestone?.promoted),
      promotedToTaskId: String(milestone?.promotedToTaskId || '').trim() || undefined,
      assignees: milestoneAssignees,
      resources: Array.isArray(milestone?.resources) ? milestone.resources : [],
      steps,
    });
  }
  return milestones;
}

function mergeMilestonePromotionState(
  previousMilestones: WorkstreamFlowMilestone[],
  incomingMilestones: WorkstreamFlowMilestone[],
): WorkstreamFlowMilestone[] {
  const previousMilestoneMap = new Map<string, WorkstreamFlowMilestone>();
  for (const milestone of previousMilestones) {
    const key = lineageEntityKey('milestone', String(milestone.id || ''), String(milestone.title || ''));
    previousMilestoneMap.set(key, milestone);
  }
  return incomingMilestones.map((milestone) => {
    const milestoneKey = lineageEntityKey('milestone', String(milestone.id || ''), String(milestone.title || ''));
    const previousMilestone = previousMilestoneMap.get(milestoneKey);
    if (!previousMilestone) return milestone;
    const previousStepMap = new Map<string, WorkstreamFlowStep>();
    for (const step of Array.isArray(previousMilestone.steps) ? previousMilestone.steps : []) {
      const key = lineageEntityKey('step', String(step.id || ''), String(step.title || ''));
      previousStepMap.set(key, step);
    }
    const mergedSteps = (Array.isArray(milestone.steps) ? milestone.steps : []).map((step) => {
      const stepKey = lineageEntityKey('step', String(step.id || ''), String(step.title || ''));
      const previousStep = previousStepMap.get(stepKey);
      if (!previousStep) return step;
      return {
        ...step,
        promoted: Boolean(step.promoted) || Boolean(previousStep.promoted),
        promotedToTaskId: step.promotedToTaskId || previousStep.promotedToTaskId,
      };
    });
    return {
      ...milestone,
      promoted: Boolean(milestone.promoted) || Boolean(previousMilestone.promoted),
      promotedToTaskId: milestone.promotedToTaskId || previousMilestone.promotedToTaskId,
      steps: mergedSteps,
    };
  });
}

function setTemplateDragPayload(event: DragEvent<HTMLElement>, payload: FlowTemplatePayload): void {
  const json = JSON.stringify(payload);
  event.dataTransfer.setData(FLOW_TEMPLATE_MIME, json);
  event.dataTransfer.setData(TASK_MIME, json);
  event.dataTransfer.setData('text/plain', json);
  event.dataTransfer.effectAllowed = 'copy';
}

function getOrCreateGuestAiSessionId(): string {
  const key = 'syncscript:guest-ai-session-id';
  try {
    const existing = window.localStorage.getItem(key);
    if (existing && existing.trim()) return existing;
    const next = `gs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    window.localStorage.setItem(key, next);
    return next;
  } catch {
    return `gs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

function extractJsonPayload(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

function normalizePriority(input: unknown): 'high' | 'medium' | 'low' {
  const value = String(input || '').trim().toLowerCase();
  if (value === 'high' || value === 'urgent' || value === 'critical') return 'high';
  if (value === 'low' || value === 'minor') return 'low';
  return 'medium';
}

function cleanTaskTitle(title: string): string {
  const clean = title
    .replace(/^[\-\*\d\.\)\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return '';
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function inferDeterministicDependsOn(index: number, title: string, style: PlanningStyle): number[] {
  if (index <= 0) return [];
  const text = title.toLowerCase();
  if (style === 'aggressive') {
    if (/review|qa|ship|launch|deploy|handoff/.test(text)) return [Math.max(0, index - 1), Math.max(0, index - 2)].filter((v, i, arr) => arr.indexOf(v) === i);
    return [Math.max(0, index - 1)];
  }
  if (style === 'lean') {
    return index <= 1 ? [Math.max(0, index - 1)] : [];
  }
  if (/final|review|qa|ship|launch|deploy|handoff/.test(text)) {
    return [Math.max(0, index - 1)];
  }
  if (/set up|setup|define|discover|research|requirements/.test(text)) {
    return [];
  }
  if (/build|implement|create|draft|prepare/.test(text)) {
    return [Math.max(0, index - 1)];
  }
  return [Math.max(0, index - 1)];
}

function normalizeAndRankPlan(tasks: AiPlanTask[], style: PlanningStyle): AiPlanTask[] {
  const cleaned = tasks
    .map((task, index) => {
      const title = cleanTaskTitle(String(task.title || ''));
      return {
        title,
        description: String(task.description || '').trim(),
        priority: normalizePriority(task.priority),
        dependsOn: Array.isArray(task.dependsOn)
          ? task.dependsOn
              .map((dep) => Number(dep))
              .filter((dep) => Number.isFinite(dep) && dep >= 0 && dep < index)
          : inferDeterministicDependsOn(index, title, style),
      };
    })
    .filter((task) => Boolean(task.title));

  const deduped: AiPlanTask[] = [];
  const seen = new Set<string>();
  for (const task of cleaned) {
    const key = task.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(task);
  }
  const cap = style === 'aggressive' ? 8 : style === 'lean' ? 4 : 6;
  return deduped.slice(0, cap);
}

function buildDeterministicFallbackPlan(prompt: string, style: PlanningStyle): AiPlanTask[] {
  const clean = prompt.trim();
  if (!clean) return [];
  const splitSegments = clean
    .split(/(?:\.\s+|\n|,\s+| and then | then | -> )/i)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 6);
  if (splitSegments.length >= 2) {
    return normalizeAndRankPlan(
      splitSegments.map((title, index) => ({
        title,
        priority: 'medium',
        dependsOn: inferDeterministicDependsOn(index, title, style),
      })),
      style,
    );
  }
  const stylePlan =
    style === 'aggressive'
      ? [
          { title: `Discovery and requirements for ${clean}`, priority: 'medium', dependsOn: [] },
          { title: `Architecture and implementation plan`, priority: 'high', dependsOn: [0] },
          { title: `Build core deliverable`, priority: 'high', dependsOn: [1] },
          { title: `Integrate dependencies and edge cases`, priority: 'high', dependsOn: [2] },
          { title: `QA, launch, and handoff`, priority: 'medium', dependsOn: [3] },
        ]
      : style === 'lean'
      ? [
          { title: `Scope ${clean}`, priority: 'medium', dependsOn: [] },
          { title: `Execute ${clean}`, priority: 'high', dependsOn: [0] },
          { title: `Review and ship`, priority: 'medium', dependsOn: [1] },
        ]
      : [
          { title: `Define scope for ${clean}`, priority: 'medium', dependsOn: [] },
          { title: `Create implementation plan for ${clean}`, priority: 'high', dependsOn: [0] },
          { title: `Execute and validate ${clean}`, priority: 'high', dependsOn: [1] },
          { title: `QA, launch, and handoff`, priority: 'medium', dependsOn: [2] },
        ];
  return normalizeAndRankPlan(stylePlan, style);
}

function WorkstreamFlowCanvasInner({
  tasks,
  projectId,
  projectName,
  createTask,
  updateTask,
  deleteTask,
  onSelectTaskId,
  initialTitle,
  fullViewport = false,
  startBlank = false,
  onUpdateProjectName,
  onSaveProject,
  onToggleBlankStart,
}: WorkstreamFlowCanvasProps) {
  const { accessToken } = useAuth();
  const { activeTeam } = useTeam();
  const reactFlow = useReactFlow();
  const autoFitProjectRef = useRef<string>('');
  const canvasShellRef = useRef<HTMLDivElement | null>(null);
  const dropEnterCounterRef = useRef(0);
  const draggedTemplateRef = useRef<FlowTemplatePayload | null>(null);
  const lastDropSignatureRef = useRef<{ signature: string; at: number } | null>(null);
  const lastPromoteSignatureRef = useRef<{ signature: string; at: number } | null>(null);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [planningStyle, setPlanningStyle] = useState<PlanningStyle>('balanced');
  const [canvasReady, setCanvasReady] = useState(false);
  const [isCanvasDropActive, setIsCanvasDropActive] = useState(false);
  const [dropPreview, setDropPreview] = useState<{ title: string; priority?: string; dueDate?: string } | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [assigneePickerOpen, setAssigneePickerOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [integrationsModalOpen, setIntegrationsModalOpen] = useState(false);
  const [integrationMode, setIntegrationMode] = useState<'simple' | 'advanced'>('simple');
  const [integrationSearch, setIntegrationSearch] = useState('');
  const [integrationCategoryFilter, setIntegrationCategoryFilter] = useState('all');
  const [integrationProviderFilter, setIntegrationProviderFilter] = useState('all');
  const [integrationAccounts, setIntegrationAccounts] = useState<IntegrationConnectionAccount[]>([]);
  const [newAccountLabel, setNewAccountLabel] = useState('');
  const [pendingOAuthConnectorId, setPendingOAuthConnectorId] = useState<string | null>(null);
  const [taskDetailModalOpen, setTaskDetailModalOpen] = useState(false);
  const [taskDetailTaskId, setTaskDetailTaskId] = useState<string | null>(null);
  const [isAiPlanning, setIsAiPlanning] = useState(false);
  const [projectTitleDraft, setProjectTitleDraft] = useState(projectName || 'Untitled Workflow');
  const [saveState, setSaveState] = useState<'saved' | 'unsaved' | 'saving'>('saved');
  const [interactionMode, setInteractionMode] = useState<'select' | 'pan'>('select');
  const [viewportZoom, setViewportZoom] = useState(1);
  const [compactDerivedNodes, setCompactDerivedNodes] = useState<boolean>(() => {
    const prefs = getUiPrefs(projectId);
    return typeof prefs.compactDerivedNodes === 'boolean' ? prefs.compactDerivedNodes : true;
  });
  const [lineageFocusRootId, setLineageFocusRootId] = useState<string | null>(null);
  const [useBlankStart, setUseBlankStart] = useState(startBlank);
  const [checkpointLabel, setCheckpointLabel] = useState('');
  const [checkpoints, setCheckpoints] = useState<WorkstreamFlowCheckpoint[]>([]);
  const tasksById = useMemo(
    () => new Map(tasks.map((task) => [String(task.id), task])),
    [tasks],
  );
  useEffect(() => {
    recordTaskSurfaceSnapshot(
      'workstream',
      tasks.map((task) => String(task?.id || '')).filter(Boolean),
      projectId || 'workspace-main',
    );
  }, [tasks, projectId]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent)?.detail as any;
      const targetSurface = String(detail?.surface || '');
      const targetScope = String(detail?.scopeId || '').trim();
      const scope = projectId || 'workspace-main';
      const scopeMatches = !targetScope || targetScope === scope || targetScope === 'workspace-main';
      if (!scopeMatches) return;
      if (targetSurface !== 'all' && targetSurface !== 'workstream') return;
      recordTaskSurfaceSnapshot(
        'workstream',
        tasks.map((task) => String(task?.id || '')).filter(Boolean),
        scope,
      );
    };
    window.addEventListener(SURFACE_PARITY_REFRESH_REQUEST_EVENT, handler as EventListener);
    return () =>
      window.removeEventListener(SURFACE_PARITY_REFRESH_REQUEST_EVENT, handler as EventListener);
  }, [tasks, projectId]);
  const assigneeOptions = useMemo<AssigneeOption[]>(() => {
    const options = new Map<string, AssigneeOption>();
    for (const member of activeTeam?.members || []) {
      const name = String(member?.name || '').trim();
      if (!name) continue;
      const key = name.toLowerCase();
      options.set(key, {
        id: String(member.userId || key),
        name,
        email: String(member.email || '').trim() || undefined,
        avatar: String(member.image || '').trim() || undefined,
        fallback: String(member.fallback || '').trim() || undefined,
        role: String(member.role || '').trim() || undefined,
        group: String(member.role || '').toLowerCase().includes('agent') ? 'agent' : 'teammate',
      });
    }
    for (const task of tasks) {
      const assignees = Array.isArray(task?.assignees) ? task.assignees : [];
      for (const entry of assignees) {
        const name = typeof entry === 'string'
          ? entry.trim()
          : String(entry?.name || entry?.email || entry?.id || '').trim();
        if (!name) continue;
        const key = name.toLowerCase();
        if (options.has(key)) continue;
        options.set(key, {
          id: typeof entry === 'string' ? `name:${key}` : String(entry?.id || entry?.userId || `name:${key}`),
          name,
          email: typeof entry === 'string' ? undefined : String(entry?.email || '').trim() || undefined,
          avatar: typeof entry === 'string' ? undefined : String(entry?.avatar || entry?.image || '').trim() || undefined,
          role: typeof entry === 'string' ? undefined : String(entry?.role || '').trim() || undefined,
          group:
            typeof entry === 'string'
              ? 'friend'
              : String(entry?.collaboratorType || entry?.role || '').toLowerCase().includes('agent')
                ? 'agent'
                : options.has(key)
                  ? options.get(key)?.group
                  : 'friend',
        });
      }
    }
    return Array.from(options.values()).slice(0, 40);
  }, [activeTeam?.members, tasks]);
  const templateLibrary = useMemo(() => {
    return tasks.slice(0, 20).map((task) => ({
      taskId: String(task.id),
      title: String(task.title || 'Task'),
      priority: String(task.priority || 'medium'),
      dueDate: String(task.dueDate || ''),
      tags: Array.isArray(task.tags) ? task.tags : [],
      resources: Array.isArray(task.resources) ? task.resources : [],
      assignees: Array.isArray(task.assignees) ? task.assignees : [],
      goalId: task.goalId ? String(task.goalId) : undefined,
      milestones: getTaskMilestones(task),
    }));
  }, [tasks]);
  const starterLibrary = useMemo<FlowTemplatePayload[]>(
    () => [
      {
        title: 'Review Q4 budget',
        priority: 'high',
        assignees: [{ name: 'Finance Lead' }],
        milestones: [
          {
            id: 'ms-q4-collect',
            title: 'Collect department budgets',
            assignedTo: [{ name: 'Department Ops' }],
            steps: [
              { id: 'st-q4-collect-1', title: 'Request submissions', assignedTo: { name: 'Department Ops' } },
              { id: 'st-q4-collect-2', title: 'Consolidate budget sheets', assignedTo: { name: 'Finance Analyst' } },
            ],
          },
          {
            id: 'ms-q4-variance',
            title: 'Review variance reports',
            assignedTo: [{ name: 'Finance Analyst' }],
            steps: [
              { id: 'st-q4-var-1', title: 'Flag major deltas', assignedTo: { name: 'Finance Lead' } },
              { id: 'st-q4-var-2', title: 'Validate assumptions', assignedTo: { name: 'Controller' } },
            ],
          },
          {
            id: 'ms-q4-present',
            title: 'Prepare presentation',
            assignedTo: [{ name: 'Executive PM' }],
            steps: [
              { id: 'st-q4-pres-1', title: 'Draft board slides', assignedTo: { name: 'Executive PM' } },
              { id: 'st-q4-pres-2', title: 'Rehearse executive review', assignedTo: { name: 'Finance Lead' } },
            ],
          },
        ],
      },
      {
        title: 'Define scope',
        priority: 'medium',
        assignees: [{ name: 'Project Owner' }],
        milestones: [
          {
            id: 'ms-scope-1',
            title: 'Gather requirements',
            assignedTo: [{ name: 'Product Lead' }],
            steps: [
              { id: 'st-scope-1', title: 'Interview stakeholders', assignedTo: { name: 'Product Lead' } },
              { id: 'st-scope-2', title: 'Document constraints', assignedTo: { name: 'Tech Lead' } },
            ],
          },
        ],
      },
      {
        title: 'Execute core work',
        priority: 'high',
        assignees: [{ name: 'Delivery Lead' }],
        milestones: [
          {
            id: 'ms-exec-1',
            title: 'Build core deliverable',
            assignedTo: [{ name: 'Engineering' }],
            steps: [
              { id: 'st-exec-1', title: 'Implement feature set', assignedTo: { name: 'Engineering' } },
              { id: 'st-exec-2', title: 'Run QA pass', assignedTo: { name: 'QA' } },
            ],
          },
        ],
      },
    ],
    [],
  );
  const canSyncTask = useCallback(
    (taskId: string) => taskId.trim().length > 0 && tasksById.has(taskId),
    [tasksById],
  );

  useEffect(() => {
    setProjectTitleDraft(projectName || 'Untitled Workflow');
  }, [projectName, projectId]);

  const initialSnapshot = useMemo(() => {
    const base: WorkstreamFlowDocument = useBlankStart
      ? {
          version: 1,
          projectId,
          nodes: [],
          edges: [],
          updatedAt: new Date().toISOString(),
        }
      : (getWorkstreamFlowDocument(projectId) || {
          version: 1,
          projectId,
          nodes: [],
          edges: [],
          updatedAt: new Date().toISOString(),
        });
    return {
      nodes: toReactFlowNodes(base.nodes),
      edges: toReactFlowEdges(base.edges),
    };
  }, [projectId, useBlankStart]);

  const history = useWorkstreamHistory(initialSnapshot);
  const [nodes, setNodes] = useState<Node[]>(history.current.nodes);
  const [edges, setEdges] = useState<Edge[]>(history.current.edges);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    setNodes((current) => (shallowNodeListEqual(current, history.current.nodes) ? current : history.current.nodes));
    setEdges((current) => (shallowEdgeListEqual(current, history.current.edges) ? current : history.current.edges));
  }, [history.current.nodes, history.current.edges]);

  const selectedTask = useMemo(
    () => (selectedTaskId ? tasksById.get(selectedTaskId) || null : null),
    [selectedTaskId, tasksById],
  );
  const selectedNodeAssignees = useMemo(() => {
    if (!selectedTaskId) return [];
    const current = nodes.find((node) => parseTaskId(node.id) === selectedTaskId);
    const raw = Array.isArray((current?.data as any)?.assignees) ? (current?.data as any)?.assignees : [];
    return normalizeAssigneeList(raw);
  }, [nodes, selectedTaskId]);
  const selectedAssignees = useMemo(() => {
    // Prefer node-local assignees for immediate UI feedback after assign/unassign actions.
    if (selectedNodeAssignees.length > 0) return selectedNodeAssignees;
    if (selectedTask) {
      const raw = Array.isArray(selectedTask.assignees) ? selectedTask.assignees : [];
      return normalizeAssigneeList(raw);
    }
    return [];
  }, [selectedNodeAssignees, selectedTask]);
  const assignGroups = useMemo(() => {
    const agents = assigneeOptions.filter((option) => option.group === 'agent');
    const teammates = assigneeOptions.filter((option) => option.group === 'teammate');
    const friends = assigneeOptions.filter((option) => option.group === 'friend');
    return { agents, teammates, friends };
  }, [assigneeOptions]);
  const taskDetailTask = useMemo(
    () => {
      if (!taskDetailTaskId) return null;
      const fromTasks = tasksById.get(taskDetailTaskId);
      if (fromTasks) return fromTasks;

      const sourceNode = nodes.find((node) => parseTaskId(node.id) === taskDetailTaskId);
      if (!sourceNode) return null;
      const nodeData = (sourceNode.data || {}) as Record<string, any>;
      const nodeAssignees = normalizeAssigneeList(Array.isArray(nodeData.assignees) ? nodeData.assignees : []);
      const avatarAssignees: DetailAvatarAssignee[] = nodeAssignees.map((entry, index) => {
        const key = String(entry.name || '').toLowerCase();
        const option = assigneeOptions.find((candidate) => candidate.name.toLowerCase() === key);
        const role = String(option?.role || entry.role || '').toLowerCase();
        const isAgent = role.includes('agent');
        return {
          id: entry.id || option?.id,
          name: entry.name,
          image: entry.avatar || option?.avatar || providerAvatarFromLabel(entry.name),
          fallback: option?.fallback || fallbackFromName(entry.name),
          collaboratorType: isAgent ? 'agent' : 'human',
          isExternalAgent: false,
          role: option?.role || entry.role || (isAgent ? 'agent' : 'collaborator'),
          progress: Number.isFinite((option as any)?.progress) ? Number((option as any).progress) : Math.max(20, 88 - index * 14),
          animationType:
            ((option as any)?.animationType as DetailAvatarAssignee['animationType']) ||
            (isAgent ? 'glow' : 'pulse'),
        };
      });

      const nodeMilestones = normalizeMilestones(Array.isArray(nodeData.milestones) ? nodeData.milestones : []);
      const subtasks = nodeMilestones.map((milestone, milestoneIndex) => ({
        id: String(milestone.id || `milestone-${milestoneIndex}`),
        title: String(milestone.title || `Milestone ${milestoneIndex + 1}`),
        completed: Boolean(milestone.completed),
        completedBy: null,
        completedAt: null,
        assignedTo: normalizeAssigneeList(Array.isArray(milestone.assignees) ? milestone.assignees : []).map((assignee) => ({
          name: assignee.name,
          image: assignee.avatar || providerAvatarFromLabel(assignee.name),
          fallback: fallbackFromName(assignee.name),
          collaboratorType: String(assignee.role || '').toLowerCase().includes('agent') ? 'agent' : 'human',
          isExternalAgent: false,
        })),
        steps: (Array.isArray(milestone.steps) ? milestone.steps : []).map((step, stepIndex) => {
          const stepAssignee = normalizeAssigneeList(Array.isArray(step.assignees) ? step.assignees : [])[0];
          return {
            id: String(step.id || `step-${milestoneIndex}-${stepIndex}`),
            title: String(step.title || `Step ${stepIndex + 1}`),
            completed: Boolean(step.completed),
            assignedTo: stepAssignee
              ? {
                  name: stepAssignee.name,
                  image: stepAssignee.avatar || providerAvatarFromLabel(stepAssignee.name),
                  fallback: fallbackFromName(stepAssignee.name),
                  collaboratorType: String(stepAssignee.role || '').toLowerCase().includes('agent') ? 'agent' : 'human',
                  isExternalAgent: false,
                }
              : {
                  name: 'Unassigned',
                  image: providerAvatarFromLabel('unassigned'),
                  fallback: 'UN',
                  collaboratorType: 'human',
                  isExternalAgent: false,
                },
            resources: Array.isArray(step.resources) ? step.resources : [],
          };
        }),
        resources: Array.isArray(milestone.resources) ? milestone.resources : [],
      }));

      return {
        id: taskDetailTaskId,
        title: String(nodeData.title || 'Untitled task'),
        description: String(nodeData.description || 'Task created on Workstream canvas.'),
        priority: String(nodeData.priority || 'medium'),
        energyLevel: String(nodeData.energyLevel || 'medium'),
        estimatedTime: String(nodeData.estimatedTime || '30 min'),
        progress: 0,
        tags: Array.isArray(nodeData.tags) ? nodeData.tags : [],
        dueDate: String(nodeData.dueDate || ''),
        goalId: String(nodeData.goalId || ''),
        completed: Boolean(nodeData.completed),
        collaborators: avatarAssignees,
        assignees: avatarAssignees,
        subtasks,
        activity: [],
        resources: Array.isArray(nodeData.resources) ? nodeData.resources : [],
        currentUserRole: 'creator',
      };
    },
    [assigneeOptions, nodes, taskDetailTaskId, tasksById],
  );
  const selectedNodeIntegrations = useMemo(() => {
    if (!selectedTaskId) return [];
    const current = nodes.find((node) => parseTaskId(node.id) === selectedTaskId);
    const legacy = Array.isArray((current?.data as any)?.integrations) ? (current?.data as any)?.integrations : [];
    const bindings = Array.isArray((current?.data as any)?.integrationBindings) ? (current?.data as any)?.integrationBindings : [];
    const next = new Set<string>();
    for (const value of legacy) {
      const id = String(value).trim();
      if (id) next.add(id);
    }
    for (const binding of bindings) {
      const id = String(binding?.connectorId || '').trim();
      if (id) next.add(id);
    }
    return Array.from(next);
  }, [nodes, selectedTaskId]);
  const selectedIntegrationBindings = useMemo<WorkstreamFlowIntegrationBinding[]>(() => {
    if (!selectedTaskId) return [];
    const current = nodes.find((node) => parseTaskId(node.id) === selectedTaskId);
    const raw = Array.isArray((current?.data as any)?.integrationBindings) ? (current?.data as any)?.integrationBindings : [];
    return raw
      .map((binding: any) => ({
        connectorId: String(binding?.connectorId || '').trim(),
        connectorName: String(binding?.connectorName || '').trim(),
        provider: String(binding?.provider || 'native').trim(),
        accountId: String(binding?.accountId || '').trim() || undefined,
        accountLabel: String(binding?.accountLabel || '').trim() || undefined,
        authType: String(binding?.authType || 'oauth2').trim(),
        scopes: Array.isArray(binding?.scopes) ? binding.scopes.map((scope: any) => String(scope).trim()).filter(Boolean) : [],
        connectionStatus: String(binding?.connectionStatus || 'healthy').trim(),
        category: String(binding?.category || '').trim() || undefined,
        status: String(binding?.status || 'connected').trim(),
        mode: String(binding?.mode || 'simple').trim(),
        scope: String(binding?.scope || 'task').trim(),
        attachedAt: String(binding?.attachedAt || '').trim() || undefined,
      }))
      .filter((binding: WorkstreamFlowIntegrationBinding) => binding.connectorId && binding.connectorName);
  }, [nodes, selectedTaskId]);
  const selectedConnectorAccounts = useMemo(() => {
    const map = new Map<string, IntegrationConnectionAccount[]>();
    for (const account of integrationAccounts) {
      const key = String(account.connectorId || '').trim();
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(account);
    }
    return map;
  }, [integrationAccounts]);
  const integrationHealthSummary = useMemo(() => {
    const connected = integrationAccounts.filter((account) => account.health !== 'disconnected');
    return {
      total: integrationAccounts.length,
      connected: connected.length,
      healthy: connected.filter((account) => account.health === 'healthy').length,
      attention: connected.filter((account) => account.health === 'expiring' || account.health === 'error').length,
    };
  }, [integrationAccounts]);
  const filteredIntegrationConnectors = useMemo(() => {
    return filterIntegrationConnectors(
      INTEGRATION_CONNECTORS,
      integrationSearch,
      integrationCategoryFilter,
      integrationProviderFilter,
    );
  }, [integrationCategoryFilter, integrationProviderFilter, integrationSearch]);
  const recommendedRecipes = useMemo<IntegrationRecipe[]>(() => {
    if (!integrationSearch.trim()) return INTEGRATION_RECIPES;
    const clean = integrationSearch.trim().toLowerCase();
    return INTEGRATION_RECIPES.filter((recipe) => {
      return (
        recipe.name.toLowerCase().includes(clean) ||
        recipe.description.toLowerCase().includes(clean) ||
        recipe.connectorIds.some((id) => id.includes(clean))
      );
    });
  }, [integrationSearch]);
  const integrationConnectorById = useMemo(() => {
    return new Map<string, IntegrationConnector>(INTEGRATION_CONNECTORS.map((connector) => [connector.id, connector]));
  }, []);
  const connectorIdByOAuthProvider = useMemo(() => {
    const entries = Object.entries(OAUTH_PROVIDER_BY_CONNECTOR).map(([connectorId, providerId]) => [providerId, connectorId] as const);
    return new Map<string, string>(entries);
  }, []);
  const selectedNodeId = useMemo(() => {
    if (!selectedTaskId) return null;
    const selectedNode = nodes.find((node) => parseTaskId(node.id) === selectedTaskId);
    return selectedNode?.id || null;
  }, [nodes, selectedTaskId]);
  const lineageFocusSet = useMemo(() => {
    if (!lineageFocusRootId) return null;
    const focused = buildLineageFocusSet(lineageFocusRootId, nodes, edges);
    return focused.size > 0 ? focused : null;
  }, [edges, lineageFocusRootId, nodes]);
  const focusCandidateNodeId = useMemo(() => {
    if (selectedNodeId) return selectedNodeId;
    const reversed = [...nodes].reverse();
    const latestDerived = reversed.find((node) => Boolean((node.data as any)?.lineage?.sourceNodeId));
    if (latestDerived?.id) return latestDerived.id;
    return reversed[0]?.id || null;
  }, [nodes, selectedNodeId]);
  const unsyncedNodeCount = useMemo(
    () => nodes.filter((node) => !canSyncTask(parseTaskId(String(node.id || '')))).length,
    [canSyncTask, nodes],
  );
  const hasDerivedNodeForLineage = useCallback((lineage: any): boolean => {
    const key = lineageKeyOf(lineage);
    if (!key) return false;
    return nodesRef.current.some((node) => lineageKeyOf((node.data as any)?.lineage) === key);
  }, []);
  const displayNodes = useMemo(() => {
    const denseView = viewportZoom <= 0.74;
    const ultraDenseView = viewportZoom <= 0.52;
    return nodes.map((node) => {
      const data = node.data as any;
      const isDerived = Boolean(data?.lineage?.sourceNodeId);
      const hidden = lineageFocusSet ? !lineageFocusSet.has(node.id) : false;
      const isFocusRoot = Boolean(lineageFocusRootId && node.id === lineageFocusRootId);
      const inFocusLineage = lineageFocusSet ? lineageFocusSet.has(node.id) : true;
      return {
        ...node,
        hidden,
        data: {
          ...data,
          compactView: compactDerivedNodes && isDerived,
          focusActive: Boolean(lineageFocusRootId),
          isFocusRoot,
          inFocusLineage,
          denseView,
          ultraDenseView,
          viewportZoom,
        },
      };
    });
  }, [compactDerivedNodes, lineageFocusRootId, lineageFocusSet, nodes, viewportZoom]);
  const displayEdges = useMemo(() => {
    return edges.map((edge) => {
      const sourceId = String(edge.source || '');
      const targetId = String(edge.target || '');
      const visible =
        !lineageFocusSet ||
        (lineageFocusSet.has(sourceId) && lineageFocusSet.has(targetId));
      const inFocus = !lineageFocusSet || (lineageFocusSet.has(sourceId) && lineageFocusSet.has(targetId));
      const showLabel = viewportZoom >= 0.78;
      const width = viewportZoom <= 0.52 ? 1 : viewportZoom <= 0.74 ? 1.2 : 1.5;
      const stroke = inFocus ? '#38bdf8' : '#334155';
      return {
        ...edge,
        hidden: !visible,
        label: showLabel ? edge.label : undefined,
        labelStyle: showLabel ? { fill: '#93c5fd', fontSize: 10, fontWeight: 600 } : undefined,
        style: {
          stroke,
          strokeWidth: width,
          opacity: visible ? (showLabel ? 0.9 : 0.75) : 0.25,
        },
      };
    });
  }, [edges, lineageFocusSet, viewportZoom]);
  const lineageFocusRootTitle = useMemo(() => {
    if (!lineageFocusRootId) return '';
    const node = nodes.find((entry) => entry.id === lineageFocusRootId);
    return String((node?.data as any)?.title || '').trim();
  }, [lineageFocusRootId, nodes]);
  const miniMapNodeColor = useCallback((node: Node) => {
    const nodeId = String(node.id || '');
    const data = node.data as any;
    const isDerived = Boolean(data?.lineage?.sourceNodeId);
    const isFocusRoot = Boolean(lineageFocusRootId && nodeId === lineageFocusRootId);
    const inFocus = lineageFocusSet ? lineageFocusSet.has(nodeId) : true;
    if (isFocusRoot) return '#22d3ee';
    if (lineageFocusRootId && inFocus) return '#38bdf8';
    if (!inFocus) return '#111827';
    if (compactDerivedNodes && isDerived) return '#a78bfa';
    return '#64748b';
  }, [compactDerivedNodes, lineageFocusRootId, lineageFocusSet]);

  useEffect(() => {
    const base: WorkstreamFlowDocument = useBlankStart
      ? {
          version: 1,
          projectId,
          nodes: [],
          edges: [],
          updatedAt: new Date().toISOString(),
        }
      : (getWorkstreamFlowDocument(projectId) || {
          version: 1,
          projectId,
          nodes: [],
          edges: [],
          updatedAt: new Date().toISOString(),
        });
    const nextNodes = toReactFlowNodes(base.nodes);
    const nextEdges = toReactFlowEdges(base.edges);
    history.replaceCurrent({ nodes: nextNodes, edges: nextEdges });
    setNodes(nextNodes);
    setEdges(nextEdges);
    if (useBlankStart) {
      upsertWorkstreamFlowDocument(base);
    }
    setCheckpoints(listWorkstreamFlowCheckpoints(projectId));
  }, [projectId, useBlankStart]);

  useEffect(() => {
    setUseBlankStart(startBlank);
  }, [startBlank]);

  useEffect(() => {
    if (!selectedTaskId) {
      setAssigneePickerOpen(false);
    }
  }, [selectedTaskId]);

  useEffect(() => {
    if (!integrationsModalOpen) return;
    setIntegrationSearch('');
    setIntegrationCategoryFilter('all');
    setIntegrationProviderFilter('all');
    setIntegrationAccounts(listIntegrationConnections(projectId));
    void listIntegrationConnectionsRemote(projectId, accessToken || publicAnonKey)
      .then((accounts) => setIntegrationAccounts(accounts))
      .catch(() => {
        // keep local fallback
      });
    setNewAccountLabel('');
  }, [accessToken, integrationsModalOpen, projectId]);

  useEffect(() => {
    const handleOAuthCallback = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const payload = event.data;
      if (!payload || payload.type !== 'oauth-callback') return;
      const providerId = String(payload.provider || '').trim();
      const connectorId = connectorIdByOAuthProvider.get(providerId);
      if (!connectorId) return;
      const connector = integrationConnectorById.get(connectorId);
      if (!connector) return;
      setPendingOAuthConnectorId(null);
      if (payload.success) {
        void (async () => {
          const suggestedLabel =
            String(payload?.data?.account?.email || payload?.data?.account?.name || newAccountLabel).trim() ||
            `${connector.name} Workspace Account`;
          connectIntegrationAccount(projectId, connector, suggestedLabel);
          setIntegrationAccounts(listIntegrationConnections(projectId));
          await connectIntegrationAccountRemote(
            projectId,
            connector,
            suggestedLabel,
            accessToken || publicAnonKey,
          ).catch(() => undefined);
          const remote = await listIntegrationConnectionsRemote(projectId, accessToken || publicAnonKey).catch(() => []);
          if (remote.length > 0) {
            setIntegrationAccounts(remote);
          }
          appendExecutionTrailEvent({
            type: 'integration_connected',
            title: `${connector.name} OAuth connected`,
            detail: suggestedLabel,
            projectId,
            actor: 'User',
          });
          toast.success(`${connector.name} account connected`);
        })();
      } else {
        toast.error(`OAuth failed for ${connector.name}`);
      }
    };
    window.addEventListener('message', handleOAuthCallback);
    return () => window.removeEventListener('message', handleOAuthCallback);
  }, [accessToken, connectorIdByOAuthProvider, integrationConnectorById, newAccountLabel, projectId]);

  useEffect(() => {
    const handleOpenTask = (rawEvent: Event) => {
      const event = rawEvent as CustomEvent<{ taskId?: string }>;
      const taskId = String(event.detail?.taskId || '').trim();
      if (!taskId) return;
      setSelectedTaskId(taskId);
      onSelectTaskId?.(taskId);
      setTaskDetailTaskId(taskId);
      setTaskDetailModalOpen(true);
    };
    const handleOpenAssign = (rawEvent: Event) => {
      const event = rawEvent as CustomEvent<{ taskId?: string }>;
      const taskId = String(event.detail?.taskId || '').trim();
      if (!taskId) return;
      setSelectedTaskId(taskId);
      onSelectTaskId?.(taskId);
      setAssignModalOpen(true);
    };
    const handleOpenIntegrations = (rawEvent: Event) => {
      const event = rawEvent as CustomEvent<{ taskId?: string }>;
      const taskId = String(event.detail?.taskId || '').trim();
      if (!taskId) return;
      setSelectedTaskId(taskId);
      onSelectTaskId?.(taskId);
      setIntegrationsModalOpen(true);
    };
    window.addEventListener('syncscript:workstream-open-task', handleOpenTask as EventListener);
    window.addEventListener('syncscript:workstream-open-assign', handleOpenAssign as EventListener);
    window.addEventListener('syncscript:workstream-open-integrations', handleOpenIntegrations as EventListener);
    return () => {
      window.removeEventListener('syncscript:workstream-open-task', handleOpenTask as EventListener);
      window.removeEventListener('syncscript:workstream-open-assign', handleOpenAssign as EventListener);
      window.removeEventListener('syncscript:workstream-open-integrations', handleOpenIntegrations as EventListener);
    };
  }, [onSelectTaskId]);

  useEffect(() => {
    if (!lineageFocusRootId) return;
    if (!nodes.some((node) => node.id === lineageFocusRootId)) {
      setLineageFocusRootId(null);
    }
  }, [lineageFocusRootId, nodes]);

  useEffect(() => {
    const prefs = getUiPrefs(projectId);
    if (typeof prefs.compactDerivedNodes === 'boolean') {
      setCompactDerivedNodes(prefs.compactDerivedNodes);
    } else {
      setCompactDerivedNodes(true);
    }
    if (prefs.focusedTaskId) {
      const node = nodes.find((entry) => parseTaskId(entry.id) === prefs.focusedTaskId);
      setLineageFocusRootId(node?.id || null);
    } else {
      setLineageFocusRootId(null);
    }
  }, [projectId, nodes]);

  useEffect(() => {
    const focusedTaskId = lineageFocusRootId ? parseTaskId(lineageFocusRootId) : null;
    setUiPrefs(projectId, {
      compactDerivedNodes,
      focusedTaskId,
    });
  }, [compactDerivedNodes, lineageFocusRootId, projectId]);

  useEffect(() => {
    if (nodes.length === 0) return;
    requestAnimationFrame(() => {
      reactFlow.fitView({ duration: 260, padding: lineageFocusRootId ? 0.2 : 0.22 });
    });
  }, [lineageFocusRootId, reactFlow]);

  const persist = useCallback((nextNodes: Node[], nextEdges: Edge[]) => {
    setSaveState('saving');
    const viewport = reactFlow.getViewport();
    const snapshot = toFlowSnapshot(nextNodes, nextEdges, projectId, viewport);
    upsertWorkstreamFlowDocument(snapshot);
    window.setTimeout(() => setSaveState('saved'), 120);
  }, [projectId, reactFlow]);

  const getSnapshot = useCallback((): WorkstreamFlowDocument => {
    const viewport = reactFlow.getViewport();
    return toFlowSnapshot(nodes, edges, projectId, viewport);
  }, [edges, nodes, projectId, reactFlow]);

  useEffect(() => {
    setNodes((currentNodes) => {
      let changed = false;
      const nextNodes = currentNodes.map((node) => {
        const taskId = parseTaskId(node.id);
        const task = tasksById.get(taskId);
        if (!task) return node;
        const nextTitle = String(task.title || (node.data as any)?.title || 'Untitled task');
        const nextStatus = String(task.status || (task.completed ? 'completed' : 'todo'));
        const nextCompleted = Boolean(task.completed);
        const nextPriority = String(task.priority || (node.data as any)?.priority || '');
        const nextDueDate = String(task.dueDate || (node.data as any)?.dueDate || '');
        const assigneeMeta = getPrimaryAssigneeMeta(task);
        const nextAssignees = normalizeAssigneeList(Array.isArray(task.assignees) ? task.assignees : []);
        const nextMilestones = mergeMilestonePromotionState(
          normalizeMilestones(Array.isArray((node.data as any)?.milestones) ? (node.data as any).milestones : []),
          normalizeMilestones(getTaskMilestones(task)),
        );
        const nextIntegrations = Array.isArray((task as any)?.integrations)
          ? (task as any).integrations.map((value: any) => String(value).trim()).filter(Boolean)
          : Array.isArray((node.data as any)?.integrations)
            ? (node.data as any).integrations.map((value: any) => String(value).trim()).filter(Boolean)
            : [];
        const nextIntegrationBindings = Array.isArray((task as any)?.integrationBindings)
          ? (task as any).integrationBindings
              .map((binding: any) => ({
                connectorId: String(binding?.connectorId || '').trim(),
                connectorName: String(binding?.connectorName || '').trim(),
                provider: String(binding?.provider || 'native').trim(),
                accountId: String(binding?.accountId || '').trim() || undefined,
                accountLabel: String(binding?.accountLabel || '').trim() || undefined,
                authType: String(binding?.authType || 'oauth2').trim(),
                scopes: Array.isArray(binding?.scopes) ? binding.scopes.map((scope: any) => String(scope).trim()).filter(Boolean) : [],
                connectionStatus: String(binding?.connectionStatus || 'healthy').trim(),
                category: String(binding?.category || '').trim() || undefined,
                status: String(binding?.status || 'connected').trim(),
                mode: String(binding?.mode || 'simple').trim(),
                scope: String(binding?.scope || 'task').trim(),
                attachedAt: String(binding?.attachedAt || '').trim() || undefined,
              }))
              .filter((binding: WorkstreamFlowIntegrationBinding) => binding.connectorId && binding.connectorName)
          : Array.isArray((node.data as any)?.integrationBindings)
            ? (node.data as any).integrationBindings
            : [];
        const nextAssigneeName = assigneeMeta.name || getPrimaryAssigneeName(task) || String((node.data as any)?.assigneeName || '');
        const nextAssigneeAvatar = assigneeMeta.avatar || String((node.data as any)?.assigneeAvatar || '');
        const nextGoalId = String(task.goalId || (node.data as any)?.goalId || '');
        const nextGoalTitle = String(task.goalTitle || (node.data as any)?.goalTitle || '');
        const nextOwnerMode = String((task as any).ownerMode || (node.data as any)?.ownerMode || 'human_only');
        const nextCreatedByType = String((task as any).createdByType || (node.data as any)?.createdByType || 'human');
        const nextRiskLevel = String((task as any).riskLevel || (node.data as any)?.riskLevel || 'low');
        const data = node.data as any;
        if (
          data?.title === nextTitle &&
          data?.status === nextStatus &&
          Boolean(data?.completed) === nextCompleted &&
          String(data?.priority || '') === nextPriority &&
          String(data?.dueDate || '') === nextDueDate &&
          String(data?.assigneeName || '') === nextAssigneeName &&
          String(data?.assigneeAvatar || '') === nextAssigneeAvatar &&
          JSON.stringify(Array.isArray(data?.assignees) ? data.assignees : []) === JSON.stringify(nextAssignees) &&
          JSON.stringify(Array.isArray(data?.milestones) ? data.milestones : []) === JSON.stringify(nextMilestones) &&
          JSON.stringify(Array.isArray(data?.integrations) ? data.integrations : []) === JSON.stringify(nextIntegrations) &&
          JSON.stringify(Array.isArray(data?.integrationBindings) ? data.integrationBindings : []) === JSON.stringify(nextIntegrationBindings) &&
          String(data?.goalId || '') === nextGoalId &&
          String(data?.goalTitle || '') === nextGoalTitle &&
          String(data?.ownerMode || '') === nextOwnerMode &&
          String(data?.createdByType || '') === nextCreatedByType &&
          String(data?.riskLevel || '') === nextRiskLevel
        ) {
          return node;
        }
        changed = true;
        return {
          ...node,
          data: {
            ...data,
            title: nextTitle,
            status: nextStatus,
            completed: nextCompleted,
            priority: nextPriority,
            dueDate: nextDueDate,
            assigneeName: nextAssigneeName,
            assigneeAvatar: nextAssigneeAvatar,
            assignees: nextAssignees,
            milestones: nextMilestones,
            integrations: nextIntegrations,
            integrationBindings: nextIntegrationBindings,
            goalId: nextGoalId,
            goalTitle: nextGoalTitle,
            ownerMode: nextOwnerMode,
            createdByType: nextCreatedByType,
            riskLevel: nextRiskLevel,
          },
        };
      });
      if (!changed) return currentNodes;
      persist(nextNodes, edges);
      return nextNodes;
    });
  }, [tasksById, persist, edges]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setSaveState('unsaved');
    setNodes((current) => {
      const next = applyNodeChanges(changes, current);
      const removed = changes.some((change) => change.type === 'remove');
      if (removed) {
        const removedIds = changes
          .filter((change) => change.type === 'remove')
          .map((change) => parseTaskId(String(change.id || '')))
          .filter(Boolean);
        if (removedIds.length > 0) {
          appendExecutionTrailEvent({
            type: 'status_updated',
            title: 'Workstream events removed',
            detail: removedIds.join(', '),
            projectId,
            actor: 'User',
            metadata: { removedTaskIds: removedIds },
          });
        }
        history.push({ nodes: next, edges });
      }
      persist(next, edges);
      return next;
    });
  }, [edges, history, persist, projectId]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setSaveState('unsaved');
    setEdges((current) => {
      const next = applyEdgeChanges(changes, current);
      const removed = changes.some((change) => change.type === 'remove');
      if (removed) {
        history.push({ nodes, edges: next });
      }
      persist(nodes, next);
      return next;
    });
  }, [history, nodes, persist]);

  const onNodeDragStop = useCallback(async (_event: unknown, node: Node) => {
    const taskId = parseTaskId(node.id);
    if (!taskId) return;
    const nextNodes = nodesRef.current.map((candidate) =>
      candidate.id === node.id ? { ...candidate, position: node.position } : candidate,
    );
    setNodes(nextNodes);
    history.push({ nodes: nextNodes, edges: edgesRef.current });
    persist(nextNodes, edgesRef.current);
    if (!canSyncTask(taskId)) {
      // Some persisted canvases can contain legacy/stale node ids.
      // Keep canvas movement local-first and skip backend sync for missing tasks.
      return;
    }
    try {
      await updateTask(taskId, {
        flowLayout: {
          x: node.position.x,
          y: node.position.y,
        },
      });
      appendExecutionTrailEvent({
        type: 'status_updated',
        title: 'Workstream event moved',
        detail: `${taskId} -> (${Math.round(node.position.x)}, ${Math.round(node.position.y)})`,
        projectId,
        taskId,
        actor: 'User',
      });
    } catch {
      // keep local graph fluid even if persistence path is unavailable
    }
  }, [canSyncTask, edges, history, nodes, persist, updateTask]);

  const onConnect = useCallback(async (connection: Connection) => {
    if (!connection.source || !connection.target) return;
    const sourceTaskId = parseTaskId(connection.source);
    const targetTaskId = parseTaskId(connection.target);
    const edgeId = `edge:${connection.source}->${connection.target}`;
    setSaveState('unsaved');
    const nextEdges = addEdge(
      {
        id: edgeId,
        source: connection.source,
        target: connection.target,
        type: 'smoothstep',
        label: 'depends on',
        data: { kind: 'dependency' },
      },
      edges,
    );
    setEdges(nextEdges);
    history.push({ nodes, edges: nextEdges });
    persist(nodes, nextEdges);

    try {
      if (!canSyncTask(sourceTaskId) || !canSyncTask(targetTaskId)) {
        return;
      }
      const targetTask = tasksById.get(targetTaskId);
      const previous = Array.isArray((targetTask as any)?.dependencies) ? (targetTask as any).dependencies : [];
      const dedupe = previous.some((dep: any) => String(dep?.dependsOn || dep?.id || dep) === sourceTaskId);
      if (!dedupe) {
        await updateTask(targetTaskId, {
          dependencies: [...previous, { dependsOn: sourceTaskId, type: 'blocked-by' }],
        });
      }
    } catch {
      // non-blocking
    }

    appendExecutionTrailEvent({
      type: 'status_updated',
      title: 'Workstream link created',
      detail: `${sourceTaskId} -> ${targetTaskId}`,
      projectId,
      taskId: targetTaskId,
      actor: 'User',
    });
  }, [canSyncTask, edges, history, nodes, persist, projectId, tasksById, updateTask]);

  const markLineageEntityPromoted = useCallback((
    lineage: FlowTemplatePayload['lineage'] | undefined,
    createdTaskId: string,
  ) => {
    const sourceNodeId = String(lineage?.sourceNodeId || '').trim();
    const sourceType = String(lineage?.sourceEntityType || '').trim().toLowerCase();
    const sourceId = String(lineage?.sourceEntityId || '').trim();
    const sourceTitle = String(lineage?.sourceEntityTitle || '').trim();
    if (!sourceNodeId || !sourceType) return;
    const lineageEntity = lineageEntityKey(sourceType, sourceId, sourceTitle);
    setNodes((current) => {
      let anyChanged = false;
      const next = current.map((node) => {
        if (node.id !== sourceNodeId) return node;
        let nodeChanged = false;
        const data = (node.data || {}) as Record<string, any>;
        const currentMilestones = normalizeMilestones(Array.isArray(data.milestones) ? data.milestones : []);
        const nextMilestones = currentMilestones.map((milestone) => {
          if (sourceType === 'milestone') {
            const key = lineageEntityKey('milestone', String(milestone.id || ''), String(milestone.title || ''));
            if (key === lineageEntity) {
              nodeChanged = true;
              return { ...milestone, promoted: true, promotedToTaskId: createdTaskId };
            }
          }
          if (sourceType === 'step' && Array.isArray(milestone.steps)) {
            const nextSteps = milestone.steps.map((step) => {
              const key = lineageEntityKey('step', String(step.id || ''), String(step.title || ''));
              if (key === lineageEntity) {
                nodeChanged = true;
                return { ...step, promoted: true, promotedToTaskId: createdTaskId };
              }
              return step;
            });
            if (nodeChanged) {
              return { ...milestone, steps: nextSteps };
            }
          }
          return milestone;
        });
        const currentKeys = Array.isArray(data.promotedLineageKeys)
          ? data.promotedLineageKeys.map((value: any) => String(value || '').trim().toLowerCase()).filter(Boolean)
          : [];
        const keySet = new Set(currentKeys);
        keySet.add(lineageEntity);
        const nextKeys = Array.from(keySet);
        if (!nodeChanged && JSON.stringify(currentKeys) === JSON.stringify(nextKeys)) {
          return node;
        }
        anyChanged = true;
        return {
          ...node,
          data: {
            ...data,
            milestones: nodeChanged ? nextMilestones : currentMilestones,
            promotedLineageKeys: nextKeys,
          },
        };
      });
      if (!anyChanged) return current;
      nodesRef.current = next;
      persist(next, edgesRef.current);
      return next;
    });
  }, [persist]);

  const handleAddEvent = useCallback(async (
    prefillTitle?: string,
    dropPosition?: { x: number; y: number },
    template?: FlowTemplatePayload,
    optimisticDrop = false,
  ): Promise<string | null> => {
    const title = prefillTitle?.trim() ? prefillTitle : window.prompt('Name this new task node');
    if (!title || !title.trim()) return null;
    let created: any = null;
    let backendCreateFailed = optimisticDrop;
    if (!optimisticDrop) {
      try {
        created = await Promise.race([
          createTask({
            title: title.trim(),
            description: template?.description || 'Created from Workstream canvas.',
            priority: template?.priority || 'medium',
            energyLevel: 'medium',
            estimatedTime: '30 min',
            dueDate: template?.dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
            tags: template?.tags || [],
            assignees: template?.assignees || [],
            resources: template?.resources || [],
            milestones: template?.milestones || [],
            goalId: template?.goalId,
            parentTaskId: template?.lineage?.parentTaskId,
            projectId,
            status: 'todo',
            flowLayout: dropPosition ? { x: dropPosition.x, y: dropPosition.y } : undefined,
          }),
          new Promise<never>((_, reject) => {
            window.setTimeout(() => reject(new Error('Task create timed out')), 1500);
          }),
        ]);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Could not create a task from Workstream. Try again.';
        backendCreateFailed = true;
        toast.error(message);
      }
    }
    const id = String(created?.id || '').trim() || `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const assigneeMeta = getPrimaryAssigneeMeta(created || { assignees: template?.assignees || [] });
    const normalizedAssignees = normalizeAssigneeList(
      Array.isArray(created?.assignees)
        ? created.assignees
        : Array.isArray(template?.assignees)
          ? template.assignees
          : [],
    );
    const normalizedMilestones = normalizeMilestones(
      Array.isArray(created?.milestones)
        ? created.milestones
        : Array.isArray((created as any)?.subtasks)
          ? (created as any).subtasks
          : Array.isArray(template?.milestones)
            ? template.milestones
            : [],
    );
    const normalizedIntegrations = Array.isArray(created?.integrations)
      ? created.integrations.map((value: any) => String(value).trim()).filter(Boolean)
      : Array.isArray(template?.integrations)
        ? template.integrations.map((value: any) => String(value).trim()).filter(Boolean)
        : [];
    const normalizedIntegrationBindings = Array.isArray((created as any)?.integrationBindings)
      ? (created as any).integrationBindings
      : Array.isArray(template?.integrationBindings)
        ? template.integrationBindings
        : normalizedIntegrations.map((connectorId: string) => {
            const connector = INTEGRATION_CONNECTORS.find((entry) => entry.id === connectorId);
            return {
              connectorId,
              connectorName: connector?.name || connectorId,
              provider: connector?.provider || 'native',
              category: connector?.category,
              status: 'connected',
              mode: integrationMode,
              scope: 'task',
              attachedAt: new Date().toISOString(),
            };
          });
    const rect = canvasShellRef.current?.getBoundingClientRect();
    const fallbackPosition = reactFlow.screenToFlowPosition({
      x: rect ? rect.left + rect.width * 0.5 : window.innerWidth * 0.5,
      y: rect ? rect.top + rect.height * 0.45 : window.innerHeight * 0.45,
    });
    const nextPosition = dropPosition || fallbackPosition;
    const node: Node = {
      id: `task:${id}`,
      type: 'eventNode',
      position: nextPosition,
      data: {
        taskId: id,
        title: String(created?.title || title.trim()),
        status: String(created?.status || 'todo'),
        completed: Boolean(created?.completed),
        priority: String(created?.priority || template?.priority || 'medium'),
        dueDate: String(created?.dueDate || template?.dueDate || ''),
        assigneeName: assigneeMeta.name || getPrimaryAssigneeName(created || {}),
        assigneeAvatar: assigneeMeta.avatar || '',
        assignees: normalizedAssignees,
        milestones: normalizedMilestones,
        integrations: normalizedIntegrations,
        integrationBindings: normalizedIntegrationBindings,
        goalId: String(created?.goalId || template?.goalId || ''),
        goalTitle: String(created?.goalTitle || ''),
        ownerMode: String((created as any)?.ownerMode || 'human_only'),
        createdByType: String((created as any)?.createdByType || 'human'),
        riskLevel: String((created as any)?.riskLevel || 'low'),
        lineage: template?.lineage
          ? {
              parentTaskId: String(template.lineage.parentTaskId || ''),
              sourceNodeId: String(template.lineage.sourceNodeId || ''),
              sourceEntityType: String(template.lineage.sourceEntityType || ''),
              sourceEntityId: String(template.lineage.sourceEntityId || ''),
              sourceEntityTitle: String(template.lineage.sourceEntityTitle || ''),
            }
          : undefined,
        projectId,
        nodeKind: 'event',
      },
    };
    setSaveState('unsaved');
    const currentEdges = edgesRef.current;
    const sourceNodeId = String(template?.lineage?.sourceNodeId || '').trim();
    const sourceEntityType = String(template?.lineage?.sourceEntityType || '').trim().toLowerCase();
    const sourceEntityTitle = String(template?.lineage?.sourceEntityTitle || '').trim();
    const lineageLabel = sourceNodeId
      ? sourceEntityType === 'step'
        ? `step: ${sourceEntityTitle || 'derived'}`
        : `milestone: ${sourceEntityTitle || 'derived'}`
      : 'derived from';
    flushSync(() => {
      setNodes((current) => {
        const nextNodes = [...current, node];
        nodesRef.current = nextNodes;
        let nextEdges = currentEdges;
        if (sourceNodeId && sourceNodeId !== node.id) {
          const edgeId = `edge:hier:${sourceNodeId}->${node.id}`;
          if (!currentEdges.some((edge) => edge.id === edgeId)) {
            nextEdges = [
              ...currentEdges,
              {
                id: edgeId,
                source: sourceNodeId,
                target: node.id,
                type: 'smoothstep',
                label: lineageLabel,
                data: { kind: 'hierarchy' as const },
              },
            ];
            edgesRef.current = nextEdges;
            setEdges(nextEdges);
          }
        }
        history.push({ nodes: nextNodes, edges: nextEdges });
        persist(nextNodes, nextEdges);
        return nextNodes;
      });
    });
    if (template?.lineage && sourceNodeId) {
      markLineageEntityPromoted(template.lineage, id);
    }
    appendExecutionTrailEvent({
      type: 'task_created',
      title: `Task created: ${title.trim()}`,
      detail: 'Created from Workstream canvas',
      projectId,
      taskId: id,
      actor: 'User',
    });
    if (backendCreateFailed) {
      toast.info('Task added to canvas locally. Backend sync will resume when available.');
    } else {
      toast.success('Task added to workstream');
    }
    return node.id;
  }, [createTask, history, integrationMode, markLineageEntityPromoted, persist, projectId, reactFlow]);

  useEffect(() => {
    if (!initialTitle || !initialTitle.trim()) return;
    void handleAddEvent(initialTitle);
  }, [handleAddEvent, initialTitle]);

  useEffect(() => {
    if (nodes.length === 0) {
      autoFitProjectRef.current = '';
      return;
    }
    if (autoFitProjectRef.current === projectId) return;
    autoFitProjectRef.current = projectId;
    requestAnimationFrame(() => {
      reactFlow.fitView({ duration: 200, padding: 0.2 });
    });
  }, [nodes.length, projectId, reactFlow]);

  const handleCanvasDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsCanvasDropActive(true);
    try {
      const payload = readDragPayload(event);
      if (!payload) return;
      const parsed = JSON.parse(payload) as Record<string, any>;
      const template = normalizeIncomingTaskTemplate(parsed);
      setDropPreview({
        title: template.title,
        priority: template.priority,
        dueDate: template.dueDate,
      });
    } catch {
      // ignore
    }
  }, []);

  const createNodeFromDropPayload = useCallback(async (payloadText: string, clientX: number, clientY: number) => {
    try {
      const parsed = payloadText
        ? (JSON.parse(payloadText) as FlowTemplatePayload & Record<string, any>)
        : (draggedTemplateRef.current as (FlowTemplatePayload & Record<string, any>) | null);
      if (!parsed) return;
      const title = String(parsed?.title || '').trim();
      if (!title) return;
      const signature = `${title.toLowerCase()}|${Math.round(clientX)}|${Math.round(clientY)}|${String(parsed?.lineage?.sourceEntityId || '')}`;
      const now = Date.now();
      if (
        lastDropSignatureRef.current &&
        lastDropSignatureRef.current.signature === signature &&
        now - lastDropSignatureRef.current.at < 450
      ) {
        return;
      }
      lastDropSignatureRef.current = { signature, at: now };
      const normalizedTemplate = normalizeIncomingTaskTemplate(parsed);
      if (normalizedTemplate.lineage && hasDerivedNodeForLineage(normalizedTemplate.lineage)) {
        return;
      }
      const flowPosition = reactFlow.screenToFlowPosition({ x: clientX, y: clientY });
      const createdNodeId = await handleAddEvent(title, flowPosition, normalizedTemplate, false);
      if (createdNodeId && normalizedTemplate.lineage?.sourceNodeId) {
        requestAnimationFrame(() => {
          reactFlow.fitView({ duration: 220, padding: 0.2 });
        });
      }
      return;
    } catch {
      const fallbackTitle = String(payloadText || draggedTemplateRef.current?.title || '').trim();
      if (!fallbackTitle) return;
      const flowPosition = reactFlow.screenToFlowPosition({ x: clientX, y: clientY });
      await handleAddEvent(fallbackTitle, flowPosition, { title: fallbackTitle }, false);
    } finally {
      draggedTemplateRef.current = null;
    }
  }, [handleAddEvent, hasDerivedNodeForLineage, reactFlow]);

  const handleCanvasDrop = useCallback((event: DragEvent) => {
    event.preventDefault();
    setIsCanvasDropActive(false);
    setDropPreview(null);
    dropEnterCounterRef.current = 0;
    const payload = readDragPayload(event);
    void createNodeFromDropPayload(payload, event.clientX, event.clientY);
  }, [createNodeFromDropPayload]);

  const handleCanvasDragEnter = useCallback((event: DragEvent) => {
    dropEnterCounterRef.current += 1;
    setIsCanvasDropActive(true);
  }, []);

  const handleCanvasDragLeave = useCallback((event: DragEvent) => {
    dropEnterCounterRef.current -= 1;
    if (dropEnterCounterRef.current <= 0) {
      dropEnterCounterRef.current = 0;
      setIsCanvasDropActive(false);
      setDropPreview(null);
    }
  }, []);

  useEffect(() => {
    const shell = canvasShellRef.current;
    if (!shell) return;
    const onNativeDragOver = (event: globalThis.DragEvent) => {
      event.preventDefault();
      setIsCanvasDropActive(true);
    };
    const onNativeDrop = (event: globalThis.DragEvent) => {
      event.preventDefault();
      setIsCanvasDropActive(false);
      setDropPreview(null);
      dropEnterCounterRef.current = 0;
      const payload =
        event.dataTransfer?.getData(FLOW_TEMPLATE_MIME) ||
        event.dataTransfer?.getData(TASK_MIME) ||
        event.dataTransfer?.getData('text/plain') ||
        '';
      void createNodeFromDropPayload(payload, event.clientX, event.clientY);
    };
    shell.addEventListener('dragover', onNativeDragOver, true);
    shell.addEventListener('drop', onNativeDrop, true);
    return () => {
      shell.removeEventListener('dragover', onNativeDragOver, true);
      shell.removeEventListener('drop', onNativeDrop, true);
    };
  }, [createNodeFromDropPayload]);

  useEffect(() => {
    const promoteHandler = (rawEvent: Event) => {
      const event = rawEvent as CustomEvent<FlowTemplatePayload>;
      const payload = event.detail;
      if (!payload || !payload.title) return;
      const promoteSignature = [
        String(payload.lineage?.sourceNodeId || ''),
        String(payload.lineage?.sourceEntityType || ''),
        String(payload.lineage?.sourceEntityId || ''),
        String(payload.title || ''),
      ].join('|').toLowerCase();
      const now = Date.now();
      if (
        lastPromoteSignatureRef.current &&
        lastPromoteSignatureRef.current.signature === promoteSignature &&
        now - lastPromoteSignatureRef.current.at < 700
      ) {
        return;
      }
      lastPromoteSignatureRef.current = { signature: promoteSignature, at: now };
      const sourceNodeId = String(payload.lineage?.sourceNodeId || '');
      if (payload.lineage && hasDerivedNodeForLineage(payload.lineage)) {
        return;
      }
      const sourceNode = sourceNodeId ? nodesRef.current.find((node) => node.id === sourceNodeId) : null;
      const dropPosition = sourceNode
        ? { x: sourceNode.position.x + 360, y: sourceNode.position.y + 90 }
        : undefined;
      void (async () => {
        const createdNodeId = await handleAddEvent(payload.title, dropPosition, payload, false);
        if (createdNodeId && sourceNodeId) {
          requestAnimationFrame(() => {
            reactFlow.fitView({ duration: 220, padding: 0.2 });
          });
        }
      })();
    };
    window.addEventListener('syncscript:workstream-promote', promoteHandler as EventListener);
    return () => window.removeEventListener('syncscript:workstream-promote', promoteHandler as EventListener);
  }, [handleAddEvent, hasDerivedNodeForLineage, reactFlow]);

  const handleLibraryCreate = useCallback(
    async (payload: FlowTemplatePayload) => {
      const rect = canvasShellRef.current?.getBoundingClientRect();
      const flowPosition = reactFlow.screenToFlowPosition({
        x: rect ? rect.left + rect.width * 0.4 : window.innerWidth * 0.45,
        y: rect ? rect.top + rect.height * 0.35 : window.innerHeight * 0.35,
      });
      await handleAddEvent(payload.title, flowPosition, payload);
    },
    [handleAddEvent, reactFlow],
  );

  const handleAssignSelectedTask = useCallback(async (assignee: AssigneeOption) => {
    const taskId = selectedTaskId?.trim();
    const name = assignee.name.trim();
    if (!taskId || !name) return;
    const appendAssignee = (list: any[]) => {
      const normalized = normalizeAssigneeList(list);
      const deduped = normalized.filter((entry) => entry.name.toLowerCase() !== name.toLowerCase());
      return [
        ...deduped,
        {
          id: assignee.id,
          name,
          avatar: assignee.avatar || undefined,
          role: assignee.role || undefined,
        },
      ];
    };
    const applyAssigneesToNode = (list: Array<{ id?: string; name: string; avatar?: string; role?: string }>) => {
      setNodes((current) => {
        const next = current.map((node) =>
          parseTaskId(node.id) === taskId
            ? {
                ...node,
                data: {
                  ...(node.data as Record<string, unknown>),
                  assigneeName: list[0]?.name || '',
                  assigneeAvatar: list[0]?.avatar || '',
                  assignees: list,
                },
              }
            : node,
        );
        persist(next, edgesRef.current);
        return next;
      });
    };
    if (!canSyncTask(taskId)) {
      const currentNode = nodes.find((node) => parseTaskId(node.id) === taskId);
      const optimistic = appendAssignee(Array.isArray((currentNode?.data as any)?.assignees) ? (currentNode?.data as any).assignees : []);
      applyAssigneesToNode(optimistic);
      setAssigneePickerOpen(false);
      toast.success('Assignee set on local node');
      return;
    }
    const currentTask = tasksById.get(taskId);
    const currentAssignees = Array.isArray(currentTask?.assignees) ? currentTask.assignees : [];
    const deduped = [
      ...normalizeAssigneeList(currentAssignees).filter((entry) => entry.name.toLowerCase() !== name.toLowerCase()),
      {
        id: assignee.id,
        userId: assignee.id,
        name,
        email: assignee.email || '',
        avatar: assignee.avatar || '',
        image: assignee.avatar || '',
        role: assignee.role || '',
      },
    ];
    const optimistic = normalizeAssigneeList(deduped);
    applyAssigneesToNode(optimistic);
    setAssigneePickerOpen(false);
    try {
      await updateTask(taskId, { assignees: deduped });
      toast.success('Assignee added');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not assign user';
      toast.error(message);
    }
  }, [canSyncTask, nodes, persist, selectedTaskId, setNodes, tasksById, updateTask]);

  const handleUnassignSelectedTask = useCallback(async (assigneeName: string) => {
    const taskId = selectedTaskId?.trim();
    const cleanName = assigneeName.trim();
    if (!taskId || !cleanName) return;
    const removeAssignee = (list: any[]) =>
      normalizeAssigneeList(list).filter((entry) => entry.name.toLowerCase() !== cleanName.toLowerCase());
    const applyAssigneesToNode = (list: Array<{ id?: string; name: string; avatar?: string; role?: string }>) => {
      setNodes((current) => {
        const next = current.map((node) =>
          parseTaskId(node.id) === taskId
            ? {
                ...node,
                data: {
                  ...(node.data as Record<string, unknown>),
                  assignees: list,
                  assigneeName: list[0]?.name || '',
                  assigneeAvatar: list[0]?.avatar || '',
                },
              }
            : node,
        );
        persist(next, edgesRef.current);
        return next;
      });
    };
    if (!canSyncTask(taskId)) {
      const currentNode = nodes.find((node) => parseTaskId(node.id) === taskId);
      const remaining = removeAssignee(Array.isArray((currentNode?.data as any)?.assignees) ? (currentNode?.data as any).assignees : []);
      applyAssigneesToNode(remaining);
      toast.success('Assignee removed');
      return;
    }
    try {
      const currentTask = tasksById.get(taskId);
      const currentAssignees = Array.isArray(currentTask?.assignees) ? currentTask.assignees : [];
      const remaining = removeAssignee(currentAssignees);
      applyAssigneesToNode(remaining);
      await updateTask(taskId, { assignees: remaining });
      toast.success('Assignee removed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not remove assignee';
      toast.error(message);
    }
  }, [canSyncTask, nodes, persist, selectedTaskId, setNodes, tasksById, updateTask]);

  const upsertSelectedTaskIntegrations = useCallback((incoming: WorkstreamFlowIntegrationBinding[], sourceLabel: string) => {
    const taskId = selectedTaskId?.trim();
    if (!taskId || incoming.length === 0) return;
    setNodes((current) => {
      const next = current.map((node) => {
        if (parseTaskId(node.id) !== taskId) return node;
        const currentBindings = Array.isArray((node.data as any)?.integrationBindings)
          ? (node.data as any).integrationBindings
          : [];
        const map = new Map<string, WorkstreamFlowIntegrationBinding>();
        for (const binding of currentBindings) {
          const id = String(binding?.connectorId || '').trim();
          const name = String(binding?.connectorName || '').trim();
          if (!id || !name) continue;
          map.set(id, {
            connectorId: id,
            connectorName: name,
            provider: String(binding?.provider || 'native').trim(),
            accountId: String(binding?.accountId || '').trim() || undefined,
            accountLabel: String(binding?.accountLabel || '').trim() || undefined,
            authType: String(binding?.authType || 'oauth2').trim(),
            scopes: Array.isArray(binding?.scopes) ? binding.scopes.map((scope: any) => String(scope).trim()).filter(Boolean) : [],
            connectionStatus: String(binding?.connectionStatus || 'healthy').trim(),
            category: String(binding?.category || '').trim() || undefined,
            status: String(binding?.status || 'connected').trim(),
            mode: String(binding?.mode || integrationMode).trim(),
            scope: 'task',
            attachedAt: String(binding?.attachedAt || '').trim() || new Date().toISOString(),
          });
        }
        for (const binding of incoming) {
          map.set(binding.connectorId, {
            ...binding,
            scope: 'task',
            mode: integrationMode,
            status: 'connected',
            attachedAt: binding.attachedAt || new Date().toISOString(),
          });
        }
        const nextBindings = Array.from(map.values());
        const nextIds = nextBindings.map((binding) => binding.connectorId);
        return {
          ...node,
          data: {
            ...(node.data as Record<string, unknown>),
            integrations: nextIds,
            integrationBindings: nextBindings,
          },
        };
      });
      nodesRef.current = next;
      persist(next, edgesRef.current);
      return next;
    });
    appendExecutionTrailEvent({
      type: 'integration_connected',
      title: 'Task integrations updated',
      detail: `${sourceLabel} connected on task ${taskId}`,
      projectId,
      actor: 'User',
    });
  }, [integrationMode, persist, projectId, selectedTaskId]);

  const handleDeleteSelectedTask = useCallback(async () => {
    const taskId = String(selectedTaskId || '').trim();
    if (!taskId) return;
    const previousNodes = nodesRef.current;
    const previousEdges = edgesRef.current;
    const nextNodes = previousNodes.filter((node) => parseTaskId(node.id) !== taskId);
    const validNodeIds = new Set(nextNodes.map((node) => node.id));
    const nextEdges = previousEdges.filter((edge) => validNodeIds.has(edge.source) && validNodeIds.has(edge.target));

    setSaveState('unsaved');
    setNodes(nextNodes);
    setEdges(nextEdges);
    nodesRef.current = nextNodes;
    edgesRef.current = nextEdges;
    history.push({ nodes: nextNodes, edges: nextEdges });
    persist(nextNodes, nextEdges);
    setSelectedTaskId(null);
    onSelectTaskId?.(null);

    if (!canSyncTask(taskId) || !deleteTask) {
      appendExecutionTrailEvent({
        type: 'status_updated',
        title: 'Workstream node removed',
        detail: `${taskId} removed from board`,
        projectId,
        taskId,
        actor: 'User',
      });
      toast.success('Task removed from workstream');
      return;
    }

    try {
      await deleteTask(taskId);
      appendExecutionTrailEvent({
        type: 'status_updated',
        title: 'Task deleted',
        detail: `${taskId} deleted from project`,
        projectId,
        taskId,
        actor: 'User',
      });
      toast.success('Task deleted');
    } catch (error) {
      setNodes(previousNodes);
      setEdges(previousEdges);
      nodesRef.current = previousNodes;
      edgesRef.current = previousEdges;
      history.push({ nodes: previousNodes, edges: previousEdges });
      persist(previousNodes, previousEdges);
      const message = error instanceof Error ? error.message : 'Could not delete task';
      toast.error(message);
    }
  }, [canSyncTask, deleteTask, history, onSelectTaskId, persist, projectId, selectedTaskId]);

  const refreshIntegrationAccounts = useCallback(() => {
    setIntegrationAccounts(listIntegrationConnections(projectId));
    void listIntegrationConnectionsRemote(projectId, accessToken || publicAnonKey)
      .then((accounts) => {
        setIntegrationAccounts(accounts);
      })
      .catch(() => {
        // local fallback already applied
      });
  }, [accessToken, projectId]);

  const handleOAuthConnectAccount = useCallback(async (connector: IntegrationConnector) => {
    const providerId = OAUTH_PROVIDER_BY_CONNECTOR[connector.id];
    if (!providerId) {
      connectIntegrationAccount(projectId, connector, newAccountLabel || `${connector.name} Workspace Account`);
      refreshIntegrationAccounts();
      void connectIntegrationAccountRemote(
        projectId,
        connector,
        newAccountLabel || `${connector.name} Workspace Account`,
        accessToken || publicAnonKey,
      ).then(() => {
        refreshIntegrationAccounts();
      }).catch(() => undefined);
      setNewAccountLabel('');
      return;
    }
    try {
      setPendingOAuthConnectorId(connector.id);
      const response = await fetch(
        `https://${supabaseProjectId}.supabase.co/functions/v1/make-server-57781ad9/integrations/${providerId}/authorize`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            scopes: connector.defaultScopes || [],
            redirectUri: `${window.location.origin}/auth/callback`,
          }),
        },
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to initialize ${connector.name} OAuth`);
      }
      const payload = await response.json();
      const authUrl = String(payload?.authUrl || '').trim();
      const state = String(payload?.state || '').trim();
      if (!authUrl || !state) {
        throw new Error('OAuth authorize response missing authUrl/state');
      }
      sessionStorage.setItem(`oauth-state-${providerId}`, state);
      const width = 620;
      const height = 760;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      window.open(
        authUrl,
        `${connector.name} OAuth`,
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
      );
      toast.info(`Authorize ${connector.name} to finish connection`);
    } catch (error) {
      setPendingOAuthConnectorId(null);
      const message = error instanceof Error ? error.message : `Could not connect ${connector.name}`;
      toast.error(message);
    }
  }, [accessToken, newAccountLabel, projectId, refreshIntegrationAccounts]);

  const createConnectorAccount = useCallback((connector: IntegrationConnector, label?: string) => {
    const connected = connectIntegrationAccount(projectId, connector, label);
    refreshIntegrationAccounts();
    void connectIntegrationAccountRemote(projectId, connector, label, accessToken || publicAnonKey)
      .then(() => {
        refreshIntegrationAccounts();
      })
      .catch(() => undefined);
    appendExecutionTrailEvent({
      type: 'integration_connected',
      title: `${connector.name} account connected`,
      detail: `${connected.accountLabel} (${connected.authType})`,
      projectId,
      actor: 'User',
    });
    toast.success(`${connector.name} account connected`);
    return connected;
  }, [accessToken, projectId, refreshIntegrationAccounts]);

  const validateConnectorAccount = useCallback((accountId: string) => {
    const updated = validateIntegrationConnection(accountId);
    refreshIntegrationAccounts();
    void validateIntegrationConnectionRemote(projectId, accountId, accessToken || publicAnonKey)
      .then(() => {
        void triggerIntegrationRefreshRemote(projectId, accessToken || publicAnonKey);
        refreshIntegrationAccounts();
      })
      .catch(() => undefined);
    if (!updated) return;
    toast.success(`Connection check: ${updated.health}`);
  }, [accessToken, projectId, refreshIntegrationAccounts]);

  const reconnectConnectorAccount = useCallback((accountId: string) => {
    const updated = reconnectIntegrationConnection(accountId);
    refreshIntegrationAccounts();
    void reconnectIntegrationConnectionRemote(projectId, accountId, accessToken || publicAnonKey)
      .then(() => {
        void triggerIntegrationRefreshRemote(projectId, accessToken || publicAnonKey);
        refreshIntegrationAccounts();
      })
      .catch(() => undefined);
    if (!updated) return;
    toast.success(`${updated.connectorName} reconnected`);
  }, [accessToken, projectId, refreshIntegrationAccounts]);

  const disconnectConnectorAccount = useCallback((accountId: string) => {
    const updated = disconnectIntegrationConnection(accountId);
    refreshIntegrationAccounts();
    void disconnectIntegrationConnectionRemote(projectId, accountId, accessToken || publicAnonKey)
      .then(() => {
        refreshIntegrationAccounts();
      })
      .catch(() => undefined);
    if (!updated) return;
    toast.success(`${updated.connectorName} disconnected`);
  }, [accessToken, projectId, refreshIntegrationAccounts]);

  const removeSelectedTaskIntegration = useCallback((integrationId: string) => {
    const taskId = selectedTaskId?.trim();
    if (!taskId || !integrationId.trim()) return;
    setNodes((current) => {
      const next = current.map((node) => {
        if (parseTaskId(node.id) !== taskId) return node;
        const currentBindings = Array.isArray((node.data as any)?.integrationBindings)
          ? (node.data as any).integrationBindings
          : [];
        const nextBindings = currentBindings
          .map((binding: any) => ({
            connectorId: String(binding?.connectorId || '').trim(),
            connectorName: String(binding?.connectorName || '').trim(),
            provider: String(binding?.provider || 'native').trim(),
            accountId: String(binding?.accountId || '').trim() || undefined,
            accountLabel: String(binding?.accountLabel || '').trim() || undefined,
            authType: String(binding?.authType || 'oauth2').trim(),
            scopes: Array.isArray(binding?.scopes) ? binding.scopes.map((scope: any) => String(scope).trim()).filter(Boolean) : [],
            connectionStatus: String(binding?.connectionStatus || 'healthy').trim(),
            category: String(binding?.category || '').trim() || undefined,
            status: String(binding?.status || 'connected').trim(),
            mode: String(binding?.mode || integrationMode).trim(),
            scope: 'task',
            attachedAt: String(binding?.attachedAt || '').trim() || undefined,
          }))
          .filter((binding: WorkstreamFlowIntegrationBinding) => binding.connectorId && binding.connectorName && binding.connectorId !== integrationId);
        const nextIds = nextBindings.map((binding: WorkstreamFlowIntegrationBinding) => binding.connectorId);
        return {
          ...node,
          data: {
            ...(node.data as Record<string, unknown>),
            integrations: nextIds,
            integrationBindings: nextBindings,
          },
        };
      });
      nodesRef.current = next;
      persist(next, edgesRef.current);
      return next;
    });
    appendExecutionTrailEvent({
      type: 'integration_connected',
      title: 'Task integration removed',
      detail: `${integrationId} disconnected from task ${taskId}`,
      projectId,
      actor: 'User',
    });
  }, [integrationMode, persist, projectId, selectedTaskId]);

  const connectIntegrationByConnector = useCallback((connector: IntegrationConnector, sourceLabel: string) => {
    const accounts = selectedConnectorAccounts.get(connector.id) || [];
    const preferredAccount =
      accounts.find((account) => account.health === 'healthy') ||
      accounts.find((account) => account.health === 'expiring') ||
      null;
    if (!preferredAccount && connector.authType === 'oauth2') {
      void handleOAuthConnectAccount(connector);
      toast.info(`Connect a ${connector.name} account to attach this integration`);
      return;
    }
    const account = preferredAccount || createConnectorAccount(connector);
    upsertSelectedTaskIntegrations([{
      connectorId: connector.id,
      connectorName: connector.name,
      provider: connector.provider,
      accountId: account?.id,
      accountLabel: account?.accountLabel,
      authType: connector.authType || account?.authType || 'oauth2',
      scopes: account?.scopes || connector.defaultScopes || [],
      connectionStatus: account?.health || 'healthy',
      category: connector.category,
      status: 'connected',
      mode: integrationMode,
      scope: 'task',
      attachedAt: new Date().toISOString(),
    }], sourceLabel);
    toast.success(`${connector.name} connected`);
  }, [createConnectorAccount, handleOAuthConnectAccount, integrationMode, selectedConnectorAccounts, upsertSelectedTaskIntegrations]);

  const applyIntegrationRecipe = useCallback((recipe: IntegrationRecipe) => {
    const oauthMissing: string[] = [];
    const bindings = recipe.connectorIds
      .map((connectorId) => integrationConnectorById.get(connectorId))
      .filter((connector): connector is IntegrationConnector => Boolean(connector))
      .map((connector) => {
        const accounts = selectedConnectorAccounts.get(connector.id) || [];
        const preferred = accounts.find((account) => account.health === 'healthy') || accounts.find((account) => account.health === 'expiring');
        if (!preferred && connector.authType === 'oauth2') {
          oauthMissing.push(connector.name);
          return null;
        }
        const ensured = preferred || createConnectorAccount(connector, `${connector.name} Recipe Account`);
        return {
          connectorId: connector.id,
          connectorName: connector.name,
          provider: connector.provider,
          accountId: ensured?.id,
          accountLabel: ensured?.accountLabel,
          authType: connector.authType || ensured?.authType || 'oauth2',
          scopes: ensured?.scopes || connector.defaultScopes || [],
          connectionStatus: ensured?.health || 'healthy',
          category: connector.category,
          status: 'connected',
          mode: integrationMode,
          scope: 'task',
          attachedAt: new Date().toISOString(),
        };
      })
      .filter(Boolean) as WorkstreamFlowIntegrationBinding[];
    if (bindings.length === 0) return;
    upsertSelectedTaskIntegrations(bindings, recipe.name);
    toast.success(`${recipe.name} recipe applied`);
    if (oauthMissing.length > 0) {
      toast.info(`Connect OAuth accounts for: ${oauthMissing.join(', ')}`);
    }
  }, [createConnectorAccount, integrationConnectorById, integrationMode, selectedConnectorAccounts, upsertSelectedTaskIntegrations]);

  const handleComposerAddTask = useCallback(async () => {
    const title = quickTaskTitle.trim();
    if (!title) return;
    const rect = canvasShellRef.current?.getBoundingClientRect();
    const flowPosition = reactFlow.screenToFlowPosition({
      x: rect ? rect.left + rect.width * 0.5 : window.innerWidth * 0.5,
      y: rect ? rect.top + rect.height * 0.35 : window.innerHeight * 0.35,
    });
    await handleAddEvent(title, flowPosition);
    setQuickTaskTitle('');
  }, [handleAddEvent, quickTaskTitle, reactFlow]);

  const handleAutoLayout = useCallback(() => {
    setSaveState('unsaved');
    const nextNodes = autoLayoutWorkstream(nodes, edges, 'TB');
    setNodes(nextNodes);
    history.push({ nodes: nextNodes, edges });
    persist(nextNodes, edges);
    appendExecutionTrailEvent({
      type: 'branch_compressed',
      title: 'Auto-layout applied',
      detail: `Repositioned ${nextNodes.length} nodes`,
      projectId,
      actor: 'User',
    });
  }, [edges, history, nodes, persist, projectId]);

  const onAddEvent = handleAddEvent;

  const handleSaveProject = useCallback(() => {
    const snapshot = getSnapshot();
    const label = checkpointLabel.trim() || `Checkpoint ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    saveWorkstreamFlowCheckpoint(projectId, { label, doc: snapshot });
    setCheckpoints(listWorkstreamFlowCheckpoints(projectId));
    onSaveProject?.(snapshot);
    setCheckpointLabel('');
    setSaveState('saved');
    toast.success('Project saved');
  }, [checkpointLabel, getSnapshot, onSaveProject, projectId]);

  const handleRenameProject = useCallback(() => {
    const nextName = projectTitleDraft.trim();
    if (!nextName) return;
    onUpdateProjectName?.(nextName);
    setSaveState('saved');
  }, [onUpdateProjectName, projectTitleDraft]);

  const handleRestoreCheckpoint = useCallback((checkpointId: string) => {
    const restored = restoreWorkstreamFlowCheckpoint(projectId, checkpointId);
    if (!restored) {
      toast.error('Could not restore checkpoint');
      return;
    }
    const nextNodes = toReactFlowNodes(restored.nodes);
    const nextEdges = toReactFlowEdges(restored.edges);
    history.replaceCurrent({ nodes: nextNodes, edges: nextEdges });
    setNodes(nextNodes);
    setEdges(nextEdges);
    setCheckpoints(listWorkstreamFlowCheckpoints(projectId));
    requestAnimationFrame(() => reactFlow.fitView({ duration: 200, padding: 0.2 }));
    setSaveState('saved');
    toast.success('Checkpoint restored');
  }, [history, projectId, reactFlow]);

  const handleToggleBlankStart = useCallback(() => {
    const next = !useBlankStart;
    setUseBlankStart(next);
    onToggleBlankStart?.(next);
    setSaveState('unsaved');
  }, [onToggleBlankStart, useBlankStart]);

  const fetchAiPlanTasks = useCallback(
    async (prompt: string, style: PlanningStyle): Promise<AiPlanTask[]> => {
      const plannerPrompt = [
        'Break this project request into executable tasks for a flow canvas.',
        `Planning style: ${style}.`,
        style === 'aggressive'
          ? 'Favor more detailed decomposition and explicit dependency chains.'
          : style === 'lean'
          ? 'Favor minimal steps and only essential dependencies.'
          : 'Balance clarity with moderate decomposition.',
        'Return ONLY JSON in this format:',
        '{"tasks":[{"title":"string","description":"string","priority":"high|medium|low","dependsOn":[0]}]}',
        'Rules:',
        '- 3 to 8 tasks max',
        '- concise and concrete titles',
        '- dependsOn uses zero-based indexes of earlier tasks only',
        '- no prose outside JSON',
        '',
        `REQUEST: ${prompt.trim()}`,
      ].join('\n');

      const endpoint = accessToken ? '/api/ai/nexus-user' : '/api/ai/nexus-guest';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
      const body = accessToken
        ? {
            messages: [{ role: 'user', content: plannerPrompt }],
            privateContext: {
              surface: 'workstream',
              page: 'projects-workstream',
              projectId,
              projectName: projectTitleDraft,
            },
          }
        : {
            sessionId: getOrCreateGuestAiSessionId(),
            messages: [{ role: 'user', content: plannerPrompt }],
            context: {
              surface: 'workstream',
              page: 'projects-workstream',
              projectId,
              projectName: projectTitleDraft,
            },
          };

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 5000);
      let res: Response;
      try {
        res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } finally {
        window.clearTimeout(timeoutId);
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'AI planner request failed');
      }
      const payload = await res.json().catch(() => ({}));
      const rawText = String(payload?.content || payload?.reply || '');
      const jsonText = extractJsonPayload(rawText);
      const parsed = JSON.parse(jsonText);
      const tasks = Array.isArray(parsed?.tasks) ? parsed.tasks : [];
      return normalizeAndRankPlan(
        tasks
        .map((task: any) => ({
          title: String(task?.title || '').trim(),
          description: String(task?.description || '').trim(),
          priority: String(task?.priority || 'medium').trim().toLowerCase(),
          dependsOn: Array.isArray(task?.dependsOn) ? task.dependsOn.map((value: any) => Number(value)).filter((value: number) => Number.isFinite(value)) : [],
        }))
          .filter((task: AiPlanTask) => task.title.length > 0),
        style,
      );
    },
    [accessToken, projectId, projectTitleDraft],
  );

  const handleComposerCreateAi = useCallback(async (prompt: string) => {
    const clean = prompt.trim() || 'Build launch checklist with dependencies';
    setIsAiPlanning(true);
    try {
      let plan: AiPlanTask[] = [];
      try {
        plan = await fetchAiPlanTasks(clean, planningStyle);
      } catch {
        // Fall through to deterministic local planning when AI endpoint is unavailable.
      }
      if (plan.length < 2) {
        plan = buildDeterministicFallbackPlan(clean, planningStyle);
      }
      if (plan.length === 0) return;
      const rect = canvasShellRef.current?.getBoundingClientRect();
      const center = reactFlow.screenToFlowPosition({
        x: rect ? rect.left + rect.width * 0.52 : window.innerWidth * 0.5,
        y: rect ? rect.top + rect.height * 0.34 : window.innerHeight * 0.35,
      });
      const createdNodeIds: string[] = [];
      for (let index = 0; index < plan.length; index += 1) {
        const step = plan[index];
        const position = {
          x: center.x + (index % 3) * 300,
          y: center.y + Math.floor(index / 3) * 180,
        };
        // eslint-disable-next-line no-await-in-loop
        const nodeId = await handleAddEvent(step.title, position, {
          title: step.title,
          description: step.description || `Generated from AI prompt: ${clean}`,
          priority: step.priority || 'medium',
        });
        if (nodeId) createdNodeIds.push(nodeId);
      }
      if (createdNodeIds.length > 1) {
        const nextEdges = [...edgesRef.current];
        for (let idx = 0; idx < createdNodeIds.length; idx += 1) {
          const dependencyIndexes = plan[idx]?.dependsOn || (idx > 0 ? [idx - 1] : []);
          for (const depIndex of dependencyIndexes) {
            const source = createdNodeIds[depIndex];
            const target = createdNodeIds[idx];
            if (!source || !target || source === target) continue;
            const edgeId = `edge:${source}->${target}`;
            if (nextEdges.some((edge) => edge.id === edgeId)) continue;
            nextEdges.push({
              id: edgeId,
              source,
              target,
              type: 'smoothstep',
              label: 'depends on',
              data: { kind: 'dependency' },
            });
          }
        }
        setEdges(nextEdges);
        history.push({ nodes: nodesRef.current, edges: nextEdges });
        persist(nodesRef.current, nextEdges);
      }
      setQuickTaskTitle('');
      toast.success('AI plan generated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI planner failed';
      toast.error(message);
    } finally {
      setIsAiPlanning(false);
    }
  }, [fetchAiPlanTasks, handleAddEvent, history, persist, planningStyle, reactFlow]);

  const handleRemoveMissingTaskNodes = useCallback(() => {
    const nextNodes = nodes.filter((node) => canSyncTask(parseTaskId(node.id)));
    if (nextNodes.length === nodes.length) {
      toast.info('No missing task nodes to clean.');
      return;
    }
    const validNodeIds = new Set(nextNodes.map((node) => node.id));
    const nextEdges = edges.filter((edge) => validNodeIds.has(edge.source) && validNodeIds.has(edge.target));
    setNodes(nextNodes);
    setEdges(nextEdges);
    history.push({ nodes: nextNodes, edges: nextEdges });
    persist(nextNodes, nextEdges);
    setSaveState('saved');
    toast.success('Removed orphan task nodes');
  }, [canSyncTask, edges, history, nodes, persist]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          history.redo();
        } else {
          history.undo();
        }
      }
      if (event.key === '/') {
        const activeTag = (event.target as HTMLElement | null)?.tagName?.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea') return;
        event.preventDefault();
        void handleAddEvent();
      }
      if (event.key.toLowerCase() === 'l' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        handleAutoLayout();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleAddEvent, handleAutoLayout, history]);

  const nodeTypes = useMemo(() => ({ eventNode: WorkstreamFlowNode }), []);

  return (
    <div
      ref={canvasShellRef}
      className={`relative flex flex-col overflow-hidden rounded-2xl border border-gray-800 bg-[#090c12] ${
        fullViewport ? 'h-full min-h-0' : 'h-[78vh] min-h-[720px]'
      }`}
      style={fullViewport ? { height: '100%', minHeight: '100%' } : undefined}
    >
      <div className="z-20 flex min-h-12 items-start justify-between gap-2 border-b border-gray-800 bg-[#12151b] px-3 py-2 pointer-events-auto">
        <div className="flex items-center gap-2">
          <Input
            value={projectTitleDraft}
            onChange={(event) => {
              setProjectTitleDraft(event.target.value);
              setSaveState('unsaved');
            }}
            onBlur={handleRenameProject}
            className="h-8 w-[230px] border-gray-700 bg-[#0f141d] text-sm text-gray-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
            placeholder="Project name"
          />
          <span className="rounded border border-gray-700 px-2 py-0.5 text-[10px] uppercase text-gray-400">
            {saveState === 'saved' ? 'Saved' : saveState === 'saving' ? 'Saving...' : 'Unsaved changes'}
          </span>
          <span className={`rounded border px-2 py-0.5 text-[10px] uppercase ${
            unsyncedNodeCount > 0
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
          }`}>
            Sync {unsyncedNodeCount > 0 ? `${unsyncedNodeCount} local-only` : 'healthy'}
          </span>
        </div>
        <div className="relative flex max-w-[78%] flex-wrap items-center justify-end gap-2 overflow-x-auto text-xs text-gray-300">
          {selectedAssignees.length > 0 ? (
            <div className="flex max-w-[320px] flex-wrap items-center gap-1" data-testid="wf-selected-assignees">
              {selectedAssignees.slice(0, 3).map((assignee) => (
                <span key={`selected-assignee-${assignee.name}`} className="inline-flex items-center gap-1 rounded-full border border-gray-600 bg-[#121a29] px-1.5 py-0.5 text-[10px] text-gray-200">
                  <UserAvatar name={assignee.name} avatar={assignee.avatar} size="xs" />
                  <span className="max-w-[85px] truncate">{assignee.name}</span>
                  <button
                    type="button"
                    onClick={() => void handleUnassignSelectedTask(assignee.name)}
                    className="rounded px-1 text-[10px] text-gray-400 transition-colors duration-150 hover:bg-[#1f2a3f] hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                    title={`Unassign ${assignee.name}`}
                    data-testid="wf-unassign-btn"
                  >
                    x
                  </button>
                </span>
              ))}
              {selectedAssignees.length > 3 ? (
                <span className="text-[10px] text-gray-500">+{selectedAssignees.length - 3}</span>
              ) : null}
            </div>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            className={TOOLBAR_BUTTON_CLASS}
            onClick={() => {
              if (!selectedTaskId) return;
              setTaskDetailTaskId(selectedTaskId);
              setTaskDetailModalOpen(true);
            }}
            disabled={!selectedTaskId}
            title={selectedTaskId ? 'Open task details' : 'Select a node first'}
          >
            Task +
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={TOOLBAR_BUTTON_CLASS}
            onClick={() => {
              if (!selectedTaskId) return;
              setIntegrationsModalOpen(true);
            }}
            disabled={!selectedTaskId}
            title={selectedTaskId ? 'Configure integrations for selected task' : 'Select a node first'}
          >
            Integrations
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={TOOLBAR_BUTTON_CLASS}
            onClick={() => {
              if (!selectedTaskId) return;
              setAssignModalOpen(true);
            }}
            disabled={!selectedTaskId}
            data-testid="wf-assign-user-btn"
            title={selectedTaskId ? 'Assign agents, teammates, or friends' : 'Select a node first'}
          >
            Assign user
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 border-red-500/35 bg-red-500/10 text-red-100 transition-colors duration-150 hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70 disabled:opacity-50"
            onClick={() => {
              if (!selectedTaskId) return;
              if (!window.confirm('Delete selected task from this board?')) return;
              void handleDeleteSelectedTask();
            }}
            disabled={!selectedTaskId}
            title={selectedTaskId ? 'Delete selected task' : 'Select a node first'}
          >
            Delete task
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={TOOLBAR_BUTTON_CLASS}
            onClick={handleToggleBlankStart}
          >
            {useBlankStart ? 'Blank start: on' : 'Blank start: off'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={TOOLBAR_BUTTON_CLASS}
            onClick={() => setInteractionMode((prev) => (prev === 'select' ? 'pan' : 'select'))}
          >
            Mode: {interactionMode}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={TOOLBAR_BUTTON_CLASS}
            onClick={() => setCompactDerivedNodes((prev) => !prev)}
            title="Toggle compact branch rendering"
          >
            {compactDerivedNodes ? 'View: Compact' : 'View: Expanded'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={TOOLBAR_BUTTON_CLASS}
            disabled={!focusCandidateNodeId}
            onClick={() => {
              if (!focusCandidateNodeId) return;
              setLineageFocusRootId(focusCandidateNodeId);
              requestAnimationFrame(() => {
                reactFlow.fitView({ duration: 220, padding: 0.2 });
              });
            }}
            title={focusCandidateNodeId ? 'Show selected/active lineage branch' : 'Add a node to focus lineage'}
          >
            Focus Branch
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={TOOLBAR_BUTTON_CLASS}
            disabled={!lineageFocusRootId}
            onClick={() => {
              setLineageFocusRootId(null);
              requestAnimationFrame(() => {
                reactFlow.fitView({ duration: 220, padding: 0.22 });
              });
            }}
            title="Exit focus and reveal full graph"
          >
            Show All
          </Button>
          {lineageFocusRootId ? (
            <span className="inline-flex h-7 items-center rounded border border-cyan-500/40 bg-cyan-500/10 px-2 text-[10px] uppercase tracking-wide text-cyan-200">
              Branch Focus: {lineageFocusRootTitle || 'Active branch'}
            </span>
          ) : null}
          <Button size="sm" variant="outline" className={TOOLBAR_BUTTON_CLASS} onClick={history.undo} disabled={!history.canUndo}>
            Undo
          </Button>
          <Button size="sm" variant="outline" className={TOOLBAR_BUTTON_CLASS} onClick={history.redo} disabled={!history.canRedo}>
            Redo
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={TOOLBAR_BUTTON_CLASS}
            onClick={() => reactFlow.fitView({ duration: 240, padding: 0.22 })}
          >
            Fit
          </Button>
          <Button size="sm" className={`${TOOLBAR_PRIMARY_BUTTON_CLASS} bg-violet-500 hover:bg-violet-400`} onClick={() => void onAddEvent('New Task')}>
            Add task
          </Button>
          <Input
            value={checkpointLabel}
            onChange={(event) => setCheckpointLabel(event.target.value)}
            className="h-7 w-[150px] border-gray-700 bg-[#0f141d] text-xs text-gray-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
            placeholder="Checkpoint label"
          />
          <Button size="sm" className={`${TOOLBAR_PRIMARY_BUTTON_CLASS} bg-cyan-600 hover:bg-cyan-500`} onClick={handleSaveProject}>
            Save project
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={TOOLBAR_BUTTON_CLASS}
            onClick={handleRemoveMissingTaskNodes}
          >
            Remove missing tasks
          </Button>
          <select
            className="h-7 rounded border border-gray-700 bg-[#0f141d] px-2 text-[11px] text-gray-200 transition-colors duration-150 hover:border-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
            value=""
            onChange={(event) => {
              const value = event.target.value;
              if (!value) return;
              handleRestoreCheckpoint(value);
            }}
          >
            <option value="">Restore checkpoint</option>
            {checkpoints.slice(0, 6).map((checkpoint) => (
              <option key={checkpoint.id} value={checkpoint.id}>
                {checkpoint.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        className="relative z-10 min-h-0 flex-1"
        onDragOver={handleCanvasDragOver}
        onDragEnter={handleCanvasDragEnter}
        onDragLeave={handleCanvasDragLeave}
        onDrop={handleCanvasDrop}
      >
        <div
          className="absolute left-2 top-2 z-20 max-h-[70%] w-[260px] overflow-y-auto overflow-x-hidden overscroll-contain rounded-lg border border-gray-700 bg-[#0f141d] p-2 pointer-events-auto shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          data-testid="wf-task-library"
          onWheel={(event) => event.stopPropagation()}
        >
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wide text-gray-400">Task Library</p>
            <button
              type="button"
              onClick={() => {
                void handleAddEvent('New Task');
              }}
              className="inline-flex h-6 w-6 items-center justify-center rounded border border-cyan-500/40 bg-cyan-500/10 text-cyan-200 transition-colors duration-150 hover:bg-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
              title="Quick add task"
            >
              +
            </button>
          </div>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => {
                void handleAddEvent('Ghost Task');
              }}
              className="flex w-full items-center justify-between rounded-lg border border-dashed border-gray-600 bg-[#101521] px-2 py-1.5 text-left text-[11px] text-gray-300 transition-colors duration-150 hover:border-cyan-500/50 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
              data-testid="wf-library-ghost-add"
            >
              <span>Ghost Task</span>
              <span className="text-cyan-300">+</span>
            </button>
            {templateLibrary.map((item) => (
              <div
                key={`tpl-${item.taskId}`}
                draggable
                onDragStart={(event) => {
                  const payload: FlowTemplatePayload = {
                    title: item.title,
                    priority: item.priority,
                    dueDate: item.dueDate,
                    tags: item.tags,
                    resources: item.resources,
                    assignees: item.assignees,
                    goalId: item.goalId,
                    milestones: item.milestones,
                  };
                  draggedTemplateRef.current = payload;
                  setTemplateDragPayload(event, payload);
                }}
                onDragEnd={() => {
                  draggedTemplateRef.current = null;
                }}
                className={getTaskCardSurfaceClasses({
                  priority: item.priority,
                  className: 'rounded-lg p-2',
                })}
              >
                <button
                  type="button"
                  onClick={() => void handleLibraryCreate({
                    title: item.title,
                    priority: item.priority,
                    dueDate: item.dueDate,
                    tags: item.tags,
                    resources: item.resources,
                    assignees: item.assignees,
                    goalId: item.goalId,
                    milestones: item.milestones,
                  })}
                  draggable
                  onDragStart={(event) => {
                    const payload: FlowTemplatePayload = {
                      title: item.title,
                      priority: item.priority,
                      dueDate: item.dueDate,
                      tags: item.tags,
                      resources: item.resources,
                      assignees: item.assignees,
                      goalId: item.goalId,
                      milestones: item.milestones,
                    };
                    draggedTemplateRef.current = payload;
                    setTemplateDragPayload(event, payload);
                  }}
                  onDragEnd={() => {
                    draggedTemplateRef.current = null;
                  }}
                  className="w-full cursor-grab pl-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 rounded"
                  data-testid="wf-library-task"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-medium text-white">{item.title}</p>
                    <Badge variant="outline" className="h-5 border-gray-700 text-[10px] text-gray-300">
                      {item.priority || 'medium'}
                    </Badge>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3 w-3" />
                      {item.dueDate
                        ? new Date(item.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })
                        : 'No due date'}
                    </span>
                    <span className="truncate">
                      {Array.isArray(item.assignees) && item.assignees.length > 0
                        ? String((item.assignees[0] as any)?.name || item.assignees[0] || 'Unassigned')
                        : 'Unassigned'}
                    </span>
                  </div>
                  {item.goalId ? (
                    <div className="mt-1">
                      <Badge variant="outline" className="h-5 border-fuchsia-500/40 text-[10px] text-fuchsia-300">
                        <Target className="mr-1 h-3 w-3" />
                        Linked goal
                      </Badge>
                    </div>
                  ) : null}
                  {item.milestones.length > 0 ? (
                    <div className="mt-1.5 space-y-0.5 rounded border border-gray-800 bg-[#0d1118] p-1.5">
                      {item.milestones.slice(0, 2).map((milestone: any, milestoneIndex: number) => {
                        const stepCount = Array.isArray(milestone?.steps) ? milestone.steps.length : 0;
                        return (
                          <p
                            key={`tpl-inline-ms-${item.taskId}-${String(milestone?.id || milestoneIndex)}`}
                            className="line-clamp-1 text-[10px] text-indigo-200"
                          >
                            ○ {String(milestone?.title || `Milestone ${milestoneIndex + 1}`)} {stepCount > 0 ? `(${stepCount} steps)` : ''}
                          </p>
                        );
                      })}
                      {item.milestones.length > 2 ? (
                        <p className="text-[10px] text-gray-500">+{item.milestones.length - 2} more milestones</p>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-gray-500">
                    <TrendingUp className="h-3 w-3" />
                    Drag to Workstream
                  </div>
                </button>
                {item.milestones.slice(0, 4).map((milestone: any) => (
                  <div key={`tpl-ms-${item.taskId}-${String(milestone.id)}`} className="mt-1 pl-2">
                    <button
                      type="button"
                      draggable
                      onClick={() => void handleLibraryCreate({
                        title: String(milestone.title || 'Milestone'),
                        description: `Promoted milestone from ${item.title}`,
                        priority: item.priority,
                        dueDate: item.dueDate,
                        tags: item.tags,
                        resources: Array.isArray(milestone.resources) ? milestone.resources : item.resources,
                        assignees: Array.isArray(milestone.assignedTo) ? milestone.assignedTo : item.assignees,
                        goalId: item.goalId,
                        milestones: (Array.isArray(milestone.steps) ? milestone.steps : []).map((step: any, index: number) => ({
                          id: step?.id || `ms-${Date.now()}-${index}`,
                          title: step?.title || `Step ${index + 1}`,
                          completed: Boolean(step?.completed),
                          steps: [],
                          resources: Array.isArray(step?.resources) ? step.resources : [],
                          assignedTo: step?.assignedTo ? [step.assignedTo] : [],
                        })),
                      })}
                      onDragStart={(event) => {
                        const payload: FlowTemplatePayload = {
                          title: String(milestone.title || 'Milestone'),
                          description: `Promoted milestone from ${item.title}`,
                          priority: item.priority,
                          dueDate: item.dueDate,
                          tags: item.tags,
                          resources: Array.isArray(milestone.resources) ? milestone.resources : item.resources,
                          assignees: Array.isArray(milestone.assignedTo) ? milestone.assignedTo : item.assignees,
                          goalId: item.goalId,
                          milestones: (Array.isArray(milestone.steps) ? milestone.steps : []).map((step: any, index: number) => ({
                            id: step?.id || `ms-${Date.now()}-${index}`,
                            title: step?.title || `Step ${index + 1}`,
                            completed: Boolean(step?.completed),
                            steps: [],
                            resources: Array.isArray(step?.resources) ? step.resources : [],
                            assignedTo: step?.assignedTo ? [step.assignedTo] : [],
                          })),
                        };
                        setTemplateDragPayload(event, payload);
                      }}
                      className="w-full cursor-grab rounded text-left text-[11px] text-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                    >
                      ○ {String(milestone.title || 'Milestone')}
                    </button>
                    {(Array.isArray(milestone.steps) ? milestone.steps : []).slice(0, 4).map((step: any) => (
                      <button
                        key={`tpl-step-${item.taskId}-${String(milestone.id)}-${String(step.id)}`}
                        type="button"
                        draggable
                        onClick={() => void handleLibraryCreate({
                          title: String(step.title || 'Step'),
                          description: `Promoted step from ${item.title}`,
                          priority: item.priority,
                          dueDate: item.dueDate,
                          tags: item.tags,
                          resources: Array.isArray(step.resources) ? step.resources : item.resources,
                          assignees: step.assignedTo ? [step.assignedTo] : item.assignees,
                          goalId: item.goalId,
                        })}
                        onDragStart={(event) => {
                          const payload: FlowTemplatePayload = {
                            title: String(step.title || 'Step'),
                            description: `Promoted step from ${item.title}`,
                            priority: item.priority,
                            dueDate: item.dueDate,
                            tags: item.tags,
                            resources: Array.isArray(step.resources) ? step.resources : item.resources,
                            assignees: step.assignedTo ? [step.assignedTo] : item.assignees,
                            goalId: item.goalId,
                          };
                          setTemplateDragPayload(event, payload);
                        }}
                        className="block w-full cursor-grab rounded pl-4 text-left text-[10px] text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                      >
                        - {String(step.title || 'Step')}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ))}
            {templateLibrary.length === 0
              ? starterLibrary.map((item, index) => (
                  <div
                    key={`starter-tpl-${index}`}
                    draggable
                    onDragStart={(event) => {
                      draggedTemplateRef.current = item;
                      setTemplateDragPayload(event, item);
                    }}
                    onDragEnd={() => {
                      draggedTemplateRef.current = null;
                    }}
                    className={getTaskCardSurfaceClasses({
                      priority: item.priority,
                      className: 'rounded-lg p-2',
                    })}
                  >
                    <button
                      type="button"
                      onClick={() => void handleLibraryCreate(item)}
                      draggable
                      onDragStart={(event) => {
                        draggedTemplateRef.current = item;
                        setTemplateDragPayload(event, item);
                      }}
                      onDragEnd={() => {
                        draggedTemplateRef.current = null;
                      }}
                      className="w-full cursor-grab rounded pl-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                      data-testid="wf-library-task"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-medium text-white">{item.title}</p>
                        <Badge variant="outline" className="h-5 border-gray-700 text-[10px] text-gray-300">
                          {item.priority || 'medium'}
                        </Badge>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3 w-3" />
                          {item.dueDate
                            ? new Date(item.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })
                            : 'No due date'}
                        </span>
                        <span className="truncate">
                          {Array.isArray(item.assignees) && item.assignees.length > 0
                            ? String((item.assignees[0] as any)?.name || item.assignees[0] || 'Unassigned')
                            : 'Unassigned'}
                        </span>
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-gray-500">
                        <TrendingUp className="h-3 w-3" />
                        Drag to Workstream
                      </div>
                      {Array.isArray(item.milestones) && item.milestones.length > 0 ? (
                        <div className="mt-1.5 space-y-0.5 rounded border border-gray-800 bg-[#0d1118] p-1.5">
                          {item.milestones.slice(0, 2).map((milestone: any, milestoneIndex: number) => {
                            const stepCount = Array.isArray(milestone?.steps) ? milestone.steps.length : 0;
                            return (
                              <p
                                key={`starter-inline-ms-${index}-${String(milestone?.id || milestoneIndex)}`}
                                className="line-clamp-1 text-[10px] text-indigo-200"
                              >
                                ○ {String(milestone?.title || `Milestone ${milestoneIndex + 1}`)} {stepCount > 0 ? `(${stepCount} steps)` : ''}
                              </p>
                            );
                          })}
                          {item.milestones.length > 2 ? (
                            <p className="text-[10px] text-gray-500">+{item.milestones.length - 2} more milestones</p>
                          ) : null}
                        </div>
                      ) : null}
                    </button>
                    {(Array.isArray(item.milestones) ? item.milestones : []).slice(0, 4).map((milestone: any, milestoneIndex: number) => (
                      <div key={`starter-ms-${index}-${String(milestone.id || milestoneIndex)}`} className="mt-1 pl-2">
                        <button
                          type="button"
                          draggable
                          onClick={() => void handleLibraryCreate({
                            title: String(milestone.title || 'Milestone'),
                            description: `Promoted milestone from ${item.title}`,
                            priority: item.priority,
                            dueDate: item.dueDate,
                            tags: item.tags,
                            resources: Array.isArray(milestone.resources) ? milestone.resources : item.resources,
                            assignees: Array.isArray(milestone.assignedTo) ? milestone.assignedTo : item.assignees,
                            goalId: item.goalId,
                            milestones: (Array.isArray(milestone.steps) ? milestone.steps : []).map((step: any, stepIndex: number) => ({
                              id: step?.id || `starter-ms-${index}-${stepIndex}`,
                              title: step?.title || `Step ${stepIndex + 1}`,
                              completed: Boolean(step?.completed),
                              steps: [],
                              resources: Array.isArray(step?.resources) ? step.resources : [],
                              assignedTo: step?.assignedTo ? [step.assignedTo] : [],
                            })),
                          })}
                          onDragStart={(event) => {
                            const payload: FlowTemplatePayload = {
                              title: String(milestone.title || 'Milestone'),
                              description: `Promoted milestone from ${item.title}`,
                              priority: item.priority,
                              dueDate: item.dueDate,
                              tags: item.tags,
                              resources: Array.isArray(milestone.resources) ? milestone.resources : item.resources,
                              assignees: Array.isArray(milestone.assignedTo) ? milestone.assignedTo : item.assignees,
                              goalId: item.goalId,
                              milestones: (Array.isArray(milestone.steps) ? milestone.steps : []).map((step: any, stepIndex: number) => ({
                                id: step?.id || `starter-ms-${index}-${stepIndex}`,
                                title: step?.title || `Step ${stepIndex + 1}`,
                                completed: Boolean(step?.completed),
                                steps: [],
                                resources: Array.isArray(step?.resources) ? step.resources : [],
                                assignedTo: step?.assignedTo ? [step.assignedTo] : [],
                              })),
                            };
                            draggedTemplateRef.current = payload;
                            setTemplateDragPayload(event, payload);
                          }}
                          className="w-full cursor-grab rounded text-left text-[11px] text-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                        >
                          ○ {String(milestone.title || 'Milestone')}
                        </button>
                        {(Array.isArray(milestone.steps) ? milestone.steps : []).slice(0, 4).map((step: any, stepIndex: number) => (
                          <button
                            key={`starter-step-${index}-${String(milestone.id || milestoneIndex)}-${String(step.id || stepIndex)}`}
                            type="button"
                            draggable
                            onClick={() => void handleLibraryCreate({
                              title: String(step.title || 'Step'),
                              description: `Promoted step from ${item.title}`,
                              priority: item.priority,
                              dueDate: item.dueDate,
                              tags: item.tags,
                              resources: Array.isArray(step.resources) ? step.resources : item.resources,
                              assignees: step.assignedTo ? [step.assignedTo] : item.assignees,
                              goalId: item.goalId,
                            })}
                            onDragStart={(event) => {
                              const payload: FlowTemplatePayload = {
                                title: String(step.title || 'Step'),
                                description: `Promoted step from ${item.title}`,
                                priority: item.priority,
                                dueDate: item.dueDate,
                                tags: item.tags,
                                resources: Array.isArray(step.resources) ? step.resources : item.resources,
                                assignees: step.assignedTo ? [step.assignedTo] : item.assignees,
                                goalId: item.goalId,
                              };
                              draggedTemplateRef.current = payload;
                              setTemplateDragPayload(event, payload);
                            }}
                            className="block w-full cursor-grab rounded pl-4 text-left text-[10px] text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                          >
                            - {String(step.title || 'Step')}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                ))
              : null}
            {templateLibrary.length === 0 ? <p className="text-[11px] text-gray-500">No tasks available.</p> : null}
          </div>
        </div>
        <ReactFlow
          key={`flow-canvas-${projectId}`}
          nodes={displayNodes}
          edges={displayEdges}
          nodeTypes={nodeTypes}
          onInit={() => setCanvasReady(true)}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={(_event, edge) => {
            const sourceId = String(edge.source || '');
            const targetId = String(edge.target || '');
            const nextFocusId = sourceId || targetId;
            if (!nextFocusId) return;
            setLineageFocusRootId(nextFocusId);
            const nextTaskId = parseTaskId(nextFocusId);
            if (nextTaskId) {
              setSelectedTaskId(nextTaskId);
              onSelectTaskId?.(nextTaskId);
            }
            requestAnimationFrame(() => {
              reactFlow.fitView({ duration: 240, padding: 0.2 });
            });
          }}
          onNodeDragStop={onNodeDragStop}
          onNodeDragStart={() => setSaveState('unsaved')}
          onNodeClick={(_event, node) => {
            const taskId = parseTaskId(node.id);
            setAssigneePickerOpen(false);
            setSelectedTaskId(taskId);
            onSelectTaskId?.(taskId);
          }}
          onSelectionChange={(selection) => {
            const next = selection?.nodes?.[0];
            const taskId = next ? parseTaskId(next.id) : null;
            setSelectedTaskId(taskId);
            onSelectTaskId?.(taskId);
          }}
          onPaneClick={() => {
            setAssigneePickerOpen(false);
            setSelectedTaskId(null);
            onSelectTaskId?.(null);
          }}
          onDragOver={handleCanvasDragOver}
          onDragEnter={handleCanvasDragEnter}
          onDragLeave={handleCanvasDragLeave}
          onDrop={handleCanvasDrop}
          onMove={(_event, viewport) => {
            setViewportZoom((current) => (Math.abs(current - viewport.zoom) > 0.02 ? viewport.zoom : current));
          }}
          onMoveEnd={() => persist(nodes, edges)}
          fitView
          fitViewOptions={{ padding: 0.26, minZoom: 0.14 }}
          minZoom={0.12}
          maxZoom={2}
          nodesDraggable
          nodesConnectable
          elementsSelectable
          panOnDrag
          panOnScroll={false}
          zoomOnScroll
          zoomOnPinch
          zoomOnDoubleClick
          preventScrolling={false}
          snapToGrid
          snapGrid={[20, 20]}
          deleteKeyCode={['Backspace', 'Delete']}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#1a2232" gap={18} size={1} />
          <MiniMap
            pannable
            zoomable
            nodeColor={miniMapNodeColor}
            nodeStrokeColor="#0f172a"
            maskColor={lineageFocusRootId ? 'rgba(2, 6, 23, 0.72)' : 'rgba(2, 6, 23, 0.52)'}
          />
          <Controls showInteractive={false} />
        </ReactFlow>
        <div className="pointer-events-none absolute bottom-3 right-3 z-20 rounded border border-cyan-500/30 bg-[#0b1220e0] px-2 py-1 text-[10px] uppercase tracking-wide text-cyan-100/90">
          Zoom {Math.round(viewportZoom * 100)}% • {viewportZoom <= 0.52 ? 'Ultra Dense' : viewportZoom <= 0.74 ? 'Dense' : 'Detail'}
        </div>
        {isCanvasDropActive ? (
          <div className="pointer-events-none absolute inset-3 z-30 rounded-xl border-2 border-dashed border-cyan-400/80 bg-cyan-500/10 shadow-[0_0_0_1px_rgba(34,211,238,0.35),0_0_30px_rgba(34,211,238,0.2)] backdrop-blur-[1px]" data-testid="wf-drop-overlay">
            <div className="flex h-full items-center justify-center">
              <div className="rounded-lg border border-cyan-400/40 bg-[#0c1420e6] px-4 py-2 text-center">
                <div className="mb-1 flex items-center justify-center gap-2 text-cyan-200">
                  <ArrowDownToLine className="h-4 w-4 animate-pulse" />
                  <span className="text-sm font-medium">Drop to add to Workstream</span>
                </div>
                <p className="text-xs text-cyan-100/80">Release to create a connected task node on canvas</p>
                {dropPreview ? (
                  <div className="mt-2 rounded-md border border-cyan-500/30 bg-[#111b2ae6] px-2 py-1 text-left">
                    <p className="truncate text-xs font-medium text-white">{dropPreview.title}</p>
                    <p className="text-[10px] text-cyan-200/80">
                      {dropPreview.priority || 'medium'}{dropPreview.dueDate ? ` • due ${new Date(dropPreview.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}` : ''}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="z-20 border-t border-gray-800 bg-[#12151b] p-2">
        <div className="flex items-center gap-2">
          <select
            value={planningStyle}
            onChange={(event) => setPlanningStyle(event.target.value as PlanningStyle)}
            className="h-8 rounded border border-gray-700 bg-[#0f141d] px-2 text-xs text-gray-200 transition-colors duration-150 hover:border-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
            title="Planning style"
          >
            <option value="aggressive">Aggressive</option>
            <option value="balanced">Balanced</option>
            <option value="lean">Lean</option>
          </select>
          <Input
            value={quickTaskTitle}
            onChange={(event) => setQuickTaskTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void handleComposerAddTask();
            }}
            placeholder="Break down work into tasks and connect them."
            className="h-8 border-gray-700 bg-[#0e131c] text-sm text-gray-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
          />
          <Button className="h-8 bg-fuchsia-500 text-white transition-colors duration-150 hover:bg-fuchsia-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70" onClick={() => void handleComposerAddTask()}>
            Add task
          </Button>
          <Button
            className="h-8 border border-cyan-500/50 bg-cyan-500/10 text-cyan-200 transition-colors duration-150 hover:bg-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
            variant="outline"
            disabled={isAiPlanning}
            onClick={() => void handleComposerCreateAi(quickTaskTitle)}
          >
            {isAiPlanning ? 'Planning...' : 'Plan with AI'}
          </Button>
        </div>
      </div>

      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent
          className="!opacity-100 !bg-[#0f141d] border-gray-700 text-gray-100 shadow-2xl sm:max-w-[560px]"
          style={{ backgroundColor: '#0f141d', opacity: 1 }}
        >
          <DialogHeader>
            <DialogTitle>Assign People</DialogTitle>
            <DialogDescription>
              Assign agents, teammates, and trusted collaborators to the selected task.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-100">
              Tip: pick a task node first, then assign by role group.
            </div>
            {(['agents', 'teammates', 'friends'] as const).map((groupKey) => {
              const label = groupKey === 'agents' ? 'Agents' : groupKey === 'teammates' ? 'Teammates' : 'Friends';
              const list = assignGroups[groupKey];
              return (
                <div key={`assign-group-${groupKey}`} className="rounded border border-gray-700 bg-[#111827] p-2">
                  <p className="mb-1 text-[11px] uppercase tracking-wide text-gray-400">{label}</p>
                  <div className="space-y-1">
                    {list.map((option) => (
                      <button
                        key={`assign-modal-opt-${groupKey}-${option.id}-${option.name}`}
                        type="button"
                        onClick={() => void handleAssignSelectedTask(option)}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors duration-150 hover:bg-[#1b2230] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                      >
                        <UserAvatar name={option.name} avatar={option.avatar} fallback={option.fallback} size="xs" />
                        <span className="truncate text-xs text-gray-200">{option.name}</span>
                        <span className="ml-auto text-[10px] text-gray-500">{option.role || label.slice(0, -1)}</span>
                      </button>
                    ))}
                    {list.length === 0 ? (
                      <p className="px-2 py-1 text-xs text-gray-500">No {label.toLowerCase()} available.</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-gray-700 bg-[#141923] text-gray-200 transition-colors duration-150 hover:border-gray-500 hover:bg-[#1a2130] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
              onClick={() => setAssignModalOpen(false)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={integrationsModalOpen} onOpenChange={setIntegrationsModalOpen}>
        <DialogContent
          className="!opacity-100 !bg-[#0f141d] border-gray-700 text-gray-100 shadow-2xl sm:max-w-[920px]"
          style={{ backgroundColor: '#0f141d', opacity: 1 }}
        >
          <DialogHeader>
            <DialogTitle>Integration Hub</DialogTitle>
            <DialogDescription>
              OpenClaw-grade integration power with simplified setup: choose connectors, apply recipes, and attach automations to the selected task.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 rounded border border-cyan-500/35 bg-cyan-500/10 p-2 text-[11px] text-cyan-100">
              <span className="rounded border border-cyan-400/35 bg-[#122033] px-2 py-0.5 uppercase tracking-wide">Scope: Task</span>
              <span className="rounded border border-cyan-400/35 bg-[#122033] px-2 py-0.5 uppercase tracking-wide">
                Connected: {selectedNodeIntegrations.length}
              </span>
              <span className="text-cyan-100/85">Use recipes in Simple mode, or pick connectors directly in Advanced mode.</span>
            </div>

            <div className="rounded border border-gray-700 bg-[#101826] p-2">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-gray-100">OAuth Connection Center</p>
                <div className="flex flex-wrap items-center gap-1">
                  <span className="rounded border border-gray-600 bg-[#0f141d] px-2 py-0.5 text-[10px] text-gray-300">
                    Accounts: {integrationHealthSummary.total}
                  </span>
                  <span className="rounded border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200">
                    Healthy: {integrationHealthSummary.healthy}
                  </span>
                  <span className="rounded border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-200">
                    Attention: {integrationHealthSummary.attention}
                  </span>
                </div>
              </div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Input
                  value={newAccountLabel}
                  onChange={(event) => setNewAccountLabel(event.target.value)}
                  placeholder="Optional account label (e.g. Finance Ops)"
                  className="h-7 max-w-[320px] border-gray-700 bg-[#0f141d] text-xs text-gray-100"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className={TOOLBAR_BUTTON_CLASS}
                  onClick={() => {
                    const preferred = INTEGRATION_CONNECTORS.find((connector) => connector.authType === 'oauth2' && connector.popular) || INTEGRATION_CONNECTORS.find((connector) => connector.authType === 'oauth2');
                    if (!preferred) return;
                    void handleOAuthConnectAccount(preferred);
                    setNewAccountLabel('');
                  }}
                >
                  Quick OAuth Connect
                </Button>
              </div>
              <div className="max-h-[170px] space-y-1 overflow-auto rounded border border-gray-700 bg-[#0d131f] p-1.5">
                {integrationAccounts.length > 0 ? integrationAccounts.map((account) => (
                  <div key={`account-${account.id}`} className="rounded border border-gray-700 bg-[#111827] p-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-gray-100">
                          {account.accountLabel} - {account.connectorName}
                        </p>
                        <p className="truncate text-[10px] text-gray-400">
                          {account.authType.toUpperCase()} {account.expiresAt ? `• expires ${new Date(account.expiresAt).toLocaleDateString()}` : ''}
                        </p>
                      </div>
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${integrationHealthClass(account.health)}`}>
                        {account.health}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {account.scopes.map((scope) => (
                        <span key={`scope-${account.id}-${scope}`} className="rounded border border-gray-600 bg-[#0f141d] px-1.5 py-0.5 text-[10px] text-gray-300">
                          {scope}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <Button size="sm" variant="outline" className="h-6 border-cyan-500/35 bg-cyan-500/10 px-2 text-[10px] text-cyan-100 hover:bg-cyan-500/20" onClick={() => validateConnectorAccount(account.id)}>
                        Validate
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 border-emerald-500/35 bg-emerald-500/10 px-2 text-[10px] text-emerald-100 hover:bg-emerald-500/20" onClick={() => reconnectConnectorAccount(account.id)}>
                        Reconnect
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 border-red-500/35 bg-red-500/10 px-2 text-[10px] text-red-100 hover:bg-red-500/20" onClick={() => disconnectConnectorAccount(account.id)}>
                        Disconnect
                      </Button>
                    </div>
                  </div>
                )) : (
                  <p className="px-1 py-0.5 text-xs text-gray-500">No connected accounts yet. Create one and attach connectors in one click.</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={integrationMode === 'simple' ? 'default' : 'outline'}
                className={integrationMode === 'simple' ? 'h-7 bg-cyan-600 text-white hover:bg-cyan-500' : TOOLBAR_BUTTON_CLASS}
                onClick={() => setIntegrationMode('simple')}
              >
                Simple
              </Button>
              <Button
                type="button"
                size="sm"
                variant={integrationMode === 'advanced' ? 'default' : 'outline'}
                className={integrationMode === 'advanced' ? 'h-7 bg-violet-600 text-white hover:bg-violet-500' : TOOLBAR_BUTTON_CLASS}
                onClick={() => setIntegrationMode('advanced')}
              >
                Advanced
              </Button>
              <Input
                value={integrationSearch}
                onChange={(event) => setIntegrationSearch(event.target.value)}
                placeholder="Search 30+ connectors, providers, and recipes..."
                className="h-8 max-w-[360px] border-gray-700 bg-[#101726] text-sm text-gray-100"
              />
            </div>

            {integrationMode === 'advanced' ? (
              <>
                <div className="flex flex-wrap items-center gap-1.5">
                  {INTEGRATION_CATEGORY_FILTERS.map((category) => {
                    const active = integrationCategoryFilter === category;
                    return (
                      <button
                        key={`integration-category-${category}`}
                        type="button"
                        onClick={() => setIntegrationCategoryFilter(category)}
                        className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide transition-colors ${
                          active
                            ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-100'
                            : 'border-gray-700 bg-[#111827] text-gray-400 hover:border-gray-500 hover:text-gray-200'
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {INTEGRATION_PROVIDER_FILTERS.map((provider) => {
                    const active = integrationProviderFilter === provider;
                    return (
                      <button
                        key={`integration-provider-${provider}`}
                        type="button"
                        onClick={() => setIntegrationProviderFilter(provider)}
                        className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide transition-colors ${
                          active
                            ? 'border-violet-500/50 bg-violet-500/15 text-violet-100'
                            : 'border-gray-700 bg-[#111827] text-gray-400 hover:border-gray-500 hover:text-gray-200'
                        }`}
                      >
                        {provider}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}

            {integrationMode === 'simple' ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {recommendedRecipes.map((recipe) => {
                  const connectedCount = recipe.connectorIds.filter((connectorId) => selectedNodeIntegrations.includes(connectorId)).length;
                  return (
                    <div key={`integration-recipe-${recipe.id}`} className="rounded border border-gray-700 bg-[#111827] p-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-100">{recipe.name}</p>
                        <Badge variant="outline" className="h-5 border-cyan-500/40 text-[10px] text-cyan-200">
                          {connectedCount}/{recipe.connectorIds.length} connected
                        </Badge>
                      </div>
                      <p className="mt-1 text-[11px] text-gray-400">{recipe.description}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {recipe.connectorIds.map((connectorId) => {
                          const connector = integrationConnectorById.get(connectorId);
                          return (
                            <span key={`integration-recipe-chip-${recipe.id}-${connectorId}`} className="rounded border border-gray-700 bg-[#0f141d] px-1.5 py-0.5 text-[10px] text-gray-300">
                              {connector?.name || connectorId}
                            </span>
                          );
                        })}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="mt-2 h-7 bg-cyan-600 text-white hover:bg-cyan-500"
                        onClick={() => applyIntegrationRecipe(recipe)}
                      >
                        Apply recipe
                      </Button>
                    </div>
                  );
                })}
                {recommendedRecipes.length === 0 ? (
                  <p className="col-span-full rounded border border-gray-700 bg-[#111827] p-2 text-xs text-gray-400">
                    No recipes match this search.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {filteredIntegrationConnectors.map((connector) => {
                  const active = selectedNodeIntegrations.includes(connector.id);
                  const connectorAccounts = selectedConnectorAccounts.get(connector.id) || [];
                  const healthyAccount = connectorAccounts.find((account) => account.health === 'healthy');
                  return (
                    <div
                      key={`integration-opt-${connector.id}`}
                      className={`rounded border p-2 transition-colors ${
                        active
                          ? 'border-violet-500/50 bg-violet-500/15 text-violet-100'
                          : 'border-gray-700 bg-[#111827] text-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{connector.name}</p>
                        <span className="rounded border border-gray-600 px-1.5 py-0.5 text-[10px] uppercase text-gray-300">{connector.provider}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-gray-400">{connector.description}</p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-gray-500">
                          Accounts: {connectorAccounts.length}
                          {healthyAccount ? ` • default ${healthyAccount.accountLabel}` : ''}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 border-cyan-500/35 bg-cyan-500/10 px-2 text-[10px] text-cyan-100 hover:bg-cyan-500/20"
                          disabled={pendingOAuthConnectorId === connector.id}
                          onClick={() => {
                            if (connector.authType === 'oauth2') {
                              void handleOAuthConnectAccount(connector);
                              return;
                            }
                            createConnectorAccount(connector, newAccountLabel || `${connector.name} Workspace Account`);
                          }}
                        >
                          {pendingOAuthConnectorId === connector.id
                            ? 'Authorizing...'
                            : connector.authType === 'oauth2'
                              ? 'OAuth connect'
                              : 'Connect account'}
                        </Button>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="rounded border border-gray-700 bg-[#0f141d] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-gray-300">
                          {connector.category}
                        </span>
                        <div className="flex items-center gap-1">
                          {active ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 border-red-500/40 bg-red-500/10 px-2 text-[10px] text-red-200 hover:bg-red-500/20"
                              onClick={() => removeSelectedTaskIntegration(connector.id)}
                            >
                              Disconnect
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="h-6 bg-violet-600 px-2 text-[10px] text-white hover:bg-violet-500"
                              onClick={() => connectIntegrationByConnector(connector, 'manual connector')}
                            >
                              Connect
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredIntegrationConnectors.length === 0 ? (
                  <p className="col-span-full rounded border border-gray-700 bg-[#111827] p-2 text-xs text-gray-400">
                    No connectors match this filter.
                  </p>
                ) : null}
              </div>
            )}

            {selectedIntegrationBindings.length > 0 ? (
              <div className="rounded border border-gray-700 bg-[#111827] p-2">
                <p className="mb-1 text-[11px] uppercase tracking-wide text-gray-400">Connected on this task</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedIntegrationBindings.map((binding) => (
                    <span key={`binding-${binding.connectorId}`} className="inline-flex items-center gap-1 rounded border border-violet-500/35 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-100">
                      {binding.connectorName}
                      {binding.accountLabel ? <span className="text-violet-200/80">[{binding.accountLabel}]</span> : null}
                      <span className="text-violet-300/80">({binding.provider})</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-gray-700 bg-[#141923] text-gray-200 transition-colors duration-150 hover:border-gray-500 hover:bg-[#1a2130] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
              onClick={() => setIntegrationsModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TaskDetailModal
        task={(taskDetailTask as any) || null}
        open={taskDetailModalOpen}
        onOpenChange={(open) => {
          setTaskDetailModalOpen(open);
          if (!open) setTaskDetailTaskId(null);
        }}
      />

      {!canvasReady ? (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-[#090c12]/40">
          <p className="text-xs text-gray-400">Loading canvas...</p>
        </div>
      ) : null}
    </div>
  );
}

export function WorkstreamFlowCanvas(props: WorkstreamFlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkstreamFlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
