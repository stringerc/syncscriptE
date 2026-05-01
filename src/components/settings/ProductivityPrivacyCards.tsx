import { useCallback, useEffect, useState } from 'react';
import { KeyRound, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import {
  createApiToken,
  fetchSocialPrefs,
  listApiTokens,
  revokeApiToken,
  saveSocialPrefs,
  type ApiTokenMeta,
  type SocialPrefs,
} from '../../utils/edge-productivity-client';

export function SocialHeatmapPrefsCard() {
  const [prefs, setPrefs] = useState<SocialPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const p = await fetchSocialPrefs();
    setPrefs(p);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const persist = async (next: Partial<{ heatmapVisibility: SocialPrefs['heatmapVisibility']; friendFeedOptIn: boolean }>) => {
    if (!prefs) return;
    setSaving(true);
    const out = await saveSocialPrefs({
      heatmapVisibility: next.heatmapVisibility ?? prefs.heatmapVisibility,
      friendFeedOptIn: next.friendFeedOptIn ?? prefs.friendFeedOptIn,
    });
    if (out) {
      setPrefs(out);
      toast.success('Preferences saved');
    } else {
      toast.error('Could not save preferences');
    }
    setSaving(false);
  };

  if (loading || !prefs) {
    return (
      <Card className="bg-[#1e2128] border-gray-800 p-6">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading visibility…
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-[#1e2128] border-gray-800 p-6">
      <h2 className="text-white text-xl mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-teal-400" />
        Activity visibility
      </h2>
      <p className="text-sm text-gray-400 mb-4">
        Defaults stay private. Turn on friend feed only when you want accepted friends to see high-level activity you mark as visible to friends.
      </p>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Label className="text-white">Heatmap visibility (future public profiles)</Label>
            <p className="text-xs text-gray-500">Today your heatmap stays on your profile; this pref is stored for upcoming sharing controls.</p>
          </div>
          <Select
            value={prefs.heatmapVisibility}
            onValueChange={(v) => void persist({ heatmapVisibility: v as SocialPrefs['heatmapVisibility'] })}
            disabled={saving}
          >
            <SelectTrigger className="w-[200px] bg-[#1a1c20] border-gray-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="friends">Friends</SelectItem>
              <SelectItem value="public_summary">Public summary</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label className="text-white">Friend activity feed</Label>
            <p className="text-xs text-gray-500">Let friends see events you log with “friends” or “public summary” visibility.</p>
          </div>
          <Switch
            checked={prefs.friendFeedOptIn}
            onCheckedChange={(checked) => void persist({ friendFeedOptIn: checked, heatmapVisibility: prefs.heatmapVisibility })}
            disabled={saving}
          />
        </div>
      </div>
    </Card>
  );
}

export function CursorPatTokensCard() {
  const [tokens, setTokens] = useState<ApiTokenMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setTokens(await listApiTokens());
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onCreate = async () => {
    setCreating(true);
    const out = await createApiToken();
    setCreating(false);
    if (out?.token) {
      try {
        await navigator.clipboard.writeText(out.token);
        toast.success('Token created and copied', { description: 'Store it in Cursor MCP env — it is shown only once.' });
      } catch {
        toast.success('Token created', { description: out.token.slice(0, 24) + '…' });
      }
      void refresh();
    } else {
      toast.error('Could not create token', { description: 'Apply DB migration and stay signed in with Supabase JWT.' });
    }
  };

  const onRevoke = async (id: string) => {
    const ok = await revokeApiToken(id);
    if (ok) {
      toast.success('Token revoked');
      void refresh();
    } else {
      toast.error('Revoke failed');
    }
  };

  return (
    <Card className="bg-[#1e2128] border-gray-800 p-6">
      <h2 className="text-white text-xl mb-2 flex items-center gap-2">
        <KeyRound className="w-5 h-5 text-cyan-400" />
        Cursor / MCP access tokens
      </h2>
      <p className="text-sm text-gray-400 mb-4">
        Scoped tokens for the SyncScript Edge productivity API. Use with{' '}
        <code className="text-xs text-cyan-300">integrations/cursor-syncscript-mcp</code> — see README.
      </p>
      <Button
        type="button"
        className="mb-4"
        onClick={() => void onCreate()}
        disabled={creating || loading}
        data-testid="cursor-pat-create-token"
      >
        {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Create token
      </Button>
      {loading ? (
        <p className="text-xs text-gray-500">Loading…</p>
      ) : tokens.length === 0 ? (
        <p className="text-xs text-gray-500">No tokens yet.</p>
      ) : (
        <ul className="space-y-2 text-xs text-gray-300">
          {tokens.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-gray-700 p-2">
              <span>
                <span className="text-white">{t.label}</span>
                <span className="ml-2 text-gray-500">{t.scopes?.join(', ')}</span>
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-red-300 border-red-900/50"
                onClick={() => void onRevoke(t.id)}
                data-testid={`cursor-pat-revoke-${t.id}`}
              >
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
