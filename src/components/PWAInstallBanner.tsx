import { Download, X } from 'lucide-react';
import { Button } from './ui/button';
import { useInstallPWA } from '../pwa/install';

export function PWAInstallBanner() {
  const { canInstall, install, dismiss } = useInstallPWA();

  if (!canInstall) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[80] w-[min(92vw,620px)] -translate-x-1/2 rounded-2xl border border-cyan-500/30 bg-[#0f1627]/95 px-4 py-3 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-cyan-100">Install SyncScript for seamless continuity</p>
          <p className="text-xs text-cyan-200/80">Use SyncScript like an app on your phone and desktop with faster resume and offline access.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="bg-cyan-600 text-white hover:bg-cyan-500"
            onClick={() => void install()}
          >
            <Download className="mr-1 h-3.5 w-3.5" />
            Install
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-cyan-200" onClick={dismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
