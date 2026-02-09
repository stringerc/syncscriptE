/**
 * UserAvatarWithEnergy Component
 * 
 * Displays user avatar with energy progress ring around it.
 * This ring shows the user's current energy level as a visual indicator.
 * Used consistently throughout the app for any user display.
 * 
 * Features:
 * - Circular progress ring showing energy level
 * - Color changes based on ROYGBIV progression
 * - Animated transitions when energy increases
 * - Tooltip showing exact energy amount
 * - Works for current user and other users
 * - Consistent with Energy tab visualization
 */

import { useState, useEffect, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn } from './ui/utils';
import { COLOR_LEVELS, ColorLevel } from '../utils/energy-system';

interface UserAvatarWithEnergyProps {
  // User info
  userId?: string;
  userName: string;
  userImage?: string;
  
  // Energy data
  totalEnergy: number;
  maxEnergy?: number; // Max for the day (default 600 for Violet)
  
  // Display options
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTooltip?: boolean;
  ringWidth?: number;
  
  // Style
  className?: string;
}

const SIZES = {
  xs: { container: 'w-6 h-6', avatar: 'w-6 h-6', ring: 28, text: 'text-[8px]' },
  sm: { container: 'w-8 h-8', avatar: 'w-8 h-8', ring: 36, text: 'text-[10px]' },
  md: { container: 'w-10 h-10', avatar: 'w-10 h-10', ring: 44, text: 'text-xs' },
  lg: { container: 'w-12 h-12', avatar: 'w-12 h-12', ring: 52, text: 'text-sm' },
  xl: { container: 'w-16 h-16', avatar: 'w-16 h-16', ring: 68, text: 'text-base' },
};

export function UserAvatarWithEnergy({
  userId,
  userName,
  userImage,
  totalEnergy,
  maxEnergy = 600, // Violet level
  size = 'md',
  showTooltip = true,
  ringWidth = 3,
  className,
}: UserAvatarWithEnergyProps) {
  const [prevEnergy, setPrevEnergy] = useState(totalEnergy);
  const [isAnimating, setIsAnimating] = useState(false);

  // Detect energy changes for animation
  useEffect(() => {
    if (totalEnergy > prevEnergy) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
    setPrevEnergy(totalEnergy);
  }, [totalEnergy, prevEnergy]);

  // Calculate current color level based on energy
  const currentColorInfo = useMemo(() => {
    let currentLevel = COLOR_LEVELS[0];
    let nextLevel = COLOR_LEVELS[1];
    let colorIndex = 0;

    for (let i = COLOR_LEVELS.length - 1; i >= 0; i--) {
      if (totalEnergy >= COLOR_LEVELS[i].energyRequired) {
        currentLevel = COLOR_LEVELS[i];
        colorIndex = i;
        nextLevel = COLOR_LEVELS[Math.min(i + 1, COLOR_LEVELS.length - 1)];
        break;
      }
    }

    // Calculate progress to next color (0-100)
    let progressToNext = 0;
    if (colorIndex < COLOR_LEVELS.length - 1) {
      const energyInCurrentLevel = totalEnergy - currentLevel.energyRequired;
      const energyNeededForNext = nextLevel.energyRequired - currentLevel.energyRequired;
      progressToNext = (energyInCurrentLevel / energyNeededForNext) * 100;
    } else {
      // At max level (Violet) - show full progress
      progressToNext = 100;
    }

    return {
      level: currentLevel,
      nextLevel,
      colorIndex,
      progressToNext,
    };
  }, [totalEnergy]);

  // Calculate overall progress (0-100) for the ring
  const overallProgress = Math.min((totalEnergy / maxEnergy) * 100, 100);

  const sizeConfig = SIZES[size];
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const AvatarContent = (
    <div className={cn('relative inline-block', className)}>
      {/* SVG Ring */}
      <svg
        className="absolute inset-0 -rotate-90"
        width={sizeConfig.ring}
        height={sizeConfig.ring}
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%) rotate(-90deg)',
        }}
      >
        {/* Background circle */}
        <circle
          cx={sizeConfig.ring / 2}
          cy={sizeConfig.ring / 2}
          r={(sizeConfig.ring - ringWidth * 2) / 2}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={ringWidth}
        />
        
        {/* Progress circle */}
        <circle
          cx={sizeConfig.ring / 2}
          cy={sizeConfig.ring / 2}
          r={(sizeConfig.ring - ringWidth * 2) / 2}
          fill="none"
          stroke={currentColorInfo.level.color}
          strokeWidth={ringWidth}
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * ((sizeConfig.ring - ringWidth * 2) / 2)}`}
          strokeDashoffset={`${
            2 * Math.PI * ((sizeConfig.ring - ringWidth * 2) / 2) * (1 - overallProgress / 100)
          }`}
          className={cn(
            'transition-all duration-500 ease-out',
            isAnimating && 'animate-pulse'
          )}
          style={{
            filter: `drop-shadow(0 0 4px ${currentColorInfo.level.glow})`,
          }}
        />
      </svg>

      {/* Avatar */}
      <Avatar className={cn(sizeConfig.avatar, 'relative z-10')}>
        {userImage && <AvatarImage src={userImage} alt={userName} />}
        <AvatarFallback
          className="bg-gradient-to-br from-blue-600 to-purple-600 text-white"
          style={{
            fontSize: size === 'xs' ? '8px' : size === 'sm' ? '10px' : '12px',
          }}
        >
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Glow effect when animating */}
      {isAnimating && (
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-75"
          style={{
            background: `radial-gradient(circle, ${currentColorInfo.level.color}40 0%, transparent 70%)`,
          }}
        />
      )}
    </div>
  );

  if (!showTooltip) {
    return AvatarContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{AvatarContent}</TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="bg-[#1e2128] border-gray-800 text-white"
        >
          <div className="text-center">
            <div className="font-semibold mb-1">{userName}</div>
            <div className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: currentColorInfo.level.color }}
              />
              <span style={{ color: currentColorInfo.level.color }}>
                {currentColorInfo.level.name}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {totalEnergy} / {maxEnergy} Energy
            </div>
            {currentColorInfo.colorIndex < COLOR_LEVELS.length - 1 && (
              <div className="text-xs text-gray-500 mt-1">
                {Math.ceil(currentColorInfo.nextLevel.energyRequired - totalEnergy)} to{' '}
                {currentColorInfo.nextLevel.name}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Hook version for getting current user's energy avatar
 * Use this in components that need to show current user's avatar with energy
 */
export function useCurrentUserEnergyAvatar() {
  // This would integrate with your auth/user context
  // For now, returning a helper function
  return {
    getCurrentUserName: () => 'You', // Replace with actual user name from context
    getCurrentUserImage: () => undefined, // Replace with actual user image from context
    getCurrentUserId: () => 'current-user', // Replace with actual user ID from context
  };
}

/**
 * Compact version without tooltip - for smaller displays
 */
export function UserAvatarWithEnergyCompact(props: UserAvatarWithEnergyProps) {
  return <UserAvatarWithEnergy {...props} showTooltip={false} size="sm" />;
}
