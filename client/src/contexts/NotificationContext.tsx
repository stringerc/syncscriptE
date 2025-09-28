import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Notification, NotificationPreferences, NotificationStats } from '@/types/notification'
import { toast } from '@/hooks/use-toast'
import { useAuthStore } from '@/stores/authStore'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  preferences: NotificationPreferences | null
  stats: NotificationStats | null
  isLoading: boolean
  error: Error | null
  
  // Actions
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  deleteNotification: (notificationId: string) => void
  clearAllNotifications: () => void
  
  // Preferences
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void
  
  // Send notifications
  sendNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  
  // Real-time updates
  refreshNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  // Fetch notifications
  const { data: notificationsData, isLoading, error, refetch } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications')
      return response.data.data || response.data || []
    },
    enabled: !!user, // Only run when user is authenticated
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    refetchOnWindowFocus: true,
  })

    // Fetch preferences
    const { data: preferences } = useQuery<NotificationPreferences>({
      queryKey: ['notification-preferences'],
      enabled: !!user, // Only run when user is authenticated
      queryFn: async () => {
        try {
          const response = await api.get('/notifications/preferences')
          return response.data.data || response.data
        } catch (error) {
          console.log('Preferences endpoint not available yet, using defaults')
          // Return default preferences for testing
          return {
            channels: {
              in_app: { enabled: true, sound: true, showBadge: true },
              email: { enabled: true, frequency: 'immediate', types: ['task_reminder', 'event_reminder', 'deadline_warning'] },
              push: { enabled: true, sound: true, vibration: true },
              desktop: { enabled: true, sound: true, showPreview: true }
            },
            timing: {
              quietHours: { enabled: false, start: '22:00', end: '08:00', timezone: 'UTC' },
              energyBasedTiming: true,
              respectFocusMode: true
            },
            types: {
              task_reminders: { enabled: true, advanceMinutes: 15, priority: 'medium' },
              event_reminders: { enabled: true, advanceMinutes: 30, priority: 'medium' },
              energy_alerts: { enabled: true, threshold: 3, priority: 'high' },
              achievements: { enabled: true, priority: 'low' },
              deadline_warnings: { enabled: true, advanceHours: 2, priority: 'high' },
              system: { enabled: true, priority: 'medium' }
            }
          }
        }
      },
      retry: false,
    })

  // Fetch stats
  const { data: stats } = useQuery<NotificationStats>({
    queryKey: ['notification-stats'],
    enabled: !!user, // Only run when user is authenticated
    queryFn: async () => {
      try {
        const response = await api.get('/notifications/stats')
        return response.data.data || response.data
      } catch (error) {
        console.log('Stats endpoint not available yet, using defaults')
        // Return default stats for testing
        return {
          total: 0,
          unread: 0,
          byType: {},
          byPriority: {},
          recentActivity: {
            today: 0,
            thisWeek: 0,
            thisMonth: 0
          }
        }
      }
    },
    retry: false,
  })

  // Update notifications state when data changes
  useEffect(() => {
    if (notificationsData && Array.isArray(notificationsData)) {
      setNotifications(notificationsData)
    }
  }, [notificationsData])

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.patch(`/notifications/${notificationId}/read`)
      return response.data
    },
    onSuccess: (_, notificationId) => {
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      )
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive"
      })
    }
  })

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await api.patch('/notifications/read-all')
      return response.data
    },
    onSuccess: () => {
      setNotifications(prev => prev.map(notification => ({ ...notification, read: true })))
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive"
      })
    }
  })

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.delete(`/notifications/${notificationId}`)
      return response.data
    },
    onSuccess: (_, notificationId) => {
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId))
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive"
      })
    }
  })

  // Clear all notifications
  const clearAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete('/notifications/clear-all')
      return response.data
    },
    onSuccess: () => {
      setNotifications([])
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to clear all notifications",
        variant: "destructive"
      })
    }
  })

  // Update preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (prefs: Partial<NotificationPreferences>) => {
      const response = await api.patch('/notifications/preferences', prefs)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] })
      toast({
        title: "Success",
        description: "Notification preferences updated"
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive"
      })
    }
  })

  // Send notification
  const sendNotificationMutation = useMutation({
    mutationFn: async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      const response = await api.post('/notifications/send', notification)
      return response.data
    },
    onSuccess: (newNotification) => {
      setNotifications(prev => [newNotification, ...prev])
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive"
      })
    }
  })

  // Context value
  const value: NotificationContextType = {
    notifications,
    unreadCount: Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0,
    preferences,
    stats,
    isLoading,
    error,
    
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    clearAllNotifications: clearAllNotificationsMutation.mutate,
    
    updatePreferences: updatePreferencesMutation.mutate,
    
    sendNotification: sendNotificationMutation.mutate,
    
    refreshNotifications: () => refetch(),
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
