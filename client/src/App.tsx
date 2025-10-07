import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { initializePerformanceMonitoring } from '@/services/performanceService'
import { Layout } from '@/components/layout/Layout'
import { AuthPage } from '@/pages/AuthPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { PasswordResetPage } from '@/pages/PasswordResetPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DashboardPageSimple } from '@/pages/DashboardPageSimple'
import { DashboardPageInstant } from '@/pages/DashboardPageInstant'
import { DashboardPageUltraFast } from '@/pages/DashboardPageUltraFast'
import { DashboardPageZeroAPI } from '@/pages/DashboardPageZeroAPI'
import { TasksPageZeroAPI } from '@/pages/TasksPageZeroAPI'
import { CalendarPageZeroAPI } from '@/pages/CalendarPageZeroAPI'
import { ScriptsPageZeroAPI } from '@/pages/ScriptsPageZeroAPI'
import { FinancialPageZeroAPI } from '@/pages/FinancialPageZeroAPI'
import { TasksPage } from '@/pages/TasksPage'
import { CalendarPageSwitch } from '@/components/CalendarPageSwitch'
import { GoogleCalendarPage } from '@/pages/GoogleCalendarPage'
import MultiCalendarPage from '@/pages/MultiCalendarPage'
import { ExportPage } from '@/pages/ExportPage'
import { FinancialPage } from '@/pages/FinancialPage'
import { SettingsPageNew } from '@/pages/SettingsPageNew'
import { SettingsPageZeroAPI } from '@/pages/SettingsPageZeroAPI'
import { ProfilePage } from '@/pages/ProfilePage'
import { ProfilePageZeroAPI } from '@/pages/ProfilePageZeroAPI'
import { ProfileResourcesPage } from '@/pages/ProfileResourcesPage'
import { AIAssistantPage } from '@/pages/AIAssistantPage'
import { AnalyticsDashboardPage } from '@/pages/AnalyticsDashboardPage'
import { FriendsPage } from '@/pages/FriendsPage'
import { FriendsPageZeroAPI } from '@/pages/FriendsPageZeroAPI'
import { TemplateGalleryPage } from '@/pages/TemplateGalleryPage'
import { ProjectsPage } from '@/pages/ProjectsPage'
import { ProjectsPageZeroAPI } from '@/pages/ProjectsPageZeroAPI'
import { ProjectDetailPage } from '@/pages/ProjectDetailPage'
import { FAQPage } from '@/pages/FAQPage'
import { PrivacyPage } from '@/pages/PrivacyPage'
import NotificationsPage from '@/pages/NotificationsPage'
import { NotificationsPageZeroAPI } from '@/pages/NotificationsPageZeroAPI'
import SearchPage from '@/pages/SearchPage'
import GamificationPage from '@/pages/GamificationPage'
import { GamificationPageZeroAPI } from '@/pages/GamificationPageZeroAPI'
import PricingPage from '@/pages/PricingPage'
import { VerifyEmailPage } from '@/pages/VerifyEmailPage'
import { GoogleCallbackPage } from '@/pages/GoogleCallbackPage'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { PointAnimationProvider } from '@/contexts/PointAnimationContext'
import { AchievementsProvider } from '@/contexts/AchievementsContext'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { FeatureFlagsProvider } from '@/contexts/FeatureFlagsContext'
import { ShellSwitch } from '@/shell/ShellSwitch'
// Removed animation context import
import DemoMode from '@/components/DemoMode'
import { FeedbackButton } from '@/components/FeedbackButton'
import { SkipLink } from '@/components/accessibility/SkipLink'
import { GlobalScreenReaderAnnouncer } from '@/components/accessibility/ScreenReaderAnnouncer'
import { Toaster } from '@/components/ui/toaster'
import { api } from '@/lib/api'
// import { analytics } from '@/services/analytics' // Disabled for performance
// import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring' // Disabled for performance
import { ButtonTestComponent } from '@/components/ButtonTestComponent'
import { HomeMode } from '@/pages/modes/HomeMode'
import { DoMode } from '@/pages/modes/DoMode'
import { PlanMode } from '@/pages/modes/PlanMode'
import { ManageMode } from '@/pages/modes/ManageMode'
import { LayoutModes } from '@/components/layout/LayoutModes'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { EnergyInsightsPage } from '@/pages/EnergyInsightsPage'
import { AIAssistantModal } from '@/components/ai/AIAssistantModal'
import { GlobalSearch } from '@/components/search/GlobalSearch'

