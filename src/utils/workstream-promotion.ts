export interface WorkstreamNode {
  id: string;
  title: string;
  level: 'task' | 'milestone' | 'step';
  parentId?: string;
}

export interface PromotedProjectRecord {
  id: string;
  sourceTaskId: string;
  sourceNodeId: string;
  sourceNodeLevel: WorkstreamNode['level'];
  title: string;
  createdAtIso: string;
}

const PROMOTION_STORE_KEY = 'syncscript:workstream-promotions:v1';

function readPromotions(): PromotedProjectRecord[] {
  try {
    const raw = localStorage.getItem(PROMOTION_STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePromotions(records: PromotedProjectRecord[]) {
  try {
    localStorage.setItem(PROMOTION_STORE_KEY, JSON.stringify(records.slice(0, 300)));
  } catch {
    // non-blocking
  }
}

export function listPromotedWorkstreamProjects(): PromotedProjectRecord[] {
  return readPromotions().sort(
    (a, b) => new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime(),
  );
}

export function promoteWorkstreamNodeToProject(input: {
  sourceTaskId: string;
  node: WorkstreamNode;
}): PromotedProjectRecord {
  const next: PromotedProjectRecord = {
    id: `project_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    sourceTaskId: input.sourceTaskId,
    sourceNodeId: input.node.id,
    sourceNodeLevel: input.node.level,
    title: input.node.title,
    createdAtIso: new Date().toISOString(),
  };
  const current = readPromotions();
  writePromotions([next, ...current]);
  return next;
}
