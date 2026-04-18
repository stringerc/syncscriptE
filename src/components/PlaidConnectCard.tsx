import { useCallback, useState } from 'react';
import { Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { projectId } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9`;

declare global {
  interface Window {
    Plaid?: {
      create: (opts: {
        token: string;
        onSuccess: (publicToken: string) => void;
        onExit?: () => void;
      }) => { open: () => void };
    };
  }
}

function loadPlaidScript(): Promise<void> {
  if (window.Plaid) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Plaid script failed'));
    document.body.appendChild(s);
  });
}

export function PlaidConnectCard() {
  const [busy, setBusy] = useState(false);

  const connect = useCallback(async () => {
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Sign in required');
        return;
      }
      await loadPlaidScript();
      const lt = await fetch(`${API_BASE}/financial/connect/create-link-token`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider: 'plaid' }),
      });
      if (!lt.ok) {
        const err = await lt.json().catch(() => ({}));
        toast.error((err as { error?: string }).error || 'Plaid not available');
        return;
      }
      const { linkToken } = await lt.json() as { linkToken?: string };
      if (!linkToken || !window.Plaid) {
        toast.error('Could not start bank link');
        return;
      }
      const handler = window.Plaid.create({
        token: linkToken,
        onSuccess: async (publicToken) => {
          const ex = await fetch(`${API_BASE}/financial/connect/exchange-public-token`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ provider: 'plaid', publicToken }),
          });
          if (!ex.ok) {
            const err = await ex.json().catch(() => ({}));
            toast.error((err as { error?: string }).error || 'Exchange failed');
            return;
          }
          toast.success('Bank connected — run sync from Financial tools when ready.');
        },
      });
      handler.open();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Plaid error');
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-white text-sm font-medium">
        <Wallet className="w-4 h-4 text-cyan-300" />
        Bank connection (Plaid)
      </div>
      <p className="text-xs text-gray-400">
        Connect accounts for live cashflow and categorization. Requires Plaid credentials on the server.
      </p>
      <button
        type="button"
        onClick={() => void connect()}
        disabled={busy}
        className="mt-1 text-sm px-3 py-2 rounded-lg bg-cyan-600/20 text-cyan-200 border border-cyan-500/30 hover:bg-cyan-600/30 disabled:opacity-50"
      >
        {busy ? 'Opening…' : 'Connect bank'}
      </button>
    </div>
  );
}
