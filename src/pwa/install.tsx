import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

interface InstallPWAContextValue {
  canInstall: boolean;
  install: () => Promise<boolean>;
  dismissed: boolean;
  dismiss: () => void;
}

const InstallPWAContext = createContext<InstallPWAContextValue | null>(null);

const DISMISS_KEY = 'syncscript_pwa_install_dismissed';

export function InstallPWAProvider({ children }: { children: ReactNode }) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (!installEvent) return false;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === 'accepted') {
      setInstallEvent(null);
      return true;
    }
    return false;
  }, [installEvent]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<InstallPWAContextValue>(() => ({
    canInstall: Boolean(installEvent) && !dismissed,
    install,
    dismissed,
    dismiss,
  }), [dismissed, install, installEvent]);

  return (
    <InstallPWAContext.Provider value={value}>
      {children}
    </InstallPWAContext.Provider>
  );
}

export function useInstallPWA(): InstallPWAContextValue {
  const ctx = useContext(InstallPWAContext);
  if (!ctx) throw new Error('useInstallPWA must be used inside InstallPWAProvider');
  return ctx;
}
