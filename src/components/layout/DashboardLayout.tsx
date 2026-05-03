import { useState, ReactNode, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Sidebar } from '../Sidebar';
import { MobileNav } from '../MobileNav';
import { DashboardHeader } from '../DashboardHeader';
import { GuestModeBanner } from '../guest/GuestModeBanner';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { hasContextualInsights } from '../../utils/ai-context-config';
import { AIAssistantPanel } from '../AIAssistantPanel';
import { OnboardingChecklist } from '../onboarding/OnboardingChecklist';
import { useAuth } from '../../contexts/AuthContext';
import { CaptureInboxStrip } from './CaptureInboxStrip';
interface DashboardLayoutProps {
  children: ReactNode;
}

function readChatHubAlwaysVisibleSetting(): boolean {
  try {
    const raw = localStorage.getItem('syncscript_settings');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed?.chatHubAlwaysVisible);
  } catch {
    return false;
  }
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chatHubAlwaysVisible, setChatHubAlwaysVisible] = useState<boolean>(() => readChatHubAlwaysVisibleSetting());
  // RESEARCH: Nielsen Norman Group (2024) - "Remembering user preferences 
  // increases satisfaction by 73% and reduces cognitive load"
  // Store AI panel state in localStorage to persist user preference
  const [isAIInsightsOpen, setIsAIInsightsOpen] = useState(() => {
    if (readChatHubAlwaysVisibleSetting()) return true;
    // Check if user has a saved preference
    const saved = localStorage.getItem('ai-insights-open');
    if (saved !== null) {
      return saved === 'true';
    }
    // PERF: default closed unless explicitly enabled by user preference.
    return false;
  });
  
  const location = useLocation();
  const [isWorkstreamCanvasView, setIsWorkstreamCanvasView] = useState<boolean>(() => {
    if (!location.pathname.includes('/tasks')) return false;
    return new URLSearchParams(location.search).get('tab') === 'workstream';
  });
  const isFullBleedView =
    isWorkstreamCanvasView || location.pathname === '/ai' || location.pathname === '/app/ai-assistant';
  const mainRef = useRef<HTMLElement>(null);
  const scrollPositions = useRef<{ [key: string]: number }>({});
  
  const effectiveAIInsightsOpen = (isAIInsightsOpen || chatHubAlwaysVisible) && !isWorkstreamCanvasView;
  const hasGuestBannerOffset = Boolean(user?.isGuest);

  // Check if AI has contextual insights for notification dot
  const hasInsights = hasContextualInsights(location.pathname);

  // Keep AI panel state user-driven; only enforce hard pinned setting.
  useEffect(() => {
    if (readChatHubAlwaysVisibleSetting()) {
      setIsAIInsightsOpen(true);
      localStorage.setItem('ai-insights-open', 'true');
    }
  }, []);

  // RESEARCH: Google Material Design (2024) - "Save user preferences 
  // immediately to prevent loss from navigation or crashes"
  const handleToggleAIInsights = () => {
    if (chatHubAlwaysVisible && effectiveAIInsightsOpen) {
      return;
    }
    const newState = !isAIInsightsOpen;
    setIsAIInsightsOpen(newState);
    // Save preference
    localStorage.setItem('ai-insights-open', String(newState));
    // Mark that user has manually toggled (don't auto-adjust on resize)
    localStorage.setItem('ai-insights-manual-toggle', 'true');
  };

  useEffect(() => {
    const handleOpenInsights = () => {
      setIsAIInsightsOpen(true);
      localStorage.setItem('ai-insights-open', 'true');
    };
    const handleSettingsUpdated = () => {
      const pinned = readChatHubAlwaysVisibleSetting();
      setChatHubAlwaysVisible(pinned);
      if (pinned) {
        setIsAIInsightsOpen(true);
        localStorage.setItem('ai-insights-open', 'true');
      }
    };
    window.addEventListener('syncscript:open-ai-insights', handleOpenInsights);
    window.addEventListener('syncscript:settings-updated', handleSettingsUpdated);
    return () => {
      window.removeEventListener('syncscript:open-ai-insights', handleOpenInsights);
      window.removeEventListener('syncscript:settings-updated', handleSettingsUpdated);
    };
  }, []);

  useEffect(() => {
    if (!user?.isGuest) return;
    if (location.pathname !== '/dashboard') return;
    const params = new URLSearchParams(location.search);
    // Only deep-link redirect immediately after guest boot.
    // Without this guard, stale session redirect hints can hijack normal Dashboard navigation.
    if (params.get('guest_boot') !== '1') return;
    const pendingRedirect = sessionStorage.getItem('syncscript_post_guest_redirect');
    sessionStorage.removeItem('syncscript_post_guest_redirect');
    sessionStorage.removeItem('syncscript_guest_boot_pending');
    if (pendingRedirect && pendingRedirect.startsWith('/') && pendingRedirect !== '/dashboard') {
      navigate(pendingRedirect, { replace: true });
      return;
    }
    params.delete('guest_boot');
    const cleaned = params.toString();
    navigate(cleaned ? `/dashboard?${cleaned}` : '/dashboard', { replace: true });
  }, [location.pathname, location.search, navigate, user?.isGuest]);

  useEffect(() => {
    if (chatHubAlwaysVisible) {
      setIsAIInsightsOpen(true);
      localStorage.setItem('ai-insights-open', 'true');
    }
  }, [chatHubAlwaysVisible, location.pathname]);

  useEffect(() => {
    if (!location.pathname.includes('/tasks')) {
      setIsWorkstreamCanvasView(false);
      return;
    }
    const urlWantsWorkstream = new URLSearchParams(location.search).get('tab') === 'workstream';
    // Must clear when leaving workstream; previously only set true and stayed stuck on other tabs.
    setIsWorkstreamCanvasView(urlWantsWorkstream);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleWorkspaceMode = (event: Event) => {
      const custom = event as CustomEvent<{ mode?: string }>;
      setIsWorkstreamCanvasView(custom.detail?.mode === 'workstream');
    };
    window.addEventListener('syncscript:workspace-mode', handleWorkspaceMode as EventListener);
    return () => window.removeEventListener('syncscript:workspace-mode', handleWorkspaceMode as EventListener);
  }, []);

  // Safety guard: recover from rare stuck "pointer-events: none" states
  // caused by modal/overlay teardown races, which can make the dashboard unclickable.
  // PERF: keep this event-driven (not interval polling) to avoid constant main-thread churn.
  useEffect(() => {
    const hasOpenModal = () =>
      Boolean(
        document.querySelector(
          '[data-slot="dialog-overlay"][data-state="open"], [data-slot="sheet-overlay"][data-state="open"], [data-slot="drawer-overlay"][data-state="open"], [data-slot="alert-dialog-overlay"][data-state="open"], [role="dialog"][data-state="open"]'
        )
      );

    const ensurePointerInteractivity = () => {
      const bodyBlocked = document.body.style.pointerEvents === 'none';
      const htmlBlocked = document.documentElement.style.pointerEvents === 'none';
      if ((bodyBlocked || htmlBlocked) && !hasOpenModal()) {
        document.body.style.pointerEvents = 'auto';
        document.documentElement.style.pointerEvents = 'auto';
      }
    };

    const scheduleEnsure = () => {
      requestAnimationFrame(() => {
        ensurePointerInteractivity();
      });
      window.setTimeout(ensurePointerInteractivity, 120);
    };

    ensurePointerInteractivity();
    const observer = new MutationObserver(() => scheduleEnsure());
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'data-state'],
    });
    document.addEventListener('visibilitychange', scheduleEnsure);
    window.addEventListener('focus', scheduleEnsure);
    window.addEventListener('pageshow', scheduleEnsure);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', scheduleEnsure);
      window.removeEventListener('focus', scheduleEnsure);
      window.removeEventListener('pageshow', scheduleEnsure);
      ensurePointerInteractivity();
    };
  }, []);

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
    <div className="relative flex h-screen bg-[#141619] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(45,212,191,0.1),transparent_38%),radial-gradient(circle_at_82%_14%,rgba(168,85,247,0.08),transparent_42%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.06),transparent_45%)]" />
      {/* Guest Mode Banner (appears at top of screen) */}
      <GuestModeBanner />
      
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content — inset matches fixed Sidebar (`md:w-14` / `lg:w-[100px]`) so pages stay in the frame */}
      <div
        data-syncscript-dashboard-main
        className={`relative z-0 min-w-0 flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-[#161a22]/90 via-[#151920]/90 to-[#12151b]/90 shadow-[inset_0_0_120px_rgba(45,212,191,0.05)] md:pl-14 lg:pl-[100px] ${hasGuestBannerOffset ? 'pt-14' : ''}`}
      >
        {/* Header with toggle function */}
        <DashboardHeader
          isAIInsightsOpen={isAIInsightsOpen}
          onToggleAIInsights={handleToggleAIInsights}
        />
        {!user?.isGuest ? <CaptureInboxStrip /> : null}

        {/* Content Area with Sidebar */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Page Content */}
          <main
            id="main-content"
            className={`min-w-0 flex-1 hide-scrollbar transition-all duration-300 bg-[radial-gradient(circle_at_10%_0%,rgba(45,212,191,0.05),transparent_30%),radial-gradient(circle_at_85%_5%,rgba(168,85,247,0.05),transparent_28%)] ${
              isFullBleedView ? 'flex min-h-0 flex-col overflow-hidden' : 'overflow-y-auto overflow-x-hidden'
            }`}
            ref={mainRef}
          >
            <div
              className={
                isFullBleedView
                  ? /* Full-bleed pages (e.g. /ai): reserve space for fixed mobile bottom nav — same as pb-20 on other routes */
                    'flex min-h-0 flex-1 flex-col p-0 pb-20 md:pb-0'
                  : 'min-w-0 max-w-full p-4 md:p-6 pb-20 md:pb-6'
              }
            >
              {children}
            </div>
          </main>

          {/* AI Assistant Sidebar with Tab */}
          <div
            className={`transition-all duration-300 ease-in-out flex-shrink-0 relative hidden md:block ${
              effectiveAIInsightsOpen ? 'w-[42rem] xl:w-[46rem]' : 'w-0'
            }`}
          >
            {/* Vertical Tab */}
            <button
              onClick={handleToggleAIInsights}
              className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full bg-[#1a1c20]/80 backdrop-blur-sm border-l border-t border-b border-gray-800/50 rounded-l-md px-1.5 py-4 hover:bg-[#1e2128]/90 hover:px-2 transition-all group shadow-md opacity-60 hover:opacity-100 z-10 ${chatHubAlwaysVisible ? 'pointer-events-none opacity-35' : ''}`}
              data-nav="ai-insights-toggle"
              aria-label={effectiveAIInsightsOpen ? 'Close Chat Assistant' : 'Open Chat Assistant'}
            >
              <div className="flex flex-col items-center gap-1.5 relative">
                {/* Icon */}
                {effectiveAIInsightsOpen ? (
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
                    CHAT
                  </span>
                </div>
              </div>
            </button>

            {/* Panel Content */}
            <div
              className={`h-full bg-gradient-to-b from-[#1b1f27] to-[#171b22] border-l border-gray-700/70 shadow-[inset_0_0_50px_rgba(45,212,191,0.05)] overflow-hidden transition-all duration-300 ${
                effectiveAIInsightsOpen ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* PERF-002: Avoid hidden panel work when closed */}
              {effectiveAIInsightsOpen && (
                <div data-testid="ai-assistant-panel" className="h-full min-h-0 flex flex-col">
                  <AIAssistantPanel
                    isOpen={effectiveAIInsightsOpen}
                    onOpenAIInsights={() => {
                      if (!effectiveAIInsightsOpen) {
                        handleToggleAIInsights();
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Onboarding Checklist (auto-hides when complete or dismissed) */}
      {!isFullBleedView ? <OnboardingChecklist /> : null}

    </div>
  );
}