import { useEffect, useState } from 'react';
import { projectId } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9`;

export type PlaidSnapshotPayload = {
  connected?: boolean;
  snapshot?: {
    totalCash?: number;
    monthlyInflow?: number;
    monthlyOutflow?: number;
    netMonthlyCashflow?: number;
    runwayMonths?: number;
  };
  transactions?: { length?: number } | unknown[];
};

/**
 * Live Plaid-backed financial snapshot when the user has connected via /financial routes.
 */
export function usePlaidSnapshot() {
  const [data, setData] = useState<PlaidSnapshotPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const r = await fetch(`${API_BASE}/financial/snapshot`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!r.ok) return;
        const j = (await r.json()) as PlaidSnapshotPayload;
        if (!cancelled) setData(j);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}
