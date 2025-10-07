import React from 'react';

interface SyncScriptLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const SyncScriptLogo: React.FC<SyncScriptLogoProps> = ({ 
  className = '', 
  size = 'md',
  showText = true 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const textSizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl', 
    xl: 'text-4xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* SyncScript Logo Image - Zoomed in to show just the logo icon */}
      <div className={`${sizeClasses[size]} relative overflow-hidden rounded-lg`}>
        <img
          src="/syncscript-logo.png"
          alt="SyncScript Logo"
          className="w-full h-full object-cover scale-150"
          style={{ objectPosition: 'center' }}
        />
      </div>
      
      {/* SyncScript Text - Extracted from logo design */}
      {showText && (
        <span 
          className={`font-bold ${textSizeClasses[size]}`}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em'
          }}
        >
          SyncScript
        </span>
      )}
    </div>
  );
};

export default SyncScriptLogo;
