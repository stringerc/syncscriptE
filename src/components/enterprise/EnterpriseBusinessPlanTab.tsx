import { useCallback, useEffect, useState } from 'react';
import { FileDown, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  exportBusinessPlanMarkdown,
  fetchBusinessPlan,
  saveBusinessPlan,
  type BusinessPlanSections,
} from '../../utils/edge-productivity-client';

const SECTION_KEYS: { key: string; label: string; hint: string }[] = [
  { key: 'problem', label: 'Problem', hint: 'What pain are you solving?' },
  { key: 'solution', label: 'Solution', hint: 'How SyncScript (and your offer) address it' },
  { key: 'market', label: 'Market', hint: 'Who pays, TAM/SAM, wedge' },
  { key: 'traction', label: 'Traction', hint: 'Proof points, pilots, metrics' },
  { key: 'team', label: 'Team', hint: 'Why you, hiring plan' },
  { key: 'financials', label: 'Financials', hint: 'Model, assumptions, runway' },
  { key: 'asks', label: 'Asks', hint: 'What you need from investors, partners, or the team' },
];

const emptySections = (): BusinessPlanSections =>
  SECTION_KEYS.reduce<BusinessPlanSections>((acc, { key }) => ({ ...acc, [key]: '' }), {});

export function EnterpriseBusinessPlanTab() {
  const [sections, setSections] = useState<BusinessPlanSections>(emptySections());
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchBusinessPlan();
      setSections({ ...emptySections(), ...data.sections });
      setUpdatedAt(data.updatedAt);
    } catch {
      toast.error('Could not load business plan', { description: 'Sign in and ensure the latest database migration is applied.' });
      setSections(emptySections());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onSave = async () => {
    setSaving(true);
    try {
      await saveBusinessPlan(sections);
      toast.success('Business plan saved');
      await load();
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onExport = async () => {
    try {
      const md = await exportBusinessPlanMarkdown();
      await navigator.clipboard.writeText(md);
      toast.success('Markdown copied', { description: 'Paste into BUSINESS_PLAN.md or Cursor context.' });
    } catch {
      toast.error('Export failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-white/10 bg-[#171a21] p-12 text-slate-300">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        <span className="ml-2 text-sm">Loading plan…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#171a21] p-4">
        <div>
          <p className="text-sm font-semibold text-white">Business plan</p>
          <p className="text-xs text-slate-400">
            {updatedAt ? `Last saved ${new Date(updatedAt).toLocaleString()}` : 'Not saved yet — edits stay local until you save.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="border-white/20 text-slate-200" onClick={() => void onExport()}>
            <FileDown className="mr-2 h-4 w-4" />
            Copy markdown
          </Button>
          <Button type="button" className="bg-cyan-600 hover:bg-cyan-500" onClick={() => void onSave()} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {SECTION_KEYS.map(({ key, label, hint }) => (
          <div key={key} className="rounded-xl border border-white/10 bg-[#171a21] p-4">
            <Label className="text-sm font-medium text-white">{label}</Label>
            <p className="mt-1 text-xs text-slate-500">{hint}</p>
            <Textarea
              className="mt-2 min-h-[120px] border-white/15 bg-[#1d212a] text-sm text-slate-100"
              value={String(sections[key] ?? '')}
              onChange={(e) => setSections((prev) => ({ ...prev, [key]: e.target.value }))}
              placeholder={`Write your ${label.toLowerCase()}…`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
