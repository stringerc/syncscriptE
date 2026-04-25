import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import type { Event } from '@/utils/event-task-types';
import { patchCalendarSyncGroup } from '@/lib/calendar-linked-api';
import { targetsFromLinkedInstances } from '@/utils/calendar-linked-targets';
import { cn } from '@/lib/utils';

export function LinkedCalendarEventModal({
  open,
  onOpenChange,
  event,
  onSaved,
  stackAboveVoiceShell,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  onSaved?: () => void;
  /** Stack above App AI voice + EventModal when editing from Nexus voice. */
  stackAboveVoiceShell?: boolean;
}) {
  const [google, setGoogle] = useState(true);
  const [outlook, setOutlook] = useState(true);
  const [saving, setSaving] = useState(false);

  const syncId = event?.syncGroupId;

  useEffect(() => {
    if (!open || !event) return;
    const t = targetsFromLinkedInstances(event.linkedCalendarInstances);
    setGoogle(t.includes('google'));
    setOutlook(t.includes('outlook'));
  }, [open, event]);

  const targetsValid = google || outlook;

  const targetsList = useMemo(() => {
    const out: ('google' | 'outlook')[] = [];
    if (google) out.push('google');
    if (outlook) out.push('outlook');
    return out;
  }, [google, outlook]);

  const handleSave = async () => {
    if (!event || !syncId) {
      toast.error('Missing linked calendar group');
      return;
    }
    if (!targetsValid) {
      toast.error('Keep at least one calendar');
      return;
    }
    setSaving(true);
    try {
      await patchCalendarSyncGroup(syncId, {
        targets: targetsList,
        title: event.title,
        start_time:
          event.startTime instanceof Date
            ? event.startTime.toISOString()
            : String(event.startTime),
        end_time: event.endTime instanceof Date ? event.endTime.toISOString() : String(event.endTime),
        time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      toast.success('Calendars updated');
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (!event || !syncId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName={stackAboveVoiceShell ? 'z-[100030]' : undefined}
        className={cn(
          'sm:max-w-md bg-[#1e2128] border-gray-700 text-white',
          stackAboveVoiceShell && '!z-[100031]',
        )}
        onCloseAutoFocus={stackAboveVoiceShell ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle>Calendars for this event</DialogTitle>
          <DialogDescription className="text-gray-400">
            Choose which connected calendars keep this hold. Changes sync to Google Calendar and
            Outlook when your accounts are linked in Settings → Integrations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-300">{event.title}</p>
          <div className="flex items-center space-x-3">
            <Checkbox
              id="lc-google"
              checked={google}
              onCheckedChange={(v) => setGoogle(v === true)}
            />
            <Label htmlFor="lc-google" className="text-sm font-normal cursor-pointer">
              Google Calendar
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox
              id="lc-outlook"
              checked={outlook}
              onCheckedChange={(v) => setOutlook(v === true)}
            />
            <Label htmlFor="lc-outlook" className="text-sm font-normal cursor-pointer">
              Outlook Calendar
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving || !targetsValid} type="button">
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
