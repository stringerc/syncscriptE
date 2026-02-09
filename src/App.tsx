import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import { EnergyProvider } from './contexts/EnergyContext';
import { TasksProvider } from './contexts/TasksContext';
import { TeamProvider } from './contexts/TeamContext';
import { AIProvider } from './contexts/AIContext';
import { GamificationPreferencesProvider } from './utils/gamification-preferences';
import { GamificationProvider } from './contexts/GamificationContext';
import { UserProfileProvider } from './utils/user-profile';
import { UserPreferencesProvider } from './utils/user-preferences';
import { CalendarNavigationProvider } from './contexts/CalendarNavigationContext';
import { PermissionProvider } from './hooks/usePermissions';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GuestModeBanner } from './components/guest/GuestModeBanner';
import { EmailQueueProcessor } from './components/EmailQueueProcessor';

// Pages
import { LandingPage } from './components/pages/LandingPage';
import { DashboardPage } from './components/pages/DashboardPage';
import { TasksGoalsPage } from './components/pages/TasksGoalsPage';
import { CalendarEventsPage } from './components/pages/CalendarEventsPage';
import { AIAssistantPage } from './components/pages/AIAssistantPage';
import { EnergyFocusPage } from './components/pages/EnergyFocusPageV2'; // V2.0: Revolutionary redesign
import { ResonanceEnginePage } from './components/pages/ResonanceEnginePage';
import { TeamCollaborationPage } from './components/pages/TeamCollaborationPage';
import { AnalyticsInsightsPage } from './components/pages/AnalyticsInsightsPage';
import { GamificationHubPage } from './components/pages/GamificationHubPage';
import { GamificationHubPageV2 } from './components/pages/GamificationHubPageV2';
import { IntegrationsPage } from './components/pages/IntegrationsPage';
import { EnterpriseToolsPage } from './components/pages/EnterpriseToolsPage';
import { ScriptsTemplatesPage } from './components/pages/ScriptsTemplatesPage';
import { TeamScriptsPage } from './components/pages/TeamScriptsPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { LoginPage } from './components/pages/LoginPage';
import { SignupPage } from './components/pages/SignupPage';
import { OnboardingPage } from './components/pages/OnboardingPage';
import { AuthCallbackPage } from './components/pages/AuthCallbackPage';
import { OAuthCallbackPage } from './components/pages/OAuthCallbackPage';


// Design System Showcases
import { DesignSystemShowcase } from './components/pages/DesignSystemShowcase';
import { ProgressAnimationShowcase } from './components/ProgressAnimationShowcase';
import { ProfileMenuExample } from './components/ProfileMenuExample';
import { EventTaskSystemDemo } from './components/EventTaskSystemDemo';
import { PermissionTestingDashboard } from './components/PermissionTestingDashboard';

// Layout
import { DashboardLayout } from './components/layout/DashboardLayout';
import { TasksContextDiagnostic } from './components/TasksContextDiagnostic';
import { FloatingFeedbackButton } from './components/FloatingFeedbackButton';

// Beta Onboarding System
import { SampleDataBanner } from './components/onboarding/SampleDataBanner';
import { EnhancedWelcomeModal } from './components/onboarding/EnhancedWelcomeModal';
import { ProductTour } from './components/onboarding/ProductTour';
import { OnboardingChecklist } from './components/onboarding/OnboardingChecklist';
import { useSampleData } from './hooks/useSampleData';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router';

function BetaOnboarding() {
  const location = useLocation();
  const { loadSampleData, hasLoadedSamples, hasUserData } = useSampleData();
  const [showWelcome, setShowWelcome] = useState(false);
  const [runTour, setRunTour] = useState(false);

  // Only show onboarding on dashboard routes, not the landing page or auth pages
  const isLandingOrAuth = location.pathname === '/' || location.pathname.startsWith('/auth') || location.pathname === '/login' || location.pathname === '/signup';

  useEffect(() => {
    if (isLandingOrAuth) return; // Don't trigger onboarding on landing/auth pages
    const isFirstTime = !localStorage.getItem('syncscript_has_visited');
    if (isFirstTime) {
      localStorage.setItem('syncscript_has_visited', 'true');
      loadSampleData();
      setTimeout(() => setShowWelcome(true), 1000);
    } else if (hasLoadedSamples && !hasUserData) {
      loadSampleData();
    }
  }, [isLandingOrAuth]);

  // Don't render anything on landing/auth pages
  if (isLandingOrAuth) return null;

  return (
    <>
      <SampleDataBanner />
      <EnhancedWelcomeModal
        show={showWelcome}
        onClose={() => setShowWelcome(false)}
        onStartTour={() => { setShowWelcome(false); setRunTour(true); }}
        onSkipTour={() => setShowWelcome(false)}
      />
      <ProductTour run={runTour} onComplete={() => setRunTour(false)} onSkip={() => setRunTour(false)} />
      <OnboardingChecklist />
    </>
  );
}

