/**
 * Settings → Integrations → Webhooks
 *
 * Exposes the per-user webhook subscription system that was already wired to
 * the event_outbox + webhook_dispatcher pipeline. Lets users:
 *   - Add a destination URL with optional event-type filter
 *   - See secret EXACTLY ONCE on create / rotate (Stripe / GitHub pattern)
 *   - View recent deliveries with status + replay button
 *   - Rotate secret if compromised
 *   - Delete the subscription
 *
 * The dispatcher (supabase/functions/.../webhook-dispatcher.tsx) signs every
 * outgoing POST with HMAC-SHA256 of the body using this secret.
 */
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, RefreshCw, Trash2, Webhook, AlertCircle, CheckCircle2, Clock, RotateCw, Copy, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface Subscription {
  id: string;
  label: string | null;
  url: string;
  event_types: string[];
  active: boolean;
  consecutive_failures: number;
  disabled_reason: string | null;
  created_at: string;
  last_delivery_at: string | null;
  secret: string; // already masked from server
}

interface Delivery {
  id: string;
  subscription_id: string;
  event_id: string;
  status: 'pending' | 'delivered' | 'failed' | 'dlq';
  attempt: number;
  response_status: number | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  next_attempt_at: string | null;
}

function authedFetch(token: string | null, url: string, init?: RequestInit) {
  return fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
}

