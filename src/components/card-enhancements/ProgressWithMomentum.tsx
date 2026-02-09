/**
 * ══════════════════════════════════════════════════════════════════════════
 * PROGRESS WITH MOMENTUM - Linear Insights 2024
 * ══════════════════════════════════════════════════════════════════════════
 * 
 * RESEARCH: Linear Insights (2024) - Predictive progress visualization
 * Traditional: "60% complete"
 * Forward-thinking: "60% complete, trending 2 days early ⚡"
 * 
 * FEATURES:
 * - Momentum arrow (↗️ ahead, → on track, ↘️ behind)
 * - Predicted completion date
 * - Visual velocity indicator
 * - Micro-animations for state changes
 */

import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ProgressMomentum } from '../../utils/card-intelligence';

interface ProgressWithMomentumProps {
  momentum: ProgressMomentum;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressWithMomentum({
  momentum,
  showDetails = true,
  size = 'md',
}: ProgressWithMomentumProps) {
  const { percentage, velocity, daysDeviation, predictedCompletion, trendIcon } = momentum;
  
  // Size configurations
  const sizeConfig = {
    sm: { height: 'h-1', text: 'text-[10px]', icon: 'w-3 h-3' },
    md: { height: 'h-2', text: 'text-xs', icon: 'w-3.5 h-3.5' },
    lg: { height: 'h-2.5', text: 'text-sm', icon: 'w-4 h-4' },
  };
  
  const config = sizeConfig[size];
  
  // Color scheme based on velocity
  const velocityColors = {
    ahead: {
      bg: 'bg-emerald-500',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      gradient: 'from-emerald-500 to-teal-400',
    },
    'on-track': {
      bg: 'bg-teal-500',
      text: 'text-teal-400',
      border: 'border-teal-500/30',
      gradient: 'from-teal-500 to-cyan-400',
    },
    behind: {
      bg: 'bg-amber-500',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      gradient: 'from-amber-500 to-orange-400',
    },
  };
  
  const colors = velocityColors[velocity];
  
  // Icon component based on velocity
  const VelocityIcon = 
    velocity === 'ahead' ? TrendingUp :
    velocity === 'behind' ? TrendingDown :
    Minus;
  
  return (
    <div className=\"space-y-1.5\">
      {/* Progress bar with momentum gradient */}
      <div className=\"relative w-full\">
        <div className={`${config.height} bg-gray-700/50 rounded-full overflow-hidden`}>
          <motion.div
            className={`${config.height} bg-gradient-to-r ${colors.gradient} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ 
              type: 'spring',
              stiffness: 300,
              damping: 30,
              duration: 0.6
            }}
          />
        </div>
        
        {/* Momentum pulse effect */}
        {velocity !== 'on-track' && (
          <motion.div
            className={`absolute top-0 ${config.height} bg-gradient-to-r ${colors.gradient} rounded-full blur-sm opacity-50`}
            initial={{ width: 0 }}
            animate={{ 
              width: `${percentage}%`,
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              width: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
            }}
          />
        )}
      </div>
      
      {/* Details */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className=\"flex items-center justify-between\"
        >
          {/* Progress percentage with momentum */}
          <div className=\"flex items-center gap-1.5\">
            <span className={`${config.text} font-medium ${colors.text}`}>
              {Math.round(percentage)}%
            </span>
            <VelocityIcon className={`${config.icon} ${colors.text}`} />
          </div>
          
          {/* Velocity indicator */}
          <motion.div
            className={`${config.text} ${colors.text} font-medium flex items-center gap-1`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
          >
            {velocity === 'ahead' && daysDeviation > 0 && (
              <>
                <span>{daysDeviation}d early</span>
                <span className=\"text-lg leading-none\">⚡</span>
              </>
            )}
            {velocity === 'on-track' && (
              <span>on track</span>
            )}
            {velocity === 'behind' && daysDeviation < 0 && (
              <>
                <span>{Math.abs(daysDeviation)}d behind</span>
                <span className=\"text-lg leading-none\">⚠️</span>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
