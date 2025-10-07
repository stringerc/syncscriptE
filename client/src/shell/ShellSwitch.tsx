import React, { useEffect } from 'react';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { TopNav } from '@/components/navigation/TopNav';
import { QuickActionsFAB } from '@/components/ui/QuickActionsFAB';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
// import { telemetryService } from '@/services/telemetryService'; // Disabled for performance

interface ShellSwitchProps {
  children: React.ReactNode;
  onSearchClick?: () => void;
}

/**
 * Legacy Shell - wraps existing Layout component
 * No changes to existing behavior
 */
const LegacyShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

/**
 * New Shell - clean design with just TopNav (no sidebar)
 * Uses TopNav and QuickActionsFAB like LayoutModes
 */
const NewShell: React.FC<{ children: React.ReactNode; onSearchClick?: () => void }> = ({ children, onSearchClick }) => {
  // Enable keyboard shortcuts
  useKeyboardShortcuts();
  
  return (
    <div className="min-h-screen bg-background">
      {/* Skip to content link - visually hidden until focused */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border focus:border-border focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
        onClick={(e) => {
          e.preventDefault();
          const mainContent = document.getElementById('main-content');
          if (mainContent) {
            mainContent.focus();
            mainContent.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      >
        Skip to main content
      </a>
      
      {/* Top Navigation (Home, Do, Plan, Manage, AI) */}
      <TopNav onSearchClick={onSearchClick} />
      
      {/* Main content area */}
      <main 
        id="main-content"
        className="pb-20 md:pb-6 focus:outline-none"
        tabIndex={-1}
        aria-label="Main content"
      >
        {children}
      </main>
      
      {/* Quick Actions FAB */}
      <QuickActionsFAB />
    </div>
  );
};

/**
 * Shell Switcher Component
 * 
 * Reads the `new_ui` feature flag and renders the appropriate shell:
 * - `new_ui=false`: LegacyShell (existing Layout)
 * - `new_ui=true`: NewShell (new header + sidebar)
 * 
 * Emits telemetry on shell render for monitoring
 */
export const ShellSwitch: React.FC<ShellSwitchProps> = ({ children, onSearchClick }) => {
  const { isFlagEnabled } = useFeatureFlags();
  const isNewUI = isFlagEnabled('new_ui');

  // Emit telemetry when shell renders
  useEffect(() => {
    const variant = isNewUI ? 'new' : 'legacy';
    
    // Emit telemetry for shell usage
    // telemetryService.recordShellRendered(variant); // Disabled for performance
    
    // Log for debugging (remove in production)
    console.log(`🔄 Shell rendered: ${variant} (new_ui=${isNewUI})`);
  }, [isNewUI]);

  // Render appropriate shell based on feature flag
  if (isNewUI) {
    return <NewShell onSearchClick={onSearchClick}>{children}</NewShell>;
  }

  return <LegacyShell>{children}</LegacyShell>;
};
