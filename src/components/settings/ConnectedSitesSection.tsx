/**
 * Settings → Agent → "Connected sites" — shows hostnames whose cookies the
 * runner has persisted, with per-site Disconnect + a "Clear all" button.
 *
 * Cookies themselves live in Supabase Vault (encrypted) and are never sent
 * to the client; we only display hostnames + counts derived from metadata.
 */
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Globe, Link2Off, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useBrowserContext } from '@/hooks/useBrowserContext';

export function ConnectedSitesSection() {
  const { get, clearAll, disconnectSite } = useBrowserContext();
  const ctx = get.data;
  const hostnames = (ctx?.hostnames || []).filter(Boolean).slice().sort();

  return (
    <Card className="bg-[#1a1d24] border-gray-800 p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <h3 className="font-semibold text-white">Connected sites</h3>
        </div>
        {hostnames.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            disabled={clearAll.isPending}
            onClick={() => {
              if (!window.confirm('Disconnect Nexus from every site? You\'ll need to log in again next time the agent visits any of them.')) return;
              clearAll.mutate(undefined, {
                onSuccess: () => toast.success('All sites disconnected.'),
                onError: (e) => toast.error(e instanceof Error ? e.message : 'Disconnect failed'),
              });
            }}
            className="h-7 text-[11px] text-rose-300 hover:text-rose-200 hover:bg-rose-500/10"
          >
            <Trash2 className="w-3 h-3 mr-1.5" />
            Clear all
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-500">
        When Nexus's headless browser logs in to a site, those cookies are saved encrypted
        in Supabase Vault so the agent stays signed in across runs. Disconnect any time.
      </p>

      {get.isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}

      {!get.isLoading && hostnames.length === 0 && (
        <p className="text-[11px] text-gray-500 italic">
          No sites connected yet. The next agent run that successfully signs in to a site will land here.
        </p>
      )}

      {hostnames.length > 0 && (
        <div className="space-y-1">
          {hostnames.map((h) => (
            <div key={h} className="flex items-center justify-between gap-2 rounded-md border border-gray-800 bg-[#11131a] px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="text-xs text-gray-200 font-mono truncate">{h}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={disconnectSite.isPending}
                onClick={() => {
                  disconnectSite.mutate(h, {
                    onSuccess: () => toast.success(`Disconnected ${h}.`),
                    onError: (e) => toast.error(e instanceof Error ? e.message : 'Disconnect failed'),
                  });
                }}
                className="h-6 px-2 text-[10px] text-gray-400 hover:text-rose-300"
                aria-label={`Disconnect ${h}`}
              >
                <Link2Off className="w-3 h-3 mr-1" />
                Disconnect
              </Button>
            </div>
          ))}
          {ctx && (
            <p className="text-[10px] text-gray-500 mt-1">
              {ctx.cookie_count} cookie{ctx.cookie_count === 1 ? '' : 's'} · {Math.max(1, Math.round(ctx.bytes / 1024))} KB stored ·
              last used {ctx.last_used_at ? new Date(ctx.last_used_at).toLocaleString() : 'never'}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
