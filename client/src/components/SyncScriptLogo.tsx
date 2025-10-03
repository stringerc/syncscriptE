import React from 'react'
import { Brain } from 'lucide-react'

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
    <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center ${className}`}>
      <Brain className="text-white w-4 h-4" />
    </div>
  )
}

export default SyncScriptLogo
