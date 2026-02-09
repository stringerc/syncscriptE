/**
 * DecayWarningIndicator Component
 * 
 * PRIORITY 2: Decay Warnings in UI
 * 
 * Visual indicator showing decay status beyond just toast notifications.
 * Shows time since last activity, decay risk, and motivational messaging.
 */

import { AlertTriangle, Clock, Zap, CheckCircle2, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { cn } from '../ui/utils';
import { useEnergyDecay, getDecayStatusMessage } from '../../hooks/useEnergyDecay';

interface DecayWarningIndicatorProps {
  className?: string;
  compact?: boolean;
}

export function DecayWarningIndicator({ className, compact = false }: DecayWarningIndicatorProps) {
  const { hoursSinceActivity, isSleepTime } = useEnergyDecay();
  const status = getDecayStatusMessage(hoursSinceActivity);

  // Don't show during sleep time
  if (isSleepTime) {
    return (
      <div className={cn('bg-indigo-600/10 border border-indigo-600/20 rounded-lg p-3', className)}>
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-indigo-400" />
          <span className="text-sm text-indigo-300">Sleep mode - decay paused</span>
        </div>
      </div>
    );
  }

  // Compact version for smaller spaces
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {status.status === 'active' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
        {status.status === 'warning' && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
          </motion.div>
        )}
        {status.status === 'decaying' && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </motion.div>
        )}
        <span className={cn('text-sm font-medium', status.color)}>
          {status.message}
        </span>
      </div>
    );
  }

  // Calculate progress until decay starts (4 hours)
  const progressUntilDecay = Math.min((hoursSinceActivity / 4) * 100, 100);

  // Get background gradient based on status
  const getBackgroundGradient = () => {
    switch (status.status) {
      case 'active':
        return 'from-emerald-600/10 to-green-600/10 border-emerald-600/20';
      case 'warning':
        return 'from-yellow-600/10 to-orange-600/10 border-yellow-600/20';
      case 'decaying':
        return 'from-red-600/10 to-orange-600/10 border-red-600/20';
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status.status}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className={cn(
          'bg-gradient-to-br',
          getBackgroundGradient(),
          'border rounded-xl p-4',
          'relative overflow-hidden',
          className
        )}
      >
        {/* Pulse effect for warning/decaying */}
        {status.status !== 'active' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: 'linear',
            }}
          />
        )}

        <div className="relative z-10 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                status.status === 'active' && 'bg-emerald-500/20',
                status.status === 'warning' && 'bg-yellow-500/20',
                status.status === 'decaying' && 'bg-red-500/20'
              )}>
                {status.status === 'active' && <Zap className="w-5 h-5 text-emerald-400" />}
                {status.status === 'warning' && <Clock className="w-5 h-5 text-yellow-400" />}
                {status.status === 'decaying' && <AlertTriangle className="w-5 h-5 text-red-400" />}
              </div>
              <div>
                <h4 className="text-white font-semibold">Activity Monitor</h4>
                <p className="text-sm text-gray-400">
                  {hoursSinceActivity < 1 
                    ? `${Math.round(hoursSinceActivity * 60)} minutes ago`
                    : `${hoursSinceActivity.toFixed(1)} hours ago`
                  }
                </p>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={cn(
                status.status === 'active' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                status.status === 'warning' && 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
                status.status === 'decaying' && 'bg-red-500/10 text-red-400 border-red-500/20'
              )}
            >
              {status.status === 'active' && '✓ Active'}
              {status.status === 'warning' && '⚠ Warning'}
              {status.status === 'decaying' && '⚠ Decaying'}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Time until decay</span>
              <span className={cn('font-medium', status.color)}>
                {status.status === 'active' && `${(4 - hoursSinceActivity).toFixed(1)}h remaining`}
                {status.status === 'warning' && 'Soon!'}
                {status.status === 'decaying' && 'Active now'}
              </span>
            </div>
            <Progress 
              value={status.status === 'decaying' ? 100 : progressUntilDecay}
              className="h-2"
              style={{
                background: 'rgba(75, 85, 99, 0.3)',
              }}
            />
          </div>

          {/* Status Message */}
          <div className={cn(
            'text-sm font-medium p-2 rounded-lg',
            status.status === 'active' && 'bg-emerald-500/10 text-emerald-300',
            status.status === 'warning' && 'bg-yellow-500/10 text-yellow-300',
            status.status === 'decaying' && 'bg-red-500/10 text-red-300'
          )}>
            {status.message}
          </div>

          {/* Action Hint */}
          {status.status !== 'active' && (
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Complete a task to reset the timer and stop decay
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
