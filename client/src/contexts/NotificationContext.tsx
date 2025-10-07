import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { AchievementToast } from '@/components/AchievementToast'

interface Achievement {
  title: string
  description: string
  points: number
  icon?: string
}

interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  actionUrl?: string
  metadata?: any
}

interface NotificationStats {
  total: number
  unread: number
  recentActivity: {
    today: number
    thisWeek: number
  }
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  stats: NotificationStats | null
  sendNotification: (type: string, message: string, metadata?: any) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  showAchievement: (achievement: Achievement) => void
  showPointsEarned: (points: number, reason: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [currentAchievement, setCurrentAchievement] = useState<(Achievement & { isVisible: boolean }) | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const response = await api.get('/notifications')
        return response.data.data
      } catch (error) {
        // Silently fail - notifications not critical for new modes
        console.log('ℹ️ Notifications unavailable (using new mode system)');
        return [];
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: false, // Don't retry on failure
  })

  const notifications: Notification[] = Array.isArray(data) ? data : []
  const unreadCount = notifications.filter(n => !n.isRead).length
  const stats: NotificationStats | null = Array.isArray(data) ? {
    total: notifications.length,
    unread: unreadCount,
    recentActivity: {
      today: notifications.filter(n => {
        const today = new Date().toDateString()
        return new Date(n.createdAt).toDateString() === today
      }).length,
      thisWeek: notifications.filter(n => {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return new Date(n.createdAt) > weekAgo
      }).length
    }
  } : null

  const sendNotification = useCallback(async (type: string, message: string, metadata?: any) => {
    try {
      await api.post('/notifications', { type, message, metadata })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast({
        title: "Notification Sent",
        description: message,
      })
    } catch (error) {
      console.error('Failed to send notification:', error)
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      })
    }
  }, [queryClient, toast])

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.patch(`/notifications/${id}`, { isRead: true })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }, [queryClient])

  const markAllAsRead = useCallback(async () => {
    try {
      await api.post('/notifications/mark-all-read')
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }, [queryClient])

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }, [queryClient])

  const showAchievement = (achievement: Achievement) => {
    setCurrentAchievement({ ...achievement, isVisible: true })
  }

  const showPointsEarned = (points: number, reason: string) => {
    toast({
      title: `+${points} Points!`,
      description: reason,
      duration: 3000,
      className: 'bg-yellow-50 border-yellow-200 text-yellow-900'
    })
  }

  const handleAchievementClose = () => {
    if (currentAchievement) {
      setCurrentAchievement({ ...currentAchievement, isVisible: false })
      setTimeout(() => setCurrentAchievement(null), 300)
    }
  }

  // Effect to show achievement toasts
  useEffect(() => {
    const achievementNotifications = Array.isArray(notifications) ? notifications.filter(n => n.type === 'achievement_unlocked' && !n.isRead) : []
    achievementNotifications.forEach(n => {
      if (n.metadata?.achievement) {
        showAchievement(n.metadata.achievement)
        markAsRead(n.id) // Mark as read after showing toast
      }
    })
  }, [notifications, markAsRead])

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      isLoading, 
      stats, 
      sendNotification, 
      markAsRead, 
      markAllAsRead, 
      deleteNotification, 
      showAchievement, 
      showPointsEarned 
    }}>
      {children}
      {currentAchievement && (
        <AchievementToast
          title={currentAchievement.title}
          description={currentAchievement.description}
          points={currentAchievement.points}
          icon={currentAchievement.icon}
          isVisible={currentAchievement.isVisible}
          onClose={handleAchievementClose}
        />
      )}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
