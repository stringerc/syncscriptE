/**
 * Settings → Agent tab. Three sections:
 *   1. BYOK keys (per provider — encrypted in vault, only last4 shown after save).
 *   2. Automation policy (Tier A/B/C/D, daily caps, paused toggle, allow/deny).
 *   3. Agent run history (recent runs with status, cost, sites visited).
 *
 * No new imports beyond existing ui/* + shared hooks. Submit/save uses
 * /api/agent/byok-* and /api/agent/policy endpoints.
 */
import { useState } from 'react';
import { Bot, KeyRound, Shield, History, Plus, Trash2, Loader2, ExternalLink, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';
import { useAgentRuns, useByokKeys, useAutomationPolicy, type AgentRunStatus } from '@/hooks/useAgentRuns';
import { ConnectedSitesSection } from './ConnectedSitesSection';
import { toast } from 'sonner';

const PROVIDER_OPTIONS = [
  { id: 'openrouter', label: 'OpenRouter (one key, 250+ models — recommended)', help: 'https://openrouter.ai/keys' },
  { id: 'gemini', label: 'Google Gemini (free tier 1500 RPD)', help: 'https://aistudio.google.com/app/apikey' },
  { id: 'openai', label: 'OpenAI (GPT-4o / GPT-5)', help: 'https://platform.openai.com/api-keys' },
  { id: 'anthropic', label: 'Anthropic (Claude Sonnet)', help: 'https://console.anthropic.com/settings/keys' },
  { id: 'groq', label: 'Groq (free tier 14,400 RPD, fast)', help: 'https://console.groq.com/keys' },
  { id: 'xai', label: 'xAI (Grok)', help: 'https://x.ai/api' },
  { id: 'mistral', label: 'Mistral (Pixtral)', help: 'https://console.mistral.ai/api-keys' },
  { id: 'ollama', label: 'Ollama (local)', help: '' },
  { id: 'custom_openai_compat', label: 'Custom OpenAI-compatible endpoint', help: '' },
] as const;

const TIER_DESCRIPTIONS: Record<'A' | 'B' | 'C' | 'D', string> = {
  A: 'Read-only browsing. Search, navigate, summarize. No clicks or typing on external sites.',
  B: 'Read + scoped writes. Adds resource library / draft tasks. Still no destructive web clicks.',
  C: 'Full writes with per-action approval. Each Submit / Pay / Delete asks you to approve.',
  D: 'Full autonomy on whitelisted sites only. Use with care.',
};

export function AgentSettingsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
          <Bot className="w-5 h-5 text-violet-400" />
          Nexus Agent Mode
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Let Nexus drive a real headless browser to do tasks for you. Free by default (NVIDIA NIM).
          Bring your own key for elite-tier quality.
        </p>
      </div>
      <ByokSection />
      <Separator className="bg-gray-800" />
      <PolicySection />
      <Separator className="bg-gray-800" />
      <ConnectedSitesSection />
      <Separator className="bg-gray-800" />
      <HistorySection />
    </div>
  );
}

