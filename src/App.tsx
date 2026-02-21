import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import { EnergyProvider } from './contexts/EnergyContext';
import { TasksProvider } from './contexts/TasksContext';
import { TeamProvider } from './contexts/TeamContext';
import { AIProvider } from './contexts/AIContext';
import { OpenClawProvider } from './contexts/OpenClawContext';
import { GamificationPreferencesProvider } from './utils/gamification-preferences';
import { GamificationProvider } from './contexts/GamificationContext';
import { UserProfileProvider } from './utils/user-profile';
import { UserPreferencesProvider } from './utils/user-preferences';
import { CalendarNavigationProvider } from './contexts/CalendarNavigationContext';
import { PermissionProvider } from './hooks/usePermissions';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { EmailQueueProcessor } from './components/EmailQueueProcessor';
import { FloatingFeedbackButton } from './components/FloatingFeedbackButton';
import { ParticleTransitionProvider } from './components/ParticleTransition';
import { SharedMarketingOrb } from './components/SharedMarketingOrb';
import { NexusVoiceCallProvider } from './contexts/NexusVoiceCallContext';
import { NexusVoiceOverlay } from './components/NexusVoiceOverlay';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TasksContextDiagnostic } from './components/TasksContextDiagnostic';
import { AnalyticsTracker } from './components/analytics/AnalyticsTracker';
import { CookieConsentBanner } from './components/CookieConsentBanner';

