import React, { createContext, useContext, useState, ReactNode } from 'react'

interface AnimationContextType {
  animationEnabled: boolean
  setAnimationEnabled: (enabled: boolean) => void
  toggleAnimation: () => void
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined)

export function AnimationProvider({ children }: { children: ReactNode }) {
  const [animationEnabled, setAnimationEnabled] = useState(false) // Default off

  const toggleAnimation = () => {
    setAnimationEnabled(prev => !prev)
  }

  return (
    <AnimationContext.Provider value={{
      animationEnabled,
      setAnimationEnabled,
      toggleAnimation
    }}>
      {children}
    </AnimationContext.Provider>
  )
}

export function useAnimation() {
  const context = useContext(AnimationContext)
  if (context === undefined) {
    throw new Error('useAnimation must be used within an AnimationProvider')
  }
  return context
}
