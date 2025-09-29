import { createContext, useContext, useState, ReactNode } from 'react'
import { PointAnimation } from '@/components/PointAnimation'

interface PointAnimationContextType {
  showPointAnimation: (points: number) => void
}

const PointAnimationContext = createContext<PointAnimationContextType | undefined>(undefined)

interface PointAnimationProviderProps {
  children: ReactNode
}

export function PointAnimationProvider({ children }: PointAnimationProviderProps) {
  const [currentAnimation, setCurrentAnimation] = useState<{
    points: number
    isVisible: boolean
  }>({ points: 0, isVisible: false })

  const showPointAnimation = (points: number) => {
    setCurrentAnimation({ points, isVisible: true })
  }

  const handleAnimationComplete = () => {
    setCurrentAnimation({ points: 0, isVisible: false })
  }

  return (
    <PointAnimationContext.Provider value={{ showPointAnimation }}>
      {children}
      <PointAnimation
        points={currentAnimation.points}
        isVisible={currentAnimation.isVisible}
        onAnimationComplete={handleAnimationComplete}
      />
    </PointAnimationContext.Provider>
  )
}

export function usePointAnimation() {
  const context = useContext(PointAnimationContext)
  if (context === undefined) {
    throw new Error('usePointAnimation must be used within a PointAnimationProvider')
  }
  return context
}
