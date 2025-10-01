import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { AuthPage } from '@/pages/AuthPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { PasswordResetPage } from '@/pages/PasswordResetPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TasksPage } from '@/pages/TasksPage'
import { CalendarPage } from '@/pages/CalendarPage'
import { GoogleCalendarPage } from '@/pages/GoogleCalendarPage'
import { FinancialPage } from '@/pages/FinancialPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { ProfileResourcesPage } from '@/pages/ProfileResourcesPage'
import { AIAssistantPage } from '@/pages/AIAssistantPage'
import { AnalyticsDashboardPage } from '@/pages/AnalyticsDashboardPage'
import { FriendsPage } from '@/pages/FriendsPage'
import { TemplateGalleryPage } from '@/pages/TemplateGalleryPage'
import { ProjectsPage } from '@/pages/ProjectsPage'
import { ProjectDetailPage } from '@/pages/ProjectDetailPage'
import { FAQPage } from '@/pages/FAQPage'
import { PrivacyPage } from '@/pages/PrivacyPage'
import EnergyAnalysisPage from '@/pages/EnergyAnalysisPage'
import NotificationsPage from '@/pages/NotificationsPage'
import SearchPage from '@/pages/SearchPage'
import GamificationPage from '@/pages/GamificationPage'
import { VerifyEmailPage } from '@/pages/VerifyEmailPage'
import { GoogleCallbackPage } from '@/pages/GoogleCallbackPage'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { PointAnimationProvider } from '@/contexts/PointAnimationContext'
import { AchievementsProvider } from '@/contexts/AchievementsContext'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { FeatureFlagsProvider } from '@/contexts/FeatureFlagsContext'
// Removed animation context import
import DemoMode from '@/components/DemoMode'
import { FeedbackButton } from '@/components/FeedbackButton'
import { SkipLink } from '@/components/accessibility/SkipLink'
import { GlobalScreenReaderAnnouncer } from '@/components/accessibility/ScreenReaderAnnouncer'
import { api } from '@/lib/api'
import '@/styles/accessibility.css'

function AppContent() {
  const { user, isLoading, checkAuth } = useAuthStore()

  // Check if we're in demo mode (GitHub Pages without working backend)
  const isDemoMode = api.defaults.baseURL === 'DEMO_MODE'

  useEffect(() => {
    if (!isDemoMode) {
      console.log('🔐 App: Checking authentication...')
      checkAuth()
    } else {
      console.log('🔐 App: Demo mode, skipping checkAuth')
    }
  }, [isDemoMode]) // Remove checkAuth from dependencies to prevent infinite loop

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
        <Route path="/google-callback" element={<GoogleCallbackPage />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    )
  }

  return (
    <AchievementsProvider>
      <SidebarProvider>
        <SkipLink />
        <GlobalScreenReaderAnnouncer />
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/google-calendar" element={<GoogleCalendarPage />} />
            <Route path="/financial" element={<FinancialPage />} />
            <Route path="/ai-assistant" element={<AIAssistantPage />} />
            <Route path="/energy-analysis" element={<EnergyAnalysisPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/gamification" element={<GamificationPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/resources" element={<ProfileResourcesPage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/templates" element={<TemplateGalleryPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="/admin/analytics" element={<AnalyticsDashboardPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/google-callback" element={<GoogleCallbackPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <FeedbackButton />
        </Layout>
      </SidebarProvider>
    </AchievementsProvider>
  )
}

function App() {
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
