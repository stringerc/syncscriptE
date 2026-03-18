import { saveAgentRolePlaybookOverride } from './agent-role-playbooks';
import type { AgentGovernanceMode } from './agent-governance';

export type WorkspaceAgentRecord = {
  id: string;
  name: string;
  role: string;
  team: string;
  governanceMode: AgentGovernanceMode;
  createdAt: string;
};

type WorkspaceAgentSeed = {
  name: string;
  role?: string;
  team?: string;
  domain?: string;
  mission?: string;
  focus?: string[];
  doNotDo?: string[];
  assignmentDefaultDirective?: string;
  soulMd?: string;
};

const STORAGE_KEY = 'syncscript_workspace_agents_v1';

function readStore(): Record<string, WorkspaceAgentRecord[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(next: Record<string, WorkspaceAgentRecord[]>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage write failures
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export function getWorkspaceAgents(workspaceId: string): WorkspaceAgentRecord[] {
  const key = String(workspaceId || 'default').trim().toLowerCase();
  const store = readStore();
  const rows = Array.isArray(store[key]) ? store[key] : [];
  return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function createWorkspaceAgent(workspaceId: string, seed: WorkspaceAgentSeed): WorkspaceAgentRecord {
  const key = String(workspaceId || 'default').trim().toLowerCase();
  const store = readStore();
  const existing = Array.isArray(store[key]) ? store[key] : [];
  const baseSlug = slugify(seed.name || 'workspace-agent') || 'workspace-agent';
  const idPrefix = `workspace-${baseSlug}`;
  let nextId = idPrefix;
  let attempt = 1;
  const existingIds = new Set(existing.map((item) => item.id));
  while (existingIds.has(nextId)) {
    attempt += 1;
    nextId = `${idPrefix}-${attempt}`;
  }

  const created: WorkspaceAgentRecord = {
    id: nextId,
    name: seed.name.trim(),
    role: (seed.role || 'Workspace-specific specialist').trim(),
    team: (seed.team || 'Workspace').trim(),
    governanceMode: 'workspace_owned',
    createdAt: new Date().toISOString(),
  };

  store[key] = [...existing, created];
  writeStore(store);

  saveAgentRolePlaybookOverride(workspaceId, created.id, {
    agentId: created.id,
    agentName: created.name,
    domain: (seed.domain || 'Workspace operations').trim(),
    mission: (seed.mission || `Execute ${created.name} objectives with measurable outcomes.`).trim(),
    focus: Array.isArray(seed.focus) && seed.focus.length > 0 ? seed.focus : [
      'Translate intent into actionable steps',
      'Maintain execution quality and clarity',
    ],
    doNotDo: Array.isArray(seed.doNotDo) && seed.doNotDo.length > 0 ? seed.doNotDo : [
      'Do not act outside workspace policy guardrails',
    ],
    assignmentDefaultDirective:
      (seed.assignmentDefaultDirective
        || 'Convert this assignment into an execution-ready plan with owners, checkpoints, and proof of completion.')
        .trim(),
    soulMd: seed.soulMd,
  });

  return created;
}
