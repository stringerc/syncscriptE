import { useState } from 'react';
import { useInvoices, type Invoice } from '../hooks/useInvoices';
import { DollarSign, Clock, AlertTriangle, Send, ExternalLink, RefreshCw, ChevronDown, ChevronUp, Trash2, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  sent: { label: 'Sent', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  viewed: { label: 'Viewed', bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  paid: { label: 'Paid', bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  overdue: { label: 'Overdue', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  cancelled: { label: 'Cancelled', bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
};

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.sent;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={`bg-[#1e2128] rounded-xl border border-gray-800 p-5 hover:border-gray-700 transition-colors`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

function InvoiceRow({ invoice, expanded, onToggle, onDelete, onEdit }: { invoice: Invoice; expanded: boolean; onToggle: () => void; onDelete: () => void; onEdit: () => void }) {
  const date = new Date(invoice.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <>
      <tr
        className="border-b border-gray-800/50 hover:bg-gray-800/20 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="px-4 py-3.5">
          <div className="text-sm font-medium text-white">{invoice.id}</div>
          <div className="text-xs text-gray-500">{date}</div>
        </td>
        <td className="px-4 py-3.5">
          <div className="text-sm text-gray-300">{invoice.to_name || invoice.to_email}</div>
          {invoice.to_name && <div className="text-xs text-gray-500">{invoice.to_email}</div>}
        </td>
        <td className="px-4 py-3.5">
          <StatusPill status={invoice.status} />
        </td>
        <td className="px-4 py-3.5 text-right">
          <div className="text-sm font-semibold text-white">{fmt(invoice.total)}</div>
          {invoice.tax_percent ? <div className="text-xs text-gray-500">incl. {invoice.tax_percent}% tax</div> : null}
        </td>
        <td className="px-4 py-3.5 text-right">
          <div className="flex items-center justify-end gap-1">
            {invoice.status !== 'paid' && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                title="Edit invoice"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {invoice.stripe_payment_link && (
              <a
                href={invoice.stripe_payment_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                title="Payment link"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete invoice"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-gray-800/50 bg-[#161a22]">
          <td colSpan={5} className="px-6 py-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Line Items</div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500">
                      <th className="text-left pb-1">Description</th>
                      <th className="text-center pb-1">Qty</th>
                      <th className="text-right pb-1">Price</th>
                      <th className="text-right pb-1">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, i) => (
                      <tr key={i} className="text-gray-300">
                        <td className="py-1">{item.description}</td>
                        <td className="text-center py-1">{item.quantity}</td>
                        <td className="text-right py-1">{fmt(item.unit_price)}</td>
                        <td className="text-right py-1 font-medium">{fmt(item.quantity * item.unit_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2 pt-2 border-t border-gray-700 space-y-1 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span><span>{fmt(invoice.subtotal)}</span>
                  </div>
                  {invoice.tax_percent ? (
                    <div className="flex justify-between text-gray-400">
                      <span>Tax ({invoice.tax_percent}%)</span><span>{fmt(invoice.tax_amount)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-white font-semibold">
                    <span>Total</span><span>{fmt(invoice.total)}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Timeline</div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span className="text-gray-400">Created</span>
                      <span className="text-gray-500 ml-auto">{new Date(invoice.created_at).toLocaleString()}</span>
                    </div>
                    {invoice.viewed_at && (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span className="text-gray-400">Viewed</span>
                        <span className="text-gray-500 ml-auto">{new Date(invoice.viewed_at).toLocaleString()}</span>
                      </div>
                    )}
                    {invoice.paid_at && (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        <span className="text-gray-400">Paid</span>
                        <span className="text-gray-500 ml-auto">{new Date(invoice.paid_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                {invoice.notes && (
                  <div>
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Notes</div>
                    <div className="text-xs text-gray-400">{invoice.notes}</div>
                  </div>
                )}
                {invoice.due_date && (
                  <div>
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Due Date</div>
                    <div className="text-xs text-gray-300">{invoice.due_date}</div>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function InvoiceDashboard({ onCreateNew, onEdit }: { onCreateNew?: () => void; onEdit?: (invoice: Invoice) => void } = {}) {
  const { invoices, loading, error, stats, refetch, deleteInvoice } = useInvoices();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invoice? This cannot be undone.')) return;
    try {
      await deleteInvoice(id);
      toast.success('Invoice deleted');
    } catch {
      toast.error('Failed to delete invoice');
    }
  };

  const filtered = filter === 'all' ? invoices : invoices.filter((i) => i.status === filter);
  const sorted = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Invoices</h2>
          <p className="text-sm text-gray-400 mt-1">Track and manage sent invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-700 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-500 hover:to-cyan-500 transition-colors"
            >
              <Plus className="w-3 h-3" /> New Invoice
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={DollarSign} label="Outstanding" value={fmt(stats.totalOutstanding)} color="bg-purple-500/20 text-purple-400" />
        <StatCard icon={DollarSign} label="Paid (30d)" value={fmt(stats.totalPaid30d)} color="bg-green-500/20 text-green-400" />
        <StatCard icon={AlertTriangle} label="Overdue" value={String(stats.overdueCount)} color="bg-red-500/20 text-red-400" />
        <StatCard icon={Send} label="Active" value={String(stats.sentCount)} sub="Sent or viewed" color="bg-blue-500/20 text-blue-400" />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {['all', 'sent', 'viewed', 'paid', 'overdue'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
              filter === f
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                : 'text-gray-400 border-gray-700 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && ` (${invoices.filter((i) => i.status === f).length})`}
          </button>
        ))}
      </div>

      <div className="bg-[#1e2128] rounded-xl border border-gray-800 overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading invoices...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">{error}</div>
        ) : sorted.length === 0 ? (
          <div className="p-12 text-center">
            <Send className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <div className="text-gray-400 font-medium">No invoices yet</div>
            <div className="text-xs text-gray-500 mt-1">Ask Nexus to send an invoice, or create one from the AI tab</div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Invoice</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Recipient</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider w-20"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((inv) => (
                <InvoiceRow
                  key={inv.id}
                  invoice={inv}
                  expanded={expandedId === inv.id}
                  onToggle={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                  onDelete={() => handleDelete(inv.id)}
                  onEdit={() => onEdit?.(inv)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
