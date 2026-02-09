import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface GamificationPreferences {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const GamificationContext = createContext<GamificationPreferences | undefined>(undefined);

export function GamificationPreferencesProvider({ children }: { children: ReactNode }) {
  // Load from localStorage on mount
  const [enabled, setEnabledState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('gamification-enabled');
      return stored !== null ? JSON.parse(stored) : true; // Default to enabled
    }
    return true;
  });

  // Save to localStorage when changed
  const setEnabled = (value: boolean) => {
    setEnabledState(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('gamification-enabled', JSON.stringify(value));
    }
  };

  return (
    <GamificationContext.Provider value={{ enabled, setEnabled }}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationPreferencesProvider');
  }
  return context;
}
