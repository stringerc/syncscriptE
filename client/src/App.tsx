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
import { GoogleCalendarPageWorking as GoogleCalendarPage } from '@/pages/GoogleCalendarPageWorking'
import { FinancialPage } from '@/pages/FinancialPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { AIAssistantPage } from '@/pages/AIAssistantPage'
import EnergyAnalysisPage from '@/pages/EnergyAnalysisPage'
import NotificationsPage from '@/pages/NotificationsPage'
import { VerifyEmailPage } from '@/pages/VerifyEmailPage'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { AnimationProvider } from '@/contexts/AnimationContext'
import DemoMode from '@/components/DemoMode'
import { api } from '@/lib/api'

function AppContent() {
  const { user, isLoading, checkAuth } = useAuthStore()

  // Check if we're in demo mode (GitHub Pages without working backend)
  const isDemoMode = api.defaults.baseURL === 'DEMO_MODE'

  useEffect(() => {
    if (!isDemoMode) {
      console.log('🔐 App: Skipping checkAuth for debugging')
      // checkAuth() // Temporarily disabled for debugging
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
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    )
  }

  return (
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
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AnimationProvider>
          <AppContent />
        </AnimationProvider>
      </NotificationProvider>
    </ThemeProvider>
  )
}

export default App