function AppContent() {
  const { user, isLoading, checkAuth } = useAuthStore()
  const location = useLocation()
  const [showAI, setShowAI] = React.useState(false)
  const [showSearch, setShowSearch] = React.useState(false)
  
  // Enable global keyboard shortcuts
  useKeyboardShortcuts()
  
  // Listen for Cmd+K and / globally
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K for AI
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        console.log('🤖 Opening AI Assistant modal')
        setShowAI(true)
      }
      
      // / for Search (only if not in input)
      if (e.key === '/' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        console.log('🔍 Opening Global Search')
        setShowSearch(true)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Check if we're in demo mode (GitHub Pages without working backend)
  const isDemoMode = api.defaults.baseURL === 'DEMO_MODE'

  // DISABLED for ultra-fast mode
  // useEffect(() => {
  //   if (!isDemoMode) {
  //     console.log('🔐 App: Checking authentication...')
  //     checkAuth()
  //   } else {
  //     console.log('🔐 App: Demo mode, skipping checkAuth')
  //   }
  // }, [isDemoMode]) // Remove checkAuth from dependencies to prevent infinite loop

  // Track app initialization - DISABLED for performance
  // useEffect(() => {
  //   analytics.track('app_initialized', {
  //     isDemoMode,
  //     hasUser: !!user,
  //     timestamp: Date.now()
  //   });
  // }, [isDemoMode, user]);

  // Monitor performance - DISABLED for performance
  // usePerformanceMonitoring();

  // Show demo mode for GitHub Pages
  if (isDemoMode) {
    return <DemoMode />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<PasswordResetPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/callback" element={<GoogleCallbackPage />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    )
  }

  return (
    <AchievementsProvider>
      <SidebarProvider>
        <SkipLink />
        <GlobalScreenReaderAnnouncer />
        <ButtonTestComponent />
        <Toaster />
        <AIAssistantModal 
          open={showAI} 
          onClose={() => setShowAI(false)}
          context={location.pathname.includes('/home') ? 'home' : 
                   location.pathname.includes('/do') ? 'do' :
                   location.pathname.includes('/plan') ? 'plan' : 
                   location.pathname.includes('/manage') ? 'manage' : 'home'}
        />
        <GlobalSearch 
          open={showSearch} 
          onClose={() => setShowSearch(false)}
        />
        <ShellSwitch onSearchClick={() => setShowSearch(true)}>
          <Routes>
            {/* NEW: Mode-based routes (use new LayoutModes) */}
            <Route path="/home" element={<HomeMode />} />
            <Route path="/do" element={<DoMode />} />
            <Route path="/plan" element={<PlanMode />} />
            <Route path="/manage" element={<ManageMode />} />
            <Route path="/energy-insights" element={<EnergyInsightsPage />} />
            
            {/* Redirect root to HOME mode */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            
            {/* OLD routes (use old Layout with sidebar) */}
            <Route path="/dashboard" element={<Layout><DashboardPageZeroAPI /></Layout>} />
            <Route path="/dashboard-new" element={<Layout><DashboardPageInstant /></Layout>} />
            <Route path="/dashboard-ultra" element={<Layout><DashboardPageUltraFast /></Layout>} />
            <Route path="/zero-api" element={<Layout><DashboardPageZeroAPI /></Layout>} />
            <Route path="/tasks" element={<Layout><TasksPageZeroAPI /></Layout>} />
            <Route path="/calendar" element={<Layout><CalendarPageZeroAPI /></Layout>} />
            <Route path="/google-calendar" element={<Layout><GoogleCalendarPage /></Layout>} />
            <Route path="/multi-calendar" element={<Layout><MultiCalendarPage /></Layout>} />
            <Route path="/export" element={<Layout><ExportPage /></Layout>} />
            <Route path="/financial" element={<Layout><FinancialPageZeroAPI /></Layout>} />
            <Route path="/ai-assistant" element={<Layout><AIAssistantPage /></Layout>} />
            <Route path="/notifications" element={<NotificationsPageZeroAPI />} />
            <Route path="/search" element={<Layout><SearchPage /></Layout>} />
            <Route path="/gamification" element={<Layout><GamificationPageZeroAPI /></Layout>} />
            <Route path="/settings" element={<SettingsPageNew />} />
            <Route path="/settings-old" element={<Layout><SettingsPageZeroAPI /></Layout>} />
            <Route path="/profile" element={<ProfilePageZeroAPI />} />
            <Route path="/profile/resources" element={<Layout><ProfileResourcesPage /></Layout>} />
            <Route path="/friends" element={<FriendsPageZeroAPI />} />
            <Route path="/templates" element={<ScriptsPageZeroAPI />} />
            <Route path="/projects" element={<ProjectsPageZeroAPI />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="/admin/analytics" element={<Layout><AnalyticsDashboardPage /></Layout>} />
            <Route path="/faq" element={<Layout><FAQPage /></Layout>} />
            <Route path="/privacy" element={<Layout><PrivacyPage /></Layout>} />
            <Route path="/pricing" element={<Layout><PricingPage /></Layout>} />
            <Route path="/verify-email" element={<Layout><VerifyEmailPage /></Layout>} />
            <Route path="/callback" element={<Layout><GoogleCallbackPage /></Layout>} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </ShellSwitch>
      </SidebarProvider>
    </AchievementsProvider>
  )
}

function App() {
  useEffect(() => {
    // Initialize performance monitoring
    initializePerformanceMonitoring();
  }, []);

  return (
    <ThemeProvider>
      <NotificationProvider>
        <FeatureFlagsProvider>
          <PointAnimationProvider>
            <AppContent />
          </PointAnimationProvider>
        </FeatureFlagsProvider>
      </NotificationProvider>
    </ThemeProvider>
  )
}

export default App
