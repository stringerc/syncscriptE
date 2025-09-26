import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Notification, NotificationPreferences, NotificationStats } from '@/types/notification'
import { toast } from '@/hooks/use-toast'

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

  // Fetch notifications
  const { data: notificationsData, isLoading, error, refetch } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications')
      return response.data
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnWindowFocus: true,
  })

  // Fetch preferences
  const { data: preferences } = useQuery<NotificationPreferences>({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await api.get('/notifications/preferences')
      return response.data
    },
  })

  // Fetch stats
  const { data: stats } = useQuery<NotificationStats>({
    queryKey: ['notification-stats'],
    queryFn: async () => {
      const response = await api.get('/notifications/stats')
      return response.data
    },
  })

  // Update notifications state when data changes
  useEffect(() => {
    if (notificationsData) {
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
    unreadCount: notifications.filter(n => !n.read).length,
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
