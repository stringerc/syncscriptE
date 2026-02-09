import { motion } from 'motion/react';
import { Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../components/ui/utils';

interface EnergyProgressBarProps {
  value: number; // 0-100
  label?: string;
  showIcon?: boolean;
  showTrend?: boolean;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ring' | 'minimal';
  animated?: boolean;
  glowEffect?: boolean;
  className?: string;
}

export function EnergyProgressBar({
  value,
  label = 'Energy Level',
  showIcon = true,
  showTrend = false,
  trend = 'neutral',
  trendValue,
  size = 'md',
  variant = 'default',
  animated = true,
  glowEffect = true,
  className,
}: EnergyProgressBarProps) {
  // Determine color based on value
  const getColor = () => {
    if (value >= 75) return 'teal';
    if (value >= 50) return 'yellow';
    if (value >= 25) return 'orange';
    return 'red';
  };

  const color = getColor();

  const colorClasses = {
    teal: {
      bg: 'bg-teal-500',
      text: 'text-teal-400',
      glow: 'shadow-[0_0_20px_rgba(20,184,166,0.5)]',
      border: 'border-teal-500',
    },
    yellow: {
      bg: 'bg-yellow-500',
      text: 'text-yellow-400',
      glow: 'shadow-[0_0_20px_rgba(234,179,8,0.5)]',
      border: 'border-yellow-500',
    },
    orange: {
      bg: 'bg-orange-500',
      text: 'text-orange-400',
      glow: 'shadow-[0_0_20px_rgba(249,115,22,0.5)]',
      border: 'border-orange-500',
    },
    red: {
      bg: 'bg-red-500',
      text: 'text-red-400',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.5)]',
      border: 'border-red-500',
    },
  };

  const sizeClasses = {
    sm: { height: 'h-1.5', text: 'text-xs', icon: 'w-3 h-3' },
    md: { height: 'h-2', text: 'text-sm', icon: 'w-4 h-4' },
    lg: { height: 'h-3', text: 'text-base', icon: 'w-5 h-5' },
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  if (variant === 'ring') {
    // Ring variant (like AnimatedAvatar)
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
      <div className={cn('relative inline-flex items-center justify-center', className)}>
        <svg className="w-24 h-24 -rotate-90">
          {/* Background ring */}
          <circle
            cx="48"
            cy="48"
            r="45"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-gray-700"
          />
          {/* Progress ring */}
          <motion.circle
            cx="48"
            cy="48"
            r="45"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={animated ? strokeDashoffset : 0}
            strokeLinecap="round"
            className={cn(colorClasses[color].text, glowEffect && colorClasses[color].glow)}
            initial={animated ? { strokeDashoffset: circumference } : undefined}
            animate={animated ? { strokeDashoffset } : undefined}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showIcon && <Zap className={cn(sizeClasses.md.icon, colorClasses[color].text)} />}
          <span className={cn('font-bold', colorClasses[color].text)}>{value}%</span>
          {label && <span className="text-xs text-gray-400">{label}</span>}
        </div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={cn('space-y-1', className)}>
        <div className="flex items-center justify-between">
          <span className={cn(sizeClasses[size].text, 'text-gray-400')}>{label}</span>
          <span className={cn(sizeClasses[size].text, colorClasses[color].text, 'font-medium')}>
            {value}%
          </span>
        </div>
        <div className={cn('bg-gray-700 rounded-full overflow-hidden', sizeClasses[size].height)}>
          <motion.div
            className={cn(colorClasses[color].bg, glowEffect && colorClasses[color].glow, 'h-full')}
            initial={animated ? { width: 0 } : undefined}
            animate={animated ? { width: `${value}%` } : { width: `${value}%` }}
            transition={animated ? { duration: 1, ease: 'easeOut' } : undefined}
          />
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showIcon && <Zap className={cn(sizeClasses[size].icon, colorClasses[color].text)} />}
          <span className={cn(sizeClasses[size].text, 'text-gray-400')}>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {showTrend && trendValue && (
            <div className="flex items-center gap-1">
              <TrendIcon className={cn('w-3 h-3', 
                trend === 'up' ? 'text-green-400' : 
                trend === 'down' ? 'text-red-400' : 
                'text-gray-400'
              )} />
              <span className={cn('text-xs',
                trend === 'up' ? 'text-green-400' : 
                trend === 'down' ? 'text-red-400' : 
                'text-gray-400'
              )}>
                {trendValue}
              </span>
            </div>
          )}
          <span className={cn(sizeClasses[size].text, colorClasses[color].text, 'font-medium')}>
            {value}%
          </span>
        </div>
      </div>
      <div className={cn('bg-gray-700 rounded-full overflow-hidden', sizeClasses[size].height)}>
        <motion.div
          className={cn(colorClasses[color].bg, glowEffect && colorClasses[color].glow, 'h-full rounded-full')}
          initial={animated ? { width: 0 } : undefined}
          animate={animated ? { width: `${value}%` } : { width: `${value}%` }}
          transition={animated ? { duration: 1, ease: 'easeOut' } : undefined}
        />
      </div>
    </div>
  );
}