export function WebhooksTab() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);

  const subs = useQuery({
    queryKey: ['webhooks-list'],
    enabled: Boolean(accessToken),
    refetchInterval: 30_000,
    queryFn: async () => {
      const res = await authedFetch(accessToken, '/api/agent/webhooks-list');
      if (!res.ok) throw new Error('list failed');
      return ((await res.json()) as { subscriptions: Subscription[] }).subscriptions;
    },
  });

  const eventTypesQ = useQuery({
    queryKey: ['webhooks-event-types'],
    enabled: Boolean(accessToken),
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const res = await authedFetch(accessToken, '/api/agent/webhooks-event-types');
      if (!res.ok) throw new Error('event-types failed');
      return ((await res.json()) as { event_types: string[] }).event_types;
    },
  });

  const deliveries = useQuery({
    queryKey: ['webhooks-deliveries', selectedSubId],
    enabled: Boolean(accessToken && selectedSubId),
    refetchInterval: 6_000,
    queryFn: async () => {
      const url = selectedSubId
        ? `/api/agent/webhooks-deliveries?subscription_id=${encodeURIComponent(selectedSubId)}&limit=25`
        : '/api/agent/webhooks-deliveries?limit=25';
      const res = await authedFetch(accessToken, url);
      if (!res.ok) throw new Error('deliveries failed');
      return ((await res.json()) as { deliveries: Delivery[] }).deliveries;
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await authedFetch(accessToken, '/api/agent/webhooks-delete', {
        method: 'POST',
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('delete failed');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['webhooks-list'] });
      toast.success('Webhook deleted');
    },
    onError: () => toast.error('Could not delete'),
  });

  const replayMut = useMutation({
    mutationFn: async (delivery_id: string) => {
      const res = await authedFetch(accessToken, '/api/agent/webhooks-replay', {
        method: 'POST',
        body: JSON.stringify({ delivery_id }),
      });
      if (!res.ok) throw new Error('replay failed');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['webhooks-deliveries'] });
      toast.success('Scheduled — will dispatch on next tick (≤60s)');
    },
    onError: () => toast.error('Replay failed'),
  });

  const subscriptions = subs.data || [];
  const N8N_RECIPES = [
    { id: 'launch-ops', label: 'Launch Ops (Slack + GitHub)' },
    { id: 'sales-followup', label: 'Sales Follow-Up (HubSpot + Gmail)' },
    { id: 'finance-control', label: 'Finance Control (Slack + QuickBooks)' },
    { id: 'support-escalation', label: 'Support Escalation (Zendesk + Slack)' },
    { id: 'agent-automation', label: 'Agent Automation (Google Sheets audit)' },
  ];

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <Webhook className="w-4 h-4 text-cyan-400" />
            Webhooks
          </h3>
          <p className="text-xs text-gray-400 max-w-xl mt-1">
            Send a signed POST to any URL when SyncScript events happen — task created, invoice paid, document updated. Each request is signed with{' '}
            <code className="text-xs text-cyan-300 bg-gray-900/60 px-1 rounded">X-SyncScript-Signature</code> (HMAC-SHA256 over the body). Use it to wire n8n, Make, Zapier, or your own server.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreate(true)}
          className="shrink-0 bg-cyan-500/20 border border-cyan-400/40 text-cyan-100 hover:bg-cyan-500/30"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add webhook
        </Button>
      </header>

      {showCreate && (
        <CreateForm
          eventTypes={eventTypesQ.data || []}
          accessToken={accessToken}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            qc.invalidateQueries({ queryKey: ['webhooks-list'] });
          }}
        />
      )}

      {subs.isLoading ? (
        <div className="flex items-center gap-2 text-xs text-gray-500"><Loader2 className="w-3 h-3 animate-spin" /> Loading…</div>
      ) : subscriptions.length === 0 ? (
        <div className="rounded-lg border border-gray-800 bg-[#0d0e13] p-6 text-center">
          <Webhook className="w-7 h-7 text-gray-600 mx-auto" />
          <p className="text-sm text-gray-400 mt-2">No webhooks yet. Add one above to get started.</p>
        </div>
      ) : null}

      <div className="rounded-lg border border-gray-800 bg-[#0d0e13] p-3">
        <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">
          Pre-built n8n recipes — download the JSON and import into n8n (Workflows → Import from File)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
          {N8N_RECIPES.map((r) => (
            <a
              key={r.id}
              href={`/integrations/recipes/syncscript-${r.id}.n8n.json`}
              download
              className="flex items-center gap-2 rounded-md border border-gray-800 bg-black/30 px-2.5 py-1.5 text-[11px] text-gray-300 hover:bg-cyan-500/10 hover:border-cyan-500/40 hover:text-cyan-200 transition-colors"
            >
              <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
              {r.label}
            </a>
          ))}
        </div>
      </div>

      {subscriptions.length > 0 && (
        <div className="space-y-2">
          {subscriptions.map((s) => (
            <SubscriptionRow
              key={s.id}
              sub={s}
              isExpanded={selectedSubId === s.id}
              deliveries={selectedSubId === s.id ? deliveries.data || [] : []}
              onToggle={() => setSelectedSubId(selectedSubId === s.id ? null : s.id)}
              onDelete={() => {
                if (confirm(`Delete webhook for ${s.url}?`)) deleteMut.mutate(s.id);
              }}
              onRotate={async () => {
                if (!confirm('Rotate secret? Old signatures stop verifying immediately.')) return;
                const res = await authedFetch(accessToken, '/api/agent/webhooks-rotate', {
                  method: 'POST',
                  body: JSON.stringify({ id: s.id }),
                });
                if (res.ok) {
                  const { secret_displayed_once } = (await res.json()) as { secret_displayed_once: string };
                  showSecretOnce(secret_displayed_once);
                  qc.invalidateQueries({ queryKey: ['webhooks-list'] });
                } else {
                  toast.error('Rotate failed');
                }
              }}
              onReplay={(deliveryId) => replayMut.mutate(deliveryId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function showSecretOnce(secret: string) {
  // Tiny modal-ish toast that gives the user time to copy.
  const tid = toast.message('Secret created — copy it now', {
    duration: 60_000,
    description: secret,
    action: {
      label: 'Copy',
      onClick: () => {
        navigator.clipboard.writeText(secret).then(() => toast.success('Copied'));
        toast.dismiss(tid);
      },
    },
  });
}

function CreateForm({
  eventTypes,
  accessToken,
  onClose,
  onCreated,
}: {
  eventTypes: string[];
  accessToken: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [allEvents, setAllEvents] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const t of eventTypes) {
      const prefix = t.split('.')[0];
      out[prefix] = out[prefix] || [];
      out[prefix].push(t);
    }
    return out;
  }, [eventTypes]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^https?:\/\/.+/.test(url)) {
      setError('URL must start with http(s)://');
      return;
    }
    setBusy(true);
    try {
      const res = await authedFetch(accessToken, '/api/agent/webhooks-create', {
        method: 'POST',
        body: JSON.stringify({
          url,
          label: label || null,
          event_types: allEvents ? [] : Array.from(selected),
        }),
      });
      const body = (await res.json()) as { subscription?: { secret_displayed_once?: string }; error?: string };
      if (!res.ok) {
        setError(body.error || `HTTP ${res.status}`);
        return;
      }
      const secret = body.subscription?.secret_displayed_once;
      if (secret) showSecretOnce(secret);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-cyan-500/30 bg-[#0c0f15] p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-3">
        <div>
          <label className="text-[11px] uppercase tracking-wide text-gray-400">Destination URL</label>
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-n8n.example/webhook/syncscript"
            className="mt-1 w-full bg-black/40 border border-gray-700 rounded-md px-2.5 py-2 text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/60 outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-wide text-gray-400">Label (optional)</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. n8n-prod"
            maxLength={80}
            className="mt-1 w-full bg-black/40 border border-gray-700 rounded-md px-2.5 py-2 text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/60 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-xs text-gray-300">
          <input type="checkbox" checked={allEvents} onChange={(e) => setAllEvents(e.target.checked)} />
          Subscribe to all event types
        </label>
        {!allEvents && (
          <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 max-h-44 overflow-y-auto bg-black/30 border border-gray-800 rounded-md p-2">
            {Object.entries(grouped).map(([prefix, types]) => (
              <div key={prefix} className="space-y-0.5">
                <div className="text-[10px] uppercase tracking-wider text-cyan-400/80 mt-1">{prefix}</div>
                {types.map((t) => (
                  <label key={t} className="flex items-center gap-1.5 text-[11px] text-gray-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={selected.has(t)}
                      onChange={(e) => {
                        const next = new Set(selected);
                        if (e.target.checked) next.add(t); else next.delete(t);
                        setSelected(next);
                      }}
                    />
                    <code className="text-[11px]">{t}</code>
                  </label>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="text-xs text-rose-400 flex items-center gap-1.5">
          <AlertCircle className="w-3 h-3" /> {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={busy} size="sm" className="bg-cyan-500/20 border border-cyan-400/40 text-cyan-100 hover:bg-cyan-500/30">
          {busy ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Creating…</> : 'Create webhook'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
}

function SubscriptionRow({
  sub,
  isExpanded,
  deliveries,
  onToggle,
  onDelete,
  onRotate,
  onReplay,
}: {
  sub: Subscription;
  isExpanded: boolean;
  deliveries: Delivery[];
  onToggle: () => void;
  onDelete: () => void;
  onRotate: () => void;
  onReplay: (deliveryId: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const allEvents = !sub.event_types?.length;
  const dotColor = sub.active && sub.consecutive_failures < 3 ? 'bg-emerald-400' : sub.disabled_reason ? 'bg-rose-400' : 'bg-amber-400';

  return (
    <div className="rounded-lg border border-gray-800 bg-[#0d0e13]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-900/40 transition-colors"
      >
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <div className="min-w-0 flex-1">
          <div className="text-sm text-white truncate">{sub.label || sub.url}</div>
          <div className="text-[10px] text-gray-500 truncate">
            {sub.url} · {allEvents ? 'all events' : `${sub.event_types.length} event types`} · {sub.consecutive_failures} consecutive failures
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(sub.url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1200); }); }}
            className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-gray-800 text-gray-400"
            aria-label="Copy URL"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </span>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onRotate(); }}
            className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-gray-800 text-gray-400"
            aria-label="Rotate secret"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </span>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-rose-500/20 text-gray-400 hover:text-rose-300"
            aria-label="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </span>
        </div>
      </button>
      {isExpanded && (
        <div className="border-t border-gray-800 p-3 space-y-2">
          <div className="text-[10px] uppercase tracking-wide text-gray-500">Recent deliveries</div>
          {deliveries.length === 0 ? (
            <div className="text-xs text-gray-500">No deliveries yet — fire a SyncScript event to start.</div>
          ) : (
            deliveries.map((d) => <DeliveryRow key={d.id} d={d} onReplay={() => onReplay(d.id)} />)
          )}
        </div>
      )}
    </div>
  );
}

function DeliveryRow({ d, onReplay }: { d: Delivery; onReplay: () => void }) {
  const Icon = d.status === 'delivered' ? CheckCircle2 : d.status === 'pending' ? Clock : AlertCircle;
  const tone =
    d.status === 'delivered' ? 'text-emerald-400' :
    d.status === 'dlq' ? 'text-rose-400' :
    d.status === 'failed' ? 'text-amber-400' :
    'text-gray-400';
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-gray-800/40 last:border-b-0">
      <Icon className={`w-3 h-3 mt-0.5 shrink-0 ${tone}`} />
      <div className="min-w-0 flex-1 text-[11px]">
        <div className="flex items-center gap-2">
          <span className={`uppercase tracking-wide ${tone}`}>{d.status}</span>
          <span className="text-gray-500">attempt {d.attempt}</span>
          {d.response_status != null && <span className="text-gray-500">HTTP {d.response_status}</span>}
          <span className="text-gray-600 ml-auto">{new Date(d.updated_at).toLocaleString()}</span>
        </div>
        {d.last_error && <div className="text-rose-400 mt-0.5 truncate">{d.last_error}</div>}
      </div>
      {(d.status === 'failed' || d.status === 'dlq') && (
        <Button size="sm" variant="ghost" onClick={onReplay} className="h-6 px-2 text-[10px] text-cyan-300 hover:bg-cyan-500/10">
          <RefreshCw className="w-3 h-3 mr-1" /> Replay
        </Button>
      )}
    </div>
  );
}
