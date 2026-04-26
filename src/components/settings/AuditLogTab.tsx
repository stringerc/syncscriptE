/**
 * Settings → Activity → "What Nexus did for me this week"
 *
 * Renders the existing audit data so users can see + trust autonomous
 * actions. Two sources, unified into one feed:
 *   - public.nexus_tool_audit       (every Nexus tool call: voice/text/phone)
 *   - public.playbook_audit_events  (autonomous concierge playbook steps)
 *
 * Both have RLS scoping to the caller's own rows. We pull the last 7 days,
 * sort by created_at DESC, and let the user filter by surface (voice / text /
 * phone / playbook) and outcome (succeeded / failed).
 */
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, AlertCircle, Mic, MessageSquare, Phone, Workflow, Clock } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { useAuth } from '../../contexts/AuthContext';

type Surface = 'voice' | 'text' | 'phone' | 'playbook';

interface FeedItem {
  id: string;
  created_at: string;
  surface: Surface;
  ok: boolean;
  tool_name: string;
  detail: Record<string, unknown> | null;
}

const SINCE_DAYS = 7;

export function AuditLogTab() {
  const { user } = useAuth();
  const userId = user?.id || null;
  const [filterSurface, setFilterSurface] = useState<Surface | 'all'>('all');
  const [filterOk, setFilterOk] = useState<'all' | 'ok' | 'failed'>('all');

  const sinceISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - SINCE_DAYS);
    return d.toISOString();
  }, []);

  const feed = useQuery({
    queryKey: ['audit-log', userId, sinceISO],
    enabled: Boolean(userId),
    refetchInterval: 30_000,
    queryFn: async (): Promise<FeedItem[]> => {
      // Two queries in parallel — RLS scopes both to the caller.
      const [tools, plays] = await Promise.all([
        supabase
          .from('nexus_tool_audit')
          .select('id, created_at, surface, ok, tool_name, detail')
          .gte('created_at', sinceISO)
          .order('created_at', { ascending: false })
          .limit(150),
        supabase
          .from('playbook_audit_events')
          .select('id, created_at, actor, action, entity, entity_id, metadata')
          .gte('created_at', sinceISO)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);
      const items: FeedItem[] = [];
      for (const r of tools.data || []) {
        items.push({
          id: String(r.id),
          created_at: String(r.created_at),
          surface: (r.surface as Surface) || 'text',
          ok: Boolean(r.ok),
          tool_name: String(r.tool_name),
          detail: (r.detail as Record<string, unknown>) || null,
        });
      }
      for (const r of plays.data || []) {
        const meta = (r.metadata as Record<string, unknown>) || null;
        const ok = !/failed|error/i.test(String(r.action || ''));
        items.push({
          id: String(r.id),
          created_at: String(r.created_at),
          surface: 'playbook',
          ok,
          tool_name: `playbook.${r.action}`,
          detail: meta ? { ...meta, entity: r.entity, entity_id: r.entity_id } : null,
        });
      }
      items.sort((a, b) => b.created_at.localeCompare(a.created_at));
      return items.slice(0, 200);
    },
  });

  const filtered = useMemo(() => {
    let arr = feed.data || [];
    if (filterSurface !== 'all') arr = arr.filter((i) => i.surface === filterSurface);
    if (filterOk === 'ok') arr = arr.filter((i) => i.ok);
    if (filterOk === 'failed') arr = arr.filter((i) => !i.ok);
    return arr;
  }, [feed.data, filterSurface, filterOk]);

  const counts = useMemo(() => {
    const arr = feed.data || [];
    return {
      total: arr.length,
      ok: arr.filter((i) => i.ok).length,
      failed: arr.filter((i) => !i.ok).length,
      voice: arr.filter((i) => i.surface === 'voice').length,
      text: arr.filter((i) => i.surface === 'text').length,
      phone: arr.filter((i) => i.surface === 'phone').length,
      playbook: arr.filter((i) => i.surface === 'playbook').length,
    };
  }, [feed.data]);

  return (
    <div className="space-y-4">
      <header>
        <h3 className="text-lg font-medium text-white">What Nexus did this week</h3>
        <p className="text-xs text-gray-400 mt-1">
          Every autonomous tool call from voice, chat, phone, and concierge playbooks. Trust through visibility — this is the antidote to "the AI did something I didn't see."
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <SummaryCard label="Total actions" value={counts.total} />
        <SummaryCard label="Succeeded" value={counts.ok} tone="emerald" />
        <SummaryCard label="Failed" value={counts.failed} tone={counts.failed ? 'rose' : 'gray'} />
        <SummaryCard label="Last 7 days" value={SINCE_DAYS} suffix="d" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterPill label="All" active={filterSurface === 'all'} onClick={() => setFilterSurface('all')} />
        <FilterPill label={`Voice (${counts.voice})`} active={filterSurface === 'voice'} onClick={() => setFilterSurface('voice')} icon={Mic} />
        <FilterPill label={`Chat (${counts.text})`} active={filterSurface === 'text'} onClick={() => setFilterSurface('text')} icon={MessageSquare} />
        <FilterPill label={`Phone (${counts.phone})`} active={filterSurface === 'phone'} onClick={() => setFilterSurface('phone')} icon={Phone} />
        <FilterPill label={`Playbook (${counts.playbook})`} active={filterSurface === 'playbook'} onClick={() => setFilterSurface('playbook')} icon={Workflow} />
        <span className="mx-2 h-4 w-px bg-gray-700" />
        <FilterPill label="All outcomes" active={filterOk === 'all'} onClick={() => setFilterOk('all')} />
        <FilterPill label="Succeeded" active={filterOk === 'ok'} onClick={() => setFilterOk('ok')} tone="emerald" />
        <FilterPill label="Failed" active={filterOk === 'failed'} onClick={() => setFilterOk('failed')} tone="rose" />
      </div>

      {feed.isLoading ? (
        <div className="text-xs text-gray-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-800 bg-[#0d0e13] p-6 text-center">
          <Clock className="w-7 h-7 text-gray-600 mx-auto" />
          <p className="text-sm text-gray-400 mt-2">No autonomous actions in this window.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((item) => <AuditRow key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, suffix, tone }: { label: string; value: number; suffix?: string; tone?: 'emerald' | 'rose' | 'gray' }) {
  const color =
    tone === 'emerald' ? 'text-emerald-400' :
    tone === 'rose' ? 'text-rose-400' :
    'text-cyan-300';
  return (
    <div className="rounded-md border border-gray-800 bg-[#0d0e13] p-3">
      <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`text-2xl font-medium mt-0.5 ${color}`}>{value}{suffix && <span className="text-sm text-gray-500 ml-1">{suffix}</span>}</div>
    </div>
  );
}

function FilterPill({ label, active, onClick, tone, icon: Icon }: {
  label: string;
  active: boolean;
  onClick: () => void;
  tone?: 'emerald' | 'rose';
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const activeStyle =
    tone === 'emerald' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-100' :
    tone === 'rose' ? 'bg-rose-500/15 border-rose-500/40 text-rose-100' :
    'bg-cyan-500/15 border-cyan-500/40 text-cyan-100';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
        active ? activeStyle : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
      }`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </button>
  );
}

function AuditRow({ item }: { item: FeedItem }) {
  const Icon =
    item.surface === 'voice' ? Mic :
    item.surface === 'phone' ? Phone :
    item.surface === 'playbook' ? Workflow :
    MessageSquare;
  const StatusIcon = item.ok ? CheckCircle2 : AlertCircle;
  const tone = item.ok ? 'text-emerald-400' : 'text-rose-400';
  const summary = formatSummary(item);

  return (
    <div className="flex items-start gap-2.5 rounded-md border border-gray-800/60 bg-[#0d0e13] px-3 py-2 hover:border-gray-700 transition-colors">
      <Icon className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[11px] text-gray-300">
          <code className="text-cyan-300">{item.tool_name}</code>
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">{item.surface}</span>
          <span className="ml-auto text-[10px] text-gray-500">{relativeTime(item.created_at)}</span>
        </div>
        {summary && <div className="text-[11px] text-gray-400 mt-0.5 truncate">{summary}</div>}
      </div>
      <StatusIcon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${tone}`} />
    </div>
  );
}

function formatSummary(item: FeedItem): string {
  if (!item.detail) return '';
  const d = item.detail;
  // Common shapes from nexus tool audit
  if (typeof d.title === 'string') return d.title;
  if (typeof d.task_title === 'string') return d.task_title;
  if (typeof d.summary === 'string') return d.summary;
  if (typeof d.message === 'string') return d.message;
  if (typeof d.entity === 'string' && typeof d.entity_id === 'string') return `${d.entity}: ${d.entity_id}`;
  return JSON.stringify(d).slice(0, 120);
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h ago`;
  return `${Math.round(ms / 86_400_000)}d ago`;
}
