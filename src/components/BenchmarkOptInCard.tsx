import { useCallback, useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { toast } from 'sonner';
import { projectId } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9`;

export function BenchmarkOptInCard() {
  const [optIn, setOptIn] = useState(false);
  const [avg, setAvg] = useState<number | null>(null);
  const [n, setN] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const s = await fetch(`${API_BASE}/invoice-settings`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (s.ok) {
            const j = await s.json();
            setOptIn(Boolean(j.benchmark_opt_in));
          }
        }
        const b = await fetch(`${API_BASE}/benchmarks/summary`);
        if (b.ok) {
          const j = await b.json();
          setAvg(typeof j.avg_invoice === 'number' ? j.avg_invoice : null);
          setN(typeof j.sample_size === 'number' ? j.sample_size : 0);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Sign in required');
        return;
      }
      const next = !optIn;
      const res = await fetch(`${API_BASE}/invoice-settings`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ benchmark_opt_in: next }),
      });
      if (!res.ok) throw new Error('Update failed');
      setOptIn(next);
      toast.success(next ? 'Thanks — your anonymized invoice totals help benchmarks.' : 'Opted out of benchmarks.');
    } catch {
      toast.error('Could not update preference');
    }
  }, [optIn]);

  return (
    <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-white text-sm font-medium">
        <Users className="w-4 h-4 text-purple-300" />
        Market benchmarks
      </div>
      <p className="text-xs text-gray-400">
        Opt in to include anonymized invoice amounts in aggregate stats (no client names or emails).
      </p>
      {!loading && avg != null && n > 0 && (
        <p className="text-xs text-gray-300">
          Community avg invoice (opt-in sample): <span className="text-white font-medium">${avg.toFixed(0)}</span> ({n} invoices)
        </p>
      )}
      <button
        type="button"
        onClick={() => void toggle()}
        className={`mt-1 text-sm px-3 py-2 rounded-lg border ${
          optIn ? 'bg-emerald-600/20 text-emerald-200 border-emerald-500/30' : 'bg-gray-800 text-gray-300 border-gray-700'
        }`}
      >
        {optIn ? 'Included in benchmarks' : 'Opt in to benchmarks'}
      </button>
    </div>
  );
}
