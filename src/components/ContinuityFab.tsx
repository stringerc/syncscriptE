import { useState } from 'react';
import { Link2, Smartphone, Watch } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Button } from './ui/button';
import { useContinuity } from '../contexts/ContinuityContext';
import { openPhoneRouteWithFallback, toPhoneLaunchLinks } from '../utils/native-link';

export function ContinuityFab() {
  const { continuity, createHandoffLink } = useContinuity();
  const [busy, setBusy] = useState(false);

  const handleCreateHandoff = async () => {
    setBusy(true);
    try {
      const url = await createHandoffLink();
      if (!url) {
        toast.error('Could not generate handoff link yet');
        return;
      }
      const links = toPhoneLaunchLinks(url, window.location.origin);
      await navigator.clipboard.writeText(`${links.appUrl}\n${links.webUrl}`);
      toast.success('Phone launch links copied');
    } catch {
      toast.error('Could not copy handoff link');
    } finally {
      setBusy(false);
    }
  };

  const handleOpenInPhoneApp = async () => {
    setBusy(true);
    try {
      const url = await createHandoffLink();
      if (!url) {
        toast.error('Could not generate handoff link yet');
        return;
      }
      openPhoneRouteWithFallback(url, { origin: window.location.origin });
    } catch {
      toast.error('Could not open phone route');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-[70] flex max-w-[360px] items-end gap-2">
      <div className="rounded-xl border border-cyan-500/30 bg-[#121a2a]/95 px-3 py-2 text-[11px] text-cyan-100 shadow-xl backdrop-blur-sm">
        <p className="font-medium">Live continuity active</p>
        <p className="text-cyan-200/75 line-clamp-2">{continuity.activeRouteKey}</p>
        <p className="mt-1 text-cyan-300/80">
          {Math.max(1, continuity.activeDevices.length)} active device{Math.max(1, continuity.activeDevices.length) === 1 ? '' : 's'}
        </p>
        <p className="mt-1 inline-flex items-center gap-1 text-cyan-300/80">
          <Smartphone className="h-3 w-3" />
          <Watch className="h-3 w-3" />
          Watch + mobile quick path ready
        </p>
      </div>
      <Button
        size="sm"
        disabled={busy}
        className="rounded-full bg-cyan-600 text-white hover:bg-cyan-500"
        onClick={() => void handleCreateHandoff()}
      >
        <Link2 className="mr-1 h-3.5 w-3.5" />
        Continue on phone
      </Button>
      <Button
        size="sm"
        disabled={busy}
        variant="outline"
        className="rounded-full border-cyan-400/50 bg-[#101a2e] text-cyan-100 hover:bg-[#142240]"
        onClick={() => void handleOpenInPhoneApp()}
      >
        <Smartphone className="mr-1 h-3.5 w-3.5" />
        Open app
      </Button>
    </div>
  );
}
