/**
 * Live agent-run stream — large screenshot, action timeline, controls.
 * Subscribes to Realtime via useAgentRunDetail; renders new screenshots
 * within ~1s of capture. "Take control" + interject + cancel surfaced inline.
 */
import { useMemo, useState } from 'react';
import { Loader2, X, MessageSquare, CheckCircle2, AlertTriangle, PauseCircle, Send, Bot, Globe, Pencil, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAgentRunDetail, useAgentRunControls, type AgentRunStatus, type AgentRunStep } from '@/hooks/useAgentRuns';
import { AgentBrowserFrame } from './AgentBrowserFrame';
import { AgentLiveCanvas } from './AgentLiveCanvas';

interface Props {
  runId: string;
  onClose?: () => void;
}

export function AgentRunStream({ runId, onClose }: Props) {
  const detailQ = useAgentRunDetail(runId);
  const controls = useAgentRunControls();
  const [interjectOpen, setInterjectOpen] = useState(false);
  const [interjectText, setInterjectText] = useState('');

  const run = detailQ.data?.run;
  const steps = detailQ.data?.steps ?? [];
  const messages = detailQ.data?.messages ?? [];

  // Latest screenshot
  const latestShot = useMemo(() => {
    for (let i = steps.length - 1; i >= 0; i--) {
      if (steps[i].screenshot_b64) return steps[i];
    }
    return null;
  }, [steps]);

  /** URL for browser chrome — prefer latest browser_action with url, then screenshot steps. */
  const agentPageUrl = useMemo(() => {
    for (let i = steps.length - 1; i >= 0; i--) {
      const s = steps[i];
      if (s.kind === 'browser_action') {
        const u = (s.payload as { action?: { url?: string } })?.action?.url;
        if (typeof u === 'string' && u.trim()) return u.trim();
      }
      if (s.kind === 'screenshot') {
        const u = (s.payload as { url?: string })?.url;
        if (typeof u === 'string' && u.trim()) return u.trim();
      }
    }
    if (latestShot?.kind === 'screenshot') {
      const u = (latestShot.payload as { url?: string })?.url;
      if (typeof u === 'string' && u.trim()) return u.trim();
    }
    return null;
  }, [steps, latestShot]);

  if (!run) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
      </div>
    );
  }

  const isActive = run.status === 'running' || run.status === 'queued' || run.status === 'waiting_user' || run.status === 'paused';
  const needsApproval = steps.some((s, i) => s.kind === 'approval_request' && i === steps.length - 1) || run.status === 'waiting_user';

  return (
    <div className="flex flex-col h-full bg-[#0a0b10]">
      <header className="flex items-center justify-between gap-2 border-b border-gray-800/80 px-3 md:px-4 py-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <StatusBadge status={run.status} />
          <div className="min-w-0">
            <p className="text-sm text-white truncate">{run.goal_text}</p>
            <p className="text-[10px] text-gray-500">
              {run.provider || 'unknown'} · {run.steps_executed} steps · {(run.total_cost_cents / 100).toFixed(2)}¢
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => controls.cancel(run.id).catch(() => {})}
              className="h-7 px-2 text-[11px] text-gray-400 hover:text-rose-400"
            >
              Stop
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-white" onClick={onClose} aria-label="Close stream">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 grid grid-rows-[1fr_auto] md:grid-rows-1 md:grid-cols-[1fr_280px] min-h-0 overflow-hidden">
        {/* Live agent browser — CDP screencast over WebSocket while running,
            falls back to latest captured screenshot when paused/done. */}
        <div className="relative flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-gray-800/60 p-2 md:p-3">
          <AgentBrowserFrame url={agentPageUrl} isLive={run.status === 'running' || run.status === 'waiting_user'}>
            <AgentLiveCanvas
              runId={run.id}
              isActive={run.status === 'running' || run.status === 'waiting_user'}
              fallbackScreenshotB64={latestShot?.screenshot_b64 ?? null}
              fallbackUrlLabel={
                latestShot?.kind === 'screenshot' && typeof (latestShot.payload as { url?: string })?.url === 'string'
                  ? (latestShot.payload as { url?: string }).url
                  : null
              }
              suppressUrlFooter
            />
          </AgentBrowserFrame>
        </div>

        {/* Action log */}
        <div className="flex flex-col min-h-0 bg-[#0c0d12] overflow-hidden">
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5 text-[11px]">
            {steps.map((s) => <StepRow key={s.id} step={s} />)}
            {messages.map((m) => (
              <div key={m.id} className={cn(
                'rounded-md px-2 py-1.5 border',
                m.role === 'user' ? 'border-purple-500/30 bg-purple-500/10 text-purple-200' :
                m.role === 'agent' ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200' :
                'border-gray-700 bg-gray-800/50 text-gray-300',
              )}>
                <div className="text-[9px] uppercase tracking-wide opacity-60 mb-0.5">{m.role === 'agent' ? 'Nexus' : m.role}</div>
                <div className="break-words">{m.content}</div>
              </div>
            ))}
            {steps.length === 0 && <div className="text-gray-600 text-center py-4">Waiting for first action…</div>}
          </div>

          {needsApproval && (
            <div className="border-t border-amber-500/30 bg-amber-500/10 p-2.5">
              <p className="text-[11px] text-amber-200 mb-2">
                Nexus is waiting for your approval: <span className="font-medium">{run.pause_reason}</span>
              </p>
              <div className="flex gap-1.5">
                <Button size="sm" className="flex-1 h-7 bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30 text-[11px]" onClick={() => controls.approve(run.id)}>
                  Approve
                </Button>
                <Button size="sm" variant="ghost" className="flex-1 h-7 text-[11px] text-gray-400 hover:text-rose-300" onClick={() => controls.decline(run.id)}>
                  Decline
                </Button>
              </div>
            </div>
          )}

          {isActive && (
            <div className="border-t border-gray-800/80 p-2">
              {!interjectOpen ? (
                <button
                  type="button"
                  onClick={() => setInterjectOpen(true)}
                  className="w-full flex items-center gap-2 rounded-md border border-gray-700 bg-[#11131a] px-2.5 py-1.5 text-[11px] text-gray-400 hover:text-white hover:border-gray-600"
                >
                  <MessageSquare className="w-3 h-3" />
                  Steer Nexus mid-run…
                </button>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!interjectText.trim()) return;
                    controls.interject(run.id, interjectText.trim()).catch(() => {});
                    setInterjectText('');
                    setInterjectOpen(false);
                  }}
                  className="flex gap-1.5"
                >
                  <input
                    autoFocus
                    value={interjectText}
                    onChange={(e) => setInterjectText(e.target.value)}
                    placeholder='e.g. "also include cats"'
                    className="flex-1 bg-[#11131a] border border-gray-700 rounded-md px-2 py-1.5 text-[11px] text-white placeholder:text-gray-500 focus:border-violet-500/50 focus:outline-none"
                  />
                  <Button type="submit" size="sm" className="h-7 w-7 p-0 bg-gradient-to-br from-violet-600 to-cyan-600 text-white">
                    <Send className="w-3 h-3" />
                  </Button>
                </form>
              )}
            </div>
          )}

          {!isActive && run.summary && (
            <div className="border-t border-gray-800/80 p-2.5">
              <p className="text-[10px] uppercase tracking-wide text-emerald-400 mb-1">Summary</p>
              <p className="text-[11px] text-gray-300">{run.summary}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepRow({ step }: { step: AgentRunStep }) {
  const Icon = iconForKind(step.kind);
  const tone = toneForKind(step.kind);
  const text = stepText(step);
  return (
    <div className={cn('flex items-start gap-1.5 rounded px-1.5 py-1', tone)}>
      <Icon className="w-3 h-3 shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <span className="text-[10px] uppercase tracking-wide opacity-60 mr-1.5">{step.kind.replace(/_/g, ' ')}</span>
        <span className="break-words">{text}</span>
      </div>
    </div>
  );
}

function iconForKind(kind: AgentRunStep['kind']) {
  switch (kind) {
    case 'thought': return Bot;
    case 'browser_action': return Globe;
    case 'tool_call': return Pencil;
    case 'screenshot': return FileText;
    case 'user_interjection': return MessageSquare;
    case 'agent_message': return Bot;
    case 'approval_request': return AlertTriangle;
    case 'error': return AlertTriangle;
    default: return Bot;
  }
}

function toneForKind(kind: AgentRunStep['kind']): string {
  switch (kind) {
    case 'thought': return 'text-gray-400';
    case 'browser_action': return 'text-cyan-300';
    case 'tool_call': return 'text-violet-300';
    case 'screenshot': return 'text-gray-500';
    case 'agent_message': return 'text-cyan-200';
    case 'approval_request': return 'text-amber-300';
    case 'error': return 'text-rose-300';
    default: return 'text-gray-400';
  }
}

function stepText(s: AgentRunStep): string {
  const p = s.payload || {};
  if (s.kind === 'thought') return String((p as { text?: string }).text || '');
  if (s.kind === 'browser_action') {
    const a = (p as { action?: { action?: string; url?: string; text?: string }; result?: { ok?: boolean; error?: string } }).action || {};
    return `${a.action || '?'}${a.url ? ` ${a.url}` : ''}${a.text ? ` "${String(a.text).slice(0, 40)}"` : ''}`;
  }
  if (s.kind === 'tool_call') {
    const tool = (p as { tool?: string }).tool || '?';
    return `${tool} → ${JSON.stringify((p as { result?: unknown }).result || {}).slice(0, 80)}`;
  }
  if (s.kind === 'screenshot') return String((p as { url?: string }).url || '');
  if (s.kind === 'agent_message') return String((p as { text?: string }).text || '');
  if (s.kind === 'approval_request') return String((p as { reason?: string }).reason || 'approval needed');
  if (s.kind === 'error') return String((p as { error?: string; reason?: string }).error || (p as { reason?: string }).reason || 'error');
  return JSON.stringify(p).slice(0, 100);
}

function StatusBadge({ status }: { status: AgentRunStatus }) {
  if (status === 'running') return <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />;
  if (status === 'queued') return <Loader2 className="w-4 h-4 text-gray-500 shrink-0" />;
  if (status === 'waiting_user') return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
  if (status === 'paused') return <PauseCircle className="w-4 h-4 text-amber-300 shrink-0" />;
  if (status === 'done') return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
  if (status === 'failed') return <X className="w-4 h-4 text-rose-400 shrink-0" />;
  return <X className="w-4 h-4 text-gray-500 shrink-0" />;
}
