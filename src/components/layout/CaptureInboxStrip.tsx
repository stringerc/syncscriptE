"use client";

import { useCallback, useEffect, useState } from 'react';
import { Inbox } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTasks } from '../../hooks/useTasks';
import {
  listCaptureInbox,
  commitCaptureInboxItem,
  dismissCaptureInboxItem,
  type CaptureInboxItem,
} from '../../utils/edge-productivity-client';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

function kindLabel(kind: CaptureInboxItem['kind']): string {
  if (kind === 'task_draft') return 'Task';
  if (kind === 'calendar_hold_draft') return 'Calendar hold';
  return 'Note';
}

export function CaptureInboxStrip() {
  const { user } = useAuth();
  const { refreshTasks } = useTasks();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CaptureInboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id || user.isGuest) return;
    setLoading(true);
    setBannerError(null);
    try {
      const next = await listCaptureInbox('pending');
      setItems(next);
    } catch {
      setBannerError('Could not load capture inbox.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.isGuest]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onChange = () => void load();
    window.addEventListener('syncscript:capture-inbox-changed', onChange);
    return () => window.removeEventListener('syncscript:capture-inbox-changed', onChange);
  }, [load]);

  if (!user?.id || user.isGuest) return null;

  const pending = items.filter((i) => i.status === 'pending');

  if (!loading && pending.length === 0) return null;

  const handleCommit = async (id: string, kind: CaptureInboxItem['kind']) => {
    setBusyId(id);
    setBannerError(null);
    const res = await commitCaptureInboxItem(id);
    setBusyId(null);
    if (!res.ok) {
      setBannerError(res.error || 'Commit failed.');
      return;
    }
    if (kind === 'task_draft') void refreshTasks();
    window.dispatchEvent(new CustomEvent('syncscript:capture-inbox-changed'));
    await load();
    if (pending.length <= 1) setOpen(false);
  };

  const handleDismiss = async (id: string) => {
    setBusyId(id);
    setBannerError(null);
    const ok = await dismissCaptureInboxItem(id);
    setBusyId(null);
    if (!ok) {
      setBannerError('Dismiss failed.');
      return;
    }
    window.dispatchEvent(new CustomEvent('syncscript:capture-inbox-changed'));
    await load();
    if (pending.length <= 1) setOpen(false);
  };

  return (
    <>
      <div
        className="shrink-0 border-b border-teal-500/25 bg-[#161b24]/95 px-4 py-2 md:px-6"
        role="region"
        aria-label="Capture inbox suggestions"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 text-sm text-slate-200">
            <Inbox className="size-4 shrink-0 text-teal-400/90" aria-hidden />
            <span className="truncate">
              {loading ? 'Loading suggestions…' : `${pending.length} suggested item${pending.length === 1 ? '' : 's'} from tools / MCP`}
            </span>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="shrink-0 border border-teal-500/30 bg-teal-500/10 text-teal-100 hover:bg-teal-500/20"
            onClick={() => setOpen(true)}
            disabled={loading || pending.length === 0}
          >
            Review
          </Button>
        </div>
        {bannerError ? (
          <p className="mt-1 text-xs text-amber-300" role="status">
            {bannerError}
          </p>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border border-slate-700/80 bg-[#141820] text-slate-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Capture inbox</DialogTitle>
            <DialogDescription className="text-slate-400">
              Suggested items stay here until you commit them to tasks or calendar. Dismiss anything you do not want.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-3">
            {pending.map((row) => (
              <li
                key={row.id}
                className="rounded-lg border border-slate-700/60 bg-slate-900/40 p-3"
              >
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-teal-400/90">
                  {kindLabel(row.kind)}
                </div>
                <p className="text-sm text-slate-100">{row.title || 'Untitled'}</p>
                {row.source ? (
                  <p className="mt-1 text-xs text-slate-500">Source: {row.source}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {row.kind !== 'generic' ? (
                    <Button
                      type="button"
                      size="sm"
                      className="bg-teal-600 text-white hover:bg-teal-500"
                      disabled={busyId === row.id}
                      onClick={() => void handleCommit(row.id, row.kind)}
                    >
                      {busyId === row.id ? 'Working…' : 'Commit'}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-200"
                    disabled={busyId === row.id}
                    onClick={() => void handleDismiss(row.id)}
                  >
                    Dismiss
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
