import { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { AnimatedAvatar } from '../AnimatedAvatar';
import { MessageSquare, RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useAgentProgress } from '../../contexts/AgentProgressContext';
import {
  AGENT_GOVERNANCE_PROFILES,
  canEditGovernedField,
  type AgentGovernanceMode,
} from '../../utils/agent-governance';
import {
  clearAgentRolePlaybookOverride,
  getAgentRolePlaybookForWorkspace,
  saveAgentRolePlaybookOverride,
  type AgentRolePlaybook,
} from '../../utils/agent-role-playbooks';

type AgentRecord = {
  id: string;
  name: string;
  role?: string;
  team?: string;
  governanceMode?: AgentGovernanceMode;
};

type AgentControlPlaneProps = {
  workspaceId: string;
  agents: AgentRecord[];
  onOpenChat?: (agent: AgentRecord) => void;
};

function toLines(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getAgentAvatarUrl(agentId: string): string {
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(agentId)}`;
}

function toAnimationType(
  tier: string | undefined,
): 'glow' | 'pulse' | 'heartbeat' | 'bounce' | 'wiggle' | 'shake' {
  if (tier === 'legendary') return 'heartbeat';
  if (tier === 'orbit') return 'shake';
  if (tier === 'glow') return 'glow';
  if (tier === 'pulse') return 'pulse';
  return 'bounce';
}

export function AgentControlPlane({ workspaceId, agents, onOpenChat }: AgentControlPlaneProps) {
  const { getProfilesForWorkspace } = useAgentProgress();
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId) || agents[0] || null,
    [agents, selectedAgentId],
  );
  const agentProfiles = useMemo(
    () => getProfilesForWorkspace(workspaceId, agents),
    [agents, getProfilesForWorkspace, workspaceId],
  );
  const profileByAgentId = useMemo(
    () => new Map(agentProfiles.map((profile) => [profile.agentId, profile])),
    [agentProfiles],
  );
  const selectedProfile = selectedAgent ? profileByAgentId.get(selectedAgent.id) || null : null;
  const governanceMode: AgentGovernanceMode = selectedAgent?.governanceMode || 'managed_configurable';
  const governance = AGENT_GOVERNANCE_PROFILES[governanceMode];

  const playbook = useMemo(() => {
    if (!selectedAgent) return null;
    return getAgentRolePlaybookForWorkspace(workspaceId, selectedAgent.id, selectedAgent.name);
  }, [workspaceId, selectedAgent?.id, selectedAgent?.name]);

  const [draft, setDraft] = useState<AgentRolePlaybook | null>(playbook);
  const [focusText, setFocusText] = useState('');
  const [avoidText, setAvoidText] = useState('');

  useEffect(() => {
    if (agents.length === 0) return;
    if (!selectedAgentId || !agents.some((agent) => agent.id === selectedAgentId)) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  useEffect(() => {
    setDraft(playbook);
    setFocusText(playbook?.focus?.join('\n') || '');
    setAvoidText(playbook?.doNotDo?.join('\n') || '');
  }, [playbook?.agentId, workspaceId]);

  const canSave = Boolean(draft && selectedAgent);

  const handleSave = () => {
    if (!draft || !selectedAgent) return;
    if (governanceMode === 'system_locked') {
      toast.info('Nexus Core is locked by system policy');
      return;
    }
    const next: AgentRolePlaybook = {
      ...draft,
      focus: toLines(focusText),
      doNotDo: toLines(avoidText),
    };
    saveAgentRolePlaybookOverride(workspaceId, selectedAgent.id, next);
    setDraft(next);
    toast.success(`${selectedAgent.name} role playbook saved`);
  };

  const handleReset = () => {
    if (!selectedAgent) return;
    if (governanceMode === 'system_locked') {
      toast.info('Nexus Core is locked by system policy');
      return;
    }
    clearAgentRolePlaybookOverride(workspaceId, selectedAgent.id);
    const reset = getAgentRolePlaybookForWorkspace(workspaceId, selectedAgent.id, selectedAgent.name);
    setDraft(reset);
    setFocusText(reset.focus.join('\n'));
    setAvoidText(reset.doNotDo.join('\n'));
    toast.success(`${selectedAgent.name} playbook reset to default`);
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex min-w-[920px] gap-4 min-h-[620px]">
      <div className="w-[180px] flex-none rounded-xl border border-gray-700 bg-[#252830] p-2.5 space-y-2 min-h-[620px]">
        <p className="text-xs uppercase tracking-wide text-gray-400">Agent OS</p>
        <div className="space-y-2 h-[560px] overflow-y-auto pr-0.5">
          {agents.map((agent) => {
            const active = selectedAgent?.id === agent.id;
            const profile = profileByAgentId.get(agent.id);
            const xpToNext = profile?.xpToNextLevel || 100;
            const xp = profile?.xp || 0;
            const levelProgressPct = Math.max(0, Math.min(100, Math.round((xp / Math.max(1, xpToNext)) * 100)));
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => setSelectedAgentId(agent.id)}
                title={agent.name}
                aria-label={agent.name}
                className={`w-full rounded-lg border p-2 transition-colors ${
                  active ? 'border-indigo-500/60 bg-indigo-500/12 text-indigo-200' : 'border-gray-700 bg-[#1e2128] text-gray-300 hover:border-gray-600'
                }`}
              >
                <div className="mb-1.5 flex justify-center">
                  <AnimatedAvatar
                    name={agent.name}
                    image={getAgentAvatarUrl(agent.id)}
                    fallback={agent.name.slice(0, 2).toUpperCase()}
                    progress={levelProgressPct}
                    animationType={toAnimationType(profile?.animationTier)}
                    status={profile?.status === 'idle' ? 'away' : 'online'}
                    size={32}
                  />
                </div>
                <p className="text-center text-[11px] leading-4 text-gray-200 break-words">
                  {agent.name}
                </p>
                <div className="mt-1.5 flex items-center justify-center gap-1.5">
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      profile?.status === 'working' ? 'bg-emerald-400' : profile?.status === 'online' ? 'bg-cyan-400' : 'bg-gray-500'
                    }`}
                  />
                  <span className="text-[10px] text-gray-400">Lv {profile?.level || 1}</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-[#12151b]">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" style={{ width: `${levelProgressPct}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-w-0 flex-1 rounded-xl border border-gray-700 bg-[#252830] p-4 space-y-4 min-h-[620px]">
        {!draft || !selectedAgent ? (
          <p className="text-sm text-gray-400">No agent selected.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <AnimatedAvatar
                  name={selectedAgent.name}
                  image={getAgentAvatarUrl(selectedAgent.id)}
                  fallback={selectedAgent.name.slice(0, 2).toUpperCase()}
                  progress={Math.max(
                    0,
                    Math.min(
                      100,
                      Math.round(((selectedProfile?.xp || 0) / Math.max(1, selectedProfile?.xpToNextLevel || 100)) * 100),
                    ),
                  )}
                  animationType={toAnimationType(selectedProfile?.animationTier)}
                  status={selectedProfile?.status === 'idle' ? 'away' : 'online'}
                  size={40}
                />
                <div>
                <h4 className="text-white text-sm font-semibold">{selectedAgent.name} Control Plane</h4>
                <p className="text-xs text-gray-400">
                  Workspace-scoped role contract (`soul.md` style) used by chat + assignment behavior.
                </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className={
                    governanceMode === 'system_locked'
                      ? 'border-rose-500/40 text-rose-300'
                      : governanceMode === 'workspace_owned'
                        ? 'border-emerald-500/40 text-emerald-300'
                        : 'border-amber-500/40 text-amber-300'
                  }
                >
                  {governance.label}
                </Badge>
                <Badge variant="outline" className="border-cyan-500/40 text-cyan-300">
                  Workspace: {workspaceId}
                </Badge>
                {onOpenChat ? (
                  <Button size="sm" variant="outline" onClick={() => onOpenChat(selectedAgent)}>
                    <MessageSquare className="w-3.5 h-3.5 mr-1" />
                    Talk
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="rounded-lg border border-gray-700 bg-[#1a1d23] p-2.5">
              <p className="text-[10px] uppercase tracking-wide text-gray-500">Governance Policy</p>
              <p className="text-xs text-gray-300">{governance.description}</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="rounded-lg border border-gray-700 bg-[#1a1d23] p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-gray-500">Status</p>
                <p className="text-sm text-white capitalize">{selectedProfile?.status || 'online'}</p>
              </div>
              <div className="rounded-lg border border-gray-700 bg-[#1a1d23] p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-gray-500">Level</p>
                <p className="text-sm text-white">
                  {selectedProfile?.level || 1}
                  <span className="ml-1 text-[11px] text-gray-400">({selectedProfile?.animationTier || 'base'})</span>
                </p>
              </div>
              <div className="rounded-lg border border-gray-700 bg-[#1a1d23] p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-gray-500">Completed</p>
                <p className="text-sm text-white">{selectedProfile?.stats.tasksCompleted || 0} tasks</p>
              </div>
              <div className="rounded-lg border border-gray-700 bg-[#1a1d23] p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-gray-500">Avg Resonance</p>
                <p className="text-sm text-white">{selectedProfile?.stats.avgResonance ?? '--'}</p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-700 bg-[#1a1d23] p-2.5">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-wide text-gray-500">Level Progress</p>
                <p className="text-[11px] text-gray-400">
                  {selectedProfile?.xp || 0}/{selectedProfile?.xpToNextLevel || 100} XP
                </p>
              </div>
              <div className="h-2 w-full rounded-full bg-[#12151b]">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                  style={{
                    width: `${Math.max(0, Math.min(100, Math.round(((selectedProfile?.xp || 0) / Math.max(1, selectedProfile?.xpToNextLevel || 100)) * 100)))}%`,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-700 bg-[#1a1d23] p-2.5">
                <p className="mb-1 text-[10px] uppercase tracking-wide text-gray-500">Recent Unlocks</p>
                {(selectedProfile?.unlocks || []).slice(0, 3).length === 0 ? (
                  <p className="text-xs text-gray-400">No unlocks yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {(selectedProfile?.unlocks || []).slice(0, 3).map((unlock) => (
                      <div key={unlock.id} className="rounded-md border border-gray-700 bg-[#12151b] px-2 py-1.5">
                        <p className="text-xs text-white">{unlock.name}</p>
                        <p className="text-[11px] text-gray-400">{unlock.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-lg border border-gray-700 bg-[#1a1d23] p-2.5">
                <p className="mb-1 text-[10px] uppercase tracking-wide text-gray-500">Activity Timeline</p>
                {(selectedProfile?.activity || []).slice(0, 4).length === 0 ? (
                  <p className="text-xs text-gray-400">No activity yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {(selectedProfile?.activity || []).slice(0, 4).map((item) => (
                      <div key={item.id} className="rounded-md border border-gray-700 bg-[#12151b] px-2 py-1.5">
                        <p className="text-xs text-white">{item.description}</p>
                        <p className="text-[11px] text-gray-400">{new Date(item.timestamp).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-gray-200 text-xs">Domain</Label>
                <Input
                  value={draft.domain}
                  onChange={(event) => setDraft((prev) => (prev ? { ...prev, domain: event.target.value } : prev))}
                  className="h-9 bg-[#12151b] border-gray-700 text-sm"
                  disabled={!canEditGovernedField(governanceMode, 'domain')}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-200 text-xs">Assignment Default Directive</Label>
                <Input
                  value={draft.assignmentDefaultDirective}
                  onChange={(event) =>
                    setDraft((prev) => (prev ? { ...prev, assignmentDefaultDirective: event.target.value } : prev))
                  }
                  className="h-9 bg-[#12151b] border-gray-700 text-sm"
                  disabled={!canEditGovernedField(governanceMode, 'assignmentDefaultDirective')}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-200 text-xs">Mission</Label>
              <Textarea
                value={draft.mission}
                onChange={(event) => setDraft((prev) => (prev ? { ...prev, mission: event.target.value } : prev))}
                className="min-h-[68px] bg-[#12151b] border-gray-700 text-sm"
                disabled={!canEditGovernedField(governanceMode, 'mission')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-gray-200 text-xs">Focus Areas (one per line)</Label>
                <Textarea
                  value={focusText}
                  onChange={(event) => setFocusText(event.target.value)}
                  className="min-h-[120px] bg-[#12151b] border-gray-700 text-sm"
                  disabled={!canEditGovernedField(governanceMode, 'focus')}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-200 text-xs">Do-Not-Do Guardrails (one per line)</Label>
                <Textarea
                  value={avoidText}
                  onChange={(event) => setAvoidText(event.target.value)}
                  className="min-h-[120px] bg-[#12151b] border-gray-700 text-sm"
                  disabled={!canEditGovernedField(governanceMode, 'doNotDo')}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-200 text-xs">Soul Markdown (`soul.md` style)</Label>
              <Textarea
                value={draft.soulMd || ''}
                onChange={(event) => setDraft((prev) => (prev ? { ...prev, soulMd: event.target.value } : prev))}
                className="min-h-[140px] bg-[#12151b] border-gray-700 text-sm font-mono"
                placeholder={`# ${selectedAgent.name}\n- Mission:\n- Boundaries:\n- Execution style:\n- Escalation rules:`}
                disabled={!canEditGovernedField(governanceMode, 'soulMd')}
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button size="sm" variant="outline" onClick={handleReset}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!canSave || governanceMode === 'system_locked'}>
                <Save className="w-3.5 h-3.5 mr-1" />
                Save Playbook
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  </div>
  );
}

