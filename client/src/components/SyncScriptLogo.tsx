import React from 'react'
import { BrainLogo } from './BrainLogo'

interface SyncScriptLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const SyncScriptLogo: React.FC<SyncScriptLogoProps> = ({ 
  className = '', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <BrainLogo className={`${sizeClasses[size]} ${className}`} />
  )
}

export default SyncScriptLogo
