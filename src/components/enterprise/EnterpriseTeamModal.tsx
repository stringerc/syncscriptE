import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';

interface TeamAgent {
  id: string;
  name: string;
  role?: string;
  team?: string;
  status?: string;
  currentTask?: string;
}

interface TeamAction {
  id: string;
  title: string;
  timestamp?: string;
}

interface EnterpriseTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamName: string;
  agents: TeamAgent[];
  actions: TeamAction[];
  onSelectAgent: (agent: TeamAgent) => void;
  onAddMember: (payload: { prompt: string; name: string; role: string; capabilities: string[] }) => Promise<void>;
  onSaveTeamMemory: (note: string) => Promise<void>;
}

export function EnterpriseTeamModal({
  open,
  onOpenChange,
  teamName,
  agents,
  actions,
  onSelectAgent,
  onAddMember,
  onSaveTeamMemory,
}: EnterpriseTeamModalProps) {
  const suggestions = useMemo(
    () => [
      `Create a ${teamName} agent focused on daily execution handoffs.`,
      `Create a ${teamName} agent specialized in quality checks and reporting.`,
      `Create a ${teamName} agent that coordinates priorities with leadership.`,
    ],
    [teamName]
  );
  const [addPrompt, setAddPrompt] = useState('');
  const [draftName, setDraftName] = useState('');
  const [draftRole, setDraftRole] = useState('');
  const [draftCapabilities, setDraftCapabilities] = useState('');
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [memoryNote, setMemoryNote] = useState('');
  const [busy, setBusy] = useState(false);

  const activeCount = useMemo(
    () => agents.filter((agent) => agent.status === 'active').length,
    [agents]
  );

  const saveMemory = async () => {
    const trimmed = memoryNote.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await onSaveTeamMemory(trimmed);
      setMemoryNote('');
    } finally {
      setBusy(false);
    }
  };

  const createDraft = () => {
    const trimmed = addPrompt.trim();
    if (!trimmed) return;
    const parts = trimmed.split(/[.\n,:-]/).map((part) => part.trim()).filter(Boolean);
    const suggestedName = parts[0] || `${teamName} Agent`;
    const suggestedRole = parts[1] || `${teamName} Specialist`;
    const suggestedCapabilities = parts.slice(2, 6);
    setDraftName(suggestedName);
    setDraftRole(suggestedRole);
    setDraftCapabilities(suggestedCapabilities.join(', '));
    setPendingConfirm(true);
  };

  const confirmAddMember = async () => {
    const trimmed = addPrompt.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await onAddMember({
        prompt: trimmed,
        name: draftName.trim() || `${teamName} Agent`,
        role: draftRole.trim() || `${teamName} Specialist`,
        capabilities: draftCapabilities
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 10),
      });
      setAddPrompt('');
      setDraftName('');
      setDraftRole('');
      setDraftCapabilities('');
      setPendingConfirm(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="max-w-3xl !border-gray-600 !bg-[#0f1117] !opacity-100 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle>{teamName} Team</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-md border border-gray-700 bg-[#1f2430] px-3 py-2">
          <p className="text-sm text-gray-200">{agents.length} agent(s) in this team</p>
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-300">
            {activeCount} active
          </Badge>
        </div>

        <Tabs defaultValue="activity">
          <TabsList className="grid grid-cols-2 bg-[#202430]">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="memory">Memory</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-3">
            <div className="rounded-lg border border-gray-700 bg-[#1f2430] p-3 space-y-2">
              <p className="text-sm text-gray-200">Add Team Member (Draft + Confirm)</p>
              <Textarea
                value={addPrompt}
                onChange={(event) => setAddPrompt(event.target.value)}
                placeholder={`Describe the new ${teamName} agent and responsibilities...`}
                className="min-h-20 border-gray-700 bg-[#12151b]"
              />
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setAddPrompt(suggestion)}
                    className="rounded-full border border-gray-600 bg-[#252830] px-2 py-1 text-[11px] text-gray-300 hover:border-cyan-500/50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              {!pendingConfirm ? (
                <div className="flex justify-end">
                  <Button onClick={createDraft} disabled={busy || !addPrompt.trim()}>
                    Draft Member
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border border-indigo-500/30 bg-indigo-500/10 p-3 space-y-2">
                  <p className="text-xs text-indigo-200">Confirm profile before creation</p>
                  <input
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    className="w-full rounded-md border border-gray-700 bg-[#12151b] px-2 py-1.5 text-sm text-white"
                    placeholder="Agent name"
                  />
                  <input
                    value={draftRole}
                    onChange={(event) => setDraftRole(event.target.value)}
                    className="w-full rounded-md border border-gray-700 bg-[#12151b] px-2 py-1.5 text-sm text-white"
                    placeholder="Agent role"
                  />
                  <input
                    value={draftCapabilities}
                    onChange={(event) => setDraftCapabilities(event.target.value)}
                    className="w-full rounded-md border border-gray-700 bg-[#12151b] px-2 py-1.5 text-sm text-white"
                    placeholder="Capabilities (comma-separated)"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setPendingConfirm(false)}
                      disabled={busy}
                    >
                      Back
                    </Button>
                    <Button onClick={() => void confirmAddMember()} disabled={busy || !draftName.trim()}>
                      Confirm + Add
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
              <div className="rounded-lg border border-gray-700 bg-[#1f2430] p-3 space-y-2">
                <p className="text-sm text-gray-200">Agents</p>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {agents.length === 0 && <p className="text-xs text-gray-500">No agents in this team yet.</p>}
                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => onSelectAgent(agent)}
                      className="w-full rounded-md border border-gray-700 bg-[#252830] px-3 py-2 text-left hover:border-cyan-500/50"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-white">{agent.name}</p>
                        <span className={agent.status === 'active' ? 'text-emerald-300 text-xs' : 'text-gray-400 text-xs'}>
                          {agent.status || 'idle'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{agent.role || 'Enterprise Agent'}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-gray-700 bg-[#1f2430] p-3 space-y-2">
                <p className="text-sm text-gray-200">Recent Team Activity</p>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {actions.length === 0 && <p className="text-xs text-gray-500">No recent activity yet.</p>}
                  {actions.map((action) => (
                    <div key={action.id} className="rounded-md border border-gray-700 bg-[#252830] px-3 py-2">
                      <p className="text-sm text-white">{action.title}</p>
                      <p className="text-xs text-gray-400">{action.timestamp || ''}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="memory" className="space-y-3">
            <div className="rounded-lg border border-gray-700 bg-[#1f2430] p-3 space-y-2">
              <p className="text-sm text-gray-200">Team Memory</p>
              <Textarea
                value={memoryNote}
                onChange={(event) => setMemoryNote(event.target.value)}
                placeholder={`Store a memory note for ${teamName}...`}
                className="min-h-24 border-gray-700 bg-[#12151b]"
              />
              <div className="flex justify-end">
                <Button onClick={() => void saveMemory()} disabled={busy || !memoryNote.trim()}>
                  Save Team Memory
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
