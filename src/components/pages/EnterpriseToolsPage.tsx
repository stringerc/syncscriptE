import { useMemo, useState } from 'react';
import { Building2, Clock3, Cpu, FolderKanban, Users2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { EnterpriseAgentModal } from '../enterprise/EnterpriseAgentModal';
import { EnterpriseMissionCalendar } from '../enterprise/EnterpriseMissionCalendar';
import { EnterpriseOfficeSimulation } from '../enterprise/EnterpriseOfficeSimulation';
import { EnterpriseTeamModal } from '../enterprise/EnterpriseTeamModal';
import { getEnterpriseFeatureFlags } from '../../utils/enterprise-feature-flags';

type EnterpriseTab = 'mission' | 'agents' | 'office' | 'memory';

type EnterpriseAgent = {
  id: string;
  name: string;
  team: string;
  role: string;
  status: 'active' | 'idle';
  currentTask: string;
};

type EnterpriseAction = {
  id: string;
  title: string;
  timestamp: string;
  team?: string;
  agentId?: string;
};

const INITIAL_AGENTS: EnterpriseAgent[] = [
  { id: 'ceo', name: 'Nexus Prime', team: 'Leadership', role: 'Chief Coordination Agent', status: 'active', currentTask: 'Daily mission alignment brief' },
  { id: 'atlas', name: 'Atlas', team: 'Research', role: 'Research Analyst', status: 'active', currentTask: 'Opportunity scan for Q2 priorities' },
  { id: 'pixel', name: 'Pixel', team: 'Creative', role: 'Design Lead', status: 'idle', currentTask: 'Queued for campaign visual pass' },
  { id: 'clawd', name: 'Clawd', team: 'Development', role: 'Implementation Engineer', status: 'active', currentTask: 'Project delivery execution lane' },
  { id: 'sage', name: 'Sage', team: 'Sales', role: 'Pipeline Strategist', status: 'idle', currentTask: 'Waiting for next lead batch' },
];

const INITIAL_ACTIONS: EnterpriseAction[] = [
  { id: 'a1', title: 'Mission reset completed for current sprint', timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString(), team: 'Leadership' },
  { id: 'a2', title: 'Research signal review prepared for handoff', timestamp: new Date(Date.now() - 1000 * 60 * 21).toISOString(), team: 'Research', agentId: 'atlas' },
  { id: 'a3', title: 'Development queue reprioritized by urgency', timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(), team: 'Development', agentId: 'clawd' },
];

function fmtTime(value: string): string {
  return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function EnterpriseToolsPage() {
  const navigate = useNavigate();
  const flags = getEnterpriseFeatureFlags();

  const [activeTab, setActiveTab] = useState<EnterpriseTab>('mission');
  const [agents, setAgents] = useState<EnterpriseAgent[]>(INITIAL_AGENTS);
  const [actions, setActions] = useState<EnterpriseAction[]>(INITIAL_ACTIONS);
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(INITIAL_AGENTS[0]?.id || '');
  const [selectedTeam, setSelectedTeam] = useState<string>('Leadership');

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId) || null,
    [agents, selectedAgentId],
  );

  const teams = useMemo(() => Array.from(new Set(agents.map((agent) => agent.team))), [agents]);

  const schedulerItems = useMemo(
    () =>
      agents.map((agent, index) => ({
        id: `${agent.id}-schedule`,
        title: agent.currentTask,
        agent: agent.name,
        plannedFor: new Date(Date.now() + index * 1000 * 60 * 45).toISOString(),
        status: agent.status,
      })),
    [agents],
  );

  const addAction = (title: string, team?: string, agentId?: string) => {
    const next: EnterpriseAction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      timestamp: new Date().toISOString(),
      team,
      agentId,
    };
    setActions((prev) => [next, ...prev].slice(0, 60));
  };

  const onOpenTeam = (team: string) => {
    setSelectedTeam(team);
    setTeamModalOpen(true);
  };

  const onOpenAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setAgentModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-[#0f1115] px-4 py-8 text-white md:px-8">
      <section className="mx-auto max-w-6xl space-y-5">
        <header className="rounded-2xl border border-white/10 bg-[#171a21] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Enterprise tools</p>
              <h1 className="mt-2 text-2xl font-semibold md:text-3xl">Mission command center</h1>
              <p className="mt-2 text-sm text-slate-300">
                Coordinate teams, monitor agent flow, and keep execution visible in one stable workspace.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-cyan-500/40 text-cyan-200">
                Mission {flags.enterpriseMissionControlEnabled ? 'enabled' : 'disabled'}
              </Badge>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-200">
                Cloud runs {flags.enterpriseCloudRunsEnabled ? 'enabled' : 'disabled'}
              </Badge>
              <Badge variant="outline" className="border-indigo-500/40 text-indigo-200">
                Desktop expansion {flags.enterpriseDesktopExpansionEnabled ? 'enabled' : 'off'}
              </Badge>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { id: 'mission', label: 'Mission', icon: FolderKanban },
              { id: 'agents', label: 'Agents', icon: Users2 },
              { id: 'office', label: 'Office', icon: Building2 },
              { id: 'memory', label: 'Memory', icon: Clock3 },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id as EnterpriseTab)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  activeTab === id
                    ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-100'
                    : 'border-white/20 text-slate-300 hover:border-white/35'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </header>

        {activeTab === 'mission' && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-[#171a21] p-4">
                <p className="text-xs uppercase tracking-wider text-slate-400">Active agents</p>
                <p className="mt-2 text-2xl font-semibold">{agents.filter((agent) => agent.status === 'active').length}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#171a21] p-4">
                <p className="text-xs uppercase tracking-wider text-slate-400">Teams online</p>
                <p className="mt-2 text-2xl font-semibold">{teams.length}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#171a21] p-4">
                <p className="text-xs uppercase tracking-wider text-slate-400">Recent actions</p>
                <p className="mt-2 text-2xl font-semibold">{actions.length}</p>
              </div>
            </div>
            <EnterpriseMissionCalendar items={schedulerItems} />
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <section className="rounded-xl border border-white/10 bg-[#171a21] p-4">
              <p className="text-sm font-semibold text-white">Teams</p>
              <div className="mt-3 space-y-2">
                {teams.map((team) => {
                  const count = agents.filter((agent) => agent.team === team).length;
                  return (
                    <button
                      key={team}
                      type="button"
                      onClick={() => onOpenTeam(team)}
                      className="flex w-full items-center justify-between rounded-lg border border-white/15 bg-[#1d212a] px-3 py-2 text-left hover:border-cyan-500/50"
                    >
                      <span>{team}</span>
                      <Badge variant="outline" className="border-white/25 text-slate-200">{count}</Badge>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-[#171a21] p-4">
              <p className="text-sm font-semibold text-white">Agent roster</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => onOpenAgent(agent.id)}
                    className="rounded-lg border border-white/15 bg-[#1d212a] px-3 py-3 text-left hover:border-cyan-500/50"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{agent.name}</p>
                      <span className={`text-xs ${agent.status === 'active' ? 'text-emerald-300' : 'text-slate-400'}`}>
                        {agent.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{agent.team} - {agent.role}</p>
                    <p className="mt-2 text-xs text-slate-300">{agent.currentTask}</p>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'office' && (
          <EnterpriseOfficeSimulation agents={agents} />
        )}

        {activeTab === 'memory' && (
          <section className="rounded-xl border border-white/10 bg-[#171a21] p-4">
            <p className="text-sm font-semibold text-white">Recent mission memory</p>
            <div className="mt-3 space-y-2">
              {actions.map((action) => (
                <div key={action.id} className="rounded-lg border border-white/15 bg-[#1d212a] px-3 py-2">
                  <p className="text-sm text-white">{action.title}</p>
                  <p className="text-xs text-slate-400">
                    {fmtTime(action.timestamp)} {action.team ? `- ${action.team}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>Back to dashboard</Button>
          <Button variant="outline" onClick={() => navigate('/tasks')}>Open tasks</Button>
          <Button onClick={() => setActiveTab('mission')}>
            <Cpu className="mr-2 h-4 w-4" />
            Re-focus mission board
          </Button>
        </div>
      </section>

      <EnterpriseAgentModal
        open={agentModalOpen}
        onOpenChange={setAgentModalOpen}
        agent={selectedAgent}
        recentActions={actions
          .filter((action) => !selectedAgent || action.agentId === selectedAgent.id || action.team === selectedAgent.team)
          .slice(0, 10)
          .map((action) => ({ id: action.id, title: action.title, timestamp: fmtTime(action.timestamp) }))}
        onSaveMemory={async (note) => {
          if (!selectedAgent) return;
          addAction(`${selectedAgent.name}: ${note}`, selectedAgent.team, selectedAgent.id);
        }}
      />

      <EnterpriseTeamModal
        open={teamModalOpen}
        onOpenChange={setTeamModalOpen}
        teamName={selectedTeam}
        agents={agents.filter((agent) => agent.team === selectedTeam)}
        actions={actions
          .filter((action) => action.team === selectedTeam)
          .slice(0, 20)
          .map((action) => ({ id: action.id, title: action.title, timestamp: fmtTime(action.timestamp) }))}
        onSelectAgent={(agent) => {
          setSelectedAgentId(agent.id);
          setTeamModalOpen(false);
          setAgentModalOpen(true);
        }}
        onAddMember={async ({ name, role }) => {
          const newAgent: EnterpriseAgent = {
            id: `agent-${Date.now()}`,
            name: name.trim() || `${selectedTeam} Agent`,
            team: selectedTeam,
            role: role.trim() || `${selectedTeam} Specialist`,
            status: 'idle',
            currentTask: 'Awaiting assignment',
          };
          setAgents((prev) => [...prev, newAgent]);
          addAction(`Added ${newAgent.name} to ${selectedTeam}`, selectedTeam, newAgent.id);
        }}
        onSaveTeamMemory={async (note) => {
          addAction(`Team note (${selectedTeam}): ${note}`, selectedTeam);
        }}
      />
    </main>
  );
}
