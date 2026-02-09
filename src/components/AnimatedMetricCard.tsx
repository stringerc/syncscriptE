import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../components/ui/utils';
import { EnergyProgressBar } from './EnergyProgressBar';

interface AnimatedMetricCardProps {
  title: string;
  value: string | number;
  progress?: number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  description?: string;
  variant?: 'default' | 'energy' | 'compact';
  color?: 'teal' | 'blue' | 'purple' | 'orange' | 'green' | 'red';
  animated?: boolean;
  glowEffect?: boolean;
  className?: string;
}

export function AnimatedMetricCard({
  title,
  value,
  progress,
  icon: Icon,
  trend,
  trendValue,
  description,
  variant = 'default',
  color = 'teal',
  animated = true,
  glowEffect = true,
  className,
}: AnimatedMetricCardProps) {
  const colorClasses = {
    teal: {
      icon: 'text-teal-400',
      bg: 'bg-teal-500/10',
      border: 'border-teal-500/30',
      glow: 'shadow-[0_0_20px_rgba(20,184,166,0.3)]',
    },
    blue: {
      icon: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
    },
    purple: {
      icon: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]',
    },
    orange: {
      icon: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      glow: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]',
    },
    green: {
      icon: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      glow: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]',
    },
    red: {
      icon: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    },
  };

  if (variant === 'compact') {
    return (
      <motion.div
        variants={animated ? cardVariants : undefined}
        initial={animated ? 'hidden' : undefined}
        animate={animated ? 'visible' : undefined}
        whileHover={animated ? { scale: 1.02, transition: { duration: 0.2 } } : undefined}
        className={cn(
          'bg-[#1e2128] border border-gray-700 rounded-lg p-4',
          glowEffect && 'hover:' + colorClasses[color].glow,
          'transition-all duration-300',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            colorClasses[color].bg,
            colorClasses[color].border,
            'border'
          )}>
            <Icon className={cn('w-5 h-5', colorClasses[color].icon)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">{title}</p>
            <p className="text-lg font-semibold text-white">{value}</p>
          </div>
        </div>
        {progress !== undefined && (
          <div className="mt-3">
            <EnergyProgressBar 
              value={progress} 
              variant="minimal" 
              size="sm"
              animated={animated}
              glowEffect={glowEffect}
            />
          </div>
        )}
      </motion.div>
    );
  }

  if (variant === 'energy') {
    return (
      <motion.div
        variants={animated ? cardVariants : undefined}
        initial={animated ? 'hidden' : undefined}
        animate={animated ? 'visible' : undefined}
        whileHover={animated ? { scale: 1.02, transition: { duration: 0.2 } } : undefined}
        className={cn(
          'bg-[#1e2128] border border-gray-700 rounded-lg p-6',
          glowEffect && 'hover:' + colorClasses[color].glow,
          'transition-all duration-300',
          className
        )}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-white font-medium mb-1">{title}</h3>
            {description && <p className="text-xs text-gray-400">{description}</p>}
          </div>
          <div className={cn(
            'p-3 rounded-lg',
            colorClasses[color].bg,
            colorClasses[color].border,
            'border'
          )}>
            <Icon className={cn('w-6 h-6', colorClasses[color].icon)} />
          </div>
        </div>
        
        <div className="text-3xl font-bold text-white mb-4">{value}</div>
        
        {progress !== undefined && (
          <EnergyProgressBar 
            value={progress}
            label=""
            showIcon={false}
            showTrend={!!trend}
            trend={trend}
            trendValue={trendValue}
            size="md"
            animated={animated}
            glowEffect={glowEffect}
          />
        )}
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      variants={animated ? cardVariants : undefined}
      initial={animated ? 'hidden' : undefined}
      animate={animated ? 'visible' : undefined}
      whileHover={animated ? { scale: 1.02, transition: { duration: 0.2 } } : undefined}
      className={cn(
        'bg-[#1e2128] border border-gray-700 rounded-lg p-6',
        glowEffect && 'hover:' + colorClasses[color].glow,
        'transition-all duration-300',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          'p-3 rounded-lg',
          colorClasses[color].bg,
          colorClasses[color].border,
          'border'
        )}>
          <Icon className={cn('w-6 h-6', colorClasses[color].icon)} />
        </div>
        <div className="flex-1">
          <h3 className="text-gray-400 text-sm">{title}</h3>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
      
      {description && (
        <p className="text-sm text-gray-400 mb-3">{description}</p>
      )}
      
      {progress !== undefined && (
        <EnergyProgressBar 
          value={progress}
          label="Progress"
          showIcon={false}
          showTrend={!!trend}
          trend={trend}
          trendValue={trendValue}
          size="sm"
          animated={animated}
          glowEffect={glowEffect}
        />
      )}
    </motion.div>
  );
}
