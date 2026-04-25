/**
 * Agent Tasks panel — shows the user's recent agent_runs in the sidebar's
 * "Tasks" tab. Click → expand AgentRunStream view. Compact rows so the sidebar
 * stays usable; status badge + cost meter built in.
 */
import { motion } from 'motion/react';
import {
  CheckCircle2, AlertTriangle, Loader2, Clock, X, PauseCircle,
  Bot, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  useAgentRuns, type AgentRun, type AgentRunStatus,
} from '@/hooks/useAgentRuns';

interface Props {
  selectedRunId: string | null;
  onSelect: (runId: string) => void;
  onNewAgentTask: () => void;
  projectFilter?: string | null;
}

export function AgentTasksPanel({ selectedRunId, onSelect, onNewAgentTask, projectFilter }: Props) {
  const runsQ = useAgentRuns({ projectId: projectFilter });
  const runs = runsQ.data ?? [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800/80">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Agent tasks</span>
        <button
          type="button"
          onClick={onNewAgentTask}
          className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          aria-label="New agent task"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-1.5 py-1.5 space-y-1">
        {runsQ.isLoading && (
          <div className="px-3 py-6 text-center text-xs text-gray-500">Loading…</div>
        )}
        {!runsQ.isLoading && runs.length === 0 && (
          <div className="px-3 py-8 text-center">
            <Bot className="w-5 h-5 mx-auto text-gray-600 mb-2" />
            <p className="text-xs text-gray-500 leading-snug">
              No agent tasks yet. Try:<br />
              <span className="text-cyan-400/80">"navigate to google and find me three blogs about energy-aware scheduling"</span>
            </p>
          </div>
        )}
        {runs.map((r) => (
          <AgentTaskRow key={r.id} run={r} active={selectedRunId === r.id} onSelect={() => onSelect(r.id)} />
        ))}
      </div>
    </div>
  );
}

function AgentTaskRow({ run, active, onSelect }: { run: AgentRun; active: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left rounded-lg px-2.5 py-2 transition-colors group',
        active
          ? 'bg-violet-500/12 border border-violet-500/30 text-violet-100'
          : 'border border-transparent text-gray-300 hover:bg-gray-800/50',
      )}
    >
      <div className="flex items-start gap-2">
        <StatusIcon status={run.status} />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium truncate">{run.goal_text}</div>
          <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
            <span>{labelForStatus(run.status)}</span>
            {run.steps_executed > 0 && <span>· {run.steps_executed} steps</span>}
            {run.total_cost_cents > 0 && <span>· {(run.total_cost_cents / 100).toFixed(2)}¢</span>}
          </div>
        </div>
      </div>
    </button>
  );
}

function StatusIcon({ status }: { status: AgentRunStatus }) {
  if (status === 'queued') return <Clock className="w-3.5 h-3.5 shrink-0 text-gray-500 mt-0.5" />;
  if (status === 'running')
    return (
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}>
        <Loader2 className="w-3.5 h-3.5 shrink-0 text-cyan-400 mt-0.5" />
      </motion.div>
    );
  if (status === 'waiting_user') return <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />;
  if (status === 'paused') return <PauseCircle className="w-3.5 h-3.5 shrink-0 text-amber-300 mt-0.5" />;
  if (status === 'done') return <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400 mt-0.5" />;
  if (status === 'failed') return <X className="w-3.5 h-3.5 shrink-0 text-rose-400 mt-0.5" />;
  if (status === 'cancelled') return <X className="w-3.5 h-3.5 shrink-0 text-gray-500 mt-0.5" />;
  return null;
}

function labelForStatus(s: AgentRunStatus): string {
  switch (s) {
    case 'queued': return 'queued';
    case 'running': return 'running';
    case 'waiting_user': return 'awaiting input';
    case 'paused': return 'paused';
    case 'done': return 'done';
    case 'failed': return 'failed';
    case 'cancelled': return 'cancelled';
  }
}
