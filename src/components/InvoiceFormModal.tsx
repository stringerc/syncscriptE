import { useState, useCallback, useMemo, useEffect } from 'react';
import { X, Plus, Trash2, Send, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { Invoice, InvoiceItem } from '../hooks/useInvoices';
import { projectId } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { NEXUS_USER_CHAT_PATH } from '../config/nexus-vercel-ai-routes';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9`;

interface InvoiceFormModalProps {
  invoice?: Invoice | null;
  onClose: () => void;
  onSaved: () => void;
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function InvoiceFormModal({ invoice, onClose, onSaved }: InvoiceFormModalProps) {
  const isEdit = !!invoice;
  const [toEmail, setToEmail] = useState(invoice?.to_email || '');
  const [toName, setToName] = useState(invoice?.to_name || '');
  const [items, setItems] = useState<InvoiceItem[]>(
    invoice?.items?.length ? invoice.items : [{ description: '', quantity: 1, unit_price: 0 }],
  );
  const [taxPercent, setTaxPercent] = useState(invoice?.tax_percent || 0);
  const [notes, setNotes] = useState(invoice?.notes || '');
  const [dueDate, setDueDate] = useState(invoice?.due_date || '');
  const [toPhone, setToPhone] = useState(invoice?.to_phone || '');
  const [collectionConsent, setCollectionConsent] = useState(Boolean(invoice?.collection_call_consent));
  const [sending, setSending] = useState(false);
  const [connectedEmails, setConnectedEmails] = useState<{ provider: string; email: string }[]>([]);
  const [fromProvider, setFromProvider] = useState('resend');

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const res = await fetch(`${API_BASE}/invoice-settings/connected-emails`, {
          headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const emails = await res.json();
          if (Array.isArray(emails)) setConnectedEmails(emails);
        }
      } catch {}
    })();
  }, []);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.quantity * i.unit_price, 0), [items]);
  const taxAmount = useMemo(() => (taxPercent > 0 ? Math.round(subtotal * (taxPercent / 100) * 100) / 100 : 0), [subtotal, taxPercent]);
  const total = useMemo(() => Math.round((subtotal + taxAmount) * 100) / 100, [subtotal, taxAmount]);

  const addItem = () => setItems((prev) => [...prev, { description: '', quantity: 1, unit_price: 0 }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof InvoiceItem, value: string | number) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const handleSendOrSave = useCallback(async () => {
    if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (items.every((i) => !i.description.trim())) {
      toast.error('Please add at least one line item');
      return;
    }
    if (collectionConsent && !/^\+[1-9]\d{8,14}$/.test(toPhone.trim())) {
      toast.error('Opt-in reminder calls require a valid E.164 phone (e.g. +15551234567)');
      return;
    }

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      const cleanItems = items.filter((i) => i.description.trim()).map((i) => ({
        description: i.description.trim(),
        quantity: Math.max(1, i.quantity),
        unit_price: Math.max(0, i.unit_price),
      }));

      if (isEdit && invoice) {
        await fetch(`${API_BASE}/invoices/${encodeURIComponent(invoice.id)}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            to_email: toEmail,
            to_name: toName || undefined,
            items: cleanItems,
            subtotal,
            tax_percent: taxPercent > 0 ? taxPercent : undefined,
            tax_amount: taxAmount,
            total,
            notes: notes || undefined,
            due_date: dueDate || undefined,
            to_phone: toPhone.trim() || undefined,
            collection_call_consent: collectionConsent,
          }),
        });
        toast.success('Invoice updated');
      } else {
        const res = await fetch(NEXUS_USER_CHAT_PATH, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{
              role: 'user',
              content: `Send an invoice to ${toEmail}${toName ? ` (${toName})` : ''} for: ${cleanItems.map((i) => `${i.description} x${i.quantity} at $${i.unit_price}`).join(', ')}${taxPercent > 0 ? `. Tax rate: ${taxPercent}%` : ''}${dueDate ? `. Due: ${dueDate}` : ''}${notes ? `. Notes: ${notes}` : ''}`,
            }],
            enableTools: true,
            voiceMode: false,
          }),
        });
        const data = await res.json();
        const inv = data.toolTrace?.find((t: any) => t.tool === 'send_invoice' && t.ok);
        if (inv) {
          const invoiceId = inv.detail?.invoiceId as string | undefined;
          if (invoiceId && (toPhone.trim() || collectionConsent)) {
            try {
              await fetch(`${API_BASE}/invoices/${encodeURIComponent(invoiceId)}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                  to_phone: toPhone.trim() || undefined,
                  collection_call_consent: collectionConsent,
                }),
              });
            } catch {
              /* non-fatal — invoice already sent */
            }
          }
          toast.success(`Invoice sent to ${toEmail} — ${fmt(total)}`);
        } else {
          toast.error('Failed to send invoice');
          setSending(false);
          return;
        }
      }
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'Failed');
    } finally {
      setSending(false);
    }
  }, [toEmail, toName, items, taxPercent, notes, dueDate, toPhone, collectionConsent, isEdit, invoice, subtotal, taxAmount, total, onSaved, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-lg bg-[#13141a] md:border-l border-gray-800 flex flex-col h-full overflow-hidden animate-in slide-in-from-right">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? 'Edit Invoice' : 'New Invoice'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Recipient Email *</label>
              <input
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="client@company.com"
                className="w-full bg-[#1e2128] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Recipient Name</label>
              <input
                type="text"
                value={toName}
                onChange={(e) => setToName(e.target.value)}
                placeholder="John Smith / Acme Corp"
                className="w-full bg-[#1e2128] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-3 border border-gray-800 rounded-lg p-3 bg-[#1a1b20]">
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                Client phone (E.164, optional)
              </label>
              <input
                type="tel"
                value={toPhone}
                onChange={(e) => setToPhone(e.target.value)}
                placeholder="+15551234567"
                className="w-full bg-[#1e2128] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:outline-none"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Used only if you opt in below. Collection calls are off until reminders have run — see billing automation docs.
              </p>
            </div>
            <label className="flex items-start gap-2 text-xs text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 rounded border-gray-600"
                checked={collectionConsent}
                onChange={(e) => setCollectionConsent(e.target.checked)}
              />
              <span>
                Allow automated payment reminder calls to this number (opt-in). You are responsible for consent and applicable calling rules (TCPA, etc.).
              </span>
            </label>
          </div>

          {!isEdit && connectedEmails.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Send From</label>
              <select
                value={fromProvider}
                onChange={(e) => setFromProvider(e.target.value)}
                className="w-full bg-[#1e2128] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none"
              >
                <option value="resend">SyncScript Invoicing (default)</option>
                {connectedEmails.map((ce) => (
                  <option key={ce.provider} value={ce.provider}>
                    {ce.email} ({ce.provider === 'google_mail' ? 'Gmail' : 'Outlook'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Line Items</label>
              <button onClick={addItem} className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors">
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    placeholder="Description"
                    className="flex-1 bg-[#1e2128] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:outline-none"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                    min={1}
                    className="w-16 bg-[#1e2128] border border-gray-700 rounded-lg px-2 py-2 text-sm text-white text-center focus:border-purple-500/50 focus:outline-none"
                    title="Qty"
                  />
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input
                      type="number"
                      value={item.unit_price || ''}
                      onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      className="w-28 bg-[#1e2128] border border-gray-700 rounded-lg pl-6 pr-3 py-2 text-sm text-white text-right focus:border-purple-500/50 focus:outline-none"
                    />
                  </div>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(idx)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Tax Rate (%)</label>
              <input
                type="number"
                value={taxPercent || ''}
                onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                min={0}
                max={30}
                step={0.1}
                placeholder="0"
                className="w-full bg-[#1e2128] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#1e2128] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Notes / Payment Terms</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Payment due within 30 days. Thank you for your business."
              className="w-full bg-[#1e2128] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 resize-none focus:border-purple-500/50 focus:outline-none"
            />
          </div>

          <div className="bg-[#1e2128] rounded-xl border border-gray-800 p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Subtotal</span>
              <span className="text-gray-300">{fmt(subtotal)}</span>
            </div>
            {taxPercent > 0 && (
              <div className="flex justify-between text-sm text-gray-400">
                <span>Tax ({taxPercent}%)</span>
                <span className="text-gray-300">{fmt(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-700">
              <span className="text-white">Total</span>
              <span className="text-white">{fmt(total)}</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSendOrSave}
            disabled={sending}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-500 hover:to-cyan-500 transition-colors disabled:opacity-50"
          >
            {sending ? (
              'Processing...'
            ) : isEdit ? (
              <><Save className="w-4 h-4" /> Save Changes</>
            ) : (
              <><Send className="w-4 h-4" /> Send Invoice</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
