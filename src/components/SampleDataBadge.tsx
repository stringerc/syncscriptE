import { motion } from 'motion/react';
import { Sparkles, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface SampleDataBadgeProps {
  variant?: 'default' | 'compact' | 'inline';
  showIcon?: boolean;
  className?: string;
}

/**
 * SAMPLE DATA BADGE
 * 
 * Research: Clear labeling prevents user confusion (Kahneman's "System 1" thinking)
 * - Users need to IMMEDIATELY understand this is demo data
 * - Visual distinction (color, icon) creates instant recognition
 * - Tooltip provides additional context without cluttering UI
 * 
 * This badge appears on all sample data elements to:
 * 1. Set expectations ("this isn't your real data yet")
 * 2. Create motivation ("I want MY data to look this good!")
 * 3. Prevent confusion ("why do I have data already?")
 */
export function SampleDataBadge({
  variant = 'default',
  showIcon = true,
  className = ''
}: SampleDataBadgeProps) {
  // Default variant: Full badge with description
  if (variant === 'default') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-400/30 rounded-lg ${className}`}
      >
        {showIcon && (
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </motion.div>
        )}
        <div>
          <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wide">
            Sample Data
          </div>
          <div className="text-xs text-indigo-400/70">
            Your real data starts when you log
          </div>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-indigo-400/50 hover:text-indigo-300 transition-colors">
                <Info className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">
                This is demo data showing what's possible with SyncScript.
                Once you log your first energy level, you'll start seeing your own patterns!
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>
    );
  }

  // Compact variant: Small badge
  if (variant === 'compact') {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className={`inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 border border-indigo-400/40 rounded text-xs font-medium text-indigo-300 ${className}`}
      >
        {showIcon && <Sparkles className="w-3 h-3" />}
        SAMPLE
      </motion.span>
    );
  }

  // Inline variant: Just text with icon
  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1 text-xs text-indigo-400/70 ${className}`}>
        {showIcon && <Sparkles className="w-3 h-3" />}
        Sample data
      </span>
    );
  }

  return null;
}

/**
 * SAMPLE DATA CARD WRAPPER
 * 
 * Wraps entire sections/cards that contain sample data
 * Provides visual distinction with border + badge
 */
interface SampleDataCardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function SampleDataCard({
  children,
  title,
  description = 'Your real data will appear here after logging',
  className = ''
}: SampleDataCardProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Animated border glow */}
      <motion.div
        className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-indigo-500/20 rounded-xl blur opacity-75"
        animate={{
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      
      {/* Card content */}
      <div className="relative bg-slate-900/90 rounded-xl border border-indigo-500/30 overflow-hidden">
        {/* Top badge bar */}
        <div className="bg-indigo-500/10 border-b border-indigo-400/20 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </motion.div>
              <div>
                {title && (
                  <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wide">
                    {title}
                  </div>
                )}
                <div className="text-xs text-indigo-400/70">
                  {description}
                </div>
              </div>
            </div>
            
            <SampleDataBadge variant="compact" showIcon={false} />
          </div>
        </div>
        
        {/* Actual content */}
        <div className="relative">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * TRANSITION BADGE
 * 
 * Shows when user has MIXED data (sample + real)
 * Celebrates their progress!
 */
interface TransitionBadgeProps {
  realDataCount: number;
  totalDataCount: number;
  className?: string;
}

export function TransitionBadge({
  realDataCount,
  totalDataCount,
  className = ''
}: TransitionBadgeProps) {
  const percentage = Math.round((realDataCount / totalDataCount) * 100);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500/10 to-indigo-500/10 border border-green-400/30 rounded-lg ${className}`}
    >
      <motion.div
        animate={{
          rotate: [0, 360],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        🎉
      </motion.div>
      <div>
        <div className="text-xs font-semibold text-green-300 uppercase tracking-wide">
          {percentage}% Your Data
        </div>
        <div className="text-xs text-slate-400">
          {realDataCount} of {totalDataCount} entries are yours!
        </div>
      </div>
    </motion.div>
  );
}