const PageLoading = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Lazy-loaded pages — each becomes its own chunk, loaded only when the route is visited
const LandingPage = lazy(() => import('./components/pages/LandingPage').then(m => ({ default: m.LandingPage })));
const DashboardPage = lazy(() => import('./components/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const TasksGoalsPage = lazy(() => import('./components/pages/TasksGoalsPage').then(m => ({ default: m.TasksGoalsPage })));
const CalendarEventsPage = lazy(() => import('./components/pages/CalendarEventsPage').then(m => ({ default: m.CalendarEventsPage })));
const AIAssistantPage = lazy(() => import('./components/pages/AIAssistantPage').then(m => ({ default: m.AIAssistantPage })));
const EnergyFocusPage = lazy(() => import('./components/pages/EnergyFocusPageV2').then(m => ({ default: m.EnergyFocusPage })));
const ResonanceEnginePage = lazy(() => import('./components/pages/ResonanceEnginePage').then(m => ({ default: m.ResonanceEnginePage })));
const TeamCollaborationPage = lazy(() => import('./components/pages/TeamCollaborationPage').then(m => ({ default: m.TeamCollaborationPage })));
const AnalyticsInsightsPage = lazy(() => import('./components/pages/AnalyticsInsightsPage').then(m => ({ default: m.AnalyticsInsightsPage })));
const GamificationHubPage = lazy(() => import('./components/pages/GamificationHubPage').then(m => ({ default: m.GamificationHubPage })));
const GamificationHubPageV2 = lazy(() => import('./components/pages/GamificationHubPageV2').then(m => ({ default: m.GamificationHubPageV2 })));
const IntegrationsPage = lazy(() => import('./components/pages/IntegrationsPage').then(m => ({ default: m.IntegrationsPage })));
const EnterpriseToolsPage = lazy(() => import('./components/pages/EnterpriseToolsPage').then(m => ({ default: m.EnterpriseToolsPage })));
const ScriptsTemplatesPage = lazy(() => import('./components/pages/ScriptsTemplatesPage').then(m => ({ default: m.ScriptsTemplatesPage })));
const TeamScriptsPage = lazy(() => import('./components/pages/TeamScriptsPage').then(m => ({ default: m.TeamScriptsPage })));
const SettingsPage = lazy(() => import('./components/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const LoginPage = lazy(() => import('./components/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./components/pages/SignupPage').then(m => ({ default: m.SignupPage })));
const OnboardingPage = lazy(() => import('./components/pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const AuthCallbackPage = lazy(() => import('./components/pages/AuthCallbackPage').then(m => ({ default: m.AuthCallbackPage })));
const OAuthCallbackPage = lazy(() => import('./components/pages/OAuthCallbackPage').then(m => ({ default: m.OAuthCallbackPage })));
const DesignSystemShowcase = lazy(() => import('./components/pages/DesignSystemShowcase').then(m => ({ default: m.DesignSystemShowcase })));
const ProgressAnimationShowcase = lazy(() => import('./components/ProgressAnimationShowcase').then(m => ({ default: m.ProgressAnimationShowcase })));
const ProfileMenuExample = lazy(() => import('./components/ProfileMenuExample').then(m => ({ default: m.ProfileMenuExample })));
const EventTaskSystemDemo = lazy(() => import('./components/EventTaskSystemDemo').then(m => ({ default: m.EventTaskSystemDemo })));
const PermissionTestingDashboard = lazy(() => import('./components/PermissionTestingDashboard').then(m => ({ default: m.PermissionTestingDashboard })));
const AboutPage = lazy(() => import('./components/pages/AboutPage').then(m => ({ default: m.AboutPage })));
const CareersPage = lazy(() => import('./components/pages/CareersPage').then(m => ({ default: m.CareersPage })));
const BlogPage = lazy(() => import('./components/pages/BlogPage').then(m => ({ default: m.BlogPage })));
const BlogPostPage = lazy(() => import('./components/pages/BlogPostPage').then(m => ({ default: m.BlogPostPage })));
const PressKitPage = lazy(() => import('./components/pages/PressKitPage').then(m => ({ default: m.PressKitPage })));
const DocsPage = lazy(() => import('./components/pages/DocsPage').then(m => ({ default: m.DocsPage })));
const HelpCenterPage = lazy(() => import('./components/pages/HelpCenterPage').then(m => ({ default: m.HelpCenterPage })));
const ApiPage = lazy(() => import('./components/pages/ApiPage').then(m => ({ default: m.ApiPage })));
const CommunityPage = lazy(() => import('./components/pages/CommunityPage').then(m => ({ default: m.CommunityPage })));
const PrivacyPage = lazy(() => import('./components/pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./components/pages/TermsPage').then(m => ({ default: m.TermsPage })));
const SecurityPage = lazy(() => import('./components/pages/SecurityPage').then(m => ({ default: m.SecurityPage })));
const ForgotPasswordPage = lazy(() => import('./components/pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const FeaturesPage = lazy(() => import('./components/pages/FeaturesPage').then(m => ({ default: m.FeaturesPage })));
const PricingPage = lazy(() => import('./components/pages/PricingPage').then(m => ({ default: m.PricingPage })));
const FAQPage = lazy(() => import('./components/pages/FAQPage').then(m => ({ default: m.FAQPage })));
const ContactSalesPage = lazy(() => import('./components/pages/ContactSalesPage').then(m => ({ default: m.ContactSalesPage })));
import { MarketingShell } from './components/layout/MarketingShell';

// App dashboard pages (ported from gh-pages — uses Railway API backend)
import { AppLayout } from './components/app/AppLayout';
import { AppToaster } from './components/ui/app-toaster';
const AppAuthPage = lazy(() => import('./components/app/pages/AppAuthPage').then(m => ({ default: m.AppAuthPage })));
const AppDashboardPage = lazy(() => import('./components/app/pages/AppDashboardPage').then(m => ({ default: m.AppDashboardPage })));
const AppTasksPage = lazy(() => import('./components/app/pages/AppTasksPage').then(m => ({ default: m.AppTasksPage })));
const AppCalendarPage = lazy(() => import('./components/app/pages/AppCalendarPage').then(m => ({ default: m.AppCalendarPage })));
const AppAIPage = lazy(() => import('./components/app/pages/AppAIPage').then(m => ({ default: m.AppAIPage })));
const AppFinancialPage = lazy(() => import('./components/app/pages/AppFinancialPage').then(m => ({ default: m.AppFinancialPage })));
const AppSettingsPage = lazy(() => import('./components/app/pages/AppSettingsPage').then(m => ({ default: m.AppSettingsPage })));
const AppProfilePage = lazy(() => import('./components/app/pages/AppProfilePage').then(m => ({ default: m.AppProfilePage })));

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
                {/* PHASE 1: OpenClaw Integration - Wraps entire app for AI capabilities */}
                <OpenClawProvider autoConnect={true}>
                  <GamificationPreferencesProvider>
                    <GamificationProvider>
                      <UserProfileProvider>
                        <UserPreferencesProvider>
                          <CalendarNavigationProvider>
                            <PermissionProvider>
                              {/* Analytics + Cookie Consent */}
                              <AnalyticsTracker />
                              <CookieConsentBanner />
                              
                              {/* Email Queue Processor - runs in background */}
                              <EmailQueueProcessor />
                              
                              {/* Floating Feedback Button - Always visible on all pages */}
                              <FloatingFeedbackButton discordInviteUrl="https://discord.gg/2rq38UJrDJ" />
                              
                              <Toaster position="top-right" richColors />
                              <AppToaster />
                            <NexusVoiceCallProvider>
                            <NexusVoiceOverlay />
                            <ParticleTransitionProvider>
                            <SharedMarketingOrb />
                            <Suspense fallback={<PageLoading />}>
                            <Routes>
                              {/* Landing Page (no layout) */}
                              <Route path="/" element={<LandingPage />} />

                              {/* Marketing Pages (shared MarketingShell layout with transitions) */}
                              <Route element={<MarketingShell />}>
                                <Route path="/features" element={null} />
                                <Route path="/pricing" element={null} />
                                <Route path="/faq" element={null} />
                              </Route>

                              {/* Enterprise Contact / Sales */}
                              <Route path="/contact" element={<ContactSalesPage />} />

                              {/* Marketing / Info (no layout) */}
                              <Route path="/about" element={<AboutPage />} />
                              <Route path="/blog" element={<BlogPage />} />
                              <Route path="/blog/:slug" element={<BlogPostPage />} />
                              <Route path="/careers" element={<CareersPage />} />
                              <Route path="/press" element={<PressKitPage />} />
                              <Route path="/docs" element={<DocsPage />} />
                              <Route path="/help" element={<HelpCenterPage />} />
                              <Route path="/api-reference" element={<ApiPage />} />
                              <Route path="/community" element={<CommunityPage />} />

                              {/* Design System Examples (no layout) */}
                              <Route path="/design-system" element={<DesignSystemShowcase />} />
                              <Route path="/showcase/progress" element={<ProgressAnimationShowcase />} />
                              <Route path="/showcase/profile-menu" element={<ProfileMenuExample />} />
                              <Route path="/showcase/event-task-system" element={<EventTaskSystemDemo />} />
                              
                              {/* PHASE 4: Permission Testing Dashboard */}
                              <Route path="/permission-testing" element={<PermissionTestingDashboard />} />

                              {/* Protected app routes - require auth */}
                              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                              <Route path="/tasks" element={<ProtectedRoute><TasksGoalsPage /></ProtectedRoute>} />
                              <Route path="/calendar" element={
                                <ProtectedRoute>
                                  <ErrorBoundary>
                                    <CalendarEventsPage />
                                  </ErrorBoundary>
                                </ProtectedRoute>
                              } />
                              <Route path="/ai" element={<ProtectedRoute><AIAssistantPage /></ProtectedRoute>} />
                              <Route path="/energy" element={<ProtectedRoute><EnergyFocusPage /></ProtectedRoute>} />
                              <Route path="/resonance-engine" element={<ProtectedRoute><ResonanceEnginePage /></ProtectedRoute>} />
                              <Route path="/team" element={
                                <ProtectedRoute>
                                  <ErrorBoundary>
                                    <TeamCollaborationPage />
                                  </ErrorBoundary>
                                </ProtectedRoute>
                              } />
                              <Route path="/analytics" element={
                                <ProtectedRoute>
                                  <ErrorBoundary>
                                    <AnalyticsInsightsPage />
                                  </ErrorBoundary>
                                </ProtectedRoute>
                              } />
                              <Route path="/gaming" element={<ProtectedRoute><GamificationHubPage /></ProtectedRoute>} />
                              <Route path="/gaming-v2" element={<ProtectedRoute><GamificationHubPageV2 /></ProtectedRoute>} />
                              <Route path="/integrations" element={
                                <ProtectedRoute>
                                  <ErrorBoundary>
                                    <IntegrationsPage />
                                  </ErrorBoundary>
                                </ProtectedRoute>
                              } />
                              <Route path="/enterprise" element={<ProtectedRoute><EnterpriseToolsPage /></ProtectedRoute>} />
                              <Route path="/scripts-templates" element={<ProtectedRoute><ScriptsTemplatesPage /></ProtectedRoute>} />
                              <Route path="/team-scripts" element={<ProtectedRoute><TeamScriptsPage /></ProtectedRoute>} />
                              <Route path="/settings" element={
                                <ProtectedRoute>
                                  <DashboardLayout>
                                    <SettingsPage />
                                  </DashboardLayout>
                                </ProtectedRoute>
                              } />

                              {/* Authentication Routes — uses Railway backend auth */}
                              <Route path="/login" element={<AppAuthPage />} />
                              <Route path="/signup" element={<AppAuthPage />} />
                              <Route path="/auth" element={<AppAuthPage />} />
                              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                              <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
                              <Route path="/auth/callback" element={<AuthCallbackPage />} />
                              <Route path="/oauth-callback" element={<OAuthCallbackPage />} />

                              {/* App Dashboard Routes — uses Railway API backend */}
                              <Route path="/app" element={<AppLayout><AppDashboardPage /></AppLayout>} />
                              <Route path="/app/tasks" element={<AppLayout><AppTasksPage /></AppLayout>} />
                              <Route path="/app/calendar" element={<AppLayout><AppCalendarPage /></AppLayout>} />
                              <Route path="/app/ai-assistant" element={<AppLayout><AppAIPage /></AppLayout>} />
                              <Route path="/app/financial" element={<AppLayout><AppFinancialPage /></AppLayout>} />
                              <Route path="/app/settings" element={<AppLayout><AppSettingsPage /></AppLayout>} />
                              <Route path="/app/profile" element={<AppLayout><AppProfilePage /></AppLayout>} />
                              <Route path="/app/google-calendar" element={<AppLayout><AppCalendarPage /></AppLayout>} />

                              {/* Legal & policy pages */}
                              <Route path="/privacy" element={<PrivacyPage />} />
                              <Route path="/terms" element={<TermsPage />} />
                              <Route path="/security" element={<SecurityPage />} />

                              {/* Catch all - redirect to landing */}
                              <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                            </Suspense>
                            </ParticleTransitionProvider>
                            </NexusVoiceCallProvider>
                          </PermissionProvider>
                        </CalendarNavigationProvider>
                      </UserPreferencesProvider>
                    </UserProfileProvider>
                  </GamificationProvider>
                </GamificationPreferencesProvider>
                </OpenClawProvider>
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