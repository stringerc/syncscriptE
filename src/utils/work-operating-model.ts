import { appendExecutionTrailEvent } from './execution-trail';

export interface WorkspaceProject {
  id: string;
  name: string;
  description?: string;
  color?: string;
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GoalProjectLink {
  goalId: string;
  projectId: string;
  updatedAt: string;
}

export interface AgentExecutionProjectLink {
  taskId: string;
  projectId: string;
  agentId?: string;
  agentName: string;
  createdAt: string;
  updatedAt: string;
}

const PROJECTS_KEY = 'syncscript:workspace-projects:v1';
const GOAL_LINKS_KEY = 'syncscript:goal-project-links:v1';
const AGENT_EXEC_PROJECT_LINKS_KEY = 'syncscript:agent-exec-project-links:v1';

const DEFAULT_PROJECT: WorkspaceProject = {
  id: 'project-general',
  name: 'General',
  description: 'Default project container for uncategorized work.',
  color: '#22c55e',
  archived: false,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readProjects(): WorkspaceProject[] {
  if (typeof window === 'undefined') return [DEFAULT_PROJECT];
  const parsed = safeParse<WorkspaceProject[]>(window.localStorage.getItem(PROJECTS_KEY), []);
  const dedup = new Map<string, WorkspaceProject>();
  for (const project of parsed) {
    if (!project?.id) continue;
    dedup.set(project.id, {
      ...project,
      archived: Boolean(project.archived),
    });
  }
  if (!dedup.has(DEFAULT_PROJECT.id)) {
    dedup.set(DEFAULT_PROJECT.id, DEFAULT_PROJECT);
  }
  return Array.from(dedup.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function writeProjects(projects: WorkspaceProject[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch {
    // non-blocking
  }
}

function readGoalLinks(): GoalProjectLink[] {
  if (typeof window === 'undefined') return [];
  const parsed = safeParse<GoalProjectLink[]>(window.localStorage.getItem(GOAL_LINKS_KEY), []);
  return Array.isArray(parsed) ? parsed.filter((item) => item?.goalId && item?.projectId) : [];
}

function writeGoalLinks(links: GoalProjectLink[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(GOAL_LINKS_KEY, JSON.stringify(links));
  } catch {
    // non-blocking
  }
}

function readAgentExecutionProjectLinks(): AgentExecutionProjectLink[] {
  if (typeof window === 'undefined') return [];
  const parsed = safeParse<AgentExecutionProjectLink[]>(
    window.localStorage.getItem(AGENT_EXEC_PROJECT_LINKS_KEY),
    [],
  );
  return Array.isArray(parsed)
    ? parsed.filter((item) => item?.taskId && item?.projectId && item?.agentName)
    : [];
}

function writeAgentExecutionProjectLinks(links: AgentExecutionProjectLink[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(AGENT_EXEC_PROJECT_LINKS_KEY, JSON.stringify(links.slice(0, 2000)));
  } catch {
    // non-blocking
  }
}

export function listWorkspaceProjects(): WorkspaceProject[] {
  return readProjects().filter((project) => !project.archived);
}

export function listAllWorkspaceProjects(): WorkspaceProject[] {
  return readProjects();
}

export function getWorkspaceProjectById(projectId: string): WorkspaceProject | null {
  const key = String(projectId || '').trim();
  if (!key) return null;
  return readProjects().find((project) => project.id === key) || null;
}

export function createWorkspaceProject(input: { name: string; description?: string; color?: string }): WorkspaceProject {
  const cleanName = String(input.name || '').trim();
  if (!cleanName) throw new Error('Project name is required.');
  const now = new Date().toISOString();
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 36) || 'project';
  const projects = readProjects();
  let id = `project-${slug}`;
  let counter = 1;
  const existingIds = new Set(projects.map((project) => project.id));
  while (existingIds.has(id)) {
    counter += 1;
    id = `project-${slug}-${counter}`;
  }
  const next: WorkspaceProject = {
    id,
    name: cleanName,
    description: input.description?.trim(),
    color: input.color || '#06b6d4',
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
  writeProjects([...projects, next]);
  return next;
}

export function archiveWorkspaceProject(projectId: string) {
  const projects = readProjects();
  writeProjects(
    projects.map((project) =>
      project.id === projectId ? { ...project, archived: true, updatedAt: new Date().toISOString() } : project,
    ),
  );
}

export function updateWorkspaceProject(
  projectId: string,
  updates: Partial<Pick<WorkspaceProject, 'name' | 'description' | 'color' | 'archived'>>,
): WorkspaceProject | null {
  const key = String(projectId || '').trim();
  if (!key) return null;
  const projects = readProjects();
  let nextProject: WorkspaceProject | null = null;
  const nextProjects = projects.map((project) => {
    if (project.id !== key) return project;
    nextProject = {
      ...project,
      ...updates,
      name: updates.name !== undefined ? String(updates.name).trim() || project.name : project.name,
      description: updates.description !== undefined ? String(updates.description).trim() : project.description,
      updatedAt: new Date().toISOString(),
    };
    return nextProject;
  });
  writeProjects(nextProjects);
  return nextProject;
}

export function assignGoalToProject(goalId: string, projectId: string | null) {
  const links = readGoalLinks();
  const next = links.filter((item) => item.goalId !== goalId);
  if (projectId) {
    next.push({ goalId, projectId, updatedAt: new Date().toISOString() });
  }
  writeGoalLinks(next);
}

export function getGoalProjectMap(): Record<string, string> {
  return readGoalLinks().reduce<Record<string, string>>((acc, item) => {
    acc[item.goalId] = item.projectId;
    return acc;
  }, {});
}

export function ensureExecutionProjectForTask(input: {
  taskId: string;
  taskTitle: string;
  agentName: string;
  agentId?: string;
}): string {
  const taskId = String(input.taskId || '').trim();
  const taskTitle = String(input.taskTitle || '').trim();
  const agentName = String(input.agentName || '').trim();
  const agentId = String(input.agentId || '').trim() || undefined;
  if (!taskId || !taskTitle || !agentName) return 'project-general';

  const links = readAgentExecutionProjectLinks();
  const existing = links.find((link) => link.taskId === taskId);
  if (existing?.projectId) return existing.projectId;

  const cleanProjectName = `${agentName} · ${taskTitle}`.slice(0, 80);
  const createdProject = createWorkspaceProject({
    name: cleanProjectName,
    description:
      'Auto-created execution project for agent-owned task. Expand the workstream tree to review architecture and steps.',
    color: '#8b5cf6',
  });

  const now = new Date().toISOString();
  writeAgentExecutionProjectLinks([
    ...links,
    {
      taskId,
      projectId: createdProject.id,
      agentId,
      agentName,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  appendExecutionTrailEvent({
    type: 'run_created',
    title: `Execution project auto-created for ${agentName}`,
    detail: taskTitle,
    projectId: createdProject.id,
    taskId,
    agentId,
    agentName,
    actor: 'OpenClaw',
    metadata: { source: 'ensureExecutionProjectForTask' },
  });

  return createdProject.id;
}
