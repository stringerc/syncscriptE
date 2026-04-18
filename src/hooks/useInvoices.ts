import { useState, useEffect, useCallback } from 'react';
import { projectId } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9`;

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface Invoice {
  id: string;
  status: 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  to_email: string;
  to_name?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_percent?: number;
  tax_amount: number;
  total: number;
  notes?: string;
  due_date?: string;
  created_at: string;
  paid_at?: string;
  viewed_at?: string;
  stripe_payment_link?: string;
  stripe_session_id?: string;
  resend_email_id?: string;
  _userId?: string;
  reminder_count?: number;
  last_reminder_at?: string;
  to_phone?: string;
  collection_call_consent?: boolean;
  last_collection_call_at?: string;
}

export interface InvoiceStats {
  totalOutstanding: number;
  totalPaid30d: number;
  overdueCount: number;
  sentCount: number;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || '';
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/invoices`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const stats: InvoiceStats = {
    totalOutstanding: invoices
      .filter((i) => i.status === 'sent' || i.status === 'viewed' || i.status === 'overdue')
      .reduce((s, i) => s + i.total, 0),
    totalPaid30d: invoices
      .filter((i) => {
        if (i.status !== 'paid' || !i.paid_at) return false;
        const d = new Date(i.paid_at).getTime();
        return d > Date.now() - 30 * 86400000;
      })
      .reduce((s, i) => s + i.total, 0),
    overdueCount: invoices.filter((i) => i.status === 'overdue').length,
    sentCount: invoices.filter((i) => i.status === 'sent' || i.status === 'viewed').length,
  };

  const deleteInvoice = useCallback(async (id: string) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/invoices/${encodeURIComponent(id)}`, { method: 'DELETE', headers });
    if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateInvoice = useCallback(async (id: string, updates: Partial<Invoice>) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/invoices/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(`Update failed: ${res.status}`);
    const updated = await res.json();
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
    return updated;
  }, []);

  const createInvoice = useCallback(async (invoice: Omit<Invoice, 'id' | 'created_at'> & { id?: string }) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/invoices`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...invoice, created_at: new Date().toISOString() }),
    });
    if (!res.ok) throw new Error(`Create failed: ${res.status}`);
    const created = await res.json();
    setInvoices((prev) => [...prev, created]);
    return created;
  }, []);

  return { invoices, loading, error, stats, refetch: fetchInvoices, deleteInvoice, updateInvoice, createInvoice };
}
