import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeSettings {
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  layoutDensity: 'compact' | 'normal' | 'comfortable';
  darkMode: 'light' | 'dark' | 'system';
}

interface ThemeContextType {
  settings: ThemeSettings;
  updateSettings: (newSettings: Partial<ThemeSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: ThemeSettings = {
  primaryColor: 'linear-gradient(to right, rgb(168 85 247), rgb(236 72 153))',
  fontSize: 'medium',
  layoutDensity: 'normal',
  darkMode: 'light',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem('syncscript-theme');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse saved theme:', e);
      }
    }
    return defaultSettings;
  });

  // Apply theme settings to document
  useEffect(() => {
    console.log('🎨 Applying theme settings:', settings);
    
    // Apply font size to root
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
    };
    document.documentElement.style.fontSize = fontSizeMap[settings.fontSize];
    
    // Apply dark mode
    const isDark = settings.darkMode === 'dark' || 
                   (settings.darkMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
      // Force dark mode colors for better readability
      document.body.style.backgroundColor = '#0f172a'; // slate-900
      document.body.style.color = '#f1f5f9'; // slate-100
    } else {
      document.documentElement.classList.remove('dark');
      // Force light mode colors
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#0f172a';
    }
    
    // Apply layout density as CSS variable
    const densityMap = {
      compact: '0.5rem',
      normal: '1rem',
      comfortable: '1.5rem',
    };
    document.documentElement.style.setProperty('--spacing-unit', densityMap[settings.layoutDensity]);
    
    // Save to localStorage
    localStorage.setItem('syncscript-theme', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<ThemeSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      console.log('🎨 Theme updated:', updated);
      return updated;
    });
  };

  const resetSettings = () => {
    console.log('🔄 Theme reset to defaults');
    setSettings(defaultSettings);
    localStorage.removeItem('syncscript-theme');
  };

  return (
    <ThemeContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
