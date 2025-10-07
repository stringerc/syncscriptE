import { ReactNode } from 'react';
import { TopNav } from '@/components/navigation/TopNav';
import { QuickActionsFAB } from '@/components/ui/QuickActionsFAB';

interface LayoutModesProps {
  children: ReactNode;
  onSearchClick?: () => void;
}

export function LayoutModes({ children, onSearchClick }: LayoutModesProps) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav onSearchClick={onSearchClick} />
      
      {/* Main content area */}
      <main 
        id="main-content"
        className="pb-20 md:pb-6"
        tabIndex={-1}
        aria-label="Main content"
      >
        {children}
      </main>
      
      {/* Quick Actions FAB */}
      <QuickActionsFAB />
    </div>
  );
}

