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
import { AIAssistantPage } from '@/pages/AIAssistantPage'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

function App() {
  console.log('App component rendering...');
  const { user, isLoading, checkAuth } = useAuthStore()
  console.log('App state:', { user: !!user, isLoading });

  useEffect(() => {
    console.log('App useEffect - calling checkAuth');
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    console.log('App showing loading spinner');
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
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
