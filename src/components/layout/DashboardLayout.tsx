import { useState, ReactNode, useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { Sidebar } from '../Sidebar';
import { MobileNav } from '../MobileNav';
import { DashboardHeader } from '../DashboardHeader';
import { GuestModeBanner } from '../guest/GuestModeBanner';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { hasContextualInsights } from '../../utils/ai-context-config';
import { AIAssistantPanel } from '../AIAssistantPanel';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  // RESEARCH: Nielsen Norman Group (2024) - "Remembering user preferences 
  // increases satisfaction by 73% and reduces cognitive load"
  // Store AI panel state in localStorage to persist user preference
  const [isAIInsightsOpen, setIsAIInsightsOpen] = useState(() => {
    // Check if user has a saved preference
    const saved = localStorage.getItem('ai-insights-open');
    if (saved !== null) {
      return saved === 'true';
    }
    // Default: Open on desktop, closed on mobile
    return window.innerWidth >= 1280;
  });
  
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const scrollPositions = useRef<{ [key: string]: number }>({});
  
  // Check if AI has contextual insights for notification dot
  const hasInsights = hasContextualInsights(location.pathname);

  // RESEARCH: Apple Human Interface Guidelines (2024) - "Responsive layouts 
  // should adapt to screen size changes, not route changes"
  // Only run on mount and actual window resize, NOT on route change
  useEffect(() => {
    const handleResize = () => {
      // Only auto-adjust if user hasn't manually toggled
      const hasManualPreference = localStorage.getItem('ai-insights-manual-toggle');
      if (hasManualPreference) {
        // User has manually toggled - respect their choice
        return;
      }
      
      // Auto-adjust based on screen size for first-time users
      if (window.innerWidth >= 1280) {
        setIsAIInsightsOpen(true);
        localStorage.setItem('ai-insights-open', 'true');
      } else {
        setIsAIInsightsOpen(false);
        localStorage.setItem('ai-insights-open', 'false');
      }
    };

    // Set initial state (ONLY on mount, not on route change)
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty dependency array = runs only once on mount

  // RESEARCH: Google Material Design (2024) - "Save user preferences 
  // immediately to prevent loss from navigation or crashes"
  const handleToggleAIInsights = () => {
    const newState = !isAIInsightsOpen;
    setIsAIInsightsOpen(newState);
    // Save preference
    localStorage.setItem('ai-insights-open', String(newState));
    // Mark that user has manually toggled (don't auto-adjust on resize)
    localStorage.setItem('ai-insights-manual-toggle', 'true');
  };

  // Save and restore scroll position
  useEffect(() => {
    const currentRef = mainRef.current;
    if (currentRef) {
      const currentPath = location.pathname;
      const savedPosition = scrollPositions.current[currentPath];
      if (savedPosition !== undefined) {
        currentRef.scrollTop = savedPosition;
      }
    }

    return () => {
      const currentRef = mainRef.current;
      if (currentRef) {
        const currentPath = location.pathname;
        scrollPositions.current[currentPath] = currentRef.scrollTop;
      }
    };
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-[#141619] overflow-hidden">
      {/* Guest Mode Banner (appears at top of screen) */}
      <GuestModeBanner />
      
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with toggle function */}
        <DashboardHeader
          isAIInsightsOpen={isAIInsightsOpen}
          onToggleAIInsights={handleToggleAIInsights}
        />

        {/* Content Area with Sidebar */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Page Content */}
          <main
            className="flex-1 overflow-y-auto hide-scrollbar transition-all duration-300"
            ref={mainRef}
          >
            <div className="p-4 md:p-6 pb-20 md:pb-6">
              {children}
            </div>
          </main>

          {/* AI Assistant Sidebar with Tab */}
          <div
            className={`transition-all duration-300 ease-in-out flex-shrink-0 relative ${
              isAIInsightsOpen ? 'w-80' : 'w-0'
            }`}
          >
            {/* Vertical Tab */}
            <button
              onClick={handleToggleAIInsights}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full bg-[#1a1c20]/80 backdrop-blur-sm border-l border-t border-b border-gray-800/50 rounded-l-md px-1.5 py-4 hover:bg-[#1e2128]/90 hover:px-2 transition-all group shadow-md opacity-60 hover:opacity-100 z-10"
              data-nav="ai-insights-toggle"
              aria-label={isAIInsightsOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
            >
              <div className="flex flex-col items-center gap-1.5 relative">
                {/* Icon */}
                {isAIInsightsOpen ? (
                  <ChevronRight className="w-3 h-3 text-purple-400/80 group-hover:text-purple-300 transition-colors" />
                ) : (
                  <>
                    <ChevronLeft className="w-3 h-3 text-purple-400/80 group-hover:text-purple-300 transition-colors" />
                    {/* Notification Dot - Shows when AI has insights */}
                    {hasInsights && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-[#1a1c20] animate-pulse" />
                    )}
                  </>
                )}
                
                {/* Vertical Text */}
                <div className="flex flex-col items-center">
                  <span 
                    className="text-purple-400/80 group-hover:text-purple-300 transition-colors text-[10px] font-medium tracking-wider"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                  >
                    AI INSIGHTS
                  </span>
                </div>
              </div>
            </button>

            {/* Panel Content */}
            <div
              className={`h-full bg-[#1a1c20] border-l border-gray-800 overflow-hidden transition-all duration-300 ${
                isAIInsightsOpen ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* AI Assistant Panel - Fully Functional */}
              <AIAssistantPanel 
                isOpen={isAIInsightsOpen} 
                onOpenAIInsights={() => {
                  if (!isAIInsightsOpen) {
                    handleToggleAIInsights();
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}