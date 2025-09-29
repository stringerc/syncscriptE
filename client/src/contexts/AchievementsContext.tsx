import React, { createContext, useContext, useState, ReactNode } from 'react'

interface AchievementsContextType {
  showAchievements: boolean
  setShowAchievements: (show: boolean) => void
}

const AchievementsContext = createContext<AchievementsContextType | undefined>(undefined)

export const useAchievements = () => {
  const context = useContext(AchievementsContext)
  if (context === undefined) {
    throw new Error('useAchievements must be used within an AchievementsProvider')
  }
  return context
}

interface AchievementsProviderProps {
  children: ReactNode
}

export const AchievementsProvider: React.FC<AchievementsProviderProps> = ({ children }) => {
  const [showAchievements, setShowAchievements] = useState(true)

  return (
    <AchievementsContext.Provider value={{ showAchievements, setShowAchievements }}>
      {children}
    </AchievementsContext.Provider>
  )
}
