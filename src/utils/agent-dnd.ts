import { getAgentRolePlaybookForWorkspace } from './agent-role-playbooks';

export type AgentDragPayload = {
  id: string;
  name: string;
  sourceTab?: string;
  workspaceId?: string;
};

const AGENT_MIME = 'application/x-syncscript-agent';

export function hasAgentDragPayload(event: Pick<DragEvent, 'dataTransfer'>): boolean {
  const types = event.dataTransfer?.types;
  if (!types) return false;
  return Array.from(types).includes(AGENT_MIME);
}

export function parseAgentDragPayload(
  event: Pick<DragEvent, 'dataTransfer'>,
): AgentDragPayload | null {
  try {
    const rawPrimary = event.dataTransfer?.getData(AGENT_MIME);
    const rawFallback = event.dataTransfer?.getData('text/plain');
    const raw = rawPrimary || rawFallback;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const id = String(parsed?.id || '').trim();
    const name = String(parsed?.name || '').trim();
    if (!id || !name) return null;
    return {
      id,
      name,
      sourceTab: String(parsed?.sourceTab || '').trim() || undefined,
      workspaceId: String(parsed?.workspaceId || '').trim() || undefined,
    };
  } catch {
    return null;
  }
}

export function createAgentCollaborator(agent: AgentDragPayload) {
  const playbook = getAgentRolePlaybookForWorkspace(
    agent.workspaceId || 'default',
    agent.id,
    agent.name,
  );
  return {
    id: agent.id,
    name: agent.name,
    image: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(agent.id)}`,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(agent.id)}`,
    fallback: agent.name.charAt(0).toUpperCase() || 'A',
    progress: 0,
    animationType: 'glow' as const,
    status: 'online' as const,
    role: 'agent' as const,
    collaboratorType: 'agent' as const,
    isExternalAgent: false,
    assignmentDirective: playbook.assignmentDefaultDirective,
    roleMission: playbook.mission,
    roleDomain: playbook.domain,
  };
}
