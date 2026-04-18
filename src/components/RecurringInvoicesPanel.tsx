import { CalendarClock, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRecurringInvoices, type RecurringInvoiceSchedule } from '../hooks/useRecurringInvoices';

export function RecurringInvoicesPanel() {
  const { schedules, loading, save } = useRecurringInvoices();

  const addSchedule = async () => {
    const nextRun = new Date();
    nextRun.setUTCDate(nextRun.getUTCDate() + 7);
    const row: RecurringInvoiceSchedule = {
      id: `rec_${Date.now()}`,
      enabled: true,
      cadence: 'monthly',
      next_run_at: nextRun.toISOString(),
      template: {
        to_email: '',
        items: [{ description: 'Service', quantity: 1, unit_price: 0 }],
        tax_percent: 0,
        due_days_offset: 14,
      },
    };
    try {
      await save([...schedules, row]);
      toast.success('Schedule added — fill recipient and amounts, then save.');
    } catch {
      toast.error('Could not save schedule');
    }
  };

  const updateRow = async (idx: number, patch: Partial<RecurringInvoiceSchedule>) => {
    const copy = [...schedules];
    copy[idx] = { ...copy[idx], ...patch } as RecurringInvoiceSchedule;
    try {
      await save(copy);
    } catch {
      toast.error('Save failed');
    }
  };

  const remove = async (idx: number) => {
    const copy = schedules.filter((_, i) => i !== idx);
    try {
      await save(copy);
    } catch {
      toast.error('Remove failed');
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading recurring schedules…</div>;
  }

  return (
    <div className="bg-[#1a1b23] border border-gray-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white text-sm font-medium">
          <CalendarClock className="w-4 h-4 text-amber-300" />
          Recurring invoices
        </div>
        <button
          type="button"
          onClick={() => void addSchedule()}
          className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 text-amber-200 border border-amber-500/25"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      <p className="text-xs text-gray-500">
        Server cron sends the next run automatically (see billing tick). Set recipient email and line items.
      </p>
      {schedules.length === 0 && (
        <p className="text-sm text-gray-500">No recurring schedules yet.</p>
      )}
      <div className="space-y-3">
        {schedules.map((sch, idx) => (
          <div key={sch.id} className="bg-[#13141a] border border-gray-800 rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-gray-400">
                <input
                  type="checkbox"
                  checked={sch.enabled}
                  onChange={(e) => void updateRow(idx, { enabled: e.target.checked })}
                />
                Enabled
              </label>
              <button type="button" onClick={() => void remove(idx)} className="text-gray-500 hover:text-rose-400 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                className="bg-[#1e2128] border border-gray-700 rounded px-2 py-1 text-sm text-white"
                placeholder="Recipient email"
                value={sch.template.to_email}
                onChange={(e) => {
                  const t = { ...sch.template, to_email: e.target.value };
                  void updateRow(idx, { template: t });
                }}
              />
              <select
                className="bg-[#1e2128] border border-gray-700 rounded px-2 py-1 text-sm text-white"
                value={sch.cadence}
                onChange={(e) =>
                  void updateRow(idx, { cadence: e.target.value as RecurringInvoiceSchedule['cadence'] })
                }
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
            <input
              className="w-full bg-[#1e2128] border border-gray-700 rounded px-2 py-1 text-sm text-white"
              placeholder="Line item description"
              value={sch.template.items[0]?.description || ''}
              onChange={(e) => {
                const items = [{ ...sch.template.items[0], description: e.target.value, quantity: 1, unit_price: sch.template.items[0]?.unit_price ?? 0 }];
                void updateRow(idx, { template: { ...sch.template, items } });
              }}
            />
            <div className="flex gap-2">
              <input
                type="number"
                className="w-28 bg-[#1e2128] border border-gray-700 rounded px-2 py-1 text-sm text-white"
                placeholder="Amount"
                value={sch.template.items[0]?.unit_price ?? 0}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  const items = [{ ...sch.template.items[0], description: sch.template.items[0]?.description || 'Service', quantity: 1, unit_price: v }];
                  void updateRow(idx, { template: { ...sch.template, items } });
                }}
              />
              <input
                type="datetime-local"
                className="flex-1 bg-[#1e2128] border border-gray-700 rounded px-2 py-1 text-sm text-white"
                value={sch.next_run_at.slice(0, 16)}
                onChange={(e) => {
                  const d = new Date(e.target.value);
                  if (!Number.isNaN(d.getTime())) void updateRow(idx, { next_run_at: d.toISOString() });
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
