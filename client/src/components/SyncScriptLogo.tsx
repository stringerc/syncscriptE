import React from 'react'

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
    <img
      src="/syncscript-logo.png"
      alt="SyncScript Logo"
      className={`${sizeClasses[size]} ${className} object-contain`}
    />
  )
}

export default SyncScriptLogo
