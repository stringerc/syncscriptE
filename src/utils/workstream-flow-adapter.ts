import type {
  WorkstreamFlowDocument,
  WorkstreamFlowEdge,
  WorkstreamFlowNode,
} from '../types/workstream-flow';

type AnyTask = Record<string, any>;

function normalizeStatus(input: unknown): string {
  return String(input || '').toLowerCase().trim();
}

function classifyStatus(task: AnyTask): string {
  if (task?.completed) return 'done';
  const status = normalizeStatus(task?.status);
  if (status === 'doing' || status === 'in_progress' || status === 'in-progress') return 'doing';
  if (status === 'completed' || status === 'done') return 'done';
  return 'todo';
}

function extractBlockingDependencyIds(task: AnyTask): string[] {
  const deps = Array.isArray(task?.dependencies) ? task.dependencies : [];
  return deps
    .map((dep: any) => {
      if (typeof dep === 'string') return dep;
      if (!dep || typeof dep !== 'object') return '';
      const depType = normalizeStatus(dep.type);
      if (depType && depType !== 'blocked-by' && depType !== 'blocks' && depType !== 'related') {
        return '';
      }
      return String(dep.dependsOn || dep.taskId || dep.id || '').trim();
    })
    .filter(Boolean);
}

function nodeIdForTask(taskId: string): string {
  return `task:${taskId}`;
}

function defaultPosition(index: number): { x: number; y: number } {
  const column = index % 5;
  const row = Math.floor(index / 5);
  return { x: 120 + column * 280, y: 120 + row * 180 };
}

export function buildWorkstreamFlowFromTasks(tasks: AnyTask[], projectId: string): WorkstreamFlowDocument {
  const scopedTasks = tasks.filter((task) => String(task?.projectId || 'project-general') === projectId);
  const nodes: WorkstreamFlowNode[] = scopedTasks.map((task, index) => {
    const taskId = String(task.id);
    const layout = task?.flowLayout && typeof task.flowLayout === 'object' ? task.flowLayout : null;
    const fallback = defaultPosition(index);
    return {
      id: nodeIdForTask(taskId),
      type: 'eventNode',
      position: {
        x: Number.isFinite(Number(layout?.x)) ? Number(layout.x) : fallback.x,
        y: Number.isFinite(Number(layout?.y)) ? Number(layout.y) : fallback.y,
      },
      data: {
        taskId,
        title: String(task?.title || 'Untitled event'),
        status: classifyStatus(task),
        completed: Boolean(task?.completed),
        priority: String(task?.priority || ''),
        projectId,
        nodeKind: 'event',
      },
    };
  });

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges: WorkstreamFlowEdge[] = [];

  for (const task of scopedTasks) {
    const taskId = String(task.id);
    const sourceNodeId = nodeIdForTask(taskId);
    const parentTaskId = String(task?.parentTaskId || '').trim();
    if (parentTaskId) {
      const parentNodeId = nodeIdForTask(parentTaskId);
      if (nodeIds.has(parentNodeId) && nodeIds.has(sourceNodeId)) {
        edges.push({
          id: `hierarchy:${parentTaskId}->${taskId}`,
          source: parentNodeId,
          target: sourceNodeId,
          label: 'parent',
          data: { kind: 'hierarchy' },
        });
      }
    }

    for (const depId of extractBlockingDependencyIds(task)) {
      const depNodeId = nodeIdForTask(depId);
      if (!nodeIds.has(depNodeId) || !nodeIds.has(sourceNodeId)) continue;
      edges.push({
        id: `dependency:${depId}->${taskId}`,
        source: depNodeId,
        target: sourceNodeId,
        label: 'depends on',
        data: { kind: 'dependency' },
      });
    }
  }

  return {
    version: 1,
    projectId,
    nodes,
    edges,
    updatedAt: new Date().toISOString(),
  };
}

export function mergeWorkstreamFlowWithTasks(
  existing: WorkstreamFlowDocument | null,
  tasks: AnyTask[],
  projectId: string,
): WorkstreamFlowDocument {
  const fresh = buildWorkstreamFlowFromTasks(tasks, projectId);
  if (!existing || existing.projectId !== projectId) return fresh;

  const existingById = new Map(existing.nodes.map((node) => [node.id, node]));
  const mergedNodes = fresh.nodes.map((node) => {
    const prior = existingById.get(node.id);
    if (!prior) return node;
    return {
      ...node,
      position: prior.position,
    };
  });

  const validNodeIds = new Set(mergedNodes.map((node) => node.id));
  const mergedEdges = [
    ...existing.edges.filter((edge) => validNodeIds.has(edge.source) && validNodeIds.has(edge.target)),
    ...fresh.edges,
  ];
  const dedup = new Map<string, WorkstreamFlowEdge>();
  for (const edge of mergedEdges) {
    dedup.set(edge.id, edge);
  }

  return {
    version: 1,
    projectId,
    nodes: mergedNodes,
    edges: Array.from(dedup.values()),
    viewport: existing.viewport,
    updatedAt: new Date().toISOString(),
  };
}
