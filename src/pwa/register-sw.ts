import { registerSW } from 'virtual:pwa-register';

let unregisterFn: (() => void) | null = null;

export function registerSyncScriptServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  if (unregisterFn) return;
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // Force-refresh to avoid mixed old/new chunk graphs after deployments.
      console.info('[PWA] New version available, reloading.');
      void updateSW(true);
    },
    onOfflineReady() {
      console.info('[PWA] Offline cache ready.');
    },
    onRegistered(registration) {
      if (!registration) return;
      setInterval(() => {
        registration.update().catch(() => {
          // ignore periodic update errors
        });
      }, 1000 * 60 * 30);
    },
  });
  unregisterFn = () => {
    updateSW();
  };
}
