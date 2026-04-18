import { useState, useEffect, useCallback } from 'react';
import { projectId } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9`;

export type RecurringInvoiceSchedule = {
  id: string;
  enabled: boolean;
  cadence: 'weekly' | 'monthly' | 'quarterly';
  next_run_at: string;
  template: {
    to_email: string;
    to_name?: string;
    items: { description: string; quantity: number; unit_price: number }[];
    tax_percent?: number;
    notes?: string;
    due_days_offset?: number;
  };
  last_run_at?: string;
};

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || '';
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export function useRecurringInvoices() {
  const [schedules, setSchedules] = useState<RecurringInvoiceSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const h = await authHeaders();
      const res = await fetch(`${API_BASE}/recurring-invoices`, { headers: h });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setSchedules(Array.isArray(data) ? data : []);
    } catch {
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSchedules();
  }, [fetchSchedules]);

  const save = useCallback(
    async (next: RecurringInvoiceSchedule[]) => {
      const h = await authHeaders();
      const res = await fetch(`${API_BASE}/recurring-invoices`, {
        method: 'PUT',
        headers: h,
        body: JSON.stringify({ schedules: next }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSchedules(next);
    },
    [],
  );

  return { schedules, loading, refetch: fetchSchedules, save };
}
