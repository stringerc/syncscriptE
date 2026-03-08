import { useEffect, useMemo, useState } from 'react';
import { Bot, SendHorizontal, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { useOpenClaw } from '../../contexts/OpenClawContext';
import { createOpenClawAdapter, createUnavailableAdapter } from '../../orchestration/adapters';
import { NexusOrchestrationService } from '../../orchestration/service';
import { getAssignmentProjectionForUser } from '../../utils/assignment-propagation';
import { useTasks } from '../../hooks/useTasks';

interface EnterpriseChatTabProps {
  userId: string;
  workspaceId: string;
  agents?: Array<{
    id: string;
    name: string;
    role?: string;
    team?: string;
  }>;
  onCreateRunFromMessage?: (message: string) => Promise<void> | void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  agentId: string;
  timestamp: string;
}

const ELITE_ENTERPRISE_AGENTS = [
  { id: 'mission', label: 'Mission Control', role: 'Cross-functional command and orchestration', team: 'Leadership' },
  { id: 'ceo', label: 'CEO', role: 'Strategic direction and portfolio prioritization', team: 'Leadership' },
  { id: 'coo', label: 'COO', role: 'Operational systems, process excellence, and execution cadence', team: 'Operations' },
  { id: 'cfo', label: 'CFO', role: 'Financial planning, runway strategy, and unit economics', team: 'Finance' },
  { id: 'cro', label: 'CRO', role: 'Revenue architecture, pipeline governance, and deal strategy', team: 'Revenue' },
  { id: 'cmo', label: 'CMO', role: 'Demand generation, narrative, and GTM positioning', team: 'Marketing' },
  { id: 'cto', label: 'CTO', role: 'Technology roadmap, architecture quality, and platform risk', team: 'Technology' },
  { id: 'ciso', label: 'CISO', role: 'Security posture, control validation, and incident readiness', team: 'Security' },
  { id: 'chief_counsel', label: 'Chief Counsel', role: 'Contract risk, compliance, and governance controls', team: 'Legal' },
  { id: 'atlas', label: 'Atlas', role: 'Research synthesis, market intelligence, and competitor mapping', team: 'Research' },
  { id: 'clawd', label: 'Clawd', role: 'Engineering execution, delivery planning, and technical unblock', team: 'Development' },
  { id: 'scribe', label: 'Scribe', role: 'Executive communications, messaging, and narrative precision', team: 'Content' },
  { id: 'sage', label: 'Sage', role: 'Sales motion design, objection handling, and close planning', team: 'Sales' },
];

export function EnterpriseChatTab({ userId, workspaceId, agents, onCreateRunFromMessage }: EnterpriseChatTabProps) {
  const { sendMessage, isProcessing } = useOpenClaw();
  const { tasks } = useTasks();
  const agentOptions = useMemo(() => {
    if (Array.isArray(agents) && agents.length > 0) {
      return agents.map((agent) => ({
        id: String(agent.id || '').toLowerCase(),
        label: String(agent.name || agent.id || 'Agent'),
        role: String(agent.role || 'Enterprise specialist'),
        team: String(agent.team || 'Enterprise'),
      }));
    }
    return ELITE_ENTERPRISE_AGENTS;
  }, [agents]);

  const [selectedAgent, setSelectedAgent] = useState<string>(agentOptions[0]?.id || 'mission');
  useEffect(() => {
    if (!agentOptions.some((agent) => agent.id === selectedAgent)) {
      setSelectedAgent(agentOptions[0]?.id || 'mission');
    }
  }, [agentOptions, selectedAgent]);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const selectedAgentProfile = useMemo(
    () => agentOptions.find((agent) => agent.id === selectedAgent) || agentOptions[0] || ELITE_ENTERPRISE_AGENTS[0],
    [agentOptions, selectedAgent],
  );
  const selectedAgentLabel = selectedAgentProfile?.label || 'Mission Control';
  const lastUserPrompt = useMemo(
    () => [...messages].reverse().find((message) => message.role === 'user')?.text || '',
    [messages]
  );
  const assignedTaskSnapshot = useMemo(() => {
    const taskById = new Map<string, any>();
    tasks.forEach((task: any) => {
      const id = String(task?.id || '').trim();
      if (id) taskById.set(id, task);
    });
    const projection = getAssignmentProjectionForUser(userId);
    const uniqueTaskIds = projection.activeTaskIds.map((id) => String(id).trim()).filter(Boolean);
    const items = uniqueTaskIds.slice(0, 5).map((taskId) => {
      const task = taskById.get(taskId);
      return {
        taskId,
        title: String(task?.title || `Task ${taskId}`),
        priority: String(task?.priority || 'medium'),
      };
    });
    return {
      total: uniqueTaskIds.length,
      items,
      convergedWithInbox: projection.convergedWithInbox,
    };
  }, [tasks, userId]);
  const orchestrator = useMemo(
    () =>
      new NexusOrchestrationService(
        [
          createUnavailableAdapter('perplexity'),
          createUnavailableAdapter('openai'),
          createUnavailableAdapter('anthropic'),
          createOpenClawAdapter(sendMessage),
        ],
        createOpenClawAdapter(sendMessage)
      ),
    [sendMessage]
  );

  const send = async () => {
    const text = prompt.trim();
    if (!text) return;
    const userMessage: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text,
      agentId: selectedAgent,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setPrompt('');

    try {
      const response = await orchestrator.execute({
        message: text,
        context: {
          userId,
          currentPage: '/enterprise',
          mode: 'chat',
          workspaceId,
          routedAgentId: selectedAgent,
          routedAgentName: selectedAgentLabel,
        },
      });
      const assistantMessage: ChatMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        text: response.content || 'No response returned.',
        agentId: selectedAgent,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const assistantMessage: ChatMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        text: 'Mission Control could not respond right now. Please try again.',
        agentId: selectedAgent,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-800 bg-[#1e2128] p-4">
        <p className="text-sm text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-300" />
          Agent Chat Router
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Speak to Mission Control globally or route to one specific agent.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {agentOptions.map((agent) => (
            <Button
              key={agent.id}
              size="sm"
              variant={selectedAgent === agent.id ? 'default' : 'outline'}
              onClick={() => setSelectedAgent(agent.id)}
              title={`${agent.team} • ${agent.role}`}
            >
              {agent.label}
            </Button>
          ))}
        </div>
        <div className="mt-2 rounded-md border border-gray-700 bg-[#252830] px-2.5 py-2">
          <p className="text-[11px] text-gray-300">{selectedAgentProfile.team} • {selectedAgentProfile.role}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-[#1e2128] p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-white">Assigned to You Snapshot</p>
          <Badge variant="outline" className="text-[10px] border-teal-500/40 text-teal-300">
            {assignedTaskSnapshot.total} active
          </Badge>
        </div>
        <p className="mt-1 text-[10px] text-gray-500">
          convergence: {assignedTaskSnapshot.convergedWithInbox ? 'ok' : 'replay-needed'}
        </p>
        {assignedTaskSnapshot.items.length === 0 ? (
          <p className="mt-2 text-xs text-gray-400">
            No active propagated assignments right now.
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {assignedTaskSnapshot.items.map((item) => (
              <div key={item.taskId} className="rounded border border-gray-700 bg-[#252830] px-2 py-1.5">
                <p className="text-xs text-gray-100">{item.title}</p>
                <p className="text-[10px] text-gray-400">priority: {item.priority}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-800 bg-[#1e2128] p-4 min-h-[360px] space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-400">
            Start a conversation to coordinate a mission, delegate work, or ask a specific agent for help.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-lg border p-3 ${
                message.role === 'user'
                  ? 'border-cyan-500/30 bg-cyan-500/10'
                  : 'border-gray-700 bg-[#252830]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-400">
                  {message.role === 'user' ? 'You' : 'Mission Response'}
                </p>
                <Badge variant="outline" className="text-[10px] border-gray-600 text-gray-300">
                  {message.agentId}
                </Badge>
              </div>
              <p className="text-sm text-gray-100 whitespace-pre-wrap">{message.text}</p>
            </div>
          ))
        )}
      </div>

      <div className="rounded-xl border border-gray-800 bg-[#1e2128] p-4 space-y-2">
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={`Message ${selectedAgentLabel}...`}
          className="min-h-24 bg-[#252830] border-gray-700"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          {onCreateRunFromMessage ? (
            <Button
              variant="outline"
              onClick={() => void onCreateRunFromMessage(lastUserPrompt || prompt)}
              disabled={isProcessing || (!lastUserPrompt && !prompt.trim())}
            >
              Convert to Run
            </Button>
          ) : <span />}
          <Button onClick={() => void send()} disabled={isProcessing || !prompt.trim()} className="gap-2">
            <SendHorizontal className="w-4 h-4" />
            {isProcessing ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}