function ByokSection() {
  const { list, set, del } = useByokKeys();
  const [provider, setProvider] = useState<string>('openrouter');
  const [value, setValue] = useState('');
  const [defaultModel, setDefaultModel] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');

  const submit = async () => {
    if (!value.trim() || value.length < 8) {
      toast.error('Paste a valid API key.');
      return;
    }
    if (provider === 'custom_openai_compat' && !endpointUrl.trim()) {
      toast.error('Custom endpoint URL required for that provider.');
      return;
    }
    try {
      await set.mutateAsync({
        provider,
        value: value.trim(),
        default_model: defaultModel.trim() || undefined,
        endpoint_url: endpointUrl.trim() || undefined,
      });
      setValue('');
      setDefaultModel('');
      setEndpointUrl('');
      toast.success('Key saved (encrypted in vault).');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const helpUrl = PROVIDER_OPTIONS.find((p) => p.id === provider)?.help || '';

  return (
    <Card className="bg-[#1a1d24] border-gray-800 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-cyan-400" />
        <h3 className="font-semibold text-white">Bring your own LLM key</h3>
      </div>
      <p className="text-xs text-gray-500">
        Default uses our shared NVIDIA NIM key (free). Adding your own key gives you better quality + your own quota.
        Keys are encrypted in Supabase Vault — we never log or display the value after you save it.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-400">Provider</Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger className="bg-[#11131a] border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROVIDER_OPTIONS.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {helpUrl && (
            <a href={helpUrl} target="_blank" rel="noreferrer" className="text-[11px] text-cyan-400 hover:underline inline-flex items-center gap-1">
              Get a key <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-400">API key</Label>
          <Input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="sk-..."
            className="bg-[#11131a] border-gray-700 text-white font-mono text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-400">Default model (optional)</Label>
          <Input
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
            placeholder="leave blank for sensible default"
            className="bg-[#11131a] border-gray-700 text-white text-xs"
          />
        </div>
        {(provider === 'ollama' || provider === 'custom_openai_compat') && (
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400">Endpoint URL</Label>
            <Input
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              placeholder={provider === 'ollama' ? 'http://127.0.0.1:11434' : 'https://api.example.com/v1'}
              className="bg-[#11131a] border-gray-700 text-white font-mono text-xs"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={submit} disabled={set.isPending} className="bg-violet-600 hover:bg-violet-500">
          {set.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Plus className="w-3 h-3 mr-1.5" />}
          Save key
        </Button>
      </div>

      {(list.data?.length ?? 0) > 0 && (
        <div className="border-t border-gray-800 pt-4">
          <p className="text-xs text-gray-400 mb-2">Saved keys</p>
          <div className="space-y-1.5">
            {(list.data ?? []).map((k) => (
              <div key={String(k.id)} className="flex items-center justify-between gap-2 rounded-md border border-gray-800 bg-[#11131a] px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline" className="text-[10px] border-violet-500/30 text-violet-200">
                    {String(k.provider)}
                  </Badge>
                  <span className="text-xs text-gray-300 font-mono">…{String(k.last4 || '')}</span>
                  {Boolean(k.default_model) && <span className="text-[11px] text-gray-500 truncate max-w-[14rem]">{String(k.default_model)}</span>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => del.mutateAsync(String(k.provider)).then(() => toast.success('Key removed.'))}
                  className="h-6 w-6 p-0 text-gray-500 hover:text-rose-400"
                  aria-label={`Delete ${String(k.provider)} key`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function PolicySection() {
  const { get, update } = useAutomationPolicy();
  const policy = (get.data || {}) as Record<string, unknown>;
  const tier = (policy.tier as 'A' | 'B' | 'C' | 'D') || 'A';
  const paused = Boolean(policy.agent_paused);

  return (
    <Card className="bg-[#1a1d24] border-gray-800 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-amber-400" />
        <h3 className="font-semibold text-white">Safety + caps</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-400">Trust tier</Label>
          <Select value={tier} onValueChange={(v) => update.mutate({ tier: v })}>
            <SelectTrigger className="bg-[#11131a] border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A">Tier A — read-only (safest, default)</SelectItem>
              <SelectItem value="B">Tier B — read + scoped writes</SelectItem>
              <SelectItem value="C">Tier C — writes with approval</SelectItem>
              <SelectItem value="D">Tier D — full autonomy on trusted sites</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-gray-500">{TIER_DESCRIPTIONS[tier]}</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-400">Pause agent globally</Label>
          <div className="flex items-center gap-3 rounded-md border border-gray-700 bg-[#11131a] px-3 py-2">
            <Switch
              checked={paused}
              onCheckedChange={(v) => update.mutate({ agent_paused: v, paused_reason: v ? 'manual_pause' : null })}
            />
            <span className="text-xs text-gray-300">
              {paused ? 'Paused — no new agent runs accepted.' : 'Active'}
            </span>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-400">Daily run cap</Label>
          <Input
            type="number"
            min={0}
            max={100}
            defaultValue={Number(policy.daily_run_cap ?? 5)}
            onBlur={(e) => update.mutate({ daily_run_cap: Number(e.target.value) || 0 })}
            className="bg-[#11131a] border-gray-700 text-white text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-400">Daily cost cap (cents)</Label>
          <Input
            type="number"
            min={0}
            max={50000}
            defaultValue={Number(policy.daily_cost_cents_cap ?? 50)}
            onBlur={(e) => update.mutate({ daily_cost_cents_cap: Number(e.target.value) || 0 })}
            className="bg-[#11131a] border-gray-700 text-white text-xs"
          />
        </div>
      </div>
    </Card>
  );
}

function HistorySection() {
  const runsQ = useAgentRuns();
  const runs = runsQ.data ?? [];

  return (
    <Card className="bg-[#1a1d24] border-gray-800 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-cyan-400" />
        <h3 className="font-semibold text-white">Agent run history</h3>
      </div>
      {runs.length === 0 ? (
        <p className="text-xs text-gray-500">No agent runs yet. Try saying or typing "navigate to google and find me three blogs about energy-aware scheduling".</p>
      ) : (
        <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
          {runs.map((r) => (
            <div key={r.id} className={cn(
              'flex items-start gap-2 rounded-md border bg-[#11131a] px-3 py-2',
              r.status === 'failed' ? 'border-rose-500/30' :
              r.status === 'done' ? 'border-emerald-500/30' :
              r.status === 'running' ? 'border-cyan-500/30' :
              'border-gray-800',
            )}>
              <StatusDot status={r.status} />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-200 truncate">{r.goal_text}</p>
                <p className="text-[10px] text-gray-500">
                  {new Date(r.created_at).toLocaleString()} · {r.steps_executed} steps · {(r.total_cost_cents / 100).toFixed(2)}¢
                  {r.provider ? ` · ${r.provider}` : ''}
                </p>
                {r.summary && <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{r.summary}</p>}
                {r.error_text && <p className="text-[11px] text-rose-300 mt-1 line-clamp-2">{r.error_text}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function StatusDot({ status }: { status: AgentRunStatus }) {
  if (status === 'done') return <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400 mt-0.5" />;
  if (status === 'failed') return <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400 mt-0.5" />;
  if (status === 'running') return <Loader2 className="w-3.5 h-3.5 shrink-0 text-cyan-400 mt-0.5 animate-spin" />;
  return <span className="w-2 h-2 rounded-full bg-gray-500 mt-1.5 shrink-0" />;
}
