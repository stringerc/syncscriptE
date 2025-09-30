import React from 'react'
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, Settings, Activity } from 'lucide-react'
import { useNotifications } from '@/contexts/NotificationContext'

const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, stats, isLoading } = useNotifications()
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-gray-600">
            Manage your notification preferences and stay informed
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : (stats?.total || notifications?.length || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.recentActivity?.thisWeek || 0} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : (stats?.unread || unreadCount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.recentActivity?.today || 0} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settings</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground">
              All channels enabled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Notification Preferences */}
      <NotificationPreferences />
    </div>
  )
}

export default NotificationsPage
