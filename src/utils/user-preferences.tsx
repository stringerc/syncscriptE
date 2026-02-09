import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserPreferences {
  // Energy & Timing Preferences
  peakEnergyTime: 'morning' | 'afternoon' | 'evening' | 'night';
  secondaryEnergyPeak?: 'morning' | 'afternoon' | 'evening' | 'night';
  preferredStartTime: string; // e.g., "7:00 AM"
  preferredEndTime: string; // e.g., "6:00 PM"
  
  // Work Style Preferences
  taskCompletionSpeed: number; // 0.5 = 50% slower, 1.0 = average, 1.5 = 50% faster
  prefersLongerBreaks: boolean;
  breakDuration: number; // minutes
  focusSessionDuration: number; // minutes
  
  // Complexity & Challenge
  complexityPreference: 'simple' | 'moderate' | 'complex';
  likesDetailedPlans: boolean;
  prefersFlexibility: boolean;
  
  // Communication Style
  communicationStyle: 'concise' | 'detailed' | 'visual';
  notificationFrequency: 'minimal' | 'moderate' | 'frequent';
  
  // Behavioral Patterns (tracked over time)
  avgTasksPerDay: number;
  avgCompletionRate: number; // 0-100%
  mostProductiveDay: string; // day of week
  
  // Resonance Settings
  enableResonanceAdaptation: boolean;
  adaptationIntensity: 'minimal' | 'moderate' | 'full';
  
  // Personalization timestamp
  lastUpdated: string;
  onboardingComplete: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  peakEnergyTime: 'morning',
  preferredStartTime: '9:00 AM',
  preferredEndTime: '5:00 PM',
  taskCompletionSpeed: 1.0,
  prefersLongerBreaks: false,
  breakDuration: 10,
  focusSessionDuration: 90,
  complexityPreference: 'moderate',
  likesDetailedPlans: true,
  prefersFlexibility: false,
  communicationStyle: 'detailed',
  notificationFrequency: 'moderate',
  avgTasksPerDay: 8,
  avgCompletionRate: 75,
  mostProductiveDay: 'Tuesday',
  enableResonanceAdaptation: true,
  adaptationIntensity: 'moderate',
  lastUpdated: new Date().toISOString(),
  onboardingComplete: false
};

interface UserPreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('syncscript_user_preferences');
      if (saved) {
        try {
          return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
        } catch (e) {
          console.error('Failed to parse user preferences', e);
        }
      }
    }
    return DEFAULT_PREFERENCES;
  });

  // Save to localStorage whenever preferences change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('syncscript_user_preferences', JSON.stringify(preferences));
    }
  }, [preferences]);

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...updates,
      lastUpdated: new Date().toISOString()
    }));
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('syncscript_user_preferences');
    }
  };

  return (
    <UserPreferencesContext.Provider value={{ preferences, updatePreferences, resetPreferences }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
}
