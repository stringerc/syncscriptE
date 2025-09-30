import { createContext, useContext, useState, ReactNode } from 'react'
import { AchievementToast } from '@/components/AchievementToast'
import { useToast } from '@/hooks/use-toast'

interface Achievement {
  title: string
  description: string
  points: number
  icon?: string
}

interface NotificationContextType {
  showAchievement: (achievement: Achievement) => void
  showPointsEarned: (points: number, reason: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { toast } = useToast()
  const [currentAchievement, setCurrentAchievement] = useState<(Achievement & { isVisible: boolean }) | null>(null)

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

  return (
    <NotificationContext.Provider value={{ showAchievement, showPointsEarned }}>
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