function AppContent() {
  return (
    <AuthProvider>
      <EnergyProvider>
        <TasksProvider>
          {/* Diagnostic Component - Remove after debugging */}
          <TasksContextDiagnostic />
          
          <TeamProvider>
            <Router future={{ v7_startTransition: true }}>
              <AIProvider>
                <GamificationPreferencesProvider>
                  <GamificationProvider>
                    <UserProfileProvider>
                      <UserPreferencesProvider>
                        <CalendarNavigationProvider>
                          <PermissionProvider>
                            {/* Email Queue Processor - runs in background */}
                            <EmailQueueProcessor />
                            
                            {/* Beta Onboarding System */}
                            <BetaOnboarding />
                            
                            {/* Floating Feedback Button - Always visible on all pages */}
                            <FloatingFeedbackButton discordInviteUrl="https://discord.gg/YOUR_INVITE_HERE" />
                            
                            <Toaster position="top-right" richColors />
                            <Routes>
                              {/* Landing Page (no layout) */}
                              <Route path="/" element={<LandingPage />} />

                              {/* Design System Examples (no layout) */}
                              <Route path="/design-system" element={<DesignSystemShowcase />} />
                              <Route path="/showcase/progress" element={<ProgressAnimationShowcase />} />
                              <Route path="/showcase/profile-menu" element={<ProfileMenuExample />} />
                              <Route path="/showcase/event-task-system" element={<EventTaskSystemDemo />} />
                              
                              {/* PHASE 4: Permission Testing Dashboard */}
                              <Route path="/permission-testing" element={<PermissionTestingDashboard />} />

                              {/* Dashboard - wrapped in layout */}
                              <Route path="/dashboard" element={<DashboardPage />} />

                              {/* Pages that wrap themselves with DashboardLayout - ADD ERROR BOUNDARIES */}
                              <Route path="/tasks" element={<TasksGoalsPage />} />
                              <Route path="/calendar" element={
                                <ErrorBoundary>
                                  <CalendarEventsPage />
                                </ErrorBoundary>
                              } />
                              <Route path="/ai" element={<AIAssistantPage />} />
                              <Route path="/energy" element={<EnergyFocusPage />} />
                              <Route path="/resonance-engine" element={<ResonanceEnginePage />} />
                              <Route path="/team" element={
                                <ErrorBoundary>
                                  <TeamCollaborationPage />
                                </ErrorBoundary>
                              } />
                              <Route path="/analytics" element={
                                <ErrorBoundary>
                                  <AnalyticsInsightsPage />
                                </ErrorBoundary>
                              } />
                              <Route path="/gaming" element={<GamificationHubPage />} />
                              <Route path="/gaming-v2" element={<GamificationHubPageV2 />} />
                              <Route path="/integrations" element={
                                <ErrorBoundary>
                                  <IntegrationsPage />
                                </ErrorBoundary>
                              } />
                              <Route path="/enterprise" element={<EnterpriseToolsPage />} />

                              {/* Final 3 pages - NOW COMPLETE! */}
                              <Route path="/scripts-templates" element={<ScriptsTemplatesPage />} />
                              <Route path="/team-scripts" element={<TeamScriptsPage />} />

                              <Route path="/settings" element={
                                <DashboardLayout>
                                  <SettingsPage />
                                </DashboardLayout>
                              } />

                              {/* Authentication Routes */}
                              <Route path="/login" element={<LoginPage />} />
                              <Route path="/signup" element={<SignupPage />} />
                              <Route path="/onboarding" element={<OnboardingPage />} />
                              <Route path="/auth/callback" element={<AuthCallbackPage />} />
                              
                              {/* OAuth Integration Callback */}
                              <Route path="/oauth-callback" element={<OAuthCallbackPage />} />
                              {/* OAuth test page removed - contained hardcoded secrets */}

                              {/* Catch all - redirect to landing */}
                              <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                          </PermissionProvider>
                        </CalendarNavigationProvider>
                      </UserPreferencesProvider>
                    </UserProfileProvider>
                  </GamificationProvider>
                </GamificationPreferencesProvider>
              </AIProvider>
            </Router>
          </TeamProvider>
        </TasksProvider>
      </EnergyProvider>
    </AuthProvider>
  );
}

export default function App() {
  return <AppContent />;
}