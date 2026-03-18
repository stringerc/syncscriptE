import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useState } from 'react';

interface EnterpriseAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent?: {
    id: string;
    name: string;
    team?: string;
    role?: string;
    status?: string;
    currentTask?: string;
  } | null;
  recentActions: Array<{ id: string; title: string; timestamp?: string; status?: string }>;
  onSaveMemory: (note: string) => Promise<void>;
}

export function EnterpriseAgentModal({
  open,
  onOpenChange,
  agent,
  recentActions,
  onSaveMemory,
}: EnterpriseAgentModalProps) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = note.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onSaveMemory(trimmed);
      setNote('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="max-w-2xl !border-gray-600 !bg-[#0f1117] !opacity-100 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle>{agent?.name || 'Agent'} Workspace</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-gray-700 bg-[#1f2430] p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-white">{agent?.role || 'Enterprise Agent'}</p>
                <p className="text-xs text-gray-400">{agent?.team || 'Mission Control'}</p>
              </div>
              <Badge variant="outline" className={agent?.status === 'active' ? 'border-emerald-500/40 text-emerald-300' : 'border-gray-600 text-gray-300'}>
                {agent?.status || 'idle'}
              </Badge>
            </div>
            <p className="text-xs text-gray-300 mt-2">{agent?.currentTask || 'Waiting for next assignment'}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-200">Recent Activity</p>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {recentActions.length === 0 && <p className="text-xs text-gray-500">No activity yet.</p>}
              {recentActions.map((action) => (
                <div key={action.id} className="rounded-md border border-gray-700 bg-[#1f2430] px-3 py-2">
                  <p className="text-sm text-white">{action.title}</p>
                  <p className="text-xs text-gray-400">{action.timestamp || ''}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-200">Agent Memory Note</p>
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={`Add memory for ${agent?.name || 'this agent'}...`}
              className="min-h-20 border-gray-700 bg-[#1f2430]"
            />
            <div className="flex justify-end">
              <Button onClick={() => void handleSave()} disabled={saving || !note.trim()}>
                {saving ? 'Saving...' : 'Save Memory'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
